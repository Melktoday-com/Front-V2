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
}: PropertyCardProps) {
    const cardContent = (
        <>
            <div className={cn(
                "relative shrink-0",
                variant === "horizontal" ? "w-[130px] h-[140px] lg:w-[160px] lg:h-[160px]" : "aspect-[160/170] w-full overflow-hidden rounded-[20px]"
            )}>
                <Image
                    src={image}
                    alt={title}
                    fill
                    className={cn(
                        "object-cover",
                        variant === "horizontal" ? "rounded-[20px]" : "transition-transform duration-500 group-hover:scale-110"
                    )}
                />
                <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    className="absolute top-2 left-2 w-6 h-6 lg:w-8 lg:h-8 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center transition-colors hover:bg-white/40"
                >
                    <Heart className="w-3 h-3 lg:w-4 lg:h-4 text-white hover:fill-white" />
                </button>
                <div className="absolute bottom-2 left-2 bg-brand/70 backdrop-blur-sm text-white text-[10px] px-2 py-1 rounded-lg">
                    {category}
                </div>
            </div>

            {variant === "horizontal" ? (
                <div className="flex flex-col justify-between py-2 flex-1">
                    <div>
                        <h3 className="text-brand font-black text-sm lg:text-base line-clamp-1">{title}</h3>
                        <div className="flex items-center gap-1 mt-1">
                            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                            <span className="text-[10px] lg:text-xs text-text-light font-bold">{rating}</span>
                        </div>
                    </div>
                    <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-text-light shrink-0" />
                            <span className="text-[10px] lg:text-xs text-text-light truncate">{location}</span>
                        </div>
                        <div className="flex items-center gap-1 flex-wrap">
                            <span className="text-brand font-black text-sm lg:text-lg whitespace-nowrap">{currency} {price}</span>
                            <span className="text-[10px] lg:text-xs text-text-light whitespace-nowrap">{unit}</span>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="mt-3 px-1 pb-2 min-w-0">
                    <div className="flex justify-between items-start gap-1">
                        <h3 className="text-brand font-black text-sm lg:text-base leading-tight line-clamp-2">{title}</h3>
                        <div className="flex items-center gap-1 shrink-0 bg-white px-2 py-1 rounded-xl shadow-sm border border-soft-border">
                            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                            <span className="text-[10px] lg:text-xs text-brand font-black">{rating}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 mt-2">
                        <MapPin className="w-3 h-3 text-text-light shrink-0" />
                        <span className="text-[10px] lg:text-xs text-text-light truncate">{location}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-3 flex-wrap">
                        <span className="text-brand font-black text-sm lg:text-lg whitespace-nowrap">{currency} {price}</span>
                        <span className="text-[10px] lg:text-xs text-text-light whitespace-nowrap">{unit}</span>
                    </div>
                </div>
            )}
        </>
    );



    if (href || adId) {
        const slug = title
            ? title.replace(/\s+/g, '-').replace(/\//g, '-')
            : 'property';
        const finalHref = href || `/ads/${adId}/${slug}`;

        return (
            <Link href={finalHref} >
                {cardContent}
            </Link>
        );
    }

    return (
        <div>
            {cardContent}
        </div>
    );
}

