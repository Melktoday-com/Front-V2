"use client";

import { cn, formatPrice, toPersianDigits } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Heart, MapPin, Star, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

interface TemporaryRentCardProps {
    id: string;
    title: string;
    nightlyPrice: number;
    location: string;
    mediaIds?: string[];
    rating?: number;
    maxGuests?: number;
    rooms?: number;
    isFavorited?: boolean;
    onToggleFavorite?: (id: string) => Promise<void>;
    className?: string;
}

export function TemporaryRentCard({
    id,
    title,
    nightlyPrice,
    location,
    mediaIds = [],
    rating = 4.9,
    maxGuests,
    rooms,
    isFavorited = false,
    onToggleFavorite,
    className,
}: TemporaryRentCardProps) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isFav, setIsFav] = useState(isFavorited);

    const images =
        mediaIds && mediaIds.length > 0
            ? mediaIds.map((mId) => `${process.env.NEXT_PUBLIC_API_URL}/media/${mId}`)
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

    const handleFavorite = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (onToggleFavorite) {
            setIsFav(!isFav);
            try {
                await onToggleFavorite(id);
            } catch {
                setIsFav(isFav);
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

                {/* Heart Button */}
                <button
                    onClick={handleFavorite}
                    aria-label="افزودن به علاقه‌مندی‌ها"
                    className={cn(
                        "absolute top-2.5 left-2.5 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md shadow-sm z-10 transition-transform active:scale-90",
                        isFav ? "bg-red-500 text-white" : "bg-white/80 hover:bg-white text-gray-700"
                    )}
                >
                    <Heart className={cn("w-4 h-4", isFav ? "fill-white text-white" : "text-gray-700")} />
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
                        <div className="flex items-center gap-1 shrink-0 font-bold text-brand">
                            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                            <span>{toPersianDigits(rating.toFixed(1))}</span>
                        </div>
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
