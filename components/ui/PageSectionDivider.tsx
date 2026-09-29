"use client";

import { toPersianDigits } from "@/lib/utils";
import { Layers } from "lucide-react";
import React from "react";

interface PageSectionDividerProps {
    id: string;
    page: number;
    count: number;
    itemLabel?: string;
    className?: string;
}

export function PageSectionDivider({
    id,
    page,
    count,
    itemLabel = "مورد",
    className,
}: PageSectionDividerProps) {
    return (
        <div
            id={id}
            className={`col-span-full py-5 my-2 flex items-center gap-3 animate-in fade-in duration-300 ${className || ""}`}
        >
            <div className="h-px bg-gray-200/80 flex-1" />
            <div className="flex items-center gap-2 bg-white px-4 py-1.5 rounded-full border border-gray-200/80 shadow-2xs text-xs">
                <Layers className="w-3.5 h-3.5 text-primary" />
                <span className="text-secondary font-medium">بخش / صفحه</span>
                <span className="text-brand font-black text-sm">{toPersianDigits(page)}</span>
                <span className="text-gray-300">•</span>
                <span className="text-secondary font-medium">
                    {toPersianDigits(count)} {itemLabel}
                </span>
            </div>
            <div className="h-px bg-gray-200/80 flex-1" />
        </div>
    );
}
