"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService } from "@/services/admin.service";
import {
    Archive,
    RotateCcw,
    Trash2,
    FolderTree,
    Layers,
    AlertCircle,
    CheckCircle2,
    RefreshCw,
    Search,
    FileText,
    Calendar,
    Globe,
    MapPin,
    ChevronRight,
    ChevronLeft,
    Copy,
    Check,
} from "lucide-react";
import { toast } from "sonner";
import {
    GlobalArchiveEntityType,
    GlobalArchiveItem,
} from "@/types/api/admin.types";
import { normalizeApiError } from "@/lib/api/error-handler";
import { toPersianDigits } from "@/lib/utils";

const typeLabels: Record<GlobalArchiveEntityType, { label: string; icon: React.ComponentType<{ className?: string }>; color: string; badge: string }> = {
    AD: {
        label: "آگهی ملک",
        icon: FileText,
        color: "text-blue-600 bg-blue-50 border-blue-200",
        badge: "آگهی فروش/رهن",
    },
    TEMPORARY_RENT_AD: {
        label: "اجاره موقت",
        icon: Calendar,
        color: "text-emerald-600 bg-emerald-50 border-emerald-200",
        badge: "اقامتگاه / موقت",
    },
    CATEGORY: {
        label: "دسته‌بندی اصلی",
        icon: FolderTree,
        color: "text-amber-600 bg-amber-50 border-amber-200",
        badge: "دسته ملک",
    },
    SUBCATEGORY: {
        label: "زیردسته‌بندی",
        icon: Layers,
        color: "text-indigo-600 bg-indigo-50 border-indigo-200",
        badge: "زیردسته ملک",
    },
    TEMPORARY_RENT_CATEGORY: {
        label: "دسته اجاره موقت",
        icon: FolderTree,
        color: "text-teal-600 bg-teal-50 border-teal-200",
        badge: "دسته موقت",
    },
    TEMPORARY_RENT_SUBCATEGORY: {
        label: "زیردسته موقت",
        icon: Layers,
        color: "text-purple-600 bg-purple-50 border-purple-200",
        badge: "زیردسته موقت",
    },
    POST: {
        label: "محتوا / پست",
        icon: Globe,
        color: "text-violet-600 bg-violet-50 border-violet-200",
        badge: "مطلب وبلاگ",
    },
    GEO_ZONE: {
        label: "منطقه جغرافیایی",
        icon: MapPin,
        color: "text-orange-600 bg-orange-50 border-orange-200",
        badge: "منطقه نقشه",
    },
};

