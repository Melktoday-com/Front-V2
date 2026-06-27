"use client";

import { PageHeader } from "@/components/PageHeader";
import { useCity } from "@/components/providers/CityProvider";
import { AgencyCard } from "@/components/ui/AgencyCard";
import { useAgencies } from "@/hooks/useAgencies";
import { useGeoHierarchy } from "@/hooks/useGeoHierarchy";
import { AgencySummary } from "@/types/api/agency.types";
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
    };

    return (
        <div className="min-h-screen bg-white pb-24 lg:pb-10">
            <div className="p-6 lg:p-10 space-y-8">
                <PageHeader
                    title="آژانس‌های املاک"
                    description={`بهترین آژانس‌های فعال در ${effectiveCityName}`}
                    searchPlaceholder="جستجوی نام آژانس املاک..."
                    searchValue={search}
                    onSearchChange={setSearch}
                    cityName={effectiveCityName}
                    cityId={effectiveCityId}
                    onCitySelect={handleCitySelect}
                />

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-6 items-stretch">
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
        </div>
    );
}
