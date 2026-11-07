"use client";

import { useAuth } from "@/hooks/useAuth";
import {
    useClaimWelcomePackage,
    useEntitlements,
    usePurchasePlan,
    useSubscriptionPlans,
} from "@/hooks/useSubscription";
import { SubscriptionEntitlementsSection } from "@/components/subscriptions/SubscriptionEntitlementsSection";
import { SubpageHeader } from "@/components/ui/SubpageHeader";
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
    FileText,
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

    const isPrivileged = activeRole === "super-admin" || activeRole === "admin";
    const isHostOrAgent = activeRole === "landlord" || activeRole === "agent";
    const canPurchase = isHostOrAgent || isPrivileged;
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
    const effectivePlanRole = isHostOrAgent
        ? (activeRole as SubscriptionTargetRole)
        : selectedRole;
    const { data: plans = [], isLoading: isLoadingPlans } = useSubscriptionPlans(effectivePlanRole);
    const { data: entitlements = [], isLoading: isLoadingEntitlements } = useEntitlements();

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

        if (!canPurchase) {
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
                <SubpageHeader
                    title={activeTab === "entitlements" ? "سهمیه‌ها و پلن‌های من" : "پلن‌های اشتراک و سهمیه‌ها"}
                    backHref="/profile"
                    className="mb-6"
                />

                {/* Non-Host / Non-Agent Banner (Regular User Guidance) */}
                {!isHostOrAgent && !isPrivileged && activeTab === "plans" && (
                    <div className="relative overflow-hidden mb-8 p-5 sm:p-6 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-surface rounded-3xl border border-amber-500/25 shadow-xs transition-all">
                        {/* Decorative background glows */}
                        <div className="pointer-events-none absolute -top-12 -left-12 w-48 h-48 rounded-full bg-amber-400/15 blur-2xl" />
                        <div className="pointer-events-none absolute -bottom-14 -right-14 w-44 h-44 rounded-full bg-orange-400/10 blur-xl" />

                        <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
                            {/* Content Info */}
                            <div className="flex items-start gap-3.5 sm:gap-4 max-w-2xl">
                                <div className="p-3 bg-gradient-to-br from-amber-500/20 to-orange-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 rounded-2xl shrink-0 mt-0.5 shadow-2xs">
                                    <Sparkles className="w-5 h-5" />
                                </div>
                                <div className="space-y-1.5">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="font-black text-foreground text-base sm:text-lg tracking-tight">
                                            پلن‌های اشتراک مختص «میزبانان» و «مشاوران املاک» است
                                        </h3>
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/20">
                                            راهنما
                                        </span>
                                    </div>
                                    <p className="text-xs sm:text-[13px] text-foreground-muted leading-relaxed">
                                        کاربران عادی به ازای هر آگهی مبلغ مصوب را پرداخت می‌کنند. در صورت تمایل به خرید اشتراک، دریافت سهمیه‌های انبوه و نشان تایید، به عنوان میزبان یا مشاور املاک ثبت‌نام کنید.
                                    </p>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0 w-full lg:w-auto">
                                <Link
                                    href="/host/apply"
                                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-surface hover:bg-surface-secondary border border-border-subtle hover:border-amber-400/60 text-foreground font-black text-xs rounded-2xl shadow-2xs hover:shadow-xs transition-all active:scale-[0.98]"
                                >
                                    <Home className="w-4 h-4 text-amber-600" />
                                    <span>ثبت‌نام میزبان</span>
                                </Link>

                                <Link
                                    href="/agency/apply"
                                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs rounded-2xl shadow-xs hover:shadow-sm transition-all active:scale-[0.98]"
                                >
                                    <Building2 className="w-4 h-4 text-white" />
                                    <span>ثبت‌نام مشاور / آژانس</span>
                                </Link>
                            </div>
                        </div>

                        {/* Bottom Row: Role Preview Switcher + Requests Page Link */}
                        <div className="relative mt-5 pt-4 border-t border-amber-500/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                            <div className="flex flex-wrap items-center gap-2 text-foreground-secondary">
                                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                                <span className="font-bold">پیش‌نمایش پلن‌ها بر اساس نقش:</span>
                                <div className="inline-flex p-1 bg-surface-secondary/80 rounded-xl border border-border-subtle/80 shadow-2xs">
                                    <button
                                        onClick={() => setSelectedRole("landlord")}
                                        className={cn(
                                            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all text-xs",
                                            selectedRole === "landlord"
                                                ? "bg-surface text-foreground shadow-xs border border-border-subtle/50"
                                                : "text-foreground-muted hover:text-foreground",
                                        )}
                                    >
                                        <Home className="w-3.5 h-3.5 text-amber-600" />
                                        <span>میزبان اقامتگاه</span>
                                    </button>
                                    <button
                                        onClick={() => setSelectedRole("agent")}
                                        className={cn(
                                            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all text-xs",
                                            selectedRole === "agent"
                                                ? "bg-surface text-foreground shadow-xs border border-border-subtle/50"
                                                : "text-foreground-muted hover:text-foreground",
                                        )}
                                    >
                                        <Building2 className="w-3.5 h-3.5 text-info" />
                                        <span>مشاور املاک</span>
                                    </button>
                                </div>
                            </div>

                            {/* Link to Requests Page */}
                            <Link
                                href="/profile/requests"
                                className="group inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300 hover:text-amber-950 transition-colors"
                            >
                                <FileText className="w-3.5 h-3.5 text-amber-600" />
                                <span>پیگیری وضعیت در صفحه درخواست‌ها</span>
                                <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
                            </Link>
                        </div>
                    </div>
                )}

                {/* Privileged Admin Role Switcher */}
                {isPrivileged && (
                    <div className="mb-6 p-4 bg-surface rounded-2xl border border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
                        <span className="text-xs font-bold text-foreground">
                            مشاهده پلن‌ها به عنوان مدیر ارشد سیستم:
                        </span>
                        <div className="inline-flex p-1 bg-surface-secondary rounded-xl">
                            <button
                                onClick={() => setSelectedRole("landlord")}
                                className={cn(
                                    "px-3 py-1 rounded-lg text-xs font-bold transition",
                                    selectedRole === "landlord"
                                        ? "bg-primary text-white shadow-xs"
                                        : "text-foreground-muted hover:text-foreground",
                                )}
                            >
                                میزبان اقامتگاه
                            </button>
                            <button
                                onClick={() => setSelectedRole("agent")}
                                className={cn(
                                    "px-3 py-1 rounded-lg text-xs font-bold transition",
                                    selectedRole === "agent"
                                        ? "bg-primary text-white shadow-xs"
                                        : "text-foreground-muted hover:text-foreground",
                                )}
                            >
                                مشاور املاک
                            </button>
                        </div>
                    </div>
                )}

                {/* Navigation Tabs (Accessible to Host/Agent, Admins, or any user with active entitlements) */}
                {(canPurchase || (Array.isArray(entitlements) && entitlements.length > 0)) && (
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
                            <span>سهمیه‌ها و پلن‌های من</span>
                            {aggregatedEntitlements.length > 0 && (
                                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-primary/10 text-primary">
                                    {toPersianDigits(aggregatedEntitlements.length)}
                                </span>
                            )}
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
                                                    <div className="mb-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-warning-subtle text-warning border border-warning/30 shadow-xs">
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
                                                                برچسب فوری
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
                                                disabled={!canPurchase}
                                                className={cn(
                                                    "w-full py-3 rounded-2xl font-black text-xs transition flex items-center justify-center gap-2 shadow-xs",
                                                    canPurchase
                                                        ? "bg-primary hover:bg-primary-hover text-white cursor-pointer"
                                                        : "bg-surface-secondary text-foreground-muted cursor-not-allowed",
                                                )}
                                            >
                                                <span>{canPurchase ? "انتخاب و خرید اشتراک" : "مخصوص میزبانان و مشاوران"}</span>
                                                {canPurchase && <ArrowLeft className="w-3.5 h-3.5" />}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Welcome Package Section */}
                        {isLoggedIn && (
                            <div className="mt-12 p-6 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border border-info/30 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4">
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
                    <SubscriptionEntitlementsSection
                        onNavigateToPlans={() => setActiveTab("plans")}
                    />
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
