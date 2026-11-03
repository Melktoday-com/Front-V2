"use client";

import { temporaryRentIcon } from "@/assets/icons";
import { CategoryIcon } from "@/components/CategoryIcon";
import { cn } from "@/lib/utils";
import { CategoryListItem } from "@/types/api/ads.types";
import { Building2 } from "lucide-react";
import type { StaticImageData } from "next/image";
import Link from "next/link";
import { useMemo } from "react";

export interface DirectoryCategoryItem {
    id: string;
    key: string;
    displayName: string;
    icon?: string | StaticImageData | null;
}

export interface CategoryDirectoryProps {
    categories?: CategoryListItem[];
    isLoading?: boolean;
    cityId?: string;
    cityName?: string;
    className?: string;
}

const STATIC_TEMPORARY_RENT_CATEGORY: DirectoryCategoryItem = {
    id: "temporary_rent",
    key: "temporary_rent",
    displayName: "اقامتگاه",
    icon: temporaryRentIcon,
};

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

    // Combine incoming categories with the static residence (temporary_rent) category
    const displayCategories = useMemo<DirectoryCategoryItem[]>(() => {
        if (!categories || categories.length === 0) {
            return [STATIC_TEMPORARY_RENT_CATEGORY];
        }

        const hasTempRent = categories.some((c) => c.key === "temporary_rent");
        if (hasTempRent) {
            return categories.map((c) =>
                c.key === "temporary_rent"
                    ? {
                          ...c,
                          displayName: c.displayName || STATIC_TEMPORARY_RENT_CATEGORY.displayName,
                          icon: c.icon || STATIC_TEMPORARY_RENT_CATEGORY.icon,
                      }
                    : c
            );
        }

        return [...categories, STATIC_TEMPORARY_RENT_CATEGORY];
    }, [categories]);

    // Loading Skeletons
    if (isLoading) {
        return (
            <div className={cn("grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-6 gap-2 sm:gap-3 lg:gap-3.5", className)}>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                        key={i}
                        className="bg-transparent lg:bg-surface-secondary/70 rounded-2xl py-1 px-1 lg:p-3.5 border-0 lg:border lg:border-soft-border/70 flex flex-col lg:flex-row items-center justify-center lg:justify-start text-center lg:text-start gap-1.5 lg:gap-2.5 animate-pulse"
                    >
                        <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-2xl bg-surface-secondary/80 lg:bg-surface shrink-0" />
                        <div className="w-14 lg:w-20 h-2.5 lg:h-4 bg-zinc-200/80 rounded-full" />
                    </div>
                ))}
            </div>
        );
    }

    if (displayCategories.length === 0) {
        return null;
    }

    return (
        <div className={cn("grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-6 gap-2 sm:gap-3 lg:gap-3.5", className)}>
            {displayCategories.map((category) => {
                const isTempRent = category.key === "temporary_rent";
                const mainCategoryHref = isTempRent
                    ? `/temporary-rent${cityQuery ? `?${cityQuery.replace(/^&/, "")}` : ""}`
                    : `/ads?categoryKey=${encodeURIComponent(category.key)}${cityQuery}`;

                return (
                    <Link
                        key={category.id || category.key}
                        href={mainCategoryHref}
                        className="bg-transparent lg:bg-surface-secondary/70 lg:hover:bg-surface rounded-2xl py-1 px-1 lg:p-3.5 border-0 lg:border lg:border-soft-border/80 lg:hover:border-primary/40 transition-all duration-300 flex flex-col lg:flex-row items-center justify-center lg:justify-start text-center lg:text-start gap-1.5 lg:gap-3 group lg:hover:shadow-md lg:hover:shadow-brand/5 lg:hover:scale-[1.02] active:scale-95 lg:active:scale-[0.98] w-full"
                    >
                        <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-2xl bg-transparent lg:bg-surface shadow-none lg:shadow-xs border-0 lg:border lg:border-soft-border flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 lg:group-hover:scale-120 lg:group-hover:border-primary/40">
                            {category.icon ? (
                                <CategoryIcon
                                    icon={category.icon}
                                    displayName={category.displayName}
                                    size={56}
                                    className="w-10 h-10 lg:w-10 lg:h-10 shrink-0"
                                    imgClassName="w-10 h-10 lg:w-10 lg:h-10 object-contain"
                                />
                            ) : (
                                <Building2 className="w-8 h-8 lg:w-8 lg:h-8 text-primary" />
                            )}
                        </div>
                        <span className="text-[11px] md:text-xs lg:text-sm font-bold lg:font-black text-brand group-hover:text-primary transition-colors text-center lg:text-start leading-snug line-clamp-2 lg:line-clamp-1 break-words max-w-full">
                            {category.displayName}
                        </span>
                    </Link>
                );
            })}
        </div>
    );
}

export default CategoryDirectory;
