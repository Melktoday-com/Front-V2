'use client';

import { useState } from 'react';
import { PropertyCard } from '@/components/ui/PropertyCard';
import { TemporaryRentCard } from '@/components/ui/TemporaryRentCard';
import { useFavorites, useToggleSaveAd, useToggleSaveTemporaryRent } from '@/hooks/useFavorites';
import { Bookmark, Building2, Calendar, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

type FilterTab = 'ALL' | 'AD' | 'TEMPORARY_RENT';

const TABS: { id: FilterTab; label: string; icon: typeof Building2 }[] = [
    { id: 'ALL', label: 'همه', icon: Bookmark },
    { id: 'AD', label: 'آگهی‌های خرید و رهن', icon: Building2 },
    { id: 'TEMPORARY_RENT', label: 'اجاره روزانه و موقت', icon: Calendar },
];

export default function FavoritesPage() {
    const [selectedTab, setSelectedTab] = useState<FilterTab>('ALL');

    const { favorites, isLoading } = useFavorites(selectedTab);
    const toggleSaveAdMutation = useToggleSaveAd();
    const toggleSaveTempMutation = useToggleSaveTemporaryRent();

    const filteredItems = favorites.filter((item) => {
        if (selectedTab === 'ALL') return true;
        return item.type === selectedTab;
    });

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-500 font-medium">در حال بارگذاری ذخیره‌ها...</p>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto px-4 py-8 pb-32">
            <header className="mb-6">
                <h1 className="text-2xl font-black text-brand mb-2">نشان‌شده‌ها و ذخیره‌ها</h1>
                <p className="text-sm text-gray-500">
                    آگهی‌ها و واحدهای اقامتی که ذخیره کرده‌اید.
                </p>
            </header>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 mb-8 border-b border-gray-100 pb-3 overflow-x-auto no-scrollbar">
                {TABS.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = selectedTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setSelectedTab(tab.id)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0",
                                isActive
                                    ? "bg-brand text-white shadow-xs"
                                    : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                            )}
                        >
                            <Icon className="w-4 h-4" />
                            <span>{tab.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Items Grid / Empty State */}
            {filteredItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[350px] gap-6 px-4 text-center bg-gray-50/50 rounded-3xl border border-gray-100/80 p-8">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-xs border border-gray-100">
                        <Heart className="w-10 h-10 text-gray-300" />
                    </div>
                    <div>
                        <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-2">
                            {selectedTab === 'ALL'
                                ? 'هنوز موردی ذخیره نکرده‌اید'
                                : selectedTab === 'AD'
                                ? 'هیچ آگهی ملکی ذخیره نشده است'
                                : 'هیچ اقامتگاه موقتی ذخیره نشده است'}
                        </h2>
                        <p className="text-xs sm:text-sm text-gray-500 max-w-sm leading-relaxed">
                            با کلیک روی آیکون قلب در کارت‌های آگهی، موارد دلخواهتان را ذخیره کنید تا در این بخش سریع به آنها دسترسی داشته باشید.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredItems.map((item) => {
                        if (item.type === 'TEMPORARY_RENT') {
                            return (
                                <TemporaryRentCard
                                    key={`temp-${item.id}`}
                                    id={item.referenceId || item.id}
                                    title={item.title}
                                    nightlyPrice={Number(item.details?.nightlyPrice || item.details?.price || 0)}
                                    location={item.subtitle || 'نامشخص'}
                                    imageUrl={item.imageUrl}
                                    rating={4.9}
                                    maxGuests={typeof item.details?.maxGuests === 'number' ? item.details.maxGuests : undefined}
                                    rooms={typeof item.details?.rooms === 'number' ? item.details.rooms : undefined}
                                    isSaved={true}
                                    onToggleSave={(id) => toggleSaveTempMutation.mutateAsync(id)}
                                    className="bg-white rounded-2xl border border-gray-100 shadow-xs hover:shadow-md transition-shadow"
                                />
                            );
                        }

                        return (
                            <PropertyCard
                                key={`ad-${item.id}`}
                                adId={item.referenceId || item.id}
                                title={item.title}
                                image={item.imageUrl || '/property-placeholder.svg'}
                                price={item.details?.price?.toString() || 'توافقی'}
                                category={item.details?.category || 'آگهی'}
                                location={item.subtitle || 'نامشخص'}
                                rating={4.8}
                                variant="vertical"
                                className="bg-white rounded-2xl border border-gray-100 shadow-xs hover:shadow-md transition-shadow"
                                isSaved={true}
                                onToggleSave={(id) => toggleSaveAdMutation.mutateAsync(id)}
                            />
                        );
                    })}
                </div>
            )}
        </div>
    );
}
