import apiClient from "@/lib/api/client";
import { GeoHierarchyResponse, ListZonesParams, ListZonesResponse } from "@/types/api/geo.types";

export const geoService = {
    async listZones(params?: ListZonesParams | string): Promise<ListZonesResponse> {
        const queryParams = typeof params === 'string' ? { parentId: params } : params;
        const response = await apiClient.get<ListZonesResponse>("/geo/zones", {
            params: queryParams,
        });
        return response.data;
    },

    async getProvincesHierarchy(): Promise<GeoHierarchyResponse> {
        const response = await apiClient.get<GeoHierarchyResponse>("/geo/hierarchy");
        return response.data;
    },

    async listProvinces(params?: { page?: number; limit?: number; status?: string; search?: string }): Promise<any> {
        const response = await apiClient.get("/geo/provinces", { params });
        return response.data;
    },

    async listCities(params?: { page?: number; limit?: number; provinceId?: number; status?: string; search?: string }): Promise<any> {
        const response = await apiClient.get("/geo/cities", { params });
        return response.data;
    },

    async updateZoneStatus(id: string, status: string): Promise<any> {
        const response = await apiClient.put(`/geo/admin/zones/${id}/status`, { status });
        return response.data;
    },
};
