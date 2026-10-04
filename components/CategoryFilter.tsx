"use client";

import { CategoryDirectory } from "@/components/CategoryDirectory";
import { CategoryIcon } from "@/components/CategoryIcon";
import { cn } from "@/lib/utils";
import { CategoryListItem } from "@/types/api/ads.types";
import { X } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

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
    const activeFilterCategory = useMemo(() => {
        if (!selectedCategoryKey) return null;
        return categories.find((c) => c.key === selectedCategoryKey) || null;
    }, [categories, selectedCategoryKey]);

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
    // VARIANT: LANDING PAGE (Visual Column Directory)
    // ==========================================
    if (variant === "landing") {
        return (
            <CategoryDirectory
                categories={categories}
                isLoading={isLoading}
                cityId={cityId}
                cityName={cityName}
                className={className}
            />
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
