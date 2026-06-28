import { FavoriteItem, favoritesService } from '@/services/favorites.service';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from './useAuth';

export const useFavorites = () => {
    const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { user } = useAuth();

    const fetchFavorites = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const data = await favoritesService.getFavorites();
            setFavorites(data);
        } catch (error) {
            console.error('Failed to fetch favorites:', error);
            toast.error('خطا در دریافت علاقه‌مندی‌ها');
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    const toggleFavorite = async (adId: string) => {
        if (!user) {
            toast.error('لطفا ابتدا وارد حساب کاربری خود شوید');
            return;
        }
        try {
            const { isFavorited } = await favoritesService.toggleFavorite(adId);
            if (isFavorited) {
                toast.success('آگهی به علاقه‌مندی‌ها اضافه شد');
            } else {
                toast.success('آگهی از علاقه‌مندی‌ها حذف شد');
            }
            // Optionally re-fetch favorites if we are on the favorites page
            return isFavorited;
        } catch (error) {
            console.error('Failed to toggle favorite:', error);
            toast.error('خطا در بروزرسانی علاقه‌مندی‌ها');
            throw error;
        }
    };

    return {
        favorites,
        isLoading,
        fetchFavorites,
        toggleFavorite,
    };
};
