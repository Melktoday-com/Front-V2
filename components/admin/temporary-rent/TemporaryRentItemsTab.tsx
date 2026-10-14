"use client";

import { useCities } from "@/hooks/useGeo";
import {
    useDeleteTemporaryRent,
    usePublishTemporaryRent,
    useTemporaryRentAds,
} from "@/hooks/useTemporaryRent";
import { formatPrice, toPersianDigits, getMediaUrl, getMediaPosterUrl } from "@/lib/utils";
import { TemporaryRentAdSummary } from "@/services/temporary-rent.service";
import type { TemporaryRentPricingReadModel } from "@/types/api/temporary-rent.types";
import {
    AlertCircle,
    Building2,
    Calendar,
    Check,
    CheckCircle2,
    Clock,
    Copy,
    ExternalLink,
    Eye,
    Filter,
    HelpCircle,
    Home,
    Layers,
    MapPin,
    Play,
    RefreshCw,
    Search,
    SlidersHorizontal,
    Trash2,
    User,
    Users,
    X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { useMemo, useState } from "react";
import { toast } from "sonner";
import TemporaryRentItemDetailModal from "./TemporaryRentItemDetailModal";

const STATUS_FILTERS = [
    { key: "PENDING_APPROVAL", label: "در انتظار بررسی", badgeClass: "bg-warning-subtle text-warning border-warning/30" },
    { key: "PUBLISHED", label: "منتشر شده", badgeClass: "bg-success-subtle text-success border-success/30" },
    { key: "DRAFT", label: "پیش‌نویس", badgeClass: "bg-surface-secondary text-foreground-secondary border-border-subtle" },
    { key: "REJECTED", label: "رد شده", badgeClass: "bg-error-subtle text-error border-error/30" },
    { key: "ARCHIVED", label: "آرشیو شده", badgeClass: "bg-surface-secondary text-foreground-secondary border-border-subtle" },
    { key: "ALL", label: "همه وضعیت‌ها", badgeClass: "bg-info-subtle text-blue-800 border-info/30" },
] as const;

function formatTemporaryRentPrice(pricing?: TemporaryRentPricingReadModel | null): { formatted: string; hasCurrency: boolean } {
    if (!pricing) return { formatted: "توافقی", hasCurrency: false };
    switch (pricing.priceModelKey) {
        case "DAILY_RENT_STANDARD":
            return {
                formatted: formatPrice(pricing.pricing.nightlyPrice, ""),
                hasCurrency: pricing.pricing.nightlyPrice > 0,
            };
        case "WEEKLY_MONTHLY_RENT":
            return {
                formatted: formatPrice(pricing.pricing.nightlyPrice, ""),
                hasCurrency: pricing.pricing.nightlyPrice > 0,
            };
        case "WEEKEND_PEAK_RENT": {
            const amount = pricing.pricing.midweekNightlyPrice || pricing.pricing.weekendNightlyPrice;
            return {
                formatted: formatPrice(amount, ""),
                hasCurrency: amount > 0,
            };
        }
        case "EVENT_VENUE_RENT":
            return {
                formatted: formatPrice(pricing.pricing.eventBasePrice, ""),
                hasCurrency: pricing.pricing.eventBasePrice > 0,
            };
        case null:
            return {
                formatted: formatPrice(pricing.legacyNightlyPrice, ""),
                hasCurrency: pricing.legacyNightlyPrice > 0,
            };
        default:
            return {
                formatted: "توافقی",
                hasCurrency: false,
            };
    }
}

export default function TemporaryRentItemsTab() {
    // Filter & Search states
    const [selectedStatus, setSelectedStatus] = useState<string>("PENDING_APPROVAL");
    const [selectedCityId, setSelectedCityId] = useState<string>("");
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [page, setPage] = useState<number>(1);
    const limit = 15;

    // Modals
    const [detailModalAdId, setDetailModalAdId] = useState<string | null>(null);
    const [deleteTargetAd, setDeleteTargetAd] = useState<{ id: string; title: string } | null>(null);

    // Queries
    const queryParams = useMemo(() => {
        const p: { status?: string; cityId?: string; page: number; limit: number } = {
            page,
            limit,
        };
        if (selectedStatus !== "ALL") {
            p.status = selectedStatus;
        }
        if (selectedCityId) {
            p.cityId = selectedCityId;
        }
        return p;
    }, [selectedStatus, selectedCityId, page, limit]);

    const {
        data: adsData,
        isLoading,
        isFetching,
        refetch,
    } = useTemporaryRentAds(queryParams);

    // Fetch counts for status badges
    const { data: pendingData } = useTemporaryRentAds({ status: "PENDING_APPROVAL", limit: 1 });
    const { data: publishedData } = useTemporaryRentAds({ status: "PUBLISHED", limit: 1 });
    const { data: draftData } = useTemporaryRentAds({ status: "DRAFT", limit: 1 });

    // Cities for filter
    const { data: citiesData } = useCities({ limit: 100 });
    const citiesList = useMemo(() => {
        if (!citiesData) return [];
        return citiesData.items || [];
    }, [citiesData]);

    // Mutations
    const publishMutation = usePublishTemporaryRent();
    const deleteMutation = useDeleteTemporaryRent();

    const handleCopy = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} کپی شد`);
    };

    const handlePublish = async (adId: string) => {
        try {
            await publishMutation.mutateAsync(adId);
            toast.success("اقامتگاه با موفقیت تایید و منتشر شد");
            refetch();
        } catch (err) {
            const msg = err instanceof Error ? err.message : "خطا در تایید و انتشار اقامتگاه";
            toast.error(msg);
        }
    };

    const confirmDelete = async () => {
        if (!deleteTargetAd) return;
        try {
            await deleteMutation.mutateAsync(deleteTargetAd.id);
            toast.success("اقامتگاه با موفقیت حذف شد");
            setDeleteTargetAd(null);
            if (detailModalAdId === deleteTargetAd.id) {
                setDetailModalAdId(null);
            }
            refetch();
        } catch (err) {
            const msg = err instanceof Error ? err.message : "خطا در حذف اقامتگاه";
            toast.error(msg);
        }
    };

    // Client-side text filter on the current page items
    const filteredItems = useMemo(() => {
        if (!adsData?.items) return [];
        if (!searchTerm.trim()) return adsData.items;

        const term = searchTerm.toLowerCase().trim();
        return adsData.items.filter((item) => {
            const titleMatch = item.title?.toLowerCase().includes(term);
            const idMatch = item.id?.toLowerCase().includes(term);
            const ownerMatch = item.ownerId?.toLowerCase().includes(term);
            const cityMatch = item.cityName?.toLowerCase().includes(term);
            return titleMatch || idMatch || ownerMatch || cityMatch;
        });
    }, [adsData?.items, searchTerm]);

    const totalPages = Math.ceil((adsData?.total || 0) / limit) || 1;

    return (
        <div className="space-y-6">
            {/* Top Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div
                    onClick={() => {
                        setSelectedStatus("PENDING_APPROVAL");
                        setPage(1);
                    }}
                    className={`cursor-pointer p-5 rounded-2xl border transition-all ${
                        selectedStatus === "PENDING_APPROVAL"
                            ? "bg-amber-500/10 border-amber-500/40 shadow-sm ring-2 ring-amber-500/20"
                            : "bg-surface border-border-subtle/80 hover:border-border"
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-foreground-muted">در انتظار تایید و بررسی</p>
                            <h3 className="text-2xl font-black text-foreground mt-1">
                                {toPersianDigits(pendingData?.total ?? 0)}
                            </h3>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-warning-subtle text-warning flex items-center justify-center">
                            <Clock className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="mt-3 text-xs text-warning font-medium flex items-center gap-1">
                        <span>نیاز به بازبینی توسط مدیر</span>
                    </div>
                </div>

                <div
                    onClick={() => {
                        setSelectedStatus("PUBLISHED");
                        setPage(1);
                    }}
                    className={`cursor-pointer p-5 rounded-2xl border transition-all ${
                        selectedStatus === "PUBLISHED"
                            ? "bg-emerald-500/10 border-emerald-500/40 shadow-sm ring-2 ring-emerald-500/20"
                            : "bg-surface border-border-subtle/80 hover:border-border"
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-foreground-muted">اقامتگاه‌های منتشر شده</p>
                            <h3 className="text-2xl font-black text-foreground mt-1">
                                {toPersianDigits(publishedData?.total ?? 0)}
                            </h3>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-success-subtle text-success flex items-center justify-center">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="mt-3 text-xs text-success font-medium flex items-center gap-1">
                        <span>فعال و قابل رزرو در پلتفرم</span>
                    </div>
                </div>

                <div
                    onClick={() => {
                        setSelectedStatus("DRAFT");
                        setPage(1);
                    }}
                    className={`cursor-pointer p-5 rounded-2xl border transition-all ${
                        selectedStatus === "DRAFT"
                            ? "bg-slate-200/60 border-border shadow-sm ring-2 ring-slate-400/20"
                            : "bg-surface border-border-subtle/80 hover:border-border"
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-foreground-muted">پیش‌نویس‌ها</p>
                            <h3 className="text-2xl font-black text-foreground mt-1">
                                {toPersianDigits(draftData?.total ?? 0)}
                            </h3>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-surface-secondary text-foreground-secondary flex items-center justify-center">
                            <Layers className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="mt-3 text-xs text-foreground-muted font-medium flex items-center gap-1">
                        <span>هنوز برای انتشار ارسال نشده‌اند</span>
                    </div>
                </div>

                <div
                    onClick={() => {
                        setSelectedStatus("ALL");
                        setPage(1);
                    }}
                    className={`cursor-pointer p-5 rounded-2xl border transition-all ${
                        selectedStatus === "ALL"
                            ? "bg-blue-500/10 border-blue-500/40 shadow-sm ring-2 ring-blue-500/20"
                            : "bg-surface border-border-subtle/80 hover:border-border"
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-foreground-muted">کل آیتم‌های اجاره موقت</p>
                            <h3 className="text-2xl font-black text-foreground mt-1">
                                {toPersianDigits(adsData?.total ?? 0)}
                            </h3>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-info-subtle text-info flex items-center justify-center">
                            <Home className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="mt-3 text-xs text-info font-medium flex items-center gap-1">
                        <span>تمام رکوردها در کلیه وضعیت‌ها</span>
                    </div>
                </div>
            </div>

            {/* Filters and Controls Card */}
            <div className="bg-surface p-5 rounded-2xl border border-border-subtle shadow-xs space-y-4">
                {/* Status Badges Filter Bar */}
                <div className="flex flex-wrap items-center gap-2 border-b border-border-subtle pb-4">
                    <span className="text-xs font-bold text-foreground-muted ml-2">وضعیت:</span>
                    {STATUS_FILTERS.map((f) => {
                        const isActive = selectedStatus === f.key;
                        let count: number | undefined;
                        if (f.key === "PENDING_APPROVAL") count = pendingData?.total;
                        else if (f.key === "PUBLISHED") count = publishedData?.total;
                        else if (f.key === "DRAFT") count = draftData?.total;

                        return (
                            <button
                                key={f.key}
                                type="button"
                                onClick={() => {
                                    setSelectedStatus(f.key);
                                    setPage(1);
                                }}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                    isActive
                                        ? "bg-emerald-600 text-white shadow-xs"
                                        : "bg-surface-secondary hover:bg-surface-secondary text-foreground-secondary border border-border-subtle"
                                }`}
                            >
                                <span>{f.label}</span>
                                {count !== undefined && (
                                    <span
                                        className={`px-1.5 py-0.2 rounded-full text-[11px] font-black ${
                                            isActive
                                                ? "bg-surface/20 text-white"
                                                : "bg-slate-200 text-foreground-secondary"
                                        }`}
                                    >
                                        {toPersianDigits(count)}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Search and Secondary Filters */}
                <div className="flex flex-col sm:flex-row items-center gap-3">
                    {/* Search Input */}
                    <div className="relative flex-1 w-full">
                        <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="جستجو در عنوان، شناسه اقامتگاه یا شناسه مالک..."
                            className="w-full pl-9 pr-10 py-2.5 bg-surface-secondary border border-border-subtle rounded-xl text-xs text-foreground placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                        />
                        {searchTerm && (
                            <button
                                type="button"
                                onClick={() => setSearchTerm("")}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground-secondary p-0.5"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    {/* City Selector Filter */}
                    <div className="w-full sm:w-60">
                        <select
                            value={selectedCityId}
                            onChange={(e) => {
                                setSelectedCityId(e.target.value);
                                setPage(1);
                            }}
                            className="w-full px-3 py-2.5 bg-surface-secondary border border-border-subtle rounded-xl text-xs text-foreground-secondary focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer font-bold"
                        >
                            <option value="">همه شهرها</option>
                            {citiesList.map((city) => (
                                <option key={city.id} value={city.id}>
                                    {city.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Refresh Button */}
                    <button
                        type="button"
                        onClick={() => refetch()}
                        disabled={isFetching}
                        title="بروزرسانی داده‌ها"
                        className="w-full sm:w-auto px-4 py-2.5 bg-surface-secondary hover:bg-surface-secondary border border-border-subtle text-foreground-secondary rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin text-success" : ""}`} />
                        <span className="sm:hidden">بروزرسانی</span>
                    </button>
                </div>
            </div>

            {/* Table View */}
            <div className="bg-surface rounded-2xl border border-border-subtle shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-right">
                        <thead className="bg-surface-secondary/80 text-foreground-secondary text-xs border-b border-border-subtle">
                            <tr>
                                <th className="px-5 py-4 font-bold">اقامتگاه</th>
                                <th className="px-5 py-4 font-bold">شهر و منطقه</th>
                                <th className="px-5 py-4 font-bold">نرخ هر شب</th>
                                <th className="px-5 py-4 font-bold">ظرفیت</th>
                                <th className="px-5 py-4 font-bold">وضعیت</th>
                                <th className="px-5 py-4 font-bold">تاریخ ثبت</th>
                                <th className="px-5 py-4 font-bold text-center">عملیات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={7} className="py-20 text-center text-foreground-muted">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <RefreshCw className="w-6 h-6 animate-spin text-success" />
                                            <span className="font-bold">در حال بارگذاری لیست اقامتگاه‌ها...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredItems.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-20 text-center">
                                        <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                                            <div className="w-12 h-12 rounded-2xl bg-surface-secondary text-foreground-muted flex items-center justify-center">
                                                <Home className="w-6 h-6" />
                                            </div>
                                            <p className="font-black text-foreground-secondary text-sm mt-2">
                                                هیچ اقامتگاهی با شرایط انتخابی یافت نشد
                                            </p>
                                            <p className="text-foreground-muted text-xs leading-relaxed">
                                                فیلتر وضعیت یا عبارت جستجوی خود را تغییر دهید تا آیتم‌های مورد نظر نمایش داده شوند.
                                            </p>
                                            {(selectedStatus !== "ALL" || selectedCityId || searchTerm) && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedStatus("ALL");
                                                        setSelectedCityId("");
                                                        setSearchTerm("");
                                                        setPage(1);
                                                    }}
                                                    className="mt-3 px-4 py-2 bg-success-subtle hover:bg-success-subtle text-success rounded-xl text-xs font-bold transition-colors"
                                                >
                                                    پاک کردن تمام فیلترها
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredItems.map((item: TemporaryRentAdSummary) => {
                                    const mediaUrl = getMediaPosterUrl(item.mediaIds?.[0]);
                                    const hasMedia = !!item.mediaIds?.[0] && mediaUrl !== "/property-placeholder.svg";

                                    return (
                                        <tr
                                            key={item.id}
                                            className="hover:bg-surface-secondary/70 transition-colors group"
                                        >
                                            {/* Thumbnail & Title */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-surface-secondary border border-border-subtle shrink-0 flex items-center justify-center">
                                                        {hasMedia ? (
                                                            <>
                                                                <Image
                                                                    src={mediaUrl}
                                                                    alt={item.title}
                                                                    fill
                                                                    unoptimized
                                                                    className="object-cover"
                                                                />
                                                                {item.mediaIds?.[0]?.type === "VIDEO" && (
                                                                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                                                        <Play className="w-3.5 h-3.5 text-white fill-white" />
                                                                    </div>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <Building2 className="w-5 h-5 text-foreground-muted" />
                                                        )}
                                                    </div>
                                                    <div className="min-w-0 max-w-xs sm:max-w-sm">
                                                        <h4
                                                            onClick={() => setDetailModalAdId(item.id)}
                                                            className="font-black text-foreground truncate hover:text-success transition-colors cursor-pointer"
                                                        >
                                                            {item.title}
                                                        </h4>
                                                        <div className="flex items-center gap-2 mt-0.5 text-foreground-muted">
                                                            <span className="font-mono text-[11px]">
                                                                ID: {item.id.slice(0, 8)}...
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleCopy(item.id, "شناسه اقامتگاه")}
                                                                title="کپی شناسه کامل"
                                                                className="hover:text-foreground-secondary p-0.5"
                                                            >
                                                                <Copy className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* City */}
                                            <td className="px-5 py-4 text-foreground-secondary">
                                                <div className="flex items-center gap-1 font-bold">
                                                    <MapPin className="w-3.5 h-3.5 text-foreground-muted shrink-0" />
                                                    <span>{item.cityName || item.cityId || "نامشخص"}</span>
                                                </div>
                                            </td>

                                            {/* Nightly Price */}
                                            <td className="px-5 py-4">
                                                {(() => {
                                                    const trPrice = formatTemporaryRentPrice(item.pricing);
                                                    return (
                                                        <div className="font-black text-success">
                                                            {trPrice.formatted}
                                                            {trPrice.hasCurrency && (
                                                                <span className="text-[10px] text-foreground-muted font-bold mr-1">
                                                                    تومان
                                                                </span>
                                                            )}
                                                        </div>
                                                    );
                                                })()}
                                            </td>

                                            {/* Guests */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-1 text-foreground-secondary font-bold">
                                                    <Users className="w-3.5 h-3.5 text-foreground-muted shrink-0" />
                                                    <span>{toPersianDigits(item.maxGuests || 1)} نفر</span>
                                                </div>
                                            </td>

                                            {/* Status Badge */}
                                            <td className="px-5 py-4">
                                                {item.status === "PENDING_APPROVAL" && (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-warning-subtle text-warning">
                                                        <Clock className="w-3 h-3" />
                                                        <span>در انتظار بررسی</span>
                                                    </span>
                                                )}
                                                {item.status === "PUBLISHED" && (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-success-subtle text-success">
                                                        <Check className="w-3 h-3" />
                                                        <span>منتشر شده</span>
                                                    </span>
                                                )}
                                                {item.status === "DRAFT" && (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-surface-secondary text-foreground-secondary">
                                                        <span>پیش‌نویس</span>
                                                    </span>
                                                )}
                                                {item.status === "REJECTED" && (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-error-subtle text-error">
                                                        <AlertCircle className="w-3 h-3" />
                                                        <span>رد شده</span>
                                                    </span>
                                                )}
                                                {item.status === "ARCHIVED" && (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-surface-secondary text-foreground-secondary">
                                                        <span>آرشیو شده</span>
                                                    </span>
                                                )}
                                            </td>

                                            {/* Registered Date */}
                                            <td className="px-5 py-4 text-foreground-muted font-medium">
                                                {new Date(item.createdAt).toLocaleDateString("fa-IR")}
                                            </td>

                                            {/* Action Buttons */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    {/* Quick Approve / Publish */}
                                                    {item.status !== "PUBLISHED" && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handlePublish(item.id)}
                                                            disabled={publishMutation.isPending}
                                                            title="تایید و انتشار اقامتگاه"
                                                            className="p-2 rounded-xl text-success hover:bg-success-subtle transition-colors disabled:opacity-50"
                                                        >
                                                            <Check className="w-4 h-4" />
                                                        </button>
                                                    )}

                                                    {/* View Modal Detail */}
                                                    <button
                                                        type="button"
                                                        onClick={() => setDetailModalAdId(item.id)}
                                                        title="بررسی جزئیات کامل"
                                                        className="p-2 rounded-xl text-info hover:bg-info-subtle transition-colors"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>

                                                    {/* External link to public ad */}
                                                    <Link
                                                        href={`/temporary-rent/${item.id}`}
                                                        target="_blank"
                                                        title="مشاهده در صفحه اصلی سایت"
                                                        className="p-2 rounded-xl text-foreground-muted hover:bg-surface-secondary transition-colors"
                                                    >
                                                        <ExternalLink className="w-4 h-4" />
                                                    </Link>

                                                    {/* Delete */}
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setDeleteTargetAd({
                                                                id: item.id,
                                                                title: item.title,
                                                            })
                                                        }
                                                        title="حذف اقامتگاه"
                                                        className="p-2 rounded-xl text-error hover:bg-error-subtle transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {adsData && adsData.total > limit && (
                    <div className="p-4 border-t border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                        <span className="text-foreground-muted font-medium">
                            نمایش صفحه {toPersianDigits(page)} از {toPersianDigits(totalPages)} (مجموع{" "}
                            {toPersianDigits(adsData.total)} اقامتگاه)
                        </span>

                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page <= 1}
                                className="px-3 py-1.5 bg-surface-secondary hover:bg-surface-secondary border border-border-subtle text-foreground-secondary rounded-xl font-bold transition-colors disabled:opacity-40"
                            >
                                صفحه قبل
                            </button>
                            <span className="px-3 py-1.5 bg-success-subtle text-success rounded-xl font-black">
                                {toPersianDigits(page)}
                            </span>
                            <button
                                type="button"
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page >= totalPages}
                                className="px-3 py-1.5 bg-surface-secondary hover:bg-surface-secondary border border-border-subtle text-foreground-secondary rounded-xl font-bold transition-colors disabled:opacity-40"
                            >
                                صفحه بعد
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Inspection & Detail Modal */}
            <TemporaryRentItemDetailModal
                adId={detailModalAdId}
                isOpen={!!detailModalAdId}
                onClose={() => setDetailModalAdId(null)}
                onPublish={handlePublish}
                isPublishing={publishMutation.isPending}
                onDelete={(id) => {
                    const item = adsData?.items.find((i) => i.id === id);
                    setDeleteTargetAd({
                        id,
                        title: item?.title || "این اقامتگاه",
                    });
                }}
            />

            {/* Delete Confirmation Modal */}
            {deleteTargetAd && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
                    <div className="bg-surface rounded-3xl w-full max-w-md p-6 shadow-2xl border border-border-subtle text-right space-y-4" dir="rtl">
                        <div className="w-12 h-12 rounded-2xl bg-error-subtle text-error flex items-center justify-center mx-auto">
                            <Trash2 className="w-6 h-6" />
                        </div>

                        <div className="text-center space-y-1">
                            <h3 className="text-base font-black text-foreground">
                                حذف اقامتگاه اجاره موقت
                            </h3>
                            <p className="text-xs text-foreground-muted leading-relaxed">
                                آیا از حذف اقامتگاه «<span className="font-bold text-foreground-secondary">{deleteTargetAd.title}</span>» اطمینان دارید؟ این عملیات غیرقابل بازگشت است.
                            </p>
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                            <button
                                type="button"
                                onClick={confirmDelete}
                                disabled={deleteMutation.isPending}
                                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                            >
                                {deleteMutation.isPending ? (
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Trash2 className="w-4 h-4" />
                                )}
                                <span>بله، حذف کن</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setDeleteTargetAd(null)}
                                disabled={deleteMutation.isPending}
                                className="flex-1 py-2.5 bg-surface-secondary hover:bg-slate-200 text-foreground-secondary rounded-xl text-xs font-bold transition-colors"
                            >
                                انصراف
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
