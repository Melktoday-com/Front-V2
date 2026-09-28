"use client";

import { useInfiniteMyAds, useMyAds } from "@/hooks/useAds";
import { DEFAULT_CATEGORY_TRANSLATIONS } from "@/hooks/useCategoryLookup";
import { cn, formatPrice, getMediaUrl, toPersianDigits } from "@/lib/utils";
import { adsService } from "@/services/ads.service";
import { AdSummary } from "@/types/api/ads.types";
import { AdStatus } from "@/types/api/enums";
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
    Layers,
    Loader2,
    MapPin,
    Pencil,
    Plus,
    Send,
    Share2,
    Trash2,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

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
        bg: "bg-emerald-50/95",
        text: "text-emerald-700",
        border: "border-emerald-200/80",
        dot: "bg-emerald-500",
    },
    [AdStatus.PENDING_APPROVAL]: {
        label: "در حال بررسی",
        bg: "bg-amber-50/95",
        text: "text-amber-700",
        border: "border-amber-200/80",
        dot: "bg-amber-500 animate-pulse",
    },
    [AdStatus.DRAFT]: {
        label: "پیش‌نویس",
        bg: "bg-slate-50/95",
        text: "text-slate-700",
        border: "border-slate-200",
        dot: "bg-slate-400",
    },
    [AdStatus.REJECTED]: {
        label: "رد شده",
        bg: "bg-rose-50/95",
        text: "text-rose-700",
        border: "border-rose-200/80",
        dot: "bg-rose-500",
    },
    [AdStatus.ARCHIVED]: {
        label: "بایگانی شده",
        bg: "bg-purple-50/95",
        text: "text-purple-700",
        border: "border-purple-200/80",
        dot: "bg-purple-400",
    },
    [AdStatus.DELETED]: {
        label: "حذف شده",
        bg: "bg-gray-50/95",
        text: "text-gray-400",
        border: "border-gray-200",
        dot: "bg-gray-400",
    },
};

const formatAdPrice = (pricing?: Record<string, number>): { price: string; unit?: string } => {
    if (!pricing || Object.keys(pricing).length === 0) {
        return { price: "توافقی" };
    }
    if (pricing.mortgagePrice !== undefined && pricing.rentPrice !== undefined) {
        return {
            price: `رهن ${formatPrice(pricing.mortgagePrice, "")} - اجاره ${formatPrice(pricing.rentPrice, "")}`,
            unit: "تومان",
        };
    }
    if (pricing.deposit !== undefined && pricing.monthlyRent !== undefined) {
        return {
            price: `ودیعه ${formatPrice(pricing.deposit, "")} - اجاره ${formatPrice(pricing.monthlyRent, "")}`,
            unit: "تومان",
        };
    }
    if (pricing.totalPrice !== undefined) {
        return { price: `${formatPrice(pricing.totalPrice, "")} تومان` };
    }
    if (pricing.nightlyPrice !== undefined) {
        return { price: `${formatPrice(pricing.nightlyPrice, "")} تومان`, unit: "/شب" };
    }
    const firstVal = Object.values(pricing)[0];
    if (typeof firstVal === "number" && firstVal > 0) {
        return { price: `${formatPrice(firstVal, "")} تومان` };
    }
    return { price: "توافقی" };
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
}

