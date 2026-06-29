"use client";

import { RoleGuard } from "@/components/RoleGuard";
import { Button } from "@/components/ui/Button";
import { useAuth, useLogout } from "@/hooks/useAuth";
import { useMeProfile, useUser } from "@/hooks/useUser";
import { useWallet } from "@/hooks/useWallet";
import { cn, formatCurrency } from "@/lib/utils";
import { RoleName } from "@/types/access";
import {
    Building2,
    ChevronLeft,
    CreditCard,
    LayoutList,
    LogOut,
    MessageSquare,
    Plus,
    ShieldCheck,
    User
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ProfileScene() {
    const { user, activeRole } = useAuth();
    const { logout } = useLogout();
    const router = useRouter();

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");

    const { data: profile } = useMeProfile();
    const { updateProfile, isUpdating } = useUser(user?.userId);

    useEffect(() => {
        if (profile) {
            setFirstName(profile.firstName || "");
            setLastName(profile.lastName || "");
        }
    }, [profile]);

    const { balance, isLoadingBalance } = useWallet();

    const roleLabels: Record<string, string> = {
        user: "کاربر معمولی",
        admin: "ادمین",
        "super-admin": "مدیر کل",
        agent: "مشاور املاک",
        landlord: "میزبان",
    };

    return (
        <div className="min-h-screen bg-white pb-24 lg:pb-10">
            <div className="p-6 lg:p-10 space-y-10 max-w-2xl mx-auto">
                {/* <header className="flex justify-between items-center">
                    <h1 className="text-brand text-2xl lg:text-3xl font-black">
                        حساب کاربری
                    </h1>
                    <Button variant="ghost" onClick={logout} className="text-error flex items-center gap-2">
                        <LogOut className="w-5 h-5" />
                        <span className="font-bold">خروج</span>
                    </Button>
                </header> */}

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
                            <div className="flex items-center gap-2">
                                <span className={cn(
                                    "px-2 py-0.5 rounded-lg text-[10px] font-black uppercase",
                                    activeRole === 'user' ? "bg-secondary/10 text-secondary" : "bg-primary/10 text-primary"
                                )}>
                                    {roleLabels[activeRole || 'user']}
                                </span>
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
                    <RoleGuard roles={['AGENT']}>
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
                    </RoleGuard>

                    <RoleGuard roles={[RoleName.Admin, RoleName.SuperAdmin]}>
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

                    <Button
                        variant="outline"
                        className="w-full h-16 rounded-[25px] flex items-center justify-between px-6 border-soft-border hover:bg-soft-bg"
                        onClick={() => router.push('/profile/temporary-rent')}
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-soft-bg text-secondary">
                                <Plus className="w-6 h-6" />
                            </div>
                            <span className="font-bold text-brand">پنل اجاره موقت</span>
                        </div>
                        <ChevronLeft className="w-5 h-5 text-secondary" />
                    </Button>
                </section>

                {/* Account Actions */}
                <section className="space-y-3">
                    <div className="bg-brand rounded-[30px] p-6 text-white mb-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <div className="text-white/70 text-xs font-bold mb-1">
                                    موجودی کیف پول
                                </div>
                                <div className="text-2xl font-black">
                                    {isLoadingBalance ? "..." : formatCurrency(balance?.balance)}{" "}
                                    <span className="text-[10px] opacity-70">تومان</span>
                                </div>
                            </div>
                            <Button
                                className="bg-primary text-white border-0 rounded-xl px-4 py-2 h-auto"
                                onClick={() => router.push("/wallet")}
                            >
                                <Plus className="w-4 h-4 mr-1" />
                                <span className="text-xs font-black">شارژ</span>
                            </Button>
                        </div>
                    </div>

                    <button
                        onClick={() => router.push("/wallet")}
                        className="w-full flex items-center justify-between p-5 bg-soft-bg rounded-2xl border border-soft-border hover:bg-soft-border/50 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <CreditCard className="w-5 h-5 text-primary" />
                            <span className="text-brand font-bold text-sm">
                                تاریخچه تراکنش‌ها
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
                        <ChevronLeft className="w-4 h-4 text-secondary" />
                    </button>

                    <button className="w-full flex items-center justify-between p-5 bg-soft-bg rounded-2xl border border-soft-border hover:bg-soft-border/50 transition-colors">
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
        </div>
    );
}
