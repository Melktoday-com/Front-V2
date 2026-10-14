"use client";

import { useAds } from "@/hooks/useAds";
import { useAuth } from "@/hooks/useAuth";
import { useCategoryLookup } from "@/hooks/useCategoryLookup";
import { formatPrice, toPersianDigits, getMediaUrl, getMediaPosterUrl } from "@/lib/utils";
import { adminService } from "@/services/admin.service";
import { adsService } from "@/services/ads.service";
import { AdSummary } from "@/types/api/ads.types";
import { AdStatus } from "@/types/api/enums";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
    AlertCircle,
    Archive,
    Building2,
    Calendar,
    Check,
    CheckCircle2,
    Clock,
    Copy,
    ExternalLink,
    Eye,
    Filter,
    Layers,
    MapPin,
    Play,
    Plus,
    RefreshCw,
    Search,
    Sparkles,
    Trash2,
    X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { useMemo, useState } from "react";
import { toast } from "sonner";
import { normalizeApiError } from "@/lib/api/error-handler";
import AdminAdDetailModal from "./AdminAdDetailModal";
import AdminAdRejectModal from "./AdminAdRejectModal";

const STATUS_FILTERS = [
    { key: "ALL", label: "همه", badgeClass: "bg-info-subtle text-blue-800 border-info/30" },
    { key: AdStatus.PUBLISHED, label: "منتشر شده", badgeClass: "bg-success-subtle text-success border-success/30" },
    { key: AdStatus.DRAFT, label: "پیش‌نویس", badgeClass: "bg-surface-secondary text-foreground-secondary border-border-subtle" },
    { key: AdStatus.ARCHIVED, label: "آرشیو شده", badgeClass: "bg-surface-secondary text-foreground-secondary border-border-subtle" },
] as const;

