"use client";

import CategoryFilter from "@/components/CategoryFilter";
import { PageHeader } from "@/components/PageHeader";
import { useCity } from "@/components/providers/CityProvider";
import { PropertyCard } from "@/components/ui/PropertyCard";
import { EmptyState } from "@/components/ui/StatusStates";
import { useAds, useCategories } from "@/hooks/useAds";
import { useCategoryLookup } from "@/hooks/useCategoryLookup";
import { useGeoHierarchy } from "@/hooks/useGeoHierarchy";
import { cn, formatPrice } from "@/lib/utils";
import { AdSummary } from "@/types/api/ads.types";
import { LayoutGrid, Map as MapIcon, MapPin } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { geoService } from "@/services/geo.service";
import { ZoneSummary } from "@/types/api/geo.types";

const Map = dynamic(() => import("@/components/ui/Map"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full min-h-[400px] bg-soft-bg animate-pulse rounded-2xl flex items-center justify-center text-text-light font-bold text-sm">
            در حال بارگذاری نقشه...
        </div>
    ),
});

// Helper to check if a point [lat, lng] is inside a polygon [[lat, lng], ...] using ray-casting algorithm
function isPointInPolygon(lat: number, lng: number, polygon: [number, number][]): boolean {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i][0];
        const yi = polygon[i][1];
        const xj = polygon[j][0];
        const yj = polygon[j][1];

        const intersect = ((yi > lng) !== (yj > lng)) &&
            (lat < ((xj - xi) * (lng - yi)) / (yj - yi) + xi);
        if (intersect) {
            inside = !inside;
        }
    }
    return inside;
}

function adMatchesZone(ad: AdSummary, zone: ZoneSummary): boolean {
    const cleanZoneName = zone.name.replace(/^(بلوار|میدان|خیابان|شهرک)\s+/, "").trim();
    if (ad.title.includes(zone.name) || (cleanZoneName.length > 2 && ad.title.includes(cleanZoneName))) {
        return true;
    }
    if (ad.location && typeof ad.location.latitude === "number" && typeof ad.location.longitude === "number") {
        const coords = zone.boundaries?.coordinates;
        if (!coords || !Array.isArray(coords) || coords.length === 0) return false;

        if (zone.boundaries?.type === "Polygon" && Array.isArray(coords[0])) {
            const polygon: [number, number][] = (coords[0] as number[][]).map(([lng, lat]) => [lat, lng]);
            if (isPointInPolygon(ad.location.latitude, ad.location.longitude, polygon)) {
                return true;
            }
        } else if (zone.boundaries?.type === "MultiPolygon" && Array.isArray(coords[0])) {
            for (const poly of coords as number[][][][]) {
                if (Array.isArray(poly[0])) {
                    const polygon: [number, number][] = poly[0].map(([lng, lat]) => [lat, lng]);
                    if (isPointInPolygon(ad.location.latitude, ad.location.longitude, polygon)) {
                        return true;
                    }
                }
            }
        }
    }
    return false;
}

interface AdsSceneProps {
    initialViewMode?: "list" | "map";
}

