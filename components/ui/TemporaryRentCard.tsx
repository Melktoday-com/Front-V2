"use client";

import { useAuth } from "@/hooks/useAuth";
import { cn, formatPrice, toPersianDigits, getMediaUrl, getMediaPosterUrl } from "@/lib/utils";
import type { MediaReference } from "@/types/api/media.types";
import { ChevronLeft, ChevronRight, Heart, MapPin, Star, Users, Play, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface TemporaryRentCardProps {
    id: string;
    title: string;
    nightlyPrice: number;
    location: string;
    mediaIds?: MediaReference[];
    imageUrl?: string;
    rating?: number;
    maxGuests?: number;
    rooms?: number;
    isSaved?: boolean;
    onToggleSave?: (id: string) => Promise<{ isSaved: boolean } | void> | void;
    // Backward compatibility aliases
    isFavorited?: boolean;
    onToggleFavorite?: (id: string) => Promise<{ isFavorited: boolean } | { isSaved: boolean } | void> | void;
    className?: string;
    isFeatured?: boolean;
    isUrgent?: boolean;
    publisher?: {
        type: 'host' | 'agency' | 'platform' | 'user';
        name: string;
        slug: string;
        avatar?: string | null;
        isVerified?: boolean;
    };
}

export function TemporaryRentCard({
    id,
    title,
    nightlyPrice,
    location,
    mediaIds = [],
    imageUrl,
    rating,
    maxGuests,
    rooms,
    isSaved,
    onToggleSave,
    isFavorited = false,
    onToggleFavorite,
    className,
    isFeatured = false,
    isUrgent = false,
    publisher,
}: TemporaryRentCardProps) {
    const effectiveIsSaved = isSaved !== undefined ? isSaved : isFavorited;
    const effectiveToggle = onToggleSave || onToggleFavorite;

    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [saved, setSaved] = useState(effectiveIsSaved);

    useEffect(() => {
        setSaved(effectiveIsSaved);
    }, [effectiveIsSaved]);

    const images = imageUrl
        ? [imageUrl]
        : mediaIds && mediaIds.length > 0
        ? mediaIds.map((mId) => (mId.type === "VIDEO" ? getMediaPosterUrl(mId) : getMediaUrl(mId)))
        : ["/property-placeholder.svg"];

    const handlePrevImage = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    };

    const handleNextImage = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setCurrentImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    };

    const { isLoggedIn } = useAuth();
    const router = useRouter();

    const handleFavorite = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isLoggedIn) {
            toast.info("برای نشان کردن اقامتگاه، لطفاً ابتدا وارد حساب کاربری خود شوید.");
            const currentPath = typeof window !== "undefined" ? window.location.pathname + window.location.search : "/temporary-rent";
            router.push(`/auth?redirect=${encodeURIComponent(currentPath)}`);
            return;
        }
        if (effectiveToggle) {
            const nextState = !saved;
            setSaved(nextState);
            try {
                await effectiveToggle(id);
            } catch {
                setSaved(!nextState);
            }
        }
    };

    return (
        <Link
            href={`/temporary-rent/${id}`}
            className={cn(
                "group flex flex-col bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-lg transition-all duration-300",
                className
            )}
        >
            {/* Image Slider - Airbnb Style */}
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100">
                <Image
                    src={images[currentImageIndex] || "/property-placeholder.svg"}
                    alt={title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Urgent / Featured Badge */}
                {(isUrgent || isFeatured) && (
                    <div className="absolute top-2.5 right-2.5 z-10">
                        <div className="bg-rose-600 text-white text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded-md shadow-sm">
                            <span>فوری</span>
                        </div>
                    </div>
                )}

                {mediaIds[currentImageIndex]?.type === "VIDEO" && (
                    <div className="absolute bottom-2.5 right-2.5 bg-black/60 backdrop-blur-xs text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 z-10 font-medium">
                        <Play className="w-3 h-3 fill-white" />
                        <span>ویدیو</span>
                    </div>
                )}

                {/* Save Heart Button */}
                <button
                    onClick={handleFavorite}
                    aria-label="ذخیره اقامتگاه"
                    className={cn(
                        "absolute top-2.5 left-2.5 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md shadow-sm z-10 transition-transform active:scale-90",
                        saved ? "bg-red-500 text-white" : "bg-white/80 hover:bg-white text-gray-700"
                    )}
                >
                    <Heart className={cn("w-4 h-4", saved ? "fill-white text-white" : "text-gray-700")} />
                </button>

                {/* Carousel Chevrons (visible on hover) */}
                {images.length > 1 && (
                    <>
                        <button
                            onClick={handlePrevImage}
                            aria-label="تصویر قبلی"
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/85 hover:bg-white flex items-center justify-center text-brand shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                        <button
                            onClick={handleNextImage}
                            aria-label="تصویر بعدی"
                            className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/85 hover:bg-white flex items-center justify-center text-brand shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                    </>
                )}

                {/* Pagination Dots */}
                {images.length > 1 && (
                    <div className="absolute bottom-2.5 inset-x-0 flex justify-center items-center gap-1.5 z-10">
                        {images.slice(0, 5).map((_, idx) => (
                            <div
                                key={idx}
                                className={cn(
                                    "rounded-full transition-all duration-300",
                                    currentImageIndex === idx
                                        ? "w-2 h-2 bg-white shadow-xs scale-110"
                                        : "w-1.5 h-1.5 bg-white/60"
                                )}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Content Section */}
            <div className="p-3.5 flex flex-col flex-1 justify-between gap-2">
                <div>
                    {/* Location & Rating Header */}
                    <div className="flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-1 text-text-light truncate">
                            <MapPin className="w-3.5 h-3.5 shrink-0 text-primary" />
                            <span className="truncate font-bold">{location}</span>
                        </div>
                        {rating != null && !isNaN(Number(rating)) && Number(rating) > 0 ? (
                            <div className="flex items-center gap-1 shrink-0 font-bold text-brand">
                                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                                <span>{toPersianDigits(Number(rating).toFixed(1))}</span>
                            </div>
                        ) : null}
                    </div>

                    {/* Title */}
                    <h3 className="text-sm font-bold text-text-main line-clamp-1 mt-1.5 group-hover:text-primary transition-colors">
                        {title}
                    </h3>

                    {/* Guests & Room tags */}
                    {(maxGuests || rooms) && (
                        <div className="flex items-center gap-2 text-[11px] text-text-light mt-1 font-medium">
                            {maxGuests && (
                                <span className="flex items-center gap-1">
                                    <Users className="w-3 h-3" />
                                    تا {toPersianDigits(maxGuests)} مهمان
                                </span>
                            )}
                            {maxGuests && rooms && <span>•</span>}
                            {rooms && <span>{toPersianDigits(rooms)} خوابه</span>}
                        </div>
                    )}

                    {/* Publisher Showcase Badge */}
                    {publisher && publisher.type !== 'user' && publisher.name && (
                        <div className="mt-1.5 flex items-center">
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-gray-50 border border-gray-200/60 text-[10px] text-text-main font-bold">
                                {publisher.avatar ? (
                                    <img
                                        src={publisher.avatar}
                                        alt={publisher.name}
                                        className="w-3.5 h-3.5 rounded-full object-cover shrink-0"
                                    />
                                ) : null}
                                <span className="truncate max-w-[90px]">{publisher.name}</span>
                                {publisher.isVerified && (
                                    <ShieldCheck className="w-3 h-3 text-primary shrink-0" />
                                )}
                            </span>
                        </div>
                    )}
                </div>

                {/* Price Row (Airbnb style: bold per night) */}
                <div className="pt-2 border-t border-gray-100 flex items-baseline gap-1">
                    <span className="text-brand font-black text-sm sm:text-base">
                        {formatPrice(nightlyPrice, "")}
                    </span>
                    <span className="text-xs text-text-light font-bold">تومان</span>
                    <span className="text-[11px] text-text-light font-normal">/ هر شب</span>
                </div>
            </div>
        </Link>
    );
}
