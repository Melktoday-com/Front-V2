"use client";

import { useInfiniteMyAds, useMyAds } from "@/hooks/useAds";
import { DEFAULT_CATEGORY_TRANSLATIONS } from "@/hooks/useCategoryLookup";
import { cn, formatPrice, getMediaUrl, getMediaPosterUrl, toPersianDigits } from "@/lib/utils";
import { formatLocationDisplay } from "@/lib/location";
import { formatDistanceToNow } from "date-fns-jalali";
import { adsService } from "@/services/ads.service";
import { AdSummary } from "@/types/api/ads.types";
import { AdStatus } from "@/types/api/enums";
import { LadderIcon } from "@/components/ui/PropertyCard";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
    AlertCircle,
    Archive,
    ArrowUp,
    Building2,
    ChevronLeft,
    ChevronRight,
    Clock,
    ExternalLink,
    Eye,
    ImageIcon,
    Layers,
    Loader2,
    MapPin,
    MoreVertical,
    Pencil,
    Play,
    Plus,
    Send,
    Share2,
    Sparkles,
    Trash2,
    Zap,
} from "lucide-react";
import Image from "next/image";
import { useSafeBack } from "@/hooks/useSafeBack";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useUserStatus } from "@/hooks/useUserStatus";
import { AccountStatusBanner } from "@/components/ui/AccountStatusBanner";
import { PromotionModal } from "@/components/promotions/PromotionModal";
import { AdPublicationFeeModal } from "@/components/wallet/AdPublicationFeeModal";
import { isInsufficientBalanceError, normalizeApiError } from "@/lib/api/error-handler";

type FilterTab = "ALL" | AdStatus;

const FILTER_TABS: { key: FilterTab; label: string }[] = [
    { key: "ALL", label: "همه آگهی‌ها" },
    { key: AdStatus.PUBLISHED, label: "منتشر شده" },
    { key: AdStatus.PENDING_APPROVAL, label: "در حال بررسی" },
    { key: AdStatus.DRAFT, label: "پیش‌نویس" },
    { key: AdStatus.REJECTED, label: "رد شده" },
    { key: AdStatus.ARCHIVED, label: "بایگانی شده" },
];

const STATUS_CONFIG: Record<
    AdStatus,
    { label: string; bg: string; text: string; border: string; dot: string }
> = {
    [AdStatus.PUBLISHED]: {
        label: "منتشر شده",
        bg: "bg-success-subtle/95",
        text: "text-success",
        border: "border-success/30",
        dot: "bg-emerald-500",
    },
    [AdStatus.PENDING_APPROVAL]: {
        label: "در حال بررسی",
        bg: "bg-warning-subtle/95",
        text: "text-warning",
        border: "border-warning/30",
        dot: "bg-amber-500 animate-pulse",
    },
    [AdStatus.DRAFT]: {
        label: "پیش‌نویس",
        bg: "bg-surface/95",
        text: "text-foreground-secondary",
        border: "border-border-subtle",
        dot: "bg-slate-400",
    },
    [AdStatus.REJECTED]: {
        label: "رد شده",
        bg: "bg-error-subtle/95",
        text: "text-error",
        border: "border-error/30",
        dot: "bg-rose-500",
    },
    [AdStatus.ARCHIVED]: {
        label: "بایگانی شده",
        bg: "bg-info-subtle/95",
        text: "text-info",
        border: "border-info/30",
        dot: "bg-sky-400",
    },
    [AdStatus.DELETED]: {
        label: "حذف شده",
        bg: "bg-surface-secondary/95",
        text: "text-foreground-muted",
        border: "border-border-subtle",
        dot: "bg-gray-400",
    },
};

function formatDisplayDate(dateVal?: string | Date | number | null): string {
    if (!dateVal) return "";
    try {
        const d = new Date(dateVal);
        if (isNaN(d.getTime())) return "";
        return toPersianDigits(formatDistanceToNow(d, { addSuffix: true }));
    } catch {
        return "";
    }
}

interface ParsedAdPrice {
    isDualRent: boolean;
    depositLabel?: string;
    depositAmount?: string;
    rentLabel?: string;
    rentAmount?: string;
    primaryLabel?: string;
    primaryAmount: string;
    unit?: string;
}

const parseAdPricing = (pricing?: Record<string, number | boolean | string>): ParsedAdPrice => {
    if (!pricing || Object.keys(pricing).length === 0) {
        return { isDualRent: false, primaryLabel: "قیمت", primaryAmount: "توافقی" };
    }

    const dep = pricing.depositPrice !== undefined ? Number(pricing.depositPrice) : undefined;
    const rent = pricing.monthlyRent !== undefined ? Number(pricing.monthlyRent) : undefined;

    if (dep !== undefined && rent !== undefined && (dep > 0 || rent > 0)) {
        return {
            isDualRent: true,
            depositLabel: "ودیعه / رهن",
            depositAmount: dep > 0 ? formatPrice(dep, "") : "رایگان",
            rentLabel: "اجاره ماهانه",
            rentAmount: rent > 0 ? formatPrice(rent, "") : "رایگان",
            primaryAmount: "",
            unit: "تومان",
        };
    }

    if (pricing.totalPrice !== undefined) {
        const total = Number(pricing.totalPrice);
        return {
            isDualRent: false,
            primaryLabel: "قیمت کل",
            primaryAmount: total > 0 ? formatPrice(total, "") : "توافقی",
            unit: total > 0 ? "تومان" : undefined,
        };
    }

    if (dep !== undefined) {
        const d = Number(dep);
        return {
            isDualRent: false,
            primaryLabel: "ودیعه / رهن",
            primaryAmount: d > 0 ? formatPrice(d, "") : "توافقی",
            unit: d > 0 ? "تومان" : undefined,
        };
    }

    if (rent !== undefined) {
        const r = Number(rent);
        return {
            isDualRent: false,
            primaryLabel: "اجاره ماهانه",
            primaryAmount: r > 0 ? formatPrice(r, "") : "توافقی",
            unit: r > 0 ? "تومان" : undefined,
        };
    }

    if (pricing.estimatedTotalPrice !== undefined) {
        const est = Number(pricing.estimatedTotalPrice);
        return {
            isDualRent: false,
            primaryLabel: "قیمت تخمینی",
            primaryAmount: est > 0 ? formatPrice(est, "") : "توافقی",
            unit: est > 0 ? "تومان" : undefined,
        };
    }

    if (pricing.goodwillPrice !== undefined) {
        const gw = Number(pricing.goodwillPrice);
        return {
            isDualRent: false,
            primaryLabel: "سرقفلی",
            primaryAmount: gw > 0 ? formatPrice(gw, "") : "توافقی",
            unit: gw > 0 ? "تومان" : undefined,
        };
    }

    if (pricing.fractionPrice !== undefined) {
        const fp = Number(pricing.fractionPrice);
        return {
            isDualRent: false,
            primaryLabel: "قدرالسهم",
            primaryAmount: fp > 0 ? formatPrice(fp, "") : "توافقی",
            unit: fp > 0 ? "تومان" : undefined,
        };
    }

    return { isDualRent: false, primaryLabel: "قیمت", primaryAmount: "توافقی" };
};

