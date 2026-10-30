"use client";

import { useTemporaryRentAdDetail } from "@/hooks/useTemporaryRent";
import { formatPrice, toPersianDigits, getMediaUrl, getMediaPosterUrl } from "@/lib/utils";
import { temporaryRentService } from "@/services/temporary-rent.service";
import type { TemporaryRentPricingReadModel } from "@/types/api/temporary-rent.types";

function getTemporaryRentPriceDisplay(pricing?: TemporaryRentPricingReadModel | null): { label: string; formatted: string; hasCurrency: boolean } {
    if (!pricing) return { label: "قیمت", formatted: "توافقی", hasCurrency: false };
    switch (pricing.priceModelKey) {
        case "DAILY_RENT_STANDARD":
            return {
                label: "اجاره هر شب",
                formatted: formatPrice(pricing.pricing.nightlyPrice, ""),
                hasCurrency: pricing.pricing.nightlyPrice > 0,
            };
        case "WEEKLY_MONTHLY_RENT":
            return {
                label: "اجاره هر شب",
                formatted: formatPrice(pricing.pricing.nightlyPrice, ""),
                hasCurrency: pricing.pricing.nightlyPrice > 0,
            };
        case "WEEKEND_PEAK_RENT": {
            const amount = pricing.pricing.midweekNightlyPrice || pricing.pricing.weekendNightlyPrice;
            return {
                label: "اجاره هر شب",
                formatted: formatPrice(amount, ""),
                hasCurrency: amount > 0,
            };
        }
        case "EVENT_VENUE_RENT":
            return {
                label: "پایه برگزاری مراسم",
                formatted: formatPrice(pricing.pricing.eventBasePrice, ""),
                hasCurrency: pricing.pricing.eventBasePrice > 0,
            };
        default:
            return {
                label: "قیمت",
                formatted: "توافقی",
                hasCurrency: false,
            };
    }
}
import {
    Calendar,
    CheckCircle2,
    Clock,
    Copy,
    ExternalLink,
    Home,
    ImageIcon,
    Loader2,
    MapPin,
    Phone,
    Play,
    ShieldAlert,
    Trash2,
    User,
    Users,
    X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { useMemo, useState } from "react";
import { toast } from "sonner";

interface TemporaryRentItemDetailModalProps {
    adId: string | null;
    isOpen: boolean;
    onClose: () => void;
    onDelete?: (adId: string) => void;
    isDeleting?: boolean;
    onPublish?: (adId: string) => void;
    isPublishing?: boolean;
}

const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
    DRAFT: { label: "پیش‌نویس", bg: "bg-surface-secondary", text: "text-foreground-secondary" },
    PENDING_APPROVAL: { label: "در انتظار بررسی", bg: "bg-warning-subtle", text: "text-warning" },
    PUBLISHED: { label: "منتشر شده", bg: "bg-success-subtle", text: "text-success" },
    ARCHIVED: { label: "آرشیو شده", bg: "bg-surface-secondary", text: "text-foreground-secondary" },
    REJECTED: { label: "رد شده", bg: "bg-error-subtle", text: "text-error" },
};

