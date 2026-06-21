import { agencyService } from "@/services/agency.service";
import { useQuery } from "@tanstack/react-query";

export const useAgencies = (query: { cityId?: string; search?: string; page?: number; limit?: number } = {}) => {
    return useQuery({
        queryKey: ["agencies", query],
        queryFn: () => agencyService.listAgencies(query),
    });
};
