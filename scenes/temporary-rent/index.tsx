"use client";

import { PageHeader } from "@/components/PageHeader";
import { useCity } from "@/components/providers/CityProvider";
import { EmptyState, ErrorState } from "@/components/ui/StatusStates";
import { TemporaryRentCard } from "@/components/ui/TemporaryRentCard";
import { useDebounce } from "@/hooks/useDebounce";
import { useSearchTemporaryRentals } from "@/hooks/useSearch";
import { useTemporaryRentAds } from "@/hooks/useTemporaryRent";
import { cn, toPersianDigits } from "@/lib/utils";
import { Calendar, Users } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

function getTemporaryRentItemPrice(pricing: any): number {
    if (!pricing) return 0;
    if (typeof pricing.nightlyPrice === "number") return pricing.nightlyPrice;
    if (typeof pricing.price === "number") return pricing.price;
    if (pricing.pricing?.nightlyPrice) return Number(pricing.pricing.nightlyPrice);
    if (pricing.pricing?.midweekNightlyPrice) return Number(pricing.pricing.midweekNightlyPrice);
    if (pricing.pricing?.weekendNightlyPrice) return Number(pricing.pricing.weekendNightlyPrice);
    if (pricing.pricing?.eventBasePrice) return Number(pricing.pricing.eventBasePrice);
    if (pricing.number?.nightlyPrice) return Number(pricing.number.nightlyPrice);
    if (pricing.number?.price) return Number(pricing.number.price);
    return 0;
}

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

    const {
        data: searchData,
        isLoading: isSearchLoading,
        error: searchError,
        refetch: refetchSearch,
    } = useSearchTemporaryRentals({
        query: debouncedSearch || undefined,
        cityId: effectiveCityId,
        limit: 24,
    });

    const isSearchEmpty = Boolean(!debouncedSearch && (!searchData?.hits || searchData.hits.length === 0));

    // Fallback directly to published temporary rentals database API if search engine has no index yet
    const {
        data: dbData,
        isLoading: isDbLoading,
        error: dbError,
        refetch: refetchDb,
    } = useTemporaryRentAds(
        {
            cityId: effectiveCityId,
            limit: 24,
        },
        {
            enabled: isSearchEmpty,
        }
    );

    const handleCitySelect = (city: { id: string; name: string }) => {
        setSelectedCity(city);
        const params = new URLSearchParams(searchParams.toString());
        params.set("cityId", city.id);
        params.set("cityName", city.name);
        router.push(`${window.location.pathname}?${params.toString()}`);
    };

    const unifiedItems = useMemo(() => {
        if (searchData?.hits && searchData.hits.length > 0) {
            return searchData.hits.map((ad: any) => ({
                id: ad.id,
                title: ad.title,
                nightlyPrice: getTemporaryRentItemPrice(ad.pricing),
                location: ad.geo?.cityName || effectiveCityName,
                mediaIds: ad.mediaIds,
                maxGuests: Number(ad.attributes?.number?.max_guests || ad.attributes?.number?.capacity || 1),
                rooms: Number(ad.attributes?.number?.rooms_count || ad.attributes?.number?.rooms || 0),
                category: ad.taxonomy?.subcategoryName || ad.taxonomy?.categoryName,
                isUrgent: Boolean(ad.isUrgent),
                isLadder: Boolean(ad.isLadder),
            }));
        }

        if (dbData?.items && dbData.items.length > 0) {
            return dbData.items.map((ad: any) => ({
                id: ad.id,
                title: ad.title,
                nightlyPrice: getTemporaryRentItemPrice(ad.pricing),
                location: ad.location?.city?.name || ad.cityName || effectiveCityName,
                mediaIds: ad.mediaIds,
                maxGuests: Number(ad.attributes?.max_guests || 1),
                rooms: Number(ad.attributes?.rooms_count || ad.attributes?.rooms || 0),
                category: ad.subcategoryTitle || ad.categoryTitle,
                isUrgent: Boolean(ad.isUrgent),
                isLadder: Boolean(ad.isLadder),
            }));
        }

        return [];
    }, [searchData, dbData, effectiveCityName]);

    const filteredItems = useMemo(() => {
        if (!guestCount) return unifiedItems;
        return unifiedItems.filter((item) => {
            return !item.maxGuests || item.maxGuests >= guestCount;
        });
    }, [unifiedItems, guestCount]);

    const isLoading = isSearchLoading || (isSearchEmpty && isDbLoading);
    const error = searchError || (isSearchEmpty && dbError);
    const handleRetry = () => {
        refetchSearch();
        if (isSearchEmpty) refetchDb();
    };

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
                        onRetry={handleRetry}
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
                                nightlyPrice={ad.nightlyPrice}
                                location={ad.location}
                                mediaIds={ad.mediaIds}
                                maxGuests={ad.maxGuests}
                                rooms={ad.rooms}
                                category={ad.category}
                                isUrgent={ad.isUrgent}
                                isLadder={ad.isLadder}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
