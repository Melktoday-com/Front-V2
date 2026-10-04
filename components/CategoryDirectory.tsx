"use client";

import { CategoryIcon } from "@/components/CategoryIcon";
import { cn, toPersianDigits } from "@/lib/utils";
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
    description: string;
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
        description: "خرید، رهن و اجاره خانه و آپارتمان",
        icon: Home,
        iconColor: "text-blue-600",
        defaultSubcategories: [
            { key: "apartment", displayName: "آپارتمان" },
            { key: "villa", displayName: "ویلا" },
            { key: "suite", displayName: "سوئیت" },
            { key: "furnished_apartment", displayName: "مبله" },
        ],
    },
    commercial: {
        displayName: "تجاری و اداری",
        description: "دفاتر کار، مغازه‌ها و مراکز تجاری",
        icon: Building2,
        iconColor: "text-teal-600",
        defaultSubcategories: [
            { key: "office", displayName: "دفتر کار" },
            { key: "store", displayName: "مغازه" },
            { key: "shop", displayName: "اداری" },
            { key: "commercial_land", displayName: "موقعیت تجاری" },
        ],
    },
    land: {
        displayName: "زمین و کلنگی",
        description: "سرمایه‌گذاری، باغ، ساخت و ساز",
        icon: LandPlot,
        iconColor: "text-amber-600",
        defaultSubcategories: [
            { key: "residential_land", displayName: "زمین مسکونی" },
            { key: "garden", displayName: "باغ و باغچه" },
            { key: "agricultural", displayName: "کشاورزی" },
            { key: "old_building", displayName: "کلنگی" },
        ],
    },
    temporary_rent: {
        displayName: "اجاره روزانه",
        description: "ویلاهای لوکس و اقامتگاه‌های مسافرتی",
        icon: Hotel,
        iconColor: "text-rose-600",
        customHref: "/temporary-rent",
        defaultSubcategories: [
            { key: "villa", displayName: "ویلا استخردار" },
            { key: "cottage", displayName: "کلبه چوبی" },
            { key: "suite", displayName: "سوئیت روزانه" },
            { key: "beach", displayName: "اقامتگاه ساحلی" },
        ],
    },
    industrial: {
        displayName: "املاک صنعتی",
        description: "سوله، کارگاه، کارخانه و انبار",
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
                    description: cat.description || "مشاهده آگهی‌های مرتبط",
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
                    description: cat.description || meta.description,
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
                description: meta.description,
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
            <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4", className)}>
                {[1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        className="bg-[#F5F5F7] rounded-[26px] p-6 flex flex-col justify-between min-h-[220px] animate-pulse"
                    >
                        <div>
                            <div className="w-12 h-12 rounded-2xl bg-white/80 mb-4" />
                            <div className="w-24 h-4 bg-zinc-200 rounded-full mb-2" />
                            <div className="w-36 h-3 bg-zinc-200/60 rounded-full mb-5" />
                            <div className="flex gap-2">
                                <div className="w-16 h-7 bg-white/80 rounded-full" />
                                <div className="w-14 h-7 bg-white/80 rounded-full" />
                                <div className="w-16 h-7 bg-white/80 rounded-full" />
                            </div>
                        </div>
                        <div className="w-20 h-4 bg-zinc-200/60 rounded-full mt-6" />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4", className)}>
            {directoryItems.map((item) => {
                const { key, displayName, description, icon, FallbackIcon, iconColor, customHref, subcategories } = item;

                const mainCategoryHref = customHref
                    ? `${customHref}${cityQuery ? `?${cityQuery.replace(/^&/, "")}` : ""}`
                    : `/ads?categoryKey=${encodeURIComponent(key)}${cityQuery}`;

                return (
                    <div
                        key={item.id || key}
                        className="bg-[#F5F5F7] hover:bg-[#EFEFF2] rounded-[26px] p-6 border border-black/[0.03] transition-all duration-300 flex flex-col justify-between group hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:-translate-y-0.5"
                    >
                        <div>
                            {/* Category Header Link */}
                            <Link
                                href={mainCategoryHref}
                                className="block group/title"
                            >
                                <div className="w-12 h-12 rounded-2xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-black/[0.04] flex items-center justify-center shrink-0 mb-4 group-hover/title:scale-105 transition-transform duration-300">
                                    {icon ? (
                                        <CategoryIcon
                                            icon={icon}
                                            displayName={displayName}
                                            size={24}
                                            className="shrink-0"
                                        />
                                    ) : (
                                        <FallbackIcon className={cn("w-6 h-6", iconColor)} />
                                    )}
                                </div>

                                <h3 className="text-zinc-900 font-extrabold text-base tracking-tight group-hover/title:text-primary transition-colors">
                                    {displayName}
                                </h3>
                                <p className="text-zinc-500 text-xs font-normal mt-0.5 line-clamp-1 leading-relaxed">
                                    {description}
                                </p>
                            </Link>

                            {/* Subcategories (Clean Apple-style Pill Capsules) */}
                            {subcategories && subcategories.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-4">
                                    {subcategories.slice(0, 4).map((sub) => {
                                        const subHref = customHref
                                            ? `${customHref}${cityQuery ? `?${cityQuery.replace(/^&/, "")}` : ""}`
                                            : `/ads?categoryKey=${encodeURIComponent(key)}&subcategoryKey=${encodeURIComponent(sub.key)}${cityQuery}`;

                                        return (
                                            <Link
                                                key={sub.id || sub.key}
                                                href={subHref}
                                                className="inline-flex items-center px-3 py-1.5 rounded-full bg-white hover:bg-zinc-900 text-zinc-700 hover:text-white border border-black/[0.04] hover:border-transparent text-xs font-medium shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all duration-200 active:scale-95"
                                            >
                                                <span>{sub.displayName}</span>
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Footer Link & Counter */}
                        <div className="mt-5 pt-2 flex items-center justify-between">
                            <Link
                                href={mainCategoryHref}
                                className="inline-flex items-center gap-1 text-xs font-bold text-zinc-900 hover:text-primary transition-colors group/link"
                            >
                                <span>مشاهده همه</span>
                                <ArrowLeft className="w-3.5 h-3.5 text-zinc-400 group-hover/link:text-primary group-hover/link:-translate-x-0.5 transition-all" />
                            </Link>

                            {subcategories && subcategories.length > 0 && (
                                <span className="text-[11px] font-medium text-zinc-400">
                                    {toPersianDigits(subcategories.length)} زیردسته
                                </span>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export default CategoryDirectory;
