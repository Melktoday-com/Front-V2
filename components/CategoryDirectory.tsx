"use client";

import { CategoryIcon } from "@/components/CategoryIcon";
import { cn } from "@/lib/utils";
import { CategoryListItem, Subcategory } from "@/types/api/ads.types";
import {
    Armchair,
    ArrowLeft,
    BedDouble,
    Briefcase,
    Building,
    Building2,
    Castle,
    ChevronLeft,
    Coins,
    Compass,
    DoorClosed,
    Factory,
    Hammer,
    Home,
    Hotel,
    LandPlot,
    Palmtree,
    Store,
    Tent,
    Trees,
    Warehouse,
    Wheat,
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
    badgeText?: string;
    theme: {
        iconBg: string;
        iconColor: string;
        hoverBorder: string;
        accentBg: string;
    };
    customHref?: string;
    defaultSubcategories: {
        key: string;
        displayName: string;
        icon?: LucideIcon;
    }[];
}

const CATEGORY_META_CONFIG: Record<string, CategoryMeta> = {
    residential: {
        displayName: "املاک مسکونی",
        description: "خرید، رهن و اجاره خانه و آپارتمان",
        icon: Home,
        badgeText: "بیشترین آگهی",
        theme: {
            iconBg: "bg-blue-50 group-hover:bg-blue-600 transition-colors",
            iconColor: "text-blue-600 group-hover:text-white transition-colors",
            hoverBorder: "hover:border-blue-200 hover:shadow-blue-500/5",
            accentBg: "bg-blue-50/50 text-blue-700",
        },
        defaultSubcategories: [
            { key: "apartment", displayName: "آپارتمان و برج", icon: Building },
            { key: "villa", displayName: "ویلا و ویلایی", icon: Castle },
            { key: "suite", displayName: "سوئیت و پنت‌هاوس", icon: DoorClosed },
            { key: "furnished_apartment", displayName: "آپارتمان مبله", icon: Armchair },
        ],
    },
    commercial: {
        displayName: "املاک تجاری و اداری",
        description: "دفاتر کار، مغازه‌ها و فرصت‌های تجاری",
        icon: Building2,
        badgeText: "کسب‌وکار",
        theme: {
            iconBg: "bg-emerald-50 group-hover:bg-emerald-600 transition-colors",
            iconColor: "text-emerald-600 group-hover:text-white transition-colors",
            hoverBorder: "hover:border-emerald-200 hover:shadow-emerald-500/5",
            accentBg: "bg-emerald-50/50 text-emerald-700",
        },
        defaultSubcategories: [
            { key: "office", displayName: "دفتر کار و شرکت", icon: Briefcase },
            { key: "store", displayName: "مغازه و فروشگاه", icon: Store },
            { key: "shop", displayName: "املاک اداری و تجاری", icon: Building2 },
            { key: "commercial_land", displayName: "زمین و موقعیت تجاری", icon: Coins },
        ],
    },
    land: {
        displayName: "زمین، باغ و کلنگی",
        description: "فرصت‌های سرمایه‌گذاری، ساخت و ساز و باغ",
        icon: LandPlot,
        badgeText: "سرمایه‌گذاری",
        theme: {
            iconBg: "bg-amber-50 group-hover:bg-amber-600 transition-colors",
            iconColor: "text-amber-600 group-hover:text-white transition-colors",
            hoverBorder: "hover:border-amber-200 hover:shadow-amber-500/5",
            accentBg: "bg-amber-50/50 text-amber-700",
        },
        defaultSubcategories: [
            { key: "residential_land", displayName: "زمین مسکونی و تفکیکی", icon: LandPlot },
            { key: "garden", displayName: "باغ، باغچه و ویلا باغ", icon: Trees },
            { key: "agricultural", displayName: "زمین کشاورزی و هکتاری", icon: Wheat },
            { key: "old_building", displayName: "ملک کلنگی و مشارکتی", icon: Hammer },
        ],
    },
    temporary_rent: {
        displayName: "اجاره روزانه و اقامتگاه",
        description: "ویلاهای لوکس، کلبه و بوم‌گردی‌های اقامتی",
        icon: Hotel,
        badgeText: "سفر و اقامت",
        customHref: "/temporary-rent",
        theme: {
            iconBg: "bg-rose-50 group-hover:bg-rose-600 transition-colors",
            iconColor: "text-rose-600 group-hover:text-white transition-colors",
            hoverBorder: "hover:border-rose-200 hover:shadow-rose-500/5",
            accentBg: "bg-rose-50/50 text-rose-700",
        },
        defaultSubcategories: [
            { key: "villa", displayName: "ویلا استخردار و لوکس", icon: Palmtree },
            { key: "cottage", displayName: "کلبه چوبی و جنگلی", icon: Tent },
            { key: "suite", displayName: "سوئیت و آپارتمان روزانه", icon: BedDouble },
            { key: "beach", displayName: "اقامتگاه‌های ساحلی", icon: Compass },
        ],
    },
    industrial: {
        displayName: "املاک صنعتی و انبار",
        description: "سوله، کارگاه، کارخانه و انبار اختصاصی",
        icon: Factory,
        badgeText: "صنعتی",
        theme: {
            iconBg: "bg-purple-50 group-hover:bg-purple-600 transition-colors",
            iconColor: "text-purple-600 group-hover:text-white transition-colors",
            hoverBorder: "hover:border-purple-200 hover:shadow-purple-500/5",
            accentBg: "bg-purple-50/50 text-purple-700",
        },
        defaultSubcategories: [
            { key: "factory", displayName: "کارخانه و واحد تولیدی", icon: Factory },
            { key: "warehouse", displayName: "انبار و سوله مسقف", icon: Warehouse },
        ],
    },
};

