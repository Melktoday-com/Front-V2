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
        limit: 20,
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
        <div className="h-screen bg-white flex flex-col overflow-hidden">
            <div className="flex-none p-6 lg:px-10 lg:pt-10 lg:pb-0 space-y-6">
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
            </div>

            <div className="flex-1 relative flex flex-col lg:flex-row gap-4 p-4 lg:p-10 lg:pt-4 overflow-hidden">
                {/* List Section - 2 columns on side panel */}
                <div className={cn(
                    "flex-1 overflow-y-auto custom-scrollbar transition-all duration-300 px-2",
                    viewMode === "map" ? "hidden lg:block" : "block"
                )}>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-6 pb-20 lg:pb-0">
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
                </div>

                {/* Map Section - Wider on Desktop */}
                <div className={cn(
                    "relative flex-1 lg:flex-[1.5] transition-all duration-300 h-full overflow-hidden",
                    viewMode === "list" ? "hidden lg:block" : "block"
                )}>
                    <Map
                        ads={adsForMap}
                        center={(currentCityCoords && typeof currentCityCoords.latitude === 'number' && typeof currentCityCoords.longitude === 'number')
                            ? [currentCityCoords.latitude, currentCityCoords.longitude]
                            : (adsForMap.length > 0 && typeof adsForMap[0].location.latitude === 'number' && typeof adsForMap[0].location.longitude === 'number')
                                ? [adsForMap[0].location.latitude, adsForMap[0].location.longitude]
                                : [35.6892, 51.3890]
                        }
                        zoom={12}
                    />
                </div>

                {/* Mobile Floating Toggle Button */}
                <button
                    onClick={() => setViewMode(viewMode === "list" ? "map" : "list")}
                    className="lg:hidden fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-brand text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2 font-bold animate-in fade-in zoom-in duration-300"
                >
                    {viewMode === "list" ? (
                        <>
                            <MapIcon size={20} />
                            <span>مشاهده روی نقشه</span>
                        </>
                    ) : (
                        <>
                            <LayoutGrid size={20} />
                            <span>مشاهده آگهی‌ها</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}

