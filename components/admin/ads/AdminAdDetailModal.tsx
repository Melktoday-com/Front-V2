"use client";

import { useAd } from "@/hooks/useAds";
import { useCityLookup } from "@/hooks/useCityLookup";
import { useCategoryLookup } from "@/hooks/useCategoryLookup";
import { formatPrice, toPersianDigits, getMediaUrl, getMediaPosterUrl } from "@/lib/utils";
import { adsService } from "@/services/ads.service";
import { AdContactInfo } from "@/types/api/ads.types";
import { AdStatus } from "@/types/api/enums";
import {
    AlertCircle,
    Archive,
    ArchiveRestore,
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
    Play,
    ShieldAlert,
    User,
    X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { useMemo, useState } from "react";
import { toast } from "sonner";

interface AdminAdDetailModalProps {
    adId: string | null;
    isOpen: boolean;
    onClose: () => void;
    onApprove?: (adId: string) => void;
    isApproving?: boolean;
    onOpenReject?: (adId: string, title: string) => void;
    onArchive?: (adId: string, title: string) => void;
    isArchiving?: boolean;
    onUnarchive?: (adId: string) => void;
    isUnarchiving?: boolean;
}

const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
    [AdStatus.DRAFT]: { label: "پیش‌نویس", bg: "bg-surface-secondary", text: "text-foreground-secondary" },
    [AdStatus.PENDING_APPROVAL]: { label: "در انتظار بررسی", bg: "bg-warning-subtle", text: "text-warning" },
    [AdStatus.PUBLISHED]: { label: "منتشر شده", bg: "bg-success-subtle", text: "text-success" },
    [AdStatus.ARCHIVED]: { label: "آرشیو شده", bg: "bg-surface-secondary", text: "text-foreground-secondary" },
    [AdStatus.REJECTED]: { label: "رد شده", bg: "bg-error-subtle", text: "text-error" },
    [AdStatus.DELETED]: { label: "حذف شده", bg: "bg-error-subtle", text: "text-error" },
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
    onArchive,
    isArchiving = false,
    onUnarchive,
    isUnarchiving = false,
}: AdminAdDetailModalProps) {
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [contactInfo, setContactInfo] = useState<AdContactInfo | null>(null);
    const [isLoadingContact, setIsLoadingContact] = useState(false);

    const { data: ad, isLoading } = useAd(adId || "");
    const { getCityName } = useCityLookup();
    const { getCategoryPathLabel } = useCategoryLookup();

    const mediaItems = useMemo(() => {
        return (ad?.mediaIds || []).map((m, idx) => {
            const id = typeof m === "string" ? m : (m.id || `media-${idx}`);
            const type = typeof m === "object" && m !== null && "type" in m ? m.type : undefined;
            const isVideo = type === "VIDEO";
            return {
                id,
                url: getMediaUrl(m),
                posterUrl: isVideo ? getMediaPosterUrl(m) : undefined,
                isVideo,
            };
        });
    }, [ad?.mediaIds]);

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

    const activeMedia = mediaItems[activeImageIndex] || mediaItems[0];
    const statusInfo = statusConfig[ad?.status || ""] || {
        label: ad?.status || "نامشخص",
        bg: "bg-surface-secondary",
        text: "text-foreground-secondary",
    };

    return (
        <div role="dialog" aria-modal="true" aria-label="جزئیات آگهی" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div
                className="bg-surface rounded-3xl w-full max-w-4xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col border border-border-subtle"
                dir="rtl"
            >
                {/* Header */}
                <div className="p-5 border-b border-border-subtle flex items-center justify-between bg-surface-secondary/50 shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-2xl bg-info-subtle text-info flex items-center justify-center shrink-0">
                            <Building2 className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <h3 className="text-base font-black text-foreground truncate">
                                    {ad?.title || "جزئیات آگهی ملک"}
                                </h3>
                                <span
                                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${statusInfo.bg} ${statusInfo.text}`}
                                >
                                    {statusInfo.label}
                                </span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-foreground-muted font-mono mt-0.5">
                                <span>ID: {adId}</span>
                                <button
                                    type="button"
                                    onClick={handleCopyId}
                                    className="hover:text-foreground-secondary p-0.5 transition-colors"
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
                        className="w-9 h-9 rounded-xl bg-surface border border-border-subtle flex items-center justify-center text-foreground-muted hover:text-foreground-secondary transition-colors shrink-0"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {isLoading ? (
                        <div className="py-20 flex flex-col items-center justify-center gap-3">
                            <Loader2 className="w-8 h-8 animate-spin text-info" />
                            <span className="text-sm font-bold text-foreground-muted">
                                در حال دریافت اطلاعات کامل آگهی...
                            </span>
                        </div>
                    ) : !ad ? (
                        <div className="py-20 text-center text-foreground-muted font-bold">
                            اطلاعاتی برای این آگهی یافت نشد.
                        </div>
                    ) : (
                        <>
                            {/* Images Gallery */}
                            {mediaItems.length > 0 ? (
                                <div className="space-y-3">
                                    <div className="relative w-full h-64 sm:h-80 rounded-2xl overflow-hidden bg-surface-secondary border border-border-subtle">
                                        {activeMedia.isVideo ? (
                                            <video
                                                src={activeMedia.url}
                                                poster={activeMedia.posterUrl}
                                                controls
                                                playsInline
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <Image
                                                src={activeMedia.url}
                                                alt={ad.title}
                                                fill
                                                unoptimized
                                                className="object-cover"
                                            />
                                        )}
                                    </div>
                                    {mediaItems.length > 1 && (
                                        <div className="flex items-center gap-2 overflow-x-auto pb-2">
                                            {mediaItems.map((media, index) => (
                                                <button
                                                    key={media.id || index}
                                                    type="button"
                                                    onClick={() => setActiveImageIndex(index)}
                                                    className={`relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                                                        activeImageIndex === index
                                                            ? "border-blue-600 shadow-md scale-95"
                                                            : "border-transparent opacity-60 hover:opacity-100"
                                                    }`}
                                                >
                                                    {media.isVideo ? (
                                                        <div className="relative w-full h-full bg-slate-900 flex items-center justify-center">
                                                            {media.posterUrl && (
                                                                <Image
                                                                    src={media.posterUrl}
                                                                    alt=""
                                                                    fill
                                                                    unoptimized
                                                                    className="object-cover opacity-80"
                                                                />
                                                            )}
                                                            <Play className="w-4 h-4 text-white fill-white relative z-10 drop-shadow" />
                                                        </div>
                                                    ) : (
                                                        <Image
                                                            src={media.url}
                                                            alt=""
                                                            fill
                                                            unoptimized
                                                            className="object-cover"
                                                        />
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="w-full h-44 rounded-2xl bg-surface-secondary border border-dashed border-border-subtle flex flex-col items-center justify-center text-foreground-muted gap-2">
                                    <ImageIcon className="w-8 h-8 opacity-40" />
                                    <span className="text-xs font-bold">تصویری برای این آگهی بارگذاری نشده است</span>
                                </div>
                            )}

                            {/* Financial / Pricing Details Grid */}
                            <div className="space-y-2.5">
                                <h4 className="text-xs font-black text-foreground-secondary uppercase tracking-wider">
                                    اطلاعات قیمت و شرایط مالی
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                    {ad.pricing && Object.keys(ad.pricing).length > 0 ? (
                                        Object.entries(ad.pricing).map(([k, val]) => (
                                            <div
                                                key={k}
                                                className="p-4 bg-surface-secondary rounded-2xl border border-border-subtle space-y-1"
                                            >
                                                <span className="text-xs text-foreground-muted font-bold block">
                                                    {pricingKeyLabels[k] || k}
                                                </span>
                                                <span className="text-base font-black text-success">
                                                    {typeof val === "number" ? formatPrice(val, "") : String(val)}
                                                </span>
                                                <span className="text-[10px] text-foreground-muted font-bold mr-1">
                                                    تومان
                                                </span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-4 bg-surface-secondary rounded-2xl border border-border-subtle">
                                            <span className="text-xs text-foreground-muted font-bold block">قیمت</span>
                                            <span className="text-sm font-black text-foreground-secondary">توافقی</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Core Specs Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div className="p-4 bg-surface-secondary rounded-2xl border border-border-subtle space-y-1">
                                    <span className="text-xs text-foreground-muted font-bold block">دسته‌بندی</span>
                                    <span className="text-xs font-black text-foreground truncate block">
                                        {getCategoryPathLabel(ad.categoryPath?.categoryKey, ad.categoryPath?.subcategoryKey)}
                                    </span>
                                    <span className="text-[10px] text-foreground-muted block truncate" title={`کلید: ${ad.categoryPath?.categoryKey} / ${ad.categoryPath?.subcategoryKey}`}>
                                        مدل: {ad.categoryPath?.businessModelKey}
                                    </span>
                                </div>

                                <div className="p-4 bg-surface-secondary rounded-2xl border border-border-subtle space-y-1">
                                    <span className="text-xs text-foreground-muted font-bold block">شهر و مختصات</span>
                                    <span className="text-xs font-black text-foreground truncate block">
                                        شهر: {getCityName(ad.cityId)}
                                    </span>
                                    <span className="text-[10px] text-foreground-muted block font-mono">
                                        {ad.location?.latitude && ad.location?.longitude
                                            ? `${ad.location.latitude.toFixed(3)}, ${ad.location.longitude.toFixed(3)}`
                                            : "بدون مختصات"}
                                    </span>
                                </div>

                                <div className="p-4 bg-surface-secondary rounded-2xl border border-border-subtle space-y-1">
                                    <span className="text-xs text-foreground-muted font-bold block">تاریخ ثبت</span>
                                    <span className="text-xs font-bold text-foreground-secondary block">
                                        {new Date(ad.createdAt).toLocaleDateString("fa-IR")}
                                    </span>
                                    <span className="text-[10px] text-foreground-muted block">
                                        ساعت: {new Date(ad.createdAt).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}
                                    </span>
                                </div>

                                <div className="p-4 bg-surface-secondary rounded-2xl border border-border-subtle space-y-1">
                                    <span className="text-xs text-foreground-muted font-bold block">وضعیت نمایش</span>
                                    <span className="text-xs font-bold text-foreground-secondary block">
                                        {ad.isFeatured ? "⭐ آگهی ویژه (Featured)" : "عادی"}
                                    </span>
                                    <span className="text-[10px] text-foreground-muted block">
                                        نسخه ساختار: {ad.categoryPath?.attributeSchemaVersion ?? 1}
                                    </span>
                                </div>
                            </div>

                            {/* Description */}
                            {ad.description && (
                                <div className="space-y-2">
                                    <h4 className="text-xs font-black text-foreground-secondary uppercase tracking-wider">
                                        توضیحات آگهی
                                    </h4>
                                    <p className="text-xs sm:text-sm text-foreground-secondary leading-relaxed bg-surface-secondary p-4 rounded-2xl border border-border-subtle whitespace-pre-line">
                                        {ad.description}
                                    </p>
                                </div>
                            )}

                            {/* Dynamic Attributes Grid */}
                            {((ad.attributeList && ad.attributeList.length > 0) || (ad.attributes && Object.keys(ad.attributes).length > 0)) && (
                                <div className="space-y-2.5">
                                    <h4 className="text-xs font-black text-foreground-secondary uppercase tracking-wider">
                                        مشخصات و ویژگی‌های ملک
                                    </h4>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {ad.attributeList && ad.attributeList.length > 0
                                            ? ad.attributeList.map((attr) => (
                                                  <div
                                                      key={attr.key}
                                                      className="flex items-center justify-between p-3 bg-surface border border-border-subtle rounded-xl text-xs"
                                                  >
                                                      <span className="font-bold text-foreground-muted">{attr.label}:</span>
                                                      <span className="font-black text-foreground">
                                                          {toPersianDigits(attr.displayValue || String(attr.value ?? ""))}
                                                      </span>
                                                  </div>
                                              ))
                                            : Object.entries(ad.attributes || {}).map(([key, val]) => {
                                                  const displayVal =
                                                      typeof val === "boolean"
                                                          ? val
                                                              ? "دارد"
                                                              : "ندارد"
                                                          : String(val);

                                                  return (
                                                      <div
                                                          key={key}
                                                          className="flex items-center justify-between p-3 bg-surface border border-border-subtle rounded-xl text-xs"
                                                      >
                                                          <span className="font-bold text-foreground-muted">{key}:</span>
                                                          <span className="font-black text-foreground">
                                                              {toPersianDigits(displayVal)}
                                                          </span>
                                                      </div>
                                                  );
                                              })}
                                    </div>
                                </div>
                            )}

                            {/* Host / Owner Information */}
                            <div className="p-4 bg-info-subtle/50 border border-info/30 rounded-2xl space-y-3">
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-full bg-info-subtle text-info flex items-center justify-center">
                                            <User className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <span className="text-xs font-bold text-foreground-secondary block">
                                                شناسه آگهی‌دهنده:
                                            </span>
                                            <span className="text-xs font-mono text-foreground-muted font-bold">
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
                                        <div className="flex items-center gap-3 bg-surface px-4 py-2 rounded-xl border border-info/30">
                                            <div className="flex items-center gap-1.5">
                                                <Phone className="w-4 h-4 text-info" />
                                                <span className="text-xs font-black text-foreground font-mono" dir="ltr">
                                                    {contactInfo.mobileNumber}
                                                </span>
                                            </div>
                                            {contactInfo.email && (
                                                <div className="flex items-center gap-1 text-foreground-muted text-xs border-r border-border-subtle pr-3">
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
                <div className="p-4 bg-surface-secondary border-t border-border-subtle flex items-center justify-between gap-3 shrink-0">
                    <div className="flex items-center gap-2">
                        <Link
                            href={`/ads/${adId}`}
                            target="_blank"
                            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-surface hover:bg-surface-secondary border border-border-subtle text-foreground-secondary rounded-xl text-xs font-bold transition-colors shadow-2xs"
                        >
                            <ExternalLink className="w-4 h-4" />
                            <span>مشاهده صفحه عمومی آگهی</span>
                        </Link>

                        {onApprove && ad?.status === AdStatus.PENDING_APPROVAL && (
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

                        {onOpenReject && ad?.status === AdStatus.PENDING_APPROVAL && (
                            <button
                                type="button"
                                onClick={() => onOpenReject(adId, ad?.title || "")}
                                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-error-subtle hover:bg-error-subtle border border-error/30 text-error rounded-xl text-xs font-bold transition-colors"
                            >
                                <AlertCircle className="w-4 h-4" />
                                <span>رد آگهی</span>
                            </button>
                        )}

                        {onArchive && ad?.status === AdStatus.PUBLISHED && (
                            <button
                                type="button"
                                onClick={() => onArchive(adId, ad?.title || "")}
                                disabled={isArchiving}
                                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-700 dark:text-amber-400 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                            >
                                {isArchiving ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Archive className="w-4 h-4" />
                                )}
                                <span>بایگانی آگهی</span>
                            </button>
                        )}

                        {onUnarchive && ad?.status === AdStatus.ARCHIVED && (
                            <button
                                type="button"
                                onClick={() => onUnarchive(adId)}
                                disabled={isUnarchiving}
                                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/30 text-violet-700 dark:text-violet-400 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                            >
                                {isUnarchiving ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <ArchiveRestore className="w-4 h-4" />
                                )}
                                <span>خروج از بایگانی</span>
                            </button>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-foreground-secondary font-bold text-xs rounded-xl transition-colors"
                    >
                        بستن
                    </button>
                </div>
            </div>
        </div>
    );
}