export default function TemporaryRentItemDetailModal({
    adId,
    isOpen,
    onClose,
    onDelete,
    isDeleting = false,
    onPublish,
    isPublishing = false,
}: TemporaryRentItemDetailModalProps) {
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [contactInfo, setContactInfo] = useState<{ phoneNumber?: string; ownerName?: string } | null>(null);
    const [isLoadingContact, setIsLoadingContact] = useState(false);

    const { data: ad, isLoading } = useTemporaryRentAdDetail(adId || "");

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
        toast.success("شناسه اقامتگاه در کلیپ‌بورد کپی شد");
    };

    const handleLoadContact = async () => {
        if (contactInfo) return;
        setIsLoadingContact(true);
        try {
            const info = await temporaryRentService.getContactInfo(adId);
            setContactInfo(info);
        } catch {
            toast.error("خطا در دریافت اطلاعات تماس مالک");
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div
                className="bg-surface rounded-3xl w-full max-w-4xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col border border-border-subtle"
                dir="rtl"
            >
                {/* Header */}
                <div className="p-5 border-b border-border-subtle flex items-center justify-between bg-surface-secondary/50 shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-2xl bg-success-subtle text-success flex items-center justify-center shrink-0">
                            <Home className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <h3 className="text-base font-black text-foreground truncate">
                                    {ad?.title || "جزئیات اقامتگاه"}
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

                {/* Body Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {isLoading ? (
                        <div className="py-20 flex flex-col items-center justify-center gap-3">
                            <Loader2 className="w-8 h-8 animate-spin text-success" />
                            <span className="text-sm font-bold text-foreground-muted">
                                در حال دریافت جزئیات اقامتگاه...
                            </span>
                        </div>
                    ) : !ad ? (
                        <div className="py-20 text-center text-foreground-muted font-bold">
                            اطلاعاتی برای این اقامتگاه یافت نشد.
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
                                                            ? "border-emerald-600 shadow-md scale-95"
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
                                    <span className="text-xs font-bold">عکسی برای این اقامتگاه ثبت نشده است</span>
                                </div>
                            )}

                            {/* Core Specs Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {(() => {
                                    const trPrice = getTemporaryRentPriceDisplay(ad.pricing);
                                    return (
                                        <div className="p-4 bg-surface-secondary rounded-2xl border border-border-subtle space-y-1">
                                            <span className="text-xs text-foreground-muted font-bold block">{trPrice.label}</span>
                                            <span className="text-base font-black text-success">
                                                {trPrice.formatted}
                                            </span>
                                            {trPrice.hasCurrency && (
                                                <span className="text-[10px] text-foreground-muted font-bold mr-1">تومان</span>
                                            )}
                                        </div>
                                    );
                                })()}

                                <div className="p-4 bg-surface-secondary rounded-2xl border border-border-subtle space-y-1">
                                    <span className="text-xs text-foreground-muted font-bold block">حداکثر ظرفیت</span>
                                    <span className="text-base font-black text-foreground">
                                        {toPersianDigits(ad.maxGuests || ad.guestCapacity || 1)}
                                    </span>
                                    <span className="text-[10px] text-foreground-muted font-bold mr-1">مهمان</span>
                                </div>

                                <div className="p-4 bg-surface-secondary rounded-2xl border border-border-subtle space-y-1">
                                    <span className="text-xs text-foreground-muted font-bold block">موقعیت</span>
                                    <span className="text-sm font-bold text-foreground truncate block">
                                        {ad.cityName || ad.cityId || "نامشخص"}
                                    </span>
                                    <span className="text-[10px] text-foreground-muted block font-mono">
                                        {ad.latitude && ad.longitude
                                            ? `${ad.latitude.toFixed(3)}, ${ad.longitude.toFixed(3)}`
                                            : "بدون مختصات"}
                                    </span>
                                </div>

                                <div className="p-4 bg-surface-secondary rounded-2xl border border-border-subtle space-y-1">
                                    <span className="text-xs text-foreground-muted font-bold block">تاریخ ثبت</span>
                                    <span className="text-xs font-bold text-foreground-secondary block">
                                        {new Date(ad.createdAt).toLocaleDateString("fa-IR")}
                                    </span>
                                    <span className="text-[10px] text-foreground-muted block">
                                        بروزرسانی: {new Date(ad.updatedAt).toLocaleDateString("fa-IR")}
                                    </span>
                                </div>
                            </div>

                            {/* Description */}
                            {ad.description && (
                                <div className="space-y-2">
                                    <h4 className="text-xs font-black text-foreground-secondary uppercase tracking-wider">
                                        توضیحات اقامتگاه
                                    </h4>
                                    <p className="text-xs sm:text-sm text-foreground-secondary leading-relaxed bg-surface-secondary p-4 rounded-2xl border border-border-subtle whitespace-pre-line">
                                        {ad.description}
                                    </p>
                                </div>
                            )}

                            {/* Dynamic Attributes */}
                            {(((ad as any).attributeList && (ad as any).attributeList.length > 0) || (ad.attributes && Object.keys(ad.attributes).length > 0)) && (
                                <div className="space-y-2.5">
                                    <h4 className="text-xs font-black text-foreground-secondary uppercase tracking-wider">
                                        امکانات و ویژگی‌ها
                                    </h4>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {(ad as any).attributeList && (ad as any).attributeList.length > 0
                                            ? ((ad as any).attributeList as Array<{ key: string; label: string; displayValue: string }>).map((attr) => (
                                                  <div
                                                      key={attr.key}
                                                      className="flex items-center justify-between p-3 bg-surface border border-border-subtle rounded-xl text-xs"
                                                  >
                                                      <span className="font-bold text-foreground-muted">{attr.label}:</span>
                                                      <span className="font-black text-foreground">
                                                          {toPersianDigits(attr.displayValue)}
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

                            {/* Host Information */}
                            <div className="p-4 bg-success-subtle/50 border border-success/30 rounded-2xl space-y-3">
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-full bg-success-subtle text-success flex items-center justify-center">
                                            <User className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <span className="text-xs font-bold text-foreground-secondary block">
                                                شناسه مالک / میزبان:
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
                                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                                        >
                                            {isLoadingContact ? (
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            ) : (
                                                <Phone className="w-3.5 h-3.5" />
                                            )}
                                            <span>مشاهده شماره تماس مالک</span>
                                        </button>
                                    ) : (
                                        <div className="flex items-center gap-2 bg-surface px-4 py-2 rounded-xl border border-success/30">
                                            <Phone className="w-4 h-4 text-success" />
                                            <span className="text-xs font-black text-foreground font-mono" dir="ltr">
                                                {contactInfo.phoneNumber}
                                            </span>
                                            {contactInfo.ownerName && (
                                                <span className="text-xs text-foreground-muted font-bold mr-2">
                                                    ({contactInfo.ownerName})
                                                </span>
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
                            href={`/temporary-rent/${adId}`}
                            target="_blank"
                            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-surface hover:bg-surface-secondary border border-border-subtle text-foreground-secondary rounded-xl text-xs font-bold transition-colors shadow-xs"
                        >
                            <ExternalLink className="w-4 h-4" />
                            <span>مشاهده صفحه عمومی اقامتگاه</span>
                        </Link>

                        {onPublish && ad?.status !== "PUBLISHED" && (
                            <button
                                type="button"
                                onClick={() => onPublish(adId)}
                                disabled={isPublishing}
                                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                            >
                                {isPublishing ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <CheckCircle2 className="w-4 h-4" />
                                )}
                                <span>تایید و انتشار اقامتگاه</span>
                            </button>
                        )}

                        {onDelete && (
                            <button
                                type="button"
                                onClick={() => onDelete(adId)}
                                disabled={isDeleting}
                                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-error-subtle hover:bg-error-subtle border border-error/30 text-error rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                            >
                                {isDeleting ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Trash2 className="w-4 h-4" />
                                )}
                                <span>حذف این اقامتگاه</span>
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