function MyAdCard({
    ad,
    isSubmitting,
    onSubmitReview,
    onArchive,
    onDelete,
    onShare,
}: MyAdCardProps) {
    const router = useRouter();
    const [imgSrc, setImgSrc] = useState<string>(
        ad.mediaIds && ad.mediaIds.length > 0
            ? getMediaUrl(ad.mediaIds[0])
            : "/property-placeholder.svg"
    );

    const pricingDisplay = formatAdPrice(ad.pricing);
    const statusConfig = STATUS_CONFIG[ad.status] || STATUS_CONFIG[AdStatus.DRAFT];
    const categoryBadge = getCategoryBadge(ad);

    return (
        <div className="group flex flex-col h-full bg-white rounded-2xl border border-gray-100 hover:border-gray-200/90 shadow-xs hover:shadow-md transition-all duration-300 overflow-hidden">
            {/* Image Container */}
            <div className="relative aspect-[16/10] sm:aspect-[4/3] w-full overflow-hidden bg-gray-50">
                <Image
                    src={imgSrc}
                    alt={ad.title || "ملک"}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={() => setImgSrc("/property-placeholder.svg")}
                />

                {/* Top-Right: Status Pill */}
                <div className="absolute top-2.5 right-2.5 z-10">
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

                {/* Top-Left: View quick action */}
                <button
                    onClick={() => window.open(`/ads/${ad.adId}`, "_blank")}
                    title="مشاهده آگهی در صفحه جدید"
                    className="absolute top-2.5 left-2.5 z-10 w-8 h-8 rounded-full bg-white/85 hover:bg-white text-brand/80 hover:text-brand shadow-xs flex items-center justify-center backdrop-blur-md transition-all active:scale-95"
                >
                    <ExternalLink className="w-4 h-4" />
                </button>

                {/* Bottom-Right: Category Badge */}
                <div className="absolute bottom-2.5 right-2.5 z-10 bg-brand/85 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-0.5 rounded-lg shadow-xs">
                    {categoryBadge}
                </div>
            </div>

            {/* Content Section */}
            <div className="p-4 flex flex-col flex-1 min-w-0">
                {/* Zillow style: Price first in bold */}
                <div className="flex items-baseline gap-1">
                    <span className="text-brand font-black text-base lg:text-lg">
                        {pricingDisplay.price}
                    </span>
                    {pricingDisplay.unit && (
                        <span className="text-xs text-text-light">{pricingDisplay.unit}</span>
                    )}
                </div>

                {/* Title */}
                <h3
                    onClick={() => router.push(`/ads/${ad.adId}`)}
                    className="text-brand font-bold text-sm lg:text-base line-clamp-1 mt-1.5 group-hover:text-primary transition-colors cursor-pointer"
                    title={ad.title}
                >
                    {ad.title}
                </h3>

                {/* Location & Date */}
                <div className="flex items-center justify-between gap-2 mt-2 text-text-light text-xs">
                    <div className="flex items-center gap-1 min-w-0 truncate">
                        <MapPin className="w-3.5 h-3.5 shrink-0 text-secondary" />
                        <span className="truncate">{ad.cityName || ad.provinceName || "ایران"}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 text-[11px]">
                        <Clock className="w-3 h-3 text-secondary" />
                        <span>{new Date(ad.createdAt).toLocaleDateString("fa-IR")}</span>
                    </div>
                </div>

                {/* Action Bar Footer */}
                <div className="border-t border-gray-100/90 pt-3 mt-4 flex items-center justify-between gap-2">
                    {/* Primary Action Button */}
                    <div className="flex items-center gap-2">
                        {(ad.status === AdStatus.DRAFT || ad.status === AdStatus.REJECTED) && (
                            <button
                                onClick={() => onSubmitReview(ad.adId)}
                                disabled={isSubmitting}
                                className="bg-primary hover:bg-primary/90 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-xs transition-all active:scale-95 disabled:opacity-50"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                    <Send className="w-3.5 h-3.5" />
                                )}
                                <span>ارسال برای تایید</span>
                            </button>
                        )}

                        {[AdStatus.DRAFT, AdStatus.PENDING_APPROVAL, AdStatus.REJECTED, AdStatus.PUBLISHED].includes(ad.status) && (
                            <button
                                onClick={() => router.push(`/ads/submit?edit=${ad.adId}`)}
                                className="bg-brand/5 hover:bg-brand/10 text-brand font-bold text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors active:scale-95"
                            >
                                <Pencil className="w-3.5 h-3.5" />
                                <span>ویرایش</span>
                            </button>
                        )}
                    </div>

                    {/* Secondary Actions */}
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => router.push(`/ads/${ad.adId}`)}
                            title="مشاهده آگهی"
                            className="p-2 text-secondary hover:text-brand hover:bg-soft-bg rounded-xl transition-colors"
                        >
                            <Eye className="w-4 h-4" />
                        </button>

                        <button
                            onClick={() => onShare(ad.adId)}
                            title="اشتراک‌گذاری"
                            className="p-2 text-secondary hover:text-brand hover:bg-soft-bg rounded-xl transition-colors"
                        >
                            <Share2 className="w-4 h-4" />
                        </button>

                        {ad.status === AdStatus.PUBLISHED && (
                            <button
                                onClick={() => onArchive(ad)}
                                title="بایگانی کردن آگهی"
                                className="p-2 text-secondary hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-colors"
                            >
                                <Archive className="w-4 h-4" />
                            </button>
                        )}

                        {[AdStatus.DRAFT, AdStatus.ARCHIVED, AdStatus.REJECTED, AdStatus.PENDING_APPROVAL, AdStatus.PUBLISHED].includes(ad.status) && (
                            <button
                                onClick={() => onDelete(ad)}
                                title="حذف آگهی"
                                className="p-2 text-secondary hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function MyAdsScene() {
    const router = useRouter();
    const queryClient = useQueryClient();

    const [activeFilter, setActiveFilter] = useState<FilterTab>("ALL");
    const [startPage, setStartPage] = useState<number>(1);
    const [submittingId, setSubmittingId] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<AdSummary | null>(null);
    const [archiveTarget, setArchiveTarget] = useState<AdSummary | null>(null);

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
        },
        onError: () => {
            toast.error("خطا در ارسال آگهی برای بررسی");
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
        <div className="min-h-screen bg-gray-50/50 pb-28">
            {/* Header */}
            <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-2xs">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.back()}
                            className="p-2 rounded-xl text-brand hover:bg-gray-100 transition-colors"
                            aria-label="بازگشت"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-lg sm:text-xl font-black text-brand">آگهی‌های من</h1>
                                {!isLoading && (
                                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-brand/5 text-brand">
                                        {toPersianDigits(totalCount)} آگهی
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-secondary mt-0.5 hidden sm:block">
                                مدیریت، ویرایش و مشاهده وضعیت آگهی‌های ثبت شده شما
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => router.push("/ads/submit")}
                        className="bg-primary hover:bg-primary/90 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-xs transition-all active:scale-95 flex items-center gap-1.5 shrink-0"
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
                                            "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5",
                                            isActive
                                                ? "bg-brand text-white shadow-xs"
                                                : "bg-white text-secondary hover:bg-gray-100 border border-gray-200/60"
                                        )}
                                    >
                                        <span>{tab.label}</span>
                                        <span
                                            className={cn(
                                                "text-[10px] px-1.5 py-0.2 rounded-full",
                                                isActive ? "bg-white/20 text-white" : "bg-gray-100 text-secondary"
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
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {isLoading ? (
                    /* Initial Skeleton Grid */
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div
                                key={i}
                                className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-xs animate-pulse"
                            >
                                <div className="aspect-[16/10] sm:aspect-[4/3] bg-gray-100 w-full" />
                                <div className="p-4 space-y-3">
                                    <div className="h-5 bg-gray-100 rounded-md w-1/3" />
                                    <div className="h-4 bg-gray-100 rounded-md w-3/4" />
                                    <div className="flex justify-between pt-2">
                                        <div className="h-3 bg-gray-100 rounded-md w-1/4" />
                                        <div className="h-3 bg-gray-100 rounded-md w-1/4" />
                                    </div>
                                    <div className="border-t border-gray-100 pt-3 flex justify-between">
                                        <div className="h-8 bg-gray-100 rounded-xl w-1/3" />
                                        <div className="h-8 bg-gray-100 rounded-xl w-1/4" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : allLoadedAds.length === 0 ? (
                    activeFilter === "ALL" ? (
                        /* Completely Empty State */
                        <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 p-8 shadow-xs max-w-lg mx-auto">
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
                        <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-200 p-8 max-w-md mx-auto">
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
                    <div id="my-ads-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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
                                            <div className="flex items-center gap-2 bg-white px-4 py-1.5 rounded-full border border-gray-200/80 shadow-2xs text-xs">
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
                                        />
                                    ))}
                                </div>
                            );
                        })}

                        {/* Sentinel for infinite scroll (auto-loads up to 7 pages) */}
                        {hasNextPage && (data?.pages.length ?? 0) < 7 && (
                            <div ref={observerTargetRef} className="col-span-full py-8 flex flex-col items-center justify-center gap-2">
                                {isFetchingNextPage ? (
                                    <div className="flex items-center gap-2 text-xs font-bold text-secondary bg-white px-5 py-2.5 rounded-xl shadow-xs border border-gray-100">
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
                    <div className="mt-12 bg-white rounded-3xl p-5 sm:p-6 border border-gray-100 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
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
                                className="px-3 py-2 bg-gray-50 hover:bg-gray-100 text-brand rounded-xl font-bold text-xs flex items-center gap-1 border border-gray-200/60 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
                                                : "bg-gray-50 hover:bg-gray-100 text-secondary border border-gray-200/60"
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
                                className="px-3 py-2 bg-gray-50 hover:bg-gray-100 text-brand rounded-xl font-bold text-xs flex items-center gap-1 border border-gray-200/60 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <span>صفحه بعد</span>
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Quick Scroll to Top */}
                        <button
                            type="button"
                            onClick={() => document.getElementById("my-ads-top")?.scrollIntoView({ behavior: "smooth" })}
                            className="hidden lg:flex items-center gap-1 text-xs font-bold text-secondary hover:text-brand transition-colors p-2 rounded-xl hover:bg-gray-50"
                        >
                            <ArrowUp className="w-3.5 h-3.5" />
                            <span>بازگشت به بالا</span>
                        </button>
                    </div>
                )}
            </main>

            {/* Delete Confirmation Modal */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200">
                        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
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
                                className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 text-secondary font-bold text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
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
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200">
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
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
                                className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 text-secondary font-bold text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
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
        </div>
    );
}
