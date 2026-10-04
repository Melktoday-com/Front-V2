"use client";

import { AgentAvatar } from "@/components/AgentAvatar";
import { CategoryDirectory } from "@/components/CategoryDirectory";
import { useCity } from "@/components/providers/CityProvider";
import { SearchHeader } from "@/components/SearchHeader";
import { SectionHeader } from "@/components/SectionHeader";
import { PropertyCard } from "@/components/ui/PropertyCard";
import { Slider } from "@/components/ui/Slider";
import { EmptyState, ErrorState } from "@/components/ui/StatusStates";
import { useAds, useCategories } from "@/hooks/useAds";
import { useAgencies } from "@/hooks/useAgencies";
import { useCategoryLookup } from "@/hooks/useCategoryLookup";
import { useFavorites, useToggleSaveAd, useToggleSaveTemporaryRent } from "@/hooks/useFavorites";
import { useTemporaryRentAds } from "@/hooks/useTemporaryRent";
import { TemporaryRentAdSummary } from "@/services/temporary-rent.service";
import { AdSummary } from "@/types/api/ads.types";
import { AgencySummary } from "@/types/api/agency.types";
import { getMediaUrl, getMediaPosterUrl } from "@/lib/utils";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export const HomeScene = () => {
    const { selectedCity, setSelectedCity } = useCity();
    const { getSubcategoryName, getCategoryName } = useCategoryLookup();

    // Saved state for heart buttons
    const { isAdSaved, isTemporaryRentSaved } = useFavorites();
    const toggleSaveAdMutation = useToggleSaveAd();
    const toggleSaveTempMutation = useToggleSaveTemporaryRent();

    const [isInitialModalOpen, setIsInitialModalOpen] = useState(false);

    // Initial load from localStorage logic moved to CityProvider
    useEffect(() => {
        const saved = localStorage.getItem('selectedCity');
        if (!saved) {
            setIsInitialModalOpen(true);
        }
    }, []);

    // Use real data from hooks
    const { data: featuredData, isLoading: isFeaturedLoading, error: featuredError, refetch: refetchFeatured } = useAds({
        isFeatured: true,
        limit: 10,
        cityId: selectedCity.id || undefined,
    }, { enabled: !!selectedCity.id });

    const { data: recentData, isLoading: isRecentLoading, error: recentError, refetch: refetchRecent } = useAds({
        limit: 8,
        cityId: selectedCity.id || undefined,
    }, { enabled: !!selectedCity.id });

    const { data: categoriesData, isLoading: isCategoriesLoading } = useCategories();

    const { data: agencyData, isLoading: isAgenciesLoading } = useAgencies({
        cityId: selectedCity.id || undefined,
    }, { enabled: !!selectedCity.id });

    const { data: tempRentData, isLoading: isTempRentLoading, error: tempRentError, refetch: refetchTempRent } = useTemporaryRentAds({
        limit: 4,
        cityId: selectedCity.id || undefined,
    }, { enabled: !!selectedCity.id });

    // Map Backend Agency response to Component expected shape
    const topAgencies = useMemo(() => {
        return (agencyData?.agencies || []).map((agency: AgencySummary) => ({
            id: agency.id,
            name: agency.name,
            image: agency.logoUrl || "/property-placeholder.svg",
            listingsCount: 0, // Backend currently doesn't provide this in list view
        }));
    }, [agencyData]);

    return (
        <div className="flex flex-col gap-10 pb-36 pt-5 ">
            <SearchHeader
                isInitialOpen={isInitialModalOpen}
            />

            {/* Category Directory */}
            <section className="container mx-auto px-4">
                <SectionHeader
                    title="دسته‌بندی و خدمات ملکی"
                    subtitle="دسترسی مستقیم به انواع املاک و اقامتگاه‌ها در ملکتودی"
                    link={selectedCity.id ? `/ads?cityId=${selectedCity.id}&cityName=${encodeURIComponent(selectedCity.name)}` : "/ads"}
                    actionLabel="مشاهده کل بازار"
                />
                <CategoryDirectory
                    categories={categoriesData || []}
                    isLoading={isCategoriesLoading}
                    cityId={selectedCity.id || undefined}
                    cityName={selectedCity.name || undefined}
                />
            </section>

            {/* Featured Properties */}
            <section className="container mx-auto pr-4">
                <SectionHeader
                    title="املاک ویژه"
                    subtitle="منتخب آگهی‌های برتر"
                    link={selectedCity.id ? `/ads?isFeatured=true&cityId=${selectedCity.id}&cityName=${encodeURIComponent(selectedCity.name)}` : "/ads?isFeatured=true"}
                />
                {isFeaturedLoading ? (
                    <div className="flex gap-4 overflow-hidden">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="min-w-[180px] aspect-square bg-gray-100 animate-pulse rounded-2xl" />
                        ))}
                    </div>
                ) : featuredError ? (
                    <ErrorState onRetry={refetchFeatured} />
                ) : !featuredData?.items.length ? (
                    <EmptyState message="در حال حاضر آگهی ویژه‌ای در این شهر ثبت نشده است" />
                ) : (
                    <Slider>
                        {featuredData?.items.map((property: AdSummary) => {
                            const effectiveId = property.adId || (property as any).id;
                            return (
                                <PropertyCard
                                    key={effectiveId}
                                    id={effectiveId}
                                    adId={effectiveId}
                                    href={`/ads/${effectiveId}`}
                                    title={property.title}
                                    price={Object.values(property.pricing)[0] ?? 0}
                                    rating={5.0}
                                    location={selectedCity.name}
                                    image={getMediaPosterUrl(property.mediaIds?.[0])}
                                    isVideo={property.mediaIds?.[0]?.type === "VIDEO"}
                                    category={
                                        property.subcategoryTitle ||
                                        property.categoryPath?.subcategoryTitle ||
                                        getSubcategoryName(property.categoryPath?.subcategoryKey, property.categoryPath?.categoryKey) ||
                                        property.categoryTitle ||
                                        property.categoryPath?.categoryTitle ||
                                        getCategoryName(property.categoryPath?.categoryKey)
                                    }
                                    className="w-[210px] lg:w-[250px]"
                                    isSaved={property.isSaved ?? isAdSaved(effectiveId)}
                                    onToggleSave={(id) => toggleSaveAdMutation.mutateAsync(id)}
                                />
                            );
                        })}
                    </Slider>
                )}
            </section>

            {/* Top Agencies */}
            <section className="container mx-auto pr-4">
                <SectionHeader
                    title="آژانس‌های برتر"
                    subtitle="همکاری با بهترین متخصصان"
                    link={selectedCity.id ? `/agency?cityId=${selectedCity.id}&cityName=${selectedCity.name}` : "/agency"}
                />
                {isAgenciesLoading ? (
                    <div className="flex gap-4 overflow-hidden">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="min-w-32 h-40 bg-gray-100 animate-pulse rounded-xl" />
                        ))}
                    </div>
                ) : (
                    <Slider>
                        {topAgencies.map((agency: { id: string; name: string; image: string; listingsCount: number }) => (
                            <Link key={agency.id} href={`/agency/${agency.id}`} className="block">
                                <AgentAvatar name={agency.name} image={agency.image} />
                            </Link>
                        ))}
                    </Slider>
                )}
            </section>

            {/* Temporary Rentals */}
            <section className="container mx-auto pr-4 bg-orange-50/20 py-8 rounded-2xl">
                <SectionHeader
                    title="اجاره روزانه"
                    subtitle="بهترین گزینه‌ها برای سفرهای کوتاه"
                    link="/temporary-rent"
                />
                {isTempRentLoading ? (
                    <div className="flex gap-4 overflow-hidden">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="min-w-72 h-64 bg-gray-100 animate-pulse rounded-xl" />
                        ))}
                    </div>
                ) : tempRentError ? (
                    <ErrorState onRetry={refetchTempRent} />
                ) : !tempRentData?.items.length ? (
                    <EmptyState message="در حال حاضر اقامتگاه روزانه‌ای در این شهر ثبت نشده است" />
                ) : (
                    <Slider>
                        {tempRentData.items.map((property: TemporaryRentAdSummary) => (
                            <PropertyCard
                                key={property.id}
                                id={property.id}
                                adId={property.id}
                                href={`/temporary-rent/${property.id}`}
                                title={property.title}
                                price={property.pricing.nightlyPrice}
                                unit="/شب"
                                rating={4.9}
                                location={selectedCity.name}
                                image={getMediaPosterUrl(property.mediaIds?.[0])}
                                isVideo={property.mediaIds?.[0]?.type === "VIDEO"}
                                category="اجاره روزانه"
                                className="w-[210px] lg:w-[250px]"
                                isSaved={property.isSaved ?? isTemporaryRentSaved(property.id)}
                                onToggleSave={(id) => toggleSaveTempMutation.mutateAsync(id)}
                            />
                        ))}
                    </Slider>
                )}
            </section>

            {/* Latest Listings */}
            <section className="container mx-auto pr-4">
                <SectionHeader
                    title="تازه ترین‌ها"
                    subtitle="جدیدترین آگهی‌های منطقه شما"
                    link={selectedCity.id ? `/ads?cityId=${selectedCity.id}&cityName=${encodeURIComponent(selectedCity.name)}` : "/ads"}
                />
                {isRecentLoading ? (
                    <div className="flex gap-4 overflow-hidden">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                            <div key={i} className="min-w-[180px] aspect-square bg-gray-100 animate-pulse rounded-2xl" />
                        ))}
                    </div>
                ) : recentError ? (
                    <ErrorState onRetry={refetchRecent} />
                ) : !recentData?.items.length ? (
                    <EmptyState message="در حال حاضر آگهی جدیدی در این شهر ثبت نشده است" />
                ) : (
                    <Slider>
                        {recentData.items.map((property: AdSummary) => {
                            const effectiveId = property.adId || (property as any).id;
                            return (
                                <PropertyCard
                                    key={effectiveId}
                                    id={effectiveId}
                                    adId={effectiveId}
                                    href={`/ads/${effectiveId}`}
                                    title={property.title}
                                    price={Object.values(property.pricing)[0] ?? 0}
                                    rating={4.8}
                                    location={selectedCity.name}
                                    image={getMediaPosterUrl(property.mediaIds?.[0])}
                                    isVideo={property.mediaIds?.[0]?.type === "VIDEO"}
                                    category={
                                        property.subcategoryTitle ||
                                        property.categoryPath?.subcategoryTitle ||
                                        getSubcategoryName(property.categoryPath?.subcategoryKey, property.categoryPath?.categoryKey) ||
                                        property.categoryTitle ||
                                        property.categoryPath?.categoryTitle ||
                                        getCategoryName(property.categoryPath?.categoryKey)
                                    }
                                    className="w-[210px] lg:w-[250px]"
                                    isSaved={property.isSaved ?? isAdSaved(effectiveId)}
                                    onToggleSave={(id) => toggleSaveAdMutation.mutateAsync(id)}
                                />
                            );
                        })}
                    </Slider>
                )}
            </section>
        </div>
    );
};

export default HomeScene;
