import apiClient from "@/lib/api/client";
import { JsonValue } from "@/types/common";

export type FavoriteItemType = 'AD' | 'NOTIFICATION';

export interface FavoriteItemDetails {
    price?: number | string;
    category?: string;
    actionUrl?: string;
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
    details?: FavoriteItemDetails;
}

export const favoritesService = {
    async getFavorites(): Promise<FavoriteItem[]> {
        const response = await apiClient.get<FavoriteItem[]>("/favorites");
        return response.data;
    },

    async toggleFavorite(adId: string): Promise<{ isFavorited: boolean }> {
        const response = await apiClient.post<{ isFavorited: boolean }>(`/favorites/ads/${adId}/toggle`);
        return response.data;
    }
};
