"use client";

import { MapPin, Star, Verified } from "lucide-react";
import Image from "next/image";

interface AgencyCardProps {
    id: string;
    name: string;
    bio?: string;
    logoUrl?: string | null;
    isVerified: boolean;
    rating: number;
    location?: string;
}

export function AgencyCard({ name, bio, logoUrl, isVerified, rating, location }: AgencyCardProps) {
    return (
        <div className="bg-white rounded-[30px] p-6 border border-soft-border hover:shadow-xl transition-all duration-300 group">
            <div className="flex gap-4">
                <div className="relative w-16 h-16 lg:w-20 lg:h-20 rounded-2xl overflow-hidden bg-soft-bg shrink-0 border border-soft-border group-hover:border-primary/30 transition-colors">
                    <Image
                        src={logoUrl || "/assets/images/agency-placeholder.png"}
                        alt={name}
                        fill
                        className="object-cover"
                    />
                </div>

                <div className="flex-1 space-y-2 min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className="text-brand font-black text-base lg:text-lg truncate">{name}</h3>
                        {isVerified && (
                            <Verified className="w-5 h-5 text-primary shrink-0" />
                        )}
                    </div>

                    <div className="flex items-center gap-3 text-secondary text-xs font-bold">
                        <div className="flex items-center gap-1 bg-yellow-400/10 text-yellow-600 px-2 py-0.5 rounded-full">
                            <Star className="w-3 h-3 fill-current" />
                            <span>{rating || 0}</span>
                        </div>
                        {location && (
                            <div className="flex items-center gap-1 group/loc">
                                <MapPin className="w-3 h-3 text-primary" />
                                <span className="truncate">{location}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {bio && (
                <p className="mt-4 text-secondary text-xs lg:text-sm font-medium line-clamp-2 leading-relaxed">
                    {bio}
                </p>
            )}

            <button className="mt-6 w-full py-3 bg-soft-bg text-brand font-black text-sm rounded-2xl group-hover:bg-brand group-hover:text-white transition-all duration-300">
                مشاهده آژانس
            </button>
        </div>
    );
}
