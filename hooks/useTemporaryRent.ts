import { ListTemporaryRentQuery, TemporaryRentAdSummary, temporaryRentService } from "@/services/temporary-rent.service";
import { PaginatedResponse } from "@/types/api/ads.types";
import { CreateTemporaryRentDraftRequest } from "@/types/api/temporary-rent.types";
import { useMutation, useQuery, useQueryClient, UseQueryOptions } from "@tanstack/react-query";

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

export const useCreateTemporaryRentDraft = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateTemporaryRentDraftRequest) => temporaryRentService.createDraft(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["temporary-rent-ads"] });
        },
    });
};

export const usePublishTemporaryRent = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => temporaryRentService.publish(id),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["temporary-rent-ads"] });
            queryClient.invalidateQueries({ queryKey: ["temporary-rent-ad", data.adId] });
        },
    });
};

export const useDeleteTemporaryRent = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => temporaryRentService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["temporary-rent-ads"] });
        },
    });
};
