import { agencyService } from "@/services/agency.service";
import { ListAgenciesResponse } from "@/types/api/agency.types";
import { useMutation, useQuery, useQueryClient, UseQueryOptions } from "@tanstack/react-query";

interface AgencyListQuery {
    cityId?: string;
    search?: string;
    page?: number;
    limit?: number;
}

export const useAgencies = (query: AgencyListQuery = {}, options?: Partial<UseQueryOptions<ListAgenciesResponse, Error>>) => {
    return useQuery({
        queryKey: ["agencies", query],
        queryFn: () => agencyService.listAgencies(query),
        ...options
    });
};

export const useAgency = (agencyId: string) => {
    return useQuery({
        queryKey: ["agency", agencyId],
        queryFn: () => agencyService.getAgency(agencyId),
        enabled: !!agencyId,
    });
};

export const useFollowAgency = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (agencyId: string) => agencyService.followAgency(agencyId),
        onSuccess: (_, agencyId) => {
            queryClient.invalidateQueries({ queryKey: ["agency", agencyId] });
        },
    });
};

export const useUnfollowAgency = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (agencyId: string) => agencyService.unfollowAgency(agencyId),
        onSuccess: (_, agencyId) => {
            queryClient.invalidateQueries({ queryKey: ["agency", agencyId] });
        },
    });
};
