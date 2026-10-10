import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string | undefined | null): string {
    if (amount === undefined || amount === null || amount === "") return "۰";
    const num = typeof amount === "string" ? parseFloat(amount.replace(/,/g, "")) : amount;
    if (isNaN(num)) return "۰";
    return new Intl.NumberFormat("fa-IR").format(num);
}

export function toPersianDigits(n: number | string | undefined | null): string {
    if (n === undefined || n === null) return "";
    const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
    return String(n).replace(/\d/g, (d) => persianDigits[parseInt(d, 10)]);
}

export function formatPrice(amount: number | string | undefined | null, suffix = " تومان"): string {
    if (amount === undefined || amount === null || amount === "") return `۰${suffix}`;
    const num = typeof amount === "string" ? parseFloat(amount.replace(/,/g, "")) : amount;
    if (isNaN(num)) return `۰${suffix}`;
    return `${new Intl.NumberFormat("fa-IR").format(num)}${suffix}`;
}

/**
 * Specifically for listing (ad) or temporary rental prices where an unset or 0 price means "توافقی" (negotiable).
 */
export function formatAdPrice(amount: number | string | undefined | null, suffix = " تومان"): string {
    if (amount === undefined || amount === null || amount === "") return "توافقی";
    const num = typeof amount === "string" ? parseFloat(amount.replace(/,/g, "")) : amount;
    if (isNaN(num) || num <= 0) return "توافقی";
    return `${new Intl.NumberFormat("fa-IR").format(num)}${suffix}`;
}

export function extractMediaId(media?: string | { id: string; type?: string } | null): string {
    if (!media) return "";
    return typeof media === "object" ? media.id : media;
}

function getSiteBaseUrl(): string {
    const raw = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || "";
    if (raw) {
        if (raw.startsWith("http://") || raw.startsWith("https://")) {
            return raw.replace(/\/$/, "");
        }
        if (!raw.startsWith("/")) {
            return `https://${raw.replace(/\/$/, "")}`;
        }
    }
    if (typeof window !== "undefined" && window.location?.origin) {
        return window.location.origin;
    }
    return "";
}

function getMediaBaseUrl(): string {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "/backend/api";
    if (apiBase.startsWith("http://") || apiBase.startsWith("https://")) {
        return apiBase.replace(/\/$/, "");
    }
    const siteBase = getSiteBaseUrl();
    if (siteBase) {
        return `${siteBase}/${apiBase.replace(/^\//, "")}`.replace(/\/$/, "");
    }
    return apiBase.startsWith("/") ? apiBase.replace(/\/$/, "") : `/${apiBase.replace(/\/$/, "")}`;
}

export function getMediaUrl(mediaIdOrUrl?: string | { id: string; type?: string } | null): string {
    if (!mediaIdOrUrl) return "";
    const raw = typeof mediaIdOrUrl === "object" ? mediaIdOrUrl.id : mediaIdOrUrl;
    if (!raw) return "";
    if (raw.startsWith("http://") || raw.startsWith("https://") || raw.startsWith("data:")) {
        return raw;
    }
    const siteBase = getSiteBaseUrl();
    if (raw.startsWith("/backend/api/media/") || raw.startsWith("/media/")) {
        return siteBase ? `${siteBase}${raw}` : raw;
    }
    if (raw.startsWith("/")) {
        return raw;
    }
    return `${getMediaBaseUrl()}/media/${raw}`;
}

export function getMediaPosterUrl(media?: string | { id: string; type?: string; posterUrl?: string } | null): string {
    if (!media) return "/property-placeholder.svg";
    if (typeof media === "object") {
        if (media.posterUrl) return media.posterUrl;
        const id = media.id;
        if (!id) return "/property-placeholder.svg";
        if (media.type === "IMAGE") {
            return getMediaUrl(id);
        }
        return `${getMediaBaseUrl()}/media/${id}/poster`;
    }
    if (media.startsWith("http://") || media.startsWith("https://") || media.startsWith("data:")) {
        return media;
    }
    const siteBase = getSiteBaseUrl();
    if (media.startsWith("/backend/api/media/") || media.startsWith("/media/")) {
        const full = siteBase ? `${siteBase}${media}` : media;
        return `${full}/poster`;
    }
    if (media.startsWith("/")) {
        return media;
    }
    return `${getMediaBaseUrl()}/media/${media}/poster`;
}

export function getPaginationItems(
    currentStart: number,
    currentEnd: number,
    total: number
): (number | "...")[] {
    if (total <= 9) {
        return Array.from({ length: total }, (_, i) => i + 1);
    }

    const items: (number | "...")[] = [];
    items.push(1);

    if (currentStart > 3) {
        items.push("...");
    }

    const start = Math.max(2, currentStart);
    const end = Math.min(total - 1, currentEnd);

    for (let i = start; i <= end; i++) {
        items.push(i);
    }

    if (currentEnd < total - 2) {
        items.push("...");
    }

    if (total > 1) {
        items.push(total);
    }

    return items.filter((item, index, self) => item === "..." || self.indexOf(item) === index);
}

