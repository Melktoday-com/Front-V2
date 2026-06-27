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
        <div className="space-y-8">
            <div className="space-y-4">
                <div className="space-y-2">
                    <h1 className="text-brand text-2xl lg:text-3xl font-black leading-tight">
                        {title}
                    </h1>
                    {description && (
                        <p className="text-secondary text-sm font-medium">
                            {description}
                        </p>
                    )}
                </div>

                <div className="flex flex-row items-center gap-2 md:gap-3 w-full lg:max-w-4xl">
                    {onSearchChange && (
                        <div className="relative flex-1 group">
                            <Search className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 w-4 md:w-5 h-4 md:h-5 text-secondary group-focus-within:text-primary transition-colors" />
                            <input
                                type="text"
                                value={searchValue}
                                onChange={(e) => onSearchChange(e.target.value)}
                                placeholder={searchPlaceholder}
                                className="w-full bg-soft-bg border border-soft-border rounded-[15px] md:rounded-[20px] py-3 md:py-4 pr-10 md:pr-12 pl-3 md:pl-4 text-xs md:text-sm font-bold text-brand focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-secondary-400 shadow-sm group-hover:shadow-md"
                            />
                        </div>
                    )}

                    <div
                        onClick={() => setIsSelectorOpen(true)}
                        className="flex items-center gap-1 md:gap-2 bg-soft-bg px-3 md:px-5 py-3 md:py-3.5 rounded-[15px] md:rounded-[20px] border border-soft-border group cursor-pointer hover:border-primary/50 transition-all shadow-sm shrink-0 h-[46px] md:h-[54px] whitespace-nowrap"
                    >
                        <MapPin className="w-4 md:w-5 h-4 md:h-5 text-primary shrink-0" />
                        <div className="flex items-center gap-1 md:gap-2">
                            <span className="text-brand font-black text-[10px] md:text-sm">
                                {cityName || "همه شهرها"}
                            </span>
                            <ChevronDown className="w-3 md:w-4 h-3 md:h-4 text-secondary group-hover:text-primary transition-colors" />
                        </div>
                    </div>
                </div>
            </div>

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
