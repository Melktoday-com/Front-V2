"use client";

import React from "react";
import Link from "next/link";
import {
    Award,
    Building2,
    Calendar,
    CheckCircle2,
    ChevronLeft,
    Clock,
    Flame,
    Home,
    Layers,
    Loader2,
    PlusCircle,
    ShieldCheck,
    Sparkles,
    Star,
    TrendingUp,
    Zap,
} from "lucide-react";
import { useMySubscriptionStatus } from "@/hooks/useSubscription";
import { cn, toPersianDigits } from "@/lib/utils";

interface SubscriptionQuotaWidgetProps {
    className?: string;
    targetRole?: "agent" | "landlord";
    title?: string;
}

export function SubscriptionQuotaWidget({
    className,
    targetRole,
    title = "وضعیت اشتراک و سهمیه‌های باقیمانده",
}: SubscriptionQuotaWidgetProps) {
    const { data, isLoading } = useMySubscriptionStatus();

    const renderBadgeIcon = (iconName?: string | null) => {
        switch (iconName?.toLowerCase()) {
            case "star":
                return <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />;
            case "sparkles":
                return <Sparkles className="w-3.5 h-3.5 text-amber-500" />;
            case "award":
                return <Award className="w-3.5 h-3.5 text-info" />;
            case "check":
            case "checkcircle":
                return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
            default:
                return <ShieldCheck className="w-3.5 h-3.5 text-primary" />;
        }
    };

    if (isLoading) {
        return (
            <div className={cn("p-5 sm:p-6 rounded-[24px] sm:rounded-[28px] bg-surface border border-soft-border/70 animate-pulse", className)}>
                <div className="flex items-center justify-between mb-4">
                    <div className="h-5 bg-surface-secondary rounded-lg w-48" />
                    <div className="h-5 bg-surface-secondary rounded-lg w-20" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="h-20 bg-surface-secondary rounded-2xl" />
                    <div className="h-20 bg-surface-secondary rounded-2xl" />
                    <div className="h-20 bg-surface-secondary rounded-2xl" />
                    <div className="h-20 bg-surface-secondary rounded-2xl" />
                </div>
            </div>
        );
    }

    const hasActiveSubscription = data?.hasActiveSubscription;
    const subscription = data?.subscription;
    const entitlements = data?.entitlements || [];
    const badge = data?.badge;

    // Filter entitlements relevant to the current panel context if specified
    const displayEntitlements = entitlements.filter((ent) => {
        const type = ent.entitlementType || ent.type;
        if (!type || type === "BADGE") return false;
        if (targetRole === "agent" && type === "TEMPORARY_RENTAL_PUBLICATION") return false;
        if (targetRole === "landlord" && type === "LISTING_PUBLICATION") return false;
        return true;
    });

    const getEntitlementMeta = (type?: string) => {
        switch (type) {
            case "LISTING_PUBLICATION":
                return {
                    label: "آگهی ملکی عادی",
                    icon: <Home className="w-4 h-4 text-emerald-600" />,
                    bg: "bg-emerald-500/10",
                    border: "border-emerald-500/20",
                };
            case "TEMPORARY_RENTAL_PUBLICATION":
                return {
                    label: "انتشار اقامتگاه روزانه",
                    icon: <Building2 className="w-4 h-4 text-info" />,
                    bg: "bg-blue-500/10",
                    border: "border-blue-500/20",
                };
            case "LADDER_PROMOTION":
                return {
                    label: "نردبان آگهی",
                    icon: <TrendingUp className="w-4 h-4 text-purple-600" />,
                    bg: "bg-purple-500/10",
                    border: "border-purple-500/20",
                };
            case "URGENT_PROMOTION":
                return {
                    label: "برچسب فوری شو",
                    icon: <Flame className="w-4 h-4 text-amber-500" />,
                    bg: "bg-amber-500/10",
                    border: "border-amber-500/20",
                };
            default:
                return {
                    label: "سهمیه ویژه",
                    icon: <Layers className="w-4 h-4 text-primary" />,
                    bg: "bg-primary/10",
                    border: "border-primary/20",
                };
        }
    };

    return (
        <div className={cn("p-5 sm:p-6 rounded-[24px] sm:rounded-[28px] bg-surface border border-soft-border/70 shadow-xs space-y-4", className)}>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-soft-border/60 pb-3.5">
                <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-primary/10 text-primary">
                        <Zap className="w-4 h-4" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-brand tracking-tight">
                            {title}
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5">
                            {hasActiveSubscription && subscription ? (
                                <>
                                    <span className="text-[11px] font-bold text-primary">
                                        {subscription.planName}
                                    </span>
                                    <span className="text-secondary text-[11px]">•</span>
                                    <span className="text-[11px] font-bold text-success flex items-center gap-1">
                                        <Clock className="w-3 h-3 text-success" />
                                        <span>{toPersianDigits(subscription.daysRemaining)} روز اعتبار باقی‌مانده</span>
                                    </span>
                                </>
                            ) : (
                                <span className="text-[11px] font-bold text-secondary">
                                    فاقد اشتراک فعال
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    {badge && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-warning border border-amber-500/20 text-[11px] font-bold">
                            {renderBadgeIcon(badge.badgeIcon)}
                            <span>{badge.badgeName}</span>
                        </div>
                    )}
                    <Link
                        href="/subscriptions"
                        className="px-3.5 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs transition inline-flex items-center gap-1"
                    >
                        <span>{hasActiveSubscription ? "تمدید یا ارتقای پلن" : "خرید اشتراک"}</span>
                        <ChevronLeft className="w-3.5 h-3.5" />
                    </Link>
                </div>
            </div>

            {/* Quotas Grid */}
            {displayEntitlements.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {displayEntitlements.map((ent, idx) => {
                        const type = ent.entitlementType || ent.type;
                        const meta = getEntitlementMeta(type);
                        const percentUsed =
                            ent.totalQuota > 0
                                ? Math.min(100, Math.round((ent.usedQuota / ent.totalQuota) * 100))
                                : 0;

                        return (
                            <div
                                key={ent.id || `${type}-${idx}`}
                                className={cn(
                                    "p-3.5 rounded-2xl bg-surface-secondary/70 border border-soft-border/60 flex flex-col justify-between space-y-2",
                                    meta.border,
                                )}
                            >
                                <div className="flex items-center justify-between">
                                    <span className={cn("p-1.5 rounded-lg", meta.bg)}>
                                        {meta.icon}
                                    </span>
                                    <span className="text-[10px] text-secondary font-bold">
                                        {percentUsed}% مصرف
                                    </span>
                                </div>

                                <div>
                                    <span className="block text-[11px] font-bold text-secondary truncate">
                                        {meta.label}
                                    </span>
                                    <div className="flex items-baseline justify-between mt-0.5">
                                        <span className="text-xl font-black text-brand">
                                            {toPersianDigits(ent.remainingQuota)}
                                        </span>
                                        <span className="text-[10px] text-secondary">
                                            از {toPersianDigits(ent.totalQuota)}
                                        </span>
                                    </div>
                                </div>

                                {/* Mini Progress bar */}
                                <div className="w-full bg-soft-border/70 rounded-full h-1.5 overflow-hidden">
                                    <div
                                        className={cn(
                                            "h-full rounded-full transition-all duration-500",
                                            percentUsed >= 90
                                                ? "bg-rose-500"
                                                : percentUsed >= 70
                                                  ? "bg-amber-500"
                                                  : "bg-emerald-500",
                                        )}
                                        style={{ width: `${percentUsed}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="p-4 rounded-2xl bg-surface-secondary/60 border border-soft-border/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-right">
                    <div className="space-y-0.5">
                        <p className="text-xs font-bold text-brand">
                            سهمیه بسته‌ای برای حساب شما ثبت نشده است
                        </p>
                        <p className="text-[11px] text-secondary">
                            با تهیه پلن اشتراک ویژه مشاوران یا میزبانان، سهمیه‌های انتشار انبوه، نردبان و برچسب فوری با تخفیف ویژه فعال می‌گردد.
                        </p>
                    </div>
                    <Link
                        href="/subscriptions"
                        className="px-4 py-2 rounded-xl bg-primary text-white font-black text-xs hover:bg-primary-hover shadow-xs transition shrink-0 inline-flex items-center gap-1"
                    >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>مشاهده و خرید پلن‌ها</span>
                    </Link>
                </div>
            )}
        </div>
    );
}