export default function AdminOrgAdsTab() {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const adminId = user?.userId || "";
    const { getCategoryPathLabel } = useCategoryLookup();

    // Filters
    const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [page, setPage] = useState<number>(1);
    const limit = 15;

    // Modals
    const [detailModalAdId, setDetailModalAdId] = useState<string | null>(null);
    const [rejectTarget, setRejectTarget] = useState<{ id: string; title: string } | null>(null);
    const [archiveTarget, setArchiveTarget] = useState<{ id: string; title: string } | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

    const queryParams = useMemo(() => {
        const p: {
            ownerId?: string;
            status?: string;
            page: number;
            limit: number;
        } = {
            ownerId: adminId,
            page,
            limit,
        };
        if (selectedStatus !== "ALL") {
            p.status = selectedStatus;
        }
        return p;
    }, [adminId, selectedStatus, page, limit]);

    const { data: adsData, isLoading, isFetching, refetch } = useAds(
        queryParams,
        { enabled: !!adminId }
    );

    // Count queries
    const { data: publishedData } = useAds({ ownerId: adminId, status: AdStatus.PUBLISHED, limit: 1 }, { enabled: !!adminId });
    const { data: draftData } = useAds({ ownerId: adminId, status: AdStatus.DRAFT, limit: 1 }, { enabled: !!adminId });
    const { data: archivedData } = useAds({ ownerId: adminId, status: AdStatus.ARCHIVED, limit: 1 }, { enabled: !!adminId });

    // Archive mutation
    const archiveMutation = useMutation({
        mutationFn: (id: string) => adsService.archive(id),
        onSuccess: () => {
            toast.success("آگهی با موفقیت آرشیو شد");
            queryClient.invalidateQueries({ queryKey: ["ads"] });
            setArchiveTarget(null);
            refetch();
        },
        onError: (err: Error) => {
            toast.error(normalizeApiError(err, "خطا در آرشیو آگهی"));
        },
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: (id: string) => adsService.delete(id),
        onSuccess: () => {
            toast.success("آگهی با موفقیت حذف شد");
            queryClient.invalidateQueries({ queryKey: ["ads"] });
            setDeleteTarget(null);
            refetch();
        },
        onError: (err: Error) => {
            toast.error(normalizeApiError(err, "خطا در حذف آگهی"));
        },
    });

    // Reject mutation (for published org ads)
    const rejectMutation = useMutation({
        mutationFn: ({ id, reason, note }: { id: string; reason: string; note?: string }) =>
            adminService.rejectListing(id, { reason, note }),
        onSuccess: () => {
            toast.success("آگهی با موفقیت رد شد");
            queryClient.invalidateQueries({ queryKey: ["ads"] });
            setRejectTarget(null);
            refetch();
        },
        onError: (err: Error) => {
            toast.error(normalizeApiError(err, "خطا در رد آگهی"));
        },
    });

    const handleCopy = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} کپی شد`);
    };

    const handleExecuteReject = async (reason: string, note?: string) => {
        if (!rejectTarget) return;
        await rejectMutation.mutateAsync({ id: rejectTarget.id, reason, note });
    };

    // Client-side text filter
    const filteredItems = useMemo(() => {
        if (!adsData?.items) return [];
        if (!searchTerm.trim()) return adsData.items;
        const term = searchTerm.toLowerCase().trim();
        return adsData.items.filter((item) => {
            const titleMatch = item.title?.toLowerCase().includes(term);
            const idMatch = item.adId?.toLowerCase().includes(term);
            return titleMatch || idMatch;
        });
    }, [adsData?.items, searchTerm]);

    const totalPages = Math.ceil((adsData?.total || 0) / limit) || 1;

    const formatAdPrice = (pricing?: Record<string, number | boolean | string>) => {
        if (!pricing || Object.keys(pricing).length === 0) return "توافقی";
        if (pricing.depositPrice !== undefined && pricing.monthlyRent !== undefined) {
            return `رهن ${formatPrice(Number(pricing.depositPrice), "")} - اجاره ${formatPrice(Number(pricing.monthlyRent), "")} تومان`;
        }
        if (pricing.totalPrice !== undefined) {
            const total = Number(pricing.totalPrice);
            return total > 0 ? `${formatPrice(total, "")} تومان` : "توافقی";
        }
        if (pricing.depositPrice !== undefined) {
            const dep = Number(pricing.depositPrice);
            return dep > 0 ? `ودیعه ${formatPrice(dep, "")} تومان` : "توافقی";
        }
        if (pricing.monthlyRent !== undefined) {
            const rent = Number(pricing.monthlyRent);
            return rent > 0 ? `اجاره ${formatPrice(rent, "")} تومان` : "توافقی";
        }
        if (pricing.estimatedTotalPrice !== undefined) {
            const est = Number(pricing.estimatedTotalPrice);
            return est > 0 ? `قیمت کل: ${formatPrice(est, "")} تومان` : "توافقی";
        }
        if (pricing.goodwillPrice !== undefined) {
            const gw = Number(pricing.goodwillPrice);
            return gw > 0 ? `سرقفلی: ${formatPrice(gw, "")} تومان` : "توافقی";
        }
        if (pricing.fractionPrice !== undefined) {
            const fp = Number(pricing.fractionPrice);
            return fp > 0 ? `قدرالسهم: ${formatPrice(fp, "")} تومان` : "توافقی";
        }
        return "توافقی";
    };

    const getStatusBadge = (status: AdStatus) => {
        switch (status) {
            case AdStatus.PUBLISHED:
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-success-subtle text-success">
                        <Check className="w-3 h-3" />
                        <span>منتشر شده</span>
                    </span>
                );
            case AdStatus.DRAFT:
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-surface-secondary text-foreground-secondary">
                        <Clock className="w-3 h-3" />
                        <span>پیش‌نویس</span>
                    </span>
                );
            case AdStatus.ARCHIVED:
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-surface-secondary text-foreground-secondary">
                        <Archive className="w-3 h-3" />
                        <span>آرشیو شده</span>
                    </span>
                );
            case AdStatus.REJECTED:
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-error-subtle text-error">
                        <AlertCircle className="w-3 h-3" />
                        <span>رد شده</span>
                    </span>
                );
            default:
                return null;
        }
    };

    if (!adminId) {
        return (
            <div className="py-20 flex items-center justify-center text-foreground-muted text-sm font-bold">
                در حال بارگذاری اطلاعات ادمین...
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header + Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Published */}
                <div
                    onClick={() => { setSelectedStatus(AdStatus.PUBLISHED); setPage(1); }}
                    className={`cursor-pointer p-5 rounded-2xl border transition-all ${
                        selectedStatus === AdStatus.PUBLISHED
                            ? "bg-emerald-500/10 border-emerald-500/40 shadow-sm ring-2 ring-emerald-500/20"
                            : "bg-surface border-border-subtle/80 hover:border-border"
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-foreground-muted">منتشر شده</p>
                            <h3 className="text-2xl font-black text-foreground mt-1">
                                {toPersianDigits(publishedData?.total ?? 0)}
                            </h3>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-success-subtle text-success flex items-center justify-center">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                    </div>
                    <p className="mt-2 text-xs text-success font-medium">در حال نمایش برای کاربران</p>
                </div>

                {/* Draft */}
                <div
                    onClick={() => { setSelectedStatus(AdStatus.DRAFT); setPage(1); }}
                    className={`cursor-pointer p-5 rounded-2xl border transition-all ${
                        selectedStatus === AdStatus.DRAFT
                            ? "bg-slate-200/60 border-border shadow-sm ring-2 ring-slate-400/20"
                            : "bg-surface border-border-subtle/80 hover:border-border"
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-foreground-muted">پیش‌نویس</p>
                            <h3 className="text-2xl font-black text-foreground mt-1">
                                {toPersianDigits(draftData?.total ?? 0)}
                            </h3>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-surface-secondary text-foreground-secondary flex items-center justify-center">
                            <Clock className="w-6 h-6" />
                        </div>
                    </div>
                    <p className="mt-2 text-xs text-foreground-secondary font-medium">ذخیره شده، هنوز منتشر نشده</p>
                </div>

                {/* Archived */}
                <div
                    onClick={() => { setSelectedStatus(AdStatus.ARCHIVED); setPage(1); }}
                    className={`cursor-pointer p-5 rounded-2xl border transition-all ${
                        selectedStatus === AdStatus.ARCHIVED
                            ? "bg-zinc-200/70 border-border shadow-sm ring-2 ring-zinc-400/20"
                            : "bg-surface border-border-subtle/80 hover:border-border"
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-foreground-muted">آرشیو شده</p>
                            <h3 className="text-2xl font-black text-foreground mt-1">
                                {toPersianDigits(archivedData?.total ?? 0)}
                            </h3>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-surface-secondary text-foreground-secondary flex items-center justify-center">
                            <Archive className="w-6 h-6" />
                        </div>
                    </div>
                    <p className="mt-2 text-xs text-foreground-secondary font-medium">منقضی یا دستی آرشیو شده</p>
                </div>
            </div>

            {/* Info Banner */}
            <div className="flex items-start gap-3 p-4 bg-violet-50 border border-violet-200 rounded-2xl">
                <div className="w-8 h-8 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Layers className="w-4 h-4" />
                </div>
                <div>
                    <p className="text-xs font-black text-violet-800">آگهی‌های سازمانی پلتفرم</p>
                    <p className="text-xs text-violet-600 mt-0.5 leading-relaxed">
                        این آگهی‌ها توسط تیم مدیریت به نام پلتفرم ثبت شده‌اند و بلافاصله پس از ایجاد منتشر می‌شوند.
                        برای ثبت آگهی جدید از دکمه زیر استفاده کنید.
                    </p>
                </div>
                <Link
                    href="/admin/ads/create"
                    className="mr-auto shrink-0 inline-flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-black shadow-sm transition-colors whitespace-nowrap"
                >
                    <Plus className="w-3.5 h-3.5" />
                    ثبت آگهی سازمانی
                </Link>
            </div>

            {/* Filter Bar */}
            <div className="bg-surface p-5 rounded-2xl border border-border-subtle shadow-xs space-y-4">
                {/* Status Tabs */}
                <div className="flex flex-wrap items-center gap-2 border-b border-border-subtle pb-4">
                    <span className="text-xs font-bold text-foreground-muted ml-2">وضعیت:</span>
                    {STATUS_FILTERS.map((f) => {
                        const isActive = selectedStatus === f.key;
                        let count: number | undefined;
                        if (f.key === AdStatus.PUBLISHED) count = publishedData?.total;
                        else if (f.key === AdStatus.DRAFT) count = draftData?.total;
                        else if (f.key === AdStatus.ARCHIVED) count = archivedData?.total;
                        else if (f.key === "ALL") count = (publishedData?.total ?? 0) + (draftData?.total ?? 0) + (archivedData?.total ?? 0);

                        return (
                            <button
                                key={f.key}
                                type="button"
                                onClick={() => { setSelectedStatus(f.key); setPage(1); }}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                    isActive
                                        ? "bg-violet-600 text-white shadow-xs"
                                        : "bg-surface-secondary hover:bg-surface-secondary text-foreground-secondary border border-border-subtle"
                                }`}
                            >
                                <span>{f.label}</span>
                                {count !== undefined && (
                                    <span className={`px-1.5 rounded-full text-[11px] font-black ${isActive ? "bg-surface/20 text-white" : "bg-slate-200 text-foreground-secondary"}`}>
                                        {toPersianDigits(count)}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Search + Refresh */}
                <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="جستجو در عنوان یا شناسه آگهی..."
                            className="w-full pl-9 pr-10 py-2.5 bg-surface-secondary border border-border-subtle rounded-xl text-xs text-foreground placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all font-medium"
                        />
                        {searchTerm && (
                            <button
                                type="button"
                                onClick={() => setSearchTerm("")}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground-secondary"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={() => refetch()}
                        disabled={isFetching}
                        className="px-4 py-2.5 bg-surface-secondary hover:bg-surface-secondary border border-border-subtle text-foreground-secondary rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin text-violet-600" : ""}`} />
                        بروزرسانی
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-surface rounded-2xl border border-border-subtle shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-right">
                        <thead className="bg-surface-secondary/80 text-foreground-secondary text-xs border-b border-border-subtle">
                            <tr>
                                <th className="px-5 py-4 font-bold">عنوان آگهی</th>
                                <th className="px-5 py-4 font-bold">دسته‌بندی</th>
                                <th className="px-5 py-4 font-bold">قیمت</th>
                                <th className="px-5 py-4 font-bold">وضعیت</th>
                                <th className="px-5 py-4 font-bold">تاریخ ثبت</th>
                                <th className="px-5 py-4 font-bold text-center">عملیات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="py-20 text-center text-foreground-muted">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <RefreshCw className="w-6 h-6 animate-spin text-violet-600" />
                                            <span className="font-bold">در حال بارگذاری آگهی‌های سازمانی...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredItems.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-20 text-center">
                                        <div className="flex flex-col items-center justify-center gap-3 max-w-sm mx-auto">
                                            <div className="w-14 h-14 rounded-2xl bg-violet-50 text-violet-400 flex items-center justify-center">
                                                <Layers className="w-7 h-7" />
                                            </div>
                                            <p className="font-black text-foreground-secondary text-sm mt-1">
                                                هیچ آگهی سازمانی یافت نشد
                                            </p>
                                            <p className="text-foreground-muted text-xs leading-relaxed text-center">
                                                هنوز آگهی سازمانی ثبت نکرده‌اید یا با فیلتر انتخابی آگهی‌ای وجود ندارد.
                                            </p>
                                            <Link
                                                href="/admin/ads/create"
                                                className="mt-1 inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold transition-colors"
                                            >
                                                <Plus className="w-3.5 h-3.5" />
                                                ثبت اولین آگهی سازمانی
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredItems.map((ad: AdSummary) => {
                                    const mediaUrl = getMediaPosterUrl(ad.mediaIds?.[0]);
                                    const hasMedia = !!ad.mediaIds?.[0] && mediaUrl !== "/property-placeholder.svg";

                                    return (
                                        <tr key={ad.adId} className="hover:bg-surface-secondary/70 transition-colors group">
                                            {/* Thumbnail & Title */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-surface-secondary border border-border-subtle shrink-0 flex items-center justify-center">
                                                        {hasMedia ? (
                                                            <>
                                                                <Image
                                                                    src={mediaUrl}
                                                                    alt={ad.title}
                                                                    fill
                                                                    unoptimized
                                                                    className="object-cover"
                                                                />
                                                                {ad.mediaIds?.[0]?.type === "VIDEO" && (
                                                                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                                                        <Play className="w-3.5 h-3.5 text-white fill-white" />
                                                                    </div>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <Building2 className="w-5 h-5 text-foreground-muted" />
                                                        )}
                                                    </div>
                                                    <div className="min-w-0 max-w-xs">
                                                        <div className="flex items-center gap-1.5">
                                                            <h4
                                                                onClick={() => setDetailModalAdId(ad.adId)}
                                                                className="font-black text-foreground truncate hover:text-violet-600 transition-colors cursor-pointer"
                                                            >
                                                                {ad.title}
                                                            </h4>
                                                            {/* Org badge */}
                                                            <span className="shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-violet-100 text-violet-700 text-[10px] font-black">
                                                                <Layers className="w-2.5 h-2.5" />
                                                                سازمانی
                                                            </span>
                                                            {ad.isFeatured && (
                                                                <span className="shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-warning-subtle text-warning text-[10px] font-black">
                                                                    <Sparkles className="w-2.5 h-2.5" />
                                                                    ویژه
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-0.5 text-foreground-muted">
                                                            <span className="font-mono text-[11px]">
                                                                ID: {ad.adId.slice(0, 8)}...
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleCopy(ad.adId, "شناسه آگهی")}
                                                                title="کپی شناسه کامل"
                                                                className="hover:text-foreground-secondary p-0.5"
                                                            >
                                                                <Copy className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Category */}
                                            <td className="px-5 py-4 text-foreground-secondary">
                                                <span className="bg-surface-secondary text-foreground-secondary px-2.5 py-1 rounded-lg text-[11px] font-bold">
                                                    {getCategoryPathLabel(ad.categoryPath?.categoryKey, ad.categoryPath?.subcategoryKey)}
                                                </span>
                                            </td>

                                            {/* Price */}
                                            <td className="px-5 py-4">
                                                <div className="font-black text-success">
                                                    {formatAdPrice(ad.pricing)}
                                                </div>
                                            </td>

                                            {/* Status */}
                                            <td className="px-5 py-4">
                                                {getStatusBadge(ad.status)}
                                            </td>

                                            {/* Date */}
                                            <td className="px-5 py-4 text-foreground-muted font-medium">
                                                {new Date(ad.createdAt).toLocaleDateString("fa-IR")}
                                            </td>

                                            {/* Actions */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    {/* View detail */}
                                                    <button
                                                        type="button"
                                                        onClick={() => setDetailModalAdId(ad.adId)}
                                                        title="مشاهده جزئیات"
                                                        className="p-2 rounded-xl text-info hover:bg-info-subtle transition-colors"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>

                                                    {/* Archive (only for published/draft) */}
                                                    {ad.status !== AdStatus.ARCHIVED && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setArchiveTarget({ id: ad.adId, title: ad.title })}
                                                            title="آرشیو کردن آگهی"
                                                            className="p-2 rounded-xl text-foreground-muted hover:bg-surface-secondary transition-colors"
                                                        >
                                                            <Archive className="w-4 h-4" />
                                                        </button>
                                                    )}

                                                    {/* Delete */}
                                                    <button
                                                        type="button"
                                                        onClick={() => setDeleteTarget({ id: ad.adId, title: ad.title })}
                                                        title="حذف دائمی آگهی"
                                                        className="p-2 rounded-xl text-error hover:bg-error-subtle transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>

                                                    {/* External link */}
                                                    {ad.status === AdStatus.PUBLISHED && (
                                                        <Link
                                                            href={`/ads/${ad.adId}`}
                                                            target="_blank"
                                                            title="مشاهده در سایت"
                                                            className="p-2 rounded-xl text-foreground-muted hover:bg-surface-secondary transition-colors"
                                                        >
                                                            <ExternalLink className="w-4 h-4" />
                                                        </Link>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {adsData && adsData.total > limit && (
                    <div className="p-4 border-t border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                        <span className="text-foreground-muted font-medium">
                            صفحه {toPersianDigits(page)} از {toPersianDigits(totalPages)} (مجموع {toPersianDigits(adsData.total)} آگهی)
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
                            <span className="px-3 py-1.5 bg-violet-50 text-violet-700 rounded-xl font-black">
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

            {/* Detail Modal */}
            <AdminAdDetailModal
                adId={detailModalAdId}
                isOpen={!!detailModalAdId}
                onClose={() => setDetailModalAdId(null)}
            />

            {/* Reject Modal */}
            {rejectTarget && (
                <AdminAdRejectModal
                    isOpen={!!rejectTarget}
                    adId={rejectTarget.id}
                    adTitle={rejectTarget.title}
                    onClose={() => setRejectTarget(null)}
                    onConfirm={handleExecuteReject}
                    isSubmitting={rejectMutation.isPending}
                />
            )}

            {/* Archive Confirm Modal */}
            {archiveTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
                    <div className="bg-surface rounded-3xl w-full max-w-md p-6 shadow-2xl border border-border-subtle text-right space-y-4" dir="rtl">
                        <div className="w-12 h-12 rounded-2xl bg-surface-secondary text-foreground-secondary flex items-center justify-center mx-auto">
                            <Archive className="w-6 h-6" />
                        </div>
                        <div className="text-center space-y-1">
                            <h3 className="text-base font-black text-foreground">آرشیو کردن آگهی</h3>
                            <p className="text-xs text-foreground-muted leading-relaxed">
                                آیا از آرشیو کردن آگهی «<span className="font-bold text-foreground-secondary">{archiveTarget.title}</span>» اطمینان دارید؟
                                آگهی از نمایش عمومی خارج می‌شود.
                            </p>
                        </div>
                        <div className="flex items-center gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => archiveMutation.mutate(archiveTarget.id)}
                                disabled={archiveMutation.isPending}
                                className="flex-1 py-2.5 bg-zinc-600 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                            >
                                {archiveMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Archive className="w-4 h-4" />}
                                آرشیو کن
                            </button>
                            <button
                                type="button"
                                onClick={() => setArchiveTarget(null)}
                                disabled={archiveMutation.isPending}
                                className="flex-1 py-2.5 bg-surface-secondary hover:bg-slate-200 text-foreground-secondary rounded-xl text-xs font-bold transition-colors"
                            >
                                انصراف
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirm Modal */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
                    <div className="bg-surface rounded-3xl w-full max-w-md p-6 shadow-2xl border border-border-subtle text-right space-y-4" dir="rtl">
                        <div className="w-12 h-12 rounded-2xl bg-error-subtle text-error flex items-center justify-center mx-auto">
                            <Trash2 className="w-6 h-6" />
                        </div>
                        <div className="text-center space-y-1">
                            <h3 className="text-base font-black text-foreground">حذف دائمی آگهی</h3>
                            <p className="text-xs text-foreground-muted leading-relaxed">
                                آیا از حذف دائمی آگهی «<span className="font-bold text-foreground-secondary">{deleteTarget.title}</span>» اطمینان دارید؟
                                این عملیات قابل بازگشت نیست.
                            </p>
                        </div>
                        <div className="flex items-center gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => deleteMutation.mutate(deleteTarget.id)}
                                disabled={deleteMutation.isPending}
                                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                            >
                                {deleteMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                حذف دائمی
                            </button>
                            <button
                                type="button"
                                onClick={() => setDeleteTarget(null)}
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
