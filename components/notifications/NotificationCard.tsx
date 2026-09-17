"use client";

import { NotificationSummary, NotificationType } from "@/types/api/notification.types";
import { cn, toPersianDigits } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns-jalali";
import {
    AlertCircle,
    Bell,
    Check,
    CheckCircle2,
    ChevronLeft,
    Clock,
    FileCheck,
    Loader2,
    MessageSquare,
    Rocket,
    ShieldAlert,
    ShieldCheck,
    Sparkles,
    Wallet,
    XCircle,
} from "lucide-react";
import Link from "next/link";
import React from "react";

interface NotificationCardProps {
    notification: NotificationSummary;
    onMarkRead?: (id: string) => void;
    isPendingMarkRead?: boolean;
}

interface TypeConfig {
    icon: React.ElementType;
    iconBg: string;
    iconColor: string;
    badgeLabel: string;
    badgeBg: string;
    badgeColor: string;
}

const TYPE_CONFIGS: Record<NotificationType, TypeConfig> = {
    LISTING_APPROVED: {
        icon: CheckCircle2,
        iconBg: "bg-emerald-50",
        iconColor: "text-emerald-600",
        badgeLabel: "تایید آگهی",
        badgeBg: "bg-emerald-50",
        badgeColor: "text-emerald-700",
    },
    LISTING_REJECTED: {
        icon: XCircle,
        iconBg: "bg-rose-50",
        iconColor: "text-rose-600",
        badgeLabel: "رد آگهی",
        badgeBg: "bg-rose-50",
        badgeColor: "text-rose-700",
    },
    CAMPAIGN_APPROVED: {
        icon: Sparkles,
        iconBg: "bg-amber-50",
        iconColor: "text-amber-600",
        badgeLabel: "تایید کمپین",
        badgeBg: "bg-amber-50",
        badgeColor: "text-amber-700",
    },
    CAMPAIGN_REJECTED: {
        icon: AlertCircle,
        iconBg: "bg-rose-50",
        iconColor: "text-rose-600",
        badgeLabel: "رد کمپین",
        badgeBg: "bg-rose-50",
        badgeColor: "text-rose-700",
    },
    CAMPAIGN_ACTIVATED: {
        icon: Rocket,
        iconBg: "bg-blue-50",
        iconColor: "text-blue-600",
        badgeLabel: "فعال‌سازی ارتقا",
        badgeBg: "bg-blue-50",
        badgeColor: "text-blue-700",
    },
    NEW_MESSAGE: {
        icon: MessageSquare,
        iconBg: "bg-indigo-50",
        iconColor: "text-indigo-600",
        badgeLabel: "پیام جدید",
        badgeBg: "bg-indigo-50",
        badgeColor: "text-indigo-700",
    },
    ROLE_APPROVED: {
        icon: ShieldCheck,
        iconBg: "bg-purple-50",
        iconColor: "text-purple-600",
        badgeLabel: "ارتقای نقش کاربر",
        badgeBg: "bg-purple-50",
        badgeColor: "text-purple-700",
    },
    ROLE_REJECTED: {
        icon: ShieldAlert,
        iconBg: "bg-rose-50",
        iconColor: "text-rose-600",
        badgeLabel: "رد درخواست نقش",
        badgeBg: "bg-rose-50",
        badgeColor: "text-rose-700",
    },
    ADMIN_BROADCAST: {
        icon: Bell,
        iconBg: "bg-primary/10",
        iconColor: "text-primary",
        badgeLabel: "اطلاعیه همگانی",
        badgeBg: "bg-primary/10",
        badgeColor: "text-primary",
    },
    CREDIT_RECEIVED: {
        icon: Wallet,
        iconBg: "bg-emerald-50",
        iconColor: "text-emerald-600",
        badgeLabel: "افزایش اعتبار",
        badgeBg: "bg-emerald-50",
        badgeColor: "text-emerald-700",
    },
    REPORT_RESOLVED: {
        icon: FileCheck,
        iconBg: "bg-teal-50",
        iconColor: "text-teal-600",
        badgeLabel: "رسیدگی به گزارش",
        badgeBg: "bg-teal-50",
        badgeColor: "text-teal-700",
    },
};

const DEFAULT_CONFIG: TypeConfig = {
    icon: Bell,
    iconBg: "bg-gray-100",
    iconColor: "text-gray-600",
    badgeLabel: "اعلان سیستم",
    badgeBg: "bg-gray-100",
    badgeColor: "text-gray-700",
};

