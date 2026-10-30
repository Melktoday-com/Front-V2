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

    // Close on Escape key
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const filtered = neighborhoods.filter((z) =>
        z.name.toLowerCase().includes(query.toLowerCase())
    );

    const selectedCount = selectedIds.length;

    return (
        <div
            className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4"
            role="dialog"
            aria-modal="true"
            data-modal="true"
            aria-label="انتخاب محله"
        >
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Container: Bottom Drawer on mobile, Centered Dialog on desktop */}
            <div
                className={cn(
                    "relative z-10 w-full md:w-[480px] md:max-w-lg bg-surface rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col overflow-hidden",
                    "h-[80vh] max-h-[85vh] md:h-[600px] md:max-h-[80vh]",
                    "border-t md:border border-border-subtle",
                    "animate-in slide-in-from-bottom md:slide-in-from-bottom-0 md:zoom-in-95 duration-200 text-right"
                )}
            >
                {/* Handle bar — mobile only */}
                <div className="md:hidden flex justify-center pt-3 pb-1 shrink-0">
                    <div className="w-10 h-1 rounded-full bg-border-subtle" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle shrink-0">
                    <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-primary" />
                        <span className="font-bold text-brand text-sm sm:text-base">انتخاب محله</span>
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
                                className="text-xs text-error font-semibold hover:text-error transition-colors px-2 py-1 rounded-lg hover:bg-error-subtle cursor-pointer"
                            >
                                پاک کردن همه
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1.5 rounded-full hover:bg-soft-bg text-secondary hover:text-brand transition-colors cursor-pointer"
                            aria-label="بستن"
                            data-modal-close="true"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Search inside drawer/dialog */}
                <div className="px-5 pt-3 pb-2 shrink-0">
                    <div className="relative">
                        <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary pointer-events-none" />
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
                <div className="overflow-y-auto flex-1 px-5 pb-4 custom-scrollbar">
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
                                                "w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all text-right cursor-pointer",
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
                                                        : "border-border"
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
                    <div className="px-5 pb-5 pt-3 border-t border-border-subtle shrink-0 bg-surface">
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-full bg-primary text-white py-3 rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors cursor-pointer shadow-xs"
                        >
                            نمایش نتایج ({selectedCount} محله انتخاب شده)
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
