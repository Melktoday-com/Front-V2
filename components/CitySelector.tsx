"use client";

import { useGeoHierarchy } from "@/hooks/useGeoHierarchy";
import { cn } from "@/lib/utils";
import { Check, MapPin, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

interface CitySelectorProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (city: {
        id: string;
        name: string;
        centerPoint?: { latitude: number; longitude: number }
    }) => void;
    currentCityId?: string;
}

export function CitySelector({ isOpen, onClose, onSelect, currentCityId }: CitySelectorProps) {
    const { data: hierarchy, isLoading } = useGeoHierarchy();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedProvinceId, setSelectedProvinceId] = useState<string | null>(null);

    // Prevent scrolling when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    const filteredData = useMemo(() => {
        if (!hierarchy) return [];
        if (!searchQuery) return hierarchy;

        const query = searchQuery.toLowerCase();
        return hierarchy.map(province => {
            const matchedCities = province.cities.filter(city =>
                city.name.toLowerCase().includes(query)
            );

            const provinceMatches = province.name.toLowerCase().includes(query);

            if (provinceMatches || matchedCities.length > 0) {
                return {
                    ...province,
                    cities: provinceMatches ? province.cities : matchedCities
                };
            }
            return null;
        }).filter(Boolean) as typeof hierarchy;
    }, [hierarchy, searchQuery]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-10000 flex items-end lg:items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-brand/40 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Content Container */}
            <div className={cn(
                "relative w-full lg:max-w-2xl bg-white rounded-t-[30px] lg:rounded-[30px] shadow-2xl flex flex-col overflow-hidden transition-transform duration-300 transform",
                "h-[85vh] lg:h-[70vh]", // Height adjustment
                "animate-in slide-in-from-bottom lg:slide-in-from-bottom-10"
            )}>
                {/* Header */}
                <div className="p-6 border-b border-soft-border space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-brand text-xl font-black">انتخاب شهر</h2>
                        <button onClick={onClose} className="p-2 hover:bg-soft-bg rounded-full transition-colors">
                            <X className="w-6 h-6 text-secondary" />
                        </button>
                    </div>

                    <div className="relative">
                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary" />
                        <input
                            type="text"
                            autoFocus
                            placeholder="جستجوی نام شهر یا استان..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-soft-bg border border-soft-border rounded-[20px] py-4 pr-12 pl-4 text-sm font-bold text-brand focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-secondary-400"
                        />
                    </div>
                </div>

                {/* Cities List */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-full space-y-4">
                            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                            <span className="text-secondary font-bold">درحال دریافت اطلاعات...</span>
                        </div>
                    ) : filteredData.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-secondary font-bold">
                            شهری با این مشخصات پیدا نشد
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {filteredData.map((province) => (
                                <div key={province.id} className="space-y-2">
                                    <div className="px-4 py-2 bg-soft-bg rounded-[15px] text-primary font-black text-sm flex items-center gap-2">
                                        <MapPin className="w-4 h-4" />
                                        {province.name}
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 px-2">
                                        {province.cities.map((city) => (
                                            <button
                                                key={city.id}
                                                onClick={() => {
                                                    onSelect(city);
                                                    onClose();
                                                }}
                                                className={cn(
                                                    "text-right px-4 py-3 rounded-[15px] text-sm font-bold transition-all border",
                                                    currentCityId === city.id
                                                        ? "bg-primary/10 border-primary text-primary"
                                                        : "bg-white border-soft-border text-brand hover:border-primary/30 hover:bg-soft-bg"
                                                )}
                                            >
                                                {city.name}
                                                {currentCityId === city.id && <Check className="w-4 h-4 inline-block mr-2" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer (Mobile only indicator) */}
                <div className="lg:hidden h-2 bg-soft-border/20 mx-auto w-12 rounded-full mb-3 mt-1 shrink-0" />
            </div>
        </div>
    );
}
