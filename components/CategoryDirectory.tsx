"use client";

import { CategoryIcon } from "@/components/CategoryIcon";
import { cn } from "@/lib/utils";
import { CategoryListItem } from "@/types/api/ads.types";
import { Building2 } from "lucide-react";
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
                        className="bg-surface-secondary/70 rounded-2xl p-3.5 sm:p-4 border border-soft-border/70 flex flex-col justify-between min-h-[96px] animate-pulse"
                    >
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-surface" />
                            <div className="w-28 h-4 bg-zinc-200/80 rounded-full" />
                        </div>
                        <div className="flex gap-1.5 mt-3 pt-2.5 border-t border-soft-border/40">
                            <div className="w-16 h-6 bg-surface rounded-full" />
                            <div className="w-14 h-6 bg-surface rounded-full" />
                            <div className="w-16 h-6 bg-surface rounded-full" />
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
                        className="bg-surface-secondary/70 hover:bg-surface rounded-2xl p-3.5 sm:p-4 border border-soft-border/80 hover:border-primary/40 transition-all duration-300 flex flex-col justify-between group hover:shadow-md hover:shadow-brand/5"
                    >
                        {/* Header: Icon + Title only */}
                        <div className="flex items-center gap-2.5">
                            <Link
                                href={mainCategoryHref}
                                className="flex items-center gap-2.5 min-w-0 group/header flex-1"
                            >
                                <div className="w-9 h-9 sm:w-8.5 sm:h-8.5 rounded-xl bg-surface shadow-xs border border-soft-border flex items-center justify-center shrink-0 group-hover/header:scale-105 group-hover/header:border-primary/30 transition-transform duration-200">
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
                                <span className="text-sm font-black text-brand group-hover/header:text-primary transition-colors truncate">
                                    {category.displayName}
                                </span>
                            </Link>
                        </div>

                        {/* Subcategories: Micro-pills with Icon + Title only */}
                        {activeSubcategories.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-2.5 border-t border-soft-border/50">
                                {activeSubcategories.map((sub) => {
                                    const subHref = isTempRent
                                        ? `/temporary-rent${cityQuery ? `?${cityQuery.replace(/^&/, "")}` : ""}`
                                        : `/ads?categoryKey=${encodeURIComponent(category.key)}&subcategoryKey=${encodeURIComponent(sub.key)}${cityQuery}`;

                                    return (
                                        <Link
                                            key={sub.id || sub.key}
                                            href={subHref}
                                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface hover:bg-brand text-secondary hover:text-white border border-soft-border text-[11px] font-medium shadow-2xs transition-all active:scale-95 group/sub"
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
