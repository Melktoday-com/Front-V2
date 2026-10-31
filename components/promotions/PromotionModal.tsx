"use client";

import React, { useState, useMemo, useEffect } from "react";
import { usePromotionPricing, useRequestPromotion } from "@/hooks/usePromotions";
import { useEntitlements } from "@/hooks/useSubscription";
import { useWalletBalance, useInitiateTopUp } from "@/hooks/useWallet";
import { useTariffs } from "@/hooks/useTariffs";
import { PromotionType } from "@/types/api/promotion.types";
import { cn, formatCurrency, rialToToman, toOnlyDigits, toPersianDigits } from "@/lib/utils";
import { normalizeApiError } from "@/lib/api/error-handler";
import {
    Zap,
    TrendingUp,
    X,
    Sparkles,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Wallet,
    CreditCard,
    ArrowRight,
    ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface PromotionModalProps {
    isOpen: boolean;
    onClose: () => void;
    listingId: string;
    listingTitle: string;
    itemType?: "LISTING" | "TEMPORARY_RENTAL";
}

const PROMO_QUICK_AMOUNTS = [50000, 100000, 250000, 500000];

export function PromotionModal({
    isOpen,
    onClose,
    listingId,
    listingTitle,
    itemType = "LISTING",
}: PromotionModalProps) {
    const router = useRouter();
    const [mode, setMode] = useState<"SELECT" | "CHARGE">("SELECT");
    const [selectedType, setSelectedType] = useState<PromotionType>("URGENT_TAG");

    const { data: pricingData, isLoading: isPricingLoading } = usePromotionPricing();
    const { data: tariffs = [], isLoading: isTariffsLoading } = useTariffs();
    const { data: entitlements = [] } = useEntitlements();
    const { data: walletBalance, refetch: refetchWalletBalance } = useWalletBalance();
    const requestMutation = useRequestPromotion();
    const initiateMutation = useInitiateTopUp();

    // Refetch wallet balance and reset to selection mode whenever modal opens
    useEffect(() => {
        if (isOpen) {
            setMode("SELECT");
            refetchWalletBalance();
        }
    }, [isOpen, refetchWalletBalance]);

    // Check available entitlements (sum across multiple plans)
    const urgentQuota = useMemo(() => {
        if (!Array.isArray(entitlements)) return 0;
        return entitlements
            .filter((e) => (e.entitlementType || e.type) === "URGENT_PROMOTION")
            .reduce((sum, e) => sum + (e.remainingQuota ?? 0), 0);
    }, [entitlements]);

    const ladderQuota = useMemo(() => {
        if (!Array.isArray(entitlements)) return 0;
        return entitlements
            .filter((e) => (e.entitlementType || e.type) === "LADDER_PROMOTION")
            .reduce((sum, e) => sum + (e.remainingQuota ?? 0), 0);
    }, [entitlements]);

    // Dynamic 6-Tariff Resolution based on itemType and operation
    const urgentTariff = useMemo(() => {
        const targetKey = itemType === "TEMPORARY_RENTAL" ? "TEMPORARY_RENTAL_URGENT" : "LISTING_URGENT";
        return tariffs.find((t) => t.key === targetKey);
    }, [tariffs, itemType]);

    const ladderTariff = useMemo(() => {
        const targetKey = itemType === "TEMPORARY_RENTAL" ? "TEMPORARY_RENTAL_LADDER" : "LISTING_LADDER";
        return tariffs.find((t) => t.key === targetKey);
    }, [tariffs, itemType]);

    const urgentPriceRials = useMemo(() => {
        if (urgentTariff) return Number(urgentTariff.amountIrr);
        const rule = pricingData?.rules?.find((r) => r.promotionType === "URGENT_TAG");
        return rule ? Number(rule.pricePerDayRials) : 0;
    }, [urgentTariff, pricingData]);

    const ladderPriceRials = useMemo(() => {
        if (ladderTariff) return Number(ladderTariff.amountIrr);
        const rule = pricingData?.rules?.find((r) => r.promotionType === "LADDER");
        return rule ? Number(rule.pricePerDayRials) : 0;
    }, [ladderTariff, pricingData]);

    const urgentPriceTomans = rialToToman(urgentPriceRials);
    const ladderPriceTomans = rialToToman(ladderPriceRials);

    const activePriceRials = selectedType === "URGENT_TAG" ? urgentPriceRials : ladderPriceRials;
    const activePriceTomans = selectedType === "URGENT_TAG" ? urgentPriceTomans : ladderPriceTomans;

    const isQuotaAvailable = selectedType === "URGENT_TAG" ? urgentQuota > 0 : ladderQuota > 0;
    const isPricingLoadingCombined = isPricingLoading || isTariffsLoading;
    const isTariffConfigured = activePriceRials > 0;

    const currentBalanceRials = Number(walletBalance?.availableBalance ?? walletBalance?.balance ?? 0);
    const currentBalanceTomans = rialToToman(currentBalanceRials);
    const isBalanceSufficient = isQuotaAvailable || (isTariffConfigured && currentBalanceRials >= activePriceRials);

    // Deficit calculation
    const deficitTomans = Math.max(0, activePriceTomans - currentBalanceTomans);
    // Banking minimum charge in Shaparak is 10,000 Tomans
    const minTopUpTomans = Math.max(10000, deficitTomans);

    const [selectedChargeAmount, setSelectedChargeAmount] = useState<number>(minTopUpTomans);
    const [customChargeAmount, setCustomChargeAmount] = useState<string>("");

    useEffect(() => {
        if (!customChargeAmount) {
            setSelectedChargeAmount(minTopUpTomans);
        }
    }, [minTopUpTomans, customChargeAmount]);

    const effectiveChargeAmount = customChargeAmount ? Number(customChargeAmount) : selectedChargeAmount;

    const handleConfirm = async () => {
        try {
            await requestMutation.mutateAsync({
                listingId,
                promotionType: selectedType,
                durationDays: 1,
            });

            toast.success(
                selectedType === "URGENT_TAG"
                    ? "نشان فوری با موفقیت برای آگهی فعال شد"
                    : "آگهی با موفقیت نردبان شد"
            );
            onClose();
        } catch (err) {
            const msg = normalizeApiError(err instanceof Error ? err : undefined, "خطا در ثبت درخواست ارتقا");
            toast.error(msg);
        }
    };

    const handleCharge = async () => {
        if (!effectiveChargeAmount || effectiveChargeAmount < 10000) {
            toast.error("حداقل مبلغ شارژ ۱۰,۰۰۰ تومان می‌باشد.");
            return;
        }

        const currentPath = typeof window !== "undefined"
            ? window.location.pathname
            : (itemType === "TEMPORARY_RENTAL" ? `/temporary-rent/${listingId}` : `/ads/${listingId}`);
        const amountIRR = effectiveChargeAmount * 10;
        const idempotencyKey = `topup_promo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const callbackUrl = typeof window !== "undefined"
            ? `${window.location.origin}/wallet/callback?ref=${encodeURIComponent(idempotencyKey)}${currentPath ? `&returnUrl=${encodeURIComponent(currentPath)}` : ""}`
            : "";

        initiateMutation.mutate(
            {
                amountIRR,
                callbackUrl,
                idempotencyKey,
            },
            {
                onSuccess: (res) => {
                    if (res?.purchaseId) {
                        try {
                            sessionStorage.setItem("melktoday_pending_purchase_id", res.purchaseId);
                            localStorage.setItem("melktoday_pending_purchase_id", res.purchaseId);
                            sessionStorage.setItem("melktoday_pending_client_ref", idempotencyKey);
                            localStorage.setItem("melktoday_pending_client_ref", idempotencyKey);
                        } catch {
                            // storage quota or private browsing
                        }
                    }
                    if (res?.paymentUrl) {
                        toast.info("در حال انتقال به درگاه پرداخت بانکی شاپرک...");
                        window.location.href = res.paymentUrl;
                    } else {
                        toast.error("آدرس درگاه پرداخت از سرور دریافت نشد.");
                    }
                },
                onError: (err: Error) => {
                    const message = normalizeApiError(
                        err,
                        "خطا در برقراری ارتباط با درگاه پرداخت"
                    );
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
            className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4"
        >
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
                onClick={onClose}
            />

            {/* Modal / Drawer Container: Drawer on mobile, Dialog on desktop */}
            <div className="relative z-10 w-full md:max-w-md bg-surface rounded-t-3xl md:rounded-3xl p-6 shadow-2xl transition-all max-h-[90vh] overflow-y-auto">
                {/* Mobile Drawer Pull Handle */}
                <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-4 md:hidden" />

                {mode === "SELECT" ? (
                    <>
                        {/* Header */}
                        <div className="flex items-center justify-between pb-4 border-b border-border-subtle mb-5">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-amber-500/10 text-warning rounded-xl">
                                    <Sparkles className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-black text-brand text-base">
                                        {itemType === "TEMPORARY_RENTAL" ? "ارتقای اقامتگاه موقت" : "ارتقای آگهی"}
                                    </h3>
                                    <p className="text-text-light text-[11px] truncate max-w-[240px]">{listingTitle}</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                className="p-1.5 text-foreground-muted hover:text-foreground-secondary rounded-xl hover:bg-surface-secondary transition cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Options Selection */}
                        <div className="space-y-3 mb-6">
                            {/* فوری Option */}
                            <div
                                onClick={() => setSelectedType("URGENT_TAG")}
                                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3.5 ${
                                    selectedType === "URGENT_TAG"
                                        ? "border-rose-500 bg-error-subtle/30"
                                        : "border-border-subtle hover:border-border-subtle bg-surface"
                                }`}
                            >
                                <div className="p-2.5 bg-error-subtle text-error rounded-xl shrink-0 mt-0.5">
                                    <Zap className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-black text-brand text-sm">نشان فوری</h4>
                                        {urgentQuota > 0 ? (
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-xs line-through text-foreground-muted">
                                                    {formatCurrency(urgentPriceTomans)} تومان
                                                </span>
                                                <span className="text-xs text-success font-bold">رایگان</span>
                                                <span className="text-[10px] font-black bg-success-subtle text-success px-2 py-0.5 rounded-full">
                                                    سهمیه: {toPersianDigits(urgentQuota)} عدد
                                                </span>
                                            </div>
                                        ) : isPricingLoadingCombined ? (
                                            <span className="text-xs text-text-light flex items-center gap-1">
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                                در حال استعلام...
                                            </span>
                                        ) : urgentPriceTomans > 0 ? (
                                            <span className="text-xs font-bold text-brand">
                                                {formatCurrency(urgentPriceTomans)} تومان
                                            </span>
                                        ) : (
                                            <span className="text-xs font-bold text-error">
                                                تعرفه نامشخص
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-text-light text-xs mt-1 leading-relaxed">
                                        نمایش نشان قرمز «فوری» روی تصویر آگهی برای جلب توجه حداکثری مخاطبان
                                    </p>
                                </div>
                            </div>

                            {/* نردبان Option */}
                            <div
                                onClick={() => setSelectedType("LADDER")}
                                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3.5 ${
                                    selectedType === "LADDER"
                                        ? "border-amber-500 bg-warning-subtle/30"
                                        : "border-border-subtle hover:border-border-subtle bg-surface"
                                }`}
                            >
                                <div className="p-2.5 bg-warning-subtle text-warning rounded-xl shrink-0 mt-0.5">
                                    <TrendingUp className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-black text-brand text-sm">نردبان</h4>
                                        {ladderQuota > 0 ? (
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-xs line-through text-foreground-muted">
                                                    {formatCurrency(ladderPriceTomans)} تومان
                                                </span>
                                                <span className="text-xs text-success font-bold">رایگان</span>
                                                <span className="text-[10px] font-black bg-success-subtle text-success px-2 py-0.5 rounded-full">
                                                    سهمیه: {toPersianDigits(ladderQuota)} عدد
                                                </span>
                                            </div>
                                        ) : isPricingLoadingCombined ? (
                                            <span className="text-xs text-text-light flex items-center gap-1">
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                                در حال استعلام...
                                            </span>
                                        ) : ladderPriceTomans > 0 ? (
                                            <span className="text-xs font-bold text-brand">
                                                {formatCurrency(ladderPriceTomans)} تومان
                                            </span>
                                        ) : (
                                            <span className="text-xs font-bold text-error">
                                                تعرفه نامشخص
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-text-light text-xs mt-1 leading-relaxed">
                                        بازگرداندن آگهی به بالاترین جایگاه در لیست نتایج جستجو به عنوان آگهی تازه
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Price / Quota Summary Box */}
                        <div className="bg-soft-bg rounded-2xl p-4 mb-6 border border-soft-border/50">
                            <div className="flex items-center justify-between text-xs mb-2">
                                <span className="text-text-light font-medium">وضعیت پرداخت:</span>
                                {isQuotaAvailable ? (
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs line-through text-foreground-muted">
                                            {formatCurrency(activePriceTomans)} تومان
                                        </span>
                                        <span className="text-success font-black flex items-center gap-1">
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            رایگان (مصرف ۱ سهمیه اشتراک)
                                        </span>
                                    </div>
                                ) : isPricingLoadingCombined ? (
                                    <span className="text-xs text-text-light flex items-center gap-1">
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                        در حال استعلام تعرفه...
                                    </span>
                                ) : activePriceTomans > 0 ? (
                                    <div className="text-left">
                                        <span className="font-black text-brand text-sm">
                                            {formatCurrency(activePriceTomans)} تومان
                                        </span>
                                    </div>
                                ) : (
                                    <span className="text-xs font-bold text-error">
                                        تعرفه نامشخص
                                    </span>
                                )}
                            </div>

                            {!isQuotaAvailable && (
                                <div className="flex items-center justify-between text-[11px] pt-2 border-t border-border-subtle/50">
                                    <span className="text-text-light">موجودی کیف پول شما:</span>
                                    <span className="font-bold text-brand">
                                        {formatCurrency(currentBalanceTomans)} تومان
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Alerts */}
                        {!isQuotaAvailable && !isPricingLoadingCombined && !isTariffConfigured ? (
                            <div className="p-3.5 bg-error-subtle border border-error/30 rounded-2xl flex items-start gap-2.5 mb-5">
                                <AlertCircle className="w-4 h-4 text-error shrink-0 mt-0.5" />
                                <div className="text-xs text-rose-900 leading-relaxed">
                                    تعرفه این نوع ارتقا در حال حاضر فعال یا تنظیم نشده است.
                                </div>
                            </div>
                        ) : !isBalanceSufficient ? (
                            <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-2.5 mb-5">
                                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                <div className="text-xs text-amber-800 leading-relaxed">
                                    موجودی کیف پول شما برای این عملیات کافی نیست (کسری:{" "}
                                    <span className="font-black text-amber-900">
                                        {formatCurrency(deficitTomans)} تومان
                                    </span>
                                    ). لطفاً برای ادامه، موجودی کیف پول خود را شارژ فرمایید.
                                </div>
                            </div>
                        ) : null}

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2.5">
                            {!isQuotaAvailable && !isTariffConfigured ? (
                                <button
                                    type="button"
                                    disabled
                                    className="flex-1 py-3 bg-gray-200 text-foreground-muted font-bold text-xs rounded-2xl shadow-sm cursor-not-allowed"
                                >
                                    تعرفه غیرفعال است
                                </button>
                            ) : !isBalanceSufficient ? (
                                <button
                                    type="button"
                                    onClick={() => setMode("CHARGE")}
                                    className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-2xl transition shadow-sm cursor-pointer text-center flex items-center justify-center gap-2"
                                >
                                    <Wallet className="w-4 h-4" />
                                    <span>افزایش موجودی کیف پول</span>
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleConfirm}
                                    disabled={requestMutation.isPending || isPricingLoadingCombined}
                                    className="flex-1 py-3 bg-primary hover:bg-primary/90 text-white font-bold text-xs rounded-2xl transition shadow-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                                >
                                    {requestMutation.isPending ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>در حال فعال‌سازی...</span>
                                        </>
                                    ) : (
                                        <span>{isQuotaAvailable ? "فعال‌سازی با سهمیه" : "پرداخت و فعال‌سازی"}</span>
                                    )}
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={onClose}
                                className="py-3 px-5 border border-border-subtle hover:bg-surface-secondary text-text-light font-bold text-xs rounded-2xl transition cursor-pointer"
                            >
                                انصراف
                            </button>
                        </div>
                    </>
                ) : (
                    /* CHARGE / TOP-UP MODE */
                    <>
                        {/* Charge Header */}
                        <div className="flex items-center justify-between pb-4 border-b border-border-subtle mb-5">
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setMode("SELECT")}
                                    className="p-1.5 text-foreground-muted hover:text-foreground-secondary rounded-xl hover:bg-surface-secondary transition cursor-pointer"
                                    title="بازگشت به انتخاب ارتقا"
                                >
                                    <ArrowRight className="w-5 h-5" />
                                </button>
                                <div className="p-2 bg-amber-500/10 text-warning rounded-xl">
                                    <Wallet className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-black text-brand text-base">افزایش موجودی کیف پول</h3>
                                    <p className="text-text-light text-[11px] truncate max-w-[200px]">
                                        شارژ مستقیم جهت ارتقای آگهی
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                className="p-1.5 text-foreground-muted hover:text-foreground-secondary rounded-xl hover:bg-surface-secondary transition cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Financial Summary Card */}
                        <div className="bg-surface-secondary rounded-2xl p-4 border border-border-subtle space-y-2.5 mb-5 text-xs">
                            <div className="flex items-center justify-between">
                                <span className="text-text-light">نوع ارتقای انتخابی:</span>
                                <span className="font-bold text-brand">
                                    {selectedType === "URGENT_TAG" ? "نشان فوری" : "نردبان"}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-text-light">هزینه ارتقا:</span>
                                <span className="font-black text-brand">
                                    {formatCurrency(activePriceTomans)} تومان
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-text-light">موجودی فعلی کیف پول:</span>
                                <span className="font-bold text-brand">
                                    {formatCurrency(currentBalanceTomans)} تومان
                                </span>
                            </div>
                            <div className="pt-2 border-t border-border-subtle flex items-center justify-between text-error font-black">
                                <span>کسری مورد نیاز:</span>
                                <span className="text-sm">
                                    {formatCurrency(deficitTomans)} تومان
                                </span>
                            </div>
                        </div>

                        {/* Quick Presets */}
                        <div className="space-y-2 mb-4">
                            <label className="block text-xs font-bold text-brand">انتخاب مبلغ شارژ (تومان)</label>
                            <div className="grid grid-cols-2 gap-2">
                                {deficitTomans > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedChargeAmount(minTopUpTomans);
                                            setCustomChargeAmount("");
                                        }}
                                        className={cn(
                                            "py-2.5 px-3 rounded-xl border text-xs font-black transition-all col-span-2 flex items-center justify-between cursor-pointer",
                                            selectedChargeAmount === minTopUpTomans && !customChargeAmount
                                                ? "bg-primary text-white border-primary shadow-xs"
                                                : "bg-surface-secondary border-border-subtle text-text-light hover:bg-gray-100 dark:hover:bg-gray-800"
                                        )}
                                    >
                                        <span>
                                            {deficitTomans >= 10000
                                                ? `دقیقاً به اندازه کسری (${formatCurrency(deficitTomans)} تومان)`
                                                : `حداقل شارژ مجاز بانکی (${formatCurrency(10000)} تومان)`}
                                        </span>
                                        <CheckCircle2
                                            className={cn(
                                                "w-3.5 h-3.5",
                                                selectedChargeAmount === minTopUpTomans && !customChargeAmount
                                                    ? "opacity-100"
                                                    : "opacity-0"
                                            )}
                                        />
                                    </button>
                                )}

                                {PROMO_QUICK_AMOUNTS.map((val) => {
                                    const isSelected = selectedChargeAmount === val && !customChargeAmount;
                                    return (
                                        <button
                                            type="button"
                                            key={val}
                                            onClick={() => {
                                                setSelectedChargeAmount(val);
                                                setCustomChargeAmount("");
                                            }}
                                            className={cn(
                                                "py-2.5 px-3 rounded-xl border text-xs font-black transition-all cursor-pointer",
                                                isSelected
                                                    ? "bg-primary text-white border-primary shadow-xs"
                                                    : "bg-surface-secondary border-border-subtle text-text-light hover:bg-gray-100 dark:hover:bg-gray-800"
                                            )}
                                        >
                                            {formatCurrency(val)} تومان
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Custom Amount Input */}
                        <div className="space-y-1.5 mb-4">
                            <label className="block text-xs font-bold text-brand">یا مبلغ دلخواه (تومان)</label>
                            <input
                                type="text"
                                inputMode="numeric"
                                placeholder={`حداقل ${toPersianDigits("10,000")} تومان`}
                                value={customChargeAmount ? toPersianDigits(Number(customChargeAmount).toLocaleString("fa-IR")) : ""}
                                onChange={(e) => {
                                    setCustomChargeAmount(toOnlyDigits(e.target.value));
                                    setSelectedChargeAmount(0);
                                }}
                                className="w-full p-3 border border-border-subtle rounded-xl bg-surface-secondary focus:bg-surface focus:ring-2 focus:ring-primary outline-hidden text-xs font-bold"
                            />
                        </div>

                        {/* Security notice */}
                        <div className="p-3 bg-info-subtle/70 rounded-2xl border border-info/30 flex items-center gap-2 text-xs text-foreground font-medium mb-5">
                            <ShieldCheck className="w-4 h-4 text-info shrink-0" />
                            <span>پرداخت امن از طریق درگاه پرداخت بانکی شاپرک</span>
                        </div>

                        {/* Charge Action Buttons */}
                        <div className="space-y-2.5">
                            <button
                                type="button"
                                onClick={handleCharge}
                                disabled={initiateMutation.isPending || effectiveChargeAmount < 10000}
                                className="w-full py-3.5 bg-primary hover:bg-primary/90 text-white font-black text-xs rounded-2xl transition shadow-md shadow-primary/25 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {initiateMutation.isPending ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>در حال اتصال به درگاه پرداخت...</span>
                                    </>
                                ) : (
                                    <>
                                        <CreditCard className="w-4 h-4" />
                                        <span>
                                            انتقال به درگاه پرداخت ({formatCurrency(effectiveChargeAmount)} تومان)
                                        </span>
                                    </>
                                )}
                            </button>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        router.push(`/wallet?amount=${effectiveChargeAmount}`);
                                    }}
                                    className="flex-1 py-2.5 bg-surface-secondary hover:bg-gray-200 dark:hover:bg-gray-800 text-brand font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                                >
                                    <Wallet className="w-3.5 h-3.5 text-primary" />
                                    <span>صفحه کامل کیف پول</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMode("SELECT")}
                                    className="flex-1 py-2.5 border border-border-subtle hover:bg-surface-secondary text-text-light font-bold text-xs rounded-xl transition cursor-pointer"
                                >
                                    بازگشت به انتخاب
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
