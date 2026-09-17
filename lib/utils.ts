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
