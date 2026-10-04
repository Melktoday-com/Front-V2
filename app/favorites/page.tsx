'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { PropertyCard } from '@/components/ui/PropertyCard';
import { TemporaryRentCard } from '@/components/ui/TemporaryRentCard';
import { LikedPostCard } from '@/components/ui/LikedPostCard';
import {
    useFavorites,
    useLikedPosts,
    useToggleLikePost,
    useToggleSaveAd,
    useToggleSaveTemporaryRent,
} from '@/hooks/useFavorites';
import { useAuth } from '@/hooks/useAuth';
import { UnifiedPost } from '@/types/api/post.types';
import {
    Bookmark,
    Building2,
    Calendar,
    Eye,
    Heart,
    Share2,
    Sparkles,
    X,
} from 'lucide-react';
import { cn, toPersianDigits, getMediaUrl, getMediaPosterUrl } from '@/lib/utils';
import { toast } from 'sonner';

type FilterTab = 'ALL' | 'AD' | 'TEMPORARY_RENT' | 'POST';

const TABS: { id: FilterTab; label: string; icon: typeof Building2 }[] = [
    { id: 'ALL', label: 'همه', icon: Bookmark },
    { id: 'AD', label: 'آگهی‌های خرید و رهن', icon: Building2 },
    { id: 'TEMPORARY_RENT', label: 'اجاره روزانه و موقت', icon: Calendar },
    { id: 'POST', label: 'پست‌های پسندیده‌شده', icon: Heart },
];

