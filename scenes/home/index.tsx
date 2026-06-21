"use client";

import { AgentAvatar } from "@/components/AgentAvatar";
import CategoryFilter from "@/components/CategoryFilter";
import { useCity } from "@/components/providers/CityProvider";
import { SearchHeader } from "@/components/SearchHeader";
import { SectionHeader } from "@/components/SectionHeader";
import { PropertyCard } from "@/components/ui/PropertyCard";
import { Slider } from "@/components/ui/Slider";
import { EmptyState, ErrorState } from "@/components/ui/StatusStates";
import { useAds, useCategories } from "@/hooks/useAds";
import { useAgencies } from "@/hooks/useAgencies";
import { useZones } from "@/hooks/useGeo";
import { useTemporaryRentAds } from "@/hooks/useTemporaryRent";
import { TemporaryRentAdSummary } from "@/services/temporary-rent.service";
import { AdSummary } from "@/types/api/ads.types";
import { AgencySummary } from "@/types/api/agency.types";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export const HomeScene = () => {
    const { selectedCity, setSelectedCity } = useCity();

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

    const { data: regionsData, isLoading: isRegionsLoading, error: regionsError, refetch: refetchRegions } = useZones(selectedCity.id);

    // Map Backend Agency response to Component expected shape
    const topAgencies = useMemo(() => {
        return (agencyData?.agencies || []).map((agency: AgencySummary) => ({
            id: agency.id,
            name: agency.name,
            image: agency.logoUrl || "/assets/images/agency-placeholder.png",
            listingsCount: 0, // Backend currently doesn't provide this in list view
        }));
    }, [agencyData]);

    return (
        <div className="flex flex-col gap-16 pb-16">
            <SearchHeader
                isInitialOpen={isInitialModalOpen}
            />

            {/* Browse by Regions */}
            {regionsData?.zones && regionsData.zones.length > 0 && (
                <section className="container mx-auto px-4">
                    <SectionHeader
                        title={`جستجو در ${selectedCity.name}`}
                        subtitle="مشاهده آگهی‌ها به تفکیک محله"
                    />
                    {isRegionsLoading ? (
                        <div className="flex gap-4 overflow-hidden">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="min-w-37.5 h-12 bg-gray-100 animate-pulse rounded-full" />
                            ))}
                        </div>
                    ) : regionsError ? (
                        <ErrorState onRetry={refetchRegions} />
                    ) : (
                        <Slider>
                            {regionsData.zones.map((zone) => (
                                <Link
                                    key={zone.id}
                                    href={`/explore?cityName=${selectedCity.name}&neighbourhoodName=${zone.name}`}
                                    className="px-6 py-3 rounded-full bg-soft-bg border border-soft-border hover:border-primary hover:text-primary transition-all whitespace-nowrap font-bold text-brand shadow-sm"
                                >
                                    {zone.name}
                                </Link>
                            ))}
                        </Slider>
                    )}
                </section>
            )}

            {/* Categories */}
            <section className="container mx-auto px-4">
                <CategoryFilter
                    categories={categoriesData || []}
                    isLoading={isCategoriesLoading}
                />
            </section>

            {/* Featured Properties */}
            <section className="container mx-auto px-4">
                <SectionHeader
                    title="املاک ویژه"
                    subtitle="منتخب آگهی‌های برتر"
                    link="/explore?isFeatured=true"
                />
                {isFeaturedLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-64 bg-gray-100 animate-pulse rounded-xl" />
                        ))}
                    </div>
                ) : featuredError ? (
                    <ErrorState onRetry={refetchFeatured} />
                ) : !featuredData?.items.length ? (
                    <EmptyState message="No featured properties available" />
                ) : (
                    <Slider>
                        {featuredData?.items.map((property: AdSummary) => (
                            <PropertyCard
                                key={property.adId}
                                adId={property.adId}
                                title={property.title}
                                price={Object.values(property.pricing)[0]?.toLocaleString() || "0"}
                                rating={5.0}
                                location={selectedCity.name}
                                image={property.mediaIds?.[0] ? `${process.env.NEXT_PUBLIC_API_URL}/media/${property.mediaIds[0]}` : "/assets/images/property-placeholder.png"}
                                category={property.categoryPath.subcategoryKey}
                            />
                        ))}
                    </Slider>
                )}
            </section>

            {/* Latest Listings */}
            <section className="container mx-auto px-4">
                <SectionHeader
                    title="تازه ترین‌ها"
                    subtitle="جدیدترین آگهی‌های منطقه شما"
                    link="/explore"
                />
                {isRecentLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                            <div key={i} className="h-64 bg-gray-100 animate-pulse rounded-xl" />
                        ))}
                    </div>
                ) : recentError ? (
                    <ErrorState onRetry={refetchRecent} />
                ) : !recentData?.items.length ? (
                    <EmptyState message="No recent listings found" />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {recentData.items.map((property: AdSummary) => (
                            <PropertyCard
                                key={property.adId}
                                adId={property.adId}
                                title={property.title}
                                price={Object.values(property.pricing)[0]?.toLocaleString() || "0"}
                                rating={4.8}
                                location={selectedCity.name}
                                image={property.mediaIds?.[0] ? `${process.env.NEXT_PUBLIC_API_URL}/media/${property.mediaIds[0]}` : "/assets/images/property-placeholder.png"}
                                category={property.categoryPath.subcategoryKey}
                            />
                        ))}
                    </div>
                )}
            </section>

            {/* Temporary Rentals */}
            <section className="container mx-auto px-4 bg-orange-50/30 py-12 rounded-3xl">
                <SectionHeader
                    title="اجاره روزانه"
                    subtitle="بهترین گزینه‌ها برای سفرهای کوتاه"
                    link="/temporary-rent"
                />
                {isTempRentLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-64 bg-gray-100 animate-pulse rounded-xl" />
                        ))}
                    </div>
                ) : tempRentError ? (
                    <ErrorState onRetry={refetchTempRent} />
                ) : !tempRentData?.items.length ? (
                    <EmptyState message="No temporary rentals found" />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {tempRentData.items.map((property: TemporaryRentAdSummary) => (
                            <PropertyCard
                                key={property.id}
                                adId={property.id}
                                href={`/temporary-rent/${property.id}`}
                                title={property.title}
                                price={property.pricing.nightlyPrice.toLocaleString() || "0"}
                                rating={4.9}
                                location={selectedCity.name}
                                image={property.mediaIds?.[0] ? `${process.env.NEXT_PUBLIC_API_URL}/media/${property.mediaIds[0]}` : "/assets/images/property-placeholder.png"}
                                category="اجاره روزانه"
                            />
                        ))}
                    </div>
                )}
            </section>

            {/* Top Agencies */}
            <section className="container mx-auto px-4">
                <SectionHeader
                    title="آژانس‌های برتر"
                    subtitle="همکاری با بهترین متخصصان"
                    link={selectedCity.id ? `/agency?cityId=${selectedCity.id}&cityName=${selectedCity.name}` : "/agency"}
                />
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                    {isAgenciesLoading
                        ? [1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="h-40 bg-gray-100 animate-pulse rounded-xl" />
                        ))
                        : topAgencies.map((agency: { id: string; name: string; image: string; listingsCount: number }) => (
                            <AgentAvatar key={agency.id} name={agency.name} image={agency.image} />
                        ))}
                </div>
            </section>
        </div>
    );
};

export default HomeScene;
