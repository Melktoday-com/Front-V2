"use client";

import { CitySelector } from "@/components/CitySelector";
import { useCity } from "@/components/providers/CityProvider";
import { AgencyCard } from "@/components/ui/AgencyCard";
import { useAgencies } from "@/hooks/useAgencies";
import { useGeoHierarchy } from "@/hooks/useGeoHierarchy";
import { AgencySummary } from "@/types/api/agency.types";
import { ChevronDown, MapPin, Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

export default function AgencyScene() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { selectedCity, setSelectedCity } = useCity();

    const urlSearch = searchParams.get("search") || "";
    // Priority: URL Param -> Global State
    const effectiveCityId = searchParams.get("cityId") || selectedCity.id || undefined;
    const effectiveCityName = searchParams.get("cityName") || selectedCity.name || "همه شهرها";

    const [isCitySelectorOpen, setIsCitySelectorOpen] = useState(false);
    const [search, setSearch] = useState(urlSearch);

    const { data: agenciesData, isLoading } = useAgencies({
        limit: 12,
        search: search || undefined,
        cityId: effectiveCityId
    }, { enabled: !!effectiveCityId });

    const { data: hierarchy } = useGeoHierarchy();

    const cityNameMap = useMemo(() => {
        if (!hierarchy) return {};
        const map: Record<string, string> = {};
        hierarchy.forEach(province => {
            province.cities.forEach(city => {
                map[city.id] = city.name;
            });
        });
        return map;
    }, [hierarchy]);

    const handleCitySelect = (city: { id: string; name: string }) => {
        setSelectedCity(city);
        const params = new URLSearchParams(searchParams.toString());
        params.set("cityId", city.id);
        params.set("cityName", city.name);
        router.push(`${window.location.pathname}?${params.toString()}`);
        setIsCitySelectorOpen(false);
    };

    const clearCityFilter = () => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete("cityId");
        params.delete("cityName");
        router.push(`${window.location.pathname}?${params.toString()}`);
    };

    return (
        <div className="min-h-screen bg-white pb-24 lg:pb-10">
            <div className="p-6 lg:p-10 space-y-8">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-soft-border">
                    <div className="space-y-2">
                        <h1 className="text-brand text-2xl lg:text-3xl font-black">آژانس‌های املاک</h1>
                        <p className="text-secondary text-sm font-medium">بهترین آژانس‌های فعال در {effectiveCityName}</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div
                            onClick={() => setIsCitySelectorOpen(true)}
                            className="flex items-center gap-2 bg-soft-bg px-4 py-2.5 rounded-[18px] border border-soft-border group cursor-pointer hover:border-primary/50 transition-all shadow-sm"
                        >
                            <MapPin className="w-5 h-5 text-primary shrink-0" />
                            <div className="flex items-center gap-2">
                                <span className="text-brand font-black text-xs">
                                    {effectiveCityName}
                                </span>
                                <ChevronDown className="w-3 h-3 text-secondary group-hover:text-primary transition-colors" />
                            </div>
                        </div>

                        {effectiveCityId && (
                            <button
                                onClick={clearCityFilter}
                                className="p-2.5 bg-soft-bg border border-soft-border rounded-[18px] text-secondary hover:text-red-500 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                <div className="relative max-w-2xl">
                    <Search className="absolute right-5 top-1/2 -translate-y-1/2 w-6 h-6 text-secondary" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="جستجوی نام آژانس املاک..."
                        className="w-full bg-soft-bg border border-soft-border rounded-[25px] py-5 pr-14 pl-6 text-base font-bold text-brand focus:ring-4 focus:ring-primary/10 outline-none transition-all shadow-sm"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {isLoading ? (
                        Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="h-50 bg-soft-bg animate-pulse rounded-[30px]" />
                        ))
                    ) : agenciesData?.agencies?.length === 0 ? (
                        <div className="col-span-full py-20 text-center space-y-4">
                            <div className="text-secondary-400 font-bold">آژانسی در این محله یافت نشد</div>
                        </div>
                    ) : (
                        (agenciesData?.agencies || []).map((agency: AgencySummary) => (
                            <AgencyCard
                                key={agency.id}
                                id={agency.id}
                                name={agency.name}
                                bio={agency.bio}
                                isVerified={agency.isVerified}
                                rating={agency.rating}
                                logoUrl={agency.logoUrl}
                                location={cityNameMap[agency.cityId] || "نامشخص"}
                            />
                        ))
                    )}
                </div>
            </div>

            <CitySelector
                isOpen={isCitySelectorOpen}
                onClose={() => setIsCitySelectorOpen(false)}
                onSelect={handleCitySelect}
                currentCityId={effectiveCityId}
            />
        </div>
    );
}
