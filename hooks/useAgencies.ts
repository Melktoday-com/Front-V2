import { agencyService } from "@/services/agency.service";
import {
    AgencyContactResponse,
    ListAgenciesResponse,
    RequestConsultationRequest,
    UpdateAgencyProfileRequest,
} from "@/types/api/agency.types";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient, UseQueryOptions } from "@tanstack/react-query";
import axios from "axios";
import { useAuth } from "./useAuth";

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

export const useInfiniteAgencies = (
    query: { cityId?: string; search?: string; limit?: number } = {},
    options: { startPage?: number; maxPages?: number } = {}
) => {
    const startPage = options.startPage ?? 1;
    const maxPages = options.maxPages ?? 7;

    return useInfiniteQuery({
        queryKey: ["agencies-infinite", query, startPage],
        queryFn: async ({ pageParam = startPage }) => {
            return await agencyService.listAgencies({
                ...query,
                page: pageParam as number,
                limit: query.limit ?? 15,
            });
        },
        initialPageParam: startPage,
        getNextPageParam: (lastPage, allPages) => {
            if (allPages.length >= maxPages) {
                return undefined;
            }
            const totalPages = Math.ceil((lastPage.total || 0) / (lastPage.limit || 15));
            if (lastPage.page < totalPages) {
                return lastPage.page + 1;
            }
            return undefined;
        },
    });
};

export const useAgency = (agencyId: string) => {
    return useQuery({
        queryKey: ["agency", agencyId],
        queryFn: () => agencyService.getAgency(agencyId),
        enabled: !!agencyId,
    });
};

export const useAgencyContact = (agencyId: string, options?: { enabled?: boolean }) => {
    return useQuery<AgencyContactResponse, Error>({
        queryKey: ["agency-contact", agencyId],
        queryFn: () => agencyService.getAgencyContact(agencyId),
        enabled: options?.enabled ?? false,
        staleTime: 5 * 60 * 1000,
    });
};

export const useFollowAgency = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (agencyId: string) => agencyService.followAgency(agencyId),
        onSuccess: (_, agencyId) => {
            queryClient.invalidateQueries({ queryKey: ["agency-showcase"] });
            queryClient.invalidateQueries({ queryKey: ["agency", agencyId] });
            queryClient.invalidateQueries({ queryKey: ["agency"] });
            queryClient.invalidateQueries({ queryKey: ["agencies"] });
        },
    });
};

export const useUnfollowAgency = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (agencyId: string) => agencyService.unfollowAgency(agencyId),
        onSuccess: (_, agencyId) => {
            queryClient.invalidateQueries({ queryKey: ["agency-showcase"] });
            queryClient.invalidateQueries({ queryKey: ["agency", agencyId] });
            queryClient.invalidateQueries({ queryKey: ["agency"] });
            queryClient.invalidateQueries({ queryKey: ["agencies"] });
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
        mutationFn: ({ agencyId, data }: { agencyId: string; data: UpdateAgencyProfileRequest }) =>
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
        mutationFn: ({ agencyId, data }: { agencyId: string; data: RequestConsultationRequest }) =>
            agencyService.requestConsultation(agencyId, data),
    });
};

export function useMyAgency() {
    const { user } = useAuth();

    return useQuery({
        queryKey: ["my-agency", user?.userId],
        queryFn: async () => {
            if (!user?.userId) return null;
            try {
                return await agencyService.getMyShowcase();
            } catch (err) {
                if (axios.isAxiosError(err) && err.response?.status === 404) {
                    return null;
                }
                throw err;
            }
        },
        enabled: !!user?.userId,
    });
}

export const useExplorePosts = (params: { page?: number; limit?: number; search?: string; category?: string } = {}) => {
    return useQuery({
        queryKey: ["explore-posts", params],
        queryFn: () => agencyService.getExplorePosts(params),
    });
};

export const useInfiniteExplorePosts = (
    params: { limit?: number; search?: string; category?: string } = {},
    options: { startPage?: number; maxPages?: number } = {}
) => {
    const startPage = options.startPage ?? 1;
    const maxPages = options.maxPages ?? 7;

    return useInfiniteQuery({
        queryKey: ["explore-posts-infinite", params, startPage],
        queryFn: async ({ pageParam = startPage }) => {
            return await agencyService.getExplorePosts({
                ...params,
                page: pageParam as number,
                limit: params.limit ?? 12,
            });
        },
        initialPageParam: startPage,
        getNextPageParam: (lastPage, allPages) => {
            if (allPages.length >= maxPages) {
                return undefined;
            }
            const totalPages = lastPage.totalPages || Math.ceil((lastPage.total || 0) / (lastPage.limit || 12));
            if (lastPage.page < totalPages) {
                return lastPage.page + 1;
            }
            return undefined;
        },
    });
};

export const useLikePost = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (postId: string) => agencyService.likePost(postId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["explore-posts"] });
            queryClient.invalidateQueries({ queryKey: ["explore-posts-infinite"] });
            queryClient.invalidateQueries({ queryKey: ["posts"] });
            queryClient.invalidateQueries({ queryKey: ["liked-posts"] });
            queryClient.invalidateQueries({ queryKey: ["agency-public-posts"] });
        },
    });
};
