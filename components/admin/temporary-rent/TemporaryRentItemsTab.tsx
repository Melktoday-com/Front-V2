"use client";

import { useCities } from "@/hooks/useGeo";
import {
    useDeleteTemporaryRent,
    usePublishTemporaryRent,
    useTemporaryRentAds,
} from "@/hooks/useTemporaryRent";
import { formatPrice, toPersianDigits } from "@/lib/utils";
import { TemporaryRentAdSummary } from "@/services/temporary-rent.service";
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
    { key: "PENDING_APPROVAL", label: "در انتظار بررسی", badgeClass: "bg-amber-100 text-amber-800 border-amber-200" },
    { key: "PUBLISHED", label: "منتشر شده", badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200" },
    { key: "DRAFT", label: "پیش‌نویس", badgeClass: "bg-slate-100 text-slate-700 border-slate-200" },
    { key: "REJECTED", label: "رد شده", badgeClass: "bg-rose-100 text-rose-800 border-rose-200" },
    { key: "ARCHIVED", label: "آرشیو شده", badgeClass: "bg-zinc-100 text-zinc-700 border-zinc-200" },
    { key: "ALL", label: "همه وضعیت‌ها", badgeClass: "bg-blue-100 text-blue-800 border-blue-200" },
] as const;

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
                            : "bg-white border-slate-200/80 hover:border-slate-300"
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-slate-500">اقامتگاه‌های منتشر شده</p>
                            <h3 className="text-2xl font-black text-slate-900 mt-1">
                                {toPersianDigits(publishedData?.total ?? 0)}
                            </h3>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="mt-3 text-xs text-emerald-700 font-medium flex items-center gap-1">
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
                            ? "bg-slate-200/60 border-slate-400 shadow-sm ring-2 ring-slate-400/20"
                            : "bg-white border-slate-200/80 hover:border-slate-300"
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-slate-500">پیش‌نویس‌ها</p>
                            <h3 className="text-2xl font-black text-slate-900 mt-1">
                                {toPersianDigits(draftData?.total ?? 0)}
                            </h3>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center">
                            <Layers className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="mt-3 text-xs text-slate-500 font-medium flex items-center gap-1">
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
                            : "bg-white border-slate-200/80 hover:border-slate-300"
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-slate-500">کل آیتم‌های اجاره موقت</p>
                            <h3 className="text-2xl font-black text-slate-900 mt-1">
                                {toPersianDigits(adsData?.total ?? 0)}
                            </h3>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                            <Home className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="mt-3 text-xs text-blue-700 font-medium flex items-center gap-1">
                        <span>تمام رکوردها در کلیه وضعیت‌ها</span>
                    </div>
                </div>
            </div>

            {/* Filters and Controls Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                {/* Status Badges Filter Bar */}
                <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-4">
                    <span className="text-xs font-bold text-slate-400 ml-2">وضعیت:</span>
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

                {/* Search and Secondary Filters */}
                <div className="flex flex-col sm:flex-row items-center gap-3">
                    {/* Search Input */}
                    <div className="relative flex-1 w-full">
                        <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="جستجو در عنوان، شناسه اقامتگاه یا شناسه مالک..."
                            className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
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

                    {/* City Selector Filter */}
                    <div className="w-full sm:w-60">
                        <select
                            value={selectedCityId}
                            onChange={(e) => {
                                setSelectedCityId(e.target.value);
                                setPage(1);
                            }}
                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer font-bold"
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
                        <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin text-emerald-600" : ""}`} />
                        <span className="sm:hidden">بروزرسانی</span>
                    </button>
                </div>
            </div>

            {/* Table View */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-right">
                        <thead className="bg-slate-50/80 text-slate-600 text-xs border-b border-slate-100">
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
                                    <td colSpan={7} className="py-20 text-center text-slate-400">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
                                            <span className="font-bold">در حال بارگذاری لیست اقامتگاه‌ها...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredItems.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-20 text-center">
                                        <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                                            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
                                                <Home className="w-6 h-6" />
                                            </div>
                                            <p className="font-black text-slate-700 text-sm mt-2">
                                                هیچ اقامتگاهی با شرایط انتخابی یافت نشد
                                            </p>
                                            <p className="text-slate-400 text-xs leading-relaxed">
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
                                                    className="mt-3 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold transition-colors"
                                                >
                                                    پاک کردن تمام فیلترها
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredItems.map((item: TemporaryRentAdSummary) => {
                                    const mediaId = item.mediaIds?.[0];
                                    const hasMedia = !!mediaId;

                                    return (
                                        <tr
                                            key={item.id}
                                            className="hover:bg-slate-50/70 transition-colors group"
                                        >
                                            {/* Thumbnail & Title */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center">
                                                        {hasMedia ? (
                                                            <Image
                                                                src={`${process.env.NEXT_PUBLIC_API_URL}/media/${mediaId}`}
                                                                alt={item.title}
                                                                fill
                                                                unoptimized
                                                                className="object-cover"
                                                            />
                                                        ) : (
                                                            <Building2 className="w-5 h-5 text-slate-400" />
                                                        )}
                                                    </div>
                                                    <div className="min-w-0 max-w-xs sm:max-w-sm">
                                                        <h4
                                                            onClick={() => setDetailModalAdId(item.id)}
                                                            className="font-black text-slate-900 truncate hover:text-emerald-600 transition-colors cursor-pointer"
                                                        >
                                                            {item.title}
                                                        </h4>
                                                        <div className="flex items-center gap-2 mt-0.5 text-slate-400">
                                                            <span className="font-mono text-[11px]">
                                                                ID: {item.id.slice(0, 8)}...
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleCopy(item.id, "شناسه اقامتگاه")}
                                                                title="کپی شناسه کامل"
                                                                className="hover:text-slate-700 p-0.5"
                                                            >
                                                                <Copy className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* City */}
                                            <td className="px-5 py-4 text-slate-600">
                                                <div className="flex items-center gap-1 font-bold">
                                                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                    <span>{item.cityName || item.cityId || "نامشخص"}</span>
                                                </div>
                                            </td>

                                            {/* Nightly Price */}
                                            <td className="px-5 py-4">
                                                <div className="font-black text-emerald-600">
                                                    {formatPrice(item.pricing?.nightlyPrice || 0, "")}
                                                    <span className="text-[10px] text-slate-400 font-bold mr-1">
                                                        تومان
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Guests */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-1 text-slate-600 font-bold">
                                                    <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                    <span>{toPersianDigits(item.maxGuests || 1)} نفر</span>
                                                </div>
                                            </td>

                                            {/* Status Badge */}
                                            <td className="px-5 py-4">
                                                {item.status === "PENDING_APPROVAL" && (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                                                        <Clock className="w-3 h-3" />
                                                        <span>در انتظار بررسی</span>
                                                    </span>
                                                )}
                                                {item.status === "PUBLISHED" && (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                                                        <Check className="w-3 h-3" />
                                                        <span>منتشر شده</span>
                                                    </span>
                                                )}
                                                {item.status === "DRAFT" && (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                                                        <span>پیش‌نویس</span>
                                                    </span>
                                                )}
                                                {item.status === "REJECTED" && (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700">
                                                        <AlertCircle className="w-3 h-3" />
                                                        <span>رد شده</span>
                                                    </span>
                                                )}
                                                {item.status === "ARCHIVED" && (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-zinc-100 text-zinc-600">
                                                        <span>آرشیو شده</span>
                                                    </span>
                                                )}
                                            </td>

                                            {/* Registered Date */}
                                            <td className="px-5 py-4 text-slate-500 font-medium">
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
                                                            className="p-2 rounded-xl text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-50"
                                                        >
                                                            <Check className="w-4 h-4" />
                                                        </button>
                                                    )}

                                                    {/* View Modal Detail */}
                                                    <button
                                                        type="button"
                                                        onClick={() => setDetailModalAdId(item.id)}
                                                        title="بررسی جزئیات کامل"
                                                        className="p-2 rounded-xl text-blue-600 hover:bg-blue-50 transition-colors"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>

                                                    {/* External link to public ad */}
                                                    <Link
                                                        href={`/temporary-rent/${item.id}`}
                                                        target="_blank"
                                                        title="مشاهده در صفحه اصلی سایت"
                                                        className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors"
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
                                                        className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 transition-colors"
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
                    <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                        <span className="text-slate-500 font-medium">
                            نمایش صفحه {toPersianDigits(page)} از {toPersianDigits(totalPages)} (مجموع{" "}
                            {toPersianDigits(adsData.total)} اقامتگاه)
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
                            <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl font-black">
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
                    <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-200 text-right space-y-4" dir="rtl">
                        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                            <Trash2 className="w-6 h-6" />
                        </div>

                        <div className="text-center space-y-1">
                            <h3 className="text-base font-black text-slate-900">
                                حذف اقامتگاه اجاره موقت
                            </h3>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                آیا از حذف اقامتگاه «<span className="font-bold text-slate-700">{deleteTargetAd.title}</span>» اطمینان دارید؟ این عملیات غیرقابل بازگشت است.
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
