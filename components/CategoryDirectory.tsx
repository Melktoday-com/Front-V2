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
            <div className={cn("grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-6 gap-1.5 sm:gap-3.5", className)}>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                        key={i}
                        className="bg-transparent sm:bg-surface-secondary/70 rounded-2xl p-1 sm:p-3.5 border-0 sm:border sm:border-soft-border/70 flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-1 sm:gap-2.5 animate-pulse"
                    >
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-surface-secondary/80 sm:bg-surface shrink-0" />
                        <div className="w-14 sm:w-20 h-2.5 sm:h-4 bg-zinc-200/80 rounded-full" />
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
        <div className={cn("grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-6 gap-1.5 sm:gap-3.5", className)}>
            {categories.map((category) => {
                const isTempRent = category.key === "temporary_rent";
                const mainCategoryHref = isTempRent
                    ? `/temporary-rent${cityQuery ? `?${cityQuery.replace(/^&/, "")}` : ""}`
                    : `/ads?categoryKey=${encodeURIComponent(category.key)}${cityQuery}`;

                return (
                    <Link
                        key={category.id || category.key}
                        href={mainCategoryHref}
                        className="bg-transparent sm:bg-surface-secondary/70 sm:hover:bg-surface rounded-2xl p-1 sm:p-3.5 border-0 sm:border sm:border-soft-border/80 sm:hover:border-primary/40 transition-all duration-300 flex flex-col sm:flex-row items-center justify-center sm:justify-start text-center sm:text-start gap-1 sm:gap-3 group sm:hover:shadow-md sm:hover:shadow-brand/5 active:scale-95 sm:active:scale-[0.98]"
                    >
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-transparent sm:bg-surface shadow-none sm:shadow-xs border-0 sm:border sm:border-soft-border flex items-center justify-center shrink-0 group-hover:scale-110 sm:group-hover:scale-105 sm:group-hover:border-primary/30 transition-transform duration-200">
                            {category.icon ? (
                                <CategoryIcon
                                    icon={category.icon}
                                    displayName={category.displayName}
                                    size={22}
                                    className="shrink-0"
                                />
                            ) : (
                                <Building2 className="w-5 h-5 sm:w-5 sm:h-5 text-primary" />
                            )}
                        </div>
                        <span className="text-[11px] sm:text-sm font-bold sm:font-black text-brand group-hover:text-primary transition-colors text-center sm:text-start leading-snug line-clamp-2 sm:line-clamp-1 break-words max-w-full">
                            {category.displayName}
                        </span>
                    </Link>
                );
            })}
        </div>
    );
}

export default CategoryDirectory;
