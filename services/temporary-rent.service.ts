import apiClient from "@/lib/api/client";
import { PaginatedResponse } from "@/types/api/ads.types";

export interface TemporaryRentAdSummary {
    id: string;
    ownerId: string;
    cityId: string;
    status: string;
    title: string;
    pricing: {
        nightlyPrice: number;
    };
    mediaIds?: string[];
    createdAt: string;
    guestCapacity?: number;
}

export interface ListTemporaryRentQuery {
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

    async getById(id: string): Promise<any> {
        const response = await apiClient.get<any>(`/temporary-rent/${id}`);
        return response.data;
    },

    async getContactInfo(id: string): Promise<any> {
        const response = await apiClient.get<any>(`/temporary-rent/${id}/contact`);
        return response.data;
    }
};
