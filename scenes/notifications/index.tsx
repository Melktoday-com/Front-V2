"use client";

import { NotificationCard } from "@/components/notifications/NotificationCard";
import { NotificationEmptyState } from "@/components/notifications/NotificationEmptyState";
import { NotificationFilterTabs } from "@/components/notifications/NotificationFilterTabs";
import { NotificationSkeleton } from "@/components/notifications/NotificationSkeleton";
import { useAuth } from "@/hooks/useAuth";
import {
    useInfiniteNotifications,
    useMarkAllNotificationsAsRead,
    useMarkNotificationAsRead,
} from "@/hooks/useNotifications";
import { toPersianDigits } from "@/lib/utils";
import {
    Bell,
    CheckCheck,
    ChevronRight,
    Loader2,
    LogIn,
    RotateCw,
} from "lucide-react";
import Link from "next/link";
import { useSafeBack } from "@/hooks/useSafeBack";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export default function NotificationsScene() {
    const router = useRouter();
    const handleBack = useSafeBack("/");
    const { isLoggedIn, isLoading: isAuthLoading } = useAuth();
    const [onlyUnread, setOnlyUnread] = useState(false);
    const sentinelRef = useRef<HTMLDivElement>(null);

    const {
        data,
        isLoading,
        isFetching,
        isFetchingNextPage,
        hasNextPage,
        fetchNextPage,
        refetch,
    } = useInfiniteNotifications({
        onlyUnread,
        limit: 15,
    });

    const markAsReadMutation = useMarkNotificationAsRead();
    const markAllAsReadMutation = useMarkAllNotificationsAsRead();

    // Infinite Scroll Intersection Observer
    useEffect(() => {
        if (!sentinelRef.current || !hasNextPage || isFetchingNextPage) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
                    fetchNextPage();
                }
            },
            {
                rootMargin: "250px",
                threshold: 0.1,
            }
        );

        observer.observe(sentinelRef.current);
        return () => observer.disconnect();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

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

    const handleMarkAllAsRead = () => {
        markAllAsReadMutation.mutate(undefined, {
            onSuccess: (res) => {
                const count = res?.markedCount ?? 0;
                toast.success(
                    count > 0
                        ? `${toPersianDigits(count)} اعلان به عنوان خوانده‌شده علامت‌گذاری شدند`
                        : "تمام اعلان‌ها خوانده‌شده هستند"
                );
            },
            onError: () => {
                toast.error("خطا در خواندن تمامی اعلان‌ها");
            },
        });
    };

    const handleTabChange = (newOnlyUnread: boolean) => {
        setOnlyUnread(newOnlyUnread);
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

    const firstPage = data?.pages[0];
    const items = data?.pages.flatMap((page) => page.items) || [];
    const total = firstPage?.total || 0;
    const totalAll = firstPage?.totalAll || 0;
    const unreadCount = firstPage?.unreadCount || 0;

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 pb-28 lg:pb-10 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <button
                    type="button"
                    onClick={handleBack}
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

                <div className="flex items-center gap-2">
                    {/* Read All CTA button */}
                    {unreadCount > 0 && (
                        <button
                            type="button"
                            onClick={handleMarkAllAsRead}
                            disabled={markAllAsReadMutation.isPending}
                            title="علامت‌گذاری همه به عنوان خوانده‌شده"
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 rounded-xl hover:bg-emerald-100/70 active:scale-95 transition-all disabled:opacity-50"
                        >
                            {markAllAsReadMutation.isPending ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                            ) : (
                                <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                            )}
                            <span className="hidden sm:inline">خواندن همه</span>
                        </button>
                    )}

                    {/* Refresh button */}
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
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <NotificationFilterTabs
                    onlyUnread={onlyUnread}
                    onTabChange={handleTabChange}
                    unreadCount={unreadCount}
                    totalCount={totalAll}
                />

                {unreadCount > 0 && (
                    <button
                        type="button"
                        onClick={handleMarkAllAsRead}
                        disabled={markAllAsReadMutation.isPending}
                        className="sm:hidden flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700"
                    >
                        <CheckCheck className="w-3.5 h-3.5" />
                        <span>خواندن همه ({toPersianDigits(unreadCount)})</span>
                    </button>
                )}
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

                    {/* Infinite Scroll Sentinel & Loader */}
                    <div ref={sentinelRef} className="pt-4 flex items-center justify-center">
                        {isFetchingNextPage ? (
                            <div className="flex items-center gap-2 py-4 text-xs font-bold text-secondary">
                                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                <span>در حال بارگذاری اعلان‌های بیشتر...</span>
                            </div>
                        ) : hasNextPage ? (
                            <button
                                type="button"
                                onClick={() => fetchNextPage()}
                                className="px-4 py-2 text-xs font-bold text-secondary hover:text-brand bg-soft-bg hover:bg-soft-border/50 rounded-xl transition-colors"
                            >
                                بارگذاری موارد بیشتر
                            </button>
                        ) : items.length > 5 ? (
                            <div className="text-center py-4 text-xs font-medium text-secondary/60">
                                تمامی اعلان‌ها ({toPersianDigits(total)}) بارگذاری شدند
                            </div>
                        ) : null}
                    </div>
                </div>
            )}
        </div>
    );
}
