"use client";

import AdminAdsItemsTab from "@/components/admin/ads/AdminAdsItemsTab";
import AdminCategoriesTab from "@/components/admin/ads/AdminCategoriesTab";
import {
    FileText,
    FolderTree,
    Plus,
    RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { Suspense } from "react";

type ActiveTab = "items" | "categories";

function AdminAdsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentTab: ActiveTab =
        searchParams.get("tab") === "categories" ? "categories" : "items";

    const handleTabChange = (tab: ActiveTab) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("tab", tab);
        router.push(`/admin/ads?${params.toString()}`);
    };

    return (
        <div className="space-y-6" dir="rtl">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
                <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                            <FileText className="w-5 h-5" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-slate-900">
                                مدیریت آگهی‌ها و دسته‌بندی‌ها
                            </h1>
                            <p className="text-xs font-medium text-slate-500">
                                بررسی، تایید و رد آگهی‌های ملک، ساختار دسته‌بندی‌ها و تنظیم مدل‌های قیمتی
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <Link
                        href="/ads/submit"
                        target="_blank"
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-sm transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        <span>ثبت آگهی جدید</span>
                    </Link>

                    <Link
                        href="/ads"
                        target="_blank"
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                    >
                        <FileText className="w-4 h-4" />
                        <span>مشاهده صفحه آگهی‌ها در سایت</span>
                    </Link>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="flex items-center gap-2 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200/80 w-fit max-w-full overflow-x-auto">
                <button
                    type="button"
                    onClick={() => handleTabChange("items")}
                    className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all ${
                        currentTab === "items"
                            ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
                            : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                    }`}
                >
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span>آگهی‌های ثبت شده (آیتم‌ها)</span>
                </button>

                <button
                    type="button"
                    onClick={() => handleTabChange("categories")}
                    className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all ${
                        currentTab === "categories"
                            ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
                            : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                    }`}
                >
                    <FolderTree className="w-4 h-4 text-indigo-600" />
                    <span>دسته‌بندی‌ها و ساختار ویژگی‌ها</span>
                </button>
            </div>

            {/* Active Tab Content */}
            <div className="transition-all duration-150">
                {currentTab === "items" ? (
                    <AdminAdsItemsTab />
                ) : (
                    <AdminCategoriesTab />
                )}
            </div>
        </div>
    );
}

export default function AdminAdsPage() {
    return (
        <Suspense
            fallback={
                <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                    <span className="text-xs font-bold">در حال بارگذاری بخش مدیریت آگهی‌ها...</span>
                </div>
            }
        >
            <AdminAdsContent />
        </Suspense>
    );
}