// Fallback category keys to show when backend has no categories loaded
const ORDERED_DEFAULT_KEYS = ["residential", "commercial", "land", "temporary_rent"];

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

    // Combined category list with rich metadata
    const directoryItems = useMemo(() => {
        // If we have categories from backend:
        if (categories && categories.length > 0) {
            return categories.map((cat) => {
                const meta = CATEGORY_META_CONFIG[cat.key] || {
                    displayName: cat.displayName,
                    description: cat.description || "مشاهده انواع آگهی‌های مرتبط",
                    icon: Building,
                    theme: {
                        iconBg: "bg-gray-100 group-hover:bg-brand transition-colors",
                        iconColor: "text-brand group-hover:text-white transition-colors",
                        hoverBorder: "hover:border-primary/40 hover:shadow-primary/5",
                        accentBg: "bg-gray-100 text-secondary",
                    },
                    defaultSubcategories: [],
                };

                // Merge real subcategories or fallback to defaults
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
                    theme: meta.theme,
                    badgeText: meta.badgeText,
                    customHref: meta.customHref,
                    subcategories,
                };
            });
        }

        // Fallback when backend is empty or unavailable
        return ORDERED_DEFAULT_KEYS.map((key) => {
            const meta = CATEGORY_META_CONFIG[key];
            return {
                id: key,
                key,
                displayName: meta.displayName,
                description: meta.description,
                icon: undefined,
                FallbackIcon: meta.icon,
                theme: meta.theme,
                badgeText: meta.badgeText,
                customHref: meta.customHref,
                subcategories: meta.defaultSubcategories as unknown as Subcategory[],
            };
        });
    }, [categories]);

    // Loading Skeletons
    if (isLoading) {
        return (
            <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5", className)}>
                {[1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        className="bg-white border border-soft-border/70 rounded-2xl p-5 shadow-xs flex flex-col justify-between min-h-[320px] animate-pulse"
                    >
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 rounded-xl bg-gray-100 shrink-0" />
                                <div className="space-y-2 flex-1">
                                    <div className="w-24 h-4 bg-gray-100 rounded-md" />
                                    <div className="w-36 h-3 bg-gray-100 rounded-md" />
                                </div>
                            </div>
                            <div className="my-3 border-t border-gray-100" />
                            <div className="space-y-2.5 pt-1">
                                {[1, 2, 3, 4].map((j) => (
                                    <div key={j} className="h-8 bg-gray-100/70 rounded-xl w-full" />
                                ))}
                            </div>
                        </div>
                        <div className="pt-4 border-t border-gray-100">
                            <div className="w-full h-8 bg-gray-100 rounded-xl" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5", className)}>
            {directoryItems.map((item) => {
                const { key, displayName, description, icon, FallbackIcon, theme, badgeText, customHref, subcategories } = item;

                // Base category link
                const mainCategoryHref = customHref
                    ? `${customHref}${cityQuery ? `?${cityQuery.replace(/^&/, "")}` : ""}`
                    : `/ads?categoryKey=${encodeURIComponent(key)}${cityQuery}`;

                return (
                    <div
                        key={item.id || key}
                        className={cn(
                            "bg-white border border-soft-border rounded-2xl p-5 shadow-xs transition-all duration-300 flex flex-col justify-between group",
                            theme.hoverBorder,
                            "hover:shadow-lg hover:-translate-y-0.5"
                        )}
                    >
                        {/* Card Header */}
                        <div>
                            <div className="flex items-start justify-between gap-3 mb-3">
                                <Link
                                    href={mainCategoryHref}
                                    className="flex items-center gap-3.5 group/header flex-1 min-w-0"
                                >
                                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border border-gray-100/60 shadow-xs", theme.iconBg)}>
                                        {icon ? (
                                            <CategoryIcon
                                                icon={icon}
                                                displayName={displayName}
                                                size={24}
                                                className="shrink-0"
                                            />
                                        ) : (
                                            <FallbackIcon className={cn("w-6 h-6", theme.iconColor)} />
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="text-brand font-black text-sm lg:text-base group-hover/header:text-primary transition-colors truncate">
                                            {displayName}
                                        </h3>
                                        <p className="text-secondary/75 text-[11px] lg:text-xs mt-0.5 line-clamp-1">
                                            {description}
                                        </p>
                                    </div>
                                </Link>

                                {badgeText && (
                                    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 tracking-tight", theme.accentBg)}>
                                        {badgeText}
                                    </span>
                                )}
                            </div>

                            {/* Divider */}
                            <div className="my-3 border-t border-gray-100" />

                            {/* Subcategories List (SEO & Fast Clickable Directory) */}
                            <ul className="space-y-1.5 pt-0.5">
                                {subcategories && subcategories.length > 0 ? (
                                    <>
                                        {subcategories.slice(0, 5).map((sub) => {
                                            const subHref = customHref
                                                ? `${customHref}${cityQuery ? `?${cityQuery.replace(/^&/, "")}` : ""}`
                                                : `/ads?categoryKey=${encodeURIComponent(key)}&subcategoryKey=${encodeURIComponent(sub.key)}${cityQuery}`;

                                            return (
                                                <li key={sub.id || sub.key}>
                                                    <Link
                                                        href={subHref}
                                                        className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-secondary hover:text-brand hover:bg-soft-bg/80 transition-all duration-200 group/sub"
                                                    >
                                                        <span className="flex items-center gap-2.5 truncate">
                                                            {sub.icon ? (
                                                                <CategoryIcon
                                                                    icon={sub.icon}
                                                                    displayName={sub.displayName}
                                                                    size={15}
                                                                    className="shrink-0"
                                                                />
                                                            ) : (
                                                                <span className="w-1.5 h-1.5 rounded-full bg-gray-300 group-hover/sub:bg-primary transition-colors shrink-0" />
                                                            )}
                                                            <span className="truncate">{sub.displayName}</span>
                                                        </span>
                                                        <ChevronLeft className="w-3.5 h-3.5 text-gray-400 group-hover/sub:text-primary group-hover/sub:-translate-x-0.5 transition-all shrink-0 opacity-0 group-hover/sub:opacity-100" />
                                                    </Link>
                                                </li>
                                            );
                                        })}
                                        {subcategories.length > 5 && (
                                            <li>
                                                <Link
                                                    href={mainCategoryHref}
                                                    className="flex items-center justify-between px-3 py-1.5 rounded-xl text-[11px] font-bold text-primary hover:bg-primary/10 transition-colors"
                                                >
                                                    <span>+ {subcategories.length - 5} زیردسته دیگر</span>
                                                    <ChevronLeft className="w-3.5 h-3.5" />
                                                </Link>
                                            </li>
                                        )}
                                    </>
                                ) : (
                                    <li className="text-xs text-text-light/70 py-2 px-3">
                                        درحال آماده‌سازی زیردسته‌ها...
                                    </li>
                                )}
                            </ul>
                        </div>

                        {/* Card Footer / Primary Exploration Link */}
                        <div className="mt-4 pt-3.5 border-t border-gray-100/80">
                            <Link
                                href={mainCategoryHref}
                                className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-gray-50/70 hover:bg-primary/10 text-brand hover:text-primary transition-all duration-200 text-xs font-bold group/btn"
                            >
                                <span>مشاهده همه {displayName}</span>
                                <ArrowLeft className="w-3.5 h-3.5 text-secondary group-hover/btn:text-primary group-hover/btn:-translate-x-1 transition-all" />
                            </Link>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export default CategoryDirectory;
