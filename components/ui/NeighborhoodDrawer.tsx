"use client";

import { ZoneSummary } from "@/types/api/geo.types";
import { cn } from "@/lib/utils";
import { MapPin, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface NeighborhoodDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    neighborhoods: ZoneSummary[];
    selectedIds: string[];
    onToggle: (zone: ZoneSummary) => void;
    onClear: () => void;
}

export function NeighborhoodDrawer({
    isOpen,
    onClose,
    neighborhoods,
    selectedIds,
    onToggle,
    onClear,
}: NeighborhoodDrawerProps) {
    const [query, setQuery] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setQuery("");
            setTimeout(() => inputRef.current?.focus(), 150);
        }
    }, [isOpen]);

    const filtered = neighborhoods.filter((z) =>
        z.name.toLowerCase().includes(query.toLowerCase())
    );

    const selectedCount = selectedIds.length;

    return (
        <>
            {/* Backdrop */}
            <div
                className={cn(
                    "fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity duration-300",
                    isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                )}
                onClick={onClose}
            />

            {/* Drawer — slides up from bottom on mobile, appears as right sidebar on lg+ */}
            <div
                className={cn(
                    "fixed z-50 bg-white shadow-2xl transition-transform duration-300 ease-out",
                    // Mobile: bottom sheet
                    "bottom-0 left-0 right-0 rounded-t-3xl max-h-[80vh] flex flex-col",
                    // Desktop: right panel (RTL → right = near search)
                    "lg:bottom-auto lg:top-0 lg:right-0 lg:left-auto lg:h-full lg:w-80 lg:rounded-none lg:rounded-l-3xl",
                    isOpen
                        ? "translate-y-0 lg:translate-x-0"
                        : "translate-y-full lg:translate-x-full lg:translate-y-0"
                )}
                role="dialog"
                aria-modal="true"
                aria-hidden={!isOpen}
                aria-label="انتخاب محله"
            >
                {/* Handle bar — mobile only */}
                <div className="lg:hidden flex justify-center pt-3 pb-1 shrink-0">
                    <div className="w-10 h-1 rounded-full bg-gray-200" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
                    <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-primary" />
                        <span className="font-bold text-brand text-sm">انتخاب محله</span>
                        {selectedCount > 0 && (
                            <span className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                {selectedCount}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {selectedCount > 0 && (
                            <button
                                type="button"
                                onClick={onClear}
                                className="text-xs text-red-500 font-semibold hover:text-red-600 transition-colors"
                            >
                                پاک کردن همه
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1.5 rounded-full hover:bg-soft-bg transition-colors"
                            aria-label="بستن"
                        >
                            <X className="w-4 h-4 text-secondary" />
                        </button>
                    </div>
                </div>

                {/* Search inside drawer */}
                <div className="px-4 pt-3 pb-2 shrink-0">
                    <div className="relative">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="جستجوی محله..."
                            className="w-full bg-soft-bg rounded-xl py-2.5 pr-9 pl-3 text-xs font-medium text-brand border border-soft-border focus:ring-2 focus:ring-primary/20 outline-none"
                        />
                    </div>
                </div>

                {/* List */}
                <div className="overflow-y-auto flex-1 px-4 pb-6 custom-scrollbar">
                    {filtered.length === 0 ? (
                        <p className="text-center text-secondary text-xs py-8">محله‌ای یافت نشد</p>
                    ) : (
                        <ul className="space-y-1 pt-1">
                            {filtered.map((zone) => {
                                const isSelected = selectedIds.includes(zone.id);
                                return (
                                    <li key={zone.id}>
                                        <button
                                            type="button"
                                            onClick={() => onToggle(zone)}
                                            className={cn(
                                                "w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all text-right",
                                                isSelected
                                                    ? "bg-primary/10 text-primary border border-primary/20"
                                                    : "hover:bg-soft-bg text-brand border border-transparent"
                                            )}
                                        >
                                            <span>{zone.name}</span>
                                            <span
                                                className={cn(
                                                    "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                                                    isSelected
                                                        ? "border-primary bg-primary"
                                                        : "border-gray-300"
                                                )}
                                            >
                                                {isSelected && (
                                                    <span className="text-white text-[10px] font-black leading-none">✓</span>
                                                )}
                                            </span>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>

                {/* Footer action */}
                {selectedCount > 0 && (
                    <div className="px-4 pb-5 pt-2 border-t border-gray-100 shrink-0">
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-full bg-primary text-white py-3 rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors"
                        >
                            نمایش نتایج ({selectedCount} محله انتخاب شده)
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}
