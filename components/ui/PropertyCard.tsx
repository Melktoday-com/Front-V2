import { cn } from "@/lib/utils";
import { Heart, MapPin, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface PropertyCardProps {
    adId?: string;
    title: string;
    price: string;
    rating: number;
    location: string;
    image: string;
    category: string;
    unit?: string;
    currency?: string;
    variant?: "vertical" | "horizontal";
    className?: string;
    href?: string;
    isFavorited?: boolean;
    onToggleFavorite?: (adId: string) => Promise<void>;
}

export function PropertyCard({
    adId,
    title,
    price,
    rating,
    location,
    image,
    category,
    unit = "/ماهانه",
    currency = "$",
    variant = "vertical",
    className,
    href,
    isFavorited,
    onToggleFavorite,
}: PropertyCardProps) {
    const cardContent = (
        <div className={cn("group flex flex-col h-full", className)}>
            <div className={cn(
                "relative shrink-0",
                variant === "horizontal" ? "w-20 h-20 lg:w-24 lg:h-24" : "aspect-4/3 w-full overflow-hidden rounded-xl"
            )}>
                <Image
                    src={image}
                    alt={title}
                    fill
                    className={cn(
                        "object-cover",
                        variant === "horizontal" ? "rounded-lg" : "transition-transform duration-500 group-hover:scale-110"
                    )}
                />
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (adId && onToggleFavorite) {
                            onToggleFavorite(adId);
                        }
                    }}
                    className={cn(
                        "absolute top-1 left-1 w-5 h-5 backdrop-blur-md rounded-full flex items-center justify-center transition-colors",
                        isFavorited ? "bg-red-500/80 hover:bg-red-500" : "bg-white/30 hover:bg-white/50"
                    )}
                >
                    <Heart className={cn(
                        "w-2.5 h-2.5 transition-colors",
                        isFavorited ? "text-white fill-white" : "text-white"
                    )} />
                </button>
                <div className="absolute bottom-1 right-1 bg-brand/60 backdrop-blur-sm text-white text-[8px] px-1.5 py-0.5 rounded-md font-bold">
                    {category}
                </div>
            </div>

            {variant === "horizontal" ? (
                <div className="flex flex-col justify-center px-3 flex-1 min-w-0">
                    <h3 className="text-brand font-bold text-[11px] lg:text-xs line-clamp-1">{title}</h3>
                    <div className="flex items-center gap-1 mt-1">
                        <MapPin className="w-2 h-2 text-text-light shrink-0" />
                        <span className="text-[9px] text-text-light truncate">{location}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                        <span className="text-brand font-black text-xs lg:text-sm">{currency}{price}</span>
                        <span className="text-[8px] text-text-light">{unit}</span>
                    </div>
                </div>
            ) : (
                <div className="mt-1.5 px-0.5 pb-1 min-w-0 flex flex-col flex-1">
                    <div className="flex justify-between items-center h-4">
                        <h3 className="text-brand font-bold text-[11px] lg:text-xs line-clamp-1 flex-1">{title}</h3>
                        <div className="flex items-center gap-0.5 shrink-0 ml-1">
                            <Star className="w-2 h-2 text-yellow-500 fill-yellow-500" />
                            <span className="text-[9px] text-brand font-bold">{rating}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5 h-3">
                        <MapPin className="w-2 h-2 text-text-light shrink-0" />
                        <span className="text-[9px] text-text-light truncate">{location}</span>
                    </div>
                    <div className="mt-auto pt-1 flex items-baseline gap-0.5">
                        <span className="text-brand font-black text-xs lg:text-sm">{currency}{price}</span>
                        <span className="text-[8px] text-text-light">{unit}</span>
                    </div>
                </div>
            )}
        </div>
    );



    if (href || adId) {
        const slug = title
            ? title.replace(/\s+/g, '-').replace(/\//g, '-')
            : 'property';
        const finalHref = href || `/ads/${adId}/${slug}`;

        return (
            <Link href={finalHref} className="block h-full">
                {cardContent}
            </Link>
        );
    }

    return (
        <div className="h-full">
            {cardContent}
        </div>
    );
}

