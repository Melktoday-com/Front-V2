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
import { cn, formatCurrency, formatPrice, rialToToman, toPersianDigits } from "@/lib/utils";
import { normalizeApiError } from "@/lib/api/error-handler";
import {
    ActiveBadgeInfo,
    EntitlementTypeName,
    SubscriptionPlan,
    SubscriptionTargetRole,
} from "@/types/api/subscription.types";
import {
    AlertCircle,
    ArrowLeft,
    Award,
    Building2,
    Calendar,
    Check,
    CheckCircle2,
    Clock,
    CreditCard,
    Flame,
    Gift,
    HelpCircle,
    Home,
    Layers,
    Loader2,
    RefreshCw,
    ShieldCheck,
    Sparkles,
    Star,
    TrendingUp,
    UserCheck,
    Wallet,
    X,
    Zap,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function SubscriptionsScene() {
    const router = useRouter();
    const { user, activeRole, isLoggedIn } = useAuth();
    const { data: walletData, isLoading: isLoadingWallet } = useWalletBalance();

    const isHostOrAgent = activeRole === "landlord" || activeRole === "agent";
    const [selectedRole, setSelectedRole] = useState<SubscriptionTargetRole>(
        activeRole === "agent" ? "agent" : "landlord",
    );
    const [activeTab, setActiveTab] = useState<"plans" | "entitlements">("plans");

    // Plans & Entitlements
    const { data: plans = [], isLoading: isLoadingPlans } = useSubscriptionPlans(
        isHostOrAgent ? (activeRole as SubscriptionTargetRole) : selectedRole,
    );
    const { data: entitlements = [], isLoading: isLoadingEntitlements } = useEntitlements();
    const { data: activeBadge, isLoading: isLoadingBadge } = useActiveBadge();

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
                            <span>پلن‌های قابل خرید</span>
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
                            <span>سهمیه‌ها و نشان‌های فعال شما</span>
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

                        {/* Entitlement Quotas Grid */}
                        <div>
                            <h3 className="text-sm font-black text-foreground mb-3 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-primary" />
                                <span>سهمیه‌های باقی‌مانده شما</span>
                            </h3>

                            {isLoadingEntitlements ? (
                                <div className="py-12 flex justify-center text-foreground-muted">
                                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                </div>
                            ) : entitlements.length === 0 ? (
                                <div className="py-12 bg-surface rounded-3xl border border-border-subtle/80 text-center p-6 text-xs text-foreground-muted">
                                    سهمیه فعالی ندارید. با خرید اشتراک سهمیه‌های انتشار و ارتقای فوری دریافت خواهید کرد.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {entitlements.map((ent) => {
                                        const percentUsed =
                                            ent.totalQuota > 0
                                                ? Math.min(100, Math.round((ent.usedQuota / ent.totalQuota) * 100))
                                                : 0;

                                        let label: string = ent.entitlementType;
                                        let icon = <Layers className="w-4 h-4 text-primary" />;

                                        if (ent.entitlementType === "LISTING_PUBLICATION") {
                                            label = "انتشار آگهی ملکی";
                                            icon = <Home className="w-4 h-4 text-success" />;
                                        } else if (ent.entitlementType === "TEMPORARY_RENTAL_PUBLICATION") {
                                            label = "انتشار اقامتگاه روزانه";
                                            icon = <Building2 className="w-4 h-4 text-info" />;
                                        } else if (ent.entitlementType === "URGENT_PROMOTION") {
                                            label = "برچسب فوری";
                                            icon = <Flame className="w-4 h-4 text-amber-500" />;
                                        } else if (ent.entitlementType === "LADDER_PROMOTION") {
                                            label = "نردبان آگهی";
                                            icon = <TrendingUp className="w-4 h-4 text-purple-600" />;
                                        }

                                        return (
                                            <div
                                                key={ent.id}
                                                className="bg-surface rounded-3xl border border-border-subtle/80 p-5 shadow-xs flex flex-col justify-between"
                                            >
                                                <div>
                                                    <div className="flex items-center justify-between mb-3">
                                                        <span className="p-2 bg-surface-secondary rounded-xl">{icon}</span>
                                                        <span className="text-[11px] font-bold text-foreground-muted">
                                                            انقضا: {new Date(ent.expiresAt).toLocaleDateString("fa-IR")}
                                                        </span>
                                                    </div>
                                                    <h4 className="font-bold text-foreground text-xs mb-2">
                                                        {label}
                                                    </h4>
                                                    <div className="flex items-baseline justify-between mb-2">
                                                        <span className="text-2xl font-black text-foreground">
                                                            {toPersianDigits(ent.remainingQuota)}
                                                        </span>
                                                        <span className="text-xs text-foreground-muted">
                                                            از کل {toPersianDigits(ent.totalQuota)} عدد
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Progress Bar */}
                                                <div className="w-full bg-surface-secondary rounded-full h-2 overflow-hidden mt-3">
                                                    <div
                                                        className="bg-primary h-full transition-all duration-300 rounded-full"
                                                        style={{ width: `${100 - percentUsed}%` }}
                                                    />
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
