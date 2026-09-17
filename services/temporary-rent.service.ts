import apiClient from "@/lib/api/client";
import { PaginatedResponse } from "@/types/api/ads.types";
import {
    CreateTemporaryRentDraftRequest,
    TemporaryRentAd,
    TemporaryRentCategory,
    TemporaryRentContactInfo,
    TemporaryRentMutationResponse,
    TemporaryRentSubcategoryConfigResponse,
} from "@/types/api/temporary-rent.types";

export interface TemporaryRentAdSummary {
    id: string;
    ownerId: string;
    cityId: string;
    cityName?: string;
    status: string;
    title: string;
    pricing: {
        nightlyPrice: number;
    };
    mediaIds?: string[];
    createdAt: string;
    maxGuests?: number;
}

export interface ListTemporaryRentQuery {
    ownerId?: string;
    status?: string;
    cityId?: string;
    page?: number;
    limit?: number;
}

export const temporaryRentService = {
    async list(query: ListTemporaryRentQuery): Promise<PaginatedResponse<TemporaryRentAdSummary>> {
        const response = await apiClient.get<PaginatedResponse<TemporaryRentAdSummary>>("/temporary-rent", {
            params: query,
        });
        return response.data;
    },

    async getById(id: string): Promise<TemporaryRentAd> {
        const response = await apiClient.get<TemporaryRentAd>(`/temporary-rent/${id}`);
        return response.data;
    },

    async getContactInfo(id: string): Promise<TemporaryRentContactInfo> {
        const response = await apiClient.get<TemporaryRentContactInfo>(`/temporary-rent/${id}/contact`);
        return response.data;
    },

    async createDraft(data: CreateTemporaryRentDraftRequest): Promise<TemporaryRentMutationResponse> {
        const response = await apiClient.post<TemporaryRentMutationResponse>("/temporary-rent/drafts", data);
        return response.data;
    },

    async publish(id: string): Promise<TemporaryRentMutationResponse> {
        const response = await apiClient.post<TemporaryRentMutationResponse>(`/temporary-rent/${id}/publish`);
        return response.data;
    },

    async listCategories(): Promise<TemporaryRentCategory[]> {
        const response = await apiClient.get<{ categories: TemporaryRentCategory[] } | TemporaryRentCategory[]>("/temporary-rent/categories");
        const payload = response.data;
        if (Array.isArray(payload)) {
            return payload;
        }
        if (payload && Array.isArray((payload as { categories: TemporaryRentCategory[] }).categories)) {
            return (payload as { categories: TemporaryRentCategory[] }).categories;
        }
        return [];
    },

    async getSubcategoryConfig(subcategoryId: string, categoryKey?: string): Promise<TemporaryRentSubcategoryConfigResponse> {
        const response = await apiClient.get<TemporaryRentSubcategoryConfigResponse>(`/temporary-rent/subcategories/${subcategoryId}/config`, {
            params: categoryKey ? { categoryKey } : undefined,
        });
        return response.data;
    },

    async delete(adId: string): Promise<void> {
        await apiClient.delete(`/temporary-rent/${adId}`);
    }
};
