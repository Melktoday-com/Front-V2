"use client";

import { CategoryTreeDialog } from "@/components/CategoryTreeDialog";
import { PageHeader } from "@/components/PageHeader";
import { useCity } from "@/components/providers/CityProvider";
import { NeighborhoodDrawer } from "@/components/ui/NeighborhoodDrawer";
import { PageSectionDivider } from "@/components/ui/PageSectionDivider";
import { PaginationControls } from "@/components/ui/PaginationControls";
import { PropertyCard } from "@/components/ui/PropertyCard";
import { EmptyState } from "@/components/ui/StatusStates";
import { useCategories } from "@/hooks/useAds";
import { useInfiniteSearchListings, useSearchMap } from "@/hooks/useSearch";
import { useCategoryLookup } from "@/hooks/useCategoryLookup";
import { useFavorites, useToggleSaveAd } from "@/hooks/useFavorites";
import { useGeoHierarchy } from "@/hooks/useGeoHierarchy";
import { useDebounce } from "@/hooks/useDebounce";
import { cn, formatPrice, getMediaUrl, getMediaPosterUrl, toPersianDigits } from "@/lib/utils";
import { geoService } from "@/services/geo.service";
import { AdSummary } from "@/types/api/ads.types";
import { AdStatus } from "@/types/api/enums";
import { ZoneSummary } from "@/types/api/geo.types";
import { ListingSearchDocument, MapMarkerDto, SearchSortOption } from "@/types/api/search.types";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, LayoutGrid, Loader2, Map as MapIcon, MapPin, SlidersHorizontal, Tag, X } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const Map = dynamic(() => import("@/components/ui/Map"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full min-h-100 bg-soft-bg animate-pulse rounded-2xl flex items-center justify-center text-text-light font-bold text-sm">
            در حال بارگذاری نقشه...
        </div>
    ),
});

function mapMarkerToAdSummary(m: MapMarkerDto): AdSummary {
    return {
        adId: m.id,
        ownerId: "",
        cityId: "",
        cityName: m.cityName ?? undefined,
        status: AdStatus.PUBLISHED,
        title: m.title,
        categoryPath: {
            categoryKey: m.category ?? "",
            subcategoryKey: m.subcategory ?? "",
            businessModelKey: "",
            attributeSchemaVersion: 1,
            categoryTitle: m.category ?? undefined,
            subcategoryTitle: m.subcategory ?? undefined,
        },
        categoryTitle: m.category ?? undefined,
        subcategoryTitle: m.subcategory ?? undefined,
        pricing: m.price ? { price: m.price } : {},
        isFeatured: false,
        mediaIds: m.mediaIds ?? [],
        createdAt: new Date().toISOString(),
        location: {
            latitude: m.latitude,
            longitude: m.longitude,
        },
    };
}



function searchDocToAdSummary(doc: ListingSearchDocument): AdSummary {
    const primaryPrice = doc.pricing?.number?.price ?? doc.pricing?.number?.totalPrice ?? 0;
    const area = doc.attributes?.number?.area || doc.attributes?.number?.meter || doc.attributes?.number?.metraj;
    const rooms = doc.attributes?.number?.rooms || doc.attributes?.number?.bedrooms || doc.attributes?.number?.room;
    return {
        adId: doc.id,
        ownerId: doc.ownerId,
        cityId: doc.geo?.cityId || "",
        cityName: doc.geo?.cityName || undefined,
        status: AdStatus.PUBLISHED,
        title: doc.title,
        categoryPath: {
            categoryKey: doc.taxonomy.categoryId,
            subcategoryKey: doc.taxonomy.subcategoryId || "",
            businessModelKey: doc.taxonomy.businessModelId || "",
            attributeSchemaVersion: 1,
            categoryTitle: doc.taxonomy.categoryName,
            subcategoryTitle: doc.taxonomy.subcategoryName,
        },
        categoryTitle: doc.taxonomy.categoryName,
        subcategoryTitle: doc.taxonomy.subcategoryName,
        pricing: doc.pricing?.number || (primaryPrice > 0 ? { price: primaryPrice } : {}),
        isFeatured: doc.isFeatured,
        mediaIds: doc.mediaIds || [],
        createdAt: doc.createdAt,
        location:
            doc._geo && typeof doc._geo.lat === "number" && typeof doc._geo.lng === "number"
                ? {
                      latitude: doc._geo.lat,
                      longitude: doc._geo.lng,
                      area: doc.geo?.neighbourhoodName
                          ? { id: doc.geo?.zoneIds?.[0] || "area", label: doc.geo.neighbourhoodName }
                          : null,
                  }
                : null,
        area: typeof area === "number" ? area : undefined,
        rooms: typeof rooms === "number" ? rooms : undefined,
    };
}

