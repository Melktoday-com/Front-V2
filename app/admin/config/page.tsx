"use client";

import React, { useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
    Settings,
    ShieldCheck,
    BarChart,
    Save,
    RefreshCcw,
    Info,
    Zap,
    TrendingUp,
    Plus,
    Edit3,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Star,
    Award,
    Crown,
    Gem,
    Sparkles,
    Clock,
    Coins,
    Package,
    Home,
    Building2,
    User,
    Lock,
    X,
    Filter,
    Layers,
    LucideIcon,
} from "lucide-react";
import { adminService } from "@/services/admin.service";
import { PlanLimits } from "@/types/api/admin.types";
import {
    SubscriptionPlan,
    WelcomePackage,
    SubscriptionTargetRole,
    CreateSubscriptionPlanRequest,
    UpdateWelcomePackageRequest,
    SubscriptionBadgeMetadata,
} from "@/types/api/subscription.types";
import {
    useAdminSubscriptionPlans,
    useAdminCreatePlan,
    useAdminUpdatePlan,
    useAdminWelcomePackages,
    useAdminUpdateWelcomePackage,
} from "@/hooks/useSubscription";
import { useAdminPermissions } from "@/hooks/useAdminPermissions";
import { normalizeApiError } from "@/lib/api/error-handler";
import { toPersianDigits } from "@/lib/utils";

// Currency & Date helpers
function formatRialToToman(rialAmount: string | number | undefined | null): string {
    if (!rialAmount) return "۰ تومان";
    const num = typeof rialAmount === "string" ? parseFloat(rialAmount) : rialAmount;
    if (isNaN(num) || num === 0) return "۰ تومان";
    const toman = Math.floor(num / 10);
    return `${new Intl.NumberFormat("fa-IR").format(toman)} تومان`;
}

function formatRials(rialAmount: string | number | undefined | null): string {
    if (!rialAmount) return "۰ ریال";
    const num = typeof rialAmount === "string" ? parseFloat(rialAmount) : rialAmount;
    if (isNaN(num) || num === 0) return "۰ ریال";
    return `${new Intl.NumberFormat("fa-IR").format(num)} ریال`;
}

// Dynamic Icon Component
function DynamicBadgeIcon({ iconName, className }: { iconName?: string | null; className?: string }) {
    switch (iconName?.toLowerCase()) {
        case "shield-check":
            return <ShieldCheck className={className} />;
        case "award":
            return <Award className={className} />;
        case "star":
            return <Star className={className} />;
        case "crown":
            return <Crown className={className} />;
        case "check-circle":
            return <CheckCircle2 className={className} />;
        case "zap":
            return <Zap className={className} />;
        case "gem":
            return <Gem className={className} />;
        default:
            return <Sparkles className={className} />;
    }
}

const AVAILABLE_BADGE_ICONS = [
    { id: "shield-check", label: "سپر تایید", icon: ShieldCheck },
    { id: "award", label: "نشان افتخار", icon: Award },
    { id: "star", label: "ستاره طلایی", icon: Star },
    { id: "crown", label: "تاج ویژه", icon: Crown },
    { id: "check-circle", label: "تیک تایید", icon: CheckCircle2 },
    { id: "zap", label: "صاعقه پرسرعت", icon: Zap },
    { id: "gem", label: "الماس لوکس", icon: Gem },
];

const AVAILABLE_COLORS = [
    { id: "emerald", label: "سبز زمردی", bg: "#ecfdf5", border: "#a7f3d0", text: "#065f46" },
    { id: "blue", label: "آبی کلاسیک", bg: "#eff6ff", border: "#bfdbfe", text: "#1e40af" },
    { id: "amber", label: "طلایی / کهربایی", bg: "#fef3c7", border: "#fde68a", text: "#92400e" },
    { id: "purple", label: "بنفش متمایز", bg: "#faf5ff", border: "#e9d5ff", text: "#6b21a8" },
    { id: "rose", label: "قرمز گلی", bg: "#fff1f2", border: "#fecdd3", text: "#9f1239" },
];

interface PlanFormState {
    name: string;
    slug: string;
    description: string;
    targetRole: SubscriptionTargetRole;
    priceIrr: string;
    durationDays: number;
    publicationQuota: number;
    tempRentQuota: number;
    urgentQuota: number;
    ladderQuota: number;
    badgeName: string;
    badgeIcon: string;
    badgeIconType: string;
    badgeColor: string;
    badgeBgColor: string;
    badgeTooltip: string;
    isActive: boolean;
    sortOrder: number;
}

const DEFAULT_PLAN_FORM: PlanFormState = {
    name: "",
    slug: "",
    description: "",
    targetRole: "agent",
    priceIrr: "2500000",
    durationDays: 30,
    publicationQuota: 10,
    tempRentQuota: 0,
    urgentQuota: 2,
    ladderQuota: 5,
    badgeName: "مشاور منتخب",
    badgeIcon: "shield-check",
    badgeIconType: "lucide",
    badgeColor: "blue",
    badgeBgColor: "#eff6ff",
    badgeTooltip: "دارای نشان تایید پلتفرم ملک‌تودی",
    isActive: true,
    sortOrder: 1,
};

interface WelcomePackageFormState {
    title: string;
    targetRole: string;
    walletBonusIrr: string;
    publicationQuota: number;
    tempRentQuota: number;
    urgentQuota: number;
    ladderQuota: number;
    durationDays: number;
    isActive: boolean;
}

const INITIAL_LEGACY_LIMITS: Record<string, PlanLimits> = {
    FREE: {
        maxActiveListings: 3,
        hasAnalytics: false,
        hasPriorityRanking: false,
        hasProBadge: false,
        hasUnlimitedMessaging: false,
        canBoost: false,
    },
    PRO: {
        maxActiveListings: 20,
        hasAnalytics: true,
        hasPriorityRanking: true,
        hasProBadge: true,
        hasUnlimitedMessaging: true,
        canBoost: true,
    },
};

