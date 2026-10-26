"use client";

import { DEFAULT_CATEGORY_TRANSLATIONS } from "@/hooks/useCategoryLookup";
import { cn, toPersianDigits, getMediaUrl, getMediaPosterUrl } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns-jalali";
import { ChevronLeft, Clock, MapPin, Play, ShieldCheck, Sparkles, Zap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { MediaReference } from "@/types/api/media.types";

import type { ResolvedLocation } from "@/types/location.types";
import { formatLocationDisplay } from "@/lib/location";

export function LadderIcon({ className, ...props }: React.ComponentProps<"svg">) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            {...props}
        >
            <path d="M7 2v20" />
            <path d="M17 2v20" />
            <path d="M7 7h10" />
            <path d="M7 12h10" />
            <path d="M7 17h10" />
        </svg>
    );
}

function formatDisplayDate(dateVal?: string | Date | number | null): string {
    if (!dateVal) return "";
    try {
        const d = new Date(dateVal);
        if (isNaN(d.getTime())) return "";
        return toPersianDigits(formatDistanceToNow(d, { addSuffix: true }));
    } catch {
        return "";
    }
}

function getFullPersianDate(dateVal?: string | Date | number | null): string {
    if (!dateVal) return "";
    try {
        const d = new Date(dateVal);
        if (isNaN(d.getTime())) return "";
        return d.toLocaleDateString("fa-IR", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    } catch {
        return "";
    }
}

interface PropertyCardProps {
    id?: string;
    adId?: string;
    title: string;
    price: string | number;
    location: string | ResolvedLocation;
    image?: string;
    mediaIds?: MediaReference[];
    imageIds?: string[];
    isVideo?: boolean;
    category?: string;
    unit?: string;
    currency?: string;
    variant?: "vertical" | "horizontal" | "responsive" | "map";
    className?: string;
    contentClassName?: string;
    href?: string;
    isSaved?: boolean;
    onToggleSave?: (adId: string) => Promise<{ isSaved: boolean } | void> | void;
    // Backward compatibility aliases
    isFavorited?: boolean;
    onToggleFavorite?: (adId: string) => Promise<{ isFavorited: boolean } | { isSaved: boolean } | void> | void;
    area?: number | string | null;
    rooms?: number | string | null;
    date?: string | Date | number | null;
    createdAt?: string | Date | number | null;
    badgeName?: string | null;
    badgeIcon?: string | null;
    isUrgent?: boolean;
    isLadder?: boolean;
    isFeatured?: boolean;
    ladderIcon?: React.ReactNode;
    urgentIcon?: React.ReactNode;
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
    location,
    image,
    mediaIds,
    imageIds,
    isVideo,
    category,
    unit,
    currency = "تومان",
    variant = "responsive",
    className,
    contentClassName,
    href,
    area,
    rooms,
    date,
    createdAt,
    badgeName,
    badgeIcon,
    isUrgent = false,
    isLadder = false,
    isFeatured = false,
    ladderIcon,
    urgentIcon,
    publisher,
}: PropertyCardProps) {
    const router = useRouter();
    const effectiveAdId = adId || id;
    const effectiveDate = date ?? createdAt;
    const isUrgentEffective = Boolean(isUrgent || badgeName === "فوری");
    const isLadderEffective = Boolean(isLadder || badgeName === "نردبان");
    const effectiveBadgeName =
        badgeName === "نردبان" || badgeName === "فوری"
            ? null
            : (badgeName || (isFeatured ? "ویژه" : null));
    const displayLocation = typeof location === "string" ? location : formatLocationDisplay(location);
    const effectiveArea = area !== null && area !== undefined && typeof area !== "object" ? area : undefined;
    const effectiveRooms = rooms ?? undefined;
    const effectiveIsVideo = isVideo !== undefined ? isVideo : (mediaIds?.[0]?.type === "VIDEO");
    const effectiveImage =
        image ||
        (mediaIds && mediaIds.length > 0
            ? getMediaPosterUrl(mediaIds[0])
            : imageIds && imageIds.length > 0
            ? getMediaUrl(imageIds[0])
            : "/property-placeholder.svg");

    const [imgSrc, setImgSrc] = useState(effectiveImage);

    useEffect(() => {
        setImgSrc(effectiveImage);
    }, [effectiveImage]);

    const isResponsive = variant === "responsive";
    const isHorizontal = variant === "horizontal";
    const isVertical = variant === "vertical";
    const isMap = variant === "map";

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
            // For map variant, show concise numbers for billions/millions so it stays minimal
            if (isMap) {
                if (num >= 1000000000) {
                    const billions = num / 1000000000;
                    const formatted = billions % 1 === 0 ? billions.toFixed(0) : billions.toFixed(1);
                    return `${toPersianDigits(formatted)} میلیارد ${currency}`;
                }
                if (num >= 1000000) {
                    const millions = num / 1000000;
                    const formatted = millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1);
                    return `${toPersianDigits(formatted)} میلیون ${currency}`;
                }
            }
            return `${new Intl.NumberFormat("fa-IR").format(num)} ${currency}`;
        }

        const persianPrice = toPersianDigits(priceStr);
        // Avoid duplicate currency suffix if already present
        if (currency && persianPrice.includes(currency)) {
            return persianPrice;
        }

        // Return as is if already a formatted Persian string
        return `${persianPrice} ${currency}`;
    };

    const finalHref = href || (effectiveAdId ? `/ads/${effectiveAdId}` : undefined);

    // Dedicated Minimal Map Card Design
    if (isMap) {
        const mapCardContent = (
            <div
                className={cn(
                    "group relative flex flex-row items-center gap-2.5 p-2 bg-surface hover:bg-surface-secondary/40 rounded-2xl border border-border-subtle/80 hover:border-border transition-all duration-200 cursor-pointer select-none text-right w-[275px] sm:w-[290px]",
                    className
                )}
                dir="rtl"
            >
                {/* Thumbnail Image */}
                <div className="relative w-[76px] h-[76px] shrink-0 rounded-xl overflow-hidden bg-surface-secondary border border-border-subtle/60">
                    <Image
                        src={imgSrc}
                        alt={title || "ملک"}
                        fill
                        sizes="76px"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={() => setImgSrc("/property-placeholder.svg")}
                    />

                    {/* Badges on Thumbnail */}
                    <div className="absolute top-1 right-1 flex flex-col items-end gap-0.5 z-10 pointer-events-none">
                        {isUrgentEffective && (
                            <div className="bg-rose-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow-xs leading-none flex items-center gap-0.5">
                                {urgentIcon || <Zap className="w-2 h-2 fill-white text-white shrink-0" />}
                                <span>فوری</span>
                            </div>
                        )}
                        {isLadderEffective && (
                            <div className="bg-blue-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow-xs leading-none flex items-center gap-0.5">
                                {ladderIcon || <LadderIcon className="w-2 h-2 shrink-0" />}
                                <span>نردبان</span>
                            </div>
                        )}
                        {effectiveBadgeName && (
                            <div className="bg-surface/90 backdrop-blur-xs text-warning text-[8px] font-bold px-1 py-0.5 rounded shadow-xs leading-none flex items-center gap-0.5">
                                <Sparkles className="w-2 h-2 text-amber-500 shrink-0" />
                                <span>{effectiveBadgeName}</span>
                            </div>
                        )}
                    </div>

                    {effectiveIsVideo && (
                        <div className="absolute bottom-1 right-1 bg-black/60 backdrop-blur-xs text-white p-1 rounded-md flex items-center justify-center">
                            <Play className="w-2.5 h-2.5 fill-white" />
                        </div>
                    )}
                </div>

                {/* Content Section */}
                <div className={cn("flex-1 min-w-0 flex flex-col justify-between h-[76px] py-0.5", contentClassName)}>
                    <div className="min-w-0">
                        {/* Category & specs row */}
                        <div className="flex items-center gap-1.5 text-[10px] text-accent font-bold truncate">
                            {category && (
                                <span className="truncate">
                                    {DEFAULT_CATEGORY_TRANSLATIONS[category] || category}
                                </span>
                            )}
                            {(effectiveArea || effectiveRooms) && category && <span className="text-border-subtle">•</span>}
                            {effectiveArea && (
                                <span className="text-foreground-muted font-medium shrink-0">
                                    {toPersianDigits(effectiveArea)} متر
                                </span>
                            )}
                            {effectiveRooms && (
                                <span className="text-foreground-muted font-medium shrink-0">
                                    {toPersianDigits(effectiveRooms)} خ
                                </span>
                            )}
                        </div>

                        {/* Title */}
                        <h4
                            className="font-bold text-xs text-foreground group-hover:text-primary transition-colors truncate mt-0.5 leading-snug"
                            title={title}
                        >
                            {title}
                        </h4>

                        {/* Location */}
                        {displayLocation && (
                            <div className="flex items-center gap-1 text-[10px] text-foreground-muted mt-0.5 truncate">
                                <MapPin className="w-2.5 h-2.5 shrink-0 text-foreground-muted/70" />
                                <span className="truncate">{displayLocation}</span>
                            </div>
                        )}
                    </div>

                    {/* Bottom Row: Price & Action */}
                    <div className="mt-1 pt-1 border-t border-border-subtle/50 flex items-center justify-between gap-1">
                        <div className="flex items-baseline gap-0.5 min-w-0">
                            <span className="text-xs sm:text-[13px] font-black text-brand truncate">
                                {formatDisplayPrice()}
                            </span>
                            {unit && unit !== currency && unit !== "تومان" && (
                                <span className="text-[9px] text-foreground-muted shrink-0">{unit}</span>
                            )}
                        </div>

                        <span className="inline-flex items-center text-[10px] font-bold text-accent group-hover:text-primary transition-colors shrink-0 gap-0.5">
                            مشاهده
                            <ChevronLeft className="w-3 h-3 transition-transform group-hover:-translate-x-0.5" />
                        </span>
                    </div>
                </div>
            </div>
        );

        if (finalHref) {
            return (
                <Link
                    href={finalHref}
                    className="block cursor-pointer no-underline text-inherit"
                    onClick={(e) => {
                        if ((e.target as HTMLElement).closest("button")) {
                            e.preventDefault();
                        }
                    }}
                >
                    {mapCardContent}
                </Link>
            );
        }

        return mapCardContent;
    }

    const cardContent = (
        <div
            className={cn(
                "group h-full bg-surface rounded-2xl border border-border-subtle overflow-hidden hover:shadow-md transition-shadow cursor-pointer",
                isResponsive
                    ? "flex flex-row sm:flex-col-reverse"
                    : isHorizontal
                        ? "flex flex-row"
                        : "flex flex-col-reverse",
                className
            )}
        >
            {/* Details Section / Ads Information */}
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
                    {/* Top row: Title */}
                    <div className="flex items-start justify-between gap-1.5">
                        <h3
                            className={cn(
                                "text-brand font-bold text-xs sm:text-sm group-hover:text-primary transition-colors leading-snug",
                                isVertical ? "line-clamp-1" : "line-clamp-2 sm:line-clamp-1"
                            )}
                        >
                            {title}
                        </h3>
                    </div>

                    {/* Specs & Date Row */}
                    {(effectiveArea || effectiveRooms || effectiveDate) && (
                        <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-text-light mt-1 font-medium flex-wrap">
                            {effectiveArea ? <span>{toPersianDigits(effectiveArea)} متر</span> : null}
                            {effectiveArea && effectiveRooms ? <span>•</span> : null}
                            {effectiveRooms ? <span>{toPersianDigits(effectiveRooms)} خوابه</span> : null}
                            {(effectiveArea || effectiveRooms) && effectiveDate && formatDisplayDate(effectiveDate) ? <span>•</span> : null}
                            {effectiveDate && formatDisplayDate(effectiveDate) ? (
                                <time
                                    dateTime={typeof effectiveDate === "string" ? effectiveDate : undefined}
                                    title={getFullPersianDate(effectiveDate)}
                                    className="inline-flex items-center gap-1 shrink-0"
                                    suppressHydrationWarning
                                >
                                    <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-text-light/70" />
                                    <span>{formatDisplayDate(effectiveDate)}</span>
                                </time>
                            ) : null}
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
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-surface-secondary hover:bg-surface-secondary border border-border-subtle/60 text-[10px] text-text-main font-bold transition-colors cursor-pointer"
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
                        {unit && unit !== currency && unit !== "تومان" && (
                            <span className="text-[10px] text-text-light shrink-0">{unit}</span>
                        )}
                    </div>

                    {displayLocation && (
                        <div className="flex items-center gap-1 text-text-light text-[10px] sm:text-[11px] min-w-0 shrink-0 max-w-[50%]">
                            <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 text-text-light/70" />
                            <span className="truncate">{displayLocation}</span>
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
                <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 flex flex-col items-end gap-1 z-10 pointer-events-none">
                    {isUrgentEffective && (
                        <div className="bg-rose-600 text-white text-[9px] sm:text-[10px] font-black px-1.5 sm:px-2 py-0.5 rounded-md sm:rounded-lg shadow-sm flex items-center gap-1 leading-none">
                            {urgentIcon || <Zap className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-white text-white shrink-0" />}
                            <span>فوری</span>
                        </div>
                    )}
                    {isLadderEffective && (
                        <div className="bg-blue-600 text-white text-[9px] sm:text-[10px] font-black px-1.5 sm:px-2 py-0.5 rounded-md sm:rounded-lg shadow-sm flex items-center gap-1 leading-none">
                            {ladderIcon || <LadderIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" />}
                            <span>نردبان</span>
                        </div>
                    )}
                    {effectiveBadgeName && (
                        <div className="bg-surface/95 backdrop-blur-md text-warning border border-warning/30 shadow-xs px-1.5 sm:px-2 py-0.5 rounded-md sm:rounded-lg text-[9px] sm:text-[10px] font-black flex items-center gap-1 leading-none">
                            <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-500 shrink-0" />
                            <span>{effectiveBadgeName}</span>
                        </div>
                    )}
                    {effectiveIsVideo && (
                        <div className="bg-black/60 backdrop-blur-xs text-white text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full flex items-center gap-1 font-medium leading-none">
                            <Play className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-white shrink-0" />
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

export function MapPropertyCard(props: PropertyCardProps) {
    return <PropertyCard {...props} variant="map" />;
}

