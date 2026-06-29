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

export const useCreateAgency = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: agencyService.createAgency,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["agencies"] });
            queryClient.invalidateQueries({ queryKey: ["auth-session"] });
        },
    });
};

export const useUpdateAgency = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ agencyId, data }: { agencyId: string; data: any }) =>
            agencyService.updateAgency(agencyId, data),
        onSuccess: (_, { agencyId }) => {
            queryClient.invalidateQueries({ queryKey: ["agency", agencyId] });
            queryClient.invalidateQueries({ queryKey: ["agencies"] });
        },
    });
};

export const useAgencyStats = (agencyId: string) => {
    return useQuery({
        queryKey: ["agency-stats", agencyId],
        queryFn: () => agencyService.getAgencyStats(agencyId),
        enabled: !!agencyId,
    });
};

export const useRequestConsultation = () => {
    return useMutation({
        mutationFn: ({ agencyId, data }: { agencyId: string; data: any }) =>
            agencyService.requestConsultation(agencyId, data),
    });
};

export function useMyAgency() {
    const { user } = useAuth();

    return useQuery({
        queryKey: ["my-agency", user?.userId],
        queryFn: async () => {
            if (!user?.userId) return null;
            // Since backend lacks direct "my agency" endpoint, we search in the list
            // This is a temporary workaround based on available API
            const result = await agencyService.listAgencies({ limit: 100 });
            // We need to fetch details for each to get ownerUserId
            // This is inefficient but necessary given the backend constraints
            // BETTER: If the agency module is updated, this should be replaced
            for (const summary of result.agencies) {
                const details = await agencyService.getAgency(summary.id);
                if (details.ownerUserId === user.userId) {
                    return details;
                }
            }
            return null;
        },
        enabled: !!user?.userId,
    });
}
