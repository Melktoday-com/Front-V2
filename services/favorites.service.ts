import apiClient from "@/lib/api/client";
import { JsonValue } from "@/types/common";

export type FavoriteItemType = 'AD' | 'TEMPORARY_RENT';

export interface FavoriteItemDetails {
    price?: number | string;
    nightlyPrice?: number;
    category?: string;
    actionUrl?: string;
    location?: string;
    rooms?: number;
    maxGuests?: number;
    [key: string]: JsonValue | undefined;
}

export interface FavoriteItem {
    id: string;
    type: FavoriteItemType;
    title: string;
    subtitle?: string;
    imageUrl?: string;
    referenceId?: string;
    timestamp: string;
    isSaved: boolean;
    details?: FavoriteItemDetails;
}

export const favoritesService = {
    async getFavorites(type?: 'AD' | 'TEMPORARY_RENT' | 'ALL'): Promise<FavoriteItem[]> {
        const response = await apiClient.get<FavoriteItem[]>("/favorites", {
            params: type && type !== 'ALL' ? { type } : undefined,
        });
        return response.data;
    },

    async toggleSaveAd(adId: string): Promise<{ isSaved: boolean }> {
        const response = await apiClient.post<{ isSaved: boolean }>(`/favorites/ads/${adId}/toggle`);
        return response.data;
    },

    async toggleSaveTemporaryRent(temporaryRentAdId: string): Promise<{ isSaved: boolean }> {
        const response = await apiClient.post<{ isSaved: boolean }>(`/favorites/temporary-rent/${temporaryRentAdId}/toggle`);
        return response.data;
    },

    // Backward-compatible alias
    async toggleFavorite(adId: string): Promise<{ isFavorited: boolean; isSaved: boolean }> {
        const res = await this.toggleSaveAd(adId);
        return { isFavorited: res.isSaved, isSaved: res.isSaved };
    }
};
