"use client";

import { cn, toPersianDigits } from "@/lib/utils";
import { Heart, MapPin, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

interface PropertyCardProps {
    adId?: string;
    title: string;
    price: string | number;
    rating?: number;
    location: string;
    image: string;
    category?: string;
    unit?: string;
    currency?: string;
    variant?: "vertical" | "horizontal";
    className?: string;
    href?: string;
    isFavorited?: boolean;
    onToggleFavorite?: (adId: string) => Promise<void>;
    area?: number | string;
    rooms?: number | string;
}

export function PropertyCard({
    adId,
    title,
    price,
    rating,
    location,
    image,
    category,
    unit,
    currency = "تومان",
    variant = "vertical",
    className,
    href,
    isFavorited = false,
    onToggleFavorite,
    area,
    rooms,
}: PropertyCardProps) {
    const [imgSrc, setImgSrc] = useState(image || "/property-placeholder.svg");
    const [isFav, setIsFav] = useState(isFavorited);

    // Format price: handle string with commas or raw numbers
    const formatDisplayPrice = () => {
        if (!price && price !== 0) return "توافقی";
        const priceStr = String(price).trim();
        if (priceStr === "0" || priceStr === "توافقی") return "توافقی";

        // If currency is explicitly set to "$", keep prefix format for legacy support
        if (currency === "$") {
            return `$ ${priceStr}`;
        }

        // Check if string contains Persian digits or needs formatting
        const cleaned = priceStr.replace(/,/g, "");
        const num = Number(cleaned);
        if (!isNaN(num) && num > 0) {
            return `${new Intl.NumberFormat("fa-IR").format(num)} ${currency}`;
        }

        // Return as is if already a formatted Persian string
        return `${toPersianDigits(priceStr)} ${currency}`;
    };

    const handleFavoriteClick = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (adId && onToggleFavorite) {
            setIsFav(!isFav);
            try {
                await onToggleFavorite(adId);
            } catch {
                setIsFav(isFav); // rollback on error
            }
        }
    };

    const cardContent = (
        <div className={cn("group flex flex-col h-full bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow", className)}>
            <div className={cn(
                "relative shrink-0 overflow-hidden",
                variant === "horizontal"
                    ? "w-28 h-28 sm:w-32 sm:h-32 rounded-xl m-2"
                    : "aspect-[4/3] w-full"
            )}>
                <Image
                    src={imgSrc}
                    alt={title || "ملک"}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={() => setImgSrc("/property-placeholder.svg")}
                />

                {/* Favorite Heart Button - 32px touch target */}
                {adId && (
                    <button
                        onClick={handleFavoriteClick}
                        aria-label="افزودن به علاقه‌مندی‌ها"
                        className={cn(
                            "absolute top-2 left-2 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md shadow-sm transition-all z-10 active:scale-90",
                            isFav ? "bg-red-500 text-white" : "bg-white/80 hover:bg-white text-gray-700"
                        )}
                    >
                        <Heart className={cn(
                            "w-4 h-4 transition-colors",
                            isFav ? "fill-white text-white" : "text-gray-700 hover:text-red-500"
                        )} />
                    </button>
                )}

                {/* Category Badge */}
                {category && (
                    <div className="absolute bottom-2 right-2 bg-brand/80 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-lg shadow-xs">
                        {category}
                    </div>
                )}
            </div>

            {variant === "horizontal" ? (
                <div className="flex flex-col justify-between p-3 flex-1 min-w-0">
                    <div>
                        {/* Zillow style: Price first */}
                        <div className="flex items-baseline gap-1">
                            <span className="text-brand font-black text-sm sm:text-base">
                                {formatDisplayPrice()}
                            </span>
                            {unit && <span className="text-[10px] text-text-light">{unit}</span>}
                        </div>

                        {/* Property Title */}
                        <h3 className="text-brand font-bold text-xs sm:text-sm line-clamp-1 mt-1 group-hover:text-primary transition-colors">
                            {title}
                        </h3>

                        {/* Specs Row */}
                        {(area || rooms) && (
                            <div className="flex items-center gap-2 text-[10px] text-text-light mt-1 font-medium">
                                {area ? <span>{toPersianDigits(area)} متر</span> : null}
                                {area && rooms ? <span>•</span> : null}
                                {rooms ? <span>{toPersianDigits(rooms)} خوابه</span> : null}
                            </div>
                        )}
                    </div>

                    {/* Location */}
                    <div className="flex items-center gap-1 mt-2 text-text-light text-[11px]">
                        <MapPin className="w-3.5 h-3.5 shrink-0 text-text-light/70" />
                        <span className="truncate">{location}</span>
                    </div>
                </div>
            ) : (
                <div className="p-3 min-w-0 flex flex-col flex-1">
                    {/* Zillow style: Price first in bold */}
                    <div className="flex justify-between items-baseline gap-1">
                        <div className="flex items-baseline gap-1">
                            <span className="text-brand font-black text-sm lg:text-base">
                                {formatDisplayPrice()}
                            </span>
                            {unit && <span className="text-[10px] text-text-light">{unit}</span>}
                        </div>

                        {rating !== undefined && Number(rating) > 0 && (
                            <div className="flex items-center gap-0.5 shrink-0 text-brand text-[11px] font-bold">
                                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                <span>{toPersianDigits(Number(rating).toFixed(1))}</span>
                            </div>
                        )}
                    </div>

                    {/* Specs Row (area, rooms) */}
                    {(area || rooms) && (
                        <div className="flex items-center gap-2 text-[11px] text-text-light mt-1 font-medium">
                            {area ? <span>{toPersianDigits(area)} متر</span> : null}
                            {area && rooms ? <span>•</span> : null}
                            {rooms ? <span>{toPersianDigits(rooms)} خوابه</span> : null}
                        </div>
                    )}

                    {/* Title */}
                    <h3 className="text-brand font-bold text-xs lg:text-sm line-clamp-1 mt-1.5 group-hover:text-primary transition-colors">
                        {title}
                    </h3>

                    {/* Location at bottom */}
                    <div className="mt-auto pt-2 flex items-center gap-1 text-text-light text-[11px]">
                        <MapPin className="w-3.5 h-3.5 shrink-0 text-text-light/70" />
                        <span className="truncate">{location}</span>
                    </div>
                </div>
            )}
        </div>
    );

    if (href || adId) {
        const slug = title
            ? title.replace(/\s+/g, "-").replace(/\//g, "-")
            : "property";
        const finalHref = href || `/ads/${adId}/${slug}`;

        return (
            <Link href={finalHref} className="block h-full">
                {cardContent}
            </Link>
        );
    }

    return <div className="h-full">{cardContent}</div>;
}
