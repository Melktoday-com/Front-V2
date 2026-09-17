"use client";

import { cn, toPersianDigits } from "@/lib/utils";

interface NotificationFilterTabsProps {
    onlyUnread: boolean;
    onTabChange: (onlyUnread: boolean) => void;
    unreadCount?: number;
    totalCount?: number;
}

export function NotificationFilterTabs({
    onlyUnread,
    onTabChange,
    unreadCount = 0,
    totalCount = 0,
}: NotificationFilterTabsProps) {
    return (
        <div className="flex items-center gap-2 p-1.5 bg-soft-bg rounded-2xl border border-soft-border/60 w-fit">
            <button
                type="button"
                onClick={() => onTabChange(false)}
                className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all",
                    !onlyUnread
                        ? "bg-white text-brand shadow-sm"
                        : "text-secondary hover:text-brand"
                )}
            >
                <span>همه اعلان‌ها</span>
                {totalCount > 0 && (
                    <span
                        className={cn(
                            "px-2 py-0.5 rounded-full text-[11px] font-bold",
                            !onlyUnread ? "bg-soft-bg text-brand" : "bg-white/60 text-secondary"
                        )}
                    >
                        {toPersianDigits(totalCount)}
                    </span>
                )}
            </button>

            <button
                type="button"
                onClick={() => onTabChange(true)}
                className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all",
                    onlyUnread
                        ? "bg-white text-primary shadow-sm"
                        : "text-secondary hover:text-brand"
                )}
            >
                <span>خوانده‌نشده‌ها</span>
                {unreadCount > 0 && (
                    <span
                        className={cn(
                            "px-2 py-0.5 rounded-full text-[11px] font-black",
                            onlyUnread ? "bg-primary/10 text-primary" : "bg-primary/10 text-primary"
                        )}
                    >
                        {toPersianDigits(unreadCount)}
                    </span>
                )}
            </button>
        </div>
    );
}
