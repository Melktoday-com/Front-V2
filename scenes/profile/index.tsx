"use client";

import { Button } from "@/components/ui/Button";
import { useAuth, useLogout } from "@/hooks/useAuth";
import { useUser } from "@/hooks/useUser";
import { useWallet } from "@/hooks/useWallet";
import {
    ChevronLeft,
    CreditCard,
    LogOut,
    Plus,
    ShieldCheck,
    User
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ProfileScene() {
    const { user, isLoggedIn, isLoading: isAuthLoading } = useAuth();
    const { logout } = useLogout();
    const router = useRouter();

    // We use common state for now since we don't have GET /users/:id
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");

    const { updateProfile, isUpdating, verifyKyc, isVerifying } = useUser(
        user?.userId,
    );
    const { balance, isLoadingBalance } = useWallet();

    useEffect(() => {
        if (!isAuthLoading && !isLoggedIn) {
            router.push("/auth");
        }
    }, [isLoggedIn, isAuthLoading, router]);

    if (isAuthLoading || !isLoggedIn)
        return <div className="p-10 text-center text-brand font-bold animate-pulse">در حال بارگذاری...</div>;

    const formatCurrency = (amount = 0) => {
        return new Intl.NumberFormat("fa-IR").format(amount / 10); // Convert Rial to Toman
    };

    return (
        <div className="min-h-screen bg-white pb-24 lg:pb-10">
            <div className="p-6 lg:p-10 space-y-10 max-w-2xl mx-auto">
                <header className="flex justify-between items-center">
                    <h1 className="text-brand text-2xl lg:text-3xl font-black">
                        حساب کاربری
                    </h1>
                </header>

                {/* Profile Info */}
                <section className="bg-soft-bg rounded-[30px] p-6 space-y-6 border border-soft-border">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-white border border-soft-border flex items-center justify-center">
                            <User className="w-8 h-8 text-brand" />
                        </div>
                        <div>
                            <div className="text-brand font-black text-lg">
                                کاربر ملک تودی
                            </div>
                            <div className="text-secondary text-sm">کاربر عادی</div>
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

                    <button className="w-full flex items-center justify-between p-5 bg-soft-bg rounded-2xl border border-soft-border hover:bg-soft-border/50 transition-colors">
                        <div className="flex items-center gap-3">
                            <ShieldCheck className="w-5 h-5 text-primary" />
                            <span className="text-brand font-bold text-sm">
                                احراز هویت (KYC)
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] bg-red-50 text-red-500 px-2 py-1 rounded-full font-bold">
                                تایید نشده
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
