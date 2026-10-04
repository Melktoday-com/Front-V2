"use client";

import { CategoryIcon } from "@/components/CategoryIcon";
import { cn } from "@/lib/utils";
import { CategoryListItem } from "@/types/api/ads.types";
import { ArrowLeft, ChevronLeft, ChevronRight, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";

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
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Active category for landing page disclosure (defaults to first category or selectedCategoryKey)
    const [landingActiveKey, setLandingActiveKey] = useState<string>(() => {
        if (selectedCategoryKey) return selectedCategoryKey;
        return categories?.[0]?.key || "";
    });

    const effectiveLandingKey = landingActiveKey || categories?.[0]?.key || "";
    const activeLandingCategory = useMemo(() => {
        return categories.find((c) => c.key === effectiveLandingKey) || categories[0];
    }, [categories, effectiveLandingKey]);

    const activeFilterCategory = useMemo(() => {
        if (!selectedCategoryKey) return null;
        return categories.find((c) => c.key === selectedCategoryKey) || null;
    }, [categories, selectedCategoryKey]);

    // Build URL query string helper for city params
    const getCityQueryString = () => {
        const parts: string[] = [];
        if (cityId) parts.push(`cityId=${encodeURIComponent(cityId)}`);
        if (cityName && cityName !== "همه شهرها") parts.push(`cityName=${encodeURIComponent(cityName)}`);
        return parts.length > 0 ? `&${parts.join("&")}` : "";
    };

    const scroll = (direction: "left" | "right") => {
        if (!scrollContainerRef.current) return;
        const offset = direction === "right" ? 240 : -240;
        scrollContainerRef.current.scrollBy({ left: offset, behavior: "smooth" });
    };

    // Loading Skeletons
    if (isLoading) {
        if (variant === "landing") {
            return (
                <div className="space-y-4">
                    <div className="h-6 w-48 bg-zinc-100 rounded-full animate-pulse" />
                    <div className="flex gap-4 overflow-hidden py-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div
                                key={i}
                                className="shrink-0 w-44 h-36 bg-zinc-100/80 animate-pulse rounded-3xl"
                            />
                        ))}
                    </div>
                    <div className="h-28 w-full bg-zinc-50 rounded-3xl animate-pulse" />
                </div>
            );
        }

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
    // VARIANT: LANDING PAGE (Apple Design Showcase)
    // ==========================================
    if (variant === "landing") {
        const cityQuery = getCityQueryString();
        const allAdsHref = cityId ? `/ads?${cityQuery.slice(1)}` : "/ads";

        return (
            <div className={cn("space-y-5", className)}>
                {/* Section Header */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                    <div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-zinc-100 text-zinc-600 border border-zinc-200/60 mb-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                            <span>دسته‌بندی‌های ملکتودی</span>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-black text-brand tracking-tight">
                            کاوش املاک بر اساس دسته‌بندی
                        </h2>
                        <p className="text-xs sm:text-sm text-text-light font-medium mt-1">
                            دسترسی سریع و مستقیم به انواع املاک مسکونی، اداری، تجاری و پروژه‌های ملکی
                        </p>
                    </div>

                    <Link
                        href={allAdsHref}
                        className="group inline-flex items-center gap-2 self-start sm:self-auto px-4 py-2 rounded-full text-xs font-bold text-zinc-700 hover:text-brand bg-zinc-100/80 hover:bg-zinc-200/70 border border-zinc-200/60 transition-all active:scale-95"
                    >
                        <span>مشاهده همه آگهی‌ها</span>
                        <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
                    </Link>
                </div>

                {/* Categories Row with Apple Squircles */}
                <div className="relative group/scroll">
                    <div
                        ref={scrollContainerRef}
                        className="flex items-stretch gap-3 sm:gap-4 overflow-x-auto no-scrollbar scroll-smooth py-2 px-1"
                    >
                        {categories.map((category) => {
                            const isSelected = activeLandingCategory?.key === category.key;
                            const subCount = category.subcategories?.length || 0;
                            const categoryHref = `/ads?categoryKey=${category.key}${cityQuery}`;
                            const hasIcon = Boolean(category.icon);

                            return (
                                <div
                                    key={category.id || category.key}
                                    onClick={() => setLandingActiveKey(category.key)}
                                    className={cn(
                                        "group min-w-[150px] sm:min-w-[180px] max-w-[220px] flex-1 shrink-0 rounded-3xl p-4 sm:p-5 flex flex-col justify-between cursor-pointer select-none transition-all duration-300",
                                        isSelected
                                            ? "bg-white border-2 border-primary shadow-lg shadow-primary/10 ring-4 ring-primary/10 -translate-y-1"
                                            : "bg-white/80 backdrop-blur-md border border-zinc-200/80 hover:border-zinc-300 hover:bg-white hover:shadow-md hover:-translate-y-0.5"
                                    )}
                                >
                                    {/* Top Element: Icon (if present) OR Subcategory Count Tag */}
                                    {hasIcon ? (
                                        <div
                                            className={cn(
                                                "w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center transition-all duration-300 mx-auto",
                                                isSelected
                                                    ? "bg-primary text-white shadow-md shadow-primary/25 scale-105"
                                                    : "bg-zinc-100 text-zinc-700 group-hover:bg-primary/10 group-hover:scale-105"
                                            )}
                                        >
                                            <CategoryIcon
                                                icon={category.icon}
                                                displayName={category.displayName}
                                                size={28}
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between w-full">
                                            <span
                                                className={cn(
                                                    "text-[10px] sm:text-[11px] font-bold px-2.5 py-1 rounded-full transition-colors",
                                                    isSelected
                                                        ? "bg-primary/15 text-primary"
                                                        : "bg-zinc-100 text-zinc-600 group-hover:bg-zinc-200"
                                                )}
                                            >
                                                {subCount > 0 ? `${subCount} زیردسته` : "دسته‌بندی"}
                                            </span>
                                            <span
                                                className={cn(
                                                    "w-2 h-2 rounded-full transition-all",
                                                    isSelected ? "bg-primary scale-125" : "bg-zinc-300"
                                                )}
                                            />
                                        </div>
                                    )}

                                    {/* Middle Element: Titles */}
                                    <div className={cn("w-full", hasIcon ? "mt-3 text-center" : "my-4 text-right")}>
                                        <h3
                                            className={cn(
                                                "text-sm sm:text-base font-bold transition-colors leading-snug",
                                                isSelected ? "text-brand font-black" : "text-zinc-900 group-hover:text-primary"
                                            )}
                                        >
                                            {category.displayName}
                                        </h3>
                                        {hasIcon && (
                                            <span className="text-[11px] text-text-light font-medium block mt-0.5">
                                                {subCount > 0 ? `${subCount} زیردسته‌بندی` : "آگهی‌های مستقیم"}
                                            </span>
                                        )}
                                    </div>

                                    {/* Bottom Element: Direct Link Button */}
                                    <Link
                                        href={categoryHref}
                                        onClick={(e) => e.stopPropagation()}
                                        aria-label={`مشاهده آگهی‌های ${category.displayName}`}
                                        className={cn(
                                            "text-[11px] font-bold inline-flex items-center justify-between w-full px-3 py-1.5 rounded-full transition-all mt-auto",
                                            isSelected
                                                ? "bg-primary/10 text-primary hover:bg-primary hover:text-white"
                                                : "text-text-light hover:text-brand bg-zinc-50 group-hover:bg-zinc-100"
                                        )}
                                    >
                                        <span>مشاهده آگهی‌ها</span>
                                        <ChevronLeft className="w-3.5 h-3.5" />
                                    </Link>
                                </div>
                            );
                        })}
                    </div>

                    {/* Navigation Buttons for larger screens */}
                    <button
                        type="button"
                        onClick={() => scroll("right")}
                        aria-label="اسکرول به راست"
                        className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white/95 backdrop-blur-md shadow-md border border-zinc-200/80 items-center justify-center text-zinc-700 hover:text-primary hover:scale-105 transition-all opacity-0 group-hover/scroll:opacity-100 cursor-pointer"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => scroll("left")}
                        aria-label="اسکرول به چپ"
                        className="hidden md:flex absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white/95 backdrop-blur-md shadow-md border border-zinc-200/80 items-center justify-center text-zinc-700 hover:text-primary hover:scale-105 transition-all opacity-0 group-hover/scroll:opacity-100 cursor-pointer"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                </div>

                {/* Apple Connected Subcategories Panel */}
                {activeLandingCategory && (
                    <div className="rounded-3xl p-5 sm:p-6 bg-gradient-to-br from-zinc-50/90 via-white/80 to-zinc-50/60 backdrop-blur-xl border border-zinc-200/70 shadow-xs transition-all">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-200/60">
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                                <h4 className="text-sm font-bold text-brand">
                                    زیردسته‌بندی‌های «{activeLandingCategory.displayName}»
                                </h4>
                                <span className="text-xs text-text-light font-medium">
                                    (برای مشاهده آگهی‌ها انتخاب فرمایید)
                                </span>
                            </div>

                            <Link
                                href={`/ads?categoryKey=${activeLandingCategory.key}${cityQuery}`}
                                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold bg-brand text-white hover:bg-brand/90 transition-all shadow-xs self-start sm:self-auto active:scale-95"
                            >
                                <span>مشاهده همه آگهی‌های «{activeLandingCategory.displayName}»</span>
                                <ArrowLeft className="w-3.5 h-3.5" />
                            </Link>
                        </div>

                        {activeLandingCategory.subcategories && activeLandingCategory.subcategories.length > 0 ? (
                            <div className="flex flex-wrap items-center gap-2.5 pt-4">
                                {activeLandingCategory.subcategories.map((sub) => {
                                    const subHref = `/ads?categoryKey=${activeLandingCategory.key}&subcategoryKey=${sub.key}${cityQuery}`;
                                    const hasSubIcon = Boolean(sub.icon);

                                    return (
                                        <Link
                                            key={sub.id || sub.key}
                                            href={subHref}
                                            className="group/sub inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white hover:bg-primary border border-zinc-200/80 hover:border-primary text-zinc-800 hover:text-white shadow-xs hover:shadow-md active:scale-95 transition-all duration-200"
                                        >
                                            {hasSubIcon && (
                                                <CategoryIcon
                                                    icon={sub.icon}
                                                    displayName={sub.displayName}
                                                    size={18}
                                                    className="shrink-0"
                                                />
                                            )}
                                            <span className="text-xs sm:text-sm font-bold transition-colors">
                                                {sub.displayName}
                                            </span>
                                            <ArrowLeft className="w-3 h-3 text-zinc-400 group-hover/sub:text-white transition-colors -ml-0.5" />
                                        </Link>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="pt-4 text-xs text-text-light font-medium">
                                زیردسته‌ای برای این دسته‌بندی تعریف نشده است. می‌توانید با کلیک روی دکمه بالا، تمام آگهی‌های این بخش را مشاهده کنید.
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    }

    // ==========================================
    // VARIANT: FILTER BAR (Apple Design for /ads)
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
                    const subCount = category.subcategories?.length || 0;
                    const hasIcon = Boolean(category.icon);

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
                            {hasIcon && (
                                <CategoryIcon
                                    icon={category.icon}
                                    displayName={category.displayName}
                                    size={15}
                                    className="shrink-0"
                                />
                            )}
                            <span>{category.displayName}</span>
                            {subCount > 0 && (
                                <span
                                    className={cn(
                                        "text-[10px] px-1.5 py-0.5 rounded-full font-black leading-none",
                                        isSelected
                                            ? "bg-white/30 text-white"
                                            : "bg-zinc-200 text-zinc-600"
                                    )}
                                >
                                    {subCount}
                                </span>
                            )}
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
                        const hasSubIcon = Boolean(sub.icon);

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
                                {hasSubIcon && (
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
