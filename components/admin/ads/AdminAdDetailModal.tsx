"use client";

import { useAd } from "@/hooks/useAds";
import { useCityLookup } from "@/hooks/useCityLookup";
import { useCategoryLookup } from "@/hooks/useCategoryLookup";
import { formatPrice, toPersianDigits } from "@/lib/utils";
import { adsService } from "@/services/ads.service";
import { AdContactInfo } from "@/types/api/ads.types";
import { AdStatus } from "@/types/api/enums";
import {
    AlertCircle,
    Building2,
    Calendar,
    Check,
    CheckCircle2,
    Clock,
    Copy,
    ExternalLink,
    FolderTree,
    ImageIcon,
    Loader2,
    Mail,
    MapPin,
    Phone,
    ShieldAlert,
    User,
    X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";
import { toast } from "sonner";

interface AdminAdDetailModalProps {
    adId: string | null;
    isOpen: boolean;
    onClose: () => void;
    onApprove?: (adId: string) => void;
    isApproving?: boolean;
    onOpenReject?: (adId: string, title: string) => void;
}

const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
    [AdStatus.DRAFT]: { label: "پیش‌نویس", bg: "bg-slate-100", text: "text-slate-600" },
    [AdStatus.PENDING_APPROVAL]: { label: "در انتظار بررسی", bg: "bg-amber-100", text: "text-amber-700" },
    [AdStatus.PUBLISHED]: { label: "منتشر شده", bg: "bg-emerald-100", text: "text-emerald-700" },
    [AdStatus.ARCHIVED]: { label: "آرشیو شده", bg: "bg-zinc-100", text: "text-zinc-600" },
    [AdStatus.REJECTED]: { label: "رد شده", bg: "bg-rose-100", text: "text-rose-700" },
    [AdStatus.DELETED]: { label: "حذف شده", bg: "bg-red-100", text: "text-red-700" },
};

const pricingKeyLabels: Record<string, string> = {
    totalPrice: "قیمت کل",
    pricePerSquareMeter: "قیمت هر متر مربع",
    deposit: "مبلغ ودیعه (رهن)",
    monthlyRent: "اجاره ماهانه",
    nightlyPrice: "نرخ شبانه",
    price: "قیمت",
};

