"use client";

import { useAuth } from "@/hooks/useAuth";
import { LadderIcon } from "@/components/ui/PropertyCard";
import { cn, formatPrice, toPersianDigits, getMediaUrl, getMediaPosterUrl } from "@/lib/utils";
import type { MediaReference } from "@/types/api/media.types";
import { ChevronLeft, ChevronRight, Heart, MapPin, Play, ShieldCheck, Star, Users, Zap } from "lucide-react";
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
    imageIds?: string[];
    imageUrl?: string;
    rating?: number;
    maxGuests?: number;
    rooms?: number;
    category?: string;
    isSaved?: boolean;
    onToggleSave?: (id: string) => Promise<{ isSaved: boolean } | void> | void;
    // Backward compatibility aliases
    isFavorited?: boolean;
    onToggleFavorite?: (id: string) => Promise<{ isFavorited: boolean } | { isSaved: boolean } | void> | void;
    className?: string;
    contentClassName?: string;
    variant?: "vertical" | "horizontal" | "responsive";
    isFeatured?: boolean;
    isUrgent?: boolean;
    isLadder?: boolean;
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
    imageIds = [],
    imageUrl,
    rating,
    maxGuests,
    rooms,
    category,
    isSaved,
    onToggleSave,
    isFavorited = false,
    onToggleFavorite,
    className,
    contentClassName,
    variant = "responsive",
    isFeatured = false,
    isUrgent = false,
    isLadder = false,
    publisher,
}: TemporaryRentCardProps) {
    const effectiveIsSaved = isSaved !== undefined ? isSaved : isFavorited;
    const effectiveToggle = onToggleSave || onToggleFavorite;

    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [saved, setSaved] = useState(effectiveIsSaved);

    useEffect(() => {
        setSaved(effectiveIsSaved);
    }, [effectiveIsSaved]);

    const isResponsive = variant === "responsive";
    const isHorizontal = variant === "horizontal";
    const isVertical = variant === "vertical";

    const images = (mediaIds && mediaIds.length > 0)
        ? mediaIds.map((mId) => (mId.type === "VIDEO" ? getMediaPosterUrl(mId) : getMediaUrl(mId)))
        : (imageIds && imageIds.length > 0)
        ? imageIds.map((img) => getMediaUrl(img))
        : imageUrl
        ? [imageUrl.startsWith('http') || imageUrl.startsWith('/') ? imageUrl : getMediaUrl(imageUrl)]
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
                "group h-full bg-surface rounded-2xl overflow-hidden border border-border-subtle hover:shadow-md transition-shadow cursor-pointer",
                isResponsive
                    ? "flex flex-row sm:flex-col-reverse"
                    : isHorizontal
                        ? "flex flex-row"
                        : "flex flex-col-reverse",
                className
            )}
        >
            {/* Details Section / Accommodation Information */}
            <div
                className={cn(
                    "min-w-0 flex flex-col flex-1 text-right justify-between",
                    isResponsive
                        ? "p-3.5 sm:p-4"
                        : isHorizontal
                            ? "p-3.5"
                            : "p-4",
                    contentClassName
                )}
            >
                <div className="min-w-0">
                    {/* Desktop-only: Location & Rating Header */}
                    <div
                        className={cn(
                            "items-center justify-between gap-2 text-xs mb-1.5",
                            isResponsive ? "hidden sm:flex" : isHorizontal ? "hidden" : "flex"
                        )}
                    >
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
                    <div className="flex items-start justify-between gap-1.5">
                        <h3
                            className={cn(
                                "text-brand font-bold text-xs sm:text-sm group-hover:text-primary transition-colors leading-snug",
                                isVertical ? "line-clamp-1" : "line-clamp-2 sm:line-clamp-1"
                            )}
                            title={title}
                        >
                            {title}
                        </h3>
                    </div>

                    {/* Specs Row */}
                    {(maxGuests || rooms || (rating != null && !isNaN(Number(rating)) && Number(rating) > 0)) && (
                        <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-text-light mt-1 font-medium flex-wrap">
                            {maxGuests ? (
                                <span className="flex items-center gap-1">
                                    <Users className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                    تا {toPersianDigits(maxGuests)} مهمان
                                </span>
                            ) : null}
                            {maxGuests && rooms ? <span>•</span> : null}
                            {rooms ? <span>{toPersianDigits(rooms)} خوابه</span> : null}
                            {/* Mobile-only Rating Tag */}
                            {rating != null && !isNaN(Number(rating)) && Number(rating) > 0 ? (
                                <span
                                    className={cn(
                                        "items-center gap-1 font-bold text-brand",
                                        isResponsive ? "inline-flex sm:hidden" : isHorizontal ? "inline-flex" : "hidden"
                                    )}
                                >
                                    {(maxGuests || rooms) ? <span>•</span> : null}
                                    <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                                    <span>{toPersianDigits(Number(rating).toFixed(1))}</span>
                                </span>
                            ) : null}
                        </div>
                    )}

                    {/* Publisher Showcase Badge */}
                    {publisher && publisher.type !== 'user' && publisher.name && (
                        <div className="mt-1 flex items-center">
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-surface-secondary border border-border-subtle/60 text-[10px] text-text-main font-bold">
                                {publisher.avatar ? (
                                    <Image
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

                {/* Bottom Row: Price and Location */}
                <div className="mt-auto pt-2 border-t border-border-subtle flex items-end justify-between gap-1.5">
                    {/* Price on right */}
                    <div className="flex items-baseline gap-1 min-w-0">
                        <span className="text-brand font-black text-xs sm:text-base truncate leading-snug">
                            {formatPrice(nightlyPrice, "")}
                        </span>
                        <span className="text-[10px] sm:text-xs text-text-light font-bold">تومان</span>
                        <span className="text-[9px] sm:text-[11px] text-text-light font-normal">/ هر شب</span>
                    </div>

                    {/* Mobile Location on left (opposite to price, matching PropertyCard) */}
                    {location && (
                        <div
                            className={cn(
                                "items-center gap-1 text-text-light text-[10px] sm:text-[11px] min-w-0 shrink-0 max-w-[50%] self-end pb-0.5",
                                isResponsive ? "flex sm:hidden" : isHorizontal ? "flex" : "hidden"
                            )}
                        >
                            <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 text-text-light/70" />
                            <span className="truncate">{location}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Thumbnail / Image Section */}
            <div
                className={cn(
                    "relative shrink-0 overflow-hidden bg-surface-secondary",
                    isResponsive
                        ? "w-28 h-28 min-[380px]:w-32 min-[380px]:h-32 sm:w-full sm:h-auto sm:aspect-[4/3] rounded-xl sm:rounded-none m-2 sm:m-0"
                        : isHorizontal
                            ? "w-28 h-28 sm:w-32 sm:h-32 rounded-xl m-2"
                            : "aspect-[4/3] w-full"
                )}
            >
                <Image
                    src={images[currentImageIndex] || "/property-placeholder.svg"}
                    alt={title}
                    fill
                    sizes="(max-width: 640px) 130px, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Promotion Badges: Urgent / Ladder */}
                {(isUrgent || isLadder) && (
                    <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 z-10 flex flex-col items-start gap-1 pointer-events-none">
                        {isUrgent && (
                            <div className="bg-rose-600 text-white text-[9px] sm:text-[10px] font-black px-1.5 sm:px-2 py-0.5 rounded-md sm:rounded-lg shadow-sm flex items-center gap-1 leading-none">
                                <Zap className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-white text-white shrink-0" />
                                <span>فوری</span>
                            </div>
                        )}
                        {isLadder && (
                            <div className="bg-blue-600 text-white text-[9px] sm:text-[10px] font-black px-1.5 sm:px-2 py-0.5 rounded-md sm:rounded-lg shadow-sm flex items-center gap-1 leading-none">
                                <LadderIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" />
                                <span>نردبان</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Video Badge */}
                {mediaIds[currentImageIndex]?.type === "VIDEO" && (
                    <div className="absolute bottom-1.5 left-1.5 sm:bottom-2 sm:left-2 bg-black/60 backdrop-blur-xs text-white text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full flex items-center gap-1 font-medium leading-none shadow-xs z-10 pointer-events-none">
                        <Play className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-white shrink-0" />
                        <span>ویدیو</span>
                    </div>
                )}

                {/* Save Heart Button */}
                <button
                    type="button"
                    onClick={handleFavorite}
                    aria-label="ذخیره اقامتگاه"
                    className={cn(
                        "absolute top-1.5 left-1.5 sm:top-2.5 sm:left-2.5 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center backdrop-blur-md shadow-sm z-20 transition-transform active:scale-90 cursor-pointer",
                        saved ? "bg-red-500 text-white" : "bg-surface/80 hover:bg-surface text-foreground-secondary"
                    )}
                >
                    <Heart className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4", saved ? "fill-white text-white" : "text-foreground-secondary")} />
                </button>

                {/* Carousel Chevrons (visible on hover on desktop only) */}
                {images.length > 1 && (isVertical || isResponsive) && (
                    <div className={cn(isResponsive && "hidden sm:block")}>
                        <button
                            type="button"
                            onClick={handlePrevImage}
                            aria-label="تصویر قبلی"
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-surface/85 hover:bg-surface flex items-center justify-center text-brand shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10 cursor-pointer"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            onClick={handleNextImage}
                            aria-label="تصویر بعدی"
                            className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-surface/85 hover:bg-surface flex items-center justify-center text-brand shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10 cursor-pointer"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* Category Badge */}
                {category && (
                    <div className="absolute bottom-1.5 right-1.5 sm:bottom-2 sm:right-2 bg-orange-600/90 backdrop-blur-md text-white text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-md sm:rounded-lg shadow-xs z-10 max-w-[70%] truncate pointer-events-none">
                        {category}
                    </div>
                )}

                {/* Pagination Dots (desktop only) */}
                {images.length > 1 && (isVertical || isResponsive) && (
                    <div
                        className={cn(
                            "absolute bottom-2.5 inset-x-0 justify-center items-center gap-1.5 z-10 pointer-events-none",
                            isResponsive ? "hidden sm:flex" : "flex"
                        )}
                    >
                        {images.slice(0, 5).map((_, idx) => (
                            <div
                                key={idx}
                                className={cn(
                                    "rounded-full transition-all duration-300",
                                    currentImageIndex === idx
                                        ? "w-2 h-2 bg-surface shadow-xs scale-110"
                                        : "w-1.5 h-1.5 bg-surface/60"
                                )}
                            />
                        ))}
                    </div>
                )}
            </div>
        </Link>
    );
}
