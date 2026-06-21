import { geoService } from "@/services/geo.service";
import { useQuery } from "@tanstack/react-query";

export const useGeoHierarchy = () => {
    return useQuery({
        queryKey: ["geo-hierarchy"],
        queryFn: async () => {
            const data = await geoService.getProvincesHierarchy();
            return data.provinces;
        },
        staleTime: 1000 * 60 * 60, // 1 hour cache
    });
};
