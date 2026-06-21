import apiClient from "@/lib/api/client";
import { ListZonesResponse } from "@/types/api/geo.types";

export const geoService = {
    async listZones(parentId?: string): Promise<ListZonesResponse> {
        const response = await apiClient.get<ListZonesResponse>("/geo/zones", {
            params: { parentId },
        });
        return response.data;
    },
};
