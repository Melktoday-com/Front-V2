"use client";

import { PageHeader } from "@/components/PageHeader";
import { useCity } from "@/components/providers/CityProvider";
import { EmptyState, ErrorState } from "@/components/ui/StatusStates";
import { TemporaryRentCard } from "@/components/ui/TemporaryRentCard";
import { useDebounce } from "@/hooks/useDebounce";
import { useSearchTemporaryRentals } from "@/hooks/useSearch";
import { cn, toPersianDigits } from "@/lib/utils";
import { Calendar, Users } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

export default function TemporaryRentScene() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { selectedCity, setSelectedCity } = useCity();

    const urlSearch = searchParams.get("search") || "";
    const effectiveCityId = searchParams.get("cityId") || selectedCity.id || undefined;
    const effectiveCityName = searchParams.get("cityName") || selectedCity.name || "همه شهرها";

    const [search, setSearch] = useState(urlSearch);
    const [guestCount, setGuestCount] = useState<number | null>(null);

    const debouncedSearch = useDebounce(search, 250);

    const { data, isLoading, error, refetch } = useSearchTemporaryRentals({
        query: debouncedSearch || undefined,
        cityId: effectiveCityId,
        limit: 24,
    });

    const handleCitySelect = (city: { id: string; name: string }) => {
        setSelectedCity(city);
        const params = new URLSearchParams(searchParams.toString());
        params.set("cityId", city.id);
        params.set("cityName", city.name);
        router.push(`${window.location.pathname}?${params.toString()}`);
    };

    const hits = useMemo(() => data?.hits || [], [data]);

    const filteredItems = useMemo(() => {
        if (!guestCount) return hits;
        return hits.filter((item) => {
            const guests = item.attributes?.number?.max_guests || item.attributes?.number?.capacity;
            return !guests || guests >= guestCount;
        });
    }, [hits, guestCount]);

    return (
        <div className="min-h-screen bg-surface pb-28 lg:pb-10">
            {/* Warm Header Section (Airbnb vibe) */}
            <div className="bg-gradient-to-b from-orange-50/50 to-transparent p-4 sm:p-6 lg:px-10 lg:pt-8 border-b border-orange-100/50 space-y-5">
                <PageHeader
                    title="اجاره روزانه، ویلا و اقامتگاه بوم‌گردی"
                    searchPlaceholder="جستجو در میان ویلاها، سوئیت‌ها و اقامتگاه‌ها..."
                    searchValue={search}
                    onSearchChange={setSearch}
                    cityName={effectiveCityName}
                    cityId={effectiveCityId}
                    onCitySelect={handleCitySelect}
                />
            </div>

            {/* Content Body */}
            <div className="p-4 sm:p-6 lg:p-10">
                {/* Count and status (hidden when 0 per Item 59) */}
                {isLoading ? (
                    <div className="mb-6 text-xs text-text-light font-bold">
                        <span>در حال بارگذاری اقامتگاه‌ها...</span>
                    </div>
                ) : filteredItems.length > 0 ? (
                    <div className="flex items-center justify-between mb-6 text-xs text-text-light font-bold">
                        <span>
                            {`${toPersianDigits(filteredItems.length)} اقامتگاه در ${effectiveCityName}`}
                        </span>
                    </div>
                ) : null}

                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="aspect-[4/3] bg-surface-secondary animate-pulse rounded-2xl" />
                        ))}
                    </div>
                ) : error ? (
                    <ErrorState
                        message="خطا در دریافت لیست اقامتگاه‌ها"
                        onRetry={() => refetch()}
                    />
                ) : filteredItems.length === 0 ? (
                    <div className="py-8 sm:py-12 text-center">
                        <EmptyState
                            message="اقامتگاهی در این شهر یافت نشد"
                            description="می‌توانید شهر مورد نظر را تغییر دهید یا واژه جستجوی دیگری را امتحان کنید."
                        />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {filteredItems.map((ad) => (
                            <TemporaryRentCard
                                key={ad.id}
                                id={ad.id}
                                title={ad.title}
                                nightlyPrice={ad.pricing?.number?.nightlyPrice || ad.pricing?.number?.price || 0}
                                location={ad.geo?.cityName || effectiveCityName}
                                mediaIds={ad.mediaIds}
                                maxGuests={ad.attributes?.number?.max_guests || ad.attributes?.number?.capacity}
                                rooms={ad.attributes?.number?.rooms_count || ad.attributes?.number?.rooms}
                                category={ad.taxonomy?.subcategoryName || ad.taxonomy?.categoryName}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
