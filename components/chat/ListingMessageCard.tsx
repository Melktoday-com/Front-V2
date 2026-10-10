"use client";

import { cn, formatAdPrice, getMediaUrl, toPersianDigits } from "@/lib/utils";
import { ListingMetadata } from "@/services/chat.service";
import { Building2, ExternalLink, Home, Hotel } from "lucide-react";
import Link from "next/link";

interface ListingMessageCardProps {
    metadata?: ListingMetadata | null;
    mediaIds?: string[] | null;
}

export function ListingMessageCard({ metadata, mediaIds }: ListingMessageCardProps) {
    const isRental = metadata?.subjectType === 'RENTAL';
    const subjectId = metadata?.subjectId;
    const title = metadata?.title || (isRental ? "واحد اقامتی اجاره موقت" : "آگهی ملک");
    const href = subjectId
        ? isRental
            ? `/temporary-rent/${subjectId}`
            : `/adds/${subjectId}`
        : null;

    const firstImageId =
        (mediaIds && mediaIds.length > 0 && mediaIds[0]) ||
        (metadata?.mediaIds && metadata.mediaIds.length > 0 && metadata.mediaIds[0]) ||
        metadata?.image;

    const imageUrl = firstImageId ? getMediaUrl(firstImageId) : null;

    let priceDisplay: string = "توافقی";
    if (metadata?.price) {
        if (typeof metadata.price === 'number' || typeof metadata.price === 'string') {
            priceDisplay = formatAdPrice(metadata.price);
        } else if (typeof metadata.price === 'object') {
            if (metadata.price.totalPrice) {
                priceDisplay = formatAdPrice(metadata.price.totalPrice);
            } else if (metadata.price.rentPrice || metadata.price.depositPrice) {
                const deposit = metadata.price.depositPrice ? `رهن: ${formatAdPrice(metadata.price.depositPrice)}` : '';
                const rent = metadata.price.rentPrice ? `اجاره: ${formatAdPrice(metadata.price.rentPrice)}` : '';
                priceDisplay = [deposit, rent].filter(Boolean).join(' | ') || "توافقی";
            } else if (metadata.price.weekdayPrice) {
                priceDisplay = `هر شب: ${formatAdPrice(metadata.price.weekdayPrice)}`;
            }
        }
    }

    const cardContent = (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-3 bg-white rounded-2xl border border-soft-border/80 hover:border-brand/30 shadow-xs transition-all text-right group max-w-sm">
            {/* Image Thumbnail */}
            <div className="relative w-full sm:w-20 h-24 sm:h-20 rounded-xl bg-soft-bg overflow-hidden shrink-0 border border-soft-border flex items-center justify-center">
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                ) : (
                    <div className="text-secondary/40 flex flex-col items-center justify-center gap-1">
                        {isRental ? <Hotel className="w-6 h-6" /> : <Building2 className="w-6 h-6" />}
                    </div>
                )}
                <span
                    className={cn(
                        "absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase shadow-xs",
                        isRental
                            ? "bg-purple-600 text-white"
                            : "bg-brand text-white"
                    )}
                >
                    {isRental ? "اجاره موقت" : "آگهی ملک"}
                </span>
            </div>

            {/* Content info */}
            <div className="flex-1 min-w-0 flex flex-col justify-between space-y-1">
                <div>
                    <h4 className="font-black text-brand text-xs line-clamp-2 leading-relaxed">
                        {title}
                    </h4>
                </div>
                <div className="pt-1 flex items-center justify-between gap-2 border-t border-soft-border/50">
                    <span className="text-[11px] font-black text-primary truncate">
                        {priceDisplay}
                    </span>
                    {href && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-brand group-hover:text-primary transition-colors shrink-0">
                            <span>مشاهده</span>
                            <ExternalLink className="w-3 h-3" />
                        </span>
                    )}
                </div>
            </div>
        </div>
    );

    if (href) {
        return (
            <Link href={href} target="_blank" className="block my-1">
                {cardContent}
            </Link>
        );
    }

    return <div className="my-1">{cardContent}</div>;
}
