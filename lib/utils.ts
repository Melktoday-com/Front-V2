import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | undefined): string {
    if (amount === undefined || amount === null) return "۰";
    return new Intl.NumberFormat("fa-IR").format(amount);
}