const getCategoryBadge = (ad: AdSummary): string => {
    if (ad.subcategoryTitle) return ad.subcategoryTitle;
    if (ad.categoryTitle) return ad.categoryTitle;
    if (ad.categoryPath?.subcategoryKey) {
        return DEFAULT_CATEGORY_TRANSLATIONS[ad.categoryPath.subcategoryKey] || ad.categoryPath.subcategoryKey;
    }
    if (ad.categoryPath?.categoryKey) {
        return DEFAULT_CATEGORY_TRANSLATIONS[ad.categoryPath.categoryKey] || ad.categoryPath.categoryKey;
    }
    return "ملک";
};

function getPaginationItems(
    currentStart: number,
    currentEnd: number,
    total: number
): (number | "...")[] {
    if (total <= 9) {
        return Array.from({ length: total }, (_, i) => i + 1);
    }

    const items: (number | "...")[] = [];
    items.push(1);

    if (currentStart > 3) {
        items.push("...");
    }

    const start = Math.max(2, currentStart);
    const end = Math.min(total - 1, currentEnd);

    for (let i = start; i <= end; i++) {
        items.push(i);
    }

    if (currentEnd < total - 2) {
        items.push("...");
    }

    if (total > 1) {
        items.push(total);
    }

    return items.filter((item, index, self) => item === "..." || self.indexOf(item) === index);
}

interface MyAdCardProps {
    ad: AdSummary;
    isSubmitting: boolean;
    onSubmitReview: (adId: string) => void;
    onArchive: (ad: AdSummary) => void;
    onDelete: (ad: AdSummary) => void;
    onShare: (adId: string) => void;
    onPromote?: (ad: AdSummary) => void;
}

