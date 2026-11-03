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
            <div className={cn("grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-3.5", className)}>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                        key={i}
                        className="bg-surface-secondary/70 rounded-2xl p-3 sm:p-3.5 border border-soft-border/70 flex items-center gap-2.5 animate-pulse"
                    >
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-surface shrink-0" />
                        <div className="w-20 h-4 bg-zinc-200/80 rounded-full" />
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
        <div className={cn("grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-3.5", className)}>
            {categories.map((category) => {
                const isTempRent = category.key === "temporary_rent";
                const mainCategoryHref = isTempRent
                    ? `/temporary-rent${cityQuery ? `?${cityQuery.replace(/^&/, "")}` : ""}`
                    : `/ads?categoryKey=${encodeURIComponent(category.key)}${cityQuery}`;

                return (
                    <Link
                        key={category.id || category.key}
                        href={mainCategoryHref}
                        className="bg-surface-secondary/70 hover:bg-surface rounded-2xl p-3 sm:p-3.5 border border-soft-border/80 hover:border-primary/40 transition-all duration-300 flex items-center gap-2.5 sm:gap-3 group hover:shadow-md hover:shadow-brand/5 active:scale-[0.98]"
                    >
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-surface shadow-xs border border-soft-border flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:border-primary/30 transition-transform duration-200">
                            {category.icon ? (
                                <CategoryIcon
                                    icon={category.icon}
                                    displayName={category.displayName}
                                    size={18}
                                    className="shrink-0"
                                />
                            ) : (
                                <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                            )}
                        </div>
                        <span className="text-xs sm:text-sm font-black text-brand group-hover:text-primary transition-colors truncate">
                            {category.displayName}
                        </span>
                    </Link>
                );
            })}
        </div>
    );
}

export default CategoryDirectory;
