"use client";

import { CategoryIcon } from "@/components/CategoryIcon";
import { cn } from "@/lib/utils";
import { CategoryListItem } from "@/types/api/ads.types";
import { X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

export interface CategoryFilterProps {
    categories: CategoryListItem[];
    isLoading?: boolean;
    selectedCategoryKey?: string;
    selectedSubcategoryKey?: string;
    onSelectCategory?: (key: string) => void;
    onSelectSubcategory?: (key: string) => void;
    variant?: "filter" | "landing";
    cityId?: string;
    cityName?: string;
    className?: string;
}

export default function CategoryFilter({
    categories,
    isLoading,
    selectedCategoryKey = "",
    selectedSubcategoryKey = "",
    onSelectCategory,
    onSelectSubcategory,
    variant = "filter",
    cityId,
    cityName,
    className,
}: CategoryFilterProps) {
    // Active category for landing page disclosure
    const [landingActiveKey, setLandingActiveKey] = useState<string>(() => {
        if (selectedCategoryKey) return selectedCategoryKey;
        return categories?.[0]?.key || "";
    });

    const effectiveLandingKey = landingActiveKey || categories?.[0]?.key || "";
    const activeLandingCategory = useMemo(() => {
        return categories.find((c) => c.key === effectiveLandingKey) || categories[0];
    }, [categories, effectiveLandingKey]);

    const activeFilterCategory = useMemo(() => {
        if (!selectedCategoryKey) return null;
        return categories.find((c) => c.key === selectedCategoryKey) || null;
    }, [categories, selectedCategoryKey]);

    // Build URL query string helper for city params
    const getCityQueryString = () => {
        const parts: string[] = [];
        if (cityId) parts.push(`cityId=${encodeURIComponent(cityId)}`);
        if (cityName && cityName !== "همه شهرها") parts.push(`cityName=${encodeURIComponent(cityName)}`);
        return parts.length > 0 ? `&${parts.join("&")}` : "";
    };

    // Skeletons
    if (isLoading) {
        return (
            <div className="flex gap-2 overflow-hidden py-1">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                        key={i}
                        className="shrink-0 w-24 h-10 bg-zinc-100/80 animate-pulse rounded-full"
                    />
                ))}
            </div>
        );
    }

    if (!categories || categories.length === 0) {
        return null;
    }

    // ==========================================
    // VARIANT: LANDING PAGE (Simple & Clean Apple Design)
    // ==========================================
    if (variant === "landing") {
        const cityQuery = getCityQueryString();

        return (
            <div className={cn("space-y-3", className)}>
                {/* Categories Row */}
                <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar scroll-smooth py-1">
                    {categories.map((category) => {
                        const isSelected = activeLandingCategory?.key === category.key;

                        return (
                            <button
                                type="button"
                                key={category.id || category.key}
                                onClick={() => setLandingActiveKey(category.key)}
                                className={cn(
                                    "rounded-2xl px-4 py-2.5 sm:py-3 flex items-center gap-2 shrink-0 transition-all active:scale-95 cursor-pointer border text-right",
                                    isSelected
                                        ? "bg-brand text-white border-brand shadow-sm font-bold"
                                        : "bg-soft-bg text-secondary border-soft-border hover:bg-white hover:text-brand hover:border-gray-200"
                                )}
                            >
                                {category.icon && (
                                    <CategoryIcon
                                        icon={category.icon}
                                        displayName={category.displayName}
                                        size={18}
                                        className="shrink-0"
                                    />
                                )}
                                <span className="text-xs sm:text-sm font-bold">{category.displayName}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Subcategories Row (Simple, elegant Apple pills) */}
                {activeLandingCategory && activeLandingCategory.subcategories && activeLandingCategory.subcategories.length > 0 && (
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                        {/* View all in this category pill */}
                        <Link
                            href={`/ads?categoryKey=${activeLandingCategory.key}${cityQuery}`}
                            className="rounded-full px-3.5 py-1.5 text-xs font-bold shrink-0 transition-all bg-primary text-white hover:bg-primary/90 shadow-xs active:scale-95"
                        >
                            همه {activeLandingCategory.displayName}
                        </Link>

                        {/* Subcategory pills */}
                        {activeLandingCategory.subcategories.map((sub) => (
                            <Link
                                key={sub.id || sub.key}
                                href={`/ads?categoryKey=${activeLandingCategory.key}&subcategoryKey=${sub.key}${cityQuery}`}
                                className="rounded-full px-3.5 py-1.5 text-xs font-semibold shrink-0 transition-all bg-soft-bg text-secondary border border-soft-border hover:bg-white hover:text-brand hover:border-gray-300 active:scale-95 flex items-center gap-1.5"
                            >
                                {sub.icon && (
                                    <CategoryIcon
                                        icon={sub.icon}
                                        displayName={sub.displayName}
                                        size={14}
                                        className="shrink-0"
                                    />
                                )}
                                <span>{sub.displayName}</span>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // ==========================================
    // VARIANT: FILTER BAR (Ads Page)
    // ==========================================
    return (
        <div className={cn("flex flex-col gap-2", className)}>
            {/* Primary Category Row */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                {/* All Properties Pill */}
                <button
                    type="button"
                    onClick={() => {
                        onSelectCategory?.("");
                        onSelectSubcategory?.("");
                    }}
                    className={cn(
                        "rounded-full px-4 py-1.5 sm:py-2 flex items-center gap-1.5 shrink-0 text-xs font-bold transition-all active:scale-95 cursor-pointer border",
                        !selectedCategoryKey
                            ? "bg-brand text-white border-brand shadow-xs"
                            : "bg-soft-bg text-secondary border-soft-border hover:bg-white hover:text-brand hover:border-gray-200"
                    )}
                >
                    <span>همه املاک</span>
                </button>

                {/* Categories Pills */}
                {categories.map((category) => {
                    const isSelected = selectedCategoryKey === category.key;

                    return (
                        <button
                            type="button"
                            key={category.id || category.key}
                            onClick={() => onSelectCategory?.(isSelected ? "" : category.key)}
                            className={cn(
                                "rounded-full px-3.5 py-1.5 sm:py-2 flex items-center gap-2 shrink-0 text-xs font-bold transition-all active:scale-95 cursor-pointer border",
                                isSelected
                                    ? "bg-primary text-white border-primary shadow-xs shadow-primary/25"
                                    : "bg-soft-bg text-secondary border-soft-border hover:bg-white hover:text-brand hover:border-gray-200"
                            )}
                        >
                            {category.icon && (
                                <CategoryIcon
                                    icon={category.icon}
                                    displayName={category.displayName}
                                    size={15}
                                    className="shrink-0"
                                />
                            )}
                            <span>{category.displayName}</span>
                        </button>
                    );
                })}
            </div>

            {/* Subcategories Row (revealed when selected category has subcategories) */}
            {activeFilterCategory && activeFilterCategory.subcategories && activeFilterCategory.subcategories.length > 0 && (
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1.5 pb-1 border-t border-gray-100 animate-in fade-in slide-in-from-top-1 duration-200">
                    <span className="text-[11px] font-bold text-text-light shrink-0 ml-1">
                        زیردسته:
                    </span>

                    {/* "All" subcategories pill */}
                    <button
                        type="button"
                        onClick={() => onSelectSubcategory?.("")}
                        className={cn(
                            "rounded-full px-3 py-1 text-xs font-bold transition-all shrink-0 active:scale-95 cursor-pointer border",
                            !selectedSubcategoryKey
                                ? "bg-zinc-900 text-white border-zinc-900 shadow-xs"
                                : "bg-zinc-100 text-zinc-600 border-transparent hover:bg-zinc-200 hover:text-brand"
                        )}
                    >
                        همه
                    </button>

                    {/* Subcategories */}
                    {activeFilterCategory.subcategories.map((sub) => {
                        const isSubSelected = selectedSubcategoryKey === sub.key;

                        return (
                            <button
                                type="button"
                                key={sub.id || sub.key}
                                onClick={() => onSelectSubcategory?.(isSubSelected ? "" : sub.key)}
                                className={cn(
                                    "rounded-full px-3 py-1 flex items-center gap-1.5 text-xs font-bold transition-all shrink-0 active:scale-95 cursor-pointer border",
                                    isSubSelected
                                        ? "bg-primary text-white border-primary shadow-xs shadow-primary/20"
                                        : "bg-white border-zinc-200 text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50 hover:text-brand"
                                )}
                            >
                                {sub.icon && (
                                    <CategoryIcon
                                        icon={sub.icon}
                                        displayName={sub.displayName}
                                        size={13}
                                        className="shrink-0"
                                    />
                                )}
                                <span>{sub.displayName}</span>
                            </button>
                        );
                    })}

                    {/* Clear Subcategory button if active */}
                    {selectedSubcategoryKey && (
                        <button
                            type="button"
                            onClick={() => onSelectSubcategory?.("")}
                            aria-label="حذف فیلتر زیردسته"
                            className="p-1 rounded-full text-zinc-400 hover:text-red-500 hover:bg-zinc-100 transition-colors shrink-0 ml-1 cursor-pointer"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
