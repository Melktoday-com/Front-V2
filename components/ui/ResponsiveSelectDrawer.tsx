"use client";

import React, {
    useState,
    useRef,
    useEffect,
    useCallback,
    ReactNode,
    useMemo,
} from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check, X, Search, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectDrawerOption<T = string> {
    value: T;
    label: string;
    description?: string;
    badge?: string;
    icon?: ReactNode;
    disabled?: boolean;
}

export interface SelectDrawerTag<T = string> {
    label: string;
    value: T;
}

export interface ResponsiveSelectDrawerProps<T extends string | number = string> {
    label?: string;
    required?: boolean;
    value?: T;
    onChange: (value: T) => void;
    options: SelectDrawerOption<T>[];
    placeholder?: string;
    drawerTitle?: string;
    icon?: ReactNode;
    error?: string;
    helperText?: string;
    disabled?: boolean;
    searchable?: boolean;
    searchPlaceholder?: string;
    tags?: SelectDrawerTag<T>[];
    tagsLabel?: string;
    tagsIcon?: ReactNode;
    className?: string;
    isLoading?: boolean;
    loadingText?: string;
    emptyText?: string;
}

export function ResponsiveSelectDrawer<T extends string | number = string>({
    label,
    required = false,
    value,
    onChange,
    options = [],
    placeholder = "انتخاب کنید...",
    drawerTitle,
    icon,
    error,
    helperText,
    disabled = false,
    searchable = false,
    searchPlaceholder = "جستجو...",
    tags,
    tagsLabel,
    tagsIcon,
    className,
    isLoading = false,
    loadingText = "در حال بارگذاری...",
    emptyText = "موردی یافت نشد",
}: ResponsiveSelectDrawerProps<T>) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [mounted, setMounted] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const drawerRef = useRef<HTMLDivElement>(null);
    const desktopSearchInputRef = useRef<HTMLInputElement>(null);
    const mobileSearchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    const selectedOption = useMemo(
        () => options.find((opt) => opt.value === value),
        [options, value]
    );

    // Filter options if searchable
    const filteredOptions = useMemo(() => {
        if (!searchQuery.trim()) return options;
        const q = searchQuery.toLowerCase().trim();
        return options.filter((opt) => {
            const matchLabel = opt.label.toLowerCase().includes(q);
            const matchDesc = opt.description?.toLowerCase().includes(q);
            const matchBadge = opt.badge?.toLowerCase().includes(q);
            return matchLabel || matchDesc || matchBadge;
        });
    }, [options, searchQuery]);

    // Close on click outside (respecting both desktop dropdown and mobile drawer)
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent | TouchEvent) => {
            const target = event.target as Node;
            if (containerRef.current?.contains(target)) return;
            if (drawerRef.current?.contains(target)) return;
            setIsOpen(false);
            setSearchQuery("");
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            document.addEventListener("touchstart", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("touchstart", handleClickOutside);
        };
    }, [isOpen]);

    // Handle body scroll lock on mobile when drawer is open
    useEffect(() => {
        if (isOpen) {
            const originalOverflow = document.body.style.overflow;
            document.body.style.overflow = "hidden";
            return () => {
                document.body.style.overflow = originalOverflow;
            };
        }
    }, [isOpen]);

    // Focus search input when open
    useEffect(() => {
        if (isOpen && searchable) {
            const timer = setTimeout(() => {
                if (window.innerWidth >= 640) {
                    desktopSearchInputRef.current?.focus();
                } else {
                    mobileSearchInputRef.current?.focus();
                }
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [isOpen, searchable]);

    // Handle Escape key
    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent | KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                setIsOpen(false);
                setSearchQuery("");
            }
        },
        [isOpen]
    );

    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

    const handleSelect = (val: T) => {
        onChange(val);
        setIsOpen(false);
        setSearchQuery("");
    };

    const titleText = drawerTitle || label || "انتخاب کنید";

    return (
        <div className={cn("space-y-1.5 w-full text-right", className)} ref={containerRef}>
            {label && (
                <label className="block text-xs font-bold text-brand pr-1 select-none">
                    {label} {required && <span className="text-error">*</span>}
                </label>
            )}

            <div className="relative">
                {/* Trigger Button */}
                <button
                    type="button"
                    disabled={disabled}
                    onClick={() => !disabled && setIsOpen((prev) => !prev)}
                    aria-haspopup="listbox"
                    aria-expanded={isOpen}
                    className={cn(
                        "w-full border flex items-center justify-between text-right font-bold transition-all duration-200 outline-none select-none",
                        "py-2.5 sm:py-3.5 px-3 sm:px-4 text-xs sm:text-sm rounded-xl sm:rounded-2xl min-h-[42px] sm:min-h-[48px]",
                        "bg-soft-bg border-soft-border text-brand hover:bg-soft-bg/80 focus:ring-2 focus:ring-primary/20 focus:border-primary/50",
                        disabled && "opacity-50 cursor-not-allowed bg-surface-secondary pointer-events-none",
                        error && "border-red-500 focus:ring-red-200 bg-error-subtle/30"
                    )}
                >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {icon && <span className="text-secondary shrink-0">{icon}</span>}
                        {selectedOption ? (
                            <div className="flex items-center gap-2 min-w-0">
                                {selectedOption.icon && (
                                    <span className="shrink-0">{selectedOption.icon}</span>
                                )}
                                <span className="truncate text-brand font-bold">
                                    {selectedOption.label}
                                </span>
                                {selectedOption.badge && (
                                    <span className="shrink-0 text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                                        {selectedOption.badge}
                                    </span>
                                )}
                            </div>
                        ) : (
                            <span className="text-secondary/50 font-normal truncate">
                                {placeholder}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 mr-2">
                        {isLoading ? (
                            <Loader2 className="w-4 h-4 text-primary animate-spin" />
                        ) : (
                            <ChevronDown
                                className={cn(
                                    "w-4 h-4 text-secondary transition-transform duration-300",
                                    isOpen && "rotate-180 text-primary"
                                )}
                            />
                        )}
                    </div>
                </button>

                {/* ========================================================= */}
                {/* 1. DESKTOP DROPDOWN (visible on sm+)                      */}
                {/* ========================================================= */}
                {isOpen && (
                    <div
                        role="listbox"
                        className={cn(
                            "hidden sm:block absolute top-full right-0 left-0 mt-2 z-50 bg-surface border border-soft-border rounded-2xl shadow-xl shadow-brand/10 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
                        )}
                    >
                        {/* Search Bar */}
                        {searchable && (
                            <div className="p-2.5 border-b border-soft-border bg-surface-secondary/50">
                                <div className="relative">
                                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
                                    <input
                                        ref={desktopSearchInputRef}
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder={searchPlaceholder}
                                        className="w-full bg-surface border border-soft-border rounded-xl py-2 pr-9 pl-3 text-xs font-bold text-brand focus:ring-2 focus:ring-primary/20 outline-none placeholder:text-secondary/40"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Quick Access Tags (if any) */}
                        {tags && tags.length > 0 && (
                            <div className="p-2 border-b border-soft-border bg-surface">
                                {tagsLabel && (
                                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-secondary mb-1.5 pr-1">
                                        {tagsIcon}
                                        <span>{tagsLabel}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                                    {tags.map((tag) => {
                                        const isTagSelected = tag.value === value;
                                        return (
                                            <button
                                                key={String(tag.value)}
                                                type="button"
                                                onClick={() => handleSelect(tag.value)}
                                                className={cn(
                                                    "shrink-0 px-2.5 py-1 rounded-full text-xs font-bold transition-all border select-none cursor-pointer",
                                                    isTagSelected
                                                        ? "bg-primary text-white border-primary shadow-xs"
                                                        : "bg-soft-bg hover:bg-primary/10 text-brand hover:text-primary border-soft-border hover:border-primary/30"
                                                )}
                                            >
                                                {tag.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Options List */}
                        <div className="max-h-64 overflow-y-auto p-1.5 space-y-0.5 custom-scrollbar">
                            {isLoading ? (
                                <div className="py-6 flex items-center justify-center gap-2 text-xs font-bold text-secondary">
                                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                    <span>{loadingText}</span>
                                </div>
                            ) : filteredOptions.length === 0 ? (
                                <div className="py-6 text-center text-xs font-bold text-secondary/60">
                                    {emptyText}
                                </div>
                            ) : (
                                filteredOptions.map((opt) => {
                                    const isSelected = opt.value === value;
                                    return (
                                        <button
                                            type="button"
                                            key={String(opt.value)}
                                            role="option"
                                            aria-selected={isSelected}
                                            disabled={opt.disabled}
                                            onClick={() => handleSelect(opt.value)}
                                            className={cn(
                                                "w-full px-3.5 py-2.5 rounded-xl text-right text-xs sm:text-sm font-bold transition-colors flex items-center justify-between gap-2 cursor-pointer",
                                                isSelected
                                                    ? "bg-primary/10 text-primary font-black"
                                                    : "text-brand hover:bg-soft-bg hover:text-brand",
                                                opt.disabled && "opacity-40 cursor-not-allowed hover:bg-transparent"
                                            )}
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                                                <div className="text-right min-w-0">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="truncate block">{opt.label}</span>
                                                        {opt.badge && (
                                                            <span className="shrink-0 text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                                                                {opt.badge}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {opt.description && (
                                                        <span className="text-[11px] text-secondary font-normal block truncate mt-0.5">
                                                            {opt.description}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            {isSelected && (
                                                <Check className="w-4 h-4 text-primary shrink-0" />
                                            )}
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* ========================================================= */}
            {/* 2. MOBILE DRAWER (Bottom Sheet for screens < sm)         */}
            {/* ========================================================= */}
            {isOpen && mounted && createPortal(
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label={titleText}
                    className="sm:hidden fixed inset-0 z-[9999] flex items-end justify-center"
                >
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/50 backdrop-blur-xs animate-in fade-in duration-300"
                        onClick={() => {
                            setIsOpen(false);
                            setSearchQuery("");
                        }}
                    />

                    {/* Bottom Sheet Drawer */}
                    <div
                        ref={drawerRef}
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                        className={cn(
                            "relative w-full bg-surface rounded-t-[24px] sm:rounded-t-[28px] max-h-[85vh] flex flex-col z-10 shadow-2xl overflow-hidden",
                            "animate-in slide-in-from-bottom duration-300"
                        )}
                    >
                        {/* Drag Handle Indicator */}
                        <div className="flex justify-center pt-2.5 pb-1 shrink-0">
                            <div className="w-8 h-1 rounded-full bg-soft-border/80" />
                        </div>

                        {/* Drawer Header */}
                        <div className="flex items-center justify-between px-4 py-2.5 border-b border-soft-border shrink-0">
                            <span className="font-black text-brand text-sm sm:text-base">{titleText}</span>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsOpen(false);
                                    setSearchQuery("");
                                }}
                                className="p-1.5 rounded-full hover:bg-soft-bg text-secondary transition-colors cursor-pointer"
                                aria-label="بستن"
                            >
                                <X className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                        </div>

                        {/* Search Bar inside Drawer */}
                        {searchable && (
                            <div className="px-3.5 pt-2.5 pb-1.5 shrink-0">
                                <div className="relative">
                                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-secondary" />
                                    <input
                                        ref={mobileSearchInputRef}
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder={searchPlaceholder}
                                        className="w-full bg-soft-bg rounded-xl py-2 sm:py-2.5 pr-8.5 pl-8 text-xs font-bold text-brand border border-soft-border focus:ring-2 focus:ring-primary/20 outline-none placeholder:text-secondary/50"
                                    />
                                    {searchQuery && (
                                        <button
                                            type="button"
                                            onClick={() => setSearchQuery("")}
                                            className="absolute left-2.5 top-1/2 -translate-y-1/2 p-1 text-secondary hover:text-brand"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Quick Access Tags inside Drawer */}
                        {tags && tags.length > 0 && (
                            <div className="px-3.5 py-1.5 border-b border-soft-border/60 shrink-0">
                                {tagsLabel && (
                                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-secondary mb-1.5 pr-0.5">
                                        {tagsIcon}
                                        <span>{tagsLabel}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                                    {tags.map((tag) => {
                                        const isTagSelected = tag.value === value;
                                        return (
                                            <button
                                                key={String(tag.value)}
                                                type="button"
                                                onClick={() => handleSelect(tag.value)}
                                                className={cn(
                                                    "shrink-0 px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-bold transition-all border select-none cursor-pointer",
                                                    isTagSelected
                                                        ? "bg-primary text-white border-primary shadow-xs"
                                                        : "bg-soft-bg hover:bg-primary/10 text-brand hover:text-primary border-soft-border active:scale-95"
                                                )}
                                            >
                                                {tag.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Options List */}
                        <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-2 space-y-1 custom-scrollbar pb-6">
                            {isLoading ? (
                                <div className="py-8 flex flex-col items-center justify-center gap-2 text-xs font-bold text-secondary">
                                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                    <span>{loadingText}</span>
                                </div>
                            ) : filteredOptions.length === 0 ? (
                                <div className="py-8 text-center text-xs font-bold text-secondary/60">
                                    {emptyText}
                                </div>
                            ) : (
                                filteredOptions.map((opt) => {
                                    const isSelected = opt.value === value;
                                    return (
                                        <button
                                            type="button"
                                            key={String(opt.value)}
                                            role="option"
                                            aria-selected={isSelected}
                                            disabled={opt.disabled}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleSelect(opt.value);
                                            }}
                                            className={cn(
                                                "w-full px-3.5 py-2.5 rounded-xl text-right text-xs sm:text-sm font-bold transition-all flex items-center justify-between gap-2.5 border cursor-pointer",
                                                isSelected
                                                    ? "bg-primary/10 border-primary/30 text-primary font-black shadow-xs"
                                                    : "bg-surface-secondary/40 border-soft-border/60 hover:bg-soft-bg text-brand active:scale-[0.99]",
                                                opt.disabled && "opacity-40 cursor-not-allowed hover:bg-transparent"
                                            )}
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                                                <div className="text-right min-w-0">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="truncate block text-xs sm:text-sm">{opt.label}</span>
                                                        {opt.badge && (
                                                            <span className="shrink-0 text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                                                                {opt.badge}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {opt.description && (
                                                        <span className="text-[11px] text-secondary font-normal block truncate mt-0.5">
                                                            {opt.description}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div
                                                className={cn(
                                                    "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                                                    isSelected
                                                        ? "border-primary bg-primary text-white"
                                                        : "border-border"
                                                )}
                                            >
                                                {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Helper or Error Message */}
            {error ? (
                <p className="text-[11px] text-error font-bold pr-1">{error}</p>
            ) : helperText ? (
                <p className="text-[11px] text-secondary font-medium pr-1">{helperText}</p>
            ) : null}
        </div>
    );
}
