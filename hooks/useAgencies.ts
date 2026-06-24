import { agencyService } from "@/services/agency.service";
import { ListAgenciesResponse } from "@/types/api/agency.types";
import { useQuery, UseQueryOptions } from "@tanstack/react-query";

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
