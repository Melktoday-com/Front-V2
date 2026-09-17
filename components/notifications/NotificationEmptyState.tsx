"use client";

import { BellOff } from "lucide-react";
import Link from "next/link";

interface NotificationEmptyStateProps {
    onlyUnread?: boolean;
    onResetFilter?: () => void;
}

export function NotificationEmptyState({
    onlyUnread,
    onResetFilter,
}: NotificationEmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center text-center p-12 bg-white rounded-3xl border border-soft-border/70 shadow-sm space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-soft-bg flex items-center justify-center text-secondary">
                <BellOff className="w-8 h-8 opacity-60" />
            </div>

            <div className="space-y-1 max-w-sm">
                <h3 className="text-base font-black text-brand">
                    {onlyUnread ? "هیچ اعلان خوانده‌نشده‌ای ندارید" : "هیچ اعلانی ثبت نشده است"}
                </h3>
                <p className="text-xs text-secondary font-medium leading-relaxed">
                    {onlyUnread
                        ? "تمام اعلان‌ها و پیام‌های سیستمی شما مطالعه شده‌اند."
                        : "اعلان‌های مربوط به آگهی‌ها، گفت‌وگوها و پیام‌های سیستم در این قسمت نمایش داده می‌شوند."}
                </p>
            </div>

            {onlyUnread && onResetFilter ? (
                <button
                    type="button"
                    onClick={onResetFilter}
                    className="mt-2 px-5 py-2.5 bg-soft-bg hover:bg-soft-border/50 text-brand text-xs font-bold rounded-2xl transition-colors"
                >
                    مشاهده تمام اعلان‌ها
                </button>
            ) : (
                <Link
                    href="/"
                    className="mt-2 px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-2xl hover:bg-primary/90 transition-colors shadow-sm"
                >
                    بازگشت به صفحه اصلی
                </Link>
            )}
        </div>
    );
}
