"use client";

import { CategoryIcon } from "@/components/CategoryIcon";
import { cn } from "@/lib/utils";
import { CategoryListItem } from "@/types/api/ads.types";
import { ArrowLeft, Building2 } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

export interface CategoryDirectoryProps {
    categories?: CategoryListItem[];
    isLoading?: boolean;
    cityId?: string;
    cityName?: string;
    className?: string;
}

export function CategoryDirectory({
    categories,
    isLoading,
    cityId,
    cityName,
    className,
}: CategoryDirectoryProps) {
    // Build query params for city
    const cityQuery = useMemo(() => {
        const parts: string[] = [];
        if (cityId) parts.push(`cityId=${encodeURIComponent(cityId)}`);
        if (cityName && cityName !== "همه شهرها") parts.push(`cityName=${encodeURIComponent(cityName)}`);
        return parts.length > 0 ? `&${parts.join("&")}` : "";
    }, [cityId, cityName]);

    // Loading Skeletons
    if (isLoading) {
        return (
            <div className={cn("grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5", className)}>
                {[1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        className="bg-[#F5F5F7] rounded-2xl p-3 sm:p-3.5 flex flex-col justify-between min-h-[88px] animate-pulse"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-xl bg-white/80" />
                                <div className="w-16 h-3 bg-zinc-200 rounded-full" />
                            </div>
                            <div className="w-6 h-3 bg-zinc-200/60 rounded-full" />
                        </div>
                        <div className="flex gap-1 mt-2.5">
                            <div className="w-12 h-5 bg-white/80 rounded-full" />
                            <div className="w-10 h-5 bg-white/80 rounded-full" />
                            <div className="w-12 h-5 bg-white/80 rounded-full" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    // If API returned no categories, do not render fake data
    if (!categories || categories.length === 0) {
        return null;
    }

    return (
        <div className={cn("grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5", className)}>
            {categories.map((category) => {
                const isTempRent = category.key === "temporary_rent";
                const mainCategoryHref = isTempRent
                    ? `/temporary-rent${cityQuery ? `?${cityQuery.replace(/^&/, "")}` : ""}`
                    : `/ads?categoryKey=${encodeURIComponent(category.key)}${cityQuery}`;

                // Filter active, non-archived subcategories directly from API
                const activeSubcategories = (category.subcategories || []).filter(
                    (sub) => sub.isActive !== false && !sub.isArchived
                );

                return (
                    <div
                        key={category.id || category.key}
                        className="bg-[#F5F5F7] hover:bg-[#EFEFF2] rounded-2xl p-3 sm:p-3.5 border border-black/[0.03] transition-all duration-200 flex flex-col justify-between group hover:shadow-sm"
                    >
                        {/* Compact Header: Icon + Title + Direct View All Link */}
                        <div className="flex items-center justify-between gap-1.5">
                            <Link
                                href={mainCategoryHref}
                                className="flex items-center gap-2 min-w-0 group/header"
                            >
                                <div className="w-8 h-8 rounded-xl bg-white shadow-xs border border-black/[0.04] flex items-center justify-center shrink-0 group-hover/header:scale-105 transition-transform duration-200">
                                    {category.icon ? (
                                        <CategoryIcon
                                            icon={category.icon}
                                            displayName={category.displayName}
                                            size={16}
                                            className="shrink-0"
                                        />
                                    ) : (
                                        <Building2 className="w-4 h-4 text-zinc-600" />
                                    )}
                                </div>
                                <span className="text-xs sm:text-sm font-bold text-zinc-900 group-hover/header:text-primary transition-colors truncate">
                                    {category.displayName}
                                </span>
                            </Link>

                            <Link
                                href={mainCategoryHref}
                                aria-label={`مشاهده همه ${category.displayName}`}
                                className="text-[11px] font-semibold text-zinc-400 hover:text-primary flex items-center gap-0.5 shrink-0 transition-colors py-0.5 px-1"
                            >
                                <span className="hidden sm:inline">همه</span>
                                <ArrowLeft className="w-3 h-3 group-hover:translate-x-[-2px] transition-transform" />
                            </Link>
                        </div>

                        {/* Subcategories (Directly from API as Apple-style Micro-pills) */}
                        {activeSubcategories.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2.5">
                                {activeSubcategories.slice(0, 4).map((sub) => {
                                    const subHref = isTempRent
                                        ? `/temporary-rent${cityQuery ? `?${cityQuery.replace(/^&/, "")}` : ""}`
                                        : `/ads?categoryKey=${encodeURIComponent(category.key)}&subcategoryKey=${encodeURIComponent(sub.key)}${cityQuery}`;

                                    return (
                                        <Link
                                            key={sub.id || sub.key}
                                            href={subHref}
                                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white hover:bg-zinc-900 text-zinc-600 hover:text-white border border-black/[0.04] hover:border-transparent text-[10px] sm:text-[11px] font-medium shadow-2xs transition-all active:scale-95"
                                        >
                                            {sub.icon && (
                                                <CategoryIcon
                                                    icon={sub.icon}
                                                    displayName={sub.displayName}
                                                    size={12}
                                                    className="shrink-0"
                                                />
                                            )}
                                            <span>{sub.displayName}</span>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

export default CategoryDirectory;
