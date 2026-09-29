"use client";

import { cn, getPaginationItems, toPersianDigits } from "@/lib/utils";
import { ArrowUp, ChevronLeft, ChevronRight } from "lucide-react";
import React from "react";

export interface PaginationControlsProps {
    startPage: number;
    lastLoadedPage: number;
    totalPages: number;
    totalCount: number;
    itemLabel?: string;
    loadedPages?: number[];
    onPageSelect: (page: number) => void;
    onPrevPage: () => void;
    onNextPage: () => void;
    onScrollToTop?: () => void;
    className?: string;
}

export function PaginationControls({
    startPage,
    lastLoadedPage,
    totalPages,
    totalCount,
    itemLabel = "مورد",
    loadedPages = [],
    onPageSelect,
    onPrevPage,
    onNextPage,
    onScrollToTop,
    className,
}: PaginationControlsProps) {
    if (totalPages <= 1) return null;

    const paginationItems = getPaginationItems(startPage, lastLoadedPage, totalPages);

    return (
        <div
            className={cn(
                "mt-10 bg-white rounded-3xl p-5 sm:p-6 border border-gray-100 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4",
                className
            )}
        >
            <div className="text-xs text-secondary font-medium text-center md:text-right">
                نمایش صفحه <span className="font-bold text-brand">{toPersianDigits(startPage)}</span> تا{" "}
                <span className="font-bold text-brand">{toPersianDigits(lastLoadedPage)}</span> از{" "}
                <span className="font-bold text-brand">{toPersianDigits(totalPages)}</span> (مجموع{" "}
                <span className="font-bold text-brand">{toPersianDigits(totalCount)}</span> {itemLabel})
            </div>

            {/* Page Numbers & Controls */}
            <div className="flex items-center gap-1.5 flex-wrap justify-center">
                <button
                    type="button"
                    onClick={onPrevPage}
                    disabled={startPage <= 1}
                    className="px-3 py-2 bg-gray-50 hover:bg-gray-100 text-brand rounded-xl font-bold text-xs flex items-center gap-1 border border-gray-200/60 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    <ChevronRight className="w-4 h-4" />
                    <span>صفحه قبل</span>
                </button>

                {paginationItems.map((item, idx) => {
                    if (item === "...") {
                        return (
                            <span key={`ellipsis-${idx}`} className="px-2 text-secondary text-xs select-none">
                                ...
                            </span>
                        );
                    }

                    const isCurrentLoaded = loadedPages.includes(item);
                    const isCurrentStart = item === startPage;

                    return (
                        <button
                            key={`page-btn-${item}`}
                            type="button"
                            onClick={() => onPageSelect(item)}
                            className={cn(
                                "min-w-9 h-9 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center",
                                isCurrentStart
                                    ? "bg-brand text-white shadow-xs font-black"
                                    : isCurrentLoaded
                                    ? "bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20"
                                    : "bg-gray-50 hover:bg-gray-100 text-secondary border border-gray-200/60"
                            )}
                            title={isCurrentLoaded ? `اسکرول به بخش صفحه ${item}` : `رفتن به صفحه ${item}`}
                        >
                            {toPersianDigits(item)}
                        </button>
                    );
                })}

                <button
                    type="button"
                    onClick={onNextPage}
                    disabled={lastLoadedPage >= totalPages}
                    className="px-3 py-2 bg-gray-50 hover:bg-gray-100 text-brand rounded-xl font-bold text-xs flex items-center gap-1 border border-gray-200/60 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    <span>صفحه بعد</span>
                    <ChevronLeft className="w-4 h-4" />
                </button>
            </div>

            {/* Quick Scroll to Top */}
            {onScrollToTop && (
                <button
                    type="button"
                    onClick={onScrollToTop}
                    className="hidden lg:flex items-center gap-1 text-xs font-bold text-secondary hover:text-brand transition-colors p-2 rounded-xl hover:bg-gray-50"
                >
                    <ArrowUp className="w-3.5 h-3.5" />
                    <span>بازگشت به بالا</span>
                </button>
            )}
        </div>
    );
}
