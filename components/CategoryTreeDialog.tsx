"use client";

import { cn } from "@/lib/utils";
import { CategoryListItem } from "@/types/api/ads.types";
import { Check, ChevronDown, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { CategoryIcon } from "./CategoryIcon";

interface CategoryTreeDialogProps {
    isOpen: boolean;
    onClose: () => void;
    categories: CategoryListItem[];
    selectedCategoryKey: string;
    selectedSubcategoryKey: string;
    onSelectCategory: (key: string) => void;
    onSelectSubcategory: (key: string) => void;
}

export function CategoryTreeDialog({
    isOpen,
    onClose,
    categories,
    selectedCategoryKey,
    selectedSubcategoryKey,
    onSelectCategory,
    onSelectSubcategory,
}: CategoryTreeDialogProps) {
    // Keep track of which category accordion is expanded
    const [expandedCategory, setExpandedCategory] = useState<string>(selectedCategoryKey || "");
    const overlayRef = useRef<HTMLDivElement>(null);

    // Sync expanded state when dialog opens
    useEffect(() => {
        if (isOpen) {
            setExpandedCategory(selectedCategoryKey || "");
        }
    }, [isOpen, selectedCategoryKey]);

    // Close on Escape
    useEffect(() => {
        if (!isOpen) return;
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [isOpen, onClose]);

    const handleCategoryHeaderClick = (category: CategoryListItem) => {
        const hasChildren = category.subcategories && category.subcategories.length > 0;
        if (hasChildren) {
            // Toggle accordion
            setExpandedCategory((prev) => (prev === category.key ? "" : category.key));
        } else {
            // Select directly and close
            onSelectCategory(category.key);
            onSelectSubcategory("");
            onClose();
        }
    };

    const handleSelectAllForCategory = (categoryKey: string) => {
        onSelectCategory(categoryKey);
        onSelectSubcategory("");
        onClose();
    };

    const handleSelectSubcategory = (categoryKey: string, subcategoryKey: string) => {
        onSelectCategory(categoryKey);
        onSelectSubcategory(subcategoryKey);
        onClose();
    };

    const handleClearAll = () => {
        onSelectCategory("");
        onSelectSubcategory("");
        onClose();
    };

    if (!isOpen) return null;

    const content = (
        <div className="flex flex-col h-full max-h-[80vh] md:max-h-[70vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
                <h2 className="text-base font-black text-brand">انتخاب دسته‌بندی</h2>
                <div className="flex items-center gap-2">
                    {(selectedCategoryKey || selectedSubcategoryKey) && (
                        <button
                            type="button"
                            onClick={handleClearAll}
                            className="text-xs text-red-500 font-bold hover:text-red-600 transition-colors px-2 py-1 rounded-lg hover:bg-red-50 cursor-pointer"
                        >
                            پاک کردن
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="بستن"
                        data-modal-close="true"
                        className="p-1.5 rounded-full hover:bg-soft-bg text-secondary hover:text-brand transition-colors cursor-pointer"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Body — Single Column Accordion Tree */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1.5">
                {/* 1. All Properties Option */}
                <button
                    type="button"
                    onClick={handleClearAll}
                    className={cn(
                        "w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer",
                        !selectedCategoryKey && !selectedSubcategoryKey
                            ? "bg-primary/10 text-primary border border-primary/20"
                            : "bg-white hover:bg-soft-bg text-secondary border border-transparent"
                    )}
                >
                    <span className="text-right">همه املاک</span>
                    {!selectedCategoryKey && !selectedSubcategoryKey && (
                        <Check className="w-4 h-4 text-primary shrink-0" />
                    )}
                </button>

                {/* 2. Categories with nested Accordion for subcategories */}
                {categories.map((cat) => {
                    const hasChildren = cat.subcategories && cat.subcategories.length > 0;
                    const isExpanded = expandedCategory === cat.key;
                    const isCategoryActive = selectedCategoryKey === cat.key;
                    const isParentSelected = isCategoryActive && !selectedSubcategoryKey;

                    return (
                        <div
                            key={cat.id || cat.key}
                            className={cn(
                                "rounded-xl border transition-colors overflow-hidden",
                                isCategoryActive
                                    ? "border-primary/30 bg-primary/[0.02]"
                                    : "border-gray-100 bg-white"
                            )}
                        >
                            {/* Category Header Row */}
                            <button
                                type="button"
                                onClick={() => handleCategoryHeaderClick(cat)}
                                className={cn(
                                    "w-full flex items-center justify-between px-3.5 py-3 text-xs font-bold transition-all cursor-pointer",
                                    isParentSelected
                                        ? "text-primary"
                                        : isCategoryActive
                                        ? "text-brand"
                                        : "text-brand hover:bg-soft-bg/50"
                                )}
                            >
                                <div className="flex items-center gap-2.5 min-w-0">
                                    {cat.icon && (
                                        <CategoryIcon
                                            icon={cat.icon}
                                            displayName={cat.displayName}
                                            size={16}
                                            className="shrink-0"
                                        />
                                    )}
                                    <span className="truncate">{cat.displayName}</span>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                    {isParentSelected && (
                                        <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">
                                            انتخاب شده
                                        </span>
                                    )}
                                    {hasChildren && (
                                        <ChevronDown
                                            className={cn(
                                                "w-4 h-4 text-secondary transition-transform duration-200",
                                                isExpanded ? "rotate-180 text-primary" : ""
                                            )}
                                        />
                                    )}
                                    {!hasChildren && isParentSelected && (
                                        <Check className="w-4 h-4 text-primary" />
                                    )}
                                </div>
                            </button>

                            {/* Subcategories Accordion Content (Nested under this category) */}
                            {hasChildren && isExpanded && (
                                <div className="border-t border-gray-100 bg-soft-bg/40 px-3 py-2 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
                                    {/* "مشاهده همه [دسته‌بندی]" Option */}
                                    <button
                                        type="button"
                                        onClick={() => handleSelectAllForCategory(cat.key)}
                                        className={cn(
                                            "w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer",
                                            isParentSelected
                                                ? "bg-primary text-white shadow-xs"
                                                : "text-secondary hover:text-brand hover:bg-white"
                                        )}
                                    >
                                        <span>مشاهده همه {cat.displayName}</span>
                                        {isParentSelected && (
                                            <Check className="w-3.5 h-3.5 text-white shrink-0" />
                                        )}
                                    </button>

                                    {/* Subcategory Items */}
                                    {cat.subcategories.map((sub) => {
                                        const isSubActive =
                                            isCategoryActive && selectedSubcategoryKey === sub.key;

                                        return (
                                            <button
                                                type="button"
                                                key={sub.id || sub.key}
                                                onClick={() =>
                                                    handleSelectSubcategory(cat.key, sub.key)
                                                }
                                                className={cn(
                                                    "w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer",
                                                    isSubActive
                                                        ? "bg-primary text-white shadow-xs"
                                                        : "text-secondary hover:text-brand hover:bg-white"
                                                )}
                                            >
                                                <div className="flex items-center gap-2 min-w-0">
                                                    {sub.icon && (
                                                        <CategoryIcon
                                                            icon={sub.icon}
                                                            displayName={sub.displayName}
                                                            size={13}
                                                            className="shrink-0"
                                                        />
                                                    )}
                                                    <span className="truncate">
                                                        {sub.displayName}
                                                    </span>
                                                </div>
                                                {isSubActive && (
                                                    <Check className="w-3.5 h-3.5 text-white shrink-0" />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );

    return (
        <>
            {/* Desktop: Dialog */}
            <div
                role="dialog"
                aria-modal="true"
                data-modal="true"
                className="hidden md:flex fixed inset-0 z-60 items-center justify-center"
            >
                {/* Backdrop */}
                <div
                    ref={overlayRef}
                    className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                    onClick={onClose}
                />
                {/* Panel */}
                <div className="relative bg-white rounded-2xl shadow-2xl w-[440px] max-h-[75vh] flex flex-col overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
                    {content}
                </div>
            </div>

            {/* Mobile: Bottom Drawer */}
            <div
                role="dialog"
                aria-modal="true"
                data-modal="true"
                className="md:hidden fixed inset-0 z-60 flex flex-col justify-end"
            >
                {/* Backdrop */}
                <div
                    className="absolute inset-0 bg-black/40"
                    onClick={onClose}
                />
                {/* Drawer */}
                <div className="relative bg-white rounded-t-2xl shadow-2xl flex flex-col max-h-[80vh] animate-in slide-in-from-bottom duration-300 z-10">
                    {/* Handle */}
                    <div className="flex justify-center pt-2 pb-1 shrink-0">
                        <div className="w-10 h-1 bg-gray-200 rounded-full" />
                    </div>
                    {content}
                </div>
            </div>
        </>
    );
}
