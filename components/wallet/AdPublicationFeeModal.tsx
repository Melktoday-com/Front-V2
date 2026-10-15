"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
    CreditCard,
    Wallet,
    ShieldCheck,
    Loader2,
    X,
    CheckCircle2,
    AlertCircle,
    ArrowUpRight,
} from "lucide-react";
import { useWalletBalance, useInitiateTopUp } from "@/hooks/useWallet";
import { useTariffs } from "@/hooks/useTariffs";
import { normalizeApiError } from "@/lib/api/error-handler";
import { cn, formatCurrency, rialToToman, toPersianDigits } from "@/lib/utils";
import { toast } from "sonner";

interface AdPublicationFeeModalProps {
    isOpen: boolean;
    onClose: () => void;
    adId?: string;
    onSuccess?: () => void;
}

const DEFAULT_QUICK_AMOUNTS = [50000, 100000, 250000, 500000];

export function AdPublicationFeeModal({
    isOpen,
    onClose,
    adId,
}: AdPublicationFeeModalProps) {
    const router = useRouter();
    const { data: walletData, isLoading: isLoadingBalance } = useWalletBalance();
    const { data: tariffs = [], isLoading: isLoadingTariffs } = useTariffs();
    const initiateMutation = useInitiateTopUp();

    // 1. Resolve listing publication tariff
    const publicationTariff = useMemo(() => {
        return tariffs.find(
            (t) => t.contentType === "LISTING" && t.operationType === "PUBLICATION"
        );
    }, [tariffs]);

    // Tariff amounts in Tomans (1 Toman = 10 IRR)
    const feeTomans = useMemo(() => {
        if (!publicationTariff) return 10000; // Default platform baseline
        const amountIrr = Number(publicationTariff.amountIrr);
        return isNaN(amountIrr) || amountIrr <= 0 ? 10000 : rialToToman(amountIrr);
    }, [publicationTariff]);

    // Available wallet balance in Tomans
    const balanceTomans = useMemo(() => {
        const rawIrr = Number(walletData?.availableBalance ?? walletData?.balance ?? 0);
        return isNaN(rawIrr) ? 0 : Math.max(0, rialToToman(rawIrr));
    }, [walletData]);

    // Deficit needed to fulfill the publication fee
    const deficitTomans = useMemo(() => {
        return Math.max(0, feeTomans - balanceTomans);
    }, [feeTomans, balanceTomans]);

    // Recommended minimum charge (banking minimum is 10,000 Tomans)
    const defaultChargeAmount = useMemo(() => {
        return Math.max(10000, deficitTomans);
    }, [deficitTomans]);

    const [selectedAmount, setSelectedAmount] = useState<number>(defaultChargeAmount);
    const [customAmount, setCustomAmount] = useState<string>("");

    // Update selected amount if default changes and user hasn't typed custom
    React.useEffect(() => {
        if (!customAmount) {
            setSelectedAmount(defaultChargeAmount);
        }
    }, [defaultChargeAmount, customAmount]);

    const handleCharge = async () => {
        const finalAmountTomans = customAmount ? Number(customAmount) : selectedAmount;
        if (!finalAmountTomans || finalAmountTomans < 10000) {
            toast.error("حداقل مبلغ شارژ کیف پول ۱۰,۰۰۰ تومان می‌باشد.");
            return;
        }

        // Convert Toman to IRR for Shaparak gateway
        const amountIRR = finalAmountTomans * 10;
        const callbackUrl = typeof window !== "undefined"
            ? `${window.location.origin}/wallet/callback${adId ? `?adId=${encodeURIComponent(adId)}` : ""}`
            : "";

        initiateMutation.mutate(
            {
                amountIRR,
                callbackUrl,
                idempotencyKey: `topup_fee_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            },
            {
                onSuccess: (res) => {
                    if (res?.paymentUrl) {
                        toast.info("در حال انتقال به درگاه پرداخت بانکی شاپرک...");
                        window.location.href = res.paymentUrl;
                    } else {
                        toast.error("آدرس درگاه پرداخت از سرور دریافت نشد.");
                    }
                },
                onError: (err: Error) => {
                    const message = normalizeApiError(err, "خطا در اتصال به درگاه پرداخت");
                    toast.error(message);
                },
            }
        );
    };

    if (!isOpen) return null;

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-label="پرداخت تعرفه انتشار آگهی"
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Modal Container: Bottom sheet on mobile, centered dialog on desktop */}
            <div
                className={cn(
                    "relative z-10 w-full sm:max-w-md bg-surface rounded-t-3xl sm:rounded-3xl p-6 sm:p-7 shadow-2xl transition-all max-h-[92vh] overflow-y-auto border border-border-subtle",
                    "animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200"
                )}
            >
                {/* Mobile Drawer Pull Handle */}
                <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-4 sm:hidden" />

                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-border-subtle mb-5">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2.5 bg-primary/10 text-primary rounded-2xl">
                            <CreditCard className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-black text-brand text-base">پرداخت تعرفه انتشار آگهی</h3>
                            <p className="text-[11px] text-text-light mt-0.5">شارژ کیف پول و ارسال جهت تایید</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-surface-secondary flex items-center justify-center text-text-light hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        aria-label="بستن"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Status Notice */}
                <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-2.5 mb-5">
                    <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-700 dark:text-amber-400 font-medium leading-relaxed">
                        موجودی کیف پول شما برای پرداخت تعرفه ثبت این آگهی کافی نیست. لطفاً مبلغ مورد نیاز را شارژ فرمایید.
                    </div>
                </div>

                {/* Financial Summary Card */}
                <div className="bg-surface-secondary rounded-2xl p-4 border border-border-subtle space-y-3 mb-5">
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-text-light font-bold">تعرفه انتشار آگهی:</span>
                        <span className="font-black text-brand">
                            {isLoadingTariffs ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin inline-block text-primary" />
                            ) : (
                                `${formatCurrency(feeTomans)} تومان`
                            )}
                        </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                        <span className="text-text-light font-bold">موجودی در دسترس کیف پول:</span>
                        <span className="font-black text-brand">
                            {isLoadingBalance ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin inline-block text-primary" />
                            ) : (
                                `${formatCurrency(balanceTomans)} تومان`
                            )}
                        </span>
                    </div>

                    <div className="pt-2 border-t border-border-subtle flex items-center justify-between text-xs">
                        <span className="text-error font-black">حداقل کسری مورد نیاز:</span>
                        <span className="font-black text-error text-sm">
                            {formatCurrency(deficitTomans)} تومان
                        </span>
                    </div>
                </div>

                {/* Quick Presets */}
                <div className="space-y-2 mb-4">
                    <label className="block text-xs font-bold text-brand">انتخاب مبلغ شارژ (تومان)</label>
                    <div className="grid grid-cols-2 gap-2">
                        {/* Minimum needed button */}
                        {deficitTomans > 0 && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedAmount(defaultChargeAmount);
                                    setCustomAmount("");
                                }}
                                className={cn(
                                    "py-2.5 px-3 rounded-xl border text-xs font-black transition-all col-span-2 flex items-center justify-between",
                                    selectedAmount === defaultChargeAmount && !customAmount
                                        ? "bg-primary text-white border-primary shadow-xs"
                                        : "bg-surface-secondary border-border-subtle text-text-light hover:bg-gray-100 dark:hover:bg-gray-800"
                                )}
                            >
                                <span>دقیقاً به اندازه کسری ({formatCurrency(defaultChargeAmount)} تومان)</span>
                                <CheckCircle2 className={cn("w-3.5 h-3.5", selectedAmount === defaultChargeAmount && !customAmount ? "opacity-100" : "opacity-0")} />
                            </button>
                        )}

                        {DEFAULT_QUICK_AMOUNTS.map((val) => {
                            const isSelected = selectedAmount === val && !customAmount;
                            return (
                                <button
                                    type="button"
                                    key={val}
                                    onClick={() => {
                                        setSelectedAmount(val);
                                        setCustomAmount("");
                                    }}
                                    className={cn(
                                        "py-2.5 px-3 rounded-xl border text-xs font-black transition-all",
                                        isSelected
                                            ? "bg-primary text-white border-primary shadow-xs"
                                            : "bg-surface-secondary border-border-subtle text-text-light hover:bg-gray-100 dark:hover:bg-gray-800"
                                    )}
                                >
                                    {toPersianDigits(val.toLocaleString("fa-IR"))} تومان
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Custom Amount */}
                <div className="space-y-1.5 mb-5">
                    <label className="block text-xs font-bold text-brand">یا مبلغ دلخواه (تومان)</label>
                    <input
                        type="number"
                        placeholder={`حداقل ${toPersianDigits("10,000")} تومان`}
                        value={customAmount}
                        onChange={(e) => {
                            setCustomAmount(e.target.value);
                            setSelectedAmount(0);
                        }}
                        className="w-full p-3 border border-border-subtle rounded-xl bg-surface-secondary focus:bg-surface focus:ring-2 focus:ring-primary outline-hidden text-sm font-bold"
                    />
                </div>

                {/* Trust Badge */}
                <div className="p-3 bg-info-subtle/70 rounded-xl border border-info/20 flex items-center gap-2 text-[11px] text-foreground font-medium mb-5">
                    <ShieldCheck className="w-4 h-4 text-info shrink-0" />
                    <span>پرداخت امن و آنی از طریق شبکه شاپرک با کلیه کارت‌های عضو شتاب</span>
                </div>

                {/* Actions */}
                <div className="space-y-2.5">
                    <button
                        type="button"
                        onClick={handleCharge}
                        disabled={initiateMutation.isPending}
                        className="w-full py-3.5 bg-primary hover:bg-primary/90 text-white font-black text-sm rounded-2xl shadow-lg shadow-primary/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                    >
                        {initiateMutation.isPending ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>در حال اتصال به درگاه...</span>
                            </>
                        ) : (
                            <>
                                <span>شارژ کیف پول و پرداخت</span>
                                <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                            </>
                        )}
                    </button>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                onClose();
                                router.push("/wallet");
                            }}
                            className="flex-1 py-2.5 bg-surface-secondary hover:bg-gray-200 dark:hover:bg-gray-700 text-brand font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                            <Wallet className="w-3.5 h-3.5 text-primary" />
                            <span>صفحه کیف پول</span>
                        </button>

                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 border border-border-subtle hover:bg-surface-secondary text-text-light font-bold text-xs rounded-xl transition-colors cursor-pointer"
                        >
                            انصراف (ذخیره پیش‌نویس)
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
