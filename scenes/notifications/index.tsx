"use client";

import { NotificationCard } from "@/components/notifications/NotificationCard";
import { NotificationEmptyState } from "@/components/notifications/NotificationEmptyState";
import { NotificationFilterTabs } from "@/components/notifications/NotificationFilterTabs";
import { NotificationSkeleton } from "@/components/notifications/NotificationSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useMarkNotificationAsRead, useNotifications } from "@/hooks/useNotifications";
import { toPersianDigits } from "@/lib/utils";
import {
    Bell,
    ChevronLeft,
    ChevronRight,
    LogIn,
    RotateCw,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function NotificationsScene() {
    const router = useRouter();
    const { isLoggedIn, isLoading: isAuthLoading } = useAuth();

    const [onlyUnread, setOnlyUnread] = useState(false);
    const [page, setPage] = useState(1);
    const limit = 15;

    const {
        data: notificationsData,
        isLoading,
        isFetching,
        refetch,
    } = useNotifications({
        onlyUnread,
        page,
        limit,
    });

    const markAsReadMutation = useMarkNotificationAsRead();

    const handleMarkRead = (id: string) => {
        markAsReadMutation.mutate(id, {
            onSuccess: () => {
                toast.success("اعلان به عنوان خوانده‌شده علامت‌گذاری شد");
            },
            onError: () => {
                toast.error("خطا در بروزرسانی وضعیت اعلان");
            },
        });
    };

    const handleTabChange = (newOnlyUnread: boolean) => {
        setOnlyUnread(newOnlyUnread);
        setPage(1);
    };

    // If user is not logged in
    if (!isAuthLoading && !isLoggedIn) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
                <div className="w-20 h-20 rounded-full bg-soft-bg mx-auto flex items-center justify-center text-secondary">
                    <Bell className="w-10 h-10 opacity-40" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-xl font-black text-brand">ورود به حساب کاربری</h2>
                    <p className="text-sm text-secondary font-medium max-w-md mx-auto">
                        برای مشاهده اعلان‌ها، پیام‌های سیستمی و وضعیت آگهی‌های خود، ابتدا وارد حساب کاربری شوید.
                    </p>
                </div>
                <div>
                    <Link
                        href="/auth?redirect=/notifications"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-black text-sm rounded-2xl shadow-lg shadow-primary/25 hover:bg-primary/90 transition-transform active:scale-95"
                    >
                        <LogIn className="w-4 h-4" />
                        <span>ورود یا ثبت‌نام در ملک‌تودی</span>
                    </Link>
                </div>
            </div>
        );
    }

    const items = notificationsData?.items || [];
    const total = notificationsData?.total || 0;
    const unreadCount = notificationsData?.unreadCount || 0;
    const totalPages = Math.ceil(total / limit) || 1;

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 pb-28 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="flex items-center gap-1.5 text-xs font-bold text-secondary hover:text-brand transition-colors"
                >
                    <ChevronRight className="w-5 h-5" />
                    <span>بازگشت</span>
                </button>

                <div className="flex items-center gap-2">
                    <h1 className="text-base sm:text-lg font-black text-brand">اعلان‌های من</h1>
                    {unreadCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-black bg-primary/10 text-primary">
                            {toPersianDigits(unreadCount)} جدید
                        </span>
                    )}
                </div>

                <button
                    type="button"
                    onClick={() => refetch()}
                    disabled={isFetching}
                    title="بروزرسانی"
                    aria-label="بروزرسانی لیست اعلان‌ها"
                    className="p-2 text-secondary hover:text-brand bg-white rounded-xl border border-soft-border/70 hover:shadow-sm transition-all disabled:opacity-50"
                >
                    <RotateCw className={`w-4 h-4 ${isFetching ? "animate-spin text-primary" : ""}`} />
                </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <NotificationFilterTabs
                    onlyUnread={onlyUnread}
                    onTabChange={handleTabChange}
                    unreadCount={unreadCount}
                    totalCount={total}
                />
            </div>

            {/* Notifications Content */}
            {isLoading ? (
                <NotificationSkeleton />
            ) : items.length === 0 ? (
                <NotificationEmptyState
                    onlyUnread={onlyUnread}
                    onResetFilter={() => handleTabChange(false)}
                />
            ) : (
                <div className="space-y-3">
                    {items.map((notification) => (
                        <NotificationCard
                            key={notification.id}
                            notification={notification}
                            onMarkRead={handleMarkRead}
                            isPendingMarkRead={
                                markAsReadMutation.isPending &&
                                markAsReadMutation.variables === notification.id
                            }
                        />
                    ))}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 pt-4">
                    <button
                        type="button"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1 || isFetching}
                        className="flex items-center gap-1 px-4 py-2 bg-white border border-soft-border/70 rounded-xl text-xs font-bold text-brand hover:bg-soft-bg disabled:opacity-40 transition-colors"
                    >
                        <ChevronRight className="w-4 h-4" />
                        <span>قبلی</span>
                    </button>

                    <span className="text-xs font-black text-secondary">
                        صفحه {toPersianDigits(page)} از {toPersianDigits(totalPages)}
                    </span>

                    <button
                        type="button"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages || isFetching}
                        className="flex items-center gap-1 px-4 py-2 bg-white border border-soft-border/70 rounded-xl text-xs font-bold text-brand hover:bg-soft-bg disabled:opacity-40 transition-colors"
                    >
                        <span>بعدی</span>
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
}
