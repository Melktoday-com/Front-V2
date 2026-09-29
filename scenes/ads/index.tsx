"use client";

import CategoryFilter from "@/components/CategoryFilter";
import { PageHeader } from "@/components/PageHeader";
import { useCity } from "@/components/providers/CityProvider";
import { NeighborhoodDrawer } from "@/components/ui/NeighborhoodDrawer";
import { PageSectionDivider } from "@/components/ui/PageSectionDivider";
import { PaginationControls } from "@/components/ui/PaginationControls";
import { PropertyCard } from "@/components/ui/PropertyCard";
import { EmptyState } from "@/components/ui/StatusStates";
import { useCategories, useInfiniteAds } from "@/hooks/useAds";
import { useCategoryLookup } from "@/hooks/useCategoryLookup";
import { useFavorites, useToggleSaveAd } from "@/hooks/useFavorites";
import { useGeoHierarchy } from "@/hooks/useGeoHierarchy";
import { cn, formatPrice, toPersianDigits } from "@/lib/utils";
import { geoService } from "@/services/geo.service";
import { AdSummary } from "@/types/api/ads.types";
import { ZoneSummary } from "@/types/api/geo.types";
import { useQuery } from "@tanstack/react-query";
import { LayoutGrid, Loader2, Map as MapIcon, MapPin, X } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const Map = dynamic(() => import("@/components/ui/Map"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full min-h-[400px] bg-soft-bg animate-pulse rounded-2xl flex items-center justify-center text-text-light font-bold text-sm">
            در حال بارگذاری نقشه...
        </div>
    ),
});