export default function AdminConfigPage() {
    const queryClient = useQueryClient();
    const { isSuperAdmin, hasPermission, isLoading: permissionsLoading } = useAdminPermissions();
    const canManageConfig = isSuperAdmin || hasPermission("config.manage");

    // Tabs
    const [activeTab, setActiveTab] = useState<"plans" | "welcome" | "limits">("plans");
    const [planRoleFilter, setPlanRoleFilter] = useState<"ALL" | "agent" | "landlord">("ALL");

    // Plan Queries & Mutations
    const {
        data: rawPlans,
        isLoading: plansLoading,
        isError: plansError,
        refetch: refetchPlans,
    } = useAdminSubscriptionPlans();
    const createPlanMutation = useAdminCreatePlan();
    const updatePlanMutation = useAdminUpdatePlan();

    // Welcome Packages Queries & Mutations
    const {
        data: rawPackages,
        isLoading: packagesLoading,
        isError: packagesError,
        refetch: refetchPackages,
    } = useAdminWelcomePackages();
    const updatePackageMutation = useAdminUpdateWelcomePackage();

    // Legacy limits state
    const [legacyLimits, setLegacyLimits] = useState<Record<string, PlanLimits>>(INITIAL_LEGACY_LIMITS);
    const [selectedLegacyPlan, setSelectedLegacyPlan] = useState<"FREE" | "PRO">("FREE");

    const updateLegacyMutation = useMutation({
        mutationFn: ({ plan, data }: { plan: "FREE" | "PRO"; data: PlanLimits }) =>
            adminService.updatePlanLimits({ plan, limits: data }),
        onSuccess: () => {
            toast.success("تنظیمات محدودیت‌ها با موفقیت ذخیره شد");
        },
        onError: (error: Error) => {
            toast.error("خطا در ذخیره تنظیمات: " + normalizeApiError(error));
        },
    });

    // Unpack plans and packages data safely without `any`
    const plans: SubscriptionPlan[] = useMemo(() => {
        if (Array.isArray(rawPlans)) return rawPlans;
        if (rawPlans && typeof rawPlans === "object" && "data" in rawPlans) {
            const nested = (rawPlans as { data: SubscriptionPlan[] }).data;
            if (Array.isArray(nested)) return nested;
        }
        return [];
    }, [rawPlans]);

    const packages: WelcomePackage[] = useMemo(() => {
        if (Array.isArray(rawPackages)) return rawPackages;
        if (rawPackages && typeof rawPackages === "object" && "data" in rawPackages) {
            const nested = (rawPackages as { data: WelcomePackage[] }).data;
            if (Array.isArray(nested)) return nested;
        }
        return [];
    }, [rawPackages]);

    // Modal state for Plan
    const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
    const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
    const [planForm, setPlanForm] = useState<PlanFormState>(DEFAULT_PLAN_FORM);

    // Modal state for Welcome Package
    const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
    const [editingPackageId, setEditingPackageId] = useState<string | null>(null);
    const [packageForm, setPackageForm] = useState<WelcomePackageFormState>({
        title: "",
        targetRole: "user",
        walletBonusIrr: "0",
        publicationQuota: 0,
        tempRentQuota: 0,
        urgentQuota: 0,
        ladderQuota: 0,
        durationDays: 30,
        isActive: true,
    });

    // Filtered plans
    const filteredPlans = useMemo(() => {
        if (planRoleFilter === "ALL") return plans;
        return plans.filter((p) => p.targetRole === planRoleFilter);
    }, [plans, planRoleFilter]);

    // Handlers for Plan
    const openCreatePlanModal = () => {
        setEditingPlanId(null);
        setPlanForm(DEFAULT_PLAN_FORM);
        setIsPlanModalOpen(true);
    };

    const openEditPlanModal = (plan: SubscriptionPlan) => {
        setEditingPlanId(plan.id);
        const meta = plan.badgeMetadata;
        setPlanForm({
            name: plan.name,
            slug: (plan as { slug?: string }).slug || plan.name.toLowerCase().replace(/\s+/g, "-"),
            description: plan.description || "",
            targetRole: plan.targetRole,
            priceIrr: plan.priceIrr,
            durationDays: plan.durationDays,
            publicationQuota: plan.publicationQuota,
            tempRentQuota: plan.tempRentQuota,
            urgentQuota: plan.urgentQuota,
            ladderQuota: plan.ladderQuota,
            badgeName: plan.badgeName || "",
            badgeIcon: plan.badgeIcon || "shield-check",
            badgeIconType: plan.badgeIconType || "lucide",
            badgeColor: (meta && typeof meta.color === "string") ? meta.color : "blue",
            badgeBgColor: (meta && typeof meta.bg === "string") ? meta.bg : "#eff6ff",
            badgeTooltip: (meta && typeof meta.tooltip === "string") ? meta.tooltip : "",
            isActive: plan.isActive,
            sortOrder: plan.sortOrder,
        });
        setIsPlanModalOpen(true);
    };

    const handleSavePlan = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canManageConfig) {
            toast.error("شما مجوز مدیریت تنظیمات پلن‌ها را ندارید.");
            return;
        }

        if (!planForm.name.trim()) {
            toast.error("لطفاً نام پلن را وارد کنید.");
            return;
        }

        const badgeMeta: SubscriptionBadgeMetadata = {
            color: planForm.badgeColor,
            bg: planForm.badgeBgColor,
            tooltip: planForm.badgeTooltip.trim() || undefined,
        };

        try {
            if (editingPlanId) {
                // Update
                const payload: Partial<CreateSubscriptionPlanRequest> = {
                    name: planForm.name.trim(),
                    description: planForm.description.trim(),
                    targetRole: planForm.targetRole,
                    priceIrr: planForm.priceIrr,
                    durationDays: Number(planForm.durationDays),
                    publicationQuota: Number(planForm.publicationQuota),
                    tempRentQuota: Number(planForm.tempRentQuota),
                    urgentQuota: Number(planForm.urgentQuota),
                    ladderQuota: Number(planForm.ladderQuota),
                    badgeName: planForm.badgeName.trim() || undefined,
                    badgeIcon: planForm.badgeIcon || undefined,
                    badgeIconType: planForm.badgeIconType || "lucide",
                    badgeMetadata: badgeMeta,
                    isActive: planForm.isActive,
                    sortOrder: Number(planForm.sortOrder),
                };
                await updatePlanMutation.mutateAsync({ id: editingPlanId, payload });
                toast.success("پلن اشتراک با موفقیت ویرایش شد.");
            } else {
                // Create
                const payload: CreateSubscriptionPlanRequest = {
                    name: planForm.name.trim(),
                    slug: planForm.slug.trim() || `plan-${Date.now()}`,
                    description: planForm.description.trim(),
                    targetRole: planForm.targetRole,
                    priceIrr: planForm.priceIrr,
                    durationDays: Number(planForm.durationDays),
                    publicationQuota: Number(planForm.publicationQuota),
                    tempRentQuota: Number(planForm.tempRentQuota),
                    urgentQuota: Number(planForm.urgentQuota),
                    ladderQuota: Number(planForm.ladderQuota),
                    badgeName: planForm.badgeName.trim() || undefined,
                    badgeIcon: planForm.badgeIcon || undefined,
                    badgeIconType: planForm.badgeIconType || "lucide",
                    badgeMetadata: badgeMeta,
                    isActive: planForm.isActive,
                    sortOrder: Number(planForm.sortOrder),
                };
                await createPlanMutation.mutateAsync(payload);
                toast.success("پلن جدید با موفقیت ایجاد شد.");
            }
            setIsPlanModalOpen(false);
        } catch (err: unknown) {
            toast.error("خطا در ذخیره پلن: " + normalizeApiError(err instanceof Error ? err : new Error(String(err))));
        }
    };

    const handleTogglePlanActive = async (plan: SubscriptionPlan) => {
        if (!canManageConfig) {
            toast.error("شما مجوز تغییر وضعیت پلن را ندارید.");
            return;
        }
        try {
            await updatePlanMutation.mutateAsync({
                id: plan.id,
                payload: { isActive: !plan.isActive },
            });
            toast.success(plan.isActive ? "پلن غیرفعال شد." : "پلن فعال شد.");
        } catch (err: unknown) {
            toast.error("خطا در تغییر وضعیت پلن: " + normalizeApiError(err instanceof Error ? err : new Error(String(err))));
        }
    };

    // Handlers for Welcome Package
    const openEditPackageModal = (pkg: WelcomePackage) => {
        setEditingPackageId(pkg.id);
        setPackageForm({
            title: pkg.title,
            targetRole: pkg.targetRole,
            walletBonusIrr: pkg.walletBonusIrr || "0",
            publicationQuota: pkg.publicationQuota || 0,
            tempRentQuota: pkg.tempRentQuota || 0,
            urgentQuota: pkg.urgentQuota || 0,
            ladderQuota: pkg.ladderQuota || 0,
            durationDays: pkg.durationDays || 30,
            isActive: pkg.isActive,
        });
        setIsPackageModalOpen(true);
    };

    const handleSavePackage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canManageConfig) {
            toast.error("شما مجوز مدیریت بسته‌های خوش‌آمدگویی را ندارید.");
            return;
        }
        if (!editingPackageId) return;

        try {
            const payload: UpdateWelcomePackageRequest = {
                id: editingPackageId,
                title: packageForm.title.trim(),
                targetRole: packageForm.targetRole,
                walletBonusIrr: packageForm.walletBonusIrr,
                publicationQuota: Number(packageForm.publicationQuota),
                tempRentQuota: Number(packageForm.tempRentQuota),
                urgentQuota: Number(packageForm.urgentQuota),
                ladderQuota: Number(packageForm.ladderQuota),
                durationDays: Number(packageForm.durationDays),
                isActive: packageForm.isActive,
            };
            await updatePackageMutation.mutateAsync({ id: editingPackageId, payload });
            toast.success("بسته خوش‌آمدگویی با موفقیت به‌روزرسانی شد.");
            setIsPackageModalOpen(false);
        } catch (err: unknown) {
            toast.error("خطا در ذخیره بسته خوش‌آمدگویی: " + normalizeApiError(err instanceof Error ? err : new Error(String(err))));
        }
    };

    return (
        <div className="space-y-6 pb-12" dir="rtl">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                            <Settings size={24} />
                        </span>
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                            مدیریت پلن‌های اشتراک و بسته‌های خوش‌آمدگویی
                        </h1>
                    </div>
                    <p className="text-sm text-gray-500">
                        پیکربندی داینامیک ظرفیت‌ها، نشان‌ها، تعرفه‌ها و بسته‌های تشویقی ورود برای نقش‌های سیستم
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {!canManageConfig && !permissionsLoading && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-xs font-medium border border-amber-200">
                            <Lock size={14} />
                            فقط مشاهده (نیاز به مجوز config.manage)
                        </div>
                    )}
                    {activeTab === "plans" && canManageConfig && (
                        <button
                            onClick={openCreatePlanModal}
                            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-sm hover:bg-primary/90 transition-all active:scale-95"
                        >
                            <Plus size={18} />
                            افزودن پلن جدید
                        </button>
                    )}
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-gray-200 pb-1">
                <button
                    onClick={() => setActiveTab("plans")}
                    className={`flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-bold transition-all relative ${
                        activeTab === "plans"
                            ? "bg-white text-blue-600 shadow-sm border border-gray-200"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-100/60"
                    }`}
                >
                    <Layers size={18} />
                    <span>پلن‌های اشتراک</span>
                    <span className="px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue-700 font-mono font-bold">
                        {toPersianDigits(plans.length)}
                    </span>
                </button>

                <button
                    onClick={() => setActiveTab("welcome")}
                    className={`flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-bold transition-all relative ${
                        activeTab === "welcome"
                            ? "bg-white text-blue-600 shadow-sm border border-gray-200"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-100/60"
                    }`}
                >
                    <Package size={18} />
                    <span>بسته‌های خوش‌آمدگویی</span>
                    <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-50 text-emerald-700 font-mono font-bold">
                        {toPersianDigits(packages.length)}
                    </span>
                </button>

                <button
                    onClick={() => setActiveTab("limits")}
                    className={`flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-bold transition-all relative ${
                        activeTab === "limits"
                            ? "bg-white text-blue-600 shadow-sm border border-gray-200"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-100/60"
                    }`}
                >
                    <ShieldCheck size={18} />
                    <span>محدودیت‌های پایه سیستم</span>
                </button>
            </div>

            {/* TAB 1: SUBSCRIPTION PLANS */}
            {activeTab === "plans" && (
                <div className="space-y-6">
                    {/* Role Filter & Counter Bar */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-gray-200">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-500 ml-2 flex items-center gap-1">
                                <Filter size={14} /> فیلتر نقش:
                            </span>
                            <button
                                onClick={() => setPlanRoleFilter("ALL")}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                                    planRoleFilter === "ALL"
                                        ? "bg-blue-600 text-white"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                }`}
                            >
                                همه نقش‌ها ({toPersianDigits(plans.length)})
                            </button>
                            <button
                                onClick={() => setPlanRoleFilter("agent")}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                                    planRoleFilter === "agent"
                                        ? "bg-blue-600 text-white"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                }`}
                            >
                                مشاوران و آژانس‌ها ({toPersianDigits(plans.filter((p) => p.targetRole === "agent").length)})
                            </button>
                            <button
                                onClick={() => setPlanRoleFilter("landlord")}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                                    planRoleFilter === "landlord"
                                        ? "bg-blue-600 text-white"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                }`}
                            >
                                میزبانان اقامتگاه ({toPersianDigits(plans.filter((p) => p.targetRole === "landlord").length)})
                            </button>
                        </div>

                        <button
                            onClick={() => refetchPlans()}
                            disabled={plansLoading}
                            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 transition-colors"
                        >
                            <RefreshCcw size={14} className={plansLoading ? "animate-spin" : ""} />
                            به‌روزرسانی فهرست
                        </button>
                    </div>

                    {/* Plans Grid */}
                    {plansLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
                            ))}
                        </div>
                    ) : plansError ? (
                        <div className="p-8 bg-red-50 rounded-2xl border border-red-200 text-center text-red-700">
                            <AlertCircle size={36} className="mx-auto mb-2 text-red-500" />
                            <p className="font-bold">خطا در دریافت فهرست پلن‌های اشتراک</p>
                            <p className="text-xs mt-1 text-red-600">لطفاً اتصال اینترنت خود را بررسی و دوباره تلاش نمایید.</p>
                        </div>
                    ) : filteredPlans.length === 0 ? (
                        <div className="p-12 bg-white rounded-2xl border border-dashed border-gray-300 text-center text-gray-500">
                            <Package size={44} className="mx-auto mb-3 text-gray-300" />
                            <h3 className="font-bold text-gray-700">هیچ پلنی در این دسته یافت نشد</h3>
                            <p className="text-xs text-gray-400 mt-1">با کلیک روی «افزودن پلن جدید»، اولین پلن را تعریف کنید.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                            {filteredPlans.map((plan) => {
                                const isAgent = plan.targetRole === "agent";
                                const badgeColorInfo = AVAILABLE_COLORS.find(
                                    (c) => c.id === (plan.badgeMetadata?.color || "blue")
                                );

                                return (
                                    <div
                                        key={plan.id}
                                        className={`bg-white rounded-2xl border transition-all hover:shadow-md flex flex-col justify-between ${
                                            plan.isActive ? "border-gray-200" : "border-gray-200 bg-gray-50/60 opacity-80"
                                        }`}
                                    >
                                        <div className="p-6 space-y-4">
                                            {/* Header */}
                                            <div className="flex justify-between items-start gap-3">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span
                                                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                                                isAgent
                                                                    ? "bg-purple-50 text-purple-700 border border-purple-200"
                                                                    : "bg-blue-50 text-blue-700 border border-blue-200"
                                                            }`}
                                                        >
                                                            {isAgent ? <Building2 size={12} /> : <Home size={12} />}
                                                            {isAgent ? "مشاور / آژانس" : "میزبان اقامتگاه"}
                                                        </span>
                                                        <span className="text-[10px] font-mono text-gray-400">
                                                            ترتیب: {toPersianDigits(plan.sortOrder)}
                                                        </span>
                                                    </div>
                                                    <h3 className="text-lg font-black text-gray-900">{plan.name}</h3>
                                                </div>

                                                {/* Active Badge / Toggle */}
                                                <button
                                                    onClick={() => handleTogglePlanActive(plan)}
                                                    disabled={!canManageConfig}
                                                    title={plan.isActive ? "کلیک برای غیرفعال‌سازی" : "کلیک برای فعال‌سازی"}
                                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
                                                        plan.isActive
                                                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                                                            : "bg-gray-100 text-gray-500 border border-gray-300 hover:bg-gray-200"
                                                    }`}
                                                >
                                                    <span
                                                        className={`w-2 h-2 rounded-full ${
                                                            plan.isActive ? "bg-emerald-500 animate-pulse" : "bg-gray-400"
                                                        }`}
                                                    />
                                                    {plan.isActive ? "فعال" : "غیرفعال"}
                                                </button>
                                            </div>

                                            {/* Description */}
                                            {plan.description && (
                                                <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                                                    {plan.description}
                                                </p>
                                            )}

                                            {/* Dynamic Badge Display */}
                                            {plan.badgeName && (
                                                <div
                                                    className="flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold"
                                                    style={{
                                                        backgroundColor:
                                                            typeof plan.badgeMetadata?.bg === "string"
                                                                ? plan.badgeMetadata.bg
                                                                : badgeColorInfo?.bg || "#eff6ff",
                                                        borderColor: badgeColorInfo?.border || "#bfdbfe",
                                                        color: badgeColorInfo?.text || "#1e40af",
                                                    }}
                                                >
                                                    <DynamicBadgeIcon iconName={plan.badgeIcon} className="w-4 h-4 shrink-0" />
                                                    <span className="truncate">{plan.badgeName}</span>
                                                    {plan.badgeMetadata?.tooltip && (
                                                        <span className="text-[10px] opacity-75 mr-auto">
                                                            ({plan.badgeMetadata.tooltip})
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            {/* Price & Duration */}
                                            <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100 flex items-center justify-between">
                                                <div>
                                                    <span className="text-xs text-gray-400 block mb-0.5">تعرفه پلن</span>
                                                    <span className="text-base font-black text-gray-900">
                                                        {formatRialToToman(plan.priceIrr)}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400 block">
                                                        {formatRials(plan.priceIrr)}
                                                    </span>
                                                </div>
                                                <div className="text-left">
                                                    <span className="text-xs text-gray-400 block mb-0.5">مدت اعتبار</span>
                                                    <span className="inline-flex items-center gap-1 text-sm font-bold text-gray-700">
                                                        <Clock size={14} className="text-gray-400" />
                                                        {toPersianDigits(plan.durationDays)} روز
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Entitlements Grid */}
                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                <div className="bg-gray-50/70 p-2.5 rounded-lg border border-gray-100 flex items-center justify-between">
                                                    <span className="text-gray-500">ثبت آگهی عادی</span>
                                                    <span className="font-bold text-gray-800 font-mono">
                                                        {toPersianDigits(plan.publicationQuota)}
                                                    </span>
                                                </div>
                                                <div className="bg-gray-50/70 p-2.5 rounded-lg border border-gray-100 flex items-center justify-between">
                                                    <span className="text-gray-500">اجاره موقت/روزانه</span>
                                                    <span className="font-bold text-gray-800 font-mono">
                                                        {toPersianDigits(plan.tempRentQuota)}
                                                    </span>
                                                </div>
                                                <div className="bg-gray-50/70 p-2.5 rounded-lg border border-gray-100 flex items-center justify-between">
                                                    <span className="text-amber-600 font-medium">ارتقای فوری</span>
                                                    <span className="font-bold text-amber-700 font-mono">
                                                        {toPersianDigits(plan.urgentQuota)}
                                                    </span>
                                                </div>
                                                <div className="bg-gray-50/70 p-2.5 rounded-lg border border-gray-100 flex items-center justify-between">
                                                    <span className="text-blue-600 font-medium">نردبان آگهی</span>
                                                    <span className="font-bold text-blue-700 font-mono">
                                                        {toPersianDigits(plan.ladderQuota)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions Footer */}
                                        <div className="p-4 bg-gray-50/80 border-t border-gray-100 rounded-b-2xl flex justify-end">
                                            <button
                                                onClick={() => openEditPlanModal(plan)}
                                                disabled={!canManageConfig}
                                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                            >
                                                <Edit3 size={14} />
                                                ویرایش پلن
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* TAB 2: WELCOME PACKAGES */}
            {activeTab === "welcome" && (
                <div className="space-y-6">
                    {/* Welcome Packages Info Box */}
                    <div className="p-5 bg-blue-50 rounded-2xl border border-blue-200 flex gap-4 text-blue-900">
                        <Info size={28} className="text-blue-600 shrink-0 mt-0.5" />
                        <div className="text-xs leading-relaxed space-y-1">
                            <h4 className="font-black text-sm text-blue-950">قوانین بسته‌های خوش‌آمدگویی (Welcome Package):</h4>
                            <p>
                                • <strong>کاربران عادی (Regular User):</strong> فاقد اشتراک هستند. بسته خوش‌آمدگویی این نقش صرفاً شامل اعتبار هدیه نقدی کیف پول (Wallet Bonus) است و هزینه‌های ثبت آگهی طبق تعرفه از کیف پول کسر می‌گردد.
                            </p>
                            <p>
                                • <strong>میزبانان و مشاوران (Host & Agent):</strong> بسته ثبت‌نام شامل سهمیه‌های اولیه بدون پرداخت هزینه جهت شروع فعالیت در پلتفرم است.
                            </p>
                            <p>
                                • دریافت بسته هدیه برای هر کاربر فقط ۱ بار و به‌صورت کاملاً سیستمی و اتمیک (یکتا) صورت می‌پذیرد.
                            </p>
                        </div>
                    </div>

                    {/* Packages Grid */}
                    {packagesLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
                            ))}
                        </div>
                    ) : packagesError ? (
                        <div className="p-8 bg-red-50 rounded-2xl border border-red-200 text-center text-red-700">
                            <AlertCircle size={36} className="mx-auto mb-2 text-red-500" />
                            <p className="font-bold">خطا در دریافت فهرست بسته‌های خوش‌آمدگویی</p>
                            <p className="text-xs mt-1 text-red-600">لطفاً مجدداً تلاش کنید.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {packages.map((pkg) => {
                                const isUser = pkg.targetRole === "user";
                                const isAgent = pkg.targetRole === "agent";

                                return (
                                    <div
                                        key={pkg.id}
                                        className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between overflow-hidden"
                                    >
                                        <div className="p-6 space-y-4">
                                            {/* Role & Status */}
                                            <div className="flex justify-between items-start">
                                                <span
                                                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                                                        isUser
                                                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                                                            : isAgent
                                                            ? "bg-purple-50 text-purple-700 border border-purple-200"
                                                            : "bg-blue-50 text-blue-700 border border-blue-200"
                                                    }`}
                                                >
                                                    {isUser ? <User size={14} /> : isAgent ? <Building2 size={14} /> : <Home size={14} />}
                                                    {isUser
                                                        ? "کاربر عادی (Regular User)"
                                                        : isAgent
                                                        ? "مشاور املاک (Agent)"
                                                        : "میزبان (Landlord)"}
                                                </span>

                                                <span
                                                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                                        pkg.isActive
                                                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                                            : "bg-gray-100 text-gray-500 border border-gray-300"
                                                    }`}
                                                >
                                                    <span
                                                        className={`w-2 h-2 rounded-full ${
                                                            pkg.isActive ? "bg-emerald-500" : "bg-gray-400"
                                                        }`}
                                                    />
                                                    {pkg.isActive ? "فعال" : "غیرفعال"}
                                                </span>
                                            </div>

                                            <div>
                                                <h3 className="text-lg font-black text-gray-900">{pkg.title}</h3>
                                                <p className="text-xs text-gray-400 mt-0.5">
                                                    شناسه بسته: <span className="font-mono">{pkg.id.slice(0, 8)}...</span>
                                                </p>
                                            </div>

                                            {/* Role Details */}
                                            {isUser ? (
                                                <div className="space-y-3 pt-2">
                                                    <div className="bg-amber-50/80 p-4 rounded-xl border border-amber-200 space-y-1">
                                                        <span className="text-xs text-amber-800 font-medium block">
                                                            اعتبار هدیه مستقیم به کیف پول:
                                                        </span>
                                                        <div className="text-xl font-black text-amber-900">
                                                            {formatRialToToman(pkg.walletBonusIrr)}
                                                        </div>
                                                        <div className="text-[11px] text-amber-700 font-mono">
                                                            {formatRials(pkg.walletBonusIrr)}
                                                        </div>
                                                    </div>

                                                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs text-gray-500 flex items-center gap-2">
                                                        <ShieldCheck size={16} className="text-gray-400 shrink-0" />
                                                        <span>کاربران عادی هزینه هر آگهی را از این اعتبار پرداخت خواهند کرد.</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-3 pt-2">
                                                    {Number(pkg.walletBonusIrr) > 0 && (
                                                        <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 flex items-center justify-between text-xs">
                                                            <span className="text-emerald-800 font-medium">شارژ هدیه کیف پول:</span>
                                                            <span className="font-bold text-emerald-900">
                                                                {formatRialToToman(pkg.walletBonusIrr)}
                                                            </span>
                                                        </div>
                                                    )}

                                                    <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100 space-y-2">
                                                        <div className="flex justify-between items-center text-xs text-gray-500 pb-2 border-b border-gray-200">
                                                            <span>مدت اعتبار بسته:</span>
                                                            <span className="font-bold text-gray-800">
                                                                {toPersianDigits(pkg.durationDays)} روز
                                                            </span>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-gray-500">ثبت آگهی:</span>
                                                                <span className="font-bold text-gray-800 font-mono">
                                                                    {toPersianDigits(pkg.publicationQuota)}
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-gray-500">اجاره روزانه:</span>
                                                                <span className="font-bold text-gray-800 font-mono">
                                                                    {toPersianDigits(pkg.tempRentQuota)}
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-amber-600">فوری:</span>
                                                                <span className="font-bold text-amber-700 font-mono">
                                                                    {toPersianDigits(pkg.urgentQuota)}
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-blue-600">نردبان:</span>
                                                                <span className="font-bold text-blue-700 font-mono">
                                                                    {toPersianDigits(pkg.ladderQuota)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Action Button */}
                                        <div className="p-4 bg-gray-50/80 border-t border-gray-100 rounded-b-2xl flex justify-end">
                                            <button
                                                onClick={() => openEditPackageModal(pkg)}
                                                disabled={!canManageConfig}
                                                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                            >
                                                <Edit3 size={14} />
                                                ویرایش بسته خوش‌آمدگویی
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* TAB 3: LEGACY SYSTEM LIMITS (Preserved for compatibility) */}
            {activeTab === "limits" && (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <div className="lg:col-span-1 space-y-2">
                        <button
                            onClick={() => setSelectedLegacyPlan("FREE")}
                            className={`w-full text-right p-3.5 rounded-xl flex items-center gap-3 transition-colors ${
                                selectedLegacyPlan === "FREE"
                                    ? "bg-blue-50 text-blue-600 font-bold border border-blue-200"
                                    : "hover:bg-gray-50 text-gray-600 border border-transparent"
                            }`}
                        >
                            <ShieldCheck size={20} />
                            پلن رایگان پایه (FREE)
                        </button>
                        <button
                            onClick={() => setSelectedLegacyPlan("PRO")}
                            className={`w-full text-right p-3.5 rounded-xl flex items-center gap-3 transition-colors ${
                                selectedLegacyPlan === "PRO"
                                    ? "bg-blue-50 text-blue-600 font-bold border border-blue-200"
                                    : "hover:bg-gray-50 text-gray-600 border border-transparent"
                            }`}
                        >
                            <Zap size={20} />
                            پلن پیشرفته (PRO)
                        </button>

                        <div className="mt-8 p-4 bg-amber-50 rounded-xl border border-amber-200 flex gap-3 text-amber-700">
                            <Info size={22} className="shrink-0 mt-0.5" />
                            <p className="text-xs leading-relaxed">
                                تنظیمات این بخش مربوط به سیستم احراز محدودیت‌های پایه سرویس است.
                            </p>
                        </div>
                    </div>

                    <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
                        <div className="flex justify-between items-center border-b pb-4">
                            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <Settings size={20} className="text-blue-600" />
                                پیکربندی محدودیت‌های پلن {selectedLegacyPlan}
                            </h2>
                            <button
                                onClick={() =>
                                    updateLegacyMutation.mutate({
                                        plan: selectedLegacyPlan,
                                        data: legacyLimits[selectedLegacyPlan],
                                    })
                                }
                                disabled={!canManageConfig || updateLegacyMutation.isPending}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                                <Save size={16} />
                                ذخیره تغییرات
                            </button>
                        </div>

                        <div className="space-y-2 max-w-xs">
                            <label className="block text-sm font-medium text-gray-700">حداکثر آگهی‌های فعال</label>
                            <input
                                type="number"
                                value={legacyLimits[selectedLegacyPlan].maxActiveListings ?? 0}
                                onChange={(e) =>
                                    setLegacyLimits((prev) => ({
                                        ...prev,
                                        [selectedLegacyPlan]: {
                                            ...prev[selectedLegacyPlan],
                                            maxActiveListings: parseInt(e.target.value) || 0,
                                        },
                                    }))
                                }
                                className="w-full p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between">
                                <div>
                                    <span className="text-sm font-bold text-gray-800 block">دسترسی به تحلیل و آمار</span>
                                    <span className="text-xs text-gray-400">نمایش نمودارهای بازدید آگهی</span>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={legacyLimits[selectedLegacyPlan].hasAnalytics}
                                    onChange={(e) =>
                                        setLegacyLimits((prev) => ({
                                            ...prev,
                                            [selectedLegacyPlan]: {
                                                ...prev[selectedLegacyPlan],
                                                hasAnalytics: e.target.checked,
                                            },
                                        }))
                                    }
                                    className="w-5 h-5 accent-blue-600 rounded"
                                />
                            </div>

                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between">
                                <div>
                                    <span className="text-sm font-bold text-gray-800 block">رتبه‌بندی اولویت‌دار</span>
                                    <span className="text-xs text-gray-400">نمایش بالاتر در فهرست نتایج</span>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={legacyLimits[selectedLegacyPlan].hasPriorityRanking}
                                    onChange={(e) =>
                                        setLegacyLimits((prev) => ({
                                            ...prev,
                                            [selectedLegacyPlan]: {
                                                ...prev[selectedLegacyPlan],
                                                hasPriorityRanking: e.target.checked,
                                            },
                                        }))
                                    }
                                    className="w-5 h-5 accent-blue-600 rounded"
                                />
                            </div>

                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between">
                                <div>
                                    <span className="text-sm font-bold text-gray-800 block">نشان حرفه‌ای (Pro)</span>
                                    <span className="text-xs text-gray-400">نمایش نشان در کارت‌ها</span>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={legacyLimits[selectedLegacyPlan].hasProBadge}
                                    onChange={(e) =>
                                        setLegacyLimits((prev) => ({
                                            ...prev,
                                            [selectedLegacyPlan]: {
                                                ...prev[selectedLegacyPlan],
                                                hasProBadge: e.target.checked,
                                            },
                                        }))
                                    }
                                    className="w-5 h-5 accent-blue-600 rounded"
                                />
                            </div>

                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between">
                                <div>
                                    <span className="text-sm font-bold text-gray-800 block">امکان بوست / ارتقا</span>
                                    <span className="text-xs text-gray-400">قابلیت اعمال نردبان و ارتقا</span>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={legacyLimits[selectedLegacyPlan].canBoost}
                                    onChange={(e) =>
                                        setLegacyLimits((prev) => ({
                                            ...prev,
                                            [selectedLegacyPlan]: {
                                                ...prev[selectedLegacyPlan],
                                                canBoost: e.target.checked,
                                            },
                                        }))
                                    }
                                    className="w-5 h-5 accent-blue-600 rounded"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: CREATE / EDIT SUBSCRIPTION PLAN */}
            {isPlanModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 my-8 space-y-6">
                        {/* Modal Header */}
                        <div className="flex justify-between items-center border-b pb-4">
                            <div>
                                <h3 className="text-xl font-black text-gray-900">
                                    {editingPlanId ? "ویرایش پلن اشتراک" : "افزودن پلن اشتراک جدید"}
                                </h3>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    تنظیم سهمیه‌ها، قیمت، مدت و نشان‌های اختصاصی پلن
                                </p>
                            </div>
                            <button
                                onClick={() => setIsPlanModalOpen(false)}
                                className="p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Form */}
                        <form onSubmit={handleSavePlan} className="space-y-6">
                            {/* Base Information */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">اطلاعات پایه</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-700">نام پلن *</label>
                                        <input
                                            type="text"
                                            required
                                            value={planForm.name}
                                            onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                                            placeholder="مثال: طرح حرفه‌ای مشاور املاک"
                                            className="w-full p-3 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>

                                    {!editingPlanId && (
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-gray-700">شناسه انگلیسی (slug) *</label>
                                            <input
                                                type="text"
                                                required
                                                value={planForm.slug}
                                                onChange={(e) => setPlanForm({ ...planForm, slug: e.target.value })}
                                                placeholder="مثال: agent-pro"
                                                className="w-full p-3 rounded-xl border border-gray-300 text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                        </div>
                                    )}

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-700">نقش هدف *</label>
                                        <select
                                            value={planForm.targetRole}
                                            onChange={(e) =>
                                                setPlanForm({
                                                    ...planForm,
                                                    targetRole: e.target.value as SubscriptionTargetRole,
                                                })
                                            }
                                            className="w-full p-3 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        >
                                            <option value="agent">مشاور / آژانس املاک (Agent)</option>
                                            <option value="landlord">میزبان اقامتگاه (Landlord)</option>
                                        </select>
                                        <p className="text-[11px] text-gray-400">
                                            * طبق قوانین کسب‌وکار، کاربران عادی فاقد اشتراک هستند.
                                        </p>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-700">مدت زمان اعتبار (روز) *</label>
                                        <input
                                            type="number"
                                            required
                                            min={1}
                                            value={planForm.durationDays}
                                            onChange={(e) =>
                                                setPlanForm({ ...planForm, durationDays: parseInt(e.target.value) || 30 })
                                            }
                                            className="w-full p-3 rounded-xl border border-gray-300 text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-700">توضیحات پلن</label>
                                    <textarea
                                        rows={2}
                                        value={planForm.description}
                                        onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                                        placeholder="توضیح کوتاه درباره مزایا و ویژگی‌های این طرح..."
                                        className="w-full p-3 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            </div>

                            {/* Financial & Pricing */}
                            <div className="space-y-3 pt-2">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">تعرفه و قیمت‌گذاری</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-700">قیمت به ریال *</label>
                                        <input
                                            type="text"
                                            required
                                            value={planForm.priceIrr}
                                            onChange={(e) => setPlanForm({ ...planForm, priceIrr: e.target.value })}
                                            placeholder="مثال: 2500000"
                                            className="w-full p-3 rounded-xl border border-gray-300 text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                        <div className="flex items-center justify-between text-xs text-blue-700 bg-blue-50 p-2 rounded-lg font-bold">
                                            <span>معادل به تومان:</span>
                                            <span>{formatRialToToman(planForm.priceIrr)}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-700">ترتیب نمایش</label>
                                        <input
                                            type="number"
                                            value={planForm.sortOrder}
                                            onChange={(e) =>
                                                setPlanForm({ ...planForm, sortOrder: parseInt(e.target.value) || 0 })
                                            }
                                            className="w-full p-3 rounded-xl border border-gray-300 text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Quotas & Entitlements */}
                            <div className="space-y-3 pt-2">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                    سهمیه‌ها و ظرفیت‌های پلن (Entitlements)
                                </h4>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-gray-700">ثبت آگهی عادی</label>
                                        <input
                                            type="number"
                                            min={0}
                                            value={planForm.publicationQuota}
                                            onChange={(e) =>
                                                setPlanForm({ ...planForm, publicationQuota: parseInt(e.target.value) || 0 })
                                            }
                                            className="w-full p-2.5 rounded-xl border border-gray-300 text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-gray-700">اجاره موقت/روزانه</label>
                                        <input
                                            type="number"
                                            min={0}
                                            value={planForm.tempRentQuota}
                                            onChange={(e) =>
                                                setPlanForm({ ...planForm, tempRentQuota: parseInt(e.target.value) || 0 })
                                            }
                                            className="w-full p-2.5 rounded-xl border border-gray-300 text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-amber-700">ارتقای فوری</label>
                                        <input
                                            type="number"
                                            min={0}
                                            value={planForm.urgentQuota}
                                            onChange={(e) =>
                                                setPlanForm({ ...planForm, urgentQuota: parseInt(e.target.value) || 0 })
                                            }
                                            className="w-full p-2.5 rounded-xl border border-amber-300 text-sm font-mono focus:ring-2 focus:ring-amber-500 outline-none"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-blue-700">نردبان آگهی</label>
                                        <input
                                            type="number"
                                            min={0}
                                            value={planForm.ladderQuota}
                                            onChange={(e) =>
                                                setPlanForm({ ...planForm, ladderQuota: parseInt(e.target.value) || 0 })
                                            }
                                            className="w-full p-2.5 rounded-xl border border-blue-300 text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Dynamic Badge & Tick */}
                            <div className="space-y-3 pt-2">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                    نشان و تیک اختصاصی داینامیک
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-700">عنوان نشان / تیک</label>
                                        <input
                                            type="text"
                                            value={planForm.badgeName}
                                            onChange={(e) => setPlanForm({ ...planForm, badgeName: e.target.value })}
                                            placeholder="مثال: مشاور منتخب، سوپر میزبان طلایی"
                                            className="w-full p-3 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-700">انتخاب آیکون نشان</label>
                                        <div className="flex items-center gap-2">
                                            <select
                                                value={planForm.badgeIcon}
                                                onChange={(e) => setPlanForm({ ...planForm, badgeIcon: e.target.value })}
                                                className="w-full p-3 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                            >
                                                {AVAILABLE_BADGE_ICONS.map((icon) => (
                                                    <option key={icon.id} value={icon.id}>
                                                        {icon.label} ({icon.id})
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="p-3 bg-gray-100 rounded-xl">
                                                <DynamicBadgeIcon iconName={planForm.badgeIcon} className="w-5 h-5 text-gray-700" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-700">تم رنگی نشان</label>
                                        <div className="flex items-center gap-2">
                                            {AVAILABLE_COLORS.map((color) => (
                                                <button
                                                    key={color.id}
                                                    type="button"
                                                    onClick={() =>
                                                        setPlanForm({
                                                            ...planForm,
                                                            badgeColor: color.id,
                                                            badgeBgColor: color.bg,
                                                        })
                                                    }
                                                    className={`w-8 h-8 rounded-full border-2 transition-transform flex items-center justify-center ${
                                                        planForm.badgeColor === color.id ? "scale-110 shadow-md border-gray-800" : "border-transparent"
                                                    }`}
                                                    style={{ backgroundColor: color.bg }}
                                                    title={color.label}
                                                >
                                                    <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: color.text }} />
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-700">متن راهنمای نشان (توضیح)</label>
                                        <input
                                            type="text"
                                            value={planForm.badgeTooltip}
                                            onChange={(e) => setPlanForm({ ...planForm, badgeTooltip: e.target.value })}
                                            placeholder="توضیح کوتاه نشان..."
                                            className="w-full p-3 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Active Switch */}
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                <div>
                                    <span className="text-sm font-bold text-gray-800 block">وضعیت فعال‌سازی پلن</span>
                                    <span className="text-xs text-gray-400">
                                        در صورت غیرفعال بودن، این پلن برای کاربران نمایش داده نمی‌شود.
                                    </span>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={planForm.isActive}
                                    onChange={(e) => setPlanForm({ ...planForm, isActive: e.target.checked })}
                                    className="w-5 h-5 accent-blue-600 rounded"
                                />
                            </div>

                            {/* Buttons */}
                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <button
                                    type="button"
                                    onClick={() => setIsPlanModalOpen(false)}
                                    className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                                >
                                    انصراف
                                </button>
                                <button
                                    type="submit"
                                    disabled={createPlanMutation.isPending || updatePlanMutation.isPending}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl shadow-md hover:bg-blue-700 transition-all disabled:opacity-50"
                                >
                                    <Save size={18} />
                                    {editingPlanId ? "ذخیره تغییرات پلن" : "ایجاد و انتشار پلن"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: EDIT WELCOME PACKAGE */}
            {isPackageModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-gray-100 my-8 space-y-6">
                        <div className="flex justify-between items-center border-b pb-4">
                            <div>
                                <h3 className="text-xl font-black text-gray-900">ویرایش بسته خوش‌آمدگویی</h3>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    نقش هدف: <strong className="font-mono">{packageForm.targetRole}</strong>
                                </p>
                            </div>
                            <button
                                onClick={() => setIsPackageModalOpen(false)}
                                className="p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSavePackage} className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-700">عنوان بسته *</label>
                                <input
                                    type="text"
                                    required
                                    value={packageForm.title}
                                    onChange={(e) => setPackageForm({ ...packageForm, title: e.target.value })}
                                    className="w-full p-3 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>

                            {/* If User -> Wallet Bonus Only */}
                            {packageForm.targetRole === "user" ? (
                                <div className="space-y-3 bg-amber-50 p-4 rounded-2xl border border-amber-200">
                                    <div className="flex items-center gap-2 text-amber-800 text-xs font-bold">
                                        <Coins size={16} />
                                        اعتبار هدیه نقدی کیف پول (IRR)
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        value={packageForm.walletBonusIrr}
                                        onChange={(e) => setPackageForm({ ...packageForm, walletBonusIrr: e.target.value })}
                                        className="w-full p-3 rounded-xl border border-amber-300 text-sm font-mono focus:ring-2 focus:ring-amber-500 outline-none bg-white"
                                    />
                                    <div className="flex items-center justify-between text-xs text-amber-900 font-bold pt-1">
                                        <span>معادل به تومان:</span>
                                        <span>{formatRialToToman(packageForm.walletBonusIrr)}</span>
                                    </div>
                                    <p className="text-[11px] text-amber-700 leading-relaxed pt-1">
                                        کاربران عادی فاقد اشتراک هستند و این هدیه نقدی در اولین ثبت‌نام به‌صورت خودکار به کیف پول آن‌ها شارژ خواهد شد.
                                    </p>
                                </div>
                            ) : (
                                /* If Host / Agent -> Starter Quotas & Duration */
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-gray-700">ثبت آگهی عادی</label>
                                            <input
                                                type="number"
                                                min={0}
                                                value={packageForm.publicationQuota}
                                                onChange={(e) =>
                                                    setPackageForm({
                                                        ...packageForm,
                                                        publicationQuota: parseInt(e.target.value) || 0,
                                                    })
                                                }
                                                className="w-full p-2.5 rounded-xl border border-gray-300 text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-gray-700">اجاره روزانه</label>
                                            <input
                                                type="number"
                                                min={0}
                                                value={packageForm.tempRentQuota}
                                                onChange={(e) =>
                                                    setPackageForm({
                                                        ...packageForm,
                                                        tempRentQuota: parseInt(e.target.value) || 0,
                                                    })
                                                }
                                                className="w-full p-2.5 rounded-xl border border-gray-300 text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-amber-700">فوری</label>
                                            <input
                                                type="number"
                                                min={0}
                                                value={packageForm.urgentQuota}
                                                onChange={(e) =>
                                                    setPackageForm({
                                                        ...packageForm,
                                                        urgentQuota: parseInt(e.target.value) || 0,
                                                    })
                                                }
                                                className="w-full p-2.5 rounded-xl border border-amber-300 text-sm font-mono focus:ring-2 focus:ring-amber-500 outline-none"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-blue-700">نردبان</label>
                                            <input
                                                type="number"
                                                min={0}
                                                value={packageForm.ladderQuota}
                                                onChange={(e) =>
                                                    setPackageForm({
                                                        ...packageForm,
                                                        ladderQuota: parseInt(e.target.value) || 0,
                                                    })
                                                }
                                                className="w-full p-2.5 rounded-xl border border-blue-300 text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-gray-700">مدت اعتبار (روز)</label>
                                            <input
                                                type="number"
                                                min={1}
                                                value={packageForm.durationDays}
                                                onChange={(e) =>
                                                    setPackageForm({
                                                        ...packageForm,
                                                        durationDays: parseInt(e.target.value) || 30,
                                                    })
                                                }
                                                className="w-full p-2.5 rounded-xl border border-gray-300 text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-gray-700">هدیه نقدی ریال (اختیاری)</label>
                                            <input
                                                type="text"
                                                value={packageForm.walletBonusIrr}
                                                onChange={(e) =>
                                                    setPackageForm({
                                                        ...packageForm,
                                                        walletBonusIrr: e.target.value,
                                                    })
                                                }
                                                className="w-full p-2.5 rounded-xl border border-gray-300 text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Active Switch */}
                            <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                                <span className="text-xs font-bold text-gray-800">وضعیت فعال بودن بسته</span>
                                <input
                                    type="checkbox"
                                    checked={packageForm.isActive}
                                    onChange={(e) => setPackageForm({ ...packageForm, isActive: e.target.checked })}
                                    className="w-4 h-4 accent-blue-600 rounded"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-3 border-t">
                                <button
                                    type="button"
                                    onClick={() => setIsPackageModalOpen(false)}
                                    className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    انصراف
                                </button>
                                <button
                                    type="submit"
                                    disabled={updatePackageMutation.isPending}
                                    className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg shadow-md hover:bg-blue-700 transition-all disabled:opacity-50"
                                >
                                    <Save size={16} />
                                    ذخیره بسته
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
