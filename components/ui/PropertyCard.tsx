"use client";

import { DEFAULT_CATEGORY_TRANSLATIONS } from "@/hooks/useCategoryLookup";
import { cn, toPersianDigits } from "@/lib/utils";
import { MapPin, Play, ShieldCheck, Sparkles, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface PropertyCardProps {
    id?: string;
    adId?: string;
    title: string;
    price: string | number;
    rating?: number;
    location: string;
    image: string;
    isVideo?: boolean;
    category?: string;
    unit?: string;
    currency?: string;
    variant?: "vertical" | "horizontal" | "responsive";
    className?: string;
    href?: string;
    isSaved?: boolean;
    onToggleSave?: (adId: string) => Promise<{ isSaved: boolean } | void> | void;
    // Backward compatibility aliases
    isFavorited?: boolean;
    onToggleFavorite?: (adId: string) => Promise<{ isFavorited: boolean } | { isSaved: boolean } | void> | void;
    area?: number | string;
    rooms?: number | string;
    badgeName?: string | null;
    badgeIcon?: string | null;
    isUrgent?: boolean;
    publisher?: {
        type: 'host' | 'agency' | 'platform' | 'user';
        name: string;
        slug: string;
        avatar?: string | null;
        isVerified?: boolean;
    };
}

export function PropertyCard({
    id,
    adId,
    title,
    price,
    rating,
    location,
    image,
    isVideo = false,
    category,
    unit,
    currency = "تومان",
    variant = "responsive",
    className,
    href,
    area,
    rooms,
    badgeName,
    badgeIcon,
    isUrgent = false,
    publisher,
}: PropertyCardProps) {
    const router = useRouter();
    const effectiveAdId = adId || id;
    const [imgSrc, setImgSrc] = useState(image || "/property-placeholder.svg");

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

    const isResponsive = variant === "responsive";
    const isHorizontal = variant === "horizontal";
    const isVertical = variant === "vertical";

    const cardContent = (
        <div
            className={cn(
                "group h-full bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer",
                isResponsive
                    ? "flex flex-row sm:flex-col"
                    : isHorizontal
                        ? "flex flex-row"
                        : "flex flex-col",
                className
            )}
        >
            {/* Details Section */}
            <div
                className={cn(
                    "min-w-0 flex flex-col flex-1 text-right justify-between",
                    isResponsive
                        ? "py-2.5 pl-3 pr-1 sm:p-3"
                        : isHorizontal
                            ? "py-2.5 pl-3 pr-1"
                            : "p-3"
                )}
            >
                <div className="min-w-0">
                    {/* Top row: Title and Rating */}
                    <div className="flex items-start justify-between gap-1.5">
                        <h3
                            className={cn(
                                "text-brand font-bold text-xs sm:text-sm group-hover:text-primary transition-colors leading-snug",
                                isVertical ? "line-clamp-1" : "line-clamp-2 sm:line-clamp-1"
                            )}
                        >
                            {title}
                        </h3>

                        {rating !== undefined && Number(rating) > 0 && (
                            <div className="flex items-center gap-0.5 shrink-0 text-brand text-[10px] sm:text-[11px] font-bold mt-0.5">
                                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                <span>{toPersianDigits(Number(rating).toFixed(1))}</span>
                            </div>
                        )}
                    </div>

                    {/* Specs Row (area, rooms) */}
                    {(area || rooms) && (
                        <div className="flex items-center gap-2 text-[10px] sm:text-[11px] text-text-light mt-1 font-medium">
                            {area ? <span>{toPersianDigits(area)} متر</span> : null}
                            {area && rooms ? <span>•</span> : null}
                            {rooms ? <span>{toPersianDigits(rooms)} خوابه</span> : null}
                        </div>
                    )}

                    {/* Publisher Showcase Badge */}
                    {publisher && publisher.type !== 'user' && publisher.name && (
                        <div className="mt-1 flex items-center">
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (publisher.type === 'host' && publisher.slug) {
                                        router.push(`/host/${publisher.slug}`);
                                    } else if (publisher.type === 'agency' && publisher.slug) {
                                        router.push(`/agency/showcase/${publisher.slug}`);
                                    }
                                }}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-gray-50 hover:bg-gray-100 border border-gray-200/60 text-[10px] text-text-main font-bold transition-colors cursor-pointer"
                            >
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
                            </button>
                        </div>
                    )}
                </div>

                {/* Bottom row: Price on right, Location on left (opposite) */}
                <div className="mt-auto pt-2 flex items-center justify-between gap-1.5">
                    <div className="flex items-baseline gap-1 min-w-0">
                        <span className="text-brand font-bold text-xs sm:text-sm truncate">
                            {formatDisplayPrice()}
                        </span>
                        {unit && <span className="text-[10px] text-text-light shrink-0">{unit}</span>}
                    </div>

                    {location && (
                        <div className="flex items-center gap-1 text-text-light text-[10px] sm:text-[11px] min-w-0 shrink-0 max-w-[50%]">
                            <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 text-text-light/70" />
                            <span className="truncate">{location}</span>
                        </div>
                    )}
                </div>
            </div>

            <div
                className={cn(
                    "relative shrink-0 overflow-hidden",
                    isResponsive
                        ? "w-28 h-28 min-[380px]:w-32 min-[380px]:h-32 sm:w-full sm:h-auto sm:aspect-[4/3] rounded-xl sm:rounded-none m-2 sm:m-0"
                        : isHorizontal
                            ? "w-28 h-28 sm:w-32 sm:h-32 rounded-xl m-2"
                            : "aspect-[4/3] w-full"
                )}
            >
                <Image
                    src={imgSrc}
                    alt={title || "ملک"}
                    fill
                    sizes="(max-width: 640px) 130px, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={() => setImgSrc("/property-placeholder.svg")}
                />

                {/* Badges Container (Top Right) */}
                <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 flex flex-col items-end gap-1 z-10">
                    {isUrgent && (
                        <div className="bg-rose-600 text-white text-[9px] sm:text-[10px] font-black px-1.5 sm:px-2 py-0.5 rounded-md sm:rounded-lg shadow-sm flex items-center gap-1">
                            <span>فوری</span>
                        </div>
                    )}
                    {badgeName && (
                        <div className="bg-white/95 backdrop-blur-md text-amber-800 border border-amber-200/80 shadow-xs px-1.5 sm:px-2 py-0.5 rounded-md sm:rounded-lg text-[9px] sm:text-[10px] font-black flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-500" />
                            <span>{badgeName}</span>
                        </div>
                    )}
                    {isVideo && (
                        <div className="bg-black/60 backdrop-blur-xs text-white text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full flex items-center gap-1 font-medium">
                            <Play className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-white" />
                            <span>ویدیو</span>
                        </div>
                    )}
                </div>

                {/* Category Badge */}
                {category && (
                    <div className="absolute bottom-1.5 right-1.5 sm:bottom-2 sm:right-2 bg-brand/80 backdrop-blur-md text-white text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-md sm:rounded-lg shadow-xs max-w-[85%] truncate">
                        {DEFAULT_CATEGORY_TRANSLATIONS[category] || category}
                    </div>
                )}
            </div>
        </div>
    );

    const finalHref = href || (effectiveAdId ? `/ads/${effectiveAdId}` : undefined);

    if (finalHref) {
        return (
            <Link
                href={finalHref}
                className="block h-full cursor-pointer no-underline text-inherit"
                onClick={(e) => {
                    if ((e.target as HTMLElement).closest("button")) {
                        e.preventDefault();
                    }
                }}
            >
                {cardContent}
            </Link>
        );
    }

    return <div className="h-full">{cardContent}</div>;
}
