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
} from "lucide-react";
import { toast } from "sonner";
import { ArchivedCategoryItem, ArchivedSubcategoryItem } from "@/types/api/admin.types";

export default function AdminArchivePage() {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<"categories" | "subcategories">("categories");
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        type: "category" | "subcategory";
        id: string;
        name: string;
    } | null>(null);

    const { data, isLoading, isError, refetch, isFetching } = useQuery({
        queryKey: ["admin", "archive", "categories"],
        queryFn: () => adminService.listArchivedCategories(),
    });

    const restoreCategoryMutation = useMutation({
        mutationFn: (id: string) => adminService.restoreCategory(id),
        onSuccess: () => {
            toast.success("دسته‌بندی با موفقیت بازگردانی شد.");
            queryClient.invalidateQueries({ queryKey: ["admin", "archive"] });
            queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || "خطا در بازگردانی دسته‌بندی.");
        },
    });

    const forceDeleteCategoryMutation = useMutation({
        mutationFn: (id: string) => adminService.forceDeleteCategory(id),
        onSuccess: () => {
            toast.success("دسته‌بندی برای همیشه حذف شد.");
            setConfirmModal(null);
            queryClient.invalidateQueries({ queryKey: ["admin", "archive"] });
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || "خطا در حذف قطعی دسته‌بندی.");
        },
    });

    const restoreSubcategoryMutation = useMutation({
        mutationFn: (id: string) => adminService.restoreSubcategory(id),
        onSuccess: () => {
            toast.success("زیردسته‌بندی با موفقیت بازگردانی شد.");
            queryClient.invalidateQueries({ queryKey: ["admin", "archive"] });
            queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || "خطا در بازگردانی زیردسته‌بندی.");
        },
    });

    const forceDeleteSubcategoryMutation = useMutation({
        mutationFn: (id: string) => adminService.forceDeleteSubcategory(id),
        onSuccess: () => {
            toast.success("زیردسته‌بندی برای همیشه حذف شد.");
            setConfirmModal(null);
            queryClient.invalidateQueries({ queryKey: ["admin", "archive"] });
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || "خطا در حذف قطعی زیردسته‌بندی.");
        },
    });

    const categories = data?.categories || [];
    const subcategories = data?.subcategories || [];

    const handleForceDelete = () => {
        if (!confirmModal) return;
        if (confirmModal.type === "category") {
            forceDeleteCategoryMutation.mutate(confirmModal.id);
        } else {
            forceDeleteSubcategoryMutation.mutate(confirmModal.id);
        }
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
                            سطل زباله و بازیابی آیتم‌ها
                        </h1>
                        <p className="text-xs font-medium text-slate-500 mt-0.5">
                            مشاهده دسته‌ها و زیردسته‌های حذف‌شده، بازگردانی به سیستم یا حذف دائم از پایگاه‌داده
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

            {/* Tabs */}
            <div className="flex items-center gap-2 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200/80 w-fit max-w-full">
                <button
                    type="button"
                    onClick={() => setActiveTab("categories")}
                    className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all ${
                        activeTab === "categories"
                            ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
                            : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                    }`}
                >
                    <FolderTree className="w-4 h-4 text-amber-600" />
                    <span>دسته‌بندی‌های اصلی ({categories.length})</span>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab("subcategories")}
                    className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all ${
                        activeTab === "subcategories"
                            ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
                            : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                    }`}
                >
                    <Layers className="w-4 h-4 text-indigo-600" />
                    <span>زیردسته‌بندی‌ها ({subcategories.length})</span>
                </button>
            </div>

            {/* Content Table */}
            {isLoading ? (
                <div className="bg-white p-12 rounded-3xl border border-slate-200/80 text-center">
                    <RefreshCw className="w-8 h-8 text-amber-600 animate-spin mx-auto mb-3" />
                    <p className="text-sm font-bold text-slate-600">در حال دریافت آیتم‌های آرشیو شده...</p>
                </div>
            ) : isError ? (
                <div className="bg-rose-50 border border-rose-200 p-6 rounded-3xl text-rose-800 flex items-center gap-3">
                    <AlertCircle className="w-6 h-6 shrink-0" />
                    <span className="text-sm font-medium">خطا در برقراری ارتباط با سرور جهت دریافت اطلاعات سطل زباله.</span>
                </div>
            ) : activeTab === "categories" ? (
                <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs">
                    {categories.length === 0 ? (
                        <div className="text-center py-16 px-4">
                            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3 opacity-80" />
                            <h3 className="text-base font-bold text-slate-800">هیچ دسته‌بندی حذف‌شده‌ای وجود ندارد</h3>
                            <p className="text-xs text-slate-500 mt-1">سطل زباله دسته‌بندی‌ها در حال حاضر خالی است.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-right text-xs">
                                <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-bold">
                                    <tr>
                                        <th className="py-4 px-6">نام دسته‌بندی</th>
                                        <th className="py-4 px-6">شناسه / اسلاگ</th>
                                        <th className="py-4 px-6">تاریخ حذف</th>
                                        <th className="py-4 px-6 text-left">عملیات مدیریت</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-700">
                                    {categories.map((cat: ArchivedCategoryItem) => (
                                        <tr key={cat.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="py-4 px-6 font-bold text-slate-900">{cat.name}</td>
                                            <td className="py-4 px-6 font-mono text-slate-500">{cat.slug}</td>
                                            <td className="py-4 px-6 text-slate-500">
                                                {cat.deletedAt ? new Date(cat.deletedAt).toLocaleDateString("fa-IR", {
                                                    year: "numeric",
                                                    month: "long",
                                                    day: "numeric",
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                }) : "-"}
                                            </td>
                                            <td className="py-4 px-6 text-left">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => restoreCategoryMutation.mutate(cat.id)}
                                                        disabled={restoreCategoryMutation.isPending}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold transition-colors"
                                                    >
                                                        <RotateCcw className="w-3.5 h-3.5" />
                                                        <span>بازگردانی</span>
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => setConfirmModal({
                                                            isOpen: true,
                                                            type: "category",
                                                            id: cat.id,
                                                            name: cat.name,
                                                        })}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold transition-colors"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                        <span>حذف دائم</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs">
                    {subcategories.length === 0 ? (
                        <div className="text-center py-16 px-4">
                            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3 opacity-80" />
                            <h3 className="text-base font-bold text-slate-800">هیچ زیردسته‌بندی حذف‌شده‌ای وجود ندارد</h3>
                            <p className="text-xs text-slate-500 mt-1">سطل زباله زیردسته‌ها در حال حاضر خالی است.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-right text-xs">
                                <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-bold">
                                    <tr>
                                        <th className="py-4 px-6">نام زیردسته‌بندی</th>
                                        <th className="py-4 px-6">کلید یکتا (Key)</th>
                                        <th className="py-4 px-6">دسته‌بندی والد</th>
                                        <th className="py-4 px-6">تاریخ حذف</th>
                                        <th className="py-4 px-6 text-left">عملیات مدیریت</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-700">
                                    {subcategories.map((sub: ArchivedSubcategoryItem) => (
                                        <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="py-4 px-6 font-bold text-slate-900">{sub.name}</td>
                                            <td className="py-4 px-6 font-mono text-slate-500">{sub.key}</td>
                                            <td className="py-4 px-6 text-slate-600 font-medium">
                                                {sub.categoryName || sub.categoryId}
                                            </td>
                                            <td className="py-4 px-6 text-slate-500">
                                                {sub.deletedAt ? new Date(sub.deletedAt).toLocaleDateString("fa-IR", {
                                                    year: "numeric",
                                                    month: "long",
                                                    day: "numeric",
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                }) : "-"}
                                            </td>
                                            <td className="py-4 px-6 text-left">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => restoreSubcategoryMutation.mutate(sub.id)}
                                                        disabled={restoreSubcategoryMutation.isPending}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold transition-colors"
                                                    >
                                                        <RotateCcw className="w-3.5 h-3.5" />
                                                        <span>بازگردانی</span>
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => setConfirmModal({
                                                            isOpen: true,
                                                            type: "subcategory",
                                                            id: sub.id,
                                                            name: sub.name,
                                                        })}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold transition-colors"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                        <span>حذف دائم</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Permanent Delete Confirmation Modal */}
            {confirmModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
                        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                            <Trash2 className="w-6 h-6" />
                        </div>

                        <div className="text-center space-y-2">
                            <h3 className="text-base font-black text-slate-900">
                                آیا از حذف قطعی اطمینان دارید؟
                            </h3>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                آیا مطمئن هستید که می‌خواهید <span className="font-bold text-slate-800">«{confirmModal.name}»</span> را برای همیشه حذف کنید؟ این عملیات غیرقابل بازگشت بوده و از دیتابیس پاک خواهد شد.
                            </p>
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setConfirmModal(null)}
                                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                            >
                                انصراف
                            </button>
                            <button
                                type="button"
                                onClick={handleForceDelete}
                                disabled={forceDeleteCategoryMutation.isPending || forceDeleteSubcategoryMutation.isPending}
                                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black transition-colors shadow-xs"
                            >
                                حذف قطعی و دائم
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