export default function AdminArchivePage() {
    const queryClient = useQueryClient();
    const [selectedType, setSelectedType] = useState<string>("ALL");
    const [searchQuery, setSearchQuery] = useState("");
    const [page, setPage] = useState(1);
    const limit = 15;
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const [actionModal, setActionModal] = useState<{
        isOpen: boolean;
        action: "restore" | "force";
        item: GlobalArchiveItem;
    } | null>(null);

    const { data, isLoading, isError, refetch, isFetching } = useQuery({
        queryKey: ["admin", "global-archive", selectedType, searchQuery, page],
        queryFn: () =>
            adminService.listGlobalArchive({
                type: selectedType,
                search: searchQuery,
                page,
                limit,
            }),
    });

    const restoreMutation = useMutation({
        mutationFn: (item: GlobalArchiveItem) =>
            adminService.restoreGlobalArchiveItem(item.type, item.id),
        onSuccess: (res) => {
            toast.success(res?.message || "آیتم با موفقیت بازگردانی شد.");
            setActionModal(null);
            queryClient.invalidateQueries({ queryKey: ["admin", "global-archive"] });
            queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
            queryClient.invalidateQueries({ queryKey: ["admin", "ads"] });
        },
        onError: (err: Error) => {
            toast.error(normalizeApiError(err, "خطا در بازگردانی آیتم."));
        },
    });

    const forceDeleteMutation = useMutation({
        mutationFn: (item: GlobalArchiveItem) =>
            adminService.forceDeleteGlobalArchiveItem(item.type, item.id),
        onSuccess: (res) => {
            toast.success(res?.message || "آیتم برای همیشه از پایگاه‌داده حذف شد.");
            setActionModal(null);
            queryClient.invalidateQueries({ queryKey: ["admin", "global-archive"] });
        },
        onError: (err: Error) => {
            toast.error(normalizeApiError(err, "خطا در حذف قطعی آیتم."));
        },
    });

    const items = data?.items || [];
    const counts = data?.counts || {
        all: 0,
        ads: 0,
        temporaryRentAds: 0,
        categories: 0,
        subcategories: 0,
        posts: 0,
        geoZones: 0,
    };
    const totalPages = Math.ceil((data?.total || 0) / limit) || 1;

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(text);
        setTimeout(() => setCopiedId(null), 2000);
        toast.info("شناسه آیتم کپی شد.");
    };

    return (
        <div className="space-y-6" dir="rtl">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                        <Archive className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-slate-900">
                            سطل زباله و آرشیو جامع سیستم (Global Archive)
                        </h1>
                        <p className="text-xs font-medium text-slate-500 mt-0.5">
                            مدیریت یکپارچه تمامی آگهی‌ها، اقامتگاه‌ها، دسته‌بندی‌ها، زیردسته‌ها، مطالب وبلاگ و مناطق حذف‌شده
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => refetch()}
                    disabled={isFetching}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors w-fit"
                >
                    <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin text-amber-600" : ""}`} />
                    <span>بروزرسانی لیست</span>
                </button>
            </div>

            {/* Filter Tabs & Search */}
            <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                    {/* Category tabs */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none text-xs font-bold">
                        <button
                            type="button"
                            onClick={() => {
                                setSelectedType("ALL");
                                setPage(1);
                            }}
                            className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
                                selectedType === "ALL"
                                    ? "bg-slate-900 text-white shadow-xs"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                        >
                            همه آیتم‌ها ({toPersianDigits(counts.all)})
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setSelectedType("ADS");
                                setPage(1);
                            }}
                            className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
                                selectedType === "ADS"
                                    ? "bg-blue-600 text-white shadow-xs"
                                    : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                            }`}
                        >
                            آگهی‌های ملک ({toPersianDigits(counts.ads)})
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setSelectedType("TEMPORARY_RENT_ADS");
                                setPage(1);
                            }}
                            className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
                                selectedType === "TEMPORARY_RENT_ADS"
                                    ? "bg-emerald-600 text-white shadow-xs"
                                    : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            }`}
                        >
                            اجاره موقت ({toPersianDigits(counts.temporaryRentAds)})
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setSelectedType("CATEGORIES");
                                setPage(1);
                            }}
                            className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
                                selectedType === "CATEGORIES"
                                    ? "bg-amber-600 text-white shadow-xs"
                                    : "bg-amber-50 text-amber-700 hover:bg-amber-100"
                            }`}
                        >
                            دسته‌بندی‌ها ({toPersianDigits(counts.categories)})
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setSelectedType("SUBCATEGORIES");
                                setPage(1);
                            }}
                            className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
                                selectedType === "SUBCATEGORIES"
                                    ? "bg-indigo-600 text-white shadow-xs"
                                    : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                            }`}
                        >
                            زیردسته‌ها ({toPersianDigits(counts.subcategories)})
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setSelectedType("POSTS");
                                setPage(1);
                            }}
                            className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
                                selectedType === "POSTS"
                                    ? "bg-violet-600 text-white shadow-xs"
                                    : "bg-violet-50 text-violet-700 hover:bg-violet-100"
                            }`}
                        >
                            مطالب و پست‌ها ({toPersianDigits(counts.posts)})
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setSelectedType("GEO_ZONES");
                                setPage(1);
                            }}
                            className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
                                selectedType === "GEO_ZONES"
                                    ? "bg-orange-600 text-white shadow-xs"
                                    : "bg-orange-50 text-orange-700 hover:bg-orange-100"
                            }`}
                        >
                            مناطق ({toPersianDigits(counts.geoZones)})
                        </button>
                    </div>

                    {/* Search bar */}
                    <div className="relative min-w-[240px]">
                        <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="جستجو بر اساس عنوان یا شناسه..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setPage(1);
                            }}
                            className="w-full pl-3 pr-9 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>
                </div>
            </div>

            {/* Content Table */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
                {isLoading ? (
                    <div className="p-12 text-center space-y-3">
                        <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
                        <p className="text-xs font-bold text-slate-500">در حال دریافت آیتم‌های آرشیو...</p>
                    </div>
                ) : isError ? (
                    <div className="p-12 text-center space-y-3 text-red-500">
                        <AlertCircle className="w-8 h-8 mx-auto" />
                        <p className="text-xs font-bold">خطا در بارگذاری اطلاعات سطل زباله. لطفاً مجدداً تلاش کنید.</p>
                    </div>
                ) : items.length === 0 ? (
                    <div className="p-16 text-center space-y-3">
                        <div className="w-16 h-16 rounded-2xl bg-slate-50 text-slate-300 flex items-center justify-center mx-auto">
                            <Archive className="w-8 h-8" />
                        </div>
                        <h3 className="text-sm font-black text-slate-800">سطل زباله خالی است</h3>
                        <p className="text-xs text-slate-400 max-w-sm mx-auto">
                            هیچ آیتم حذف‌شده یا آرشیو‌شده‌ای در این بخش یافت نشد. تمام محتواها و آگهی‌ها فعال هستند.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-right text-xs">
                            <thead className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-100">
                                <tr>
                                    <th className="py-3.5 px-4">نوع موجودیت</th>
                                    <th className="py-3.5 px-4">عنوان و مشخصات</th>
                                    <th className="py-3.5 px-4">شناسه یکتا</th>
                                    <th className="py-3.5 px-4">وضعیت قبلی</th>
                                    <th className="py-3.5 px-4">تاریخ آرشیو</th>
                                    <th className="py-3.5 px-4 text-center">عملیات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {items.map((item) => {
                                    const meta = typeLabels[item.type] || {
                                        label: item.type,
                                        icon: Archive,
                                        color: "text-slate-600 bg-slate-50 border-slate-200",
                                        badge: item.type,
                                    };
                                    const Icon = meta.icon;

                                    return (
                                        <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                                            <td className="py-3.5 px-4">
                                                <div className="flex items-center gap-2">
                                                    <span className={`p-1.5 rounded-lg border ${meta.color}`}>
                                                        <Icon className="w-4 h-4" />
                                                    </span>
                                                    <span className="font-bold text-slate-700">{meta.label}</span>
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-4 max-w-xs">
                                                <div className="font-black text-slate-900 truncate">
                                                    {item.title}
                                                </div>
                                                {item.metadata?.category && (
                                                    <div className="text-[11px] text-slate-500 mt-0.5">
                                                        دسته والد: {item.metadata.category}
                                                    </div>
                                                )}
                                                {item.description && (
                                                    <div className="text-[11px] text-slate-400 truncate mt-0.5">
                                                        {item.description}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <button
                                                    type="button"
                                                    onClick={() => copyToClipboard(item.id)}
                                                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-mono text-[11px] transition-colors"
                                                    title="کپی شناسه یکتا"
                                                >
                                                    <span>{item.id.slice(0, 8)}...</span>
                                                    {copiedId === item.id ? (
                                                        <Check className="w-3 h-3 text-emerald-600" />
                                                    ) : (
                                                        <Copy className="w-3 h-3 text-slate-400" />
                                                    )}
                                                </button>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                                                    {item.originalStatus || "نامشخص"}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 text-slate-500 font-medium">
                                                {new Date(item.archivedAt).toLocaleDateString("fa-IR", {
                                                    year: "numeric",
                                                    month: "short",
                                                    day: "numeric",
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
                                            </td>
                                            <td className="py-3.5 px-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setActionModal({
                                                                isOpen: true,
                                                                action: "restore",
                                                                item,
                                                            })
                                                        }
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold transition-all text-xs"
                                                    >
                                                        <RotateCcw className="w-3.5 h-3.5" />
                                                        <span>بازگردانی</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setActionModal({
                                                                isOpen: true,
                                                                action: "force",
                                                                item,
                                                            })
                                                        }
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-bold transition-all text-xs"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                        <span>حذف دائم</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-600">
                        <div>
                            صفحه {toPersianDigits(page)} از {toPersianDigits(totalPages)} ({toPersianDigits(data?.total || 0)} مورد)
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Action Confirmation Modal */}
            {actionModal && actionModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
                    <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 border border-slate-100 text-right">
                        <div className="flex items-center gap-3">
                            {actionModal.action === "restore" ? (
                                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                                    <RotateCcw className="w-6 h-6" />
                                </div>
                            ) : (
                                <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                                    <Trash2 className="w-6 h-6" />
                                </div>
                            )}
                            <div>
                                <h3 className="text-base font-black text-slate-900">
                                    {actionModal.action === "restore" ? "بازگردانی آیتم از سطل زباله" : "حذف دائم و قطعی از پایگاه‌داده"}
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    نوع موجودیت: {typeLabels[actionModal.item.type]?.label || actionModal.item.type}
                                </p>
                            </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-xs">
                            <div className="font-bold text-slate-800">
                                عنوان: <span className="font-black text-slate-900">{actionModal.item.title}</span>
                            </div>
                            <div className="text-slate-500 font-mono text-[11px]">
                                شناسه: {actionModal.item.id}
                            </div>
                        </div>

                        {actionModal.action === "force" ? (
                            <p className="text-xs text-red-600 font-medium leading-relaxed bg-red-50/50 p-3 rounded-xl border border-red-100">
                                ⚠️ هشدار مهم: این عملیات برگشت‌پذیر نیست. داده‌های این آیتم و تمامی سوابق مرتبط با آن به صورت کامل و فیزیکی از پایگاه‌داده حذف خواهند شد.
                            </p>
                        ) : (
                            <p className="text-xs text-slate-600 font-medium leading-relaxed">
                                آیا از بازگردانی این آیتم و فعال‌سازی مجدد آن در پلتفرم اطمینان دارید؟
                            </p>
                        )}

                        <div className="flex items-center gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setActionModal(null)}
                                className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors"
                            >
                                انصراف
                            </button>
                            {actionModal.action === "restore" ? (
                                <button
                                    type="button"
                                    onClick={() => restoreMutation.mutate(actionModal.item)}
                                    disabled={restoreMutation.isPending}
                                    className="flex-1 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs transition-colors shadow-md shadow-amber-600/20 disabled:opacity-50 flex items-center justify-center gap-1.5"
                                >
                                    {restoreMutation.isPending ? (
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <span>تایید و بازگردانی</span>
                                    )}
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => forceDeleteMutation.mutate(actionModal.item)}
                                    disabled={forceDeleteMutation.isPending}
                                    className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs transition-colors shadow-md shadow-red-600/20 disabled:opacity-50 flex items-center justify-center gap-1.5"
                                >
                                    {forceDeleteMutation.isPending ? (
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <span>حذف قطعی و دائم</span>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
