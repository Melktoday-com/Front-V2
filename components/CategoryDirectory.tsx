"use client";

import { CategoryIcon } from "@/components/CategoryIcon";
import { cn } from "@/lib/utils";
import { CategoryListItem, Subcategory } from "@/types/api/ads.types";
import {
    ArrowLeft,
    Building2,
    Factory,
    Home,
    Hotel,
    LandPlot,
    type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

export interface CategoryDirectoryProps {
    categories?: CategoryListItem[];
    isLoading?: boolean;
    cityId?: string;
    cityName?: string;
    className?: string;
}

interface CategoryMeta {
    displayName: string;
    icon: LucideIcon;
    customHref?: string;
    iconColor: string;
    defaultSubcategories: {
        key: string;
        displayName: string;
    }[];
}

const CATEGORY_META_CONFIG: Record<string, CategoryMeta> = {
    residential: {
        displayName: "املاک مسکونی",
        icon: Home,
        iconColor: "text-blue-600",
        defaultSubcategories: [
            { key: "apartment", displayName: "آپارتمان" },
            { key: "villa", displayName: "ویلا" },
            { key: "suite", displayName: "سوئیت" },
        ],
    },
    commercial: {
        displayName: "تجاری و اداری",
        icon: Building2,
        iconColor: "text-teal-600",
        defaultSubcategories: [
            { key: "office", displayName: "دفتر کار" },
            { key: "store", displayName: "مغازه" },
            { key: "shop", displayName: "اداری" },
        ],
    },
    land: {
        displayName: "زمین و کلنگی",
        icon: LandPlot,
        iconColor: "text-amber-600",
        defaultSubcategories: [
            { key: "residential_land", displayName: "زمین مسکونی" },
            { key: "garden", displayName: "باغ و باغچه" },
            { key: "old_building", displayName: "کلنگی" },
        ],
    },
    temporary_rent: {
        displayName: "اجاره روزانه",
        icon: Hotel,
        iconColor: "text-rose-600",
        customHref: "/temporary-rent",
        defaultSubcategories: [
            { key: "villa", displayName: "ویلا استخردار" },
            { key: "cottage", displayName: "کلبه" },
            { key: "suite", displayName: "سوئیت روزانه" },
        ],
    },
    industrial: {
        displayName: "صنعتی و کارگاه",
        icon: Factory,
        iconColor: "text-indigo-600",
        defaultSubcategories: [
            { key: "factory", displayName: "کارخانه" },
            { key: "warehouse", displayName: "انبار و سوله" },
        ],
    },
};

const ORDERED_DEFAULT_KEYS = ["residential", "commercial", "land", "temporary_rent"];

export function CategoryDirectory({
    categories,
    isLoading,
    cityId,
    cityName,
    className,
}: CategoryDirectoryProps) {
    const cityQuery = useMemo(() => {
        const parts: string[] = [];
        if (cityId) parts.push(`cityId=${encodeURIComponent(cityId)}`);
        if (cityName && cityName !== "همه شهرها") parts.push(`cityName=${encodeURIComponent(cityName)}`);
        return parts.length > 0 ? `&${parts.join("&")}` : "";
    }, [cityId, cityName]);

    const directoryItems = useMemo(() => {
        if (categories && categories.length > 0) {
            return categories.map((cat) => {
                const meta = CATEGORY_META_CONFIG[cat.key] || {
                    displayName: cat.displayName,
                    icon: Building2,
                    iconColor: "text-zinc-700",
                    defaultSubcategories: [],
                };

                const subcategories = (cat.subcategories && cat.subcategories.length > 0)
                    ? cat.subcategories
                    : (meta.defaultSubcategories as Subcategory[]);

                return {
                    id: cat.id || cat.key,
                    key: cat.key,
                    displayName: cat.displayName || meta.displayName,
                    icon: cat.icon,
                    FallbackIcon: meta.icon,
                    iconColor: meta.iconColor,
                    customHref: meta.customHref,
                    subcategories,
                };
            });
        }

        return ORDERED_DEFAULT_KEYS.map((key) => {
            const meta = CATEGORY_META_CONFIG[key];
            return {
                id: key,
                key,
                displayName: meta.displayName,
                icon: undefined,
                FallbackIcon: meta.icon,
                iconColor: meta.iconColor,
                customHref: meta.customHref,
                subcategories: meta.defaultSubcategories as unknown as Subcategory[],
            };
        });
    }, [categories]);

    // Loading Skeletons
    if (isLoading) {
        return (
            <div className={cn("grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3", className)}>
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

    return (
        <div className={cn("grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5", className)}>
            {directoryItems.map((item) => {
                const { key, displayName, icon, FallbackIcon, iconColor, customHref, subcategories } = item;

                const mainCategoryHref = customHref
                    ? `${customHref}${cityQuery ? `?${cityQuery.replace(/^&/, "")}` : ""}`
                    : `/ads?categoryKey=${encodeURIComponent(key)}${cityQuery}`;

                return (
                    <div
                        key={item.id || key}
                        className="bg-[#F5F5F7] hover:bg-[#EFEFF2] rounded-2xl p-3 sm:p-3.5 border border-black/[0.03] transition-all duration-200 flex flex-col justify-between group hover:shadow-sm"
                    >
                        {/* Compact Header: Icon + Title + Direct View All Link */}
                        <div className="flex items-center justify-between gap-1.5">
                            <Link
                                href={mainCategoryHref}
                                className="flex items-center gap-2 min-w-0 group/header"
                            >
                                <div className="w-8 h-8 rounded-xl bg-white shadow-xs border border-black/[0.04] flex items-center justify-center shrink-0 group-hover/header:scale-105 transition-transform duration-200">
                                    {icon ? (
                                        <CategoryIcon
                                            icon={icon}
                                            displayName={displayName}
                                            size={16}
                                            className="shrink-0"
                                        />
                                    ) : (
                                        <FallbackIcon className={cn("w-4 h-4", iconColor)} />
                                    )}
                                </div>
                                <span className="text-xs sm:text-sm font-bold text-zinc-900 group-hover/header:text-primary transition-colors truncate">
                                    {displayName}
                                </span>
                            </Link>

                            <Link
                                href={mainCategoryHref}
                                aria-label={`مشاهده همه ${displayName}`}
                                className="text-[11px] font-semibold text-zinc-400 hover:text-primary flex items-center gap-0.5 shrink-0 transition-colors py-0.5 px-1"
                            >
                                <span className="hidden sm:inline">همه</span>
                                <ArrowLeft className="w-3 h-3 group-hover:translate-x-[-2px] transition-transform" />
                            </Link>
                        </div>

                        {/* Compact Apple-style Pills (Subcategories) */}
                        {subcategories && subcategories.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2.5">
                                {subcategories.slice(0, 3).map((sub) => {
                                    const subHref = customHref
                                        ? `${customHref}${cityQuery ? `?${cityQuery.replace(/^&/, "")}` : ""}`
                                        : `/ads?categoryKey=${encodeURIComponent(key)}&subcategoryKey=${encodeURIComponent(sub.key)}${cityQuery}`;

                                    return (
                                        <Link
                                            key={sub.id || sub.key}
                                            href={subHref}
                                            className="inline-flex items-center px-2 py-0.5 rounded-full bg-white hover:bg-zinc-900 text-zinc-600 hover:text-white border border-black/[0.04] hover:border-transparent text-[10px] sm:text-[11px] font-medium shadow-2xs transition-all active:scale-95"
                                        >
                                            {sub.displayName}
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
