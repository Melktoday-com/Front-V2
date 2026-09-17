"use client";

import { PageHeader } from "@/components/PageHeader";
import { useCity } from "@/components/providers/CityProvider";
import { EmptyState, ErrorState } from "@/components/ui/StatusStates";
import { TemporaryRentCard } from "@/components/ui/TemporaryRentCard";
import { useTemporaryRentAds } from "@/hooks/useTemporaryRent";
import { cn, toPersianDigits } from "@/lib/utils";
import { Calendar, Users } from "lucide-react";
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
    const [guestCount, setGuestCount] = useState<number | null>(null);

    const { data, isLoading, error, refetch } = useTemporaryRentAds({
        limit: 24,
        status: "PUBLISHED",
        cityId: effectiveCityId,
    }, { enabled: !!effectiveCityId });

    const handleCitySelect = (city: { id: string; name: string }) => {
        setSelectedCity(city);
        const params = new URLSearchParams(searchParams.toString());
        params.set("cityId", city.id);
        params.set("cityName", city.name);
        router.push(`${window.location.pathname}?${params.toString()}`);
    };

    const filteredItems = (data?.items || []).filter((item) => {
        if (guestCount && item.maxGuests && item.maxGuests < guestCount) {
            return false;
        }
        if (search && !item.title.toLowerCase().includes(search.toLowerCase())) {
            return false;
        }
        return true;
    });

    return (
        <div className="min-h-screen bg-white pb-32">
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

                {/* Airbnb-style Filter Pill Bar */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
                    {/* Guest Filter Buttons */}
                    <div className="flex items-center gap-1.5 bg-white p-1 rounded-full border border-gray-200 shadow-2xs">
                        <Users className="w-3.5 h-3.5 text-orange-500 mr-2" />
                        <span className="text-text-light font-bold text-[11px] ml-1">تعداد مسافر:</span>
                        {[
                            { count: null, label: "همه" },
                            { count: 1, label: "۱+" },
                            { count: 2, label: "۲+" },
                            { count: 4, label: "۴+" },
                            { count: 6, label: "۶+" },
                        ].map((opt) => {
                            const isSelected = guestCount === opt.count;
                            return (
                                <button
                                    key={opt.label}
                                    onClick={() => setGuestCount(opt.count)}
                                    className={cn(
                                        "px-2.5 py-1 rounded-full font-bold text-xs transition-colors",
                                        isSelected
                                            ? "bg-brand text-white shadow-xs"
                                            : "text-text-light hover:bg-gray-100"
                                    )}
                                >
                                    {opt.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Quick Jalali Date Tag info */}
                    <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full border border-gray-200 text-text-light text-[11px] font-bold shadow-2xs">
                        <Calendar className="w-3.5 h-3.5 text-primary" />
                        <span>تحویل کلید: آنی و هماهنگ با میزبان</span>
                    </div>
                </div>
            </div>

            {/* Content Body */}
            <div className="p-4 sm:p-6 lg:p-10">
                {/* Count and status */}
                <div className="flex items-center justify-between mb-6 text-xs text-text-light font-bold">
                    <span>
                        {isLoading
                            ? "در حال بارگذاری اقامتگاه‌ها..."
                            : `${toPersianDigits(filteredItems.length)} اقامتگاه در ${effectiveCityName}`}
                    </span>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="aspect-[4/3] bg-gray-100 animate-pulse rounded-2xl" />
                        ))}
                    </div>
                ) : error ? (
                    <ErrorState
                        message="خطا در دریافت لیست اقامتگاه‌ها"
                        onRetry={() => refetch()}
                    />
                ) : filteredItems.length === 0 ? (
                    <div className="py-20 text-center">
                        <EmptyState
                            message="اقامتگاهی با این مشخصات یافت نشد"
                            description="می‌توانید فیلتر تعداد مسافران را ریست کنید یا شهر مورد نظر را تغییر دهید."
                        />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {filteredItems.map((ad) => (
                            <TemporaryRentCard
                                key={ad.id}
                                id={ad.id}
                                title={ad.title}
                                nightlyPrice={ad.pricing.nightlyPrice}
                                location={ad.cityName || effectiveCityName}
                                mediaIds={ad.mediaIds}
                                rating={4.9}
                                maxGuests={ad.maxGuests}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
