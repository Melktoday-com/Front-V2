"use client";

import { useAuth } from "@/hooks/useAuth";
import { useAutoGrantWelcomePackage } from "@/hooks/useSubscription";
import { cn, formatCurrency, formatPrice, toPersianDigits } from "@/lib/utils";
import { ClaimWelcomePackageResponse } from "@/types/api/subscription.types";
import {
    ArrowUpCircle,
    ChevronLeft,
    FileText,
    Flame,
    Gift,
    Home,
    Sparkles,
    Wallet,
    X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

export function WelcomePackageModal() {
    const { user, isLoggedIn } = useAuth();
    const autoGrantMutation = useAutoGrantWelcomePackage();
    const router = useRouter();

    const [isOpen, setIsOpen] = useState(false);
    const [packageData, setPackageData] = useState<ClaimWelcomePackageResponse | null>(null);
    const hasTriggeredRef = useRef(false);

    const handleClose = useCallback(() => {
        setIsOpen(false);
    }, []);

    useEffect(() => {
        if (!isLoggedIn || !user?.userId || hasTriggeredRef.current) {
            return;
        }

        const sessionKey = `melktoday_welcome_seen_${user.userId}`;
        if (typeof window !== "undefined" && window.sessionStorage.getItem(sessionKey)) {
            return;
        }

        hasTriggeredRef.current = true;

        autoGrantMutation.mutate(
            { targetRole: user.activeRole ?? undefined },
            {
                onSuccess: (data) => {
                    if (typeof window !== "undefined") {
                        window.sessionStorage.setItem(sessionKey, "true");
                    }
                    if (data.claimed) {
                        setPackageData(data);
                        setIsOpen(true);
                    }
                },
                onError: () => {
                    // On transient error (e.g. network timeout), allow retry on next mount/navigation
                    hasTriggeredRef.current = false;
                },
            }
        );
    }, [isLoggedIn, user?.userId, user?.activeRole, autoGrantMutation]);

    // Handle escape key
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape" && isOpen) {
                handleClose();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, handleClose]);

    if (!isOpen || !packageData) return null;

    const isRegularUser = packageData.targetRole === "user";
    const bonusIrrBigInt = packageData.walletBonusIrr ? BigInt(packageData.walletBonusIrr) : BigInt(0);
    const bonusToman = bonusIrrBigInt > BigInt(0) ? Number(bonusIrrBigInt / BigInt(10)) : 0;

    const quotas = packageData.quotas;
    const hasQuotas =
        quotas &&
        (quotas.publicationQuota > 0 ||
            quotas.tempRentQuota > 0 ||
            quotas.urgentQuota > 0 ||
            quotas.ladderQuota > 0);

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="welcome-modal-title"
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
            {/* Backdrop with blur */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
                onClick={handleClose}
            />

            {/* Modal/Drawer Container */}
            <div
                className={cn(
                    "relative z-10 w-full sm:max-w-md bg-surface rounded-t-3xl sm:rounded-3xl p-6 sm:p-7 shadow-2xl transition-all max-h-[92vh] overflow-y-auto border border-border-subtle",
                    "animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 text-right"
                )}
            >
                {/* Mobile Drawer Pull Handle */}
                <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-4 sm:hidden" />

                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-border-subtle mb-5">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2.5 bg-emerald-500/10 text-emerald-600 rounded-2xl">
                            <Gift className="w-5 h-5" />
                        </div>
                        <div>
                            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                                <Sparkles className="w-3 h-3" /> هدیه خوش‌آمدگویی ملک‌تودی
                            </span>
                            <h3 id="welcome-modal-title" className="font-black text-brand text-base mt-1">
                                {packageData.packageTitle}
                            </h3>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="w-8 h-8 rounded-full bg-surface-secondary flex items-center justify-center text-text-light hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        aria-label="بستن"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Subtitle / Description */}
                <p className="text-sm text-text-light leading-relaxed mb-5">
                    عضویت شما در ملک‌تودی را تبریک می‌گوییم! بسته هدیه ویژه شما به صورت خودکار فعال گردید و اکنون در حساب شما آماده استفاده است.
                </p>

                {/* Wallet Bonus Card (if granted) */}
                {bonusToman > 0 && (
                    <div className="p-4 bg-gradient-to-l from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 rounded-2xl flex items-center gap-3.5 mb-5">
                        <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/20">
                            <Wallet className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                                شارژ هدیه کیف پول
                            </span>
                            <p className="text-lg font-black text-brand tracking-tight mt-0.5">
                                {formatPrice(bonusToman)}
                            </p>
                            {packageData.walletBonusIrr && (
                                <span className="text-[11px] text-text-light block">
                                    معادل {formatCurrency(packageData.walletBonusIrr)} ریال
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* Quotas Grid (if granted for Host/Agent) */}
                {hasQuotas && quotas && (
                    <div className="grid grid-cols-2 gap-3 mb-5">
                        {quotas.publicationQuota > 0 && (
                            <div className="p-3 bg-surface-secondary/70 border border-border-subtle rounded-2xl flex items-center gap-2.5">
                                <div className="p-2 bg-primary/10 text-primary rounded-xl">
                                    <FileText className="w-4 h-4" />
                                </div>
                                <div>
                                    <span className="text-[10px] text-text-light block">سهمیه انتشار</span>
                                    <span className="text-sm font-black text-brand">
                                        {toPersianDigits(quotas.publicationQuota)} آگهی
                                    </span>
                                </div>
                            </div>
                        )}

                        {quotas.tempRentQuota > 0 && (
                            <div className="p-3 bg-surface-secondary/70 border border-border-subtle rounded-2xl flex items-center gap-2.5">
                                <div className="p-2 bg-blue-500/10 text-blue-600 rounded-xl">
                                    <Home className="w-4 h-4" />
                                </div>
                                <div>
                                    <span className="text-[10px] text-text-light block">اجاره روزانه</span>
                                    <span className="text-sm font-black text-brand">
                                        {toPersianDigits(quotas.tempRentQuota)} اقامتگاه
                                    </span>
                                </div>
                            </div>
                        )}

                        {quotas.urgentQuota > 0 && (
                            <div className="p-3 bg-surface-secondary/70 border border-border-subtle rounded-2xl flex items-center gap-2.5">
                                <div className="p-2 bg-amber-500/10 text-amber-600 rounded-xl">
                                    <Flame className="w-4 h-4" />
                                </div>
                                <div>
                                    <span className="text-[10px] text-text-light block">نشان فوری</span>
                                    <span className="text-sm font-black text-brand">
                                        {toPersianDigits(quotas.urgentQuota)} مورد
                                    </span>
                                </div>
                            </div>
                        )}

                        {quotas.ladderQuota > 0 && (
                            <div className="p-3 bg-surface-secondary/70 border border-border-subtle rounded-2xl flex items-center gap-2.5">
                                <div className="p-2 bg-purple-500/10 text-purple-600 rounded-xl">
                                    <ArrowUpCircle className="w-4 h-4" />
                                </div>
                                <div>
                                    <span className="text-[10px] text-text-light block">ارتقای نردبان</span>
                                    <span className="text-sm font-black text-brand">
                                        {toPersianDigits(quotas.ladderQuota)} بار
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Footer Buttons */}
                <div className="space-y-2.5 pt-2">
                    {isRegularUser ? (
                        <>
                            <button
                                type="button"
                                onClick={() => {
                                    handleClose();
                                    router.push("/wallet");
                                }}
                                className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-button font-bold text-sm shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                            >
                                <Wallet className="w-4 h-4" />
                                <span>مشاهده کیف پول و موجودی</span>
                                <ChevronLeft className="w-4 h-4 mr-auto" />
                            </button>
                            <button
                                type="button"
                                onClick={handleClose}
                                className="w-full py-3 px-4 bg-surface-secondary hover:bg-gray-200 dark:hover:bg-gray-800 text-brand font-medium text-xs rounded-button transition-colors cursor-pointer"
                            >
                                شروع کار با ملک‌تودی
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                type="button"
                                onClick={() => {
                                    handleClose();
                                    router.push("/subscriptions");
                                }}
                                className="w-full py-3.5 px-4 bg-primary hover:bg-primary/90 text-white rounded-button font-bold text-sm shadow-lg shadow-primary/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                            >
                                <Gift className="w-4 h-4" />
                                <span>مشاهده سهمیه‌ها و اشتراک</span>
                                <ChevronLeft className="w-4 h-4 mr-auto" />
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    handleClose();
                                    router.push("/ads/submit");
                                }}
                                className="w-full py-3 px-4 bg-surface-secondary hover:bg-gray-200 dark:hover:bg-gray-800 text-brand font-medium text-xs rounded-button transition-colors cursor-pointer"
                            >
                                ثبت اولین آگهی
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
