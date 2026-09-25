"use client";

import CategoryFilter from "@/components/CategoryFilter";
import { PageHeader } from "@/components/PageHeader";
import { useCity } from "@/components/providers/CityProvider";
import { PropertyCard } from "@/components/ui/PropertyCard";
import { EmptyState } from "@/components/ui/StatusStates";
import { useAds, useCategories } from "@/hooks/useAds";
import { useGeoHierarchy } from "@/hooks/useGeoHierarchy";
import { cn, formatPrice } from "@/lib/utils";
import { AdSummary } from "@/types/api/ads.types";
import { LayoutGrid, Map as MapIcon } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

const Map = dynamic(() => import("@/components/ui/Map"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full min-h-[400px] bg-soft-bg animate-pulse rounded-2xl flex items-center justify-center text-text-light font-bold text-sm">
            در حال بارگذاری نقشه...
        </div>
    ),
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

    const { data: categoriesData, isLoading: isCategoriesLoading } = useCategories();
    const { data: hierarchy } = useGeoHierarchy();

    // Find the current city's coordinates
    const currentCityCoords = useMemo(() => {
        if (selectedCity.centerPoint) {
            const cp = selectedCity.centerPoint;
            return {
                latitude: cp.latitude ?? cp.lat,
                longitude: cp.longitude ?? cp.lng,
            };
        }

        if (!hierarchy || !effectiveCityId) return null;

        for (const province of hierarchy) {
            const city = province.cities.find((c) => c.id === effectiveCityId);
            if (city?.centerPoint) {
                const cp = city.centerPoint;
                return {
                    latitude: cp.latitude ?? cp.lat,
                    longitude: cp.longitude ?? cp.lng,
                };
            }
        }
        return null;
    }, [hierarchy, effectiveCityId, selectedCity.centerPoint]);

    // Map coordinates for Leaflet
    const adsForMap = useMemo(() => {
        if (!data?.items) return [];
        return data.items
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
    }, [data?.items]);

    const handleCitySelect = (city: {
        id: string;
        name: string;
        centerPoint?: { latitude: number; longitude: number };
    }) => {
        setSelectedCity(city);
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
                        <span>
                            {isLoading
                                ? "در حال جستجو..."
                                : `${data?.total ?? 0} آگهی یافت شد`}
                        </span>
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
                        ) : data?.items?.length === 0 ? (
                            <div className="col-span-full py-16 text-center">
                                <EmptyState
                                    message="ملکی با این مشخصات پیدا نشد"
                                    description="فیلترهای انتخابی یا عبارت جستجو را تغییر دهید تا نتایج بیشتری مشاهده کنید."
                                />
                            </div>
                        ) : (
                            (data?.items || []).map((ad: AdSummary) => {
                                const pricing = getPricingDisplay(ad);
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
                                        category={ad.categoryPath.subcategoryKey}
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
                        center={
                            currentCityCoords &&
                            typeof currentCityCoords.latitude === "number" &&
                            typeof currentCityCoords.longitude === "number"
                                ? [currentCityCoords.latitude, currentCityCoords.longitude]
                                : adsForMap.length > 0 &&
                                  typeof adsForMap[0].location.latitude === "number" &&
                                  typeof adsForMap[0].location.longitude === "number"
                                ? [adsForMap[0].location.latitude, adsForMap[0].location.longitude]
                                : [35.6892, 51.389]
                        }
                        zoom={12}
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
