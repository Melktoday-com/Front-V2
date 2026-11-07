"use client";

import { useAdminUsers } from "@/hooks/useAdmin";
import { useDebounce } from "@/hooks/useDebounce";
import { adminService } from "@/services/admin.service";
import { AdminUser, ModerationHistory } from "@/types/api/admin.types";
import { UserStatus } from "@/types/api/enums";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Clock,
    History,
    ShieldCheck,
    Ban,
    UserX,
    WalletIcon,
    Loader2,
    Search,
    X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function AdminUsersPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const debouncedSearch = useDebounce(searchQuery.trim(), 400);

    const [selectedUserForHistory, setSelectedUserForHistory] = useState<AdminUser | null>(null);
    const [historyList, setHistoryList] = useState<ModerationHistory[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    const handleViewHistory = async (targetUser: AdminUser) => {
        setSelectedUserForHistory(targetUser);
        setIsLoadingHistory(true);
        try {
            const hist = await adminService.getModerationHistory(targetUser.id);
            setHistoryList(hist || []);
        } catch {
            toast.error("خطا در دریافت تاریخچه مدیریت");
            setHistoryList([]);
        } finally {
            setIsLoadingHistory(false);
        }
    };

    useEffect(() => {
        setPage(1);
    }, [debouncedSearch]);

    const { data, isLoading } = useAdminUsers({
        page,
        limit: 10,
        search: debouncedSearch || undefined,
    });

    const banMutation = useMutation({
        mutationFn: ({ userId, reason }: { userId: string, reason: string }) =>
            adminService.banUser(userId, { reasonCode: "MANUAL_REVIEW", reasonDetail: reason }),
        onSuccess: () => {
            toast.success("کاربر مسدود شد");
            queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
        }
    });

    const unbanMutation = useMutation({
        mutationFn: ({ userId, note }: { userId: string, note?: string }) =>
            adminService.unbanUser(userId, { note }),
        onSuccess: () => {
            toast.success("محدودیت کاربر رفع شد");
            queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
        }
    });

    const suspendMutation = useMutation({
        mutationFn: ({ userId, reason, duration }: { userId: string, reason: string, duration: number }) =>
            adminService.suspendUser(userId, { reasonCode: "MANUAL_REVIEW", reasonDetail: reason, durationDays: duration }),
        onSuccess: () => {
            toast.success("کاربر تعلیق شد");
            queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
        }
    });

    const reinstateMutation = useMutation({
        mutationFn: ({ userId, note }: { userId: string, note?: string }) =>
            adminService.reinstateUser(userId, { note }),
        onSuccess: () => {
            toast.success("تعلیق کاربر لغو شد");
            queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
        }
    });

    const handleBan = (userId: string) => {
        const reason = prompt("علت مسدودسازی را وارد کنید:");
        if (reason) {
            banMutation.mutate({ userId, reason });
        }
    };

    const handleUnban = (userId: string) => {
        if (confirm("آیا از رفع مسدودیت این کاربر اطمینان دارید؟")) {
            unbanMutation.mutate({ userId });
        }
    };

    const handleSuspend = (userId: string) => {
        const reason = prompt("علت تعلیق را وارد کنید:");
        const days = prompt("مدت تعلیق (روز):", "7");
        if (reason && days) {
            suspendMutation.mutate({ userId, reason, duration: parseInt(days, 10) });
        }
    };

    const handleReinstate = (userId: string) => {
        if (confirm("آیا از لغو تعلیق این کاربر اطمینان دارید؟")) {
            reinstateMutation.mutate({ userId });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">مدیریت کاربران</h1>
                    <p className="text-foreground-muted">مشاهده، بررسی و مدیریت دسترسی‌های کاربران سیستم</p>
                </div>

                <div className="relative w-full md:w-80">
                    <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-foreground-muted pointer-events-none" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="جستجو بر اساس نام یا شماره..."
                        className="w-full pr-10 pl-9 py-2.5 bg-surface border border-border-subtle rounded-xl text-sm font-medium text-foreground focus:ring-2 focus:ring-primary/20 outline-none transition"
                    />
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => setSearchQuery("")}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground p-0.5"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-surface rounded-xl border border-border-subtle shadow-sm overflow-hidden">
                <table className="w-full text-right">
                    <thead className="bg-surface-secondary text-foreground-secondary text-sm">
                        <tr>
                            <th className="px-6 py-4 font-semibold">نام و نام خانوادگی</th>
                            <th className="px-6 py-4 font-semibold">شماره تماس</th>
                            <th className="px-6 py-4 font-semibold">نقش‌ها</th>
                            <th className="px-6 py-4 font-semibold">وضعیت</th>
                            <th className="px-6 py-4 font-semibold">تاریخ عضویت</th>
                            <th className="px-6 py-4 font-semibold text-center">عملیات</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {isLoading ? (
                            <tr><td colSpan={6} className="p-10 text-center">در حال بارگزاری...</td></tr>
                        ) : data?.items.map((user: AdminUser) => (
                            <tr key={user.id} className="hover:bg-surface-secondary transition-colors text-sm">
                                <td className="px-6 py-4 font-medium text-foreground">
                                    {user.firstName ? `${user.firstName} ${user.lastName}` : "بدون نام"}
                                </td>
                                <td className="px-6 py-4 text-foreground-secondary font-mono" dir="ltr">
                                    {user.mobileNumber}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex gap-1 flex-wrap">
                                        {user.roles.map((role: string) => (
                                            <span key={role} className="bg-info-subtle text-info text-[10px] px-2 py-0.5 rounded-full border border-info/30">
                                                {role}
                                            </span>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                        user.status === UserStatus.ACTIVE ? "bg-success-subtle text-success" :
                                        user.status === UserStatus.BLOCKED ? "bg-error-subtle text-error" :
                                        user.status === UserStatus.SUSPENDED ? "bg-warning-subtle text-warning" :
                                        "bg-surface-secondary text-foreground"
                                    }`}>
                                        {user.status === UserStatus.ACTIVE ? "فعال" :
                                         user.status === UserStatus.BLOCKED ? "مسدود" :
                                         user.status === UserStatus.SUSPENDED ? "معلق" : "غیرفعال"}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-foreground-muted">
                                    {new Date(user.createdAt).toLocaleDateString("fa-IR")}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex justify-center gap-2">
                                        <button
                                            onClick={() => router.push(`/admin/wallet?userId=${user.id}`)}
                                            title="شارژ یا کسر کیف پول"
                                            className="p-1.5 text-foreground-secondary hover:bg-surface-secondary rounded-md"
                                        >
                                            <WalletIcon size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleViewHistory(user)}
                                            title="تاریخچه مدیریت کاربر"
                                            className="p-1.5 text-foreground-secondary hover:bg-surface-secondary rounded-md"
                                        >
                                            <History size={16} />
                                        </button>
                                        
                                        {user.status === UserStatus.ACTIVE ? (
                                            <>
                                                <button
                                                    onClick={() => handleSuspend(user.id)}
                                                    title="تعلیق موقت"
                                                    className="p-1.5 text-warning hover:bg-warning-subtle rounded-md"
                                                >
                                                    <Clock size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleBan(user.id)}
                                                    title="مسدود کردن"
                                                    className="p-1.5 text-error hover:bg-error-subtle rounded-md"
                                                >
                                                    <UserX size={16} />
                                                </button>
                                            </>
                                        ) : user.status === UserStatus.SUSPENDED ? (
                                            <>
                                                <button
                                                    onClick={() => handleReinstate(user.id)}
                                                    title="لغو تعلیق"
                                                    className="p-1.5 text-success hover:bg-success-subtle rounded-md"
                                                >
                                                    <ShieldCheck size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleBan(user.id)}
                                                    title="مسدود کردن"
                                                    className="p-1.5 text-error hover:bg-error-subtle rounded-md"
                                                >
                                                    <UserX size={16} />
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                onClick={() => handleUnban(user.id)}
                                                title="رفع محدودیت"
                                                className="p-1.5 text-success hover:bg-success-subtle rounded-md"
                                            >
                                                <ShieldCheck size={16} />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Pagination (Simplified) */}
                <div className="p-4 bg-surface-secondary border-t border-border-subtle flex justify-between items-center text-sm">
                    <button
                        disabled={page === 1}
                        onClick={() => setPage(p => p - 1)}
                        className="px-3 py-1 bg-surface border border-border-subtle rounded-md disabled:opacity-50"
                    >
                        قبلی
                    </button>
                    <span className="text-foreground-secondary">صفحه {page}</span>
                    <button
                        disabled={!data || data.items.length < 10}
                        onClick={() => setPage(p => p + 1)}
                        className="px-3 py-1 bg-surface border border-border-subtle rounded-md disabled:opacity-50"
                    >
                        بعدی
                    </button>
                </div>
            </div>

            {/* Moderation History Modal */}
            {selectedUserForHistory && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
                    <div className="bg-surface border border-border-subtle rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
                            <div className="flex items-center gap-2">
                                <History className="w-5 h-5 text-primary" />
                                <h3 className="text-base font-bold text-brand">
                                    تاریخچه مدیریت کاربر: {selectedUserForHistory.mobileNumber}
                                </h3>
                            </div>
                            <button
                                onClick={() => setSelectedUserForHistory(null)}
                                className="p-1 hover:bg-surface-secondary rounded-lg transition-colors cursor-pointer"
                            >
                                <X className="w-5 h-5 text-secondary" />
                            </button>
                        </div>

                        {isLoadingHistory ? (
                            <div className="py-12 flex flex-col items-center justify-center gap-2 text-secondary">
                                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                <span className="text-xs">در حال بارگذاری سوابق...</span>
                            </div>
                        ) : historyList.length === 0 ? (
                            <div className="py-8 text-center text-sm text-secondary">
                                هیچ سابقه‌ای برای این کاربر ثبت نشده است.
                            </div>
                        ) : (
                            <div className="max-h-80 overflow-y-auto space-y-3 custom-scrollbar">
                                {historyList.map((item) => (
                                    <div
                                        key={item.id}
                                        className="p-3 bg-surface-secondary rounded-xl border border-border-subtle space-y-1 text-xs"
                                    >
                                        <div className="flex items-center justify-between font-bold text-brand">
                                            <span>عملیات: {item.actionType}</span>
                                            <span className="text-[11px] text-text-light font-normal">
                                                {new Date(item.createdAt).toLocaleDateString("fa-IR")}
                                            </span>
                                        </div>
                                        {item.reasonDetail && (
                                            <p className="text-secondary">
                                                <span className="font-semibold">دلیل:</span> {item.reasonDetail}
                                            </p>
                                        )}
                                        {item.note && (
                                            <p className="text-text-light text-[11px]">
                                                <span className="font-semibold">یادداشت:</span> {item.note}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="pt-2 flex justify-end">
                            <button
                                onClick={() => setSelectedUserForHistory(null)}
                                className="px-4 py-2 bg-surface-secondary text-brand text-xs font-bold rounded-xl hover:bg-soft-border/50 transition-colors cursor-pointer"
                            >
                                بستن
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
