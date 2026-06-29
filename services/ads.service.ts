import apiClient from "@/lib/api/client";
import {
    AdContactInfo,
    AdDetail,
    AdMutationResponse,
    CategoryListItem,
    CreateAdDraftRequest,
    EditAdRequest,
    ListAdsQuery,
    PaginatedAdsResponse,
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
    },

    async createDraft(data: CreateAdDraftRequest): Promise<AdMutationResponse> {
        const response = await apiClient.post<AdMutationResponse>("/ads", data);
        return response.data;
    },

    async update(adId: string, data: EditAdRequest): Promise<AdMutationResponse> {
        const response = await apiClient.patch<AdMutationResponse>(`/ads/${adId}`, data);
        return response.data;
    },

    async submitForReview(adId: string): Promise<AdMutationResponse> {
        const response = await apiClient.post<AdMutationResponse>(`/ads/${adId}/submit`);
        return response.data;
    },

    async delete(adId: string): Promise<void> {
        await apiClient.delete(`/ads/${adId}`);
    },

    async archive(adId: string): Promise<AdMutationResponse> {
        const response = await apiClient.post<AdMutationResponse>(`/ads/${adId}/archive`);
        return response.data;
    },

    async listMyAds(query: { page?: number; limit?: number } = {}): Promise<PaginatedAdsResponse> {
        const response = await apiClient.get<PaginatedAdsResponse>("/ads/my", {
            params: query,
        });
        return response.data;
    }
};
