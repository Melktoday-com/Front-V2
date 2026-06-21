"use client";

import { CitySelector } from "@/components/CitySelector";
import { useCity } from "@/components/providers/CityProvider";
import { PropertyCard } from "@/components/ui/PropertyCard";
import { useTemporaryRentAds } from "@/hooks/useTemporaryRent";
import { ChevronDown, MapPin, Search } from "lucide-react";
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
    const [isSelectorOpen, setIsSelectorOpen] = useState(false);

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
        setIsSelectorOpen(false);
    };

    return (
        <div className="min-h-screen bg-white pb-24 lg:pb-10">
            <div className="p-6 lg:p-10 space-y-8">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="space-y-4 flex-1">
                        <h1 className="text-brand text-2xl lg:text-3xl font-black">اجاره روزانه و کوتاه مدت</h1>
                        <div className="relative max-w-2xl">
                            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="جستجو در اجاره روزانه..."
                                className="w-full bg-soft-bg border border-soft-border rounded-[20px] py-4 pr-12 pl-4 text-sm font-bold text-brand focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div
                        onClick={() => setIsSelectorOpen(true)}
                        className="flex items-center gap-2 bg-soft-bg px-5 py-3 rounded-[20px] border border-soft-border group cursor-pointer hover:border-primary/50 transition-all shadow-sm shrink-0"
                    >
                        <MapPin className="w-5 h-5 text-primary shrink-0" />
                        <div className="flex items-center gap-2">
                            <span className="text-brand font-black text-sm">
                                {effectiveCityName}
                            </span>
                            <ChevronDown className="w-4 h-4 text-secondary group-hover:text-primary transition-colors" />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
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

            <CitySelector
                isOpen={isSelectorOpen}
                onClose={() => setIsSelectorOpen(false)}
                onSelect={handleCitySelect}
            />
        </div>
    );
}
