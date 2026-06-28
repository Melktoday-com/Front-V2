"use client";

import { useAdminUsers } from "@/hooks/useAdmin";
import { adminService } from "@/services/admin.service";
import { AdminUser } from "@/types/api/admin.types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
    History,
    ShieldCheck,
    UserX,
    WalletIcon
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function AdminUsersPage() {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const { data, isLoading } = useAdminUsers({ page, limit: 10 });

    const banMutation = useMutation({
        mutationFn: ({ userId, reason }: { userId: string, reason: string }) =>
            adminService.banUser(userId, { reasonCode: "ADMIN_MANUAL", reasonDetail: reason }),
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
            adminService.suspendUser(userId, { reasonCode: "ADMIN_MANUAL", reasonDetail: reason, durationDays: duration }),
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
            <div>
                <h1 className="text-2xl font-bold text-gray-800">مدیریت کاربران</h1>
                <p className="text-gray-500">مشاهده، بررسی و مدیریت دسترسی‌های کاربران سیستم</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full text-right">
                    <thead className="bg-gray-50 text-gray-600 text-sm">
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
                            <tr key={user.id} className="hover:bg-gray-50 transition-colors text-sm">
                                <td className="px-6 py-4 font-medium text-gray-800">
                                    {user.firstName ? `${user.firstName} ${user.lastName}` : "بدون نام"}
                                </td>
                                <td className="px-6 py-4 text-gray-600 font-mono" dir="ltr">
                                    {user.mobileNumber}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex gap-1 flex-wrap">
                                        {user.roles.map((role: string) => (
                                            <span key={role} className="bg-blue-50 text-blue-600 text-[10px] px-2 py-0.5 rounded-full border border-blue-100">
                                                {role}
                                            </span>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.status === "active" ? "bg-green-100 text-green-800" :
                                        user.status === "banned" ? "bg-red-100 text-red-800" :
                                            "bg-amber-100 text-amber-800"
                                        }`}>
                                        {user.status === "active" ? "فعال" : user.status === "banned" ? "مسدود" : "غیرفعال"}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-gray-500">
                                    {new Date(user.createdAt).toLocaleDateString("fa-IR")}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex justify-center gap-2">
                                        <button
                                            title="کیف پول"
                                            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-md"
                                        >
                                            <WalletIcon size={16} />
                                        </button>
                                        <button
                                            title="تاریخچه مدیریت"
                                            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-md"
                                        >
                                            <History size={16} />
                                        </button>
                                        
                                        {user.status === "active" ? (
                                            <>
                                                <button
                                                    onClick={() => handleSuspend(user.id)}
                                                    title="تعلیق موقت"
                                                    className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-md"
                                                >
                                                    <Clock size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleBan(user.id)}
                                                    title="مسدود کردن"
                                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-md"
                                                >
                                                    <UserX size={16} />
                                                </button>
                                            </>
                                        ) : user.status === "suspended" ? (
                                            <button
                                                onClick={() => handleReinstate(user.id)}
                                                title="لغو تعلیق"
                                                className="p-1.5 text-green-600 hover:bg-green-50 rounded-md"
                                            >
                                                <ShieldCheck size={16} />
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleUnban(user.id)}
                                                title="رفع مسدودیت"
                                                className="p-1.5 text-green-600 hover:bg-green-50 rounded-md"
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
                <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center text-sm">
                    <button
                        disabled={page === 1}
                        onClick={() => setPage(p => p - 1)}
                        className="px-3 py-1 bg-white border border-gray-200 rounded-md disabled:opacity-50"
                    >
                        قبلی
                    </button>
                    <span className="text-gray-600">صفحه {page}</span>
                    <button
                        disabled={!data || data.items.length < 10}
                        onClick={() => setPage(p => p + 1)}
                        className="px-3 py-1 bg-white border border-gray-200 rounded-md disabled:opacity-50"
                    >
                        بعدی
                    </button>
                </div>
            </div>
        </div>
    );
}
