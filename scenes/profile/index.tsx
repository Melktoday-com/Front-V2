"use client";

import { RoleGuard } from "@/components/RoleGuard";
import { AccountStatusBanner } from "@/components/ui/AccountStatusBanner";
import { Button } from "@/components/ui/Button";
import { useMyAgency } from "@/hooks/useAgencies";
import { useAuth, useLogout } from "@/hooks/useAuth";
import { useConversations } from "@/hooks/useChat";
import { useUnreadNotificationsCount } from "@/hooks/useNotifications";
import { useHostProfile } from "@/hooks/useShowcase";
import { useMeProfile, useUser } from "@/hooks/useUser";
import { useUserStatus } from "@/hooks/useUserStatus";
import { useWallet } from "@/hooks/useWallet";
import { cn, formatCurrency, toPersianDigits } from "@/lib/utils";
import { userService } from "@/services/user.service";
import { RoleName } from "@/types/access";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Bell,
    Building2,
    ChevronLeft,
    CreditCard,
    ExternalLink,
    FileText,
    Hotel,
    LayoutList,
    Loader2,
    LogOut,
    MessageSquare,
    ShieldCheck,
    Sparkles,
    User,
    X
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function ProfileScene() {
    const { user, activeRole, isLoggedIn, isLoading: isAuthLoading } = useAuth();
    const { logout } = useLogout();
    const router = useRouter();

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [isKycModalOpen, setIsKycModalOpen] = useState(false);
    const [nationalCode, setNationalCode] = useState("");
    const [birthDate, setBirthDate] = useState("");

    const queryClient = useQueryClient();

    const { data: profile } = useMeProfile();
    const { data: myAgency } = useMyAgency();
    const { data: hostProfile } = useHostProfile();
    const { updateProfile, isUpdating } = useUser(user?.userId);

    const kycMutation = useMutation({
        mutationFn: () =>
            userService.verifyKyc(user!.userId, {
                nationalCode,
                birthDate,
                firstName,
                lastName,
            }),
        onSuccess: (res) => {
            if (res.status === "verified") {
                toast.success("احراز هویت شما با موفقیت تایید شد.");
                queryClient.invalidateQueries({ queryKey: ["user"] });
                queryClient.invalidateQueries({ queryKey: ["me"] });
            } else {
                toast.error(res.reason || "اطلاعات با سامانه ثبت احوال همخوانی ندارد.");
            }
            setIsKycModalOpen(false);
        },
        onError: () => {
            toast.error("خطا در ارسال استعلام احراز هویت");
        },
    });

    const { isRestricted, isBanned, isSuspended, statusLabel } = useUserStatus();

    useEffect(() => {
        if (profile) {
            setFirstName(profile.firstName || "");
            setLastName(profile.lastName || "");
        }
    }, [profile]);

    const { balance, isLoadingBalance } = useWallet();
    const { data: conversations } = useConversations();
    const { data: unreadNotificationsCount = 0 } = useUnreadNotificationsCount();
    const unreadChatCount = conversations?.reduce((sum, c) => sum + (c.unreadCount || 0), 0) ?? 0;

    const roleLabels: Record<string, string> = {
        user: "کاربر معمولی",
        admin: "ادمین",
        "super-admin": "مدیر کل",
        agent: "مشاور املاک",
        landlord: "میزبان",
    };

    if (!isAuthLoading && !isLoggedIn) {
        return (
            <div className="max-w-md mx-auto px-4 py-20 text-center space-y-6">
                <div className="w-20 h-20 rounded-full bg-soft-bg mx-auto flex items-center justify-center text-secondary">
                    <User className="w-10 h-10 opacity-40" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-xl font-black text-brand">ورود به حساب کاربری</h2>
                    <p className="text-sm text-secondary font-medium">
                        برای مشاهده پروفایل و مدیریت حساب خود، ابتدا وارد شوید.
                    </p>
                </div>
                <Button
                    onClick={() => router.push("/auth?redirect=/profile")}
                    className="w-full h-12 rounded-2xl font-bold"
                >
                    ورود به حساب
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white pb-24 lg:pb-10">
            <div className="p-6 lg:p-10 space-y-6 max-w-2xl mx-auto">
                {/* Account Status Alert if Suspended or Banned */}
                <AccountStatusBanner showNotificationLink={true} />

                {/* Profile Info */}
                <section className="bg-soft-bg rounded-[30px] p-6 space-y-6 border border-soft-border">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-white border border-soft-border flex items-center justify-center">
                            <User className="w-8 h-8 text-brand" />
                        </div>
                        <div>
                            <div className="text-brand font-black text-lg">
                                {firstName || "کاربر"} {lastName || "ملک تودی"}
                            </div>
                            <div className="flex items-center gap-2 flex-wrap mt-1">
                                <span className={cn(
                                    "px-2 py-0.5 rounded-lg text-[10px] font-black uppercase",
                                    activeRole === 'user' ? "bg-secondary/10 text-secondary" : "bg-primary/10 text-primary"
                                )}>
                                    {roleLabels[activeRole || 'user']}
                                </span>

                                {isRestricted && (
                                    <span className={cn(
                                        "px-2 py-0.5 rounded-lg text-[10px] font-black",
                                        isBanned ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"
                                    )}>
                                        وضعیت: {statusLabel}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-4">
                        <div className="space-y-2">
                            <label className="text-brand text-sm font-bold pr-2">نام</label>
                            <input
                                type="text"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                className="w-full bg-white border border-soft-border rounded-2xl py-3 px-4 text-sm font-bold text-brand focus:ring-2 focus:ring-primary/20 outline-none"
                                placeholder="وارد کنید..."
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-brand text-sm font-bold pr-2">
                                نام خانوادگی
                            </label>
                            <input
                                type="text"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                className="w-full bg-white border border-soft-border rounded-2xl py-3 px-4 text-sm font-bold text-brand focus:ring-2 focus:ring-primary/20 outline-none"
                                placeholder="وارد کنید..."
                            />
                        </div>
                        <Button
                            className="w-full h-12 rounded-2xl"
                            disabled={isUpdating}
                            onClick={() => updateProfile({ firstName, lastName })}
                        >
                            {isUpdating ? "در حال ثبت..." : "بروزرسانی مشخصات"}
                        </Button>
                    </div>
                </section>

                {/* Dashboard Options based on Permissions */}
                <section className="grid gap-4">
                    <RoleGuard roles={[RoleName.Agent]}>
                        <div className="space-y-2">
                            <Button
                                variant="outline"
                                className="w-full h-16 rounded-[25px] flex items-center justify-between px-6 border-brand/10 hover:bg-brand/5"
                                onClick={() => router.push('/agency/panel')}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-2xl bg-brand/5 text-brand">
                                        <Building2 className="w-6 h-6" />
                                    </div>
                                    <span className="font-bold text-brand">مدیریت آژانس من</span>
                                </div>
                                <ChevronLeft className="w-5 h-5 text-secondary" />
                            </Button>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <Link
                                    href="/posts/create"
                                    className="flex items-center justify-between px-4 py-3 rounded-2xl bg-purple-50 hover:bg-purple-100 text-xs font-black text-purple-800 transition-colors border border-purple-200/80 group"
                                >
                                    <div className="flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-purple-600" />
                                        <span>استودیو انتشار پست و مقاله</span>
                                    </div>
                                    <span className="text-[11px] text-purple-500 font-bold">&larr;</span>
                                </Link>
                                {myAgency && (
                                    <Link
                                        href={`/agency/showcase/${myAgency.slug || myAgency.id}`}
                                        target="_blank"
                                        className="flex items-center justify-between px-4 py-3 rounded-2xl bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-colors border border-slate-200/80 group"
                                    >
                                        <div className="flex items-center gap-2">
                                            <ExternalLink className="w-4 h-4 text-blue-600" />
                                            <span>ویترین عمومی آژانس</span>
                                        </div>
                                        <span className="text-[11px] text-slate-400 font-medium group-hover:text-blue-600 transition-colors">&larr;</span>
                                    </Link>
                                )}
                            </div>
                        </div>
                    </RoleGuard>

                    <RoleGuard roles={[RoleName.Landlord]}>
                        <div className="space-y-2">
                            <Button
                                variant="outline"
                                className="w-full h-16 rounded-[25px] flex items-center justify-between px-6 border-soft-border hover:bg-soft-bg"
                                onClick={() => router.push('/profile/temporary-rent')}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-2xl bg-soft-bg text-secondary">
                                        <Hotel className="w-6 h-6" />
                                    </div>
                                    <span className="font-bold text-brand">پنل اقامتگاه‌ها (میزبان)</span>
                                </div>
                                <ChevronLeft className="w-5 h-5 text-secondary" />
                            </Button>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <Link
                                    href="/posts/create"
                                    className="flex items-center justify-between px-4 py-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-xs font-black text-emerald-800 transition-colors border border-emerald-200/80 group"
                                >
                                    <div className="flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-emerald-600" />
                                        <span>استودیو انتشار پست اقامتگاه</span>
                                    </div>
                                    <span className="text-[11px] text-emerald-600 font-bold">&larr;</span>
                                </Link>
                                {hostProfile && (
                                    <Link
                                        href={`/host/${hostProfile.slug || hostProfile.id || hostProfile.userId}`}
                                        target="_blank"
                                        className="flex items-center justify-between px-4 py-3 rounded-2xl bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-colors border border-slate-200/80 group"
                                    >
                                        <div className="flex items-center gap-2">
                                            <ExternalLink className="w-4 h-4 text-emerald-600" />
                                            <span>صفحه عمومی میزبان</span>
                                        </div>
                                        <span className="text-[11px] text-slate-400 font-medium group-hover:text-emerald-600 transition-colors">&larr;</span>
                                    </Link>
                                )}
                            </div>
                        </div>
                    </RoleGuard>

                    <RoleGuard roles={[RoleName.Admin, RoleName.SuperAdmin]}>
                        <div className="space-y-2">
                            <Button
                                variant="outline"
                                className="w-full h-16 rounded-[25px] flex items-center justify-between px-6 border-primary/20 hover:bg-primary/5"
                                onClick={() => router.push('/admin')}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                                        <ShieldCheck className="w-6 h-6" />
                                    </div>
                                    <span className="font-bold text-brand">پنل مدیریت</span>
                                </div>
                                <ChevronLeft className="w-5 h-5 text-secondary" />
                            </Button>
                        </div>
                    </RoleGuard>

                    <Button
                        variant="outline"
                        className="w-full h-16 rounded-[25px] flex items-center justify-between px-6 border-soft-border hover:bg-soft-bg"
                        onClick={() => router.push('/wallet')}
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-soft-bg text-secondary">
                                <CreditCard className="w-6 h-6" />
                            </div>
                            <span className="font-bold text-brand">کیف پول و تراکنش‌ها</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-secondary text-xs">{formatCurrency(balance?.balance)} تومان</span>
                            <ChevronLeft className="w-5 h-5 text-secondary" />
                        </div>
                    </Button>

                    <Button
                        variant="outline"
                        className="w-full h-16 rounded-[25px] flex items-center justify-between px-6 border-soft-border hover:bg-soft-bg"
                        onClick={() => router.push('/profile/ads')}
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-soft-bg text-secondary">
                                <LayoutList className="w-6 h-6" />
                            </div>
                            <span className="font-bold text-brand">آگهی‌های من</span>
                        </div>
                        <ChevronLeft className="w-5 h-5 text-secondary" />
                    </Button>
                </section>

                {/* Account Actions */}
                <section className="space-y-3">


                    <button
                        onClick={() => router.push("/profile/requests")}
                        className="w-full flex items-center justify-between p-5 bg-soft-bg rounded-2xl border border-soft-border hover:bg-soft-border/50 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-primary" />
                            <span className="text-brand font-bold text-sm">
                                درخواست‌های من (عضویت و میزبانی)
                            </span>
                        </div>
                        <ChevronLeft className="w-4 h-4 text-secondary" />
                    </button>


                    <button
                        onClick={() => router.push("/profile/chat")}
                        className="w-full flex items-center justify-between p-5 bg-soft-bg rounded-2xl border border-soft-border hover:bg-soft-border/50 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <MessageSquare className="w-5 h-5 text-primary" />
                            <span className="text-brand font-bold text-sm">
                                پیام‌های من
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            {unreadChatCount > 0 && (
                                <span className="px-2 py-0.5 rounded-full text-xs font-black bg-primary/10 text-primary">
                                    {toPersianDigits(unreadChatCount)}
                                </span>
                            )}
                            <ChevronLeft className="w-4 h-4 text-secondary" />
                        </div>
                    </button>

                    <button
                        onClick={() => router.push("/notifications")}
                        className="w-full flex items-center justify-between p-5 bg-soft-bg rounded-2xl border border-soft-border hover:bg-soft-border/50 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <Bell className="w-5 h-5 text-primary" />
                            <span className="text-brand font-bold text-sm">
                                اعلان‌های من
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            {unreadNotificationsCount > 0 && (
                                <span className="px-2 py-0.5 rounded-full text-xs font-black bg-red-500 text-white animate-pulse">
                                    {toPersianDigits(unreadNotificationsCount)}
                                </span>
                            )}
                            <ChevronLeft className="w-4 h-4 text-secondary" />
                        </div>
                    </button>

                    <button
                        onClick={() => {
                            if (profile?.kycStatus === "verified") {
                                toast.info("هویت شما قبلاً با موفقیت تایید شده است.");
                            } else {
                                setIsKycModalOpen(true);
                            }
                        }}
                        className="w-full flex items-center justify-between p-5 bg-soft-bg rounded-2xl border border-soft-border hover:bg-soft-border/50 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <ShieldCheck className="w-5 h-5 text-primary" />
                            <span className="text-brand font-bold text-sm">
                                احراز هویت (KYC)
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={cn(
                                "text-[10px] px-2 py-1 rounded-full font-bold",
                                profile?.kycStatus === 'verified' ? "bg-green-50 text-green-600" :
                                    profile?.kycStatus === 'pending' || profile?.kycStatus === 'in_progress' ? "bg-orange-50 text-orange-600" :
                                        "bg-red-50 text-red-500"
                            )}>
                                {profile?.kycStatus === 'verified' ? "تایید شده" :
                                    profile?.kycStatus === 'pending' || profile?.kycStatus === 'in_progress' ? "در انتظار تایید" : "تایید نشده"}
                            </span>
                            <ChevronLeft className="w-4 h-4 text-secondary" />
                        </div>
                    </button>

                    <button
                        onClick={logout}
                        className="w-full flex items-center justify-between p-5 bg-red-50 rounded-2xl border border-red-100 hover:bg-red-100 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <LogOut className="w-5 h-5 text-red-500" />
                            <span className="text-red-500 font-bold text-sm">
                                خروج از حساب
                            </span>
                        </div>
                    </button>
                </section>
            </div>

            {/* KYC Verification Modal */}
            {isKycModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
                    <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 border border-gray-100">
                        <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                            <h3 className="font-black text-brand text-base flex items-center gap-2">
                                <ShieldCheck className="w-5 h-5 text-primary" />
                                <span>احراز هویت هوشمند (سامانه شاهکار)</span>
                            </h3>
                            <button
                                onClick={() => setIsKycModalOpen(false)}
                                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-text-light hover:bg-gray-200"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <p className="text-xs text-text-light leading-relaxed">
                            جهت افزایش اعتبار حساب کاربری و امکان ثبت نامحدود آگهی، کد ملی و تاریخ تولد خود را وارد نمایید.
                        </p>

                        <div className="space-y-4 text-xs">
                            <div>
                                <label className="block font-bold text-brand mb-1.5">کد ملی ۱۰ رقمی</label>
                                <input
                                    type="text"
                                    maxLength={10}
                                    placeholder="مثلاً: ۰۰۱۲۳۴۵۶۷۸"
                                    dir="ltr"
                                    value={nationalCode}
                                    onChange={(e) => setNationalCode(e.target.value.replace(/\D/g, ""))}
                                    className="w-full p-3.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary outline-hidden text-center text-base tracking-widest font-black"
                                />
                            </div>

                            <div>
                                <label className="block font-bold text-brand mb-1.5">تاریخ تولد (فرمت: YYYYMMDD یا سال/ماه/روز)</label>
                                <input
                                    type="text"
                                    placeholder="مثلاً: 13700101"
                                    dir="ltr"
                                    value={birthDate}
                                    onChange={(e) => setBirthDate(e.target.value)}
                                    className="w-full p-3.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary outline-hidden text-center text-base tracking-wider font-bold"
                                />
                            </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setIsKycModalOpen(false)}
                                className="flex-1 py-3 rounded-xl border border-gray-200 font-bold text-xs text-text-light hover:bg-gray-50"
                            >
                                انصراف
                            </button>
                            <button
                                type="button"
                                onClick={() => kycMutation.mutate()}
                                disabled={kycMutation.isPending || nationalCode.length !== 10 || !birthDate}
                                className="flex-1 py-3 rounded-xl bg-primary text-white font-black text-xs hover:bg-primary/90 shadow-md shadow-primary/20 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
                            >
                                {kycMutation.isPending ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>استعلام شاهکار...</span>
                                    </>
                                ) : (
                                    <span>استعلام و تایید هویت</span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
