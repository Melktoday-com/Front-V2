import { adsService } from "@/services/ads.service";
import { ListAdsQuery, PaginatedAdsResponse } from "@/types/api/ads.types";
import { useInfiniteQuery, useQuery, UseQueryOptions } from "@tanstack/react-query";

export function useAds(query: ListAdsQuery = {}, options?: Partial<UseQueryOptions<PaginatedAdsResponse, Error>>) {
    return useQuery({
        queryKey: ["ads", query],
        queryFn: () => adsService.list(query),
        ...options
    });
}

export function useAd(adId: string) {
    return useQuery({
        queryKey: ["ads", adId],
        queryFn: () => adsService.getById(adId),
        enabled: !!adId,
    });
}

export function useAdContact(adId: string) {
    return useQuery({
        queryKey: ["ads", adId, "contact"],
        queryFn: () => adsService.getContactInfo(adId),
        enabled: !!adId,
    });
}

export function useCategories() {
    return useQuery({
        queryKey: ["categories"],
        queryFn: () => adsService.listCategories(),
    });
}

export function useMyAds(query: { status?: string; page?: number; limit?: number; cityId?: string } = {}) {
    return useQuery({
        queryKey: ["my-ads", query],
        queryFn: () => adsService.listMyAds(query),
    });
}

export function useInfiniteMyAds(
    query: { status?: string; limit?: number; cityId?: string } = {},
    options: { startPage?: number; maxPages?: number } = {}
) {
    const startPage = options.startPage ?? 1;
    const maxPages = options.maxPages ?? 7;

    return useInfiniteQuery({
        queryKey: ["my-ads-infinite", query, startPage],
        queryFn: async ({ pageParam = startPage }) => {
            return await adsService.listMyAds({
                ...query,
                page: pageParam as number,
                limit: query.limit ?? 12,
            });
        },
        initialPageParam: startPage,
        getNextPageParam: (lastPage, allPages) => {
            if (allPages.length >= maxPages) {
                return undefined;
            }
            const totalPages = Math.ceil(lastPage.total / lastPage.limit);
            if (lastPage.page < totalPages) {
                return lastPage.page + 1;
            }
            return undefined;
        },
    });
}
