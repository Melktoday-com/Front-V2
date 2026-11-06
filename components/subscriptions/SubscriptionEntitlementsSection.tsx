"use client";

import {
    useActiveBadge,
    useEntitlements,
    useMySubscriptionStatus,
} from "@/hooks/useSubscription";
import { cn, toPersianDigits } from "@/lib/utils";
import {
    ArrowLeft,
    Award,
    Building2,
    CheckCircle2,
    Clock,
    Crown,
    Flame,
    Home,
    Layers,
    ShieldCheck,
    Sparkles,
    Star,
    TrendingUp,
    Zap,
} from "lucide-react";
import React, { useMemo } from "react";

export interface SubscriptionEntitlementsSectionProps {
    className?: string;
    onNavigateToPlans?: () => void;
}

interface FeatureMeta {
    label: string;
    description: string;
    icon: (className?: string) => React.ReactNode;
    iconBg: string;
    progressBar: string;
    accentGlow: string;
    badge: string;
}

const FEATURE_META: Record<string, FeatureMeta> = {
    LISTING_PUBLICATION: {
        label: "انتشار آگهی ملکی",
        description: "ظرفیت انتشار آگهی‌های فروش و رهن/اجاره",
        icon: (cls) => <Home className={cls || "w-4 h-4 text-emerald-600 dark:text-emerald-400"} />,
        iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
        progressBar: "bg-emerald-500",
        accentGlow: "from-emerald-500/20 to-transparent",
        badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20",
    },
    TEMPORARY_RENTAL_PUBLICATION: {
        label: "انتشار اقامتگاه روزانه",
        description: "ظرفیت ثبت ویلا، سوئیت و بوم‌گردی",
        icon: (cls) => <Building2 className={cls || "w-4 h-4 text-sky-600 dark:text-sky-400"} />,
        iconBg: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20",
        progressBar: "bg-sky-500",
        accentGlow: "from-sky-500/20 to-transparent",
        badge: "bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20",
    },
    URGENT_PROMOTION: {
        label: "برچسب فوری",
        description: "نشان فوری برای دیده‌شدن سریع‌تر آگهی",
        icon: (cls) => <Flame className={cls || "w-4 h-4 text-amber-500"} />,
        iconBg: "bg-amber-500/10 text-amber-500 border border-amber-500/20",
        progressBar: "bg-amber-500",
        accentGlow: "from-amber-500/20 to-transparent",
        badge: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20",
    },
    LADDER_PROMOTION: {
        label: "نردبان آگهی",
        description: "انتقال آگهی به صدر فهرست جستجو",
        icon: (cls) => <TrendingUp className={cls || "w-4 h-4 text-purple-600 dark:text-purple-400"} />,
        iconBg: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20",
        progressBar: "bg-purple-600",
        accentGlow: "from-purple-500/20 to-transparent",
        badge: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20",
    },
};

const DEFAULT_FEATURE_META: FeatureMeta = {
    label: "سهمیه ویژه",
    description: "سهمیه اختصاصی خدمات پلتفرم",
    icon: (cls) => <Layers className={cls || "w-4 h-4 text-primary"} />,
    iconBg: "bg-primary/10 text-primary border border-primary/20",
    progressBar: "bg-primary",
    accentGlow: "from-primary/20 to-transparent",
    badge: "bg-primary/10 text-primary border border-primary/20",
};

export function formatPersianDate(dateVal?: string | number | Date | null): string | null {
    if (!dateVal) return null;
    try {
        const d = new Date(dateVal);
        if (isNaN(d.getTime())) return null;
        return d.toLocaleDateString("fa-IR");
    } catch {
        return null;
    }
}

