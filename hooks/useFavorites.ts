import { favoritesService, FavoriteItemType } from '@/services/favorites.service';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from './useAuth';

/** Query key for the favorites list */
export const FAVORITES_QUERY_KEY = ['favorites'];

/**
 * Hook to fetch the user's favorites (AD, TEMPORARY_RENT, or ALL).
 * Returns the list, Sets of saved IDs, and O(1) lookup helpers.
 */
export const useFavorites = (type?: 'AD' | 'TEMPORARY_RENT' | 'ALL') => {
    const { isLoggedIn } = useAuth();

    const { data: favorites = [], isLoading, refetch } = useQuery({
        queryKey: [...FAVORITES_QUERY_KEY, type || 'ALL'],
        queryFn: () => favoritesService.getFavorites(type),
        enabled: isLoggedIn,
        staleTime: 30_000,
    });

    const savedAdIds = new Set(
        favorites
            .filter((f) => f.type === 'AD')
            .map((f) => f.referenceId ?? f.id),
    );

    const savedTemporaryRentIds = new Set(
        favorites
            .filter((f) => f.type === 'TEMPORARY_RENT')
            .map((f) => f.referenceId ?? f.id),
    );

    const isAdSaved = (adId: string) => savedAdIds.has(adId);
    const isTemporaryRentSaved = (id: string) => savedTemporaryRentIds.has(id);

    return {
        favorites,
        isLoading,
        refetch,
        savedAdIds,
        savedTemporaryRentIds,
        isAdSaved,
        isTemporaryRentSaved,
        // Backward-compatible aliases
        wishlistedAdIds: savedAdIds,
        isWishlisted: isAdSaved,
    };
};

/**
 * Mutation hook to toggle Save on a property ad.
 */
export const useToggleSaveAd = () => {
    const { isLoggedIn } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (adId: string) => {
            if (!isLoggedIn) {
                return Promise.reject(new Error('not_logged_in'));
            }
            return favoritesService.toggleSaveAd(adId);
        },
        onSuccess: (_data, adId) => {
            queryClient.invalidateQueries({ queryKey: FAVORITES_QUERY_KEY });
            queryClient.invalidateQueries({ queryKey: ['ads'] });
            queryClient.invalidateQueries({ queryKey: ['ad', adId] });
        },
        onError: (err: Error) => {
            if (err.message === 'not_logged_in') {
                toast.error('لطفاً ابتدا وارد حساب کاربری خود شوید');
            } else {
                toast.error('خطا در بروزرسانی ذخیره آگهی');
            }
        },
    });
};

/**
 * Mutation hook to toggle Save on a temporary rent ad.
 */
export const useToggleSaveTemporaryRent = () => {
    const { isLoggedIn } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (temporaryRentAdId: string) => {
            if (!isLoggedIn) {
                return Promise.reject(new Error('not_logged_in'));
            }
            return favoritesService.toggleSaveTemporaryRent(temporaryRentAdId);
        },
        onSuccess: (_data, temporaryRentAdId) => {
            queryClient.invalidateQueries({ queryKey: FAVORITES_QUERY_KEY });
            queryClient.invalidateQueries({ queryKey: ['temporary-rent-ads'] });
            queryClient.invalidateQueries({ queryKey: ['temporary-rent-ad', temporaryRentAdId] });
        },
        onError: (err: Error) => {
            if (err.message === 'not_logged_in') {
                toast.error('لطفاً ابتدا وارد حساب کاربری خود شوید');
            } else {
                toast.error('خطا در بروزرسانی ذخیره اقامتگاه');
            }
        },
    });
};

/**
 * Backward-compatible mutation hook (alias to useToggleSaveAd).
 */
export const useToggleFavorite = () => {
    return useToggleSaveAd();
};