interface AdsSceneProps {
    initialViewMode?: "list" | "split" | "map";
}

export default function AdsScene({ initialViewMode = "split" }: AdsSceneProps) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { selectedCity, setSelectedCity } = useCity();
    const urlView = searchParams.get("view") as "list" | "split" | "map" | null;
    const [isMobile, setIsMobile] = useState<boolean>(false);
    const [viewMode, setViewModeState] = useState<"list" | "split" | "map">(
        urlView === "map" || urlView === "split" || urlView === "list"
            ? urlView
            : initialViewMode
    );

    // Track mobile viewport (< 1024px / Tailwind lg breakpoint)
    useEffect(() => {
        const mql = window.matchMedia("(max-width: 1023px)");
        const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
            setIsMobile(e.matches);
        };
        setIsMobile(mql.matches);
        mql.addEventListener("change", handleChange);
        return () => mql.removeEventListener("change", handleChange);
    }, []);

    const setViewMode = useCallback(
        (mode: "list" | "split" | "map") => {
            const defaultMode = isMobile ? "list" : "split";
            const targetMode = isMobile && mode === "split" ? "list" : mode;
            setViewModeState(targetMode);
            const params = new URLSearchParams(searchParams.toString());
            if (targetMode === defaultMode) {
                params.delete("view");
            } else {
                params.set("view", targetMode);
            }
            router.replace(`/ads?${params.toString()}`, { scroll: false });
        },
        [searchParams, router, isMobile]
    );
    const [selectedZones, setSelectedZones] = useState<ZoneSummary[]>([]);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
    const isAnyModalOpen = drawerOpen || categoryDialogOpen;

    const urlSearch = searchParams.get("search") || "";
    const effectiveCityId = searchParams.get("cityId") || selectedCity.id || undefined;
    const effectiveCityName = searchParams.get("cityName") || selectedCity.name || "همه شهرها";
    const urlCategory = searchParams.get("categoryKey") || "";
    const urlSubcategory = searchParams.get("subcategoryKey") || "";
    const urlDealType = searchParams.get("businessModelKey") || "";
    const urlIsFeatured = searchParams.get("isFeatured") === "true";

    const [search, setSearch] = useState(urlSearch);
    const [selectedCategory, setSelectedCategory] = useState(urlCategory);
    const [selectedSubcategory, setSelectedSubcategory] = useState(urlSubcategory);
    const [sort, setSort] = useState<SearchSortOption>("newest");
    const [startPage, setStartPage] = useState<number>(1);

    const debouncedSearch = useDebounce(search, 350);

    // Keep state in sync with URL search params and screen size
    useEffect(() => {
        setSelectedCategory(searchParams.get("categoryKey") || "");
        setSelectedSubcategory(searchParams.get("subcategoryKey") || "");
        setSearch(searchParams.get("search") || "");
        if (urlView === "map") {
            setViewModeState("map");
        } else if (urlView === "list") {
            setViewModeState("list");
        } else if (urlView === "split") {
            setViewModeState(isMobile ? "list" : "split");
        } else {
            setViewModeState(isMobile ? "list" : initialViewMode);
        }
    }, [searchParams, urlView, initialViewMode, isMobile]);

    // Reset pagination when search query, city, or selected zones change
    useEffect(() => {
        setStartPage(1);
    }, [debouncedSearch, effectiveCityId, selectedZones]);

    const selectedZoneIds = useMemo(() => selectedZones.map((z) => z.id), [selectedZones]);
    const selectedZoneNames = useMemo(() => selectedZones.map((z) => z.name), [selectedZones]);

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
    } = useInfiniteSearchListings(
        {
            limit: 20,
            query: debouncedSearch.trim() || undefined,
            cityId: effectiveCityId,
            cityName: effectiveCityName !== "همه شهرها" ? effectiveCityName : undefined,
            neighbourhoodName: selectedZones.length === 1 ? selectedZones[0].name : undefined,
            neighbourhoodNames: selectedZoneNames.length > 1 ? selectedZoneNames : undefined,
            zoneId: selectedZones.length === 1 ? selectedZones[0].id : undefined,
            zoneIds: selectedZoneIds.length > 0 ? selectedZoneIds : undefined,
            categoryKey: selectedCategory || undefined,
            subcategoryKey: selectedSubcategory || undefined,
            sort,
        },
        { startPage, maxPages: 7, enabled: true }
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
            const res = await geoService.listZones({ parentId: effectiveCityId, type: "NEIGHBORHOOD", limit: 500 });
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
                    const lat = Number(city.centerPoint.latitude ?? (city.centerPoint as any).lat);
                    const lng = Number(city.centerPoint.longitude ?? (city.centerPoint as any).lng);
                    if (!isNaN(lat) && !isNaN(lng)) {
                        return { latitude: lat, longitude: lng };
                    }
                }
            }
        }
        if (selectedCity.centerPoint) {
            const lat = Number(selectedCity.centerPoint.latitude ?? (selectedCity.centerPoint as any).lat);
            const lng = Number(selectedCity.centerPoint.longitude ?? (selectedCity.centerPoint as any).lng);
            if (!isNaN(lat) && !isNaN(lng)) {
                return { latitude: lat, longitude: lng };
            }
        }
        return null;
    }, [hierarchy, effectiveCityId, effectiveCityName, selectedCity]);

    // All loaded ads across pages in current batch
    const allLoadedAds = useMemo(() => {
        return data?.pages.flatMap((page) => page.hits.map(searchDocToAdSummary)) || [];
    }, [data]);

    // Backend-driven results directly: zero client-side zone/polygon filtering
    const displayedAds = allLoadedAds;

    // Viewport bounding-box & zoom state for dedicated map query
    const mapZoom = 12;
    const [mapViewport, setMapViewport] = useState<{
        northEast: { lat: number; lng: number };
        southWest: { lat: number; lng: number };
        zoom: number;
    } | null>(null);

    const debouncedMapViewport = useDebounce(mapViewport, 250);

    const { data: mapData } = useSearchMap(
        {
            northLat: debouncedMapViewport?.northEast.lat ?? 0,
            southLat: debouncedMapViewport?.southWest.lat ?? 0,
            eastLng: debouncedMapViewport?.northEast.lng ?? 0,
            westLng: debouncedMapViewport?.southWest.lng ?? 0,
            zoom: debouncedMapViewport?.zoom ?? mapZoom,
            cityId: effectiveCityId,
            cityName: effectiveCityName !== "همه شهرها" ? effectiveCityName : undefined,
            neighbourhoodName: selectedZones.length === 1 ? selectedZones[0].name : undefined,
            neighbourhoodNames: selectedZoneNames.length > 1 ? selectedZoneNames : undefined,
            zoneId: selectedZones.length === 1 ? selectedZones[0].id : undefined,
            zoneIds: selectedZoneIds.length > 0 ? selectedZoneIds : undefined,
            categoryKey: selectedCategory || undefined,
            subcategoryKey: selectedSubcategory || undefined,
            query: debouncedSearch.trim() || undefined,
            limit: 500,
        },
        Boolean(debouncedMapViewport && (viewMode === "map" || (viewMode === "split" && !isMobile)))
    );

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
        if (mapData?.markers && mapData.markers.length > 0) {
            return mapData.markers.map(mapMarkerToAdSummary);
        }
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
    }, [mapData, displayedAds]);

    const handleCitySelect = (city: {
        id: string;
        name: string;
        centerPoint?: { latitude: number; longitude: number };
    }) => {
        setSelectedCity(city);
        setSelectedZones([]);
        setStartPage(1);
        const params = new URLSearchParams(searchParams.toString());
        if (city.id) {
            params.set("cityId", city.id);
            params.set("cityName", city.name);
        } else {
            params.delete("cityId");
            params.delete("cityName");
        }
        router.replace(`/ads?${params.toString()}`, { scroll: false });
    };

    const handleCategorySelect = (catKey: string) => {
        setSelectedCategory(catKey);
        setSelectedSubcategory("");
        setStartPage(1);
        const params = new URLSearchParams(searchParams.toString());
        if (catKey) {
            params.set("categoryKey", catKey);
        } else {
            params.delete("categoryKey");
        }
        params.delete("subcategoryKey");
        router.push(`/ads?${params.toString()}`);
    };

    const handleSubcategorySelect = (subKey: string) => {
        setSelectedSubcategory(subKey);
        setStartPage(1);
        const params = new URLSearchParams(searchParams.toString());
        if (subKey) {
            params.set("subcategoryKey", subKey);
        } else {
            params.delete("subcategoryKey");
        }
        router.push(`/ads?${params.toString()}`);
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

    const getPricingDisplay = (ad: AdSummary): { price: string | number; unit?: string } => {
        const pricing = ad.pricing;
        if (!pricing) return { price: "توافقی" };
        const dep = pricing.depositPrice ?? pricing.mortgagePrice ?? pricing.deposit;
        const rent = pricing.monthlyRent ?? pricing.rentPrice ?? pricing.monthly_rent;
        if (dep !== undefined && rent !== undefined) {
            return {
                price: `رهن ${formatPrice(Number(dep), "")} - اجاره ${formatPrice(Number(rent), "")}`,
            };
        }
        if (pricing.totalPrice !== undefined || pricing.price !== undefined) {
            const total = Number(pricing.totalPrice ?? pricing.price);
            return { price: total > 0 ? total : "توافقی" };
        }
        if (dep !== undefined) {
            const depNum = Number(dep);
            return { price: depNum > 0 ? `ودیعه ${formatPrice(depNum, "")}` : "توافقی" };
        }
        if (rent !== undefined) {
            const rentNum = Number(rent);
            return { price: rentNum > 0 ? `اجاره ${formatPrice(rentNum, "")}` : "توافقی" };
        }
        return { price: "توافقی" };
    };

    // Map center: based on city coordinates or ads; decoupled from zone selection count to avoid disruptive viewport resets
    const mapCenter: [number, number] = useMemo(() => {
        if (currentCityCoords && !isNaN(currentCityCoords.latitude) && !isNaN(currentCityCoords.longitude)) {
            return [currentCityCoords.latitude, currentCityCoords.longitude];
        }
        if (adsForMap.length > 0) {
            const firstLoc = adsForMap[0]?.location;
            if (firstLoc && !isNaN(firstLoc.latitude) && !isNaN(firstLoc.longitude)) {
                return [firstLoc.latitude, firstLoc.longitude];
            }
        }
        return [35.6892, 51.389];
    }, [currentCityCoords, adsForMap]);

    const activeZoneForMap = selectedZones.length === 1 ? selectedZones[0] : null;

    return (
        <div className="h-screen bg-surface flex flex-col overflow-hidden">
            {/* Header & Filter Section */}
            <div className="flex-none p-4 sm:p-6 lg:px-10 lg:pt-8 lg:pb-2 space-y-3 border-b border-border-subtle">
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
                                    className="hover:opacity-70 transition-opacity cursor-pointer"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        ))}
                        <button
                            type="button"
                            onClick={() => setSelectedZones([])}
                            className="text-[11px] text-secondary hover:text-error font-semibold transition-colors cursor-pointer"
                        >
                            پاک کردن همه
                        </button>
                    </div>
                )}

                {/* Filter row: Categories, Neighborhoods, Sort controls in one clean row */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                    {/* Category tree trigger button */}
                    <button
                        type="button"
                        onClick={() => setCategoryDialogOpen(true)}
                        className={cn(
                            "shrink-0 flex items-center gap-1.5 px-3 h-8 sm:h-8.5 rounded-full text-[11px] sm:text-xs font-bold border transition-all whitespace-nowrap cursor-pointer",
                            selectedCategory || selectedSubcategory
                                ? "bg-primary text-white border-primary shadow-xs shadow-primary/25"
                                : "bg-soft-bg text-secondary border-soft-border hover:border-primary/50 hover:text-primary"
                        )}
                    >
                        <Tag className="w-3.5 h-3.5 shrink-0" />
                        <span>
                            {selectedSubcategory
                                ? getSubcategoryName(selectedSubcategory, selectedCategory) || "دسته‌بندی"
                                : selectedCategory
                                ? getCategoryName(selectedCategory) || "دسته‌بندی"
                                : "دسته‌بندی‌ها"}
                        </span>
                        {(selectedCategory || selectedSubcategory) && (
                            <span
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleCategorySelect("");
                                }}
                                className="hover:bg-surface/20 p-0.5 rounded-full transition-colors cursor-pointer mr-0.5"
                                title="حذف فیلتر دسته‌بندی"
                            >
                                <X className="w-3 h-3" />
                            </span>
                        )}
                        <ChevronDown className="w-3 h-3 opacity-70 shrink-0" />
                    </button>

                    {/* Filter (Neighborhoods) control */}
                    {neighborhoods.length > 0 && (
                        <button
                            data-testid="neighborhood-drawer-trigger"
                            type="button"
                            onClick={() => setDrawerOpen(true)}
                            className={cn(
                                "shrink-0 flex items-center gap-1.5 px-3 h-8 sm:h-8.5 rounded-full text-[11px] sm:text-xs font-bold border transition-all whitespace-nowrap cursor-pointer",
                                selectedZones.length > 0
                                    ? "bg-primary text-white border-primary shadow-sm"
                                    : "bg-soft-bg text-secondary border-soft-border hover:border-primary/50 hover:text-primary"
                            )}
                        >
                            <MapPin className="w-3.5 h-3.5 shrink-0" />
                            <span>نواحی</span>
                            {selectedZones.length > 0 && (
                                <span className="bg-surface/30 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full leading-none">
                                    {selectedZones.length}
                                </span>
                            )}
                            <ChevronDown className="w-3 h-3 opacity-70 shrink-0" />
                        </button>
                    )}

                    {/* Sort selector */}
                    <div className="relative shrink-0 flex items-center gap-1.5 bg-soft-bg hover:border-primary/50 text-secondary hover:text-primary px-3 h-8 sm:h-8.5 rounded-full border border-soft-border transition-all cursor-pointer">
                        <SlidersHorizontal className="w-3.5 h-3.5 shrink-0 pointer-events-none" />
                        <span className="text-[11px] sm:text-xs font-bold whitespace-nowrap">
                            {sort === "relevance"
                                ? "مرتبط‌ترین"
                                : sort === "newest"
                                ? "جدیدترین"
                                : sort === "price_asc"
                                ? "ارزان‌ترین"
                                : "گران‌ترین"}
                        </span>
                        <ChevronDown className="w-3 h-3 opacity-70 shrink-0 pointer-events-none" />

                        {/* Invisible native select on top for native interaction */}
                        <select
                            value={sort}
                            onChange={(e) => {
                                setSort(e.target.value as SearchSortOption);
                                setStartPage(1);
                            }}
                            aria-label="مرتب‌سازی"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        >
                            <option value="relevance">مرتبط‌ترین</option>
                            <option value="newest">جدیدترین</option>
                            <option value="price_asc">ارزان‌ترین</option>
                            <option value="price_desc">گران‌ترین</option>
                        </select>
                    </div>

                    {/* View Mode Toggle: List / Split / Map */}
                    <div className="flex items-center bg-soft-bg border border-soft-border rounded-full p-0.5 shrink-0 mr-auto">
                        <button
                            type="button"
                            onClick={() => setViewMode("list")}
                            className={cn(
                                "flex items-center gap-1 px-2.5 sm:px-3 h-7 sm:h-7.5 rounded-full text-[11px] sm:text-xs font-bold transition-all cursor-pointer",
                                viewMode === "list" || (isMobile && viewMode === "split")
                                    ? "bg-primary text-white shadow-xs"
                                    : "text-secondary hover:text-text-main"
                            )}
                            title="نمایش فهرست"
                        >
                            <LayoutGrid className="w-3.5 h-3.5" />
                            <span>فهرست</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode("split")}
                            className={cn(
                                "hidden lg:flex items-center gap-1 px-2.5 sm:px-3 h-7 sm:h-7.5 rounded-full text-[11px] sm:text-xs font-bold transition-all cursor-pointer",
                                viewMode === "split" && !isMobile
                                    ? "bg-primary text-white shadow-xs"
                                    : "text-secondary hover:text-text-main"
                            )}
                            title="نمایش همزمان"
                        >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                            <span>تقسیم</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode("map")}
                            className={cn(
                                "flex items-center gap-1 px-2.5 sm:px-3 h-7 sm:h-7.5 rounded-full text-[11px] sm:text-xs font-bold transition-all cursor-pointer",
                                viewMode === "map"
                                    ? "bg-primary text-white shadow-xs"
                                    : "text-secondary hover:text-text-main"
                            )}
                            title="نمایش تمام‌صفحه نقشه"
                        >
                            <MapIcon className="w-3.5 h-3.5" />
                            <span>نقشه</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Split View */}
            <div className="flex-1 relative flex flex-col lg:flex-row gap-4 p-4 lg:p-6 lg:pt-4 overflow-hidden">
                {/* List Section */}
                <div
                    ref={listContainerRef}
                    id="ads-list-container"
                    className={cn(
                        "overflow-y-auto custom-scrollbar transition-all duration-300 px-1",
                        viewMode === "map"
                            ? "hidden"
                            : viewMode === "list"
                            ? "w-full flex-1 block"
                            : "w-full lg:flex-1 block"
                    )}
                >
                    {/* Anchor for top of list */}
                    <div id="ads-list-top" />


                    {isLoading ? (
                        <div
                            className={cn(
                                "grid gap-4 pb-12",
                                viewMode === "split" && !isMobile
                                    ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 min-[1800px]:grid-cols-3"
                                    : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
                            )}
                        >
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
                        <div
                            className={cn(
                                "grid gap-4 pb-32 lg:pb-6",
                                viewMode === "split" && !isMobile
                                    ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 min-[1800px]:grid-cols-3"
                                    : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
                            )}
                        >
                            {data?.pages.map((page, pageIndex) => {
                                const pageAds = page.hits.map(searchDocToAdSummary);

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

                                            const effectiveId = ad.adId || (ad as any).id;

                                            return (
                                                <PropertyCard
                                                    key={effectiveId}
                                                    id={effectiveId}
                                                    adId={effectiveId}
                                                    href={`/ads/${effectiveId}`}
                                                    title={ad.title}
                                                    price={pricing.price}
                                                    unit={pricing.unit}
                                                    location={
                                                        ad.location?.area?.label
                                                            ? `${ad.cityName || effectiveCityName}، ${ad.location.area.label}`
                                                            : (ad.cityName || effectiveCityName || ad.cityId)
                                                    }
                                                    image={
                                                        ad.mediaIds && ad.mediaIds.length > 0
                                                            ? getMediaPosterUrl(ad.mediaIds[0])
                                                            : "/property-placeholder.svg"
                                                    }
                                                    isVideo={ad.mediaIds?.[0]?.type === "VIDEO"}
                                                    category={subcategoryDisplay}
                                                    isSaved={ad.isSaved ?? isAdSaved(effectiveId)}
                                                    onToggleSave={(id) => toggleSaveMutation.mutateAsync(id)}
                                                    area={ad.area}
                                                    rooms={ad.rooms}
                                                    isUrgent={ad.isFeatured}
                                                    date={ad.createdAt}
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
                                        <div className="flex items-center gap-2 text-xs font-bold text-secondary bg-surface px-5 py-2.5 rounded-xl shadow-xs border border-border-subtle">
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
                            className="mb-32 lg:mb-8"
                        />
                    )}
                </div>

                {/* Map Section */}
                <div
                    className={cn(
                        "relative z-0 h-full overflow-hidden rounded-2xl border border-border-subtle shadow-xs animate-in fade-in duration-150",
                        viewMode === "list"
                            ? "hidden"
                            : viewMode === "map"
                            ? "w-full flex-1 block"
                            : "hidden lg:block lg:flex-[1.4]"
                    )}
                >
                    <Map
                        ads={adsForMap}
                        markers={mapData?.markers}
                        clusters={mapData?.clusters}
                        zones={neighborhoods}
                        selectedZoneIds={selectedZoneIds}
                        onZoneSelect={(zone) => handleZoneToggle(zone)}
                        center={mapCenter}
                        zoom={mapZoom}
                        onViewportChange={(v) =>
                            setMapViewport({
                                northEast: v.bounds.northEast,
                                southWest: v.bounds.southWest,
                                zoom: v.zoom,
                            })
                        }
                    />

                    {/* Toggle Map View button */}
                    {!isAnyModalOpen && (
                        viewMode === "map" ? (
                            <button
                                onClick={() => setViewMode(isMobile ? "list" : "split")}
                                aria-label={isMobile ? "مشاهده فهرست" : "خروج از نقشه تمام‌صفحه"}
                                className="ads-floating-map-btn absolute bottom-24 lg:bottom-6 left-1/2 -translate-x-1/2 z-[500] bg-brand text-white px-3.5 py-1.5 sm:px-5 sm:py-2.5 rounded-full shadow-2xl flex items-center gap-1.5 sm:gap-2 font-bold text-xs sm:text-sm active:scale-95 hover:bg-brand/90 transition-all border border-white/20 backdrop-blur-md cursor-pointer"
                            >
                                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent" />
                                <span>{isMobile ? "مشاهده فهرست" : "خروج از تمام‌صفحه"}</span>
                            </button>
                        ) : (
                            <button
                                onClick={() => setViewMode("list")}
                                aria-label="بستن نقشه"
                                className="ads-floating-map-btn lg:hidden absolute bottom-24 left-1/2 -translate-x-1/2 z-[500] bg-brand text-white px-3.5 py-1.5 sm:px-5 sm:py-2.5 rounded-full shadow-2xl flex items-center gap-1.5 sm:gap-2 font-bold text-xs sm:text-sm active:scale-95 hover:bg-brand/90 transition-all border border-white/20 backdrop-blur-md cursor-pointer"
                            >
                                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent" />
                                <span>بستن نقشه</span>
                            </button>
                        )
                    )}
                </div>

                {/* Floating Show Map Button (When map is hidden) */}
                {(viewMode === "list" || (isMobile && viewMode === "split")) && !isAnyModalOpen && (
                    <button
                        onClick={() => setViewMode("map")}
                        aria-label="نمایش نقشه"
                        className="ads-floating-map-btn fixed bottom-24 lg:bottom-8 left-1/2 -translate-x-1/2 z-30 bg-brand text-white px-3.5 py-1.5 sm:px-5 sm:py-2.5 rounded-full shadow-2xl flex items-center gap-1.5 sm:gap-2 font-bold text-xs sm:text-sm active:scale-95 hover:bg-brand/90 transition-all border border-white/20 hover:shadow-brand/25 cursor-pointer backdrop-blur-md"
                    >
                        <MapIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent" />
                        <span>مشاهده روی نقشه</span>
                    </button>
                )}
            </div>

            {/* Neighborhood Drawer */}
            <NeighborhoodDrawer
                isOpen={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                neighborhoods={neighborhoods}
                selectedIds={selectedZoneIds}
                onToggle={handleZoneToggle}
                onClear={() => {
                    setSelectedZones([]);
                    setStartPage(1);
                }}
            />

            {/* Category Tree Dialog / Drawer */}
            <CategoryTreeDialog
                isOpen={categoryDialogOpen}
                onClose={() => setCategoryDialogOpen(false)}
                categories={categoriesData || []}
                selectedCategoryKey={selectedCategory}
                selectedSubcategoryKey={selectedSubcategory}
                onSelectCategory={handleCategorySelect}
                onSelectSubcategory={handleSubcategorySelect}
            />
        </div>
    );
}
