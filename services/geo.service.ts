import apiClient from "@/lib/api/client";
import {
    FindZoneByPointParams,
    GeoHierarchyResponse,
    GetGeoHierarchyParams,
    ListZonesParams,
    ListZonesResponse,
    PaginatedCitiesResponse,
    PaginatedProvincesResponse,
    UpdateZoneStatusResponse,
    ZonePointResponse
} from "@/types/api/geo.types";

export const geoService = {
    async findZoneByPoint(params: FindZoneByPointParams): Promise<ZonePointResponse | null> {
        const response = await apiClient.post<ZonePointResponse | null>("/geo/zones/by-point", params);
        return response.data;
    },

    async listZones(params?: ListZonesParams | string): Promise<ListZonesResponse> {
        const queryParams = typeof params === 'string' ? { parentId: params } : params;
        const response = await apiClient.get<ListZonesResponse>("/geo/zones", {
            params: queryParams,
        });
        return response.data;
    },

    async getProvincesHierarchy(params?: GetGeoHierarchyParams): Promise<GeoHierarchyResponse> {
        const response = await apiClient.get<GeoHierarchyResponse>("/geo/hierarchy", { params });
        return response.data;
    },

    async listProvinces(params?: { page?: number; limit?: number; status?: string; search?: string }): Promise<PaginatedProvincesResponse> {
        const response = await apiClient.get<PaginatedProvincesResponse>("/geo/provinces", { params });
        return response.data;
    },

    async listCities(params?: { page?: number; limit?: number; provinceId?: number; status?: string; search?: string }): Promise<PaginatedCitiesResponse> {
        const response = await apiClient.get<PaginatedCitiesResponse>("/geo/cities", { params });
        return response.data;
    },

    async updateZoneStatus(id: string, status: string): Promise<UpdateZoneStatusResponse> {
        const response = await apiClient.put<UpdateZoneStatusResponse>(`/geo/admin/zones/${id}/status`, { status });
        return response.data;
    },
};
