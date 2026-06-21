import apiClient from "@/lib/api/client";
import {
    AdContactInfo,
    AdDetail,
    ListAdsQuery,
    PaginatedAdsResponse,
    CategoryListItem,
} from "@/types/api/ads.types";

export const adsService = {
    async list(query: ListAdsQuery): Promise<PaginatedAdsResponse> {
        const response = await apiClient.get<PaginatedAdsResponse>("/ads", {
            params: query,
        });
        return response.data;
    },

    async getById(adId: string): Promise<AdDetail> {
        const response = await apiClient.get<AdDetail>(`/ads/${adId}`);
        return response.data;
    },

    async getContactInfo(adId: string): Promise<AdContactInfo> {
        const response = await apiClient.get<AdContactInfo>(`/ads/${adId}/contact`);
        return response.data;
    },

    async listCategories(): Promise<CategoryListItem[]> {
        const response = await apiClient.get<{ categories: CategoryListItem[] }>("/ads/categories");
        return response.data.categories;
    }
};
