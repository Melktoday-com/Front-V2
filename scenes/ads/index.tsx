"use client";

import CategoryFilter from "@/components/CategoryFilter";
import { PageHeader } from "@/components/PageHeader";
import { useCity } from "@/components/providers/CityProvider";
import { PropertyCard } from "@/components/ui/PropertyCard";
import { useAds, useCategories } from "@/hooks/useAds";
import { useGeoHierarchy } from "@/hooks/useGeoHierarchy";
import { cn } from "@/lib/utils";
import { AdSummary } from "@/types/api/ads.types";
import { LayoutGrid, Map as MapIcon } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

const Map = dynamic(() => import("@/components/ui/Map"), {
    ssr: false,
    loading: () => <div className="w-full h-150 bg-soft-bg animate-pulse rounded-[25px] flex items-center justify-center text-text-light">در حال بارگذاری نقشه...</div>
});

interface AdsSceneProps {
    initialViewMode?: "list" | "map";
}

export default function AdsScene({ initialViewMode = "list" }: AdsSceneProps) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { selectedCity, setSelectedCity } = useCity();
    const [viewMode, setViewMode] = useState<"list" | "map">(initialViewMode);

    const urlSearch = searchParams.get("search") || "";
    // Priority: URL Param -> Global State
    const effectiveCityId = searchParams.get("cityId") || selectedCity.id || undefined;
    const effectiveCityName = searchParams.get("cityName") || selectedCity.name || "همه شهرها";

    const [search, setSearch] = useState(urlSearch);

    const { data, isLoading } = useAds({
        limit: 12,
        status: "PUBLISHED",
        search: search || undefined,
        cityId: effectiveCityId
    }, { enabled: !!effectiveCityId });

    const { data: categoriesData, isLoading: isCategoriesLoading } = useCategories();
    const { data: hierarchy } = useGeoHierarchy();

    // Find the current city's coordinates from the hierarchy if not in selectedCity state
    const currentCityCoords = useMemo(() => {
        // Use selectedCity.centerPoint but accommodate both latitude/longitude and lat/lng
        if (selectedCity.centerPoint) {
            const cp = selectedCity.centerPoint as any;
            return {
                latitude: cp.latitude ?? cp.lat,
                longitude: cp.longitude ?? cp.lng
            };
        }

        if (!hierarchy || !effectiveCityId) return null;

        for (const province of hierarchy) {
            const city = province.cities.find(c => c.id === effectiveCityId);
            if (city?.centerPoint) {
                const cp = city.centerPoint as any;
                return {
                    latitude: cp.latitude ?? cp.lat,
                    longitude: cp.longitude ?? cp.lng
                };
            }
        }
        return null;
    }, [hierarchy, effectiveCityId, selectedCity.centerPoint]);

    // Map coordinates from API names (latitude/longitude) to Leaflet names (lat/lng)
    const adsForMap = useMemo(() => {
        if (!data?.items) return [];
        return data.items.filter((ad: AdSummary) =>
            ad.location &&
            (typeof ad.location.latitude === 'number' || typeof (ad.location as any).lat === 'number') &&
            (typeof ad.location.longitude === 'number' || typeof (ad.location as any).lng === 'number')
        ).map((ad: AdSummary) => ({
            ...ad,
            location: {
                ...ad.location,
                latitude: ad.location.latitude ?? (ad.location as any).lat,
                longitude: ad.location.longitude ?? (ad.location as any).lng
            }
        }));
    }, [data?.items]);

    const handleCitySelect = (city: {
        id: string;
        name: string;
        centerPoint?: { latitude: number; longitude: number }
    }) => {
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
                    title="جستجوی املاک"
                    searchPlaceholder="نام منطقه، محله یا نوع ملک..."
                    searchValue={search}
                    onSearchChange={setSearch}
                    cityName={effectiveCityName}
                    cityId={effectiveCityId}
                    onCitySelect={handleCitySelect}
                />

                <CategoryFilter
                    categories={categoriesData || []}
                    isLoading={isCategoriesLoading}
                />

                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-brand">
                        {viewMode === "list" ? "لیست آگهی‌ها" : "نمایش روی نقشه"}
                    </h2>
                    <div className="flex bg-soft-bg p-1 rounded-xl gap-1">
                        <button
                            onClick={() => setViewMode("list")}
                            className={cn(
                                "flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all",
                                viewMode === "list" ? "bg-white shadow-sm text-brand" : "text-text-light hover:text-brand"
                            )}
                        >
                            <LayoutGrid size={18} />
                            <span className="text-sm font-bold">لیست</span>
                        </button>
                        <button
                            onClick={() => setViewMode("map")}
                            className={cn(
                                "flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all",
                                viewMode === "map" ? "bg-white shadow-sm text-brand" : "text-text-light hover:text-brand"
                            )}
                        >
                            <MapIcon size={18} />
                            <span className="text-sm font-bold">نقشه</span>
                        </button>
                    </div>
                </div>

                {viewMode === "list" ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 2xl:grid-cols-6 gap-x-4 gap-y-6 items-stretch">
                        {isLoading ? (
                            Array.from({ length: 8 }).map((_, i) => (
                                <div key={i} className="aspect-square bg-soft-bg animate-pulse rounded-[25px]" />
                            ))
                        ) : data?.items?.length === 0 ? (
                            <div className="col-span-full py-20 text-center space-y-4">
                                <div className="text-secondary-400 font-bold">ملکی با این مشخصات پیدا نشد</div>
                            </div>
                        ) : (
                            (data?.items || []).map((ad: AdSummary) => (
                                <PropertyCard
                                    key={ad.adId}
                                    adId={ad.adId}
                                    title={ad.title}
                                    price={Object.values(ad.pricing)[0]?.toLocaleString() || "0"}
                                    rating={4.5}
                                    location={effectiveCityName || ad.cityId}
                                    image={ad.mediaIds && ad.mediaIds.length > 0
                                        ? `${process.env.NEXT_PUBLIC_API_URL}/media/${ad.mediaIds[0]}`
                                        : "/assets/images/property-placeholder.png"
                                    }
                                    category={ad.categoryPath.subcategoryKey}
                                />
                            ))
                        )}
                    </div>
                ) : (
                    <div className="h-150 w-full animate-in fade-in duration-500">
                        <Map
                            ads={adsForMap}
                            center={(currentCityCoords && typeof currentCityCoords.latitude === 'number' && typeof currentCityCoords.longitude === 'number')
                                ? [currentCityCoords.latitude, currentCityCoords.longitude]
                                : (adsForMap.length > 0 && typeof adsForMap[0].location.latitude === 'number' && typeof adsForMap[0].location.longitude === 'number')
                                    ? [adsForMap[0].location.latitude, adsForMap[0].location.longitude]
                                    : [35.6892, 51.3890]
                            }
                            zoom={12}
                            onAdSelect={(ad) => router.push(`/ads/${ad.adId}`)}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
