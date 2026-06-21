import { geoService } from "@/services/geo.service";
import { useQuery } from "@tanstack/react-query";

export const useZones = (parentId?: string) => {
    return useQuery({
        queryKey: ["zones", parentId],
        queryFn: () => geoService.listZones(parentId),
        enabled: parentId !== undefined && parentId !== ""
    });
};
