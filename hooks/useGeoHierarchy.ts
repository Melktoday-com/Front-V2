import { geoService } from "@/services/geo.service";
import { GetGeoHierarchyParams } from "@/types/api/geo.types";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

export const useGeoHierarchy = (params?: GetGeoHierarchyParams) => {
    return useQuery({
        queryKey: ["geo-hierarchy", params],
        queryFn: async () => {
            const data = await geoService.getProvincesHierarchy(params);
            return data.provinces;
        },
        staleTime: 1000 * 60 * 60, // 1 hour cache
    });
};

export const useInfiniteGeoHierarchy = (options?: { search?: string; limit?: number }) => {
    const search = options?.search;
    const limit = options?.limit ?? 6;

    return useInfiniteQuery({
        queryKey: ["geo-hierarchy-infinite", search, limit],
        queryFn: async ({ pageParam = 1 }) => {
            return await geoService.getProvincesHierarchy({
                page: pageParam as number,
                limit,
                search: search?.trim() || undefined,
            });
        },
        initialPageParam: 1,
        getNextPageParam: (lastPage) => {
            if (!lastPage?.page || !lastPage?.totalPages) return undefined;
            return lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined;
        },
        staleTime: 1000 * 60 * 30,
    });
};
