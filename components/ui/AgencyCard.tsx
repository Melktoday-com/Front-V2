"use client";

import { MapPin, Star, Verified } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface AgencyCardProps {
    id: string;
    name: string;
    bio?: string;
    logoUrl?: string | null;
    isVerified: boolean;
    rating: number;
    location?: string;
}

export function AgencyCard({ id, name, bio, logoUrl, isVerified, rating, location }: AgencyCardProps) {
    const slug = name.replace(/\s+/g, "-");
    const href = `/agency/${id}/${encodeURIComponent(slug)}`;

    return (
        <Link href={href}>
            <div className="bg-white rounded-2xl p-4 border border-soft-border hover:shadow-lg transition-all duration-300 group h-full flex flex-col">
                <div className="flex gap-3">
                    <div className="relative w-12 h-12 lg:w-14 lg:h-14 rounded-xl overflow-hidden bg-soft-bg shrink-0 border border-soft-border group-hover:border-primary/30 transition-colors">
                        <Image
                            src={logoUrl || "/agency-placeholder.png"}
                            alt={name}
                            fill
                            className="object-cover"
                        />
                    </div>

                    <div className="flex-1 space-y-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                            <h3 className="text-brand font-black text-sm lg:text-base truncate">{name}</h3>
                            {isVerified && (
                                <Verified className="w-4 h-4 text-primary shrink-0" />
                            )}
                        </div>

                        <div className="flex items-center gap-2 text-secondary text-[10px] lg:text-xs font-bold">
                            <div className="flex items-center gap-0.5 text-yellow-500">
                                <Star className="w-2.5 h-2.5 fill-current" />
                                <span>{rating || 0}</span>
                            </div>
                            {location && (
                                <div className="flex items-center gap-1 group/loc">
                                    <MapPin className="w-2.5 h-2.5 text-text-light" />
                                    <span className="truncate text-text-light">{location}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {bio && (
                    <p className="mt-3 text-secondary text-[11px] lg:text-xs font-medium line-clamp-2 leading-tight">
                        {bio}
                    </p>
                )}
            </div>
        </Link>
    );
}
