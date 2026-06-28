'use client';

import { PropertyCard } from '@/components/ui/PropertyCard';
import { useFavorites } from '@/hooks/useFavorites';
import { Bell, Clock, Heart } from 'lucide-react';
import { useEffect } from 'react';

const NotificationItem = ({ item }: { item: any }) => (
    <div className="flex gap-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-1 h-full bg-blue-500 rounded-l-full" />
        <div className="shrink-0 w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
            <Bell className="w-6 h-6 text-blue-500" />
        </div>
        <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start mb-1">
                <h3 className="text-sm font-bold text-gray-900 truncate">{item.title}</h3>
                <div className="flex items-center gap-1 text-[10px] text-gray-400">
                    <Clock className="w-3 h-3" />
                    {new Date(item.timestamp).toLocaleDateString('fa-IR')}
                </div>
            </div>
            <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                {item.subtitle}
            </p>
            {item.details?.actionUrl && (
                <a
                    href={item.details.actionUrl}
                    className="inline-block mt-2 text-[10px] font-bold text-blue-600 hover:text-blue-700 transition-colors"
                >
                    مشاهده جزئیات
                </a>
            )}
        </div>
    </div>
);

export default function FavoritesPage() {
    const { favorites, isLoading, fetchFavorites, toggleFavorite } = useFavorites();

    useEffect(() => {
        fetchFavorites();
    }, [fetchFavorites]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-500">در حال بارگذاری علاقه‌مندی‌ها...</p>
            </div>
        );
    }

    if (favorites.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-6 px-4 text-center">
                <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center">
                    <Heart className="w-12 h-12 text-gray-300" />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-gray-900 mb-2">هنوز چیزی اضافه نکرده‌اید</h2>
                    <p className="text-sm text-gray-500 max-w-xs">
                        آگهی‌های مورد علاقه و اعلان‌های مهم شما در این بخش نمایش داده می‌شوند.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <header className="mb-8">
                <h1 className="text-2xl font-black text-brand mb-2">علاقه‌مندی‌ها و تعاملات</h1>
                <p className="text-sm text-gray-500">لیست ترکیبی از آگهی‌های ذخیره شده و اعلان‌هایی که با آن‌ها تعامل داشته‌اید.</p>
            </header>

            <div className="grid gap-6">
                {favorites.map((item) => (
                    <div key={`${item.type}-${item.id}`}>
                        {item.type === 'AD' ? (
                            <PropertyCard
                                adId={item.referenceId}
                                title={item.title}
                                image={item.imageUrl || '/images/placeholder.jpg'}
                                price={item.details?.price?.toString() || '0'}
                                category={item.details?.category || 'آگهی'}
                                location={item.subtitle || 'نامشخص'}
                                rating={4.5} // Placeholder
                                variant="horizontal"
                                className="bg-white p-2 rounded-xl border border-gray-100 shadow-sm"
                                isFavorited={true}
                                onToggleFavorite={async (id) => { await toggleFavorite(id); }}
                            />
                        ) : (
                            <NotificationItem item={item} />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}


