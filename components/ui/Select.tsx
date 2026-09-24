"use client";

import React, {
    useState,
    useRef,
    useEffect,
    useCallback,
    ReactNode,
} from "react";
import { ChevronDown, Check, X, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption<T = string> {
    value: T;
    label: string;
    description?: string;
    icon?: ReactNode;
    disabled?: boolean;
}

export interface SelectProps<T extends string | number = string> {
    value?: T;
    onChange: (value: T) => void;
    options: SelectOption<T>[];
    placeholder?: string;
    label?: string;
    error?: string;
    helperText?: string;
    disabled?: boolean;
    searchable?: boolean;
    searchPlaceholder?: string;
    clearable?: boolean;
    clearValue?: T;
    icon?: ReactNode;
    className?: string;
    triggerClassName?: string;
    dropdownClassName?: string;
    variant?: "soft" | "outline" | "white";
    size?: "sm" | "md" | "lg";
}

export function Select<T extends string | number = string>({
    value,
    onChange,
    options = [],
    placeholder = "انتخاب کنید...",
    label,
    error,
    helperText,
    disabled = false,
    searchable = false,
    searchPlaceholder = "جستجو...",
    clearable = false,
    clearValue,
    icon,
    className,
    triggerClassName,
    dropdownClassName,
    variant = "soft",
    size = "md",
}: SelectProps<T>) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const selectedOption = options.find((opt) => opt.value === value);

    // Filter options if searchable
    const filteredOptions = options.filter((opt) => {
        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase();
        const matchLabel = opt.label.toLowerCase().includes(query);
        const matchDesc = opt.description?.toLowerCase().includes(query);
        return matchLabel || matchDesc;
    });

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent | TouchEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchQuery("");
            }
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

    // Focus search input when dropdown opens
    useEffect(() => {
        if (isOpen && searchable && searchInputRef.current) {
            setTimeout(() => {
                searchInputRef.current?.focus();
            }, 50);
        }
    }, [isOpen, searchable]);

    // Handle keyboard escape
    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                setIsOpen(false);
                setSearchQuery("");
            }
        },
        [isOpen]
    );

    const handleSelect = (option: SelectOption<T>) => {
        if (option.disabled) return;
        onChange(option.value);
        setIsOpen(false);
        setSearchQuery("");
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (clearValue !== undefined) {
            onChange(clearValue);
        } else {
            const fallbackOption = options.find((opt) => opt.value === "" || opt.value === 0);
            if (fallbackOption) {
                onChange(fallbackOption.value);
            }
        }
        setSearchQuery("");
    };

    // Variant base classes for the trigger
    const variantStyles = {
        soft: "bg-soft-bg border-soft-border text-brand hover:bg-soft-bg/80 focus:ring-2 focus:ring-primary/20 focus:border-primary/50",
        white: "bg-white border-soft-border text-brand hover:border-primary/40 focus:ring-2 focus:ring-primary/20 focus:border-primary/50 shadow-xs",
        outline: "bg-transparent border-gray-200 text-brand hover:border-brand/40 focus:ring-2 focus:ring-brand/10 focus:border-brand",
    };

    // Size styles
    const sizeStyles = {
        sm: "py-2 px-3 text-xs rounded-xl min-h-[38px]",
        md: "py-3.5 px-4 text-sm rounded-2xl min-h-[48px]",
        lg: "py-4 px-5 text-base rounded-2xl min-h-[56px]",
    };

    return (
        <div className={cn("space-y-1.5 w-full text-right", className)} ref={containerRef} onKeyDown={handleKeyDown}>
            {label && (
                <label className="block text-xs font-bold text-brand pr-1 select-none">
                    {label}
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
                        "w-full border flex items-center justify-between text-right font-bold transition-all duration-200 outline-none cursor-pointer select-none",
                        variantStyles[variant],
                        sizeStyles[size],
                        disabled && "opacity-50 cursor-not-allowed pointer-events-none bg-gray-100",
                        error && "border-red-500 focus:ring-red-200",
                        triggerClassName
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
                            </div>
                        ) : (
                            <span className="text-secondary/50 font-normal truncate">
                                {placeholder}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 mr-2">
                        {clearable && selectedOption && !disabled && (
                            <span
                                role="button"
                                tabIndex={0}
                                onClick={handleClear}
                                className="p-1 hover:bg-gray-200 rounded-full text-secondary transition-colors"
                            >
                                <X className="w-3.5 h-3.5" />
                            </span>
                        )}
                        <ChevronDown
                            className={cn(
                                "w-4 h-4 text-secondary transition-transform duration-300",
                                isOpen && "rotate-180 text-primary"
                            )}
                        />
                    </div>
                </button>

                {/* Dropdown Menu */}
                {isOpen && (
                    <div
                        role="listbox"
                        className={cn(
                            "absolute top-full right-0 left-0 mt-2 z-50 bg-white border border-soft-border rounded-2xl shadow-xl shadow-brand/10 overflow-hidden animate-in fade-in zoom-in-95 duration-150",
                            dropdownClassName
                        )}
                    >
                        {/* Search Bar */}
                        {searchable && (
                            <div className="p-2 border-b border-soft-border bg-gray-50/50">
                                <div className="relative">
                                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
                                    <input
                                        ref={searchInputRef}
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder={searchPlaceholder}
                                        className="w-full bg-white border border-soft-border rounded-xl py-2 pr-9 pl-3 text-xs font-bold text-brand focus:ring-2 focus:ring-primary/20 outline-none placeholder:text-secondary/40"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Options List */}
                        <div className="max-h-60 overflow-y-auto p-1.5 space-y-0.5 custom-scrollbar">
                            {filteredOptions.length === 0 ? (
                                <div className="py-6 text-center text-xs font-bold text-secondary/60">
                                    موردی یافت نشد
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
                                            onClick={() => handleSelect(opt)}
                                            className={cn(
                                                "w-full px-3.5 py-2.5 rounded-xl text-right text-xs sm:text-sm font-bold transition-colors flex items-center justify-between gap-2",
                                                isSelected
                                                    ? "bg-primary/10 text-primary font-black"
                                                    : "text-brand hover:bg-soft-bg hover:text-brand",
                                                opt.disabled && "opacity-40 cursor-not-allowed hover:bg-transparent"
                                            )}
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                                                <div className="text-right min-w-0">
                                                    <span className="truncate block">{opt.label}</span>
                                                    {opt.description && (
                                                        <span className="text-[11px] text-secondary font-normal block truncate">
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

            {/* Helper or Error Message */}
            {error ? (
                <p className="text-[11px] text-red-500 font-bold pr-1">{error}</p>
            ) : helperText ? (
                <p className="text-[11px] text-secondary font-medium pr-1">{helperText}</p>
            ) : null}
        </div>
    );
}
