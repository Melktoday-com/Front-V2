import { geoService } from "@/services/geo.service";
import { useQuery } from "@tanstack/react-query";

export const useZones = (parentId?: string) => {
    return useQuery({
        queryKey: ["zones", parentId],
        queryFn: () => geoService.listZones(parentId),
        enabled: parentId !== undefined && parentId !== ""
    });
};

export const useCities = (params?: { page?: number; limit?: number; provinceId?: number; status?: string; search?: string }) => {
    return useQuery({
        queryKey: ["cities", params],
        queryFn: () => geoService.listCities(params)
    });
};