function MyAdCard({
    ad,
    isSubmitting,
    onSubmitReview,
    onArchive,
    onDelete,
    onShare,
    onPromote,
}: MyAdCardProps) {
    const router = useRouter();
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement | null>(null);

    const isVideo = Boolean(ad.mediaIds && ad.mediaIds.length > 0 && ad.mediaIds[0]?.type === "VIDEO");
    const initialImgSrc = ad.mediaIds && ad.mediaIds.length > 0
        ? (isVideo ? getMediaPosterUrl(ad.mediaIds[0]) : getMediaUrl(ad.mediaIds[0]))
        : "/property-placeholder.svg";

    const [imgSrc, setImgSrc] = useState<string>(initialImgSrc);

    useEffect(() => {
        setImgSrc(initialImgSrc);
    }, [initialImgSrc]);

    // Close mobile dropdown on outside tap or click
    useEffect(() => {
        if (!menuOpen) return;
        const handleClickOutside = (e: MouseEvent | TouchEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("touchstart", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("touchstart", handleClickOutside);
        };
    }, [menuOpen]);

    const pricing = parseAdPricing(ad.pricing);
    const statusConfig = STATUS_CONFIG[ad.status] || STATUS_CONFIG[AdStatus.DRAFT];
    const categoryBadge = getCategoryBadge(ad);
    const mediaCount = ad.mediaIds?.length || 0;
    const displayLocation = ad.location
        ? formatLocationDisplay(ad.location)
        : ad.cityName || ad.provinceName || "ایران";

    return (
        <div className="group relative flex flex-col h-full bg-surface rounded-2xl border border-border-subtle hover:border-border transition-all duration-300 shadow-2xs hover:shadow-card hover:-translate-y-0.5 overflow-hidden select-none">
            {/* Main Section: Horizontal layout on mobile (< sm), Vertical layout on tablet/desktop (sm+) */}
            <div className="flex flex-row sm:flex-col p-3 sm:p-0 gap-3 sm:gap-0 flex-1 min-w-0">
                {/* Image / Thumbnail Container */}
                <div
                    onClick={() => router.push(`/ads/${ad.adId}`)}
                    className="relative shrink-0 w-28 h-28 min-[380px]:w-32 min-[380px]:h-32 sm:w-full sm:h-auto sm:aspect-[4/3] rounded-xl sm:rounded-none overflow-hidden bg-surface-secondary cursor-pointer"
                >
                    <Image
                        src={imgSrc}
                        alt={ad.title || "ملک"}
                        fill
                        sizes="(max-width: 640px) 140px, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={() => setImgSrc("/property-placeholder.svg")}
                    />

                    {/* Scrim gradients on desktop */}
                    <div className="hidden sm:block absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/55 to-transparent pointer-events-none z-5" />
                    <div className="hidden sm:block absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 to-transparent pointer-events-none z-5" />

                    {/* Desktop Top-Right: Status Pill */}
                    <div className="hidden sm:block absolute top-2.5 right-2.5 z-10">
                        <span
                            className={cn(
                                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold shadow-xs backdrop-blur-md border",
                                statusConfig.bg,
                                statusConfig.text,
                                statusConfig.border
                            )}
                        >
                            <span className={cn("w-2 h-2 rounded-full", statusConfig.dot)} />
                            {statusConfig.label}
                        </span>
                    </div>

                    {/* Top-Left: Badges & Desktop Quick View */}
                    <div className="absolute top-1.5 left-1.5 sm:top-2.5 sm:left-2.5 z-10 flex items-center gap-1 sm:gap-1.5">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                window.open(`/ads/${ad.adId}`, "_blank");
                            }}
                            title="مشاهده آگهی در تب جدید"
                            className="hidden sm:flex w-8 h-8 rounded-xl bg-surface/90 hover:bg-surface text-foreground-muted hover:text-brand shadow-xs items-center justify-center backdrop-blur-md transition-all active:scale-95 border border-white/20 cursor-pointer"
                        >
                            <ExternalLink className="w-3.5 h-3.5" />
                        </button>

                        {ad.isUrgent && (
                            <div className="bg-rose-600 text-white text-[8px] sm:text-[10px] font-black px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg shadow-xs flex items-center gap-0.5 leading-none pointer-events-none">
                                <Zap className="w-2 sm:w-2.5 h-2 sm:h-2.5 fill-white text-white shrink-0" />
                                <span>فوری</span>
                            </div>
                        )}
                        {ad.isLadder && (
                            <div className="bg-blue-600 text-white text-[8px] sm:text-[10px] font-black px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg shadow-xs flex items-center gap-0.5 leading-none pointer-events-none">
                                <LadderIcon className="w-2 sm:w-2.5 h-2 sm:h-2.5 shrink-0" />
                                <span>نردبان</span>
                            </div>
                        )}
                        {ad.isFeatured && (
                            <div className="bg-surface/95 text-warning border border-warning/30 text-[8px] sm:text-[10px] font-black px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg shadow-xs flex items-center gap-0.5 leading-none pointer-events-none">
                                <Sparkles className="w-2 sm:w-2.5 h-2 sm:h-2.5 text-amber-500 shrink-0" />
                                <span>ویژه</span>
                            </div>
                        )}
                    </div>

                    {/* Desktop Bottom-Right: Category Badge */}
                    <div className="hidden sm:block absolute bottom-2.5 right-2.5 z-10 bg-brand/85 backdrop-blur-md text-white text-[10px] sm:text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-xs pointer-events-none">
                        {categoryBadge}
                    </div>

                    {/* Bottom-Left: Media Type / Count */}
                    {isVideo ? (
                        <div className="absolute bottom-1.5 left-1.5 sm:bottom-2.5 sm:left-2.5 z-10 bg-black/65 backdrop-blur-md text-white text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg shadow-xs flex items-center gap-1 pointer-events-none">
                            <Play className="w-2 sm:w-2.5 h-2 sm:h-2.5 fill-white" />
                            <span>ویدیو</span>
                        </div>
                    ) : mediaCount > 1 ? (
                        <div className="absolute bottom-1.5 left-1.5 sm:bottom-2.5 sm:left-2.5 z-10 bg-black/65 backdrop-blur-md text-white text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg shadow-xs flex items-center gap-1 pointer-events-none">
                            <ImageIcon className="w-2.5 sm:w-3 h-2.5 sm:h-3 text-white/90" />
                            <span>{toPersianDigits(mediaCount)}</span>
                        </div>
                    ) : null}
                </div>

                {/* Content Section: Stacked & Responsive */}
                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5 sm:p-4 gap-2">
                    <div className="space-y-1.5 min-w-0">
                        {/* Mobile Status & Category Header */}
                        <div className="sm:hidden flex items-center justify-between gap-1.5">
                            <span
                                className={cn(
                                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border leading-tight shrink-0",
                                    statusConfig.bg,
                                    statusConfig.text,
                                    statusConfig.border
                                )}
                            >
                                <span className={cn("w-1.5 h-1.5 rounded-full", statusConfig.dot)} />
                                {statusConfig.label}
                            </span>
                            <span className="text-[10px] font-medium text-foreground-muted truncate">
                                {categoryBadge}
                            </span>
                        </div>

                        {/* Title */}
                        <h3
                            onClick={() => router.push(`/ads/${ad.adId}`)}
                            className="text-brand font-black text-xs min-[380px]:text-sm sm:text-base line-clamp-2 sm:line-clamp-1 leading-snug group-hover:text-primary transition-colors cursor-pointer"
                            title={ad.title}
                        >
                            {ad.title}
                        </h3>

                        {/* Specs & Location Row */}
                        <div className="flex items-center gap-1.5 text-[10px] min-[380px]:text-[11px] sm:text-xs text-foreground-muted font-medium truncate">
                            {ad.area ? <span>{toPersianDigits(ad.area)} متر</span> : null}
                            {ad.area && ad.rooms ? <span className="text-border">•</span> : null}
                            {ad.rooms ? <span>{toPersianDigits(ad.rooms)} خواب</span> : null}
                            {(ad.area || ad.rooms) && displayLocation ? <span className="text-border">•</span> : null}
                            <span className="truncate">{displayLocation}</span>
                        </div>

                        {/* Date & Location (Desktop) */}
                        {ad.createdAt && (
                            <div className="hidden sm:flex items-center justify-between text-[11px] text-foreground-muted pt-1 border-t border-border-subtle/40">
                                <div className="flex items-center gap-1 truncate" title={displayLocation}>
                                    <MapPin className="w-3.5 h-3.5 shrink-0 text-secondary" />
                                    <span className="truncate">{displayLocation}</span>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                    <Clock className="w-3 h-3 text-secondary" />
                                    <span>{formatDisplayDate(ad.createdAt)}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Pricing Box */}
                    <div className="mt-auto">
                        {pricing.isDualRent ? (
                            <div className="sm:rounded-xl sm:bg-surface-secondary/70 sm:border sm:border-border-subtle/70 sm:p-2.5 space-y-0.5 sm:space-y-1.5">
                                <div className="flex items-center justify-between text-[11px] sm:text-xs">
                                    <span className="text-foreground-muted font-medium text-[10px] sm:text-xs">{pricing.depositLabel}:</span>
                                    <div className="flex items-baseline gap-1">
                                        <span className="font-black text-brand text-xs sm:text-sm">{pricing.depositAmount}</span>
                                        <span className="text-[9px] sm:text-[10px] text-foreground-muted">{pricing.unit}</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between text-[11px] sm:text-xs border-t border-border-subtle/40 sm:border-border-subtle/50 pt-0.5 sm:pt-1.5">
                                    <span className="text-foreground-muted font-medium text-[10px] sm:text-xs">{pricing.rentLabel}:</span>
                                    <div className="flex items-baseline gap-1">
                                        <span className="font-black text-brand text-xs sm:text-sm">{pricing.rentAmount}</span>
                                        <span className="text-[9px] sm:text-[10px] text-foreground-muted">{pricing.unit}</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="sm:rounded-xl sm:bg-surface-secondary/70 sm:border sm:border-border-subtle/70 sm:px-3 sm:py-2 flex items-center justify-between">
                                <span className="text-xs text-foreground-muted font-medium hidden sm:inline">
                                    {pricing.primaryLabel || "قیمت"}:
                                </span>
                                <div className="flex items-baseline gap-1">
                                    <span className="font-black text-brand text-xs min-[380px]:text-sm sm:text-base">
                                        {pricing.primaryAmount}
                                    </span>
                                    {pricing.unit && (
                                        <span className="text-[10px] sm:text-[11px] text-foreground-muted">{pricing.unit}</span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Rejection Alert Notice: Full Width */}
            {ad.status === AdStatus.REJECTED && (
                <div className="mx-3 mb-2.5 sm:mx-4 sm:mb-3 p-2.5 sm:p-3 rounded-xl bg-error-subtle/90 border border-error/25 text-xs text-error space-y-1 animate-in fade-in">
                    <div className="font-black flex items-center gap-1.5 text-xs">
                        <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-error" />
                        <span>آگهی تایید نشد</span>
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-foreground-muted leading-relaxed">
                        تعرفه مسدود شده به موجودی کیف پول شما بازگردانده شد. می‌توانید پس از ویرایش، مجدداً آگهی را ارسال فرمایید.
                    </p>
                </div>
            )}

            {/* Action Bar Footer */}
            <div className="border-t border-border-subtle/80 px-3 py-2 sm:px-4 sm:py-3 bg-surface-secondary/25 sm:bg-transparent flex items-center justify-between gap-2 mt-auto">
                {/* Primary Action Buttons */}
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    {(ad.status === AdStatus.DRAFT || ad.status === AdStatus.REJECTED) && (
                        <button
                            type="button"
                            onClick={() => onSubmitReview(ad.adId)}
                            disabled={isSubmitting}
                            className="bg-primary hover:bg-primary-hover active:bg-primary-active text-primary-foreground font-bold text-[11px] sm:text-xs px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl flex items-center gap-1 sm:gap-1.5 shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer shrink-0 truncate"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-spin shrink-0" />
                            ) : (
                                <Send className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                            )}
                            <span className="truncate">{ad.status === AdStatus.REJECTED ? "ارسال مجدد" : "ارسال برای تایید"}</span>
                        </button>
                    )}

                    {ad.status === AdStatus.PUBLISHED && onPromote && (
                        <button
                            type="button"
                            onClick={() => onPromote(ad)}
                            className="bg-accent hover:bg-accent-hover active:bg-accent-active text-accent-foreground font-black text-[11px] sm:text-xs px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl flex items-center gap-1 sm:gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
                        >
                            <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                            <span>{ad.isFeatured ? "نردبان مجدد" : "ارتقا و نردبان"}</span>
                        </button>
                    )}

                    {[AdStatus.DRAFT, AdStatus.PENDING_APPROVAL, AdStatus.REJECTED, AdStatus.PUBLISHED].includes(ad.status) && (
                        <button
                            type="button"
                            onClick={() => router.push(`/ads/submit?edit=${ad.adId}`)}
                            className="bg-surface-secondary hover:bg-border/30 text-foreground border border-border-subtle font-bold text-[11px] sm:text-xs px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl flex items-center gap-1 sm:gap-1.5 transition-all active:scale-95 cursor-pointer shrink-0"
                        >
                            <Pencil className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-foreground-muted shrink-0" />
                            <span>ویرایش</span>
                        </button>
                    )}
                </div>

                {/* Secondary Actions: Mobile 3-Dots Dropdown Menu + Desktop Icon Group */}
                <div className="flex items-center gap-1 shrink-0">
                    {/* Desktop Toolbar: Direct Icons */}
                    <div className="hidden sm:flex items-center gap-1">
                        <button
                            type="button"
                            onClick={() => router.push(`/ads/${ad.adId}`)}
                            title="مشاهده جزئیات آگهی"
                            className="p-2 text-foreground-muted hover:text-brand hover:bg-surface-secondary rounded-xl transition-colors cursor-pointer"
                        >
                            <Eye className="w-4 h-4" />
                        </button>

                        <button
                            type="button"
                            onClick={() => onShare(ad.adId)}
                            title="اشتراک‌گذاری آگهی"
                            className="p-2 text-foreground-muted hover:text-brand hover:bg-surface-secondary rounded-xl transition-colors cursor-pointer"
                        >
                            <Share2 className="w-4 h-4" />
                        </button>

                        {ad.status === AdStatus.PUBLISHED && (
                            <button
                                type="button"
                                onClick={() => onArchive(ad)}
                                title="بایگانی کردن آگهی"
                                className="p-2 text-foreground-muted hover:text-warning hover:bg-warning-subtle rounded-xl transition-colors cursor-pointer"
                            >
                                <Archive className="w-4 h-4" />
                            </button>
                        )}

                        {[AdStatus.DRAFT, AdStatus.ARCHIVED, AdStatus.REJECTED, AdStatus.PENDING_APPROVAL, AdStatus.PUBLISHED].includes(ad.status) && (
                            <button
                                type="button"
                                onClick={() => onDelete(ad)}
                                title="حذف دائمی آگهی"
                                className="p-2 text-foreground-muted hover:text-error hover:bg-error-subtle rounded-xl transition-colors cursor-pointer"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {/* Mobile Toolbar: Eye + More Menu Popover */}
                    <div className="sm:hidden flex items-center gap-0.5 relative" ref={menuRef}>
                        <button
                            type="button"
                            onClick={() => router.push(`/ads/${ad.adId}`)}
                            title="مشاهده آگهی"
                            className="p-1.5 text-foreground-muted hover:text-brand hover:bg-surface-secondary rounded-lg transition-colors cursor-pointer"
                        >
                            <Eye className="w-4 h-4" />
                        </button>

                        <button
                            type="button"
                            onClick={() => setMenuOpen((prev) => !prev)}
                            title="سایر گزینه‌ها"
                            className={cn(
                                "p-1.5 rounded-lg text-foreground-muted hover:text-brand hover:bg-surface-secondary transition-colors cursor-pointer",
                                menuOpen && "bg-surface-secondary text-brand"
                            )}
                        >
                            <MoreVertical className="w-4 h-4" />
                        </button>

                        {/* Mobile Floating Action Sheet / Dropdown */}
                        {menuOpen && (
                            <div
                                className="absolute left-0 bottom-full mb-1.5 w-44 bg-surface rounded-2xl border border-border-subtle shadow-2xl z-40 py-1.5 animate-in fade-in zoom-in-95 duration-150"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <button
                                    type="button"
                                    onClick={() => {
                                        setMenuOpen(false);
                                        onShare(ad.adId);
                                    }}
                                    className="w-full px-3.5 py-2.5 text-right text-xs font-bold text-foreground hover:bg-surface-secondary flex items-center gap-2 transition-colors cursor-pointer"
                                >
                                    <Share2 className="w-4 h-4 text-foreground-muted" />
                                    <span>اشتراک‌گذاری</span>
                                </button>

                                {ad.status === AdStatus.PUBLISHED && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setMenuOpen(false);
                                            onArchive(ad);
                                        }}
                                        className="w-full px-3.5 py-2.5 text-right text-xs font-bold text-warning hover:bg-warning-subtle flex items-center gap-2 transition-colors cursor-pointer"
                                    >
                                        <Archive className="w-4 h-4" />
                                        <span>بایگانی کردن</span>
                                    </button>
                                )}

                                {[AdStatus.DRAFT, AdStatus.ARCHIVED, AdStatus.REJECTED, AdStatus.PENDING_APPROVAL, AdStatus.PUBLISHED].includes(ad.status) && (
                                    <div className="border-t border-border-subtle/60 my-1 pt-1">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setMenuOpen(false);
                                                onDelete(ad);
                                            }}
                                            className="w-full px-3.5 py-2.5 text-right text-xs font-bold text-error hover:bg-error-subtle flex items-center gap-2 transition-colors cursor-pointer"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            <span>حذف دائمی</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function MyAdsScene() {
    const router = useRouter();
    const handleBack = useSafeBack("/");
    const queryClient = useQueryClient();
    const { isRestricted } = useUserStatus();

    const [activeFilter, setActiveFilter] = useState<FilterTab>("ALL");
    const [startPage, setStartPage] = useState<number>(1);
    const [submittingId, setSubmittingId] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<AdSummary | null>(null);
    const [archiveTarget, setArchiveTarget] = useState<AdSummary | null>(null);
    const [promotingAd, setPromotingAd] = useState<{ id: string; title: string } | null>(null);
    const [feeModalAdId, setFeeModalAdId] = useState<string | null>(null);

    const observerTargetRef = useRef<HTMLDivElement | null>(null);

    // Summary counts for tabs
    const { data: allAdsSummary } = useMyAds({ limit: 100 });

    // Infinite Query with 7 pages limit per batch
    const statusQuery = activeFilter === "ALL" ? undefined : activeFilter;
    const {
        data,
        isLoading,
        isFetchingNextPage,
        hasNextPage,
        fetchNextPage,
    } = useInfiniteMyAds(
        { status: statusQuery, limit: 12 },
        { startPage, maxPages: 7 }
    );

    // Auto-scroll infinite scroll up to 7 pages
    useEffect(() => {
        const target = observerTargetRef.current;
        if (!target) return;

        const currentBatchPageCount = data?.pages.length ?? 0;
        if (currentBatchPageCount >= 7) return;
        if (!hasNextPage || isFetchingNextPage) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    fetchNextPage();
                }
            },
            { rootMargin: "300px" }
        );

        observer.observe(target);
        return () => {
            observer.disconnect();
        };
    }, [hasNextPage, isFetchingNextPage, fetchNextPage, data?.pages.length]);

    const submitMutation = useMutation({
        mutationFn: (adId: string) => adsService.submitForReview(adId),
        onMutate: (adId: string) => {
            setSubmittingId(adId);
        },
        onSuccess: () => {
            toast.success("آگهی با موفقیت برای بررسی ارسال شد");
            queryClient.invalidateQueries({ queryKey: ["my-ads"] });
            queryClient.invalidateQueries({ queryKey: ["my-ads-infinite"] });
            queryClient.invalidateQueries({ queryKey: ["wallet", "balance"] });
        },
        onError: (err: Error, adId: string) => {
            if (isInsufficientBalanceError(err)) {
                toast.error("موجودی کیف پول شما برای پرداخت تعرفه ثبت آگهی کافی نیست.");
                setFeeModalAdId(adId);
                return;
            }
            const message = normalizeApiError(err, "خطا در ارسال آگهی برای بررسی");
            toast.error(message);
        },
        onSettled: () => {
            setSubmittingId(null);
        },
    });

    const archiveMutation = useMutation({
        mutationFn: (adId: string) => adsService.archive(adId),
        onSuccess: () => {
            toast.success("آگهی با موفقیت بایگانی شد");
            queryClient.invalidateQueries({ queryKey: ["my-ads"] });
            queryClient.invalidateQueries({ queryKey: ["my-ads-infinite"] });
            setArchiveTarget(null);
        },
        onError: () => {
            toast.error("خطا در بایگانی آگهی");
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (adId: string) => adsService.delete(adId),
        onSuccess: () => {
            toast.success("آگهی با موفقیت حذف شد");
            queryClient.invalidateQueries({ queryKey: ["my-ads"] });
            queryClient.invalidateQueries({ queryKey: ["my-ads-infinite"] });
            setDeleteTarget(null);
        },
        onError: () => {
            toast.error("خطا در حذف آگهی");
        },
    });

    const handleShare = async (adId: string) => {
        const url = `${window.location.origin}/ads/${adId}`;
        if (navigator.clipboard) {
            try {
                await navigator.clipboard.writeText(url);
                toast.success("لینک آگهی در کلیپ‌بورد کپی شد");
                return;
            } catch {
                // fallback
            }
        }
        toast.info(`آدرس آگهی: ${url}`);
    };

    const handleFilterChange = (tabKey: FilterTab) => {
        setActiveFilter(tabKey);
        setStartPage(1);
    };

    // Calculate tab badge counts
    const allVisibleSummaryAds = useMemo(() => {
        return allAdsSummary?.items.filter((ad) => ad.status !== AdStatus.DELETED) || [];
    }, [allAdsSummary]);

    // All loaded ads across pages in current batch
    const allLoadedAds = useMemo(() => {
        return data?.pages.flatMap((page) => page.items.filter((ad) => ad.status !== AdStatus.DELETED)) || [];
    }, [data]);

    // Pagination metrics
    const totalCount = data?.pages[0]?.total ?? 0;
    const limitPerPage = data?.pages[0]?.limit ?? 12;
    const totalPages = Math.ceil(totalCount / limitPerPage);
    const lastLoadedPage = data?.pages[data.pages.length - 1]?.page ?? startPage;
    const isBatchFinished = (data?.pages.length ?? 0) >= 7 || !hasNextPage;

    const handlePageSelect = (targetPage: number) => {
        const isLoadedInCurrentBatch = data?.pages.some((p) => p.page === targetPage);
        if (isLoadedInCurrentBatch) {
            if (targetPage === startPage) {
                document.getElementById("my-ads-top")?.scrollIntoView({ behavior: "smooth" });
            } else {
                const sectionElem = document.getElementById(`page-section-${targetPage}`);
                if (sectionElem) {
                    sectionElem.scrollIntoView({ behavior: "smooth", block: "start" });
                }
            }
        } else {
            setStartPage(targetPage);
            document.getElementById("my-ads-top")?.scrollIntoView({ behavior: "smooth" });
        }
    };

    const handleNextPage = () => {
        if (lastLoadedPage < totalPages) {
            handlePageSelect(lastLoadedPage + 1);
        }
    };

    const handlePrevPage = () => {
        if (startPage > 1) {
            handlePageSelect(Math.max(1, startPage - 7));
        }
    };

    return (
        <div className="min-h-screen bg-surface-secondary/50 pb-28 lg:pb-10">
            {/* Header */}
            <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur-md border-b border-border-subtle shadow-2xs">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleBack}
                            className="p-2 rounded-xl text-brand hover:bg-surface-secondary transition-colors"
                            aria-label="بازگشت"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-lg sm:text-xl font-black text-brand">آگهی‌های من</h1>
                            </div>
                            <p className="text-xs text-secondary mt-0.5 hidden sm:block">
                                مدیریت، ویرایش و مشاهده وضعیت آگهی‌های ثبت شده شما
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => router.push("/ads/submit")}
                        disabled={isRestricted}
                        className={cn(
                            "font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-xs transition-all active:scale-95 flex items-center gap-1.5 shrink-0 cursor-pointer",
                            isRestricted
                                ? "bg-gray-400 text-white cursor-not-allowed opacity-60"
                                : "bg-primary hover:bg-primary-hover active:bg-primary-active text-primary-foreground"
                        )}
                    >
                        <Plus className="w-4 h-4" />
                        <span>ثبت آگهی جدید</span>
                    </button>
                </div>

                {/* Filter Tabs */}
                {allVisibleSummaryAds.length > 0 && (
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-3">
                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                            {FILTER_TABS.map((tab) => {
                                const count =
                                    tab.key === "ALL"
                                        ? allVisibleSummaryAds.length
                                        : allVisibleSummaryAds.filter((ad) => ad.status === tab.key).length;
                                const isActive = activeFilter === tab.key;

                                return (
                                    <button
                                        key={tab.key}
                                        onClick={() => handleFilterChange(tab.key)}
                                        className={cn(
                                            "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer",
                                            isActive
                                                ? "bg-brand text-white shadow-xs"
                                                : "bg-surface text-secondary hover:bg-surface-secondary border border-border-subtle/60"
                                        )}
                                    >
                                        <span>{tab.label}</span>
                                        <span
                                            className={cn(
                                                "text-[10px] px-1.5 py-0.2 rounded-full",
                                                isActive ? "bg-surface/20 text-white" : "bg-surface-secondary text-secondary"
                                            )}
                                        >
                                            {toPersianDigits(count)}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </header>

            {/* Anchor for top of grid */}
            <div id="my-ads-top" />

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-6">
                {/* Account Status Alert if Suspended/Banned */}
                <AccountStatusBanner className="mb-6" />
                {isLoading ? (
                    /* Initial Skeleton Grid */
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-5">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div
                                key={i}
                                className="bg-surface rounded-2xl border border-border-subtle overflow-hidden shadow-2xs animate-pulse flex flex-col"
                            >
                                <div className="flex flex-row sm:flex-col p-3 sm:p-0 gap-3 sm:gap-0">
                                    <div className="w-28 h-28 min-[380px]:w-32 min-[380px]:h-32 sm:w-full sm:h-auto sm:aspect-[4/3] rounded-xl sm:rounded-none bg-surface-secondary shrink-0" />
                                    <div className="p-0 sm:p-4 space-y-2 flex-1 flex flex-col justify-between py-1">
                                        <div className="space-y-1.5">
                                            <div className="h-3.5 bg-surface-secondary rounded-md w-3/4" />
                                            <div className="h-3 bg-surface-secondary rounded-md w-1/2" />
                                        </div>
                                        <div className="h-6 sm:h-10 bg-surface-secondary/70 rounded-lg sm:rounded-xl w-full" />
                                    </div>
                                </div>
                                <div className="border-t border-border-subtle/80 px-3 py-2 sm:px-4 sm:py-3 flex items-center justify-between">
                                    <div className="flex gap-2">
                                        <div className="h-7 sm:h-8 bg-surface-secondary rounded-xl w-20 sm:w-24" />
                                        <div className="h-7 sm:h-8 bg-surface-secondary rounded-xl w-14 sm:w-16" />
                                    </div>
                                    <div className="flex gap-1">
                                        <div className="h-7 w-7 sm:h-8 sm:w-8 bg-surface-secondary rounded-xl" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : allLoadedAds.length === 0 ? (
                    activeFilter === "ALL" ? (
                        /* Completely Empty State */
                        <div className="text-center py-20 bg-surface rounded-3xl border border-border-subtle p-8 shadow-xs max-w-lg mx-auto">
                            <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                                <Building2 className="w-8 h-8" />
                            </div>
                            <h2 className="text-brand font-black text-lg mb-2">شما هنوز هیچ آگهی‌ای ثبت نکرده‌اید</h2>
                            <p className="text-secondary text-sm leading-relaxed mb-6">
                                با ثبت ملک خود در ملک‌تودی، آگهی شما در معرض دید هزاران متقاضی خرید و اجاره قرار خواهد گرفت.
                            </p>
                            <button
                                onClick={() => router.push("/ads/submit")}
                                className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-xs transition-all active:scale-95 inline-flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                <span>ثبت اولین آگهی</span>
                            </button>
                        </div>
                    ) : (
                        /* Empty Filter State */
                        <div className="text-center py-16 bg-surface rounded-3xl border border-dashed border-border-subtle p-8 max-w-md mx-auto">
                            <AlertCircle className="w-12 h-12 text-secondary/40 mx-auto mb-3" />
                            <h3 className="text-brand font-bold text-base mb-1">
                                هیچ آگهی‌ای با وضعیت «{FILTER_TABS.find((t) => t.key === activeFilter)?.label}» یافت نشد
                            </h3>
                            <p className="text-secondary text-xs mb-5">
                                می‌توانید فیلترهای دیگر را بررسی کنید یا همه آگهی‌های خود را مشاهده نمایید.
                            </p>
                            <button
                                onClick={() => handleFilterChange("ALL")}
                                className="bg-brand text-white px-5 py-2 rounded-xl font-bold text-xs hover:bg-brand/90 transition-colors"
                            >
                                مشاهده همه آگهی‌ها
                            </button>
                        </div>
                    )
                ) : (
                    /* Infinite Scroll Grid with Appended Sections up to Page 7 */
                    <div id="my-ads-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-5">
                        {data?.pages.map((page, pageIndex) => {
                            const pageAds = page.items.filter((ad) => ad.status !== AdStatus.DELETED);
                            if (pageAds.length === 0 && pageIndex > 0) return null;

                            return (
                                <div key={`page-${page.page}`} className="contents">
                                    {/* Section Header for page 2 onwards */}
                                    {pageIndex > 0 && (
                                        <div
                                            id={`page-section-${page.page}`}
                                            className="col-span-full py-5 my-2 flex items-center gap-3 animate-in fade-in duration-300"
                                        >
                                            <div className="h-px bg-gray-200/80 flex-1" />
                                            <div className="flex items-center gap-2 bg-surface px-4 py-1.5 rounded-full border border-border-subtle/80 shadow-2xs text-xs">
                                                <Layers className="w-3.5 h-3.5 text-primary" />
                                                <span className="text-secondary font-medium">بخش / صفحه</span>
                                                <span className="text-brand font-black text-sm">{toPersianDigits(page.page)}</span>
                                                <span className="text-gray-300">•</span>
                                                <span className="text-secondary font-medium">{toPersianDigits(pageAds.length)} آگهی</span>
                                            </div>
                                            <div className="h-px bg-gray-200/80 flex-1" />
                                        </div>
                                    )}

                                    {pageAds.map((ad) => (
                                        <MyAdCard
                                            key={ad.adId}
                                            ad={ad}
                                            isSubmitting={submittingId === ad.adId}
                                            onSubmitReview={(id) => submitMutation.mutate(id)}
                                            onArchive={(target) => setArchiveTarget(target)}
                                            onDelete={(target) => setDeleteTarget(target)}
                                            onShare={handleShare}
                                            onPromote={(target) => setPromotingAd({ id: target.adId, title: target.title })}
                                        />
                                    ))}
                                </div>
                            );
                        })}

                        {/* Sentinel for infinite scroll (auto-loads up to 7 pages) */}
                        {hasNextPage && (data?.pages.length ?? 0) < 7 && (
                            <div ref={observerTargetRef} className="col-span-full py-8 flex flex-col items-center justify-center gap-2">
                                {isFetchingNextPage ? (
                                    <div className="flex items-center gap-2 text-xs font-bold text-secondary bg-surface px-5 py-2.5 rounded-xl shadow-xs border border-border-subtle">
                                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                        <span>در حال بارگذاری بخش بعدی آگهی‌ها...</span>
                                    </div>
                                ) : (
                                    <div className="h-6" />
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Pagination Controls at the End */}
                {!isLoading && allLoadedAds.length > 0 && totalPages > 1 && isBatchFinished && (
                    <div className="mt-12 bg-surface rounded-3xl p-5 sm:p-6 border border-border-subtle shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="text-xs text-secondary font-medium text-center md:text-right">
                            نمایش صفحه <span className="font-bold text-brand">{toPersianDigits(startPage)}</span> تا{" "}
                            <span className="font-bold text-brand">{toPersianDigits(lastLoadedPage)}</span> از{" "}
                            <span className="font-bold text-brand">{toPersianDigits(totalPages)}</span> (مجموع{" "}
                            <span className="font-bold text-brand">{toPersianDigits(totalCount)}</span> آگهی)
                        </div>

                        {/* Page Numbers */}
                        <div className="flex items-center gap-1.5 flex-wrap justify-center">
                            <button
                                type="button"
                                onClick={handlePrevPage}
                                disabled={startPage <= 1}
                                className="px-3 py-2 bg-surface-secondary hover:bg-surface-secondary text-brand rounded-xl font-bold text-xs flex items-center gap-1 border border-border-subtle/60 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <ChevronRight className="w-4 h-4" />
                                <span>صفحه قبل</span>
                            </button>

                            {getPaginationItems(startPage, lastLoadedPage, totalPages).map((item, idx) => {
                                if (item === "...") {
                                    return (
                                        <span key={`ellipsis-${idx}`} className="px-2 text-secondary text-xs select-none">
                                            ...
                                        </span>
                                    );
                                }

                                const isCurrentLoaded = data?.pages.some((p) => p.page === item);
                                const isCurrentStart = item === startPage;

                                return (
                                    <button
                                        key={`page-btn-${item}`}
                                        type="button"
                                        onClick={() => handlePageSelect(item)}
                                        className={cn(
                                            "min-w-9 h-9 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center",
                                            isCurrentStart
                                                ? "bg-brand text-white shadow-xs font-black"
                                                : isCurrentLoaded
                                                ? "bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20"
                                                : "bg-surface-secondary hover:bg-surface-secondary text-secondary border border-border-subtle/60"
                                        )}
                                        title={isCurrentLoaded ? `اسکرول به بخش صفحه ${item}` : `رفتن به صفحه ${item}`}
                                    >
                                        {toPersianDigits(item)}
                                    </button>
                                );
                            })}

                            <button
                                type="button"
                                onClick={handleNextPage}
                                disabled={lastLoadedPage >= totalPages}
                                className="px-3 py-2 bg-surface-secondary hover:bg-surface-secondary text-brand rounded-xl font-bold text-xs flex items-center gap-1 border border-border-subtle/60 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <span>صفحه بعد</span>
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Quick Scroll to Top */}
                        <button
                            type="button"
                            onClick={() => document.getElementById("my-ads-top")?.scrollIntoView({ behavior: "smooth" })}
                            className="hidden lg:flex items-center gap-1 text-xs font-bold text-secondary hover:text-brand transition-colors p-2 rounded-xl hover:bg-surface-secondary"
                        >
                            <ArrowUp className="w-3.5 h-3.5" />
                            <span>بازگشت به بالا</span>
                        </button>
                    </div>
                )}
            </main>

            {/* Delete Confirmation Modal */}
            {deleteTarget && (
                <div role="dialog" aria-modal="true" aria-label="حذف دائمی آگهی" className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-surface rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-border-subtle animate-in zoom-in-95 duration-200">
                        <div className="w-12 h-12 rounded-2xl bg-error-subtle text-error flex items-center justify-center mb-4">
                            <Trash2 className="w-6 h-6" />
                        </div>
                        <h3 className="text-brand font-black text-lg mb-2">حذف دائمی آگهی</h3>
                        <p className="text-secondary text-sm leading-relaxed mb-6">
                            آیا از حذف آگهی <span className="font-bold text-brand">«{deleteTarget.title}»</span> اطمینان دارید؟ این عملیات غیرقابل بازگشت است.
                        </p>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setDeleteTarget(null)}
                                disabled={deleteMutation.isPending}
                                className="flex-1 py-2.5 px-4 rounded-xl border border-border-subtle text-secondary font-bold text-sm hover:bg-surface-secondary transition-colors disabled:opacity-50"
                            >
                                انصراف
                            </button>
                            <button
                                onClick={() => deleteMutation.mutate(deleteTarget.adId)}
                                disabled={deleteMutation.isPending}
                                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm flex items-center justify-center gap-1.5 transition-colors shadow-xs disabled:opacity-50"
                            >
                                {deleteMutation.isPending ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    "حذف آگهی"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Archive Confirmation Modal */}
            {archiveTarget && (
                <div role="dialog" aria-modal="true" aria-label="بایگانی کردن آگهی" className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-surface rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-border-subtle animate-in zoom-in-95 duration-200">
                        <div className="w-12 h-12 rounded-2xl bg-warning-subtle text-warning flex items-center justify-center mb-4">
                            <Archive className="w-6 h-6" />
                        </div>
                        <h3 className="text-brand font-black text-lg mb-2">بایگانی کردن آگهی</h3>
                        <p className="text-secondary text-sm leading-relaxed mb-6">
                            آیا از بایگانی کردن آگهی <span className="font-bold text-brand">«{archiveTarget.title}»</span> اطمینان دارید؟ این آگهی از نتایج جستجو مخفی خواهد شد.
                        </p>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setArchiveTarget(null)}
                                disabled={archiveMutation.isPending}
                                className="flex-1 py-2.5 px-4 rounded-xl border border-border-subtle text-secondary font-bold text-sm hover:bg-surface-secondary transition-colors disabled:opacity-50"
                            >
                                انصراف
                            </button>
                            <button
                                onClick={() => archiveMutation.mutate(archiveTarget.adId)}
                                disabled={archiveMutation.isPending}
                                className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm flex items-center justify-center gap-1.5 transition-colors shadow-xs disabled:opacity-50"
                            >
                                {archiveMutation.isPending ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    "بایگانی آگهی"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Promotion Modal */}
            <PromotionModal
                isOpen={Boolean(promotingAd)}
                onClose={() => setPromotingAd(null)}
                listingId={promotingAd?.id || ""}
                listingTitle={promotingAd?.title || ""}
                itemType="LISTING"
            />

            {/* Ad Publication Fee Modal / Drawer */}
            <AdPublicationFeeModal
                isOpen={Boolean(feeModalAdId)}
                onClose={() => setFeeModalAdId(null)}
                adId={feeModalAdId || undefined}
            />
        </div>
    );
}
