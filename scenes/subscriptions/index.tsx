"use client";

import { useAuth } from "@/hooks/useAuth";
import {
    useActiveBadge,
    useClaimWelcomePackage,
    useEntitlements,
    usePurchasePlan,
    useSubscriptionPlans,
} from "@/hooks/useSubscription";
import { useWalletBalance } from "@/hooks/useWallet";
import { normalizeApiError } from "@/lib/api/error-handler";
import { cn, formatCurrency, rialToToman, toPersianDigits } from "@/lib/utils";
import {
    SubscriptionPlan,
    SubscriptionTargetRole
} from "@/types/api/subscription.types";
import {
    AlertCircle,
    ArrowLeft,
    Award,
    Building2,
    Check,
    CheckCircle2,
    Flame,
    Gift,
    Home,
    Layers,
    Loader2,
    ShieldCheck,
    Sparkles,
    Star,
    TrendingUp,
    Wallet,
    X
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

interface FeatureMeta {
    label: string;
    description: string;
    icon: (className?: string) => React.ReactNode;
    iconBg: string;
    progressBar: string;
    badge: string;
}

const FEATURE_META: Record<string, FeatureMeta> = {
    LISTING_PUBLICATION: {
        label: "انتشار آگهی ملکی",
        description: "ظرفیت انتشار آگهی‌های فروش و رهن/اجاره",
        icon: (cls) => <Home className={cls || "w-4 h-4 text-emerald-600"} />,
        iconBg: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600",
        progressBar: "bg-emerald-500",
        badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
    },
    TEMPORARY_RENTAL_PUBLICATION: {
        label: "انتشار اقامتگاه روزانه",
        description: "ظرفیت ثبت ویلا، سوئیت و بوم‌گردی",
        icon: (cls) => <Building2 className={cls || "w-4 h-4 text-info"} />,
        iconBg: "bg-blue-50 dark:bg-blue-950/40 text-info",
        progressBar: "bg-blue-500",
        badge: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
    },
    URGENT_PROMOTION: {
        label: "برچسب فوری",
        description: "نشان فوری برای دیده‌شدن سریع‌تر آگهی",
        icon: (cls) => <Flame className={cls || "w-4 h-4 text-amber-500"} />,
        iconBg: "bg-amber-50 dark:bg-amber-950/40 text-amber-500",
        progressBar: "bg-amber-500",
        badge: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
    },
    LADDER_PROMOTION: {
        label: "نردبان آگهی",
        description: "انتقال آگهی به صدر فهرست جستجو",
        icon: (cls) => <TrendingUp className={cls || "w-4 h-4 text-purple-600"} />,
        iconBg: "bg-purple-50 dark:bg-purple-950/40 text-purple-600",
        progressBar: "bg-purple-600",
        badge: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20",
    },
};

const DEFAULT_FEATURE_META: FeatureMeta = {
    label: "سهمیه ویژه",
    description: "سهمیه اختصاصی خدمات پلتفرم",
    icon: (cls) => <Layers className={cls || "w-4 h-4 text-primary"} />,
    iconBg: "bg-primary/10 text-primary",
    progressBar: "bg-primary",
    badge: "bg-primary/10 text-primary border-primary/20",
};

export default function SubscriptionsScene() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, activeRole, isLoggedIn } = useAuth();
    const { data: walletData, isLoading: isLoadingWallet } = useWalletBalance();

    const isHostOrAgent = activeRole === "landlord" || activeRole === "agent";
    const [selectedRole, setSelectedRole] = useState<SubscriptionTargetRole>(
        activeRole === "agent" ? "agent" : "landlord",
    );
    const initialTab = searchParams.get("tab") === "entitlements" ? "entitlements" : "plans";
    const [activeTab, setActiveTab] = useState<"plans" | "entitlements">(initialTab);

    useEffect(() => {
        const tabParam = searchParams.get("tab");
        if (tabParam === "entitlements" || tabParam === "plans") {
            setActiveTab(tabParam);
        }
    }, [searchParams]);

    // Plans & Entitlements
    const { data: plans = [], isLoading: isLoadingPlans } = useSubscriptionPlans(
        isHostOrAgent ? (activeRole as SubscriptionTargetRole) : selectedRole,
    );
    const { data: entitlements = [], isLoading: isLoadingEntitlements } = useEntitlements();
    const { data: activeBadge, isLoading: isLoadingBadge } = useActiveBadge();

    // Aggregated Entitlements by Feature (prevents duplicate cards when user has multiple plans)
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

    // Mutations
    const purchaseMutation = usePurchasePlan();
    const claimMutation = useClaimWelcomePackage();

    // Purchase Modal State
    const [selectedPlanForPurchase, setSelectedPlanForPurchase] = useState<SubscriptionPlan | null>(
        null,
    );
    const [autoRenew, setAutoRenew] = useState(false);

    // Helpers
    const availableBalanceIrr = walletData?.availableBalance ?? walletData?.balance ?? 0;
    const availableBalanceToman = rialToToman(availableBalanceIrr);

    const handleSelectPlan = (plan: SubscriptionPlan) => {
        if (!isLoggedIn) {
            router.push("/auth?redirect=/subscriptions");
            return;
        }

        if (!isHostOrAgent) {
            toast.error("خرید اشتراک فقط برای نقش‌های میزبان و مشاور املاک مجاز است.");
            return;
        }

        setSelectedPlanForPurchase(plan);
    };

    const handleConfirmPurchase = () => {
        if (!selectedPlanForPurchase) return;

        const planPriceIrr = Number(selectedPlanForPurchase.priceIrr);
        if (availableBalanceIrr < planPriceIrr) {
            const shortageToman = rialToToman(Math.max(0, planPriceIrr - availableBalanceIrr));
            toast.error(
                `موجودی کیف پول کافی نیست. لطفا حداقل ${formatCurrency(shortageToman)} تومان کیف پول خود را شارژ کنید.`,
            );
            router.push(`/wallet?amount=${shortageToman}`);
            return;
        }

        purchaseMutation.mutate(
            {
                planId: selectedPlanForPurchase.id,
                autoRenew,
                idempotencyKey: `sub_${selectedPlanForPurchase.id}_${Date.now()}`,
            },
            {
                onSuccess: (res) => {
                    toast.success(`اشتراک «${res.planName}» با موفقیت فعال گردید.`);
                    setSelectedPlanForPurchase(null);
                    setActiveTab("entitlements");
                },
                onError: (err: Error) => {
                    const message = normalizeApiError(err, "خطا در خرید اشتراک");
                    toast.error(message);
                },
            },
        );
    };

    const handleClaimWelcome = () => {
        claimMutation.mutate(
            { targetRole: activeRole || "user" },
            {
                onSuccess: (res) => {
                    const successMsg =
                        res.message ||
                        (res.packageTitle
                            ? `بسته «${res.packageTitle}» با موفقیت فعال شد!`
                            : "بسته خوش‌آمدگویی با موفقیت دریافت شد!");
                    toast.success(successMsg);
                },
                onError: (err: Error) => {
                    const msg = normalizeApiError(
                        err,
                        "شما پیش از این بسته خوش‌آمدگویی را دریافت کرده‌اید.",
                    );
                    toast.error(msg);
                },
            },
        );
    };

    const renderBadgeIcon = (iconName?: string | null) => {
        switch (iconName?.toLowerCase()) {
            case "star":
                return <Star className="w-4 h-4 fill-amber-400 text-amber-400" />;
            case "sparkles":
                return <Sparkles className="w-4 h-4 text-amber-500" />;
            case "award":
                return <Award className="w-4 h-4 text-info" />;
            case "check":
            case "checkcircle":
                return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
            default:
                return <ShieldCheck className="w-4 h-4 text-primary" />;
        }
    };

    return (
        <div className="min-h-screen bg-surface-secondary/60 pb-28 lg:pb-10 pt-6">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <div className="flex items-center gap-2 mb-1.5">
                            <h1 className="text-2xl font-black text-foreground tracking-tight">
                                پلن‌های اشتراک و سهمیه‌های ویژه
                            </h1>
                        </div>
                        <p className="text-sm text-foreground-muted">
                            ارتقای ظرفیت آگهی‌ها، انتشار اقامتگاه، نردبان و برچسب‌های فوری اختصاصی
                        </p>
                    </div>

                    {/* Wallet Badge & Quick Link */}
                    {isLoggedIn && (
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2.5 bg-surface border border-border-subtle/80 px-4 py-2.5 rounded-2xl shadow-sm">
                                <Wallet className="w-4 h-4 text-success" />
                                <div className="text-xs">
                                    <span className="text-foreground-muted block font-normal">موجودی در دسترس:</span>
                                    <span className="font-black text-foreground">
                                        {isLoadingWallet ? "..." : `${formatCurrency(availableBalanceToman)} تومان`}
                                    </span>
                                </div>
                            </div>
                            <Link
                                href="/wallet"
                                className="px-3.5 py-2.5 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs rounded-2xl transition"
                            >
                                شارژ کیف پول
                            </Link>
                        </div>
                    )}
                </div>

                {/* Non-Host / Non-Agent Banner (Regular User Guidance) */}
                {!isHostOrAgent && (
                    <div className="mb-8 p-5 bg-gradient-to-r from-amber-50 to-orange-50/70 border border-warning/30/80 rounded-3xl">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            <div className="flex items-start gap-3.5">
                                <div className="p-2.5 bg-amber-500/10 text-warning rounded-2xl shrink-0 mt-0.5">
                                    <AlertCircle className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-black text-amber-950 text-base mb-1">
                                        پلن‌های اشتراک مختص «میزبانان» و «مشاوران املاک» است
                                    </h3>
                                    <p className="text-xs text-amber-900/80 leading-relaxed max-w-2xl">
                                        کاربران عادی به ازای هر آگهی مبلغ مصوب را پرداخت می‌کنند. در صورت تمایل به خرید اشتراک و دریافت سهمیه‌های انبوه و نشان تایید، به عنوان میزبان یا مشاور املاک ثبت‌نام کنید.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2.5 shrink-0 w-full md:w-auto">
                                <Link
                                    href="/host"
                                    className="flex-1 md:flex-none text-center px-4 py-2.5 bg-surface border border-amber-300 text-amber-900 hover:bg-warning-subtle/50 font-bold text-xs rounded-2xl shadow-sm transition"
                                >
                                    ثبت‌نام میزبان
                                </Link>
                                <Link
                                    href="/agency"
                                    className="flex-1 md:flex-none text-center px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-2xl shadow-sm transition"
                                >
                                    ثبت‌نام مشاور / آژانس
                                </Link>
                            </div>
                        </div>

                        {/* Role preview switcher */}
                        <div className="mt-4 pt-4 border-t border-warning/30/60 flex items-center justify-between text-xs">
                            <span className="text-warning font-medium">پیش‌نمایش پلن‌ها بر اساس نقش:</span>
                            <div className="inline-flex p-1 bg-amber-200/40 rounded-xl">
                                <button
                                    onClick={() => setSelectedRole("landlord")}
                                    className={cn(
                                        "px-3 py-1 rounded-lg font-bold transition",
                                        selectedRole === "landlord"
                                            ? "bg-surface text-amber-900 shadow-sm"
                                            : "text-warning hover:text-amber-950",
                                    )}
                                >
                                    میزبان اقامتگاه
                                </button>
                                <button
                                    onClick={() => setSelectedRole("agent")}
                                    className={cn(
                                        "px-3 py-1 rounded-lg font-bold transition",
                                        selectedRole === "agent"
                                            ? "bg-surface text-amber-900 shadow-sm"
                                            : "text-warning hover:text-amber-950",
                                    )}
                                >
                                    مشاور املاک
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Navigation Tabs (For Host/Agent) */}
                {isHostOrAgent && (
                    <div className="flex items-center gap-2 mb-6 border-b border-border-subtle">
                        <button
                            onClick={() => setActiveTab("plans")}
                            className={cn(
                                "pb-3.5 px-4 text-sm font-bold border-b-2 transition flex items-center gap-2",
                                activeTab === "plans"
                                    ? "border-primary text-primary"
                                    : "border-transparent text-foreground-muted hover:text-foreground",
                            )}
                        >
                            <Layers className="w-4 h-4" />
                            <span>خرید پلن</span>
                        </button>
                        <button
                            onClick={() => setActiveTab("entitlements")}
                            className={cn(
                                "pb-3.5 px-4 text-sm font-bold border-b-2 transition flex items-center gap-2",
                                activeTab === "entitlements"
                                    ? "border-primary text-primary"
                                    : "border-transparent text-foreground-muted hover:text-foreground",
                            )}
                        >
                            <ShieldCheck className="w-4 h-4" />
                            <span>پلن ها</span>
                        </button>
                    </div>
                )}

                {/* TAB 1: Plans List */}
                {activeTab === "plans" && (
                    <div>
                        {isLoadingPlans ? (
                            <div className="py-20 flex flex-col items-center justify-center text-foreground-muted gap-3">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                <span className="text-xs">در حال بارگذاری پلن‌های اشتراک...</span>
                            </div>
                        ) : plans.length === 0 ? (
                            <div className="py-16 text-center bg-surface rounded-3xl border border-border-subtle/80 p-8 shadow-sm">
                                <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                <h3 className="font-bold text-foreground-secondary mb-1">پلن فعالی یافت نشد</h3>
                                <p className="text-xs text-foreground-muted">
                                    در حال حاضر پلن فعالی برای این نقش ثبت نشده است. لطفا بعداً مراجعه فرمایید.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {plans.map((plan) => {
                                    const priceToman = Math.floor(Number(plan.priceIrr) / 10);
                                    const isAffordable = availableBalanceToman >= priceToman;

                                    return (
                                        <div
                                            key={plan.id}
                                            className="bg-surface rounded-3xl border border-border-subtle/80 p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition relative group"
                                        >
                                            {/* Top info */}
                                            <div>
                                                {/* Dynamic Badge Tag if plan includes badge */}
                                                {plan.badgeName && (
                                                    <div className="mb-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-warning-subtle text-warning border border-warning/30/60 shadow-xs">
                                                        {renderBadgeIcon(plan.badgeIcon)}
                                                        <span>{plan.badgeName}</span>
                                                    </div>
                                                )}

                                                <h3 className="text-lg font-black text-foreground mb-1">
                                                    {plan.name}
                                                </h3>
                                                <p className="text-xs text-foreground-muted mb-4 line-clamp-2">
                                                    {plan.description || "سهمیه‌های ویژه انتشار و ارتقای آگهی"}
                                                </p>

                                                {/* Price */}
                                                <div className="py-3 px-4 bg-surface-secondary rounded-2xl mb-5 flex items-baseline justify-between">
                                                    <span className="text-xs text-foreground-muted font-medium">هزینه پلن:</span>
                                                    <div className="text-left">
                                                        <span className="text-xl font-black text-foreground">
                                                            {formatCurrency(priceToman)}
                                                        </span>
                                                        <span className="text-[11px] text-foreground-muted mr-1.5 font-bold">
                                                            تومان
                                                        </span>
                                                        <span className="block text-[10px] text-foreground-muted font-normal">
                                                            مدت اعتبار: {toPersianDigits(plan.durationDays)} روز
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Entitlements feature list */}
                                                <div className="space-y-2.5 text-xs text-foreground-secondary mb-6">
                                                    {plan.publicationQuota > 0 && (
                                                        <div className="flex items-center gap-2">
                                                            <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                                                            <span>
                                                                انتشار{" "}
                                                                <strong className="font-black text-foreground">
                                                                    {toPersianDigits(plan.publicationQuota)}
                                                                </strong>{" "}
                                                                آگهی ملکی
                                                            </span>
                                                        </div>
                                                    )}

                                                    {plan.tempRentQuota > 0 && (
                                                        <div className="flex items-center gap-2">
                                                            <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                                                            <span>
                                                                انتشار{" "}
                                                                <strong className="font-black text-foreground">
                                                                    {toPersianDigits(plan.tempRentQuota)}
                                                                </strong>{" "}
                                                                اقامتگاه روزانه
                                                            </span>
                                                        </div>
                                                    )}

                                                    {plan.urgentQuota > 0 && (
                                                        <div className="flex items-center gap-2">
                                                            <Check className="w-4 h-4 text-amber-500 shrink-0" />
                                                            <span>
                                                                <strong className="font-black text-foreground">
                                                                    {toPersianDigits(plan.urgentQuota)}
                                                                </strong>{" "}
                                                                برچسب فوری (فوری شو)
                                                            </span>
                                                        </div>
                                                    )}

                                                    {plan.ladderQuota > 0 && (
                                                        <div className="flex items-center gap-2">
                                                            <Check className="w-4 h-4 text-info shrink-0" />
                                                            <span>
                                                                <strong className="font-black text-foreground">
                                                                    {toPersianDigits(plan.ladderQuota)}
                                                                </strong>{" "}
                                                                نردبان آگهی
                                                            </span>
                                                        </div>
                                                    )}

                                                    {plan.badgeName && (
                                                        <div className="flex items-center gap-2">
                                                            <Check className="w-4 h-4 text-purple-500 shrink-0" />
                                                            <span>
                                                                دریافت نشان «{plan.badgeName}» بر روی پروفایل و آگهی‌ها
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Action Button */}
                                            <button
                                                onClick={() => handleSelectPlan(plan)}
                                                disabled={!isHostOrAgent}
                                                className={cn(
                                                    "w-full py-3 rounded-2xl font-black text-xs transition flex items-center justify-center gap-2 shadow-xs",
                                                    isHostOrAgent
                                                        ? "bg-primary hover:bg-primary-hover text-white cursor-pointer"
                                                        : "bg-surface-secondary text-foreground-muted cursor-not-allowed",
                                                )}
                                            >
                                                <span>{isHostOrAgent ? "انتخاب و خرید اشتراک" : "مخصوص میزبانان و مشاوران"}</span>
                                                {isHostOrAgent && <ArrowLeft className="w-3.5 h-3.5" />}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Welcome Package Section */}
                        {isLoggedIn && (
                            <div className="mt-12 p-6 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border border-info/30/60 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-3.5">
                                    <div className="p-3 bg-blue-500/10 text-info rounded-2xl shrink-0">
                                        <Gift className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-foreground text-sm mb-1">
                                            بسته خوش‌آمدگویی ملک‌تودی
                                        </h4>
                                        <p className="text-xs text-foreground-muted">
                                            سهمیه یا اعتبار هدیه به محض ثبت‌نام اولیه در پلتفرم (یک‌بار مصرف و تکرارناپذیر)
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleClaimWelcome}
                                    disabled={claimMutation.isPending}
                                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-2xl shadow-xs transition flex items-center gap-2 shrink-0 cursor-pointer disabled:opacity-60"
                                >
                                    {claimMutation.isPending && (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    )}
                                    <span>دریافت بسته خوش‌آمدگویی</span>
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 2: User Entitlements */}
                {activeTab === "entitlements" && (
                    <div className="space-y-6">
                        {/* Active Badge Card */}
                        {isLoadingBadge ? (
                            <div className="p-6 bg-surface rounded-3xl border border-border-subtle/80 animate-pulse h-28" />
                        ) : activeBadge ? (
                            <div className="p-6 bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-white border border-warning/30 rounded-3xl flex items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="p-3.5 bg-amber-500/15 text-warning rounded-2xl shadow-xs">
                                        {renderBadgeIcon(activeBadge.badgeIcon)}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="text-[11px] font-bold text-warning bg-warning-subtle/70 px-2 py-0.5 rounded-full">
                                                نشان فعال شما
                                            </span>
                                            <h3 className="font-black text-foreground text-base">
                                                {activeBadge.badgeName}
                                            </h3>
                                        </div>
                                        <p className="text-xs text-foreground-muted">
                                            این نشان بر روی تمام آگهی‌ها و پروفایل شما به صورت برجسته نمایش داده می‌شود.
                                        </p>
                                    </div>
                                </div>
                                <div className="text-left text-xs text-foreground-muted shrink-0">
                                    <span>اعتبار تا:</span>
                                    <span className="block font-bold text-foreground-secondary">
                                        {new Date(activeBadge.expiresAt).toLocaleDateString("fa-IR")}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="p-5 bg-surface border border-border-subtle/80 rounded-3xl flex items-center justify-between text-xs text-foreground-muted">
                                <div className="flex items-center gap-2.5">
                                    <ShieldCheck className="w-5 h-5 text-foreground-muted" />
                                    <span>در حال حاضر نشان فعالی ندارید. با خرید پلن‌های ویژه می‌توانید نشان اختصاصی دریافت کنید.</span>
                                </div>
                                <button
                                    onClick={() => setActiveTab("plans")}
                                    className="font-bold text-primary hover:underline"
                                >
                                    مشاهده پلن‌ها
                                </button>
                            </div>
                        )}

                        {/* Entitlement Quotas Grid (Aggregated per feature with per-plan breakdown) */}
                        <div>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3.5">
                                <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4 text-primary" />
                                    <span>مجموع سهمیه‌های فعال شما</span>
                                </h3>
                                {aggregatedEntitlements.length > 0 && (
                                    <span className="text-xs text-foreground-muted">
                                        تعداد فیچرهای فعال: {toPersianDigits(aggregatedEntitlements.length)} مورد
                                    </span>
                                )}
                            </div>

                            {isLoadingEntitlements ? (
                                <div className="py-12 flex justify-center text-foreground-muted">
                                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                </div>
                            ) : aggregatedEntitlements.length === 0 ? (
                                <div className="py-12 bg-surface rounded-3xl border border-border-subtle/80 text-center p-6 text-xs text-foreground-muted">
                                    سهمیه فعالی ندارید. با خرید اشتراک سهمیه‌های انتشار و ارتقای فوری دریافت خواهید کرد.
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

                                        return (
                                            <div
                                                key={group.type}
                                                className="bg-surface rounded-3xl border border-border-subtle/80 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-all"
                                            >
                                                <div>
                                                    {/* Top Row: Icon, Multi-plan badge, Expiry */}
                                                    <div className="flex items-center justify-between mb-3.5">
                                                        <div className="flex items-center gap-2">
                                                            <span
                                                                className={cn(
                                                                    "p-2 rounded-xl shrink-0",
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
                                                        <span className="text-[11px] font-medium text-foreground-muted">
                                                            {group.nearestExpiresAt
                                                                ? `انقضا: ${new Date(group.nearestExpiresAt).toLocaleDateString("fa-IR")}`
                                                                : "همگام با اشتراک"}
                                                        </span>
                                                    </div>

                                                    {/* Feature Title */}
                                                    <h4 className="font-bold text-foreground text-sm mb-1">
                                                        {meta.label}
                                                    </h4>

                                                    {/* Quota Numbers (Aggregated Sum) */}
                                                    <div className="flex items-baseline justify-between mb-2">
                                                        <div className="flex items-baseline gap-1">
                                                            <span className="text-2xl font-black text-foreground">
                                                                {toPersianDigits(group.remainingQuota)}
                                                            </span>
                                                            <span className="text-xs text-foreground-muted font-normal">
                                                                باقی‌مانده
                                                            </span>
                                                        </div>
                                                        <span className="text-xs text-foreground-muted">
                                                            از کل {toPersianDigits(group.totalQuota)} عدد
                                                        </span>
                                                    </div>

                                                    {/* Progress Bar */}
                                                    <div className="w-full bg-surface-secondary rounded-full h-2 overflow-hidden my-3">
                                                        <div
                                                            className={cn(
                                                                "h-full transition-all duration-300 rounded-full",
                                                                meta.progressBar,
                                                            )}
                                                            style={{ width: `${percentRemaining}%` }}
                                                        />
                                                    </div>

                                                    {/* Plan Breakdown */}
                                                    <div className="mt-4 pt-3.5 border-t border-border-subtle/60">
                                                        <span className="text-[11px] font-bold text-foreground-muted block mb-2">
                                                            سهمیه به تفکیک پلن:
                                                        </span>
                                                        <div className="space-y-1.5">
                                                            {group.plans.map((plan, pIdx) => (
                                                                <div
                                                                    key={pIdx}
                                                                    className="bg-surface-secondary/70 hover:bg-surface-secondary px-2.5 py-1.5 rounded-xl flex items-center justify-between text-xs gap-2 transition-colors"
                                                                    title={
                                                                        plan.expiresAt
                                                                            ? `تاریخ انقضا: ${new Date(plan.expiresAt).toLocaleDateString("fa-IR")}`
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
                                                                        <span className="font-medium text-foreground truncate text-[11px]">
                                                                            {plan.planName}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-center gap-1 shrink-0 text-[11px]">
                                                                        <span className="font-black text-foreground">
                                                                            {toPersianDigits(plan.remainingQuota)}
                                                                        </span>
                                                                        <span className="text-foreground-muted text-[10px]">
                                                                            از {toPersianDigits(plan.totalQuota)}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* RESPONSIVE PURCHASE CONFIRMATION MODAL (Desktop Dialog / Mobile Drawer) */}
            {selectedPlanForPurchase && (
                <div role="dialog" aria-modal="true" aria-label="تأیید خرید اشتراک" className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
                        onClick={() => setSelectedPlanForPurchase(null)}
                    />

                    {/* Responsive Container */}
                    <div className="relative z-10 w-full md:max-w-md bg-surface rounded-t-3xl md:rounded-3xl p-6 shadow-2xl transition-all max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between pb-4 border-b border-border-subtle mb-4">
                            <h3 className="font-black text-foreground text-base">تأیید خرید اشتراک</h3>
                            <button
                                onClick={() => setSelectedPlanForPurchase(null)}
                                className="p-1.5 text-foreground-muted hover:text-foreground-secondary rounded-xl hover:bg-surface-secondary transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Plan Summary */}
                        <div className="p-4 bg-surface-secondary rounded-2xl mb-4 space-y-2 text-xs">
                            <div className="flex justify-between">
                                <span className="text-foreground-muted">پلن انتخابی:</span>
                                <span className="font-bold text-foreground">
                                    {selectedPlanForPurchase.name}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-foreground-muted">مدت اشتراک:</span>
                                <span className="font-bold text-foreground">
                                    {toPersianDigits(selectedPlanForPurchase.durationDays)} روز
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-foreground-muted">مبلغ پرداختی:</span>
                                <span className="font-black text-foreground text-sm">
                                    {formatCurrency(rialToToman(selectedPlanForPurchase.priceIrr))} تومان
                                </span>
                            </div>
                        </div>

                        {/* Financial Ledger Breakdown */}
                        <div className="p-3 bg-info-subtle/60 border border-info/30 rounded-2xl text-xs space-y-1.5 mb-5 text-foreground">
                            <div className="flex justify-between">
                                <span>موجودی فعلی کیف پول:</span>
                                <span className="font-bold">{formatCurrency(availableBalanceToman)} تومان</span>
                            </div>
                            <div className="flex justify-between">
                                <span>موجودی پس از کسر:</span>
                                <span className="font-bold">
                                    {formatCurrency(
                                        Math.max(
                                            0,
                                            availableBalanceToman -
                                            rialToToman(selectedPlanForPurchase.priceIrr),
                                        ),
                                    )}{" "}
                                    تومان
                                </span>
                            </div>
                        </div>

                        {/* Auto-renew checkbox */}
                        <label className="flex items-center gap-2.5 text-xs text-foreground-secondary mb-6 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={autoRenew}
                                onChange={(e) => setAutoRenew(e.target.checked)}
                                className="w-4 h-4 rounded text-primary focus:ring-primary/20 accent-primary"
                            />
                            <span>تمدید خودکار اشتراک در صورت داشتن موجودی کافی</span>
                        </label>

                        {/* Action buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => setSelectedPlanForPurchase(null)}
                                className="flex-1 py-3 rounded-2xl bg-surface-secondary hover:bg-slate-200 text-foreground-secondary font-bold text-xs transition"
                            >
                                انصراف
                            </button>
                            <button
                                onClick={handleConfirmPurchase}
                                disabled={purchaseMutation.isPending}
                                className="flex-1 py-3 rounded-2xl bg-primary hover:bg-primary-hover text-white font-black text-xs transition flex items-center justify-center gap-2 shadow-xs disabled:opacity-60"
                            >
                                {purchaseMutation.isPending && (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                )}
                                <span>تأیید و کسر از کیف پول</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
