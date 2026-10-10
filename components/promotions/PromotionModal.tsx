"use client";

import React, { useState, useMemo } from "react";
import { usePromotionPricing, useRequestPromotion } from "@/hooks/usePromotions";
import { useEntitlements } from "@/hooks/useSubscription";
import { useWalletBalance } from "@/hooks/useWallet";
import { useTariffs } from "@/hooks/useTariffs";
import { PromotionType } from "@/types/api/promotion.types";
import { formatCurrency, toPersianDigits } from "@/lib/utils";
import { Zap, TrendingUp, X, Sparkles, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface PromotionModalProps {
    isOpen: boolean;
    onClose: () => void;
    listingId: string;
    listingTitle: string;
    itemType?: "LISTING" | "TEMPORARY_RENTAL";
}

export function PromotionModal({
    isOpen,
    onClose,
    listingId,
    listingTitle,
    itemType = "LISTING",
}: PromotionModalProps) {
    const router = useRouter();
    const [selectedType, setSelectedType] = useState<PromotionType>("URGENT_TAG");

    const { data: pricingData, isLoading: isPricingLoading } = usePromotionPricing();
    const { data: tariffs = [], isLoading: isTariffsLoading } = useTariffs();
    const { data: entitlements = [] } = useEntitlements();
    const { data: walletBalance } = useWalletBalance();
    const requestMutation = useRequestPromotion();

    // Check available entitlements
    const urgentQuota = useMemo(() => {
        const ent = entitlements.find((e) => e.entitlementType === "URGENT_PROMOTION");
        return ent?.remainingQuota ?? 0;
    }, [entitlements]);

    const ladderQuota = useMemo(() => {
        const ent = entitlements.find((e) => e.entitlementType === "LADDER_PROMOTION");
        return ent?.remainingQuota ?? 0;
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

    const urgentPriceTomans = Math.round(urgentPriceRials / 10);
    const ladderPriceTomans = Math.round(ladderPriceRials / 10);

    const activePriceRials = selectedType === "URGENT_TAG" ? urgentPriceRials : ladderPriceRials;
    const activePriceTomans = selectedType === "URGENT_TAG" ? urgentPriceTomans : ladderPriceTomans;

    const isQuotaAvailable = selectedType === "URGENT_TAG" ? urgentQuota > 0 : ladderQuota > 0;
    const isPricingLoadingCombined = isPricingLoading || isTariffsLoading;
    const isTariffConfigured = activePriceRials > 0;

    const currentBalanceRials = Number(walletBalance?.availableBalance ?? walletBalance?.balance ?? 0);
    const isBalanceSufficient = isQuotaAvailable || (isTariffConfigured && currentBalanceRials >= activePriceRials);

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
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            const msg = error?.response?.data?.message || "خطا در ثبت درخواست ارتقا";
            toast.error(msg);
        }
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
            <div className="relative z-10 w-full md:max-w-md bg-white rounded-t-3xl md:rounded-3xl p-6 shadow-2xl transition-all max-h-[90vh] overflow-y-auto">
                {/* Mobile Drawer Pull Handle */}
                <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-4 md:hidden" />

                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-amber-500/10 text-amber-600 rounded-xl">
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
                        onClick={onClose}
                        className="p-1.5 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-50 transition cursor-pointer"
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
                                ? "border-rose-500 bg-rose-50/30"
                                : "border-gray-100 hover:border-gray-200 bg-white"
                        }`}
                    >
                        <div className="p-2.5 bg-rose-100 text-rose-600 rounded-xl shrink-0 mt-0.5">
                            <Zap className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                                <h4 className="font-black text-brand text-sm">نشان فوری</h4>
                                {urgentQuota > 0 ? (
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-xs line-through text-gray-400">
                                            {formatCurrency(urgentPriceTomans)} تومان
                                        </span>
                                        <span className="text-xs text-emerald-600 font-bold">رایگان</span>
                                        <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
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
                                    <span className="text-xs font-bold text-rose-500">
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
                                ? "border-amber-500 bg-amber-50/30"
                                : "border-gray-100 hover:border-gray-200 bg-white"
                        }`}
                    >
                        <div className="p-2.5 bg-amber-100 text-amber-600 rounded-xl shrink-0 mt-0.5">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                                <h4 className="font-black text-brand text-sm">نردبان</h4>
                                {ladderQuota > 0 ? (
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-xs line-through text-gray-400">
                                            {formatCurrency(ladderPriceTomans)} تومان
                                        </span>
                                        <span className="text-xs text-emerald-600 font-bold">رایگان</span>
                                        <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
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
                                    <span className="text-xs font-bold text-rose-500">
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
                                <span className="text-xs line-through text-gray-400">
                                    {formatCurrency(activePriceTomans)} تومان
                                </span>
                                <span className="text-emerald-700 font-black flex items-center gap-1">
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
                            <span className="text-xs font-bold text-rose-500">
                                تعرفه نامشخص
                            </span>
                        )}
                    </div>

                    {!isQuotaAvailable && (
                        <div className="flex items-center justify-between text-[11px] pt-2 border-t border-gray-200/50">
                            <span className="text-text-light">موجودی کیف پول شما:</span>
                            <span className="font-bold text-brand">
                                {formatCurrency(Math.round(currentBalanceRials / 10))} تومان
                            </span>
                        </div>
                    )}
                </div>

                {/* Alerts */}
                {!isQuotaAvailable && !isPricingLoadingCombined && !isTariffConfigured ? (
                    <div className="p-3.5 bg-rose-50 border border-rose-200/80 rounded-2xl flex items-start gap-2.5 mb-5">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <div className="text-xs text-rose-900 leading-relaxed">
                            تعرفه این نوع ارتقا در حال حاضر فعال یا تنظیم نشده است.
                        </div>
                    </div>
                ) : !isBalanceSufficient ? (
                    <div className="p-3.5 bg-rose-50 border border-rose-200/80 rounded-2xl flex items-start gap-2.5 mb-5">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <div className="text-xs text-rose-900 leading-relaxed">
                            موجودی کیف پول شما برای این عملیات کافی نیست. لطفاً ابتدا کیف پول خود را شارژ فرمایید.
                        </div>
                    </div>
                ) : null}

                {/* Action Buttons */}
                <div className="flex items-center gap-2.5">
                    {!isQuotaAvailable && !isTariffConfigured ? (
                        <button
                            disabled
                            className="flex-1 py-3 bg-gray-200 text-gray-500 font-bold text-xs rounded-2xl shadow-sm cursor-not-allowed"
                        >
                            تعرفه غیرفعال است
                        </button>
                    ) : !isBalanceSufficient ? (
                        <button
                            onClick={() => {
                                onClose();
                                router.push("/wallet");
                            }}
                            className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-2xl transition shadow-sm cursor-pointer text-center"
                        >
                            افزایش موجودی کیف پول
                        </button>
                    ) : (
                        <button
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
                        onClick={onClose}
                        className="py-3 px-5 border border-gray-200 hover:bg-gray-50 text-text-light font-bold text-xs rounded-2xl transition cursor-pointer"
                    >
                        انصراف
                    </button>
                </div>
            </div>
        </div>
    );
}
