"use client";

import { PageHeader } from "@/components/PageHeader";
import { useCity } from "@/components/providers/CityProvider";
import { PropertyCard } from "@/components/ui/PropertyCard";
import { useTemporaryRentAds } from "@/hooks/useTemporaryRent";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function TemporaryRentScene() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { selectedCity, setSelectedCity } = useCity();

    const urlSearch = searchParams.get("search") || "";
    const effectiveCityId = searchParams.get("cityId") || selectedCity.id || undefined;
    const effectiveCityName = searchParams.get("cityName") || selectedCity.name || "همه شهرها";

    const [search, setSearch] = useState(urlSearch);

    const { data, isLoading } = useTemporaryRentAds({
        limit: 12,
        status: "PUBLISHED",
        cityId: effectiveCityId
    }, { enabled: !!effectiveCityId });

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
                    title="اجاره روزانه و کوتاه مدت"
                    searchPlaceholder="جستجو در اجاره روزانه..."
                    searchValue={search}
                    onSearchChange={setSearch}
                    cityName={effectiveCityName}
                    cityId={effectiveCityId}
                    onCitySelect={handleCitySelect}
                />

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 2xl:grid-cols-6 gap-x-4 gap-y-6 items-stretch">
                    {isLoading ? (
                        Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="aspect-square bg-soft-bg animate-pulse rounded-[25px]" />
                        ))
                    ) : data?.items?.length === 0 ? (
                        <div className="col-span-full py-20 text-center space-y-4">
                            <div className="text-secondary-400 font-bold">موردی برای اجاره روزانه پیدا نشد</div>
                        </div>
                    ) : (
                        (data?.items || []).map((ad) => (
                            <PropertyCard
                                key={ad.id}
                                adId={ad.id}
                                href={`/temporary-rent/${ad.id}`}
                                title={ad.title}
                                price={ad.pricing.nightlyPrice.toLocaleString() || "0"}
                                rating={4.9}
                                location={effectiveCityName}
                                image={ad.mediaIds && ad.mediaIds.length > 0
                                    ? `${process.env.NEXT_PUBLIC_API_URL}/media/${ad.mediaIds[0]}`
                                    : "/assets/images/property-placeholder.png"
                                }
                                category="اجاره روزانه"
                            />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
