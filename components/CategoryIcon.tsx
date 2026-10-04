"use client";

import { cn, getMediaUrl } from "@/lib/utils";
import Image from "next/image";
import { useState } from "react";

export interface CategoryIconProps {
    icon?: string | null;
    displayName?: string;
    className?: string;
    size?: number;
}

export function CategoryIcon({
    icon,
    displayName,
    className,
    size = 24,
}: CategoryIconProps) {
    const [imgError, setImgError] = useState(false);

    if (!icon || imgError) {
        return null;
    }

    const mediaUrl = getMediaUrl(icon);
    return (
        <span className={cn("relative inline-flex items-center justify-center shrink-0", className)}>
            <Image
                src={mediaUrl}
                alt={displayName || "Category icon"}
                width={size}
                height={size}
                onError={() => setImgError(true)}
                className="object-contain"
            />
        </span>
    );
}