export function SubscriptionEntitlementsSection({
    className,
    onNavigateToPlans,
}: SubscriptionEntitlementsSectionProps) {
    const { data: entitlements = [], isLoading: isLoadingEntitlements } = useEntitlements();
    const { data: activeBadge, isLoading: isLoadingBadge } = useActiveBadge();
    const { data: statusData, isLoading: isLoadingStatus } = useMySubscriptionStatus();

    const subscription = statusData?.subscription;
    const hasActiveSubscription = statusData?.hasActiveSubscription;
    const badge = activeBadge || statusData?.badge;

    // Aggregate entitlements per feature type
    const aggregatedEntitlements = useMemo(() => {
        if (!Array.isArray(entitlements) || entitlements.length === 0) return [];

        const map = new Map<
            string,
            {
                type: string;
                totalQuota: number;
                usedQuota: number;
                remainingQuota: number;
                plans: {
                    planName: string;
                    totalQuota: number;
                    usedQuota: number;
                    remainingQuota: number;
                    expiresAt?: string | null;
                }[];
            }
        >();

        for (const ent of entitlements) {
            const eType = ent.entitlementType || ent.type;
            if (!eType || eType === "BADGE") continue;

            const total = Number(ent.totalQuota) || 0;
            const used = Number(ent.usedQuota) || 0;
            const remaining =
                typeof ent.remainingQuota === "number"
                    ? ent.remainingQuota
                    : Math.max(0, total - used);
            if (total <= 0 && remaining <= 0 && used <= 0) continue;
            const planName = ent.planName?.trim() || "اشتراک فعال";
            const expiresAt = ent.expiresAt || null;

            if (!map.has(eType)) {
                map.set(eType, {
                    type: eType,
                    totalQuota: 0,
                    usedQuota: 0,
                    remainingQuota: 0,
                    plans: [],
                });
            }

            const group = map.get(eType)!;
            group.totalQuota += total;
            group.usedQuota += used;
            group.remainingQuota += remaining;

            const existingPlan = group.plans.find((p) => p.planName === planName);
            if (existingPlan) {
                existingPlan.totalQuota += total;
                existingPlan.usedQuota += used;
                existingPlan.remainingQuota += remaining;
                if (
                    expiresAt &&
                    (!existingPlan.expiresAt ||
                        new Date(expiresAt) < new Date(existingPlan.expiresAt))
                ) {
                    existingPlan.expiresAt = expiresAt;
                }
            } else {
                group.plans.push({
                    planName,
                    totalQuota: total,
                    usedQuota: used,
                    remainingQuota: remaining,
                    expiresAt,
                });
            }
        }

        const FEATURE_ORDER: Record<string, number> = {
            LISTING_PUBLICATION: 1,
            TEMPORARY_RENTAL_PUBLICATION: 2,
            URGENT_PROMOTION: 3,
            LADDER_PROMOTION: 4,
        };

        return Array.from(map.values())
            .map((group) => {
                const validDates = group.plans
                    .map((p) => p.expiresAt)
                    .filter((d): d is string => !!d && !isNaN(new Date(d).getTime()))
                    .map((d) => new Date(d).getTime())
                    .sort((a, b) => a - b);

                const nearestExpiresAt =
                    validDates.length > 0 ? new Date(validDates[0]).toISOString() : null;

                return {
                    ...group,
                    nearestExpiresAt,
                };
            })
            .sort((a, b) => (FEATURE_ORDER[a.type] ?? 99) - (FEATURE_ORDER[b.type] ?? 99));
    }, [entitlements]);

    // Active plan/badge title
    const activeBadgeTitle = useMemo(() => {
        if (badge?.badgeName) return badge.badgeName;
        if (subscription?.planName) return subscription.planName;
        const fromEntitlements = Array.from(
            new Set(
                entitlements
                    .map((e) => e.planName?.trim())
                    .filter((n): n is string => !!n),
            ),
        );
        if (fromEntitlements.length > 0) return fromEntitlements[0];
        return null;
    }, [badge, subscription, entitlements]);

    // Detect if badge is a gold/premium tier
    const isGoldBadge = useMemo(() => {
        const text = (activeBadgeTitle || "").toLowerCase();
        const color = (badge?.badgeMetadata?.color || "").toLowerCase();
        return (
            text.includes("طلایی") ||
            text.includes("gold") ||
            color === "gold" ||
            color === "amber" ||
            badge?.badgeIcon === "star" ||
            badge?.badgeIcon === "crown"
        );
    }, [activeBadgeTitle, badge]);

    // Expiry date formatting with safe checks (avoids "Invalid Date")
    const activeExpiryDate = useMemo(() => {
        const fromSub = formatPersianDate(subscription?.expiresAt);
        if (fromSub) return fromSub;

        const fromBadge = formatPersianDate((badge as { expiresAt?: string })?.expiresAt);
        if (fromBadge) return fromBadge;

        for (const group of aggregatedEntitlements) {
            if (group.nearestExpiresAt) {
                const formatted = formatPersianDate(group.nearestExpiresAt);
                if (formatted) return formatted;
            }
        }

        return null;
    }, [subscription, badge, aggregatedEntitlements]);

    const daysRemaining = subscription?.daysRemaining;

    const renderBadgeIcon = (iconName?: string | null, cls?: string) => {
        const iconCls = cls || "w-3.5 h-3.5 shrink-0";
        switch (iconName?.toLowerCase()) {
            case "star":
                return <Star className={cn("fill-amber-400 text-amber-500", iconCls)} />;
            case "sparkles":
                return <Sparkles className={cn("text-amber-600 dark:text-amber-400", iconCls)} />;
            case "award":
                return <Award className={cn("text-info", iconCls)} />;
            case "crown":
                return <Crown className={cn("fill-amber-400 text-amber-600 dark:text-amber-400", iconCls)} />;
            case "check":
            case "checkcircle":
            case "check-circle":
                return <CheckCircle2 className={cn("text-emerald-600 dark:text-emerald-400", iconCls)} />;
            default:
                return (
                    <ShieldCheck
                        className={cn(
                            isGoldBadge
                                ? "text-amber-600 dark:text-amber-400 fill-amber-500/20"
                                : "text-primary",
                            iconCls,
                        )}
                    />
                );
        }
    };

    const isInitialLoading =
        isLoadingEntitlements && (isLoadingBadge || isLoadingStatus);

    return (
        <div className={cn("space-y-6", className)}>
            {/* Unified Entitlements Header with Integrated Active Plan Badge */}
            <div className="bg-surface rounded-3xl border border-border-subtle p-4 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                    {/* Top Row: Icon + Title on right, Badge on left (fits perfectly in 1 line on mobile) */}
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/15 shadow-2xs">
                                <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
                            </div>
                            <h2 className="text-base sm:text-lg font-black text-foreground tracking-tight truncate">
                                مجموع سهمیه‌های من
                            </h2>
                        </div>

                        {/* Active Plan / Badge Integrated Pill */}
                        {isInitialLoading ? (
                            <div className="h-6 w-20 bg-surface-secondary animate-pulse rounded-full shrink-0" />
                        ) : activeBadgeTitle ? (
                            <div
                                className={cn(
                                    "inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-xs font-black shrink-0 transition-all shadow-2xs",
                                    isGoldBadge
                                        ? "bg-amber-100/90 text-amber-900 border border-amber-300 dark:bg-amber-950/80 dark:text-amber-200 dark:border-amber-700/80"
                                        : "bg-primary/10 text-primary border border-primary/20",
                                )}
                                title={badge?.badgeMetadata?.tooltip || undefined}
                            >
                                {renderBadgeIcon(badge?.badgeIcon, "w-3.5 h-3.5 shrink-0")}
                                <span>{activeBadgeTitle}</span>
                            </div>
                        ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-surface-secondary text-foreground-muted border border-border-subtle/50 shrink-0">
                                طرح عادی
                            </span>
                        )}
                    </div>

                    {/* Subtitle / Expiry / Feature Count */}
                    <div className="flex items-center gap-2 sm:gap-3 text-xs text-foreground-muted mt-2 sm:mt-1.5 flex-wrap">
                        {daysRemaining !== undefined && daysRemaining !== null && (
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                <span>{toPersianDigits(daysRemaining)} روز اعتبار باقی‌مانده</span>
                            </span>
                        )}
                        {activeExpiryDate && (
                            <>
                                {daysRemaining !== undefined && daysRemaining !== null && (
                                    <span className="text-border">•</span>
                                )}
                                <span className="font-medium text-foreground-secondary">
                                    اعتبار تا: {activeExpiryDate}
                                </span>
                            </>
                        )}
                        {aggregatedEntitlements.length > 0 && (
                            <>
                                {(activeExpiryDate || daysRemaining !== undefined) && (
                                    <span className="text-border hidden sm:inline">•</span>
                                )}
                                <span className="hidden sm:inline">
                                    {toPersianDigits(aggregatedEntitlements.length)} دسته‌بندی سهمیه فعال
                                </span>
                            </>
                        )}
                    </div>
                </div>

                {/* Quick Action to switch or buy plans */}
                {onNavigateToPlans && (
                    <button
                        onClick={onNavigateToPlans}
                        className="w-full md:w-auto px-4 py-2 sm:py-2.5 rounded-2xl bg-surface-secondary hover:bg-border-subtle/80 text-foreground font-bold text-xs transition-all flex items-center justify-center gap-2 border border-border-subtle/70 cursor-pointer shrink-0 shadow-2xs hover:shadow-xs active:scale-[0.98]"
                    >
                        <span>
                            {hasActiveSubscription || activeBadgeTitle
                                ? "ارتقا یا تمدید پلن"
                                : "مشاهده و خرید پلن‌ها"}
                        </span>
                        <ArrowLeft className="w-3.5 h-3.5 text-foreground-muted" />
                    </button>
                )}
            </div>

            {/* Quotas Content */}
            {isLoadingEntitlements ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div
                            key={i}
                            className="bg-surface rounded-3xl border border-border-subtle p-5 h-64 animate-pulse"
                        />
                    ))}
                </div>
            ) : aggregatedEntitlements.length === 0 ? (
                <div className="bg-surface rounded-3xl border border-border-subtle p-8 sm:p-12 text-center max-w-xl mx-auto shadow-xs">
                    <div className="w-14 h-14 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4 border border-primary/15 shadow-2xs">
                        <Layers className="w-7 h-7" />
                    </div>
                    <h3 className="text-base font-black text-foreground mb-1.5">
                        سهمیه فعالی ثبت نشده است
                    </h3>
                    <p className="text-xs text-foreground-muted leading-relaxed mb-6">
                        با خرید یکی از پلن‌های اشتراک مشاوران یا میزبانان، سهمیه‌های انتشار آگهی، اقامتگاه روزانه، نردبان و نشان‌های اختصاصی برای حساب شما فعال خواهند شد.
                    </p>
                    {onNavigateToPlans && (
                        <button
                            onClick={onNavigateToPlans}
                            className="px-6 py-2.5 rounded-2xl bg-primary hover:bg-primary-hover text-white text-xs font-bold transition-all shadow-xs inline-flex items-center gap-2 cursor-pointer active:scale-[0.98]"
                        >
                            <Sparkles className="w-4 h-4" />
                            <span>مشاهده و انتخاب پلن‌های اشتراک</span>
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {aggregatedEntitlements.map((group) => {
                        const meta = FEATURE_META[group.type] || {
                            ...DEFAULT_FEATURE_META,
                            label: group.type,
                        };
                        const percentRemaining =
                            group.totalQuota > 0
                                ? Math.min(
                                      100,
                                      Math.max(
                                          0,
                                          Math.round(
                                              (group.remainingQuota / group.totalQuota) * 100,
                                          ),
                                      ),
                                  )
                                : 0;
                        const nearestExpiry = formatPersianDate(group.nearestExpiresAt);

                        return (
                            <div
                                key={group.type}
                                className="group bg-surface rounded-3xl border border-border-subtle hover:border-primary/30 p-4 sm:p-5 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between relative overflow-hidden"
                            >
                                {/* Top Ambient Accent */}
                                <div
                                    className={cn(
                                        "absolute top-0 inset-x-0 h-1 bg-gradient-to-r",
                                        meta.accentGlow,
                                    )}
                                />

                                <div>
                                    {/* Top Row: Icon, Multi-plan badge, Status */}
                                    <div className="flex items-center justify-between mb-3.5">
                                        <div className="flex items-center gap-2">
                                            <span
                                                className={cn(
                                                    "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs",
                                                    meta.iconBg,
                                                )}
                                            >
                                                {meta.icon("w-4 h-4")}
                                            </span>
                                            {group.plans.length > 1 && (
                                                <span className="text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
                                                    {toPersianDigits(group.plans.length)} پلن
                                                </span>
                                            )}
                                        </div>

                                        {group.remainingQuota === 0 ? (
                                            <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full">
                                                اتمام سهمیه
                                            </span>
                                        ) : nearestExpiry ? (
                                            <span className="text-[11px] font-medium text-foreground-muted">
                                                انقضا: {nearestExpiry}
                                            </span>
                                        ) : null}
                                    </div>

                                    {/* Feature Title */}
                                    <h4 className="font-black text-foreground text-sm mb-1 leading-snug">
                                        {meta.label}
                                    </h4>
                                    <p className="text-[11px] text-foreground-muted line-clamp-1 mb-3">
                                        {meta.description}
                                    </p>

                                    {/* Quota Numbers (Aggregated Sum) */}
                                    <div className="bg-surface-secondary/50 rounded-2xl p-3 mb-3 border border-border-subtle/40">
                                        <div className="flex items-baseline justify-between mb-2">
                                            <div className="flex items-baseline gap-1.5">
                                                <span className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                                                    {toPersianDigits(group.remainingQuota)}
                                                </span>
                                                <span className="text-xs text-foreground-muted font-medium">
                                                    باقی‌مانده
                                                </span>
                                            </div>
                                            <span className="text-xs text-foreground-muted font-medium">
                                                از کل {toPersianDigits(group.totalQuota)} عدد
                                            </span>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="space-y-1.5">
                                            <div className="w-full bg-border-subtle/50 rounded-full h-2 overflow-hidden">
                                                <div
                                                    className={cn(
                                                        "h-full transition-all duration-500 rounded-full",
                                                        meta.progressBar,
                                                    )}
                                                    style={{ width: `${percentRemaining}%` }}
                                                />
                                            </div>
                                            <div className="flex items-center justify-between text-[10px] text-foreground-muted font-medium">
                                                <span>{toPersianDigits(percentRemaining)}٪ موجود</span>
                                                <span>
                                                    {toPersianDigits(Math.max(0, 100 - percentRemaining))}٪ مصرف
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Plan Breakdown */}
                                    <div className="pt-2 border-t border-border-subtle/60">
                                        <div className="flex items-center justify-between text-[11px] font-bold text-foreground-muted mb-2">
                                            <span>سهمیه به تفکیک پلن:</span>
                                        </div>
                                        <div className="space-y-1.5">
                                            {group.plans.map((plan, pIdx) => {
                                                const planExpiry = formatPersianDate(plan.expiresAt);
                                                return (
                                                    <div
                                                        key={pIdx}
                                                        className="bg-surface-secondary/70 hover:bg-surface-secondary px-2.5 py-1.5 rounded-xl flex items-center justify-between text-xs gap-2 transition-colors border border-border-subtle/40"
                                                        title={
                                                            planExpiry
                                                                ? `تاریخ انقضا: ${planExpiry}`
                                                                : undefined
                                                        }
                                                    >
                                                        <div className="flex items-center gap-1.5 min-w-0">
                                                            <span
                                                                className={cn(
                                                                    "w-1.5 h-1.5 rounded-full shrink-0",
                                                                    meta.progressBar,
                                                                )}
                                                            />
                                                            <span className="font-semibold text-foreground truncate text-[11px]">
                                                                {plan.planName}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-1 shrink-0 text-[11px]">
                                                            {planExpiry && (
                                                                <span className="text-[10px] text-foreground-muted hidden sm:inline">
                                                                    تا {planExpiry}
                                                                </span>
                                                            )}
                                                            <span className="font-black text-foreground">
                                                                {toPersianDigits(plan.remainingQuota)}
                                                            </span>
                                                            <span className="text-foreground-muted text-[10px]">
                                                                /{toPersianDigits(plan.totalQuota)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