// Ray-casting point-in-polygon
function isPointInPolygon(lat: number, lng: number, polygon: [number, number][]): boolean {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i][0];
        const yi = polygon[i][1];
        const xj = polygon[j][0];
        const yj = polygon[j][1];
        const intersect = ((yi > lng) !== (yj > lng)) &&
            (lat < ((xj - xi) * (lng - yi)) / (yj - yi) + xi);
        if (intersect) inside = !inside;
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
            if (isPointInPolygon(ad.location.latitude, ad.location.longitude, polygon)) return true;
        } else if (zone.boundaries?.type === "MultiPolygon" && Array.isArray(coords[0])) {
            for (const poly of coords as number[][][][]) {
                if (Array.isArray(poly[0])) {
                    const polygon: [number, number][] = poly[0].map(([lng, lat]) => [lat, lng]);
                    if (isPointInPolygon(ad.location.latitude, ad.location.longitude, polygon)) return true;
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
    const [selectedZones, setSelectedZones] = useState<ZoneSummary[]>([]);
    const [drawerOpen, setDrawerOpen] = useState(false);

    const urlSearch = searchParams.get("search") || "";
    const effectiveCityId = searchParams.get("cityId") || selectedCity.id || undefined;
    const effectiveCityName = searchParams.get("cityName") || selectedCity.name || "همه شهرها";
    const urlCategory = searchParams.get("categoryKey") || "";
    const urlDealType = searchParams.get("businessModelKey") || "";
    const urlIsFeatured = searchParams.get("isFeatured") === "true";

    const [search, setSearch] = useState(urlSearch);
    const [selectedCategory, setSelectedCategory] = useState(urlCategory);
    const [startPage, setStartPage] = useState<number>(1);

    const observerTargetRef = useRef<HTMLDivElement | null>(null);
    const listContainerRef = useRef<HTMLDivElement | null>(null);

    // Saved ads state for heart button on each card
    const { isAdSaved } = useFavorites();
    const toggleSaveMutation = useToggleSaveAd();

    const {
        data,
        isLoading,
        isFetchingNextPage,
        hasNextPage,
        fetchNextPage,
    } = useInfiniteAds(
        {
            limit: 20,
            status: "PUBLISHED",
            isFeatured: urlIsFeatured || undefined,
            search: search || undefined,
            cityId: effectiveCityId,
            categoryKey: selectedCategory || undefined,
            businessModelKey: urlDealType || undefined,
        },
        { startPage, maxPages: 7, enabled: !!effectiveCityId }
    );

    // Auto-scroll infinite scroll up to 7 pages
    useEffect(() => {
        const target = observerTargetRef.current;
        if (!target) return;

        const currentBatchPageCount = data?.pages.length ?? 0;
        if (currentBatchPageCount >= 7) return;
        if (!hasNextPage || isFetchingNextPage) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    fetchNextPage();
                }
            },
            { root: listContainerRef.current, rootMargin: "300px" }
        );

        observer.observe(target);
        return () => {
            observer.disconnect();
        };
    }, [hasNextPage, isFetchingNextPage, fetchNextPage, data?.pages.length]);

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

    const currentCityCoords = useMemo(() => {
        if (hierarchy) {
            const targetId = effectiveCityId || selectedCity.id;
            const targetName = effectiveCityName !== "همه شهرها" ? effectiveCityName : selectedCity.name;
            for (const province of hierarchy) {
                const city = province.cities.find(
                    (c) => (targetId && c.id === targetId) || (targetName && c.name === targetName)
                );
                if (city?.centerPoint) {
                    return { latitude: city.centerPoint.latitude, longitude: city.centerPoint.longitude };
                }
            }
        }
        if (selectedCity.centerPoint) {
            return { latitude: selectedCity.centerPoint.latitude, longitude: selectedCity.centerPoint.longitude };
        }
        return null;
    }, [hierarchy, effectiveCityId, effectiveCityName, selectedCity]);

    // All loaded ads across pages in current batch
    const allLoadedAds = useMemo(() => {
        return data?.pages.flatMap((page) => page.items) || [];
    }, [data]);

    // Filter ads: OR logic across all selected zones
    const displayedAds = useMemo(() => {
        if (selectedZones.length === 0) return allLoadedAds;
        return allLoadedAds.filter((ad) => selectedZones.some((zone) => adMatchesZone(ad, zone)));
    }, [allLoadedAds, selectedZones]);

    // Pagination metrics
    const totalCount = data?.pages[0]?.total ?? 0;
    const limitPerPage = data?.pages[0]?.limit ?? 20;
    const totalPages = Math.ceil(totalCount / limitPerPage);
    const lastLoadedPage = data?.pages[data.pages.length - 1]?.page ?? startPage;
    const isBatchFinished = (data?.pages.length ?? 0) >= 7 || !hasNextPage;
    const loadedPages = useMemo(() => data?.pages.map((p) => p.page) || [], [data]);

    const handlePageSelect = (targetPage: number) => {
        const isLoadedInCurrentBatch = loadedPages.includes(targetPage);
        if (isLoadedInCurrentBatch) {
            if (targetPage === startPage) {
                listContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
            } else {
                const sectionElem = document.getElementById(`ads-page-section-${targetPage}`);
                if (sectionElem) {
                    sectionElem.scrollIntoView({ behavior: "smooth", block: "start" });
                }
            }
        } else {
            setStartPage(targetPage);
            listContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    const handleNextPage = () => {
        if (lastLoadedPage < totalPages) {
            handlePageSelect(lastLoadedPage + 1);
        }
    };

    const handlePrevPage = () => {
        if (startPage > 1) {
            handlePageSelect(Math.max(1, startPage - 7));
        }
    };

    const handleScrollToTop = () => {
        listContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    };

    const adsForMap = useMemo(() => {
        return displayedAds
            .filter(
                (ad): ad is AdSummary & { location: NonNullable<AdSummary['location']> } =>
                    Boolean(
                        ad.location &&
                        (typeof ad.location.latitude === "number" || typeof ad.location.lat === "number") &&
                        (typeof ad.location.longitude === "number" || typeof ad.location.lng === "number")
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
        setSelectedZones([]);
        setStartPage(1);
        const params = new URLSearchParams(searchParams.toString());
        params.set("cityId", city.id);
        params.set("cityName", city.name);
        router.push(`${window.location.pathname}?${params.toString()}`);
    };

    const handleCategorySelect = (catKey: string) => {
        setSelectedCategory(catKey);
        setStartPage(1);
        const params = new URLSearchParams(searchParams.toString());
        if (catKey) {
            params.set("categoryKey", catKey);
        } else {
            params.delete("categoryKey");
        }
        router.push(`${window.location.pathname}?${params.toString()}`);
    };

    const handleSearchChange = (val: string) => {
        setSearch(val);
        setStartPage(1);
    };

    const handleZoneToggle = (zone: ZoneSummary) => {
        setSelectedZones((prev) => {
            const exists = prev.some((z) => z.id === zone.id);
            return exists ? prev.filter((z) => z.id !== zone.id) : [...prev, zone];
        });
        setStartPage(1);
    };

    const handleRemoveZone = (zoneId: string) => {
        setSelectedZones((prev) => prev.filter((z) => z.id !== zoneId));
        setStartPage(1);
    };

    const getPricingDisplay = (ad: AdSummary) => {
        const pricing = ad.pricing;
        if (!pricing || Object.keys(pricing).length === 0) return { price: "توافقی", unit: undefined };
        if (pricing.mortgagePrice !== undefined && pricing.rentPrice !== undefined) {
            return {
                price: `رهن ${formatPrice(pricing.mortgagePrice, "")} - اجاره ${formatPrice(pricing.rentPrice, "")}`,
                unit: "تومان",
            };
        }
        if (pricing.nightlyPrice !== undefined) return { price: pricing.nightlyPrice, unit: "/شب" };
        const firstValue = Object.values(pricing)[0];
        return { price: firstValue ?? "توافقی", unit: undefined };
    };

    // Map center: single selected zone > city > first ad
    const mapCenter: [number, number] = useMemo(() => {
        if (
            selectedZones.length === 1 &&
            selectedZones[0].centerPoint &&
            typeof selectedZones[0].centerPoint.latitude === "number" &&
            typeof selectedZones[0].centerPoint.longitude === "number"
        ) {
            return [selectedZones[0].centerPoint.latitude, selectedZones[0].centerPoint.longitude];
        }
        if (currentCityCoords) return [currentCityCoords.latitude, currentCityCoords.longitude];
        if (adsForMap.length > 0) return [adsForMap[0].location.latitude, adsForMap[0].location.longitude];
        return [35.6892, 51.389];
    }, [selectedZones, currentCityCoords, adsForMap]);

    const mapZoom = selectedZones.length === 1 ? 14 : 12;
    const activeZoneForMap = selectedZones.length === 1 ? selectedZones[0] : null;
    const selectedZoneIds = useMemo(() => selectedZones.map((z) => z.id), [selectedZones]);

    return (
        <div className="h-screen bg-white flex flex-col overflow-hidden">
            {/* Header & Filter Section */}
            <div className="flex-none p-4 sm:p-6 lg:px-10 lg:pt-8 lg:pb-2 space-y-3 border-b border-gray-100">
                <PageHeader
                    title="جستجوی املاک"
                    searchPlaceholder="نام منطقه، محله یا نوع ملک..."
                    searchValue={search}
                    onSearchChange={handleSearchChange}
                    cityName={effectiveCityName}
                    cityId={effectiveCityId}
                    onCitySelect={handleCitySelect}
                />

                {/* Selected neighborhood tags — shown below search bar */}
                {selectedZones.length > 0 && (
                    <div
                        data-testid="selected-zone-tags"
                        className="flex flex-wrap items-center gap-2"
                    >
                        <span className="text-[11px] text-text-light font-medium shrink-0">محله‌های انتخابی:</span>
                        {selectedZones.map((zone) => (
                            <span
                                key={zone.id}
                                className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full border border-primary/20"
                            >
                                {zone.name}
                                <button
                                    type="button"
                                    onClick={() => handleRemoveZone(zone.id)}
                                    aria-label={`حذف محله ${zone.name}`}
                                    className="hover:opacity-70 transition-opacity"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        ))}
                        <button
                            type="button"
                            onClick={() => setSelectedZones([])}
                            className="text-[11px] text-secondary hover:text-red-500 font-semibold transition-colors"
                        >
                            پاک کردن همه
                        </button>
                    </div>
                )}

                {/* Category filter row + Neighborhood trigger button */}
                <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                        <CategoryFilter
                            categories={categoriesData || []}
                            isLoading={isCategoriesLoading}
                            selectedCategoryKey={selectedCategory}
                            onSelectCategory={handleCategorySelect}
                        />
                    </div>

                    {neighborhoods.length > 0 && (
                        <button
                            data-testid="neighborhood-drawer-trigger"
                            type="button"
                            onClick={() => setDrawerOpen(true)}
                            className={cn(
                                "shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold border transition-all whitespace-nowrap",
                                selectedZones.length > 0
                                    ? "bg-primary text-white border-primary shadow-sm"
                                    : "bg-soft-bg text-secondary border-soft-border hover:border-primary/50 hover:text-primary"
                            )}
                        >
                            <MapPin className="w-3.5 h-3.5" />
                            <span>نواحی</span>
                            {selectedZones.length > 0 && (
                                <span className="bg-white/30 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full leading-none">
                                    {selectedZones.length}
                                </span>
                            )}
                        </button>
                    )}
                </div>
            </div>

            {/* Main Split View */}
            <div className="flex-1 relative flex flex-col lg:flex-row gap-4 p-4 lg:p-6 lg:pt-4 overflow-hidden">
                {/* List Section */}
                <div
                    ref={listContainerRef}
                    id="ads-list-container"
                    className={cn(
                        "flex-1 overflow-y-auto custom-scrollbar transition-all duration-300 px-1",
                        viewMode === "map" ? "hidden lg:block" : "block"
                    )}
                >
                    {/* Anchor for top of list */}
                    <div id="ads-list-top" />

                    {/* Count summary */}
                    <div className="flex items-center justify-between mb-3 px-1 text-xs text-text-light font-medium">
                        <span>
                            {isLoading ? "در حال جستجو..." : `${toPersianDigits(displayedAds.length)} آگهی نمایش داده شده`}
                        </span>
                        <span>{effectiveCityName}</span>
                    </div>

                    {isLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4 pb-12">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="h-72 bg-soft-bg animate-pulse rounded-2xl" />
                            ))}
                        </div>
                    ) : displayedAds.length === 0 ? (
                        <div className="py-16 text-center">
                            <EmptyState
                                message={
                                    selectedZones.length > 0
                                        ? "ملکی در محله‌های انتخابی پیدا نشد"
                                        : "ملکی با این مشخصات پیدا نشد"
                                }
                                description={
                                    selectedZones.length > 0
                                        ? "می‌توانید فیلتر محله را حذف کرده تا تمام آگهی‌های شهر را مشاهده فرمایید."
                                        : "فیلترهای انتخابی یا عبارت جستجو را تغییر دهید."
                                }
                            />
                            {selectedZones.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedZones([]);
                                        setStartPage(1);
                                    }}
                                    className="mt-4 px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow-sm hover:bg-primary/90 transition-colors"
                                >
                                    مشاهده همه آگهی‌های {effectiveCityName}
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4 pb-6">
                            {data?.pages.map((page, pageIndex) => {
                                const pageAds =
                                    selectedZones.length === 0
                                        ? page.items
                                        : page.items.filter((ad) =>
                                              selectedZones.some((zone) => adMatchesZone(ad, zone))
                                          );

                                if (pageAds.length === 0 && pageIndex > 0) return null;

                                return (
                                    <div key={`ads-page-${page.page}`} className="contents">
                                        {/* Section Header for page 2 onwards */}
                                        {pageIndex > 0 && (
                                            <PageSectionDivider
                                                id={`ads-page-section-${page.page}`}
                                                page={page.page}
                                                count={pageAds.length}
                                                itemLabel="آگهی"
                                            />
                                        )}

                                        {pageAds.map((ad: AdSummary) => {
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
                                                    isSaved={ad.isSaved ?? isAdSaved(ad.adId)}
                                                    onToggleSave={(id) => toggleSaveMutation.mutateAsync(id)}
                                                />
                                            );
                                        })}
                                    </div>
                                );
                            })}

                            {/* Sentinel for infinite scroll (auto-loads up to 7 pages) */}
                            {hasNextPage && (data?.pages.length ?? 0) < 7 && (
                                <div
                                    ref={observerTargetRef}
                                    className="col-span-full py-8 flex flex-col items-center justify-center gap-2"
                                >
                                    {isFetchingNextPage ? (
                                        <div className="flex items-center gap-2 text-xs font-bold text-secondary bg-white px-5 py-2.5 rounded-xl shadow-xs border border-gray-100">
                                            <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                            <span>در حال بارگذاری بخش بعدی آگهی‌ها...</span>
                                        </div>
                                    ) : (
                                        <div className="h-6" />
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Pagination Controls at the End */}
                    {!isLoading && allLoadedAds.length > 0 && totalPages > 1 && isBatchFinished && (
                        <PaginationControls
                            startPage={startPage}
                            lastLoadedPage={lastLoadedPage}
                            totalPages={totalPages}
                            totalCount={totalCount}
                            itemLabel="آگهی"
                            loadedPages={loadedPages}
                            onPageSelect={handlePageSelect}
                            onPrevPage={handlePrevPage}
                            onNextPage={handleNextPage}
                            onScrollToTop={handleScrollToTop}
                            className="mb-8"
                        />
                    )}
                </div>

                {/* Map Section */}
                <div
                    className={cn(
                        "relative flex-1 lg:flex-[1.4] transition-all duration-300 h-full overflow-hidden rounded-2xl border border-gray-100 shadow-xs",
                        viewMode === "list" ? "hidden lg:block" : "block"
                    )}
                >
                    <Map
                        ads={adsForMap}
                        zones={neighborhoods}
                        selectedZoneIds={selectedZoneIds}
                        onZoneSelect={(zone) => handleZoneToggle(zone)}
                        center={mapCenter}
                        zoom={mapZoom}
                    />
                </div>

                {/* Mobile Floating Toggle */}
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

            {/* Neighborhood Drawer */}
            <NeighborhoodDrawer
                isOpen={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                neighborhoods={neighborhoods}
                selectedIds={selectedZoneIds}
                onToggle={handleZoneToggle}
                onClear={() => setSelectedZones([])}
            />
        </div>
    );
}
