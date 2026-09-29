import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | undefined): string {
    if (amount === undefined || amount === null) return "۰";
    return new Intl.NumberFormat("fa-IR").format(amount);
}

export function toPersianDigits(n: number | string | undefined | null): string {
    if (n === undefined || n === null) return "";
    const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
    return String(n).replace(/\d/g, (d) => persianDigits[parseInt(d, 10)]);
}

export function formatPrice(amount: number | string | undefined | null, suffix = " تومان"): string {
    if (amount === undefined || amount === null || amount === "") return "توافقی";
    const num = typeof amount === "string" ? parseFloat(amount.replace(/,/g, "")) : amount;
    if (isNaN(num) || num === 0) return "توافقی";
    return `${new Intl.NumberFormat("fa-IR").format(num)}${suffix}`;
}

export function getMediaUrl(mediaIdOrUrl?: string | null): string {
    if (!mediaIdOrUrl) return "";
    if (
        mediaIdOrUrl.startsWith("http://") ||
        mediaIdOrUrl.startsWith("https://") ||
        mediaIdOrUrl.startsWith("/") ||
        mediaIdOrUrl.startsWith("data:")
    ) {
        return mediaIdOrUrl;
    }
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
    const cleanBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
    return `${cleanBase}/media/${mediaIdOrUrl}`;
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

