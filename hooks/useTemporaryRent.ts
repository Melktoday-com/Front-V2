import { ListTemporaryRentQuery, TemporaryRentAdSummary, temporaryRentService } from "@/services/temporary-rent.service";
import { PaginatedResponse } from "@/types/api/ads.types";
import { useQuery, UseQueryOptions } from "@tanstack/react-query";

export const useTemporaryRentAds = (query: ListTemporaryRentQuery = {}, options?: Partial<UseQueryOptions<PaginatedResponse<TemporaryRentAdSummary>, Error>>) => {
    return useQuery({
        queryKey: ["temporary-rent-ads", query],
        queryFn: () => temporaryRentService.list(query),
        ...options
    });
};

export const useTemporaryRentAdDetail = (id: string) => {
    return useQuery({
        queryKey: ["temporary-rent-ad", id],
        queryFn: () => temporaryRentService.getById(id),
        enabled: !!id,
    });
};
