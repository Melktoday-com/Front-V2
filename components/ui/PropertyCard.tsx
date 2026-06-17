import { cn } from "@/lib/utils";
import { Heart, MapPin, Star } from "lucide-react";
import Image from "next/image";

interface PropertyCardProps {
    title: string;
    price: string;
    rating: number;
    location: string;
    image: string;
    category: string;
    variant?: "vertical" | "horizontal";
    className?: string;
}

export function PropertyCard({
    title,
    price,
    rating,
    location,
    image,
    category,
    variant = "vertical",
    className,
}: PropertyCardProps) {
    if (variant === "horizontal") {
        return (
            <div className={cn("flex bg-white p-2 rounded-[25px] gap-4 border border-soft-border shadow-sm transition-all hover:shadow-md hover:border-primary/20", className)}>
                <div className="relative w-[130px] h-[140px] lg:w-[160px] lg:h-[160px] shrink-0">
                    <Image
                        src={image}
                        alt={title}
                        fill
                        className="object-cover rounded-[20px]"
                    />
                    <button className="absolute top-2 left-2 w-6 h-6 lg:w-8 lg:h-8 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center transition-colors hover:bg-white/40">
                        <Heart className="w-3 h-3 lg:w-4 lg:h-4 text-white hover:fill-white" />
                    </button>
                    <div className="absolute bottom-2 left-2 bg-brand/70 backdrop-blur-sm text-white text-[10px] px-2 py-1 rounded-lg">
                        {category}
                    </div>
                </div>
                <div className="flex flex-col justify-between py-2 flex-1">
                    <div>
                        <h3 className="text-brand font-black text-sm lg:text-base line-clamp-1">{title}</h3>
                        <div className="flex items-center gap-1 mt-1">
                            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                            <span className="text-[10px] lg:text-xs text-text-light font-bold">{rating}</span>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-text-light" />
                            <span className="text-[10px] lg:text-xs text-text-light">{location}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="text-brand font-black text-sm lg:text-lg">$ {price}</span>
                            <span className="text-[10px] lg:text-xs text-text-light">/ماهانه</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={cn("bg-soft-bg p-2 rounded-[25px] w-full border border-soft-border shadow-sm transition-all hover:shadow-md hover:bg-white group", className)}>
            <div className="relative aspect-[160/170] w-full overflow-hidden rounded-[20px]">
                <Image
                    src={image}
                    alt={title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <button className="absolute top-3 left-3 w-8 h-8 lg:w-9 lg:h-9 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center transition-colors hover:bg-white/40">
                    <Heart className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
                </button>
                <div className="absolute bottom-3 left-3 bg-brand/70 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-xl">
                    {category}
                </div>
            </div>
            <div className="mt-3 px-1 pb-2">
                <div className="flex justify-between items-start">
                    <h3 className="text-brand font-black text-sm lg:text-base leading-tight ml-2 line-clamp-2">{title}</h3>
                    <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-xl shadow-sm border border-soft-border">
                        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                        <span className="text-[10px] lg:text-xs text-brand font-black">{rating}</span>
                    </div>
                </div>
                <div className="flex items-center gap-1 mt-2">
                    <MapPin className="w-3 h-3 text-text-light" />
                    <span className="text-[10px] lg:text-xs text-text-light">{location}</span>
                </div>
                <div className="flex items-center gap-1 mt-3">
                    <span className="text-brand font-black text-sm lg:text-lg">$ {price}</span>
                    <span className="text-[10px] lg:text-xs text-text-light">/ماهانه</span>
                </div>
            </div>
        </div>
    );
}
