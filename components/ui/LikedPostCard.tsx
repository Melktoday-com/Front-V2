"use client";

import { useAuth } from "@/hooks/useAuth";
import { cn, toPersianDigits, getMediaUrl } from "@/lib/utils";
import { Building2, Eye, Heart, Sparkles, User, Verified } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { MouseEvent, useState } from "react";
import { toast } from "sonner";

export interface LikedPostCardProps {
    id: string;
    title: string;
    summary?: string;
    content: string;
    category?: string;
    imageUrl?: string;
    publisherType: 'PLATFORM' | 'HOST' | 'AGENCY';
    publisherName?: string;
    publisherLogo?: string;
    publisherId?: string;
    isVerified?: boolean;
    likeCount?: number;
    viewCount?: number;
    createdAt?: string;
    hasLiked?: boolean;
    onToggleLike?: (postId: string) => Promise<{ hasLiked: boolean; likeCount: number } | void> | void;
    onClick?: () => void;
    className?: string;
}

export function LikedPostCard({
    id,
    title,
    summary,
    content,
    category,
    imageUrl,
    publisherType,
    publisherName,
    publisherLogo,
    isVerified = true,
    likeCount = 0,
    viewCount = 0,
    createdAt,
    hasLiked = true,
    onToggleLike,
    onClick,
    className,
}: LikedPostCardProps) {
    const { isLoggedIn } = useAuth();
    const router = useRouter();
    const [isLikedState, setIsLikedState] = useState<boolean>(hasLiked);
    const [currentLikeCount, setCurrentLikeCount] = useState<number>(likeCount);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const effectivePublisherName = publisherName || (
        publisherType === 'PLATFORM'
            ? 'ملک‌تودی رسمی'
            : publisherType === 'AGENCY'
            ? 'دفتر املاک'
            : 'میزبان اقامتگاه'
    );

    const displayImage = imageUrl ? getMediaUrl(imageUrl) : '/property-placeholder.svg';

    const handleHeartClick = async (e: MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();

        if (!isLoggedIn) {
            toast.info('برای پسندیدن یا تغییر وضعیت پست، ابتدا وارد شوید.');
            if (typeof window !== 'undefined') {
                router.push(`/auth?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
            }
            return;
        }

        if (isSubmitting) return;

        const nextLikedState = !isLikedState;
        const nextLikeCount = nextLikedState
            ? currentLikeCount + 1
            : Math.max(0, currentLikeCount - 1);

        // Optimistic update
        setIsLikedState(nextLikedState);
        setCurrentLikeCount(nextLikeCount);
        setIsSubmitting(true);

        try {
            if (onToggleLike) {
                await onToggleLike(id);
            }
            if (!nextLikedState) {
                toast.success('از پست‌های پسندیده‌شده حذف شد');
            } else {
                toast.success('به پست‌های پسندیده‌شده افزوده شد');
            }
        } catch {
            // Revert on failure
            setIsLikedState(!nextLikedState);
            setCurrentLikeCount(currentLikeCount);
            toast.error('خطا در بروزرسانی وضعیت پسندیدن پست');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <article
            onClick={onClick}
            className={cn(
                "group relative flex flex-col bg-white rounded-2xl border border-gray-100 shadow-xs hover:shadow-md transition-all duration-300 overflow-hidden cursor-pointer",
                className
            )}
        >
            {/* Cover Image & Overlays */}
            <div className="relative aspect-[16/10] w-full overflow-hidden bg-gray-100">
                <Image
                    src={displayImage}
                    alt={title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

                {/* Top Actions: Category Badge & Like Button */}
                <div className="absolute top-3 inset-x-3 flex items-center justify-between z-10 pointer-events-none">
                    {category ? (
                        <span className="pointer-events-auto px-2.5 py-1 rounded-full text-xs font-bold bg-white/90 backdrop-blur-xs text-gray-800 shadow-xs">
                            {category}
                        </span>
                    ) : (
                        <span className="pointer-events-auto px-2.5 py-1 rounded-full text-xs font-bold bg-white/90 backdrop-blur-xs text-brand shadow-xs flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-brand" />
                            پست تخصصی
                        </span>
                    )}

                    <button
                        type="button"
                        onClick={handleHeartClick}
                        disabled={isSubmitting}
                        aria-label={isLikedState ? "حذف از پسندیده‌ها" : "پسندیدن"}
                        className={cn(
                            "pointer-events-auto w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm active:scale-90",
                            isLikedState
                                ? "bg-red-500 text-white shadow-red-500/25"
                                : "bg-white/90 backdrop-blur-xs text-gray-600 hover:text-red-500"
                        )}
                    >
                        <Heart
                            className={cn(
                                "w-4 h-4 transition-transform duration-300",
                                isLikedState ? "fill-white text-white scale-110" : "hover:scale-110"
                            )}
                        />
                    </button>
                </div>

                {/* Bottom Overlay: Publisher info badge */}
                <div className="absolute bottom-3 right-3 left-3 flex items-center gap-2 text-white pointer-events-none z-10">
                    <div className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center overflow-hidden border border-white/40">
                        {publisherLogo ? (
                            <Image
                                src={getMediaUrl(publisherLogo)}
                                alt={effectivePublisherName}
                                width={28}
                                height={28}
                                className="object-cover"
                            />
                        ) : publisherType === 'PLATFORM' ? (
                            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        ) : publisherType === 'AGENCY' ? (
                            <Building2 className="w-3.5 h-3.5 text-white" />
                        ) : (
                            <User className="w-3.5 h-3.5 text-white" />
                        )}
                    </div>
                    <div className="flex items-center gap-1 min-w-0">
                        <span className="text-xs font-bold truncate drop-shadow-xs">
                            {effectivePublisherName}
                        </span>
                        {isVerified && (
                            <Verified className="w-3.5 h-3.5 text-blue-400 shrink-0 fill-blue-400/20" />
                        )}
                    </div>
                </div>
            </div>

            {/* Content Body */}
            <div className="flex-1 p-4 flex flex-col justify-between gap-3">
                <div className="space-y-1.5">
                    <h3 className="text-sm sm:text-base font-bold text-gray-900 group-hover:text-brand transition-colors line-clamp-2 leading-relaxed">
                        {title}
                    </h3>
                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                        {summary || content}
                    </p>
                </div>

                {/* Footer Metrics */}
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                    <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 font-medium text-gray-500">
                            <Heart className={cn("w-3.5 h-3.5", isLikedState ? "text-red-500 fill-red-500" : "text-gray-400")} />
                            <span>{toPersianDigits(currentLikeCount)}</span>
                        </span>
                        <span className="flex items-center gap-1 font-medium text-gray-400">
                            <Eye className="w-3.5 h-3.5" />
                            <span>{toPersianDigits(viewCount)}</span>
                        </span>
                    </div>

                    {createdAt && (
                        <time className="text-[11px] text-gray-400">
                            {toPersianDigits(new Date(createdAt).toLocaleDateString('fa-IR'))}
                        </time>
                    )}
                </div>
            </div>
        </article>
    );
}
