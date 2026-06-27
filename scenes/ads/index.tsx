"use client";

import CategoryFilter from "@/components/CategoryFilter";
import { PageHeader } from "@/components/PageHeader";
import { useCity } from "@/components/providers/CityProvider";
import { PropertyCard } from "@/components/ui/PropertyCard";
import { useAds, useCategories } from "@/hooks/useAds";
import { AdSummary } from "@/types/api/ads.types";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function AdsScene() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { selectedCity, setSelectedCity } = useCity();

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

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* ... existing properties list ... */}
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
        </div>
    );
}
