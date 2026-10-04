"use client";

import { CategoryIcon } from "@/components/CategoryIcon";
import { cn, toPersianDigits } from "@/lib/utils";
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
            <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5", className)}>
                {[1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        className="bg-[#F8F9FA] rounded-2xl p-3.5 sm:p-4 border border-soft-border/70 flex flex-col justify-between min-h-[96px] animate-pulse"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-white" />
                                <div className="w-28 h-4 bg-zinc-200/80 rounded-full" />
                            </div>
                            <div className="w-12 h-6 bg-white rounded-full" />
                        </div>
                        <div className="flex gap-1.5 mt-3 pt-2.5 border-t border-soft-border/40">
                            <div className="w-16 h-6 bg-white rounded-full" />
                            <div className="w-14 h-6 bg-white rounded-full" />
                            <div className="w-16 h-6 bg-white rounded-full" />
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
        <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5", className)}>
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
                        className="bg-[#F8F9FA] hover:bg-white rounded-2xl p-3.5 sm:p-4 border border-soft-border/80 hover:border-primary/40 transition-all duration-300 flex flex-col justify-between group hover:shadow-md hover:shadow-brand/5"
                    >
                        {/* Header: Icon + Title + Direct View All Link */}
                        <div className="flex items-center justify-between gap-2.5">
                            <Link
                                href={mainCategoryHref}
                                className="flex items-center gap-2.5 min-w-0 group/header flex-1"
                            >
                                <div className="w-9 h-9 sm:w-8.5 sm:h-8.5 rounded-xl bg-white shadow-xs border border-soft-border flex items-center justify-center shrink-0 group-hover/header:scale-105 group-hover/header:border-primary/30 transition-transform duration-200">
                                    {category.icon ? (
                                        <CategoryIcon
                                            icon={category.icon}
                                            displayName={category.displayName}
                                            size={18}
                                            className="shrink-0"
                                        />
                                    ) : (
                                        <Building2 className="w-4 h-4 text-primary" />
                                    )}
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-sm font-black text-brand group-hover/header:text-primary transition-colors truncate">
                                        {category.displayName}
                                    </span>
                                    {category.description && (
                                        <span className="text-[11px] text-secondary/60 line-clamp-1">
                                            {category.description}
                                        </span>
                                    )}
                                </div>
                            </Link>

                            <Link
                                href={mainCategoryHref}
                                aria-label={`مشاهده همه ${category.displayName}`}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white hover:bg-primary/10 text-secondary hover:text-primary border border-soft-border text-xs font-bold shrink-0 transition-all group/btn"
                            >
                                <span>همه</span>
                                <ArrowLeft className="w-3.5 h-3.5 group-hover/btn:-translate-x-0.5 transition-transform" />
                            </Link>
                        </div>

                        {/* Subcategories (Directly from API as Apple-style Micro-pills) */}
                        {activeSubcategories.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-2.5 border-t border-soft-border/50">
                                {activeSubcategories.slice(0, 5).map((sub) => {
                                    const subHref = isTempRent
                                        ? `/temporary-rent${cityQuery ? `?${cityQuery.replace(/^&/, "")}` : ""}`
                                        : `/ads?categoryKey=${encodeURIComponent(category.key)}&subcategoryKey=${encodeURIComponent(sub.key)}${cityQuery}`;

                                    return (
                                        <Link
                                            key={sub.id || sub.key}
                                            href={subHref}
                                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white hover:bg-brand text-secondary hover:text-white border border-soft-border text-[11px] font-medium shadow-2xs transition-all active:scale-95 group/sub"
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
                                {activeSubcategories.length > 5 && (
                                    <Link
                                        href={mainCategoryHref}
                                        className="inline-flex items-center px-2 py-1 rounded-full bg-white hover:bg-primary/10 text-secondary hover:text-primary text-[10px] font-bold border border-soft-border transition-colors"
                                    >
                                        +{toPersianDigits(activeSubcategories.length - 5)}
                                    </Link>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

export default CategoryDirectory;
