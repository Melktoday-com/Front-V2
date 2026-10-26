import apiClient from "@/lib/api/client";
import type {
    FavoriteItem,
    FavoriteItemDetails,
    FavoriteItemType,
} from "@/types/api/favorites.types";

export type { FavoriteItem, FavoriteItemDetails, FavoriteItemType };

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
