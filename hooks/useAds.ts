import { adsService } from "@/services/ads.service";
import { ListAdsQuery } from "@/types/api/ads.types";
import { useQuery } from "@tanstack/react-query";

export function useAds(query: ListAdsQuery = {}) {
    return useQuery({
        queryKey: ["ads", query],
        queryFn: () => adsService.list(query),
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
