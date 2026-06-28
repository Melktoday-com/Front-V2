import apiClient from "@/lib/api/client";

export type FavoriteItemType = 'AD' | 'NOTIFICATION';

export interface FavoriteItem {
    id: string;
    type: FavoriteItemType;
    title: string;
    subtitle?: string;
    imageUrl?: string;
    referenceId?: string;
    timestamp: string;
    details?: Record<string, any>;
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
