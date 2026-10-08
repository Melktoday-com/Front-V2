"use client";

import { cn } from "@/lib/utils";
import { CategoryListItem } from "@/types/api/ads.types";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
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

    // Prevent body scroll when open on mobile
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => { document.body.style.overflow = ""; };
    }, [isOpen]);

    const expandedCat = categories.find((c) => c.key === expandedCategory) || null;

    const handleSelectCategory = (key: string) => {
        const cat = categories.find((c) => c.key === key);
        if (cat && cat.subcategories && cat.subcategories.length > 0) {
            // Toggle expand: if already expanded, collapse; else expand
            if (expandedCategory === key) {
                setExpandedCategory("");
            } else {
                setExpandedCategory(key);
            }
        } else {
            // No subcategories: select directly and close
            onSelectCategory(key);
            onSelectSubcategory("");
            onClose();
        }
    };

    const handleSelectSubcategory = (subKey: string) => {
        onSelectCategory(expandedCategory);
        onSelectSubcategory(subKey);
        onClose();
    };

    const handleClearAll = () => {
        onSelectCategory("");
        onSelectSubcategory("");
        onClose();
    };

    if (!isOpen) return null;

    const content = (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
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
                        className="p-1.5 rounded-full hover:bg-soft-bg text-secondary hover:text-brand transition-colors cursor-pointer"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Body — two-column tree */}
            <div className="flex flex-1 overflow-hidden">
                {/* Left: Categories */}
                <div className="w-1/2 border-l border-gray-100 overflow-y-auto">
                    {/* All button */}
                    <button
                        type="button"
                        onClick={handleClearAll}
                        className={cn(
                            "w-full flex items-center gap-2 px-3 py-2.5 text-xs font-bold transition-colors cursor-pointer text-right",
                            !selectedCategoryKey && !selectedSubcategoryKey
                                ? "bg-primary/10 text-primary"
                                : "text-secondary hover:bg-soft-bg"
                        )}
                    >
                        <span className="flex-1 text-right">همه املاک</span>
                        {!selectedCategoryKey && (
                            <ChevronLeft className="w-3.5 h-3.5 shrink-0" />
                        )}
                    </button>

                    {categories.map((cat) => {
                        const isActive = selectedCategoryKey === cat.key;
                        const isExpanded = expandedCategory === cat.key;
                        const hasChildren = cat.subcategories && cat.subcategories.length > 0;

                        return (
                            <button
                                type="button"
                                key={cat.key}
                                onClick={() => handleSelectCategory(cat.key)}
                                className={cn(
                                    "w-full flex items-center gap-2 px-3 py-2.5 text-xs font-bold transition-colors cursor-pointer",
                                    isActive || isExpanded
                                        ? "bg-primary/10 text-primary"
                                        : "text-secondary hover:bg-soft-bg"
                                )}
                            >
                                {cat.icon && (
                                    <CategoryIcon icon={cat.icon} displayName={cat.displayName} size={14} className="shrink-0" />
                                )}
                                <span className="flex-1 text-right">{cat.displayName}</span>
                                {hasChildren && (
                                    <ChevronLeft
                                        className={cn(
                                            "w-3.5 h-3.5 shrink-0 transition-transform",
                                            isExpanded ? "rotate-90" : ""
                                        )}
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Right: Subcategories */}
                <div className="w-1/2 overflow-y-auto bg-white">
                    {expandedCat && expandedCat.subcategories && expandedCat.subcategories.length > 0 ? (
                        <>
                            {/* "All in category" option */}
                            <button
                                type="button"
                                onClick={() => {
                                    onSelectCategory(expandedCat.key);
                                    onSelectSubcategory("");
                                    onClose();
                                }}
                                className={cn(
                                    "w-full flex items-center gap-2 px-3 py-2.5 text-xs font-bold transition-colors cursor-pointer",
                                    selectedCategoryKey === expandedCat.key && !selectedSubcategoryKey
                                        ? "bg-primary/10 text-primary"
                                        : "text-secondary hover:bg-soft-bg"
                                )}
                            >
                                <span className="flex-1 text-right">همه {expandedCat.displayName}</span>
                            </button>

                            {expandedCat.subcategories.map((sub) => {
                                const isSubActive = selectedSubcategoryKey === sub.key && selectedCategoryKey === expandedCat.key;
                                return (
                                    <button
                                        type="button"
                                        key={sub.key}
                                        onClick={() => handleSelectSubcategory(sub.key)}
                                        className={cn(
                                            "w-full flex items-center gap-2 px-3 py-2.5 text-xs font-bold transition-colors cursor-pointer",
                                            isSubActive
                                                ? "bg-primary/10 text-primary"
                                                : "text-secondary hover:bg-soft-bg"
                                        )}
                                    >
                                        {sub.icon && (
                                            <CategoryIcon icon={sub.icon} displayName={sub.displayName} size={13} className="shrink-0" />
                                        )}
                                        <span className="flex-1 text-right">{sub.displayName}</span>
                                        {isSubActive && <ChevronLeft className="w-3.5 h-3.5 shrink-0 text-primary" />}
                                    </button>
                                );
                            })}
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-full text-xs text-text-light px-4 text-center">
                            {expandedCat ? "زیردسته‌ای موجود نیست" : "یک دسته‌بندی انتخاب کنید"}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <>
            {/* Desktop: Dialog */}
            <div className="hidden md:flex fixed inset-0 z-50 items-center justify-center">
                {/* Backdrop */}
                <div
                    ref={overlayRef}
                    className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                    onClick={onClose}
                />
                {/* Panel */}
                <div className="relative bg-white rounded-2xl shadow-2xl w-[480px] max-h-[70vh] flex flex-col overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
                    {content}
                </div>
            </div>

            {/* Mobile: Bottom Drawer */}
            <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
                {/* Backdrop */}
                <div
                    className="absolute inset-0 bg-black/40"
                    onClick={onClose}
                />
                {/* Drawer */}
                <div className="relative bg-white rounded-t-2xl shadow-2xl flex flex-col max-h-[80vh] animate-in slide-in-from-bottom duration-300 z-10">
                    {/* Handle */}
                    <div className="flex justify-center pt-2 pb-1">
                        <div className="w-10 h-1 bg-gray-200 rounded-full" />
                    </div>
                    {content}
                </div>
            </div>
        </>
    );
}
