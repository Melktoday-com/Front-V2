import apiClient from "@/lib/api/client";
import { PaginatedResponse } from "@/types/api/ads.types";
import {
    CreateTemporaryRentDraftRequest,
    TemporaryRentAd,
    TemporaryRentContactInfo,
    TemporaryRentMutationResponse
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

    async listCategories(): Promise<any[]> {
        const response = await apiClient.get<{ categories: any[] }>("/temporary-rent/categories");
        return response.data.categories;
    },

    async getSubcategoryConfig(subcategoryId: string, categoryKey?: string): Promise<any> {
        const response = await apiClient.get<any>(`/temporary-rent/categories/subcategories/${subcategoryId}/config`, {
            params: categoryKey ? { categoryKey } : undefined,
        });
        return response.data;
    },

    async delete(adId: string): Promise<void> {
        await apiClient.delete(`/temporary-rent/${adId}`);
    }
};