export function NotificationCard({
    notification,
    onMarkRead,
    isPendingMarkRead = false,
}: NotificationCardProps) {
    const config = TYPE_CONFIGS[notification.type] || DEFAULT_CONFIG;
    const Icon = config.icon;

    // Build intelligent link navigation
    let targetLink: string | null = null;
    let targetLinkLabel = "مشاهده جزئیات";

    if (notification.type === "NEW_MESSAGE") {
        targetLink = "/profile/chat";
        targetLinkLabel = "مشاهده گفت‌وگو";
    } else if (notification.type === "CREDIT_RECEIVED") {
        targetLink = "/wallet";
        targetLinkLabel = "مشاهده کیف پول";
    } else if (
        (notification.type === "LISTING_APPROVED" || notification.type === "LISTING_REJECTED") &&
        notification.referenceId
    ) {
        targetLink = `/ads/${notification.referenceId}`;
        targetLinkLabel = "مشاهده آگهی";
    } else if (notification.type === "ROLE_APPROVED" || notification.type === "ROLE_REJECTED") {
        targetLink = "/profile";
        targetLinkLabel = "مشاهده پروفایل";
    }

    let timeAgo = "";
    try {
        timeAgo = formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true });
        timeAgo = toPersianDigits(timeAgo);
    } catch {
        timeAgo = "چند لحظه پیش";
    }

    return (
        <div
            className={cn(
                "relative flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-3xl border transition-all duration-200",
                notification.isRead
                    ? "bg-white border-soft-border/70 hover:border-soft-border hover:shadow-sm"
                    : "bg-primary/[0.02] border-primary/20 shadow-sm hover:border-primary/40 hover:shadow-md"
            )}
        >
            {/* Unread status dot */}
            {!notification.isRead && (
                <div className="absolute top-4 left-4 flex items-center gap-1.5 md:hidden">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                    <span className="text-[10px] font-black text-primary">جدید</span>
                </div>
            )}

            {/* Left/Main content */}
            <div className="flex items-start gap-3.5 flex-1 min-w-0">
                <div
                    className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
                        config.iconBg,
                        config.iconColor
                    )}
                >
                    <Icon className="w-6 h-6" />
                </div>

                <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <span
                            className={cn(
                                "text-[11px] font-black px-2.5 py-0.5 rounded-full",
                                config.badgeBg,
                                config.badgeColor
                            )}
                        >
                            {config.badgeLabel}
                        </span>

                        <div className="flex items-center gap-1 text-[11px] text-secondary font-medium">
                            <Clock className="w-3 h-3 text-secondary/60" />
                            <span>{timeAgo}</span>
                        </div>

                        {!notification.isRead && (
                            <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                خوانده‌نشده
                            </span>
                        )}
                    </div>

                    <h3
                        className={cn(
                            "text-sm md:text-base font-black truncate",
                            notification.isRead ? "text-brand" : "text-brand font-black"
                        )}
                    >
                        {notification.title}
                    </h3>

                    <p className="text-xs md:text-sm text-secondary font-medium leading-relaxed break-words line-clamp-3">
                        {notification.body}
                    </p>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 md:pt-0 border-t border-soft-border/50 md:border-t-0 shrink-0">
                {targetLink && (
                    <Link
                        href={targetLink}
                        className="inline-flex items-center gap-1 px-3.5 py-2 text-xs font-bold text-brand bg-soft-bg hover:bg-soft-border/60 rounded-xl transition-colors"
                    >
                        <span>{targetLinkLabel}</span>
                        <ChevronLeft className="w-3.5 h-3.5" />
                    </Link>
                )}

                {!notification.isRead && onMarkRead && (
                    <button
                        type="button"
                        onClick={() => onMarkRead(notification.id)}
                        disabled={isPendingMarkRead}
                        aria-label="علامت‌گذاری به عنوان خوانده‌شده"
                        className="inline-flex items-center gap-1 px-3 py-2 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 rounded-xl transition-colors disabled:opacity-50"
                        title="علامت‌گذاری به عنوان خوانده‌شده"
                    >
                        {isPendingMarkRead ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                            <Check className="w-3.5 h-3.5" />
                        )}
                        <span className="hidden sm:inline">خواندم</span>
                    </button>
                )}
            </div>
        </div>
    );
}
