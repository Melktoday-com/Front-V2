import { isSameDay, isThisYear, isToday, isYesterday } from "date-fns-jalali";

/**
 * Checks if two date strings fall on the same day in the Solar Hijri (Jalali) calendar.
 */
export function isSameMessageDay(
    currentDate?: string | null,
    prevDate?: string | null
): boolean {
    if (!currentDate || !prevDate) return false;
    const curr = new Date(currentDate);
    const prev = new Date(prevDate);
    if (isNaN(curr.getTime()) || isNaN(prev.getTime())) return false;
    return isSameDay(curr, prev);
}

/**
 * Determines whether a date separator should be displayed for the current message.
 * A separator is displayed if it's the first valid message or if the message date
 * belongs to a different day than the previous message.
 */
export function shouldShowDateSeparator(
    currentDate?: string | null,
    prevDate?: string | null
): boolean {
    if (!currentDate) return false;
    const curr = new Date(currentDate);
    if (isNaN(curr.getTime())) return false;
    if (!prevDate) return true;
    const prev = new Date(prevDate);
    if (isNaN(prev.getTime())) return true;
    return !isSameDay(curr, prev);
}

/**
 * Formats a message timestamp into a Shamsi (Solar Hijri) date string for date dividers:
 * - "امروز" if today
 * - "دیروز" if yesterday
 * - e.g. "شنبه، ۱۶ آبان" if earlier this Jalali year
 * - e.g. "سه‌شنبه، ۱۵ مهر ۱۴۰۴" if from a previous Jalali year
 */
export function formatMessageDate(dateStr?: string | null): string {
    if (!dateStr) return "";
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return "";

        if (isToday(d)) return "امروز";
        if (isYesterday(d)) return "دیروز";

        const weekday = d.toLocaleDateString("fa-IR-u-ca-persian", { weekday: "long" });
        const day = d.toLocaleDateString("fa-IR-u-ca-persian", { day: "numeric" });
        const month = d.toLocaleDateString("fa-IR-u-ca-persian", { month: "long" });

        if (isThisYear(d)) {
            return `${weekday}، ${day} ${month}`;
        }

        const year = d.toLocaleDateString("fa-IR-u-ca-persian", { year: "numeric" });
        return `${weekday}، ${day} ${month} ${year}`;
    } catch {
        return "";
    }
}

/**
 * Formats a timestamp into Persian time (HH:mm) for individual message bubbles.
 */
export function formatMessageTime(dateStr?: string | null): string {
    if (!dateStr) return "";
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return "";
        return d.toLocaleTimeString("fa-IR", {
            hour: "2-digit",
            minute: "2-digit",
        });
    } catch {
        return "";
    }
}

/**
 * Formats full Shamsi date and time for tooltips (e.g. on hover over message time).
 */
export function formatFullDateTime(dateStr?: string | null): string {
    if (!dateStr) return "";
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return "";
        return d.toLocaleDateString("fa-IR-u-ca-persian", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    } catch {
        return "";
    }
}

/**
 * Formats timestamps for conversation list previews:
 * - Time if today (e.g. "۱۴:۳۲")
 * - "دیروز" if yesterday
 * - Shamsi day & month if earlier this year (e.g. "۱۶ آبان")
 * - Shamsi numeric date if older years (e.g. "۱۴۰۳/۰۸/۱۶")
 */
export function formatConversationDate(dateStr?: string | null): string {
    if (!dateStr) return "";
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return "";

        if (isToday(d)) {
            return d.toLocaleTimeString("fa-IR", {
                hour: "2-digit",
                minute: "2-digit",
            });
        }
        if (isYesterday(d)) {
            return "دیروز";
        }
        if (isThisYear(d)) {
            return d.toLocaleDateString("fa-IR-u-ca-persian", {
                day: "numeric",
                month: "long",
            });
        }
        return d.toLocaleDateString("fa-IR-u-ca-persian", {
            year: "numeric",
            month: "numeric",
            day: "numeric",
        });
    } catch {
        return "";
    }
}
