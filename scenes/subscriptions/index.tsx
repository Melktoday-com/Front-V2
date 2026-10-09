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
import { cn, formatPrice, toPersianDigits } from "@/lib/utils";
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
    const availableBalanceToman = Math.floor(availableBalanceIrr / 10);

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
            const shortageToman = Math.max(0, Math.floor((planPriceIrr - availableBalanceIrr) / 10));
            toast.error(
                `موجودی کیف پول کافی نیست. لطفا حداقل ${formatPrice(shortageToman)} تومان کیف پول خود را شارژ کنید.`,
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
                onError: (err: any) => {
                    const message =
                        err?.response?.data?.message || err?.message || "خطا در خرید اشتراک";
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
                    toast.success(res.message || "بسته خوش‌آمدگویی با موفقیت دریافت شد!");
                },
                onError: (err: any) => {
                    const msg =
                        err?.response?.data?.message ||
                        err?.message ||
                        "شما پیش از این بسته خوش‌آمدگویی را دریافت کرده‌اید.";
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
                return <Award className="w-4 h-4 text-blue-500" />;
            case "check":
            case "checkcircle":
                return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
            default:
                return <ShieldCheck className="w-4 h-4 text-primary" />;
        }
    };

    return (
        <div className="min-h-screen bg-slate-50/60 pb-28 lg:pb-10 pt-6">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <div className="flex items-center gap-2 mb-1.5">
                            <span className="p-2 rounded-xl bg-primary/10 text-primary">
                                <Sparkles className="w-5 h-5" />
                            </span>
                            <h1 className="text-2xl font-black text-slate-800 tracking-tight">
                                پلن‌های اشتراک و سهمیه‌های ویژه
                            </h1>
                        </div>
                        <p className="text-sm text-slate-500">
                            ارتقای ظرفیت آگهی‌ها، انتشار اقامتگاه، نردبان و برچسب‌های فوری اختصاصی
                        </p>
                    </div>

                    {/* Wallet Badge & Quick Link */}
                    {isLoggedIn && (
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2.5 bg-white border border-slate-200/80 px-4 py-2.5 rounded-2xl shadow-sm">
                                <Wallet className="w-4 h-4 text-emerald-600" />
                                <div className="text-xs">
                                    <span className="text-slate-400 block font-normal">موجودی در دسترس:</span>
                                    <span className="font-black text-slate-800">
                                        {isLoadingWallet ? "..." : `${formatPrice(availableBalanceToman)} تومان`}
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
                    <div className="mb-8 p-5 bg-gradient-to-r from-amber-50 to-orange-50/70 border border-amber-200/80 rounded-3xl">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            <div className="flex items-start gap-3.5">
                                <div className="p-2.5 bg-amber-500/10 text-amber-700 rounded-2xl shrink-0 mt-0.5">
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
                                    className="flex-1 md:flex-none text-center px-4 py-2.5 bg-white border border-amber-300 text-amber-900 hover:bg-amber-100/50 font-bold text-xs rounded-2xl shadow-sm transition"
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
                        <div className="mt-4 pt-4 border-t border-amber-200/60 flex items-center justify-between text-xs">
                            <span className="text-amber-800 font-medium">پیش‌نمایش پلن‌ها بر اساس نقش:</span>
                            <div className="inline-flex p-1 bg-amber-200/40 rounded-xl">
                                <button
                                    onClick={() => setSelectedRole("landlord")}
                                    className={cn(
                                        "px-3 py-1 rounded-lg font-bold transition",
                                        selectedRole === "landlord"
                                            ? "bg-white text-amber-900 shadow-sm"
                                            : "text-amber-700 hover:text-amber-950",
                                    )}
                                >
                                    میزبان اقامتگاه
                                </button>
                                <button
                                    onClick={() => setSelectedRole("agent")}
                                    className={cn(
                                        "px-3 py-1 rounded-lg font-bold transition",
                                        selectedRole === "agent"
                                            ? "bg-white text-amber-900 shadow-sm"
                                            : "text-amber-700 hover:text-amber-950",
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
                    <div className="flex items-center gap-2 mb-6 border-b border-slate-200">
                        <button
                            onClick={() => setActiveTab("plans")}
                            className={cn(
                                "pb-3.5 px-4 text-sm font-bold border-b-2 transition flex items-center gap-2",
                                activeTab === "plans"
                                    ? "border-primary text-primary"
                                    : "border-transparent text-slate-500 hover:text-slate-800",
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
                                    : "border-transparent text-slate-500 hover:text-slate-800",
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
                            <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                <span className="text-xs">در حال بارگذاری پلن‌های اشتراک...</span>
                            </div>
                        ) : plans.length === 0 ? (
                            <div className="py-16 text-center bg-white rounded-3xl border border-slate-200/80 p-8 shadow-sm">
                                <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                <h3 className="font-bold text-slate-700 mb-1">پلن فعالی یافت نشد</h3>
                                <p className="text-xs text-slate-400">
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
                                            className="bg-white rounded-3xl border border-slate-200/80 p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition relative group"
                                        >
                                            {/* Top info */}
                                            <div>
                                                {/* Dynamic Badge Tag if plan includes badge */}
                                                {plan.badgeName && (
                                                    <div className="mb-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-700 border border-amber-200/60 shadow-xs">
                                                        {renderBadgeIcon(plan.badgeIcon)}
                                                        <span>{plan.badgeName}</span>
                                                    </div>
                                                )}

                                                <h3 className="text-lg font-black text-slate-800 mb-1">
                                                    {plan.name}
                                                </h3>
                                                <p className="text-xs text-slate-500 mb-4 line-clamp-2">
                                                    {plan.description || "سهمیه‌های ویژه انتشار و ارتقای آگهی"}
                                                </p>

                                                {/* Price */}
                                                <div className="py-3 px-4 bg-slate-50 rounded-2xl mb-5 flex items-baseline justify-between">
                                                    <span className="text-xs text-slate-500 font-medium">هزینه پلن:</span>
                                                    <div className="text-left">
                                                        <span className="text-xl font-black text-slate-900">
                                                            {formatPrice(priceToman)}
                                                        </span>
                                                        <span className="text-[11px] text-slate-500 mr-1.5 font-bold">
                                                            تومان
                                                        </span>
                                                        <span className="block text-[10px] text-slate-400 font-normal">
                                                            مدت اعتبار: {toPersianDigits(plan.durationDays)} روز
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Entitlements feature list */}
                                                <div className="space-y-2.5 text-xs text-slate-700 mb-6">
                                                    {plan.publicationQuota > 0 && (
                                                        <div className="flex items-center gap-2">
                                                            <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                                                            <span>
                                                                انتشار{" "}
                                                                <strong className="font-black text-slate-900">
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
                                                                <strong className="font-black text-slate-900">
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
                                                                <strong className="font-black text-slate-900">
                                                                    {toPersianDigits(plan.urgentQuota)}
                                                                </strong>{" "}
                                                                برچسب فوری (فوری شو)
                                                            </span>
                                                        </div>
                                                    )}

                                                    {plan.ladderQuota > 0 && (
                                                        <div className="flex items-center gap-2">
                                                            <Check className="w-4 h-4 text-blue-500 shrink-0" />
                                                            <span>
                                                                <strong className="font-black text-slate-900">
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
                                                        : "bg-slate-100 text-slate-400 cursor-not-allowed",
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
                            <div className="mt-12 p-6 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border border-blue-200/60 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-3.5">
                                    <div className="p-3 bg-blue-500/10 text-blue-600 rounded-2xl shrink-0">
                                        <Gift className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-slate-900 text-sm mb-1">
                                            بسته خوش‌آمدگویی ملک‌تودی
                                        </h4>
                                        <p className="text-xs text-slate-500">
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
                            <div className="p-6 bg-white rounded-3xl border border-slate-200/80 animate-pulse h-28" />
                        ) : activeBadge ? (
                            <div className="p-6 bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-white border border-amber-200 rounded-3xl flex items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="p-3.5 bg-amber-500/15 text-amber-600 rounded-2xl shadow-xs">
                                        {renderBadgeIcon(activeBadge.badgeIcon)}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="text-[11px] font-bold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-full">
                                                نشان فعال شما
                                            </span>
                                            <h3 className="font-black text-slate-900 text-base">
                                                {activeBadge.badgeName}
                                            </h3>
                                        </div>
                                        <p className="text-xs text-slate-500">
                                            این نشان بر روی تمام آگهی‌ها و پروفایل شما به صورت برجسته نمایش داده می‌شود.
                                        </p>
                                    </div>
                                </div>
                                <div className="text-left text-xs text-slate-400 shrink-0">
                                    <span>اعتبار تا:</span>
                                    <span className="block font-bold text-slate-700">
                                        {new Date(activeBadge.expiresAt).toLocaleDateString("fa-IR")}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="p-5 bg-white border border-slate-200/80 rounded-3xl flex items-center justify-between text-xs text-slate-500">
                                <div className="flex items-center gap-2.5">
                                    <ShieldCheck className="w-5 h-5 text-slate-400" />
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
                            <h3 className="text-sm font-black text-slate-800 mb-3 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-primary" />
                                <span>سهمیه‌های باقی‌مانده شما</span>
                            </h3>

                            {isLoadingEntitlements ? (
                                <div className="py-12 flex justify-center text-slate-400">
                                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                </div>
                            ) : entitlements.length === 0 ? (
                                <div className="py-12 bg-white rounded-3xl border border-slate-200/80 text-center p-6 text-xs text-slate-400">
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
                                            icon = <Home className="w-4 h-4 text-emerald-600" />;
                                        } else if (ent.entitlementType === "TEMPORARY_RENTAL_PUBLICATION") {
                                            label = "انتشار اقامتگاه روزانه";
                                            icon = <Building2 className="w-4 h-4 text-blue-600" />;
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
                                                className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between"
                                            >
                                                <div>
                                                    <div className="flex items-center justify-between mb-3">
                                                        <span className="p-2 bg-slate-50 rounded-xl">{icon}</span>
                                                        <span className="text-[11px] font-bold text-slate-400">
                                                            انقضا: {new Date(ent.expiresAt).toLocaleDateString("fa-IR")}
                                                        </span>
                                                    </div>
                                                    <h4 className="font-bold text-slate-800 text-xs mb-2">
                                                        {label}
                                                    </h4>
                                                    <div className="flex items-baseline justify-between mb-2">
                                                        <span className="text-2xl font-black text-slate-900">
                                                            {toPersianDigits(ent.remainingQuota)}
                                                        </span>
                                                        <span className="text-xs text-slate-400">
                                                            از کل {toPersianDigits(ent.totalQuota)} عدد
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Progress Bar */}
                                                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mt-3">
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
                    <div className="relative z-10 w-full md:max-w-md bg-white rounded-t-3xl md:rounded-3xl p-6 shadow-2xl transition-all max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                            <h3 className="font-black text-slate-800 text-base">تأیید خرید اشتراک</h3>
                            <button
                                onClick={() => setSelectedPlanForPurchase(null)}
                                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-50 transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Plan Summary */}
                        <div className="p-4 bg-slate-50 rounded-2xl mb-4 space-y-2 text-xs">
                            <div className="flex justify-between">
                                <span className="text-slate-500">پلن انتخابی:</span>
                                <span className="font-bold text-slate-800">
                                    {selectedPlanForPurchase.name}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">مدت اشتراک:</span>
                                <span className="font-bold text-slate-800">
                                    {toPersianDigits(selectedPlanForPurchase.durationDays)} روز
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">مبلغ پرداختی:</span>
                                <span className="font-black text-slate-900 text-sm">
                                    {formatPrice(Math.floor(Number(selectedPlanForPurchase.priceIrr) / 10))} تومان
                                </span>
                            </div>
                        </div>

                        {/* Financial Ledger Breakdown */}
                        <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-2xl text-xs space-y-1.5 mb-5 text-blue-900">
                            <div className="flex justify-between">
                                <span>موجودی فعلی کیف پول:</span>
                                <span className="font-bold">{formatPrice(availableBalanceToman)} تومان</span>
                            </div>
                            <div className="flex justify-between">
                                <span>موجودی پس از کسر:</span>
                                <span className="font-bold">
                                    {formatPrice(
                                        Math.max(
                                            0,
                                            availableBalanceToman -
                                                Math.floor(Number(selectedPlanForPurchase.priceIrr) / 10),
                                        ),
                                    )}{" "}
                                    تومان
                                </span>
                            </div>
                        </div>

                        {/* Auto-renew checkbox */}
                        <label className="flex items-center gap-2.5 text-xs text-slate-700 mb-6 cursor-pointer select-none">
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
                                className="flex-1 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
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
