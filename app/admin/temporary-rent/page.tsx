"use client";

import TemporaryRentCategoriesTab from "@/components/admin/temporary-rent/TemporaryRentCategoriesTab";
import TemporaryRentItemsTab from "@/components/admin/temporary-rent/TemporaryRentItemsTab";
import {
    Calendar,
    FolderTree,
    Home,
    Plus,
    RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { Suspense } from "react";

type ActiveTab = "items" | "categories";

function AdminTemporaryRentContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentTab: ActiveTab =
        searchParams.get("tab") === "categories" ? "categories" : "items";

    const handleTabChange = (tab: ActiveTab) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("tab", tab);
        router.push(`/admin/temporary-rent?${params.toString()}`);
    };

    return (
        <div className="space-y-6" dir="rtl">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-surface p-6 rounded-3xl border border-border-subtle/80 shadow-xs">
                <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-2xl bg-success-subtle text-success flex items-center justify-center">
                            <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-foreground">
                                مدیریت اجاره موقت و روزانه
                            </h1>
                            <p className="text-xs font-medium text-foreground-muted">
                                نظارت بر آگهی‌های اقامتگاه، بررسی و تایید، دسته‌بندی‌ها و مدل‌های قیمت‌گذاری
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <Link
                        href="/admin/temporary-rent/create"
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-sm transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        <span>ثبت اقامتگاه جدید</span>
                    </Link>

                    <Link
                        href="/temporary-rent"
                        target="_blank"
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-surface-secondary hover:bg-slate-200 text-foreground-secondary rounded-xl text-xs font-bold transition-colors"
                    >
                        <Home className="w-4 h-4" />
                        <span>مشاهده صفحه اصلی اقامتگاه‌ها</span>
                    </Link>
                </div>
            </div>

            {/* Main Tabs Navigation */}
            <div className="flex items-center gap-2 p-1.5 bg-surface-secondary/80 rounded-2xl border border-border-subtle/80 w-fit max-w-full overflow-x-auto">
                <button
                    type="button"
                    onClick={() => handleTabChange("items")}
                    className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all ${
                        currentTab === "items"
                            ? "bg-surface text-foreground shadow-sm ring-1 ring-slate-200"
                            : "text-foreground-secondary hover:text-foreground hover:bg-surface/50"
                    }`}
                >
                    <Home className="w-4 h-4 text-success" />
                    <span>اقامتگاه‌ها و آگهی‌ها (آیتم‌ها)</span>
                </button>

                <button
                    type="button"
                    onClick={() => handleTabChange("categories")}
                    className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all ${
                        currentTab === "categories"
                            ? "bg-surface text-foreground shadow-sm ring-1 ring-slate-200"
                            : "text-foreground-secondary hover:text-foreground hover:bg-surface/50"
                    }`}
                >
                    <FolderTree className="w-4 h-4 text-info" />
                    <span>دسته‌بندی‌ها و ساختار ویژگی‌ها</span>
                </button>
            </div>

            {/* Active Tab Content */}
            <div className="transition-all duration-150">
                {currentTab === "items" ? (
                    <TemporaryRentItemsTab />
                ) : (
                    <TemporaryRentCategoriesTab />
                )}
            </div>
        </div>
    );
}

export default function AdminTemporaryRentPage() {
    return (
        <Suspense
            fallback={
                <div className="py-20 flex flex-col items-center justify-center gap-3 text-foreground-muted">
                    <RefreshCw className="w-6 h-6 animate-spin text-success" />
                    <span className="text-xs font-bold">در حال بارگذاری بخش مدیریت اجاره موقت...</span>
                </div>
            }
        >
            <AdminTemporaryRentContent />
        </Suspense>
    );
}
