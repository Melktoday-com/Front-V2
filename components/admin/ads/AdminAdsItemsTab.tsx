"use client";

import { useCities } from "@/hooks/useGeo";
import { useAds, useCategories } from "@/hooks/useAds";
import { formatPrice, toPersianDigits } from "@/lib/utils";
import { adminService } from "@/services/admin.service";
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
    FolderTree,
    Layers,
    MapPin,
    RefreshCw,
    Search,
    ShieldAlert,
    Sparkles,
    Trash2,
    X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { useMemo, useState } from "react";
import { toast } from "sonner";
import AdminAdDetailModal from "./AdminAdDetailModal";
import AdminAdRejectModal from "./AdminAdRejectModal";

const STATUS_FILTERS = [
    { key: AdStatus.PENDING_APPROVAL, label: "در انتظار بررسی", badgeClass: "bg-amber-100 text-amber-800 border-amber-200" },
    { key: AdStatus.PUBLISHED, label: "منتشر شده", badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200" },
    { key: AdStatus.REJECTED, label: "رد شده", badgeClass: "bg-rose-100 text-rose-800 border-rose-200" },
    { key: AdStatus.ARCHIVED, label: "آرشیو شده", badgeClass: "bg-zinc-100 text-zinc-700 border-zinc-200" },
    { key: AdStatus.DRAFT, label: "پیش‌نویس", badgeClass: "bg-slate-100 text-slate-700 border-slate-200" },
    { key: "ALL", label: "همه وضعیت‌ها", badgeClass: "bg-blue-100 text-blue-800 border-blue-200" },
] as const;

export default function AdminAdsItemsTab() {
    const queryClient = useQueryClient();

    // Filters
    const [selectedStatus, setSelectedStatus] = useState<string>(AdStatus.PENDING_APPROVAL);
    const [selectedCityId, setSelectedCityId] = useState<string>("");
    const [selectedCategoryKey, setSelectedCategoryKey] = useState<string>("");
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [page, setPage] = useState<number>(1);
    const limit = 15;

    // Modals
    const [detailModalAdId, setDetailModalAdId] = useState<string | null>(null);
    const [rejectTarget, setRejectTarget] = useState<{ id: string; title: string } | null>(null);
    const [approveConfirmTarget, setApproveConfirmTarget] = useState<{ id: string; title: string } | null>(null);

    // Queries
    const queryParams = useMemo(() => {
        const p: {
            status?: string;
            cityId?: string;
            categoryKey?: string;
            page: number;
            limit: number;
        } = {
            page,
            limit,
        };
        if (selectedStatus !== "ALL") {
            p.status = selectedStatus;
        }
        if (selectedCityId) {
            p.cityId = selectedCityId;
        }
        if (selectedCategoryKey) {
            p.categoryKey = selectedCategoryKey;
        }
        return p;
    }, [selectedStatus, selectedCityId, selectedCategoryKey, page, limit]);

    const { data: adsData, isLoading, isFetching, refetch } = useAds(queryParams);

    // Status counts
    const { data: pendingData } = useAds({ status: AdStatus.PENDING_APPROVAL, limit: 1 });
    const { data: publishedData } = useAds({ status: AdStatus.PUBLISHED, limit: 1 });
    const { data: rejectedData } = useAds({ status: AdStatus.REJECTED, limit: 1 });
    const { data: archivedData } = useAds({ status: AdStatus.ARCHIVED, limit: 1 });

    // Cities
    const { data: citiesData } = useCities({ limit: 100 });
    const citiesList = useMemo(() => citiesData?.items || [], [citiesData]);

    // Categories
    const { data: categoriesData } = useCategories();
    const categoriesList = useMemo(() => {
        if (!categoriesData) return [];
        return Array.isArray(categoriesData) ? categoriesData : [];
    }, [categoriesData]);

    // Approve Mutation
    const approveMutation = useMutation({
        mutationFn: ({ id, note }: { id: string; note?: string }) =>
            adminService.approveListing(id, { note }),
        onSuccess: () => {
            toast.success("آگهی با موفقیت تایید و منتشر شد");
            queryClient.invalidateQueries({ queryKey: ["ads"] });
            setApproveConfirmTarget(null);
            refetch();
        },
        onError: (err: unknown) => {
            const msg = err instanceof Error ? err.message : "خطا در تایید آگهی";
            toast.error(msg);
        },
    });

    // Reject Mutation
    const rejectMutation = useMutation({
        mutationFn: ({ id, reason, note }: { id: string; reason: string; note?: string }) =>
            adminService.rejectListing(id, { reason, note }),
        onSuccess: () => {
            toast.success("آگهی با موفقیت رد شد");
            queryClient.invalidateQueries({ queryKey: ["ads"] });
            setRejectTarget(null);
            if (detailModalAdId === rejectTarget?.id) {
                setDetailModalAdId(null);
            }
            refetch();
        },
        onError: (err: unknown) => {
            const msg = err instanceof Error ? err.message : "خطا در رد آگهی";
            toast.error(msg);
        },
    });

    const handleCopy = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} کپی شد`);
    };

    const handleExecuteReject = async (reason: string, note?: string) => {
        if (!rejectTarget) return;
        await rejectMutation.mutateAsync({
            id: rejectTarget.id,
            reason,
            note,
        });
    };

    const handleExecuteApprove = async () => {
        if (!approveConfirmTarget) return;
        await approveMutation.mutateAsync({
            id: approveConfirmTarget.id,
        });
    };

    // Client-side text filter on current page items
    const filteredItems = useMemo(() => {
        if (!adsData?.items) return [];
        if (!searchTerm.trim()) return adsData.items;

        const term = searchTerm.toLowerCase().trim();
        return adsData.items.filter((item) => {
            const titleMatch = item.title?.toLowerCase().includes(term);
            const idMatch = item.adId?.toLowerCase().includes(term);
            const ownerMatch = item.ownerId?.toLowerCase().includes(term);
            const categoryMatch = `${item.categoryPath?.categoryKey} ${item.categoryPath?.subcategoryKey}`
                .toLowerCase()
                .includes(term);
            return titleMatch || idMatch || ownerMatch || categoryMatch;
        });
    }, [adsData?.items, searchTerm]);

    const totalPages = Math.ceil((adsData?.total || 0) / limit) || 1;

    // Helper to format price for standard ads
    const formatAdPrice = (pricing?: Record<string, number>) => {
        if (!pricing || Object.keys(pricing).length === 0) return "توافقی";
        if (pricing.totalPrice) return `${formatPrice(pricing.totalPrice, "")} تومان`;
        if (pricing.deposit || pricing.monthlyRent) {
            const dep = pricing.deposit ? `${formatPrice(pricing.deposit, "")} ودیعه` : "";
            const rent = pricing.monthlyRent ? `${formatPrice(pricing.monthlyRent, "")} اجاره` : "";
            return [dep, rent].filter(Boolean).join(" / ");
        }
        const firstVal = Object.values(pricing)[0];
        return typeof firstVal === "number" ? `${formatPrice(firstVal, "")} تومان` : "توافقی";
    };

    return (
        <div className="space-y-6">
            {/* Top Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div
                    onClick={() => {
                        setSelectedStatus(AdStatus.PENDING_APPROVAL);
                        setPage(1);
                    }}
                    className={`cursor-pointer p-5 rounded-2xl border transition-all ${
                        selectedStatus === AdStatus.PENDING_APPROVAL
                            ? "bg-amber-500/10 border-amber-500/40 shadow-sm ring-2 ring-amber-500/20"
                            : "bg-white border-slate-200/80 hover:border-slate-300"
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-slate-500">در انتظار تایید و بررسی</p>
                            <h3 className="text-2xl font-black text-slate-900 mt-1">
                                {toPersianDigits(pendingData?.total ?? 0)}
                            </h3>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                            <Clock className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="mt-3 text-xs text-amber-700 font-medium flex items-center gap-1">
                        <span>نیاز به بررسی محتوا و تایید ادمین</span>
                    </div>
                </div>

                <div
                    onClick={() => {
                        setSelectedStatus(AdStatus.PUBLISHED);
                        setPage(1);
                    }}
                    className={`cursor-pointer p-5 rounded-2xl border transition-all ${
                        selectedStatus === AdStatus.PUBLISHED
                            ? "bg-emerald-500/10 border-emerald-500/40 shadow-sm ring-2 ring-emerald-500/20"
                            : "bg-white border-slate-200/80 hover:border-slate-300"
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-slate-500">آگهی‌های منتشر شده</p>
                            <h3 className="text-2xl font-black text-slate-900 mt-1">
                                {toPersianDigits(publishedData?.total ?? 0)}
                            </h3>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="mt-3 text-xs text-emerald-700 font-medium flex items-center gap-1">
                        <span>فعال و در حال نمایش برای عموم کاربران</span>
                    </div>
                </div>

                <div
                    onClick={() => {
                        setSelectedStatus(AdStatus.REJECTED);
                        setPage(1);
                    }}
                    className={`cursor-pointer p-5 rounded-2xl border transition-all ${
                        selectedStatus === AdStatus.REJECTED
                            ? "bg-rose-500/10 border-rose-500/40 shadow-sm ring-2 ring-rose-500/20"
                            : "bg-white border-slate-200/80 hover:border-slate-300"
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-slate-500">آگهی‌های رد شده</p>
                            <h3 className="text-2xl font-black text-slate-900 mt-1">
                                {toPersianDigits(rejectedData?.total ?? 0)}
                            </h3>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="mt-3 text-xs text-rose-700 font-medium flex items-center gap-1">
                        <span>عدم تایید به دلیل نقض قوانین یا مغایرت</span>
                    </div>
                </div>

                <div
                    onClick={() => {
                        setSelectedStatus(AdStatus.ARCHIVED);
                        setPage(1);
                    }}
                    className={`cursor-pointer p-5 rounded-2xl border transition-all ${
                        selectedStatus === AdStatus.ARCHIVED
                            ? "bg-zinc-200/70 border-zinc-400 shadow-sm ring-2 ring-zinc-400/20"
                            : "bg-white border-slate-200/80 hover:border-slate-300"
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-slate-500">آرشیو یا منقضی شده</p>
                            <h3 className="text-2xl font-black text-slate-900 mt-1">
                                {toPersianDigits(archivedData?.total ?? 0)}
                            </h3>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-zinc-100 text-zinc-600 flex items-center justify-center">
                            <Archive className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="mt-3 text-xs text-zinc-600 font-medium flex items-center gap-1">
                        <span>آگهی‌های واگذار شده یا منقضی شده</span>
                    </div>
                </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                {/* Status Badges Filter Bar */}
                <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-4">
                    <span className="text-xs font-bold text-slate-400 ml-2">وضعیت:</span>
                    {STATUS_FILTERS.map((f) => {
                        const isActive = selectedStatus === f.key;
                        let count: number | undefined;
                        if (f.key === AdStatus.PENDING_APPROVAL) count = pendingData?.total;
                        else if (f.key === AdStatus.PUBLISHED) count = publishedData?.total;
                        else if (f.key === AdStatus.REJECTED) count = rejectedData?.total;
                        else if (f.key === AdStatus.ARCHIVED) count = archivedData?.total;

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
                                        ? "bg-blue-600 text-white shadow-xs"
                                        : "bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200"
                                }`}
                            >
                                <span>{f.label}</span>
                                {count !== undefined && (
                                    <span
                                        className={`px-1.5 py-0.2 rounded-full text-[11px] font-black ${
                                            isActive
                                                ? "bg-white/20 text-white"
                                                : "bg-slate-200 text-slate-700"
                                        }`}
                                    >
                                        {toPersianDigits(count)}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Secondary Filters */}
                <div className="flex flex-col sm:flex-row items-center gap-3">
                    {/* Search Input */}
                    <div className="relative flex-1 w-full">
                        <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="جستجو در عنوان، شناسه آگهی، مالک یا دسته‌بندی..."
                            className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                        />
                        {searchTerm && (
                            <button
                                type="button"
                                onClick={() => setSearchTerm("")}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    {/* Category Filter */}
                    <div className="w-full sm:w-52">
                        <select
                            value={selectedCategoryKey}
                            onChange={(e) => {
                                setSelectedCategoryKey(e.target.value);
                                setPage(1);
                            }}
                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer font-bold"
                        >
                            <option value="">همه دسته‌بندی‌ها</option>
                            {categoriesList.map((cat) => (
                                <option key={cat.id} value={cat.key}>
                                    {cat.displayName}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* City Filter */}
                    <div className="w-full sm:w-48">
                        <select
                            value={selectedCityId}
                            onChange={(e) => {
                                setSelectedCityId(e.target.value);
                                setPage(1);
                            }}
                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer font-bold"
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
                        className="w-full sm:w-auto px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin text-blue-600" : ""}`} />
                        <span className="sm:hidden">بروزرسانی</span>
                    </button>
                </div>
            </div>

            {/* Ads Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-right">
                        <thead className="bg-slate-50/80 text-slate-600 text-xs border-b border-slate-100">
                            <tr>
                                <th className="px-5 py-4 font-bold">عنوان و آگهی</th>
                                <th className="px-5 py-4 font-bold">دسته‌بندی</th>
                                <th className="px-5 py-4 font-bold">قیمت / شرایط مالی</th>
                                <th className="px-5 py-4 font-bold">وضعیت</th>
                                <th className="px-5 py-4 font-bold">تاریخ ثبت</th>
                                <th className="px-5 py-4 font-bold text-center">عملیات مدیریت</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="py-20 text-center text-slate-400">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                                            <span className="font-bold">در حال بارگذاری لیست آگهی‌ها...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredItems.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-20 text-center">
                                        <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                                            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
                                                <Building2 className="w-6 h-6" />
                                            </div>
                                            <p className="font-black text-slate-700 text-sm mt-2">
                                                هیچ آگهی با شرایط انتخابی یافت نشد
                                            </p>
                                            <p className="text-slate-400 text-xs leading-relaxed">
                                                فیلتر وضعیت، دسته‌بندی یا شهر را تغییر دهید یا عبارت جستجو را پاک کنید.
                                            </p>
                                            {(selectedStatus !== "ALL" || selectedCityId || selectedCategoryKey || searchTerm) && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedStatus("ALL");
                                                        setSelectedCityId("");
                                                        setSelectedCategoryKey("");
                                                        setSearchTerm("");
                                                        setPage(1);
                                                    }}
                                                    className="mt-3 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition-colors"
                                                >
                                                    پاک کردن تمام فیلترها
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredItems.map((ad: AdSummary) => {
                                    const mediaId = ad.mediaIds?.[0];
                                    const hasMedia = !!mediaId;

                                    return (
                                        <tr
                                            key={ad.adId}
                                            className="hover:bg-slate-50/70 transition-colors group"
                                        >
                                            {/* Thumbnail & Title */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center">
                                                        {hasMedia ? (
                                                            <Image
                                                                src={`${process.env.NEXT_PUBLIC_API_URL}/media/${mediaId}`}
                                                                alt={ad.title}
                                                                fill
                                                                unoptimized
                                                                className="object-cover"
                                                            />
                                                        ) : (
                                                            <Building2 className="w-5 h-5 text-slate-400" />
                                                        )}
                                                    </div>
                                                    <div className="min-w-0 max-w-xs sm:max-w-sm">
                                                        <div className="flex items-center gap-1.5">
                                                            <h4
                                                                onClick={() => setDetailModalAdId(ad.adId)}
                                                                className="font-black text-slate-900 truncate hover:text-blue-600 transition-colors cursor-pointer"
                                                            >
                                                                {ad.title}
                                                            </h4>
                                                            {ad.isFeatured && (
                                                                <span className="shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-black">
                                                                    <Sparkles className="w-2.5 h-2.5" />
                                                                    ویژه
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-0.5 text-slate-400">
                                                            <span className="font-mono text-[11px]">
                                                                ID: {ad.adId.slice(0, 8)}...
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleCopy(ad.adId, "شناسه آگهی")}
                                                                title="کپی شناسه کامل"
                                                                className="hover:text-slate-700 p-0.5"
                                                            >
                                                                <Copy className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Category */}
                                            <td className="px-5 py-4 text-slate-600">
                                                <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg text-[11px] font-bold">
                                                    {ad.categoryPath?.categoryKey || "دسته‌بندی"} / {ad.categoryPath?.subcategoryKey || "زیردسته"}
                                                </span>
                                            </td>

                                            {/* Price */}
                                            <td className="px-5 py-4">
                                                <div className="font-black text-emerald-600">
                                                    {formatAdPrice(ad.pricing)}
                                                </div>
                                            </td>

                                            {/* Status Badge */}
                                            <td className="px-5 py-4">
                                                {ad.status === AdStatus.PENDING_APPROVAL && (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                                                        <Clock className="w-3 h-3" />
                                                        <span>در انتظار بررسی</span>
                                                    </span>
                                                )}
                                                {ad.status === AdStatus.PUBLISHED && (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                                                        <Check className="w-3 h-3" />
                                                        <span>منتشر شده</span>
                                                    </span>
                                                )}
                                                {ad.status === AdStatus.REJECTED && (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700">
                                                        <AlertCircle className="w-3 h-3" />
                                                        <span>رد شده</span>
                                                    </span>
                                                )}
                                                {ad.status === AdStatus.ARCHIVED && (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-zinc-100 text-zinc-600">
                                                        <Archive className="w-3 h-3" />
                                                        <span>آرشیو شده</span>
                                                    </span>
                                                )}
                                                {ad.status === AdStatus.DRAFT && (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                                                        <span>پیش‌نویس</span>
                                                    </span>
                                                )}
                                            </td>

                                            {/* Date */}
                                            <td className="px-5 py-4 text-slate-500 font-medium">
                                                {new Date(ad.createdAt).toLocaleDateString("fa-IR")}
                                            </td>

                                            {/* Actions */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    {/* Quick Approve */}
                                                    {ad.status === AdStatus.PENDING_APPROVAL && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setApproveConfirmTarget({ id: ad.adId, title: ad.title })}
                                                            title="تایید و انتشار فوری"
                                                            className="p-2 rounded-xl text-emerald-600 hover:bg-emerald-50 transition-colors"
                                                        >
                                                            <Check className="w-4 h-4" />
                                                        </button>
                                                    )}

                                                    {/* Quick Reject */}
                                                    {ad.status !== AdStatus.REJECTED && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setRejectTarget({ id: ad.adId, title: ad.title })}
                                                            title="رد آگهی با ثبت علت"
                                                            className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 transition-colors"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    )}

                                                    {/* Inspect Detail Modal */}
                                                    <button
                                                        type="button"
                                                        onClick={() => setDetailModalAdId(ad.adId)}
                                                        title="مشاهده جزئیات کامل"
                                                        className="p-2 rounded-xl text-blue-600 hover:bg-blue-50 transition-colors"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>

                                                    {/* Public website link */}
                                                    <Link
                                                        href={`/ads/${ad.adId}`}
                                                        target="_blank"
                                                        title="مشاهده در سایت اصلی"
                                                        className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors"
                                                    >
                                                        <ExternalLink className="w-4 h-4" />
                                                    </Link>
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
                    <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                        <span className="text-slate-500 font-medium">
                            نمایش صفحه {toPersianDigits(page)} از {toPersianDigits(totalPages)} (مجموع{" "}
                            {toPersianDigits(adsData.total)} آگهی)
                        </span>

                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page <= 1}
                                className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl font-bold transition-colors disabled:opacity-40"
                            >
                                صفحه قبل
                            </button>
                            <span className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-xl font-black">
                                {toPersianDigits(page)}
                            </span>
                            <button
                                type="button"
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page >= totalPages}
                                className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl font-bold transition-colors disabled:opacity-40"
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
                onApprove={(id) => {
                    setApproveConfirmTarget({
                        id,
                        title: adsData?.items.find((i) => i.adId === id)?.title || "این آگهی",
                    });
                }}
                isApproving={approveMutation.isPending}
                onOpenReject={(id, title) => {
                    setRejectTarget({ id, title });
                }}
            />

            {/* Rejection Modal */}
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

            {/* Approve Confirmation Modal */}
            {approveConfirmTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-200 text-right space-y-4" dir="rtl">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>

                        <div className="text-center space-y-1">
                            <h3 className="text-base font-black text-slate-900">
                                تایید و انتشار آگهی
                            </h3>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                آیا از تایید و انتشار آگهی «<span className="font-bold text-slate-700">{approveConfirmTarget.title}</span>» اطمینان دارید؟
                            </p>
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                            <button
                                type="button"
                                onClick={handleExecuteApprove}
                                disabled={approveMutation.isPending}
                                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                            >
                                {approveMutation.isPending ? (
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Check className="w-4 h-4" />
                                )}
                                <span>تایید و انتشار</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setApproveConfirmTarget(null)}
                                disabled={approveMutation.isPending}
                                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
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