export default function FavoritesPage() {
    const { isLoggedIn, isLoading: isAuthLoading } = useAuth();
    const router = useRouter();
    const [selectedTab, setSelectedTab] = useState<FilterTab>('ALL');
    const [readingPost, setReadingPost] = useState<UnifiedPost | null>(null);

    const { favorites, isLoading: isFavoritesLoading } = useFavorites(
        selectedTab === 'POST' ? undefined : selectedTab
    );
    const { posts: likedPosts, isLoading: isPostsLoading } = useLikedPosts();

    const toggleSaveAdMutation = useToggleSaveAd();
    const toggleSaveTempMutation = useToggleSaveTemporaryRent();
    const toggleLikePostMutation = useToggleLikePost();

    const filteredFavorites = favorites.filter((item) => {
        if (selectedTab === 'ALL') return true;
        return item.type === selectedTab;
    });

    const isCurrentLoading =
        selectedTab === 'POST'
            ? isPostsLoading
            : selectedTab === 'ALL'
            ? isFavoritesLoading || isPostsLoading
            : isFavoritesLoading;

    const hasAnyContent =
        selectedTab === 'POST'
            ? likedPosts.length > 0
            : selectedTab === 'ALL'
            ? filteredFavorites.length > 0 || likedPosts.length > 0
            : filteredFavorites.length > 0;

    const handleSharePost = (post: UnifiedPost) => {
        if (typeof window !== 'undefined' && navigator.clipboard) {
            const shareUrl = `${window.location.origin}/explore?post=${post.slug || post.id}`;
            navigator.clipboard.writeText(shareUrl).then(() => {
                toast.success('لینک پست با موفقیت کپی شد.');
            });
        }
    };

    if (isAuthLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-500 font-medium">در حال بررسی ورود...</p>
            </div>
        );
    }

    if (!isLoggedIn) {
        return (
            <div className="max-w-md mx-auto px-4 py-20 text-center space-y-6">
                <div className="w-20 h-20 rounded-full bg-soft-bg mx-auto flex items-center justify-center text-brand">
                    <Bookmark className="w-10 h-10 opacity-70" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-black text-brand">ورود به حساب کاربری</h2>
                    <p className="text-sm text-gray-500 font-medium leading-relaxed">
                        برای مشاهده آگهی‌های ذخیره‌شده و پست‌های پسندیده‌شده، لطفاً ابتدا وارد حساب کاربری خود شوید.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => router.push("/auth?redirect=/favorites")}
                    className="w-full h-12 rounded-2xl bg-brand text-white font-bold hover:bg-brand/90 transition-all shadow-md active:scale-98 cursor-pointer"
                >
                    ورود به حساب کاربری
                </button>
            </div>
        );
    }

    if (isCurrentLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-500 font-medium">در حال بارگذاری موارد مورد علاقه...</p>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto px-4 py-8 pb-32">
            <header className="mb-6">
                <h1 className="text-2xl font-black text-brand mb-2">علاقه‌مندی‌ها و نشان‌شده‌ها</h1>
                <p className="text-sm text-gray-500">
                    آگهی‌ها و اقامتگاه‌های ذخیره‌شده و پست‌هایی که پسندیده‌اید.
                </p>
            </header>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 mb-8 border-b border-gray-100 pb-3 overflow-x-auto no-scrollbar">
                {TABS.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = selectedTab === tab.id;
                    const count =
                        tab.id === 'ALL'
                            ? favorites.length + likedPosts.length
                            : tab.id === 'AD'
                            ? favorites.filter((f) => f.type === 'AD').length
                            : tab.id === 'TEMPORARY_RENT'
                            ? favorites.filter((f) => f.type === 'TEMPORARY_RENT').length
                            : likedPosts.length;

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
                            {count > 0 && (
                                <span
                                    className={cn(
                                        "px-1.5 py-0.5 rounded-full text-[10px] font-bold",
                                        isActive ? "bg-white/20 text-white" : "bg-gray-200 text-gray-700"
                                    )}
                                >
                                    {toPersianDigits(count)}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Empty State */}
            {!hasAnyContent ? (
                <div className="flex flex-col items-center justify-center min-h-[350px] gap-6 px-4 text-center bg-gray-50/50 rounded-3xl border border-gray-100/80 p-8">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-xs border border-gray-100">
                        <Heart className="w-10 h-10 text-gray-300" />
                    </div>
                    <div>
                        <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-2">
                            {selectedTab === 'ALL'
                                ? 'هنوز موردی ذخیره یا پسند نکرده‌اید'
                                : selectedTab === 'AD'
                                ? 'هیچ آگهی ملکی ذخیره نشده است'
                                : selectedTab === 'TEMPORARY_RENT'
                                ? 'هیچ اقامتگاه موقتی ذخیره نشده است'
                                : 'هیچ پستی را پسند نکرده‌اید'}
                        </h2>
                        <p className="text-xs sm:text-sm text-gray-500 max-w-sm leading-relaxed">
                            {selectedTab === 'POST'
                                ? 'با کلیک روی آیکون قلب در مقالات و فید کاوش، محتواهای مفید را پسند کنید تا اینجا ذخیره شوند.'
                                : 'با کلیک روی آیکون قلب در کارت‌های آگهی، موارد دلخواهتان را نشان کنید تا در این بخش سریع به آنها دسترسی داشته باشید.'}
                        </p>
                    </div>
                </div>
            ) : (
                <div className="space-y-12">
                    {/* 1. Saved Ads Section (Shown on ALL, AD, TEMPORARY_RENT) */}
                    {selectedTab !== 'POST' && filteredFavorites.length > 0 && (
                        <section className="space-y-4">
                            {selectedTab === 'ALL' && likedPosts.length > 0 && (
                                <div className="flex items-center justify-between">
                                    <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                                        <Bookmark className="w-4 h-4 text-brand" />
                                        آگهی‌ها و اقامتگاه‌های نشان‌شده
                                        <span className="text-xs text-gray-400 font-normal">
                                            ({toPersianDigits(filteredFavorites.length)})
                                        </span>
                                    </h2>
                                </div>
                            )}

                            <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                {filteredFavorites.map((item) => {
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
                        </section>
                    )}

                    {/* 2. Liked Posts Section (Shown on ALL and POST) */}
                    {(selectedTab === 'ALL' || selectedTab === 'POST') && likedPosts.length > 0 && (
                        <section className="space-y-4">
                            {selectedTab === 'ALL' && filteredFavorites.length > 0 && (
                                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                    <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                                        <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                                        پست‌های پسندیده‌شده
                                        <span className="text-xs text-gray-400 font-normal">
                                            ({toPersianDigits(likedPosts.length)})
                                        </span>
                                    </h2>
                                </div>
                            )}

                            <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                {likedPosts.map((post) => (
                                    <LikedPostCard
                                        key={`post-${post.id}`}
                                        id={post.id}
                                        title={post.title}
                                        summary={post.summary}
                                        content={post.content}
                                        category={post.category}
                                        imageUrl={
                                            post.mediaIds?.[0]
                                                ? getMediaPosterUrl(post.mediaIds[0])
                                                : post.mediaUrls?.[0]
                                        }
                                        publisherType={post.publisherType}
                                        publisherName={post.publisher?.name}
                                        publisherLogo={post.publisher?.logoUrl}
                                        publisherId={post.publisherId}
                                        isVerified={post.publisher?.isVerified ?? true}
                                        likeCount={post.likeCount}
                                        viewCount={post.viewCount}
                                        createdAt={post.createdAt}
                                        hasLiked={true}
                                        onToggleLike={(postId) => toggleLikePostMutation.mutateAsync(postId)}
                                        onClick={() => setReadingPost(post)}
                                    />
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            )}

            {/* ── MODAL: READ FULL LIKED POST ────────────────────────────── */}
            {readingPost && (
                <div
                    className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
                    onClick={() => setReadingPost(null)}
                >
                    <div
                        className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative border border-gray-100 my-6 max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close button */}
                        <button
                            type="button"
                            onClick={() => setReadingPost(null)}
                            className="absolute top-5 left-5 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {/* Category & Publisher Header */}
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-brand/10 text-brand">
                                {readingPost.category || 'پست تخصصی'}
                            </span>
                            <span className="text-xs text-gray-400">
                                {readingPost.publisher?.name || (
                                    readingPost.publisherType === 'PLATFORM'
                                        ? 'ملک‌تودی رسمی'
                                        : readingPost.publisherType === 'AGENCY'
                                        ? 'دفتر املاک'
                                        : 'میزبان اقامتگاه'
                                )}
                            </span>
                        </div>

                        {/* Title */}
                        <h2 className="text-xl sm:text-2xl font-black text-gray-900 leading-snug">
                            {readingPost.title}
                        </h2>

                        {/* Summary */}
                        {readingPost.summary && (
                            <div className="p-4 bg-gray-50 rounded-2xl text-gray-600 text-sm leading-relaxed border-r-4 border-brand">
                                {readingPost.summary}
                            </div>
                        )}

                        {/* Media gallery */}
                        {(() => {
                            const items =
                                readingPost.mediaIds && readingPost.mediaIds.length > 0
                                    ? readingPost.mediaIds
                                    : (readingPost.mediaUrls || []);
                            if (items.length === 0) return null;
                            return (
                                <div className="space-y-3">
                                    {items.map((item, i) => {
                                        const isVideo =
                                            typeof item === "object"
                                                ? item.type === "VIDEO"
                                                : item.endsWith(".mp4") || item.includes("/video");
                                        const url = getMediaUrl(item);
                                        const poster = getMediaPosterUrl(item);

                                        if (isVideo) {
                                            return (
                                                <div key={i} className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 border border-gray-200">
                                                    <video
                                                        src={url}
                                                        poster={poster}
                                                        controls
                                                        playsInline
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            );
                                        }

                                        return (
                                            <div key={i} className="relative aspect-video w-full rounded-2xl overflow-hidden bg-gray-100 border border-gray-200">
                                                <Image
                                                    src={url}
                                                    alt={`تصویر ${i + 1}`}
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })()}

                        {/* Content */}
                        <div className="text-gray-700 text-sm sm:text-base leading-loose whitespace-pre-line font-normal space-y-3">
                            {readingPost.content}
                        </div>

                        {/* Stats & Actions Footer */}
                        <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                            <div className="flex items-center gap-4">
                                <button
                                    type="button"
                                    onClick={async () => {
                                        await toggleLikePostMutation.mutateAsync(readingPost.id);
                                        setReadingPost((prev) => {
                                            if (!prev) return null;
                                            const nextLiked = !prev.hasLiked;
                                            return {
                                                ...prev,
                                                hasLiked: nextLiked,
                                                likeCount: nextLiked
                                                    ? prev.likeCount + 1
                                                    : Math.max(0, prev.likeCount - 1),
                                            };
                                        });
                                    }}
                                    className={cn(
                                        "flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all active:scale-95",
                                        readingPost.hasLiked
                                            ? "bg-red-500 text-white shadow-xs"
                                            : "bg-red-50 text-red-600 hover:bg-red-100"
                                    )}
                                    aria-label={readingPost.hasLiked ? "حذف پسند" : "پسندیدن"}
                                >
                                    <Heart
                                        className={cn(
                                            "w-4 h-4",
                                            readingPost.hasLiked
                                                ? "fill-white text-white"
                                                : "fill-red-500 text-red-500"
                                        )}
                                    />
                                    <span>{toPersianDigits(readingPost.likeCount || 0)} پسند</span>
                                </button>

                                <span className="flex items-center gap-1 text-gray-400">
                                    <Eye className="w-4 h-4" />
                                    <span>{toPersianDigits(readingPost.viewCount || 0)} بازدید</span>
                                </span>
                            </div>

                            <button
                                type="button"
                                onClick={() => handleSharePost(readingPost)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold transition-all"
                            >
                                <Share2 className="w-3.5 h-3.5" />
                                <span>اشتراک‌گذاری</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
