"use client";

import { ChevronDown, MapPin, Search } from "lucide-react";
import { useState } from "react";
import { CitySelector } from "./CitySelector";

interface PageHeaderProps {
    title: string;
    description?: string;
    searchPlaceholder?: string;
    searchValue?: string;
    onSearchChange?: (value: string) => void;
    cityName: string;
    cityId?: string;
    onCitySelect: (city: { id: string; name: string }) => void;
}

export function PageHeader({
    title,
    description,
    searchPlaceholder = "جستجو...",
    searchValue = "",
    onSearchChange,
    cityName,
    cityId,
    onCitySelect
}: PageHeaderProps) {
    const [isSelectorOpen, setIsSelectorOpen] = useState(false);

    return (
        <div className="space-y-3">
            <div className="space-y-1">
                <h1 className="text-brand text-lg sm:text-2xl lg:text-3xl font-black leading-tight">
                    {title}
                </h1>
                {description && (
                    <p className="text-secondary text-xs sm:text-sm font-medium">
                        {description}
                    </p>
                )}
            </div>

            {/* Unified Search + City Selector Container */}
            {onSearchChange && (
                <div className="relative flex items-center w-full lg:max-w-4xl bg-soft-bg border border-soft-border rounded-[15px] md:rounded-[20px] shadow-sm hover:shadow-md transition-all group focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/30">
                    {/* Search Icon */}
                    <Search className="absolute right-3 md:right-4 w-4 md:w-5 h-4 md:h-5 text-secondary group-focus-within:text-primary transition-colors shrink-0 pointer-events-none" />

                    {/* Search Input */}
                    <input
                        type="text"
                        value={searchValue}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder={searchPlaceholder}
                        className="flex-1 bg-transparent py-3 md:py-4 pr-9 md:pr-12 pl-2 text-xs md:text-sm font-bold text-brand outline-none placeholder:text-secondary-400 placeholder:text-xs placeholder:md:text-sm min-w-0"
                    />

                    {/* Divider */}
                    <div className="w-px h-6 bg-soft-border shrink-0 mx-1" />

                    {/* City Selector Button — inside the search bar */}
                    <button
                        type="button"
                        onClick={() => setIsSelectorOpen(true)}
                        className="flex items-center gap-1 md:gap-1.5 px-2 md:px-4 py-2 md:py-3 rounded-l-[14px] md:rounded-l-[18px] cursor-pointer hover:bg-primary/5 transition-colors shrink-0 group/city"
                    >
                        <MapPin className="w-3.5 md:w-4 h-3.5 md:h-4 text-primary shrink-0" />
                        <span className="text-brand font-black text-[10px] md:text-xs whitespace-nowrap max-w-[60px] md:max-w-[100px] truncate">
                            {cityName || "همه شهرها"}
                        </span>
                        <ChevronDown className="w-3 md:w-3.5 h-3 md:h-3.5 text-secondary group-hover/city:text-primary transition-colors" />
                    </button>
                </div>
            )}

            <CitySelector
                isOpen={isSelectorOpen}
                onClose={() => setIsSelectorOpen(false)}
                onSelect={(city) => {
                    onCitySelect(city);
                    setIsSelectorOpen(false);
                }}
                currentCityId={cityId}
            />
        </div>
    );
}
