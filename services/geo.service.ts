import apiClient from "@/lib/api/client";
import { GeoHierarchyResponse, ListZonesResponse } from "@/types/api/geo.types";

export const geoService = {
    async listZones(parentId?: string): Promise<ListZonesResponse> {
        const response = await apiClient.get<ListZonesResponse>("/geo/zones", {
            params: { parentId },
        });
        return response.data;
    },

    async getProvincesHierarchy(): Promise<GeoHierarchyResponse> {
        const response = await apiClient.get<GeoHierarchyResponse>("/geo/provinces");
        return response.data;
    },
};