export default function AdminAdDetailModal({
    adId,
    isOpen,
    onClose,
    onApprove,
    isApproving = false,
    onOpenReject,
}: AdminAdDetailModalProps) {
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [contactInfo, setContactInfo] = useState<AdContactInfo | null>(null);
    const [isLoadingContact, setIsLoadingContact] = useState(false);

    const { data: ad, isLoading } = useAd(adId || "");
    const { getCityName } = useCityLookup();
    const { getCategoryPathLabel } = useCategoryLookup();

    if (!isOpen || !adId) return null;

    const handleCopyId = () => {
        navigator.clipboard.writeText(adId);
        toast.success("شناسه آگهی در کلیپ‌بورد کپی شد");
    };

    const handleLoadContact = async () => {
        if (contactInfo) return;
        setIsLoadingContact(true);
        try {
            const info = await adsService.getContactInfo(adId);
            setContactInfo(info);
        } catch {
            toast.error("خطا در دریافت اطلاعات تماس آگهی‌دهنده");
        } finally {
            setIsLoadingContact(false);
        }
    };

    const mediaList = ad?.mediaIds || [];
    const statusInfo = statusConfig[ad?.status || ""] || {
        label: ad?.status || "نامشخص",
        bg: "bg-slate-100",
        text: "text-slate-600",
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div
                className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col border border-slate-200"
                dir="rtl"
            >
                {/* Header */}
                <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                            <Building2 className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <h3 className="text-base font-black text-slate-900 truncate">
                                    {ad?.title || "جزئیات آگهی ملک"}
                                </h3>
                                <span
                                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${statusInfo.bg} ${statusInfo.text}`}
                                >
                                    {statusInfo.label}
                                </span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-slate-400 font-mono mt-0.5">
                                <span>ID: {adId}</span>
                                <button
                                    type="button"
                                    onClick={handleCopyId}
                                    className="hover:text-slate-700 p-0.5 transition-colors"
                                    title="کپی شناسه"
                                >
                                    <Copy className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors shrink-0"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {isLoading ? (
                        <div className="py-20 flex flex-col items-center justify-center gap-3">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                            <span className="text-sm font-bold text-slate-500">
                                در حال دریافت اطلاعات کامل آگهی...
                            </span>
                        </div>
                    ) : !ad ? (
                        <div className="py-20 text-center text-slate-400 font-bold">
                            اطلاعاتی برای این آگهی یافت نشد.
                        </div>
                    ) : (
                        <>
                            {/* Images Gallery */}
                            {mediaList.length > 0 ? (
                                <div className="space-y-3">
                                    <div className="relative w-full h-64 sm:h-80 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                                        <Image
                                            src={`${process.env.NEXT_PUBLIC_API_URL}/media/${mediaList[activeImageIndex]}`}
                                            alt={ad.title}
                                            fill
                                            unoptimized
                                            className="object-cover"
                                        />
                                    </div>
                                    {mediaList.length > 1 && (
                                        <div className="flex items-center gap-2 overflow-x-auto pb-2">
                                            {mediaList.map((mId, index) => (
                                                <button
                                                    key={mId}
                                                    type="button"
                                                    onClick={() => setActiveImageIndex(index)}
                                                    className={`relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                                                        activeImageIndex === index
                                                            ? "border-blue-600 shadow-md scale-95"
                                                            : "border-transparent opacity-60 hover:opacity-100"
                                                    }`}
                                                >
                                                    <Image
                                                        src={`${process.env.NEXT_PUBLIC_API_URL}/media/${mId}`}
                                                        alt=""
                                                        fill
                                                        unoptimized
                                                        className="object-cover"
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="w-full h-44 rounded-2xl bg-slate-50 border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 gap-2">
                                    <ImageIcon className="w-8 h-8 opacity-40" />
                                    <span className="text-xs font-bold">تصویری برای این آگهی بارگذاری نشده است</span>
                                </div>
                            )}

                            {/* Financial / Pricing Details Grid */}
                            <div className="space-y-2.5">
                                <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                                    اطلاعات قیمت و شرایط مالی
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                    {ad.pricing && Object.keys(ad.pricing).length > 0 ? (
                                        Object.entries(ad.pricing).map(([k, val]) => (
                                            <div
                                                key={k}
                                                className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1"
                                            >
                                                <span className="text-xs text-slate-400 font-bold block">
                                                    {pricingKeyLabels[k] || k}
                                                </span>
                                                <span className="text-base font-black text-emerald-600">
                                                    {typeof val === "number" ? formatPrice(val, "") : String(val)}
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-bold mr-1">
                                                    تومان
                                                </span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                            <span className="text-xs text-slate-400 font-bold block">قیمت</span>
                                            <span className="text-sm font-black text-slate-700">توافقی</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Core Specs Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                                    <span className="text-xs text-slate-400 font-bold block">دسته‌بندی</span>
                                    <span className="text-xs font-black text-slate-800 truncate block">
                                        {getCategoryPathLabel(ad.categoryPath?.categoryKey, ad.categoryPath?.subcategoryKey)}
                                    </span>
                                    <span className="text-[10px] text-slate-400 block truncate" title={`کلید: ${ad.categoryPath?.categoryKey} / ${ad.categoryPath?.subcategoryKey}`}>
                                        مدل: {ad.categoryPath?.businessModelKey}
                                    </span>
                                </div>

                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                                    <span className="text-xs text-slate-400 font-bold block">شهر و مختصات</span>
                                    <span className="text-xs font-black text-slate-800 truncate block">
                                        شهر: {getCityName(ad.cityId)}
                                    </span>
                                    <span className="text-[10px] text-slate-400 block font-mono">
                                        {ad.location?.latitude && ad.location?.longitude
                                            ? `${ad.location.latitude.toFixed(3)}, ${ad.location.longitude.toFixed(3)}`
                                            : "بدون مختصات"}
                                    </span>
                                </div>

                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                                    <span className="text-xs text-slate-400 font-bold block">تاریخ ثبت</span>
                                    <span className="text-xs font-bold text-slate-700 block">
                                        {new Date(ad.createdAt).toLocaleDateString("fa-IR")}
                                    </span>
                                    <span className="text-[10px] text-slate-400 block">
                                        ساعت: {new Date(ad.createdAt).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}
                                    </span>
                                </div>

                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                                    <span className="text-xs text-slate-400 font-bold block">وضعیت نمایش</span>
                                    <span className="text-xs font-bold text-slate-700 block">
                                        {ad.isFeatured ? "⭐ آگهی ویژه (Featured)" : "عادی"}
                                    </span>
                                    <span className="text-[10px] text-slate-400 block">
                                        نسخه ساختار: {ad.categoryPath?.attributeSchemaVersion ?? 1}
                                    </span>
                                </div>
                            </div>

                            {/* Description */}
                            {ad.description && (
                                <div className="space-y-2">
                                    <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                                        توضیحات آگهی
                                    </h4>
                                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100 whitespace-pre-line">
                                        {ad.description}
                                    </p>
                                </div>
                            )}

                            {/* Dynamic Attributes Grid */}
                            {ad.attributes && Object.keys(ad.attributes).length > 0 && (
                                <div className="space-y-2.5">
                                    <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                                        مشخصات و ویژگی‌های ملک
                                    </h4>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {Object.entries(ad.attributes).map(([key, val]) => {
                                            const displayVal =
                                                typeof val === "boolean"
                                                    ? val
                                                        ? "دارد"
                                                        : "ندارد"
                                                    : String(val);

                                            return (
                                                <div
                                                    key={key}
                                                    className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl text-xs"
                                                >
                                                    <span className="font-bold text-slate-500">{key}:</span>
                                                    <span className="font-black text-slate-800">
                                                        {toPersianDigits(displayVal)}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Host / Owner Information */}
                            <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl space-y-3">
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">
                                            <User className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <span className="text-xs font-bold text-slate-700 block">
                                                شناسه آگهی‌دهنده:
                                            </span>
                                            <span className="text-xs font-mono text-slate-500 font-bold">
                                                {ad.ownerId}
                                            </span>
                                        </div>
                                    </div>

                                    {!contactInfo ? (
                                        <button
                                            type="button"
                                            onClick={handleLoadContact}
                                            disabled={isLoadingContact}
                                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                                        >
                                            {isLoadingContact ? (
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            ) : (
                                                <Phone className="w-3.5 h-3.5" />
                                            )}
                                            <span>استعلام شماره تماس مالک</span>
                                        </button>
                                    ) : (
                                        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-blue-200">
                                            <div className="flex items-center gap-1.5">
                                                <Phone className="w-4 h-4 text-blue-600" />
                                                <span className="text-xs font-black text-slate-800 font-mono" dir="ltr">
                                                    {contactInfo.mobileNumber}
                                                </span>
                                            </div>
                                            {contactInfo.email && (
                                                <div className="flex items-center gap-1 text-slate-500 text-xs border-r border-slate-200 pr-3">
                                                    <Mail className="w-3.5 h-3.5" />
                                                    <span>{contactInfo.email}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0">
                    <div className="flex items-center gap-2">
                        <Link
                            href={`/ads/${adId}`}
                            target="_blank"
                            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors shadow-2xs"
                        >
                            <ExternalLink className="w-4 h-4" />
                            <span>مشاهده صفحه عمومی آگهی</span>
                        </Link>

                        {onApprove && ad?.status !== AdStatus.PUBLISHED && (
                            <button
                                type="button"
                                onClick={() => onApprove(adId)}
                                disabled={isApproving}
                                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                            >
                                {isApproving ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <CheckCircle2 className="w-4 h-4" />
                                )}
                                <span>تایید و انتشار آگهی</span>
                            </button>
                        )}

                        {onOpenReject && ad?.status !== AdStatus.REJECTED && (
                            <button
                                type="button"
                                onClick={() => onOpenReject(adId, ad?.title || "")}
                                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 rounded-xl text-xs font-bold transition-colors"
                            >
                                <AlertCircle className="w-4 h-4" />
                                <span>رد آگهی</span>
                            </button>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-colors"
                    >
                        بستن
                    </button>
                </div>
            </div>
        </div>
    );
}
