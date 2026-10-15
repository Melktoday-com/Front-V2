"use client";

import { PageHeader } from "@/components/PageHeader";
import { useCity } from "@/components/providers/CityProvider";
import { AgencyCard } from "@/components/ui/AgencyCard";
import { PageSectionDivider } from "@/components/ui/PageSectionDivider";
import { PaginationControls } from "@/components/ui/PaginationControls";
import { useInfiniteAgencies } from "@/hooks/useAgencies";
import { useGeoHierarchy } from "@/hooks/useGeoHierarchy";
import { toPersianDigits } from "@/lib/utils";
import { AgencySummary } from "@/types/api/agency.types";
import { ArrowLeft, Building2, Home, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

export default function AgencyScene() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { selectedCity, setSelectedCity } = useCity();

    const urlSearch = searchParams.get("search") || "";
    // Priority: URL Param -> Global State
    const effectiveCityId = searchParams.get("cityId") || selectedCity.id || undefined;
    const effectiveCityName = searchParams.get("cityName") || selectedCity.name || "همه شهرها";

    const [search, setSearch] = useState(urlSearch);
    const [startPage, setStartPage] = useState<number>(1);

    const observerTargetRef = useRef<HTMLDivElement | null>(null);

    const {
        data: agenciesData,
        isLoading,
        isFetchingNextPage,
        hasNextPage,
        fetchNextPage,
    } = useInfiniteAgencies(
        {
            limit: 15,
            search: search || undefined,
            cityId: effectiveCityId,
        },
        { startPage, maxPages: 7 }
    );

    // Auto-scroll infinite scroll up to 7 pages
    useEffect(() => {
        const target = observerTargetRef.current;
        if (!target) return;

        const currentBatchPageCount = agenciesData?.pages.length ?? 0;
        if (currentBatchPageCount >= 7) return;
        if (!hasNextPage || isFetchingNextPage) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    fetchNextPage();
                }
            },
            { rootMargin: "300px" }
        );

        observer.observe(target);
        return () => {
            observer.disconnect();
        };
    }, [hasNextPage, isFetchingNextPage, fetchNextPage, agenciesData?.pages.length]);

    const { data: hierarchy } = useGeoHierarchy();

    const cityNameMap = useMemo(() => {
        if (!hierarchy) return {};
        const map: Record<string, string> = {};
        hierarchy.forEach((province) => {
            province.cities.forEach((city) => {
                map[city.id] = city.name;
            });
        });
        return map;
    }, [hierarchy]);

    const handleCitySelect = (city: { id: string; name: string }) => {
        setSelectedCity(city);
        setStartPage(1);
        const params = new URLSearchParams(searchParams.toString());
        params.set("cityId", city.id);
        params.set("cityName", city.name);
        router.push(`${window.location.pathname}?${params.toString()}`);
    };

    const handleSearchChange = (val: string) => {
        setSearch(val);
        setStartPage(1);
    };

    // Flatten all loaded agencies across pages in current batch
    const allLoadedAgencies = useMemo(() => {
        return agenciesData?.pages.flatMap((page) => page.agencies || []) || [];
    }, [agenciesData]);

    // Pagination metrics
    const totalCount = agenciesData?.pages[0]?.total ?? 0;
    const limitPerPage = agenciesData?.pages[0]?.limit ?? 15;
    const totalPages = Math.ceil(totalCount / limitPerPage);
    const lastLoadedPage = agenciesData?.pages[agenciesData.pages.length - 1]?.page ?? startPage;
    const isBatchFinished = (agenciesData?.pages.length ?? 0) >= 7 || !hasNextPage;
    const loadedPages = useMemo(() => agenciesData?.pages.map((p) => p.page) || [], [agenciesData]);

    const handlePageSelect = (targetPage: number) => {
        const isLoadedInCurrentBatch = loadedPages.includes(targetPage);
        if (isLoadedInCurrentBatch) {
            if (targetPage === startPage) {
                document.getElementById("agency-top")?.scrollIntoView({ behavior: "smooth" });
            } else {
                const sectionElem = document.getElementById(`agency-page-section-${targetPage}`);
                if (sectionElem) {
                    sectionElem.scrollIntoView({ behavior: "smooth", block: "start" });
                }
            }
        } else {
            setStartPage(targetPage);
            document.getElementById("agency-top")?.scrollIntoView({ behavior: "smooth" });
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
        document.getElementById("agency-top")?.scrollIntoView({ behavior: "smooth" });
    };

    return (
        <div className="min-h-screen bg-surface pb-24 lg:pb-10">
            {/* Top Anchor */}
            <div id="agency-top" />

            <div className="p-6 lg:p-10 space-y-8">
                <PageHeader
                    title="آژانس‌های املاک"
                    description={`بهترین آژانس‌های فعال در ${effectiveCityName}`}
                    searchPlaceholder="جستجوی نام آژانس املاک..."
                    searchValue={search}
                    onSearchChange={handleSearchChange}
                    cityName={effectiveCityName}
                    cityId={effectiveCityId}
                    onCitySelect={handleCitySelect}
                    actions={
                        <div className="flex items-center gap-2">
                            {/* Host Application Button */}
                            <Link
                                href="/host/apply"
                                title="درخواست میزبانی اقامتگاه روزانه"
                                className="group inline-flex items-center gap-2 px-3 py-1.5 md:py-2 rounded-xl bg-success-subtle hover:bg-emerald-500/15 border border-success-border/60 hover:border-success-border text-success text-xs font-bold transition-all shadow-2xs hover:shadow-xs"
                            >
                                <Home className="w-4 h-4 shrink-0" />
                                <span>درخواست میزبانی</span>
                                <ArrowLeft className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:-translate-x-0.5 transition-all" />
                            </Link>

                            {/* Agency Application Button */}
                            <Link
                                href="/agency/apply"
                                title="ثبت‌نام آژانس و مشاور املاک"
                                className="group inline-flex items-center gap-2 px-3 py-1.5 md:py-2 rounded-xl bg-info-subtle hover:bg-blue-500/15 border border-info-border/60 hover:border-info-border text-info text-xs font-bold transition-all shadow-2xs hover:shadow-xs"
                            >
                                <Building2 className="w-4 h-4 shrink-0" />
                                <span>ثبت‌نام آژانس</span>
                                <ArrowLeft className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:-translate-x-0.5 transition-all" />
                            </Link>
                        </div>
                    }
                />

                {isLoading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-6 items-stretch">
                        {Array.from({ length: 10 }).map((_, i) => (
                            <div key={i} className="h-50 bg-soft-bg animate-pulse rounded-[30px]" />
                        ))}
                    </div>
                ) : allLoadedAgencies.length === 0 ? (
                    <div className="py-20 text-center space-y-4">
                        <div className="text-secondary-400 font-bold">آژانسی با این مشخصات یافت نشد</div>
                    </div>
                ) : (
                    <div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-6 items-stretch">
                            {agenciesData?.pages.map((page, pageIndex) => {
                                const pageAgencies = page.agencies || [];
                                if (pageAgencies.length === 0 && pageIndex > 0) return null;

                                return (
                                    <div key={`agency-page-${page.page}`} className="contents">
                                        {/* Section Header for page 2 onwards */}
                                        {pageIndex > 0 && (
                                            <PageSectionDivider
                                                id={`agency-page-section-${page.page}`}
                                                page={page.page}
                                                count={pageAgencies.length}
                                                itemLabel="آژانس املاک"
                                            />
                                        )}

                                        {pageAgencies.map((agency: AgencySummary) => (
                                            <AgencyCard
                                                key={agency.id}
                                                id={agency.id}
                                                name={agency.name}
                                                bio={agency.bio}
                                                isVerified={agency.isVerified}
                                                rating={agency.rating}
                                                logoUrl={agency.logoUrl}
                                                location={cityNameMap[agency.cityId] || "نامشخص"}
                                            />
                                        ))}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Sentinel for infinite scroll (auto-loads up to 7 pages) */}
                        {hasNextPage && (agenciesData?.pages.length ?? 0) < 7 && (
                            <div ref={observerTargetRef} className="py-8 flex flex-col items-center justify-center gap-2">
                                {isFetchingNextPage ? (
                                    <div className="flex items-center gap-2 text-xs font-bold text-secondary bg-surface px-5 py-2.5 rounded-xl shadow-xs border border-border-subtle">
                                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                        <span>در حال بارگذاری بخش بعدی آژانس‌ها...</span>
                                    </div>
                                ) : (
                                    <div className="h-6" />
                                )}
                            </div>
                        )}

                        {/* Pagination Controls at the End */}
                        {!isLoading && allLoadedAgencies.length > 0 && totalPages > 1 && isBatchFinished && (
                            <PaginationControls
                                startPage={startPage}
                                lastLoadedPage={lastLoadedPage}
                                totalPages={totalPages}
                                totalCount={totalCount}
                                itemLabel="آژانس املاک"
                                loadedPages={loadedPages}
                                onPageSelect={handlePageSelect}
                                onPrevPage={handlePrevPage}
                                onNextPage={handleNextPage}
                                onScrollToTop={handleScrollToTop}
                            />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
