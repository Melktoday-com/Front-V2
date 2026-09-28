'use client';

import { PropertyCard } from '@/components/ui/PropertyCard';
import { useFavorites } from '@/hooks/useFavorites';
import { Heart } from 'lucide-react';
import { useEffect } from 'react';

export default function FavoritesPage() {
    const { favorites, isLoading, fetchFavorites, toggleFavorite } = useFavorites();

    useEffect(() => {
        fetchFavorites();
    }, [fetchFavorites]);

    const adItems = favorites.filter((item) => item.type === 'AD');

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-500">در حال بارگذاری علاقه‌مندی‌ها...</p>
            </div>
        );
    }

    if (adItems.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-6 px-4 text-center">
                <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center">
                    <Heart className="w-12 h-12 text-gray-300" />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-gray-900 mb-2">هنوز آگهی‌ای ذخیره نکرده‌اید</h2>
                    <p className="text-sm text-gray-500 max-w-xs">
                        آگهی‌های مورد علاقه‌تان را ذخیره کنید تا اینجا نمایش داده شوند.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 pb-32">
            <header className="mb-8">
                <h1 className="text-2xl font-black text-brand mb-2">علاقه‌مندی‌ها</h1>
                <p className="text-sm text-gray-500">آگهی‌هایی که ذخیره کرده‌اید.</p>
            </header>

            <div className="grid gap-6">
                {adItems.map((item) => (
                    <PropertyCard
                        key={`ad-${item.id}`}
                        adId={item.referenceId}
                        title={item.title}
                        image={item.imageUrl || '/assets/images/property-placeholder.png'}
                        price={item.details?.price?.toString() || '0'}
                        category={item.details?.category || 'آگهی'}
                        location={item.subtitle || 'نامشخص'}
                        rating={4.5}
                        variant="horizontal"
                        className="bg-white p-2 rounded-xl border border-gray-100 shadow-sm"
                        isFavorited={true}
                        onToggleFavorite={async (id) => { await toggleFavorite(id); }}
                    />
                ))}
            </div>
        </div>
    );
}
