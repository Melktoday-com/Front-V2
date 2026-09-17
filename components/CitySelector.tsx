"use client";

import { useInfiniteGeoHierarchy } from "@/hooks/useGeoHierarchy";
import { cn } from "@/lib/utils";
import { geoService } from "@/services/geo.service";
import { useQuery } from "@tanstack/react-query";
import { Check, Flame, Loader2, MapPin, Search, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const POPULAR_CITIES = [
    { name: "تهران" },
    { name: "مشهد" },
    { name: "تبریز" },
    { name: "اصفهان" },
    { name: "کیش" },
    { name: "شیراز" },
];

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
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [loadingTagCity, setLoadingTagCity] = useState<string | null>(null);
    const listContainerRef = useRef<HTMLDivElement>(null);

    // Preload popular cities once so quick access tags are instant
    const { data: preloadedPopularCities } = useQuery({
        queryKey: ["popular-cities-quick-access"],
        queryFn: async () => {
            try {
                const results = await Promise.all(
                    POPULAR_CITIES.map(async (c) => {
                        const res = await geoService.getProvincesHierarchy({ search: c.name, limit: 1 });
                        return res.provinces?.flatMap((p) => p.cities).find((city) => city.name === c.name);
                    })
                );
                return results.filter(Boolean) as {
                    id: string;
                    name: string;
                    centerPoint?: { latitude: number; longitude: number };
                }[];
            } catch {
                return [];
            }
        },
        staleTime: 1000 * 60 * 60 * 24, // 24 hours
    });

    // Debounce search query to reduce backend calls while typing
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Fetch hierarchy paginated with infinite scroll
    const {
        data,
        isLoading,
        isFetchingNextPage,
        hasNextPage,
        fetchNextPage,
    } = useInfiniteGeoHierarchy({
        search: debouncedSearch,
        limit: 6,
    });

    // Flatten all loaded province pages
    const provinces = useMemo(() => {
        if (!data?.pages) return [];
        return data.pages.flatMap((page) => page.provinces || []);
    }, [data]);

    const handlePopularClick = async (targetName: string) => {
        // 1. Check preloaded popular cities
        const foundPreloaded = preloadedPopularCities?.find((c) => c.name === targetName);
        if (foundPreloaded) {
            onSelect({
                id: foundPreloaded.id,
                name: foundPreloaded.name,
                centerPoint: foundPreloaded.centerPoint,
            });
            onClose();
            return;
        }

        // 2. Check loaded provinces
        const foundInProvinces = provinces.flatMap((p) => p.cities).find((c) => c.name === targetName);
        if (foundInProvinces) {
            onSelect({
                id: foundInProvinces.id,
                name: foundInProvinces.name,
                centerPoint: foundInProvinces.centerPoint,
            });
            onClose();
            return;
        }

        // 3. Fallback: fetch directly via service
        try {
            setLoadingTagCity(targetName);
            const res = await geoService.getProvincesHierarchy({ search: targetName, limit: 1 });
            const city = res.provinces?.flatMap((p) => p.cities).find((c) => c.name === targetName);
            if (city) {
                onSelect({
                    id: city.id,
                    name: city.name,
                    centerPoint: city.centerPoint,
                });
                onClose();
            } else {
                setSearchQuery(targetName);
            }
        } catch {
            setSearchQuery(targetName);
        } finally {
            setLoadingTagCity(null);
        }
    };

    // Handle infinite scrolling when reaching near bottom
    const handleScroll = useCallback(() => {
        const container = listContainerRef.current;
        if (!container) return;

        const { scrollTop, scrollHeight, clientHeight } = container;
        if (scrollHeight - scrollTop - clientHeight < 150) {
            if (hasNextPage && !isFetchingNextPage) {
                fetchNextPage();
            }
        }
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

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
                "h-[85vh] lg:h-[70vh]",
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

                    {/* Quick Access Popular Cities */}
                    <div className="space-y-2 pt-1">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-secondary">
                            <Flame className="w-3.5 h-3.5 text-amber-500" />
                            <span>شهرهای پربازدید:</span>
                        </div>
                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
                            {POPULAR_CITIES.map((item) => {
                                const matchedCity =
                                    preloadedPopularCities?.find((c) => c?.name === item.name) ||
                                    provinces.flatMap((p) => p.cities).find((c) => c.name === item.name);
                                const isSelected = matchedCity?.id === currentCityId;
                                const isLoadingTag = loadingTagCity === item.name;

                                return (
                                    <button
                                        key={item.name}
                                        type="button"
                                        disabled={Boolean(loadingTagCity)}
                                        onClick={() => handlePopularClick(item.name)}
                                        className={cn(
                                            "shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 border select-none cursor-pointer",
                                            isSelected
                                                ? "bg-primary text-white border-primary shadow-xs"
                                                : "bg-soft-bg hover:bg-primary/10 text-brand hover:text-primary border-soft-border hover:border-primary/30 active:scale-95"
                                        )}
                                    >
                                        {isLoadingTag ? (
                                            <Loader2 className="w-3 h-3 animate-spin text-primary" />
                                        ) : null}
                                        <span>{item.name}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Cities List */}
                <div
                    ref={listContainerRef}
                    onScroll={handleScroll}
                    className="flex-1 overflow-y-auto p-4 custom-scrollbar"
                >
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-full space-y-4">
                            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                            <span className="text-secondary font-bold">درحال دریافت اطلاعات...</span>
                        </div>
                    ) : provinces.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-secondary font-bold">
                            شهری با این مشخصات پیدا نشد
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {provinces.map((province) => (
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
                                                    "text-right px-3.5 py-2.5 rounded-[15px] text-sm font-bold transition-all border flex items-center justify-between gap-1",
                                                    currentCityId === city.id
                                                        ? "bg-primary/10 border-primary text-primary"
                                                        : "bg-white border-soft-border text-brand hover:border-primary/30 hover:bg-soft-bg"
                                                )}
                                            >
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                    <span className="truncate">{city.name}</span>
                                                    {city.isCapital && (
                                                        <span className="shrink-0 text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                                                            مرکز استان
                                                        </span>
                                                    )}
                                                </div>
                                                {currentCityId === city.id && <Check className="w-4 h-4 shrink-0 text-primary" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}

                            {isFetchingNextPage && (
                                <div className="flex justify-center py-4">
                                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer (Mobile only indicator) */}
                <div className="lg:hidden h-2 bg-soft-border/20 mx-auto w-12 rounded-full mb-3 mt-1 shrink-0" />
            </div>
        </div>
    );
}