export default function AdsScene({ initialViewMode = "list" }: AdsSceneProps) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { selectedCity, setSelectedCity } = useCity();
    const [viewMode, setViewMode] = useState<"list" | "map">(initialViewMode);
    const [selectedZone, setSelectedZone] = useState<ZoneSummary | null>(null);

    const urlSearch = searchParams.get("search") || "";
    const effectiveCityId = searchParams.get("cityId") || selectedCity.id || undefined;
    const effectiveCityName = searchParams.get("cityName") || selectedCity.name || "همه شهرها";
    const urlCategory = searchParams.get("categoryKey") || "";
    const urlDealType = searchParams.get("businessModelKey") || "";

    const [search, setSearch] = useState(urlSearch);
    const [selectedCategory, setSelectedCategory] = useState(urlCategory);

    const { data, isLoading, refetch } = useAds({
        limit: 30,
        status: "PUBLISHED",
        search: search || undefined,
        cityId: effectiveCityId,
        categoryKey: selectedCategory || undefined,
        businessModelKey: urlDealType || undefined,
    }, { enabled: !!effectiveCityId });

    // Fetch neighborhoods for the active city
    const { data: zonesData } = useQuery({
        queryKey: ["geo-zones-city", effectiveCityId],
        queryFn: async () => {
            if (!effectiveCityId) return [];
            const res = await geoService.listZones({ parentId: effectiveCityId, type: "NEIGHBORHOOD", limit: 50 });
            return res.zones || [];
        },
        enabled: !!effectiveCityId,
    });
    const neighborhoods = useMemo(() => zonesData || [], [zonesData]);

    const { data: categoriesData, isLoading: isCategoriesLoading } = useCategories();
    const { getSubcategoryName, getCategoryName } = useCategoryLookup();
    const { data: hierarchy } = useGeoHierarchy();

    // Find the current city's coordinates
    const currentCityCoords = useMemo(() => {
        // 1. Look up in fresh hierarchy first if effectiveCityId or city name is present
        if (hierarchy) {
            const targetId = effectiveCityId || selectedCity.id;
            const targetName = effectiveCityName !== "همه شهرها" ? effectiveCityName : selectedCity.name;

            for (const province of hierarchy) {
                const city = province.cities.find(
                    (c) => (targetId && c.id === targetId) || (targetName && c.name === targetName)
                );
                if (city?.centerPoint) {
                    return {
                        latitude: city.centerPoint.latitude,
                        longitude: city.centerPoint.longitude,
                    };
                }
            }
        }

        // 2. Fallback to selectedCity.centerPoint
        if (selectedCity.centerPoint) {
            return {
                latitude: selectedCity.centerPoint.latitude,
                longitude: selectedCity.centerPoint.longitude,
            };
        }

        return null;
    }, [hierarchy, effectiveCityId, effectiveCityName, selectedCity]);

    // Filter ads by selected neighborhood/zone if active
    const displayedAds = useMemo(() => {
        const items = data?.items || [];
        if (!selectedZone) return items;
        return items.filter((ad) => adMatchesZone(ad, selectedZone));
    }, [data?.items, selectedZone]);

    // Map coordinates for Leaflet
    const adsForMap = useMemo(() => {
        return displayedAds
            .filter(
                (ad): ad is AdSummary & { location: NonNullable<AdSummary['location']> } =>
                    Boolean(
                        ad.location &&
                        (typeof ad.location.latitude === "number" ||
                            typeof ad.location.lat === "number") &&
                        (typeof ad.location.longitude === "number" ||
                            typeof ad.location.lng === "number")
                    )
            )
            .map((ad) => ({
                ...ad,
                location: {
                    ...ad.location,
                    latitude: (ad.location.latitude ?? ad.location.lat) as number,
                    longitude: (ad.location.longitude ?? ad.location.lng) as number,
                },
            }));
    }, [displayedAds]);

    const handleCitySelect = (city: {
        id: string;
        name: string;
        centerPoint?: { latitude: number; longitude: number };
    }) => {
        setSelectedCity(city);
        setSelectedZone(null);
        const params = new URLSearchParams(searchParams.toString());
        params.set("cityId", city.id);
        params.set("cityName", city.name);
        router.push(`${window.location.pathname}?${params.toString()}`);
    };

    const handleCategorySelect = (catKey: string) => {
        setSelectedCategory(catKey);
        const params = new URLSearchParams(searchParams.toString());
        if (catKey) {
            params.set("categoryKey", catKey);
        } else {
            params.delete("categoryKey");
        }
        router.push(`${window.location.pathname}?${params.toString()}`);
    };

    // Helper for Zillow-style pricing
    const getPricingDisplay = (ad: AdSummary) => {
        const pricing = ad.pricing;
        if (!pricing || Object.keys(pricing).length === 0) {
            return { price: "توافقی", unit: undefined };
        }
        if (pricing.mortgagePrice !== undefined && pricing.rentPrice !== undefined) {
            return {
                price: `رهن ${formatPrice(pricing.mortgagePrice, "")} - اجاره ${formatPrice(pricing.rentPrice, "")}`,
                unit: "تومان",
            };
        }
        if (pricing.nightlyPrice !== undefined) {
            return {
                price: pricing.nightlyPrice,
                unit: "/شب",
            };
        }
        const firstValue = Object.values(pricing)[0];
        return {
            price: firstValue ?? "توافقی",
            unit: undefined,
        };
    };

    // Calculate map center and zoom
    const mapCenter: [number, number] = useMemo(() => {
        if (selectedZone?.centerPoint && typeof selectedZone.centerPoint.latitude === "number" && typeof selectedZone.centerPoint.longitude === "number") {
            return [selectedZone.centerPoint.latitude, selectedZone.centerPoint.longitude];
        }
        if (currentCityCoords && typeof currentCityCoords.latitude === "number" && typeof currentCityCoords.longitude === "number") {
            return [currentCityCoords.latitude, currentCityCoords.longitude];
        }
        if (adsForMap.length > 0 && typeof adsForMap[0].location.latitude === "number" && typeof adsForMap[0].location.longitude === "number") {
            return [adsForMap[0].location.latitude, adsForMap[0].location.longitude];
        }
        return [35.6892, 51.389];
    }, [selectedZone, currentCityCoords, adsForMap]);

    const mapZoom = selectedZone ? 14 : 12;

    return (
        <div className="h-screen bg-white flex flex-col overflow-hidden">
            {/* Header & Filter Section */}
            <div className="flex-none p-4 sm:p-6 lg:px-10 lg:pt-8 lg:pb-2 space-y-4 border-b border-gray-100">
                <PageHeader
                    title="جستجوی املاک"
                    searchPlaceholder="نام منطقه، محله یا نوع ملک..."
                    searchValue={search}
                    onSearchChange={setSearch}
                    cityName={effectiveCityName}
                    cityId={effectiveCityId}
                    onCitySelect={handleCitySelect}
                />

                {/* Category Slider Filter */}
                <CategoryFilter
                    categories={categoriesData || []}
                    isLoading={isCategoriesLoading}
                    selectedCategoryKey={selectedCategory}
                    onSelectCategory={handleCategorySelect}
                />

                {/* Neighborhood Horizontal Pills Filter */}
                {neighborhoods.length > 0 && (
                    <div
                        data-testid="neighborhood-pills"
                        className="relative z-10 flex items-center gap-2 overflow-x-auto py-1 no-scrollbar border-t border-gray-50 pt-2.5"
                    >
                        <div className="flex items-center gap-1.5 text-xs text-text-light font-medium shrink-0 pl-1">
                            <MapPin className="w-3.5 h-3.5 text-primary" />
                            <span>نواحی و محله‌ها:</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setSelectedZone(null)}
                            className={cn(
                                "px-3 py-1 rounded-full text-xs font-medium transition-all shrink-0 border",
                                selectedZone === null
                                    ? "bg-primary text-white border-primary shadow-xs"
                                    : "bg-soft-bg/80 text-secondary hover:bg-soft-bg border-transparent"
                            )}
                        >
                            همه محله‌ها
                        </button>
                        {neighborhoods.map((zone) => {
                            const isSelected = selectedZone?.id === zone.id;
                            return (
                                <button
                                    key={zone.id}
                                    type="button"
                                    onClick={() => setSelectedZone(isSelected ? null : zone)}
                                    className={cn(
                                        "px-3 py-1 rounded-full text-xs font-medium transition-all shrink-0 border flex items-center gap-1.5",
                                        isSelected
                                            ? "bg-primary text-white border-primary shadow-xs"
                                            : "bg-soft-bg/80 text-secondary hover:bg-soft-bg border-transparent"
                                    )}
                                >
                                    <span>{zone.name}</span>
                                    {isSelected && <span className="text-[10px] opacity-90 mr-0.5">✕</span>}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>


            {/* Main Split View: Left Map, Right Cards (RTL) */}
            <div className="flex-1 relative flex flex-col lg:flex-row gap-4 p-4 lg:p-6 lg:pt-4 overflow-hidden">
                {/* List Section - 1 column on mobile, 2 columns on wide screens */}
                <div
                    className={cn(
                        "flex-1 overflow-y-auto custom-scrollbar transition-all duration-300 px-1",
                        viewMode === "map" ? "hidden lg:block" : "block"
                    )}
                >
                    {/* Count summary */}
                    <div className="flex items-center justify-between mb-3 px-1 text-xs text-text-light font-medium">
                        <div className="flex items-center gap-2">
                            <span>
                                {isLoading
                                    ? "در حال جستجو..."
                                    : `${displayedAds.length} آگهی یافت شد`}
                            </span>
                            {selectedZone && (
                                <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-semibold">
                                    <span>محله: {selectedZone.name}</span>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedZone(null)}
                                        className="hover:opacity-75 text-primary font-bold text-xs"
                                        title="حذف فیلتر محله"
                                    >
                                        ✕
                                    </button>
                                </span>
                            )}
                        </div>
                        <span>شهر: {effectiveCityName}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4 pb-32 lg:pb-6">
                        {isLoading ? (
                            Array.from({ length: 6 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="h-72 bg-soft-bg animate-pulse rounded-2xl"
                                />
                            ))
                        ) : displayedAds.length === 0 ? (
                            <div className="col-span-full py-16 text-center">
                                <EmptyState
                                    message={
                                        selectedZone
                                            ? `ملکی در محله «${selectedZone.name}» پیدا نشد`
                                            : "ملکی با این مشخصات پیدا نشد"
                                    }
                                    description={
                                        selectedZone
                                            ? "می‌توانید فیلتر محله را حذف کرده تا تمام آگهی‌های شهر را مشاهده فرمایید."
                                            : "فیلترهای انتخابی یا عبارت جستجو را تغییر دهید تا نتایج بیشتری مشاهده کنید."
                                    }
                                />
                                {selectedZone && (
                                    <button
                                        type="button"
                                        onClick={() => setSelectedZone(null)}
                                        className="mt-4 px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow-sm hover:bg-primary/90 transition-colors"
                                    >
                                        مشاهده همه آگهی‌های {effectiveCityName}
                                    </button>
                                )}
                            </div>
                        ) : (
                            displayedAds.map((ad: AdSummary) => {
                                const pricing = getPricingDisplay(ad);
                                const catKey = ad.categoryPath?.categoryKey;
                                const subKey = ad.categoryPath?.subcategoryKey;
                                const subcategoryDisplay =
                                    ad.subcategoryTitle ||
                                    ad.categoryPath?.subcategoryTitle ||
                                    getSubcategoryName(subKey, catKey) ||
                                    ad.categoryTitle ||
                                    ad.categoryPath?.categoryTitle ||
                                    getCategoryName(catKey) ||
                                    subKey;

                                return (
                                    <PropertyCard
                                        key={ad.adId}
                                        adId={ad.adId}
                                        title={ad.title}
                                        price={pricing.price}
                                        unit={pricing.unit}
                                        rating={4.8}
                                        location={effectiveCityName || ad.cityId}
                                        image={
                                            ad.mediaIds && ad.mediaIds.length > 0
                                                ? `${process.env.NEXT_PUBLIC_API_URL}/media/${ad.mediaIds[0]}`
                                                : "/property-placeholder.svg"
                                        }
                                        category={subcategoryDisplay}
                                    />
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Map Section - Desktop right / Mobile full-screen when toggled */}
                <div
                    className={cn(
                        "relative flex-1 lg:flex-[1.4] transition-all duration-300 h-full overflow-hidden rounded-2xl border border-gray-100 shadow-xs",
                        viewMode === "list" ? "hidden lg:block" : "block"
                    )}
                >
                    <Map
                        ads={adsForMap}
                        zones={neighborhoods}
                        selectedZoneId={selectedZone?.id}
                        onZoneSelect={(zone) => setSelectedZone((prev) => (prev?.id === zone.id ? null : zone))}
                        center={mapCenter}
                        zoom={mapZoom}
                    />
                </div>

                {/* Mobile Floating Toggle Button - elevated with clearance above mobile nav */}
                <button
                    onClick={() => setViewMode(viewMode === "list" ? "map" : "list")}
                    aria-label="تغییر حالت نمایش نقشه یا لیست"
                    className="lg:hidden fixed bottom-24 left-1/2 -translate-x-1/2 z-40 bg-brand text-white px-5 py-2.5 rounded-full shadow-xl flex items-center gap-2 font-bold text-sm active:scale-95 transition-transform border border-white/20"
                >
                    {viewMode === "list" ? (
                        <>
                            <MapIcon className="w-4 h-4 text-primary" />
                            <span>مشاهده روی نقشه</span>
                        </>
                    ) : (
                        <>
                            <LayoutGrid className="w-4 h-4 text-primary" />
                            <span>مشاهده آگهی‌ها</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
