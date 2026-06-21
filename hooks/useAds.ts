import { adsService } from "@/services/ads.service";
import { ListAdsQuery, PaginatedAdsResponse } from "@/types/api/ads.types";
import { useQuery, UseQueryOptions } from "@tanstack/react-query";

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
