"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService } from "@/services/admin.service";
import { useAdminPermissions } from "@/hooks/useAdminPermissions";
import {
    Bell,
    Send,
    Users,
    Smartphone,
    Search,
    RefreshCw,
    Info,
    Calendar,
    Phone,
    ShieldCheck,
    CheckCircle2,
    Copy,
    Check,
    Eye,
    ChevronLeft,
    ChevronRight,
    RotateCcw,
    X,
    Filter,
    Layers,
    UserCheck,
    Sparkles,
    ShieldAlert,
    Building2,
    Store,
    ShoppingCart,
    KeyRound,
    Clock,
    User,
    Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
    BroadcastNotificationRequest,
    BroadcastNotificationHistoryItem,
    AdminUser,
} from "@/types/api/admin.types";
import { BroadcastAudience } from "@/types/api/enums";
import { normalizeApiError } from "@/lib/api/error-handler";
import { toPersianDigits, getPaginationItems } from "@/lib/utils";

type AudienceType = BroadcastAudience;

const AUDIENCE_OPTIONS: {
    id: AudienceType;
    label: string;
    icon: React.ComponentType<{ className?: string; size?: number }>;
    description: string;
    badgeBg: string;
    badgeText: string;
}[] = [
    {
        id: BroadcastAudience.ALL,
        label: "همه کاربران",
        icon: Users,
        description: "ارسال همگانی به تمام کاربران ثبت‌نام شده و فعال",
        badgeBg: "bg-info-subtle border-info/30",
        badgeText: "text-info",
    },
    {
        id: BroadcastAudience.SINGLE_USER,
        label: "کاربر اختصاصی",
        icon: User,
        description: "ارسال اختصاصی به یک کاربر خاص با جستجوی شماره همراه",
        badgeBg: "bg-error-subtle border-error/30",
        badgeText: "text-error",
    },
    {
        id: BroadcastAudience.AGENTS,
        label: "مشاورین املاک",
        icon: Smartphone,
        description: "ارسال اختصاصی به دفاتر املاک و مشاوران تاییدشده",
        badgeBg: "bg-indigo-50 border-indigo-200",
        badgeText: "text-indigo-700",
    },
    {
        id: BroadcastAudience.BUYERS,
        label: "خریداران",
        icon: ShoppingCart,
        description: "کاربران با جستجوها و فعالیت‌های خرید ملک",
        badgeBg: "bg-success-subtle border-success/30",
        badgeText: "text-success",
    },
    {
        id: BroadcastAudience.SELLERS,
        label: "فروشندگان",
        icon: Store,
        description: "کاربران ثبت‌کننده آگهی‌های فروش ملک",
        badgeBg: "bg-warning-subtle border-warning/30",
        badgeText: "text-warning",
    },
    {
        id: BroadcastAudience.TENANTS,
        label: "مستاجران",
        icon: KeyRound,
        description: "کاربران متقاضی رهن، اجاره و اقامت موقت",
        badgeBg: "bg-cyan-50 border-cyan-200",
        badgeText: "text-cyan-700",
    },
    {
        id: BroadcastAudience.LANDLORDS,
        label: "مالکین و میزبانان",
        icon: Building2,
        description: "مالکان آگهی‌های اجاره سالانه و میزبانان اقامتگاه",
        badgeBg: "bg-purple-50 border-purple-200",
        badgeText: "text-purple-700",
    },
];

function getAudienceConfig(audience: string) {
    const found = AUDIENCE_OPTIONS.find((opt) => opt.id === audience);
    if (found) return found;
    return {
        id: BroadcastAudience.ALL,
        label: audience || "همه کاربران",
        icon: Users,
        description: "عمومی",
        badgeBg: "bg-surface-secondary border-border-subtle",
        badgeText: "text-foreground-secondary",
    };
}

function getUserStatusBadge(status?: string) {
    const s = status?.toLowerCase();
    if (s === "active") {
        return { label: "فعال", bg: "bg-success-subtle border-success/30 text-success" };
    }
    if (s === "suspended") {
        return { label: "تعلیق شده", bg: "bg-warning-subtle border-warning/30 text-warning" };
    }
    if (s === "blocked") {
        return { label: "مسدود / بن", bg: "bg-error-subtle border-error/30 text-error" };
    }
    return { label: status || "نامشخص", bg: "bg-surface-secondary border-border-subtle text-foreground-secondary" };
}

function formatPersianDate(dateString?: string | Date | null): string {
    if (!dateString) return "نامشخص";
    try {
        const d = new Date(dateString);
        return new Intl.DateTimeFormat("fa-IR", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }).format(d);
    } catch {
        return String(dateString);
    }
}

function getRelativeTimeString(dateString?: string | Date | null): string {
    if (!dateString) return "";
    try {
        const d = new Date(dateString);
        const diffMs = Date.now() - d.getTime();
        const diffSecs = Math.floor(diffMs / 1000);
        const diffMins = Math.floor(diffSecs / 60);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffSecs < 60) return "چند لحظه پیش";
        if (diffMins < 60) return `${toPersianDigits(diffMins)} دقیقه پیش`;
        if (diffHours < 24) return `${toPersianDigits(diffHours)} ساعت پیش`;
        if (diffDays < 30) return `${toPersianDigits(diffDays)} روز پیش`;
        return formatPersianDate(dateString);
    } catch {
        return "";
    }
}

export default function AdminNotificationsPage() {
    const queryClient = useQueryClient();
    const { isSuperAdmin, hasPermission, isLoading: permissionsLoading } = useAdminPermissions();
    const canManageNotifications =
        isSuperAdmin ||
        hasPermission("notifications.manage") ||
        hasPermission("users.manage");

    // Main Tab state
    const [activeTab, setActiveTab] = useState<"history" | "send">("history");

    // Send Form State
    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");
    const [audience, setAudience] = useState<AudienceType>(BroadcastAudience.ALL);
    const [targetUserSearch, setTargetUserSearch] = useState("");
    const [selectedTargetUser, setSelectedTargetUser] = useState<AdminUser | null>(null);
    const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

    // History Filters & Pagination State
    const [searchQuery, setSearchQuery] = useState("");
    const [audienceFilter, setAudienceFilter] = useState<string>("ALL_TYPES");
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(10);

    // Modal State
    const [selectedNotification, setSelectedNotification] =
        useState<BroadcastNotificationHistoryItem | null>(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Fetch Broadcast History Query
    const {
        data: historyData,
        isLoading: isHistoryLoading,
        isFetching: isHistoryFetching,
        refetch: refetchHistory,
    } = useQuery({
        queryKey: [
            "admin-broadcast-history",
            currentPage,
            pageSize,
            searchQuery,
            audienceFilter,
        ],
        queryFn: () =>
            adminService.getBroadcastNotifications({
                page: currentPage,
                limit: pageSize,
                search: searchQuery.trim() || undefined,
                audience:
                    audienceFilter === "ALL_TYPES" ? undefined : audienceFilter,
            }),
        enabled: canManageNotifications,
        placeholderData: (prev) => prev,
    });

    // Search Users for Single User Notification Target
    const {
        data: usersData,
        isLoading: isUsersLoading,
        isFetching: isUsersFetching,
    } = useQuery({
        queryKey: ["admin-users-search", targetUserSearch],
        queryFn: () =>
            adminService.listUsers({
                search: targetUserSearch.trim(),
                page: 1,
                limit: 8,
            }),
        enabled:
            canManageNotifications &&
            audience === BroadcastAudience.SINGLE_USER &&
            targetUserSearch.trim().length >= 1,
    });

    // Send Mutation
    const broadcastMutation = useMutation({
        mutationFn: (data: BroadcastNotificationRequest) =>
            adminService.broadcastNotification(data),
        onSuccess: (res) => {
            const count = res?.recipientCount ?? 0;
            toast.success(
                `اطلاعیه با موفقیت برای ${toPersianDigits(count)} کاربر ارسال شد`
            );
            setTitle("");
            setBody("");
            setSelectedTargetUser(null);
            setTargetUserSearch("");
            // Refetch history and go to history tab
            queryClient.invalidateQueries({ queryKey: ["admin-broadcast-history"] });
            setActiveTab("history");
            setCurrentPage(1);
        },
        onError: (err: unknown) => {
            const apiErr = normalizeApiError(
                err as Parameters<typeof normalizeApiError>[0]
            );
            toast.error(apiErr || "خطا در ارسال اطلاعیه همگانی");
        },
    });

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !body.trim()) {
            toast.error("عنوان و متن اطلاعیه الزامی است");
            return;
        }
        if (audience === BroadcastAudience.SINGLE_USER && !selectedTargetUser) {
            toast.error("لطفاً یک کاربر را برای ارسال اعلان اختصاصی انتخاب کنید");
            return;
        }
        broadcastMutation.mutate({
            title: title.trim(),
            body: body.trim(),
            audience,
            userId: audience === BroadcastAudience.SINGLE_USER ? selectedTargetUser?.id : undefined,
        });
    };

    const handleCopyText = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        toast.success("متن اعلان در حافظه کپی شد");
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleReuse = (item: BroadcastNotificationHistoryItem) => {
        setTitle(item.title);
        setBody(item.body);
        if (Object.values(BroadcastAudience).includes(item.audience as BroadcastAudience)) {
            setAudience(item.audience as AudienceType);
        }
        setIsDetailsModalOpen(false);
        setActiveTab("send");
        toast.info("اطلاعات اعلان در فرم ارسال بارگذاری شد");
    };

    const totalItems = historyData?.total || 0;
    const totalPages = historyData?.totalPages || 1;
    const items = historyData?.items || [];

    // Summary calculations for KPI
    const totalReach = useMemo(() => {
        return items.reduce((acc, curr) => acc + (curr.recipientCount || 0), 0);
    }, [items]);

    const paginationItems = useMemo(() => {
        return getPaginationItems(
            Math.max(1, currentPage - 2),
            Math.min(totalPages, currentPage + 2),
            totalPages
        );
    }, [currentPage, totalPages]);

    if (!permissionsLoading && !canManageNotifications) {
        return (
            <div className="bg-surface border border-error/30 rounded-3xl p-12 text-center max-w-lg mx-auto shadow-sm space-y-4">
                <ShieldAlert className="w-16 h-16 text-error mx-auto" />
                <h2 className="text-xl font-black text-foreground">عدم دسترسی</h2>
                <p className="text-sm text-secondary leading-relaxed">
                    شما دسترسی لازم برای مدیریت و ارسال اعلان‌ها را ندارید. جهت دریافت
                    دسترسی با مدیر ارشد سیستم هماهنگ فرمایید.
                </p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-16" dir="rtl">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-black text-foreground flex items-center gap-3">
                        <span className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100 shadow-sm">
                            <Bell className="w-6 h-6" />
                        </span>
                        مدیریت و تاریخچه اطلاع‌رسانی
                    </h1>
                    <p className="text-secondary font-medium text-sm mt-1.5">
                        ارسال اعلان‌های همگانی Push Notification و مشاهده تاریخچه اعلان‌های
                        ارسال شده توسط مدیران سیستم
                    </p>
                </div>

                {/* Tab Switcher */}
                <div className="flex bg-surface-secondary/80 p-1.5 rounded-2xl border border-border-subtle/80 w-fit self-start md:self-auto">
                    <button
                        type="button"
                        onClick={() => setActiveTab("history")}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 ${
                            activeTab === "history"
                                ? "bg-surface text-indigo-700 shadow-sm shadow-slate-200"
                                : "text-foreground-secondary hover:text-foreground"
                        }`}
                    >
                        <Clock size={18} />
                        <span>تاریخچه ارسال‌ها</span>
                        {totalItems > 0 && (
                            <span className="px-2 py-0.5 text-xs rounded-full bg-indigo-100 text-indigo-700 font-black">
                                {toPersianDigits(totalItems)}
                            </span>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab("send")}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 ${
                            activeTab === "send"
                                ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                                : "text-foreground-secondary hover:text-foreground"
                        }`}
                    >
                        <Send size={18} />
                        <span>ارسال اعلان جدید</span>
                    </button>
                </div>
            </div>

            {/* TAB 1: HISTORY & LOGS */}
            {activeTab === "history" && (
                <div className="space-y-6">
                    {/* KPI Stats Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-surface border border-border-subtle/90 rounded-3xl p-6 shadow-sm flex items-center gap-4">
                            <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100">
                                <Layers size={26} />
                            </div>
                            <div>
                                <span className="text-xs font-bold text-foreground-muted block">
                                    مجموع کل اعلان‌های ثبت‌شده
                                </span>
                                <span className="text-2xl font-black text-foreground">
                                    {toPersianDigits(totalItems)}
                                    <span className="text-xs font-normal text-foreground-muted mr-1.5">
                                        اعلان
                                    </span>
                                </span>
                            </div>
                        </div>

                        <div className="bg-surface border border-border-subtle/90 rounded-3xl p-6 shadow-sm flex items-center gap-4">
                            <div className="p-3.5 bg-success-subtle text-success rounded-2xl border border-success/30">
                                <UserCheck size={26} />
                            </div>
                            <div>
                                <span className="text-xs font-bold text-foreground-muted block">
                                    دریافت‌کنندگان (در این صفحه)
                                </span>
                                <span className="text-2xl font-black text-foreground">
                                    {toPersianDigits(totalReach)}
                                    <span className="text-xs font-normal text-foreground-muted mr-1.5">
                                        کاربر
                                    </span>
                                </span>
                            </div>
                        </div>

                        <div className="bg-surface border border-border-subtle/90 rounded-3xl p-6 shadow-sm flex items-center gap-4">
                            <div className="p-3.5 bg-info-subtle text-info rounded-2xl border border-info/30">
                                <Clock size={26} />
                            </div>
                            <div>
                                <span className="text-xs font-bold text-foreground-muted block">
                                    وضعیت سیستم ارسال
                                </span>
                                <span className="text-sm font-black text-success flex items-center gap-1.5 mt-1">
                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                                    فعال و برخط
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Filter & Search Bar */}
                    <div className="bg-surface border border-border-subtle/90 rounded-3xl p-5 shadow-sm space-y-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            {/* Search Input */}
                            <div className="relative flex-1">
                                <Search
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground-muted"
                                    size={18}
                                />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    placeholder="جستجو در عنوان، متن اعلان، یا نام و شماره مدیر..."
                                    className="w-full pl-10 pr-11 py-3 rounded-2xl border border-border-subtle bg-surface-secondary/50 text-sm font-medium focus:bg-surface focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSearchQuery("");
                                            setCurrentPage(1);
                                        }}
                                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground-secondary p-1"
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </div>

                            {/* Audience Filter & Refresh */}
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2 bg-surface-secondary border border-border-subtle rounded-2xl px-3 py-1.5">
                                    <Filter size={16} className="text-foreground-muted shrink-0" />
                                    <select
                                        value={audienceFilter}
                                        onChange={(e) => {
                                            setAudienceFilter(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                        className="bg-transparent text-sm font-bold text-foreground-secondary outline-none cursor-pointer py-1.5"
                                    >
                                        <option value="ALL_TYPES">همه گروه‌های مخاطب</option>
                                        <option value="ALL">همه کاربران (عمومی)</option>
                                        <option value="SINGLE_USER">کاربر اختصاصی</option>
                                        <option value="AGENTS">مشاورین املاک</option>
                                        <option value="BUYERS">خریداران</option>
                                        <option value="SELLERS">فروشندگان</option>
                                        <option value="TENANTS">مستاجران</option>
                                        <option value="LANDLORDS">مالکین و میزبانان</option>
                                    </select>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => refetchHistory()}
                                    disabled={isHistoryFetching}
                                    title="بروزرسانی داده‌ها"
                                    className="p-3 rounded-2xl border border-border-subtle bg-surface-secondary hover:bg-surface-secondary text-foreground-secondary transition-all disabled:opacity-50"
                                >
                                    <RefreshCw
                                        size={18}
                                        className={isHistoryFetching ? "animate-spin text-indigo-600" : ""}
                                    />
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setActiveTab("send")}
                                    className="bg-indigo-600 text-white px-5 py-3 rounded-2xl text-xs font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
                                >
                                    <Send size={16} />
                                    <span>ارسال اعلان</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Notification History Table */}
                    <div className="bg-surface border border-border-subtle/90 rounded-3xl shadow-sm overflow-hidden">
                        {isHistoryLoading ? (
                            <div className="p-8 space-y-4">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <div
                                        key={i}
                                        className="h-20 bg-surface-secondary/80 rounded-2xl animate-pulse"
                                    />
                                ))}
                            </div>
                        ) : items.length === 0 ? (
                            <div className="p-16 text-center space-y-4">
                                <div className="w-16 h-16 bg-indigo-50 text-indigo-400 rounded-3xl flex items-center justify-center mx-auto border border-indigo-100">
                                    <Bell size={32} />
                                </div>
                                <h3 className="text-lg font-black text-foreground">
                                    هیچ اعلانی یافت نشد
                                </h3>
                                <p className="text-sm text-secondary max-w-sm mx-auto">
                                    {searchQuery || audienceFilter !== "ALL_TYPES"
                                        ? "با توجه به فیلترهای انتخابی شما هیچ تاریخچه‌ای پیدا نشد. عبارت جستجو را تغییر دهید."
                                        : "هنوز هیچ اعلانی توسط مدیران ارسال نشده است."}
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab("send")}
                                    className="mt-2 inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-2xl text-xs font-bold shadow-md shadow-indigo-200 hover:bg-indigo-700 transition"
                                >
                                    <Send size={16} />
                                    <span>ارسال اولین اعلان</span>
                                </button>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-right border-collapse">
                                    <thead>
                                        <tr className="border-b border-border-subtle bg-surface-secondary/70 text-xs font-black text-foreground-muted">
                                            <th className="py-4 px-6">عنوان و متن اعلان</th>
                                            <th className="py-4 px-6">مدیر ارسال‌کننده</th>
                                            <th className="py-4 px-6">گروه مخاطبان</th>
                                            <th className="py-4 px-6">تعداد گیرندگان</th>
                                            <th className="py-4 px-6">زمان ارسال</th>
                                            <th className="py-4 px-6 text-center">عملیات</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-sm">
                                        {items.map((item) => {
                                            const audienceCfg = getAudienceConfig(item.audience);
                                            const AudIcon = audienceCfg.icon;
                                            const isSuper =
                                                item.adminRole?.toLowerCase().includes("super") ||
                                                item.adminRole === "SUPER_ADMIN";

                                            return (
                                                <tr
                                                    key={item.id}
                                                    className="hover:bg-indigo-50/30 transition-colors group"
                                                >
                                                    {/* Title & Body */}
                                                    <td className="py-4 px-6 max-w-xs md:max-w-md">
                                                        <div className="space-y-1">
                                                            <div className="font-black text-foreground flex items-center gap-2">
                                                                <span className="p-1 rounded-lg bg-indigo-50 text-indigo-600">
                                                                    <Bell size={14} />
                                                                </span>
                                                                <span className="truncate">{item.title}</span>
                                                            </div>
                                                            <p className="text-xs text-secondary line-clamp-2 leading-relaxed">
                                                                {item.body}
                                                            </p>
                                                        </div>
                                                    </td>

                                                    {/* Sender / Admin */}
                                                    <td className="py-4 px-6 whitespace-nowrap">
                                                        <div className="flex items-center gap-3">
                                                            <div
                                                                className={`w-9 h-9 rounded-2xl flex items-center justify-center font-black text-xs shadow-sm ${
                                                                    isSuper
                                                                        ? "bg-purple-100 text-purple-700 border border-purple-200"
                                                                        : "bg-info-subtle text-info border border-info/30"
                                                                }`}
                                                            >
                                                                {item.adminName
                                                                    ? item.adminName.charAt(0)
                                                                    : "م"}
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-bold text-foreground text-xs">
                                                                        {item.adminName || "مدیر سیستم"}
                                                                    </span>
                                                                    <span
                                                                        className={`text-[10px] px-2 py-0.5 rounded-md font-bold flex items-center gap-1 ${
                                                                            isSuper
                                                                                ? "bg-purple-50 text-purple-700 border border-purple-200"
                                                                                : "bg-surface-secondary text-foreground-secondary border border-border-subtle"
                                                                        }`}
                                                                    >
                                                                        {isSuper ? (
                                                                            <>
                                                                                <ShieldCheck size={10} />
                                                                                سوپر ادمین
                                                                            </>
                                                                        ) : (
                                                                            "ادمین"
                                                                        )}
                                                                    </span>
                                                                </div>
                                                                {item.adminPhone && (
                                                                    <span className="text-[11px] text-foreground-muted font-medium flex items-center gap-1 mt-0.5">
                                                                        <Phone size={10} />
                                                                        {toPersianDigits(item.adminPhone)}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Audience */}
                                                    <td className="py-4 px-6 whitespace-nowrap">
                                                        <span
                                                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border ${audienceCfg.badgeBg} ${audienceCfg.badgeText}`}
                                                        >
                                                            <AudIcon size={14} />
                                                            {audienceCfg.label}
                                                        </span>
                                                    </td>

                                                    {/* Recipient Count */}
                                                    <td className="py-4 px-6 whitespace-nowrap">
                                                        <div className="flex items-center gap-1.5 text-foreground font-black">
                                                            <Users size={16} className="text-indigo-500" />
                                                            <span>
                                                                {toPersianDigits(item.recipientCount)}
                                                            </span>
                                                            <span className="text-xs font-normal text-foreground-muted">
                                                                کاربر
                                                            </span>
                                                        </div>
                                                    </td>

                                                    {/* Created At */}
                                                    <td className="py-4 px-6 whitespace-nowrap">
                                                        <div className="space-y-0.5">
                                                            <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                                                <Calendar size={12} className="text-foreground-muted" />
                                                                {formatPersianDate(item.createdAt)}
                                                            </div>
                                                            <span className="text-[11px] text-foreground-muted block pr-4">
                                                                {getRelativeTimeString(item.createdAt)}
                                                            </span>
                                                        </div>
                                                    </td>

                                                    {/* Actions */}
                                                    <td className="py-4 px-6 whitespace-nowrap text-center">
                                                        <div className="flex items-center justify-center gap-1.5">
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setSelectedNotification(item);
                                                                    setIsDetailsModalOpen(true);
                                                                }}
                                                                title="مشاهده جزئیات کامل"
                                                                className="p-2 rounded-xl text-foreground-muted hover:text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-100 transition-all"
                                                            >
                                                                <Eye size={17} />
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleCopyText(
                                                                        `${item.title}\n\n${item.body}`,
                                                                        item.id
                                                                    )
                                                                }
                                                                title="کپی متن اعلان"
                                                                className="p-2 rounded-xl text-foreground-muted hover:text-foreground hover:bg-surface-secondary border border-transparent hover:border-border-subtle transition-all"
                                                            >
                                                                {copiedId === item.id ? (
                                                                    <Check size={17} className="text-success" />
                                                                ) : (
                                                                    <Copy size={17} />
                                                                )}
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={() => handleReuse(item)}
                                                                title="ارسال مجدد این اعلان"
                                                                className="p-2 rounded-xl text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 border border-transparent hover:border-indigo-100 transition-all"
                                                            >
                                                                <RotateCcw size={17} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Pagination Bar */}
                        {totalPages > 1 && (
                            <div className="p-4 sm:p-6 border-t border-border-subtle bg-surface-secondary/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="text-xs font-bold text-foreground-muted flex items-center gap-3">
                                    <span>
                                        نمایش{" "}
                                        <span className="text-foreground font-black">
                                            {toPersianDigits((currentPage - 1) * pageSize + 1)}
                                        </span>{" "}
                                        تا{" "}
                                        <span className="text-foreground font-black">
                                            {toPersianDigits(
                                                Math.min(currentPage * pageSize, totalItems)
                                            )}
                                        </span>{" "}
                                        از مجموع{" "}
                                        <span className="text-foreground font-black">
                                            {toPersianDigits(totalItems)}
                                        </span>{" "}
                                        اعلان
                                    </span>

                                    {/* Page size selector */}
                                    <div className="flex items-center gap-1 mr-4 bg-surface border border-border-subtle rounded-xl px-2 py-1">
                                        <span className="text-[11px]">تعداد:</span>
                                        <select
                                            value={pageSize}
                                            onChange={(e) => {
                                                setPageSize(Number(e.target.value));
                                                setCurrentPage(1);
                                            }}
                                            className="bg-transparent text-xs font-bold outline-none cursor-pointer"
                                        >
                                            <option value={10}>۱۰</option>
                                            <option value={20}>۲۰</option>
                                            <option value={50}>۵۰</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1.5">
                                    {/* Previous Page */}
                                    <button
                                        type="button"
                                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="p-2.5 rounded-xl border border-border-subtle bg-surface hover:bg-surface-secondary text-foreground-secondary disabled:opacity-40 disabled:cursor-not-allowed transition"
                                    >
                                        <ChevronRight size={16} />
                                    </button>

                                    {/* Page Numbers */}
                                    {paginationItems.map((pageNumber, idx) => {
                                        if (pageNumber === "...") {
                                            return (
                                                <span
                                                    key={`dots-${idx}`}
                                                    className="px-2 text-foreground-muted text-xs font-black"
                                                >
                                                    ...
                                                </span>
                                            );
                                        }

                                        const isCurrent = pageNumber === currentPage;
                                        return (
                                            <button
                                                key={pageNumber}
                                                type="button"
                                                onClick={() => setCurrentPage(Number(pageNumber))}
                                                className={`w-9 h-9 rounded-xl text-xs font-black transition-all ${
                                                    isCurrent
                                                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                                                        : "bg-surface border border-border-subtle text-foreground-secondary hover:bg-surface-secondary"
                                                }`}
                                            >
                                                {toPersianDigits(pageNumber)}
                                            </button>
                                        );
                                    })}

                                    {/* Next Page */}
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setCurrentPage((p) => Math.min(totalPages, p + 1))
                                        }
                                        disabled={currentPage === totalPages}
                                        className="p-2.5 rounded-xl border border-border-subtle bg-surface hover:bg-surface-secondary text-foreground-secondary disabled:opacity-40 disabled:cursor-not-allowed transition"
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB 2: SEND NEW BROADCAST */}
            {activeTab === "send" && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Form: 8 cols */}
                    <div className="lg:col-span-8 space-y-6">
                        <div className="bg-surface border border-border-subtle/90 rounded-3xl shadow-sm overflow-hidden">
                            {/* Card Header Banner */}
                            <div className="bg-gradient-to-l from-indigo-600 via-indigo-700 to-blue-700 p-8 text-white relative overflow-hidden">
                                <div className="relative z-10 flex items-center justify-between">
                                    <div className="space-y-1">
                                        <h3 className="text-xl font-black">ارسال اطلاعیه همگانی مستقیم</h3>
                                        <p className="text-indigo-100 text-xs font-medium opacity-90">
                                            ارسال پیام Push به تلفن همراه و صفحه اعلان‌های درون برنامه‌ای
                                            کاربران
                                        </p>
                                    </div>
                                    <div className="bg-surface/20 p-4 rounded-2xl backdrop-blur-md">
                                        <Sparkles size={28} className="text-white" />
                                    </div>
                                </div>
                            </div>

                            <form onSubmit={handleSend} className="p-8 space-y-6">
                                {/* Audience Selection */}
                                <div className="space-y-3">
                                    <label className="text-sm font-bold text-foreground block">
                                        انتخاب گروه مخاطبان هدف
                                    </label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {AUDIENCE_OPTIONS.map((item) => {
                                            const Icon = item.icon;
                                            const isSelected = audience === item.id;
                                            return (
                                                <button
                                                    key={item.id}
                                                    type="button"
                                                    onClick={() => setAudience(item.id)}
                                                    className={`flex flex-col items-start text-right p-4 rounded-2xl border transition-all ${
                                                        isSelected
                                                            ? "bg-indigo-50/80 border-indigo-300 text-indigo-900 ring-2 ring-indigo-200 shadow-sm"
                                                            : "bg-surface border-border-subtle text-foreground-secondary hover:bg-surface-secondary"
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between w-full mb-2">
                                                        <div
                                                            className={`p-2 rounded-xl ${
                                                                isSelected
                                                                    ? "bg-indigo-600 text-white"
                                                                    : "bg-surface-secondary text-foreground-secondary"
                                                            }`}
                                                        >
                                                            <Icon size={18} />
                                                        </div>
                                                        {isSelected && (
                                                            <CheckCircle2
                                                                size={18}
                                                                className="text-indigo-600"
                                                            />
                                                        )}
                                                    </div>
                                                    <span className="text-xs font-black block">
                                                        {item.label}
                                                    </span>
                                                    <span className="text-[10px] text-foreground-muted font-medium line-clamp-1 mt-0.5">
                                                        {item.description}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Single User Target Selector */}
                                {audience === BroadcastAudience.SINGLE_USER && (
                                    <div className="p-5 bg-error-subtle/50 border border-error/30/80 rounded-2xl space-y-4 animate-in fade-in duration-200">
                                        <div className="flex items-center justify-between">
                                            <label className="text-sm font-bold text-foreground flex items-center gap-2">
                                                <User size={16} className="text-error" />
                                                <span>جستجو و انتخاب کاربر هدف</span>
                                            </label>
                                            {selectedTargetUser && (
                                                <span className="text-xs text-error font-bold bg-error-subtle/80 px-2.5 py-0.5 rounded-full">
                                                    کاربر انتخاب شد
                                                </span>
                                            )}
                                        </div>

                                        {selectedTargetUser ? (
                                            /* Selected User Card */
                                            <div className="bg-surface border border-error/30 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-11 h-11 rounded-2xl bg-error-subtle text-error flex items-center justify-center font-black text-sm border border-error/30">
                                                        {selectedTargetUser.firstName?.charAt(0) || "ک"}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-foreground text-sm">
                                                                {selectedTargetUser.firstName || selectedTargetUser.lastName
                                                                    ? `${selectedTargetUser.firstName || ""} ${selectedTargetUser.lastName || ""}`.trim()
                                                                    : "کاربر بدون نام"}
                                                            </span>
                                                            {(() => {
                                                                const badge = getUserStatusBadge(selectedTargetUser.status);
                                                                return (
                                                                    <span
                                                                        className={`text-[10px] px-2 py-0.5 rounded-md font-bold border ${badge.bg}`}
                                                                    >
                                                                        {badge.label}
                                                                    </span>
                                                                );
                                                            })()}
                                                        </div>
                                                        <div className="text-xs text-foreground-muted font-medium flex items-center gap-1.5 mt-1">
                                                            <Phone size={12} className="text-foreground-muted" />
                                                            <span dir="ltr">
                                                                {toPersianDigits(selectedTargetUser.mobileNumber)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedTargetUser(null);
                                                        setTargetUserSearch("");
                                                    }}
                                                    className="p-2 rounded-xl text-foreground-muted hover:text-error hover:bg-error-subtle border border-transparent hover:border-error/30 transition"
                                                    title="تغییر کاربر"
                                                >
                                                    <X size={18} />
                                                </button>
                                            </div>
                                        ) : (
                                            /* Search Input and Dropdown */
                                            <div className="relative">
                                                <div className="relative">
                                                    <Search
                                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground-muted"
                                                        size={18}
                                                    />
                                                    <input
                                                        type="text"
                                                        value={targetUserSearch}
                                                        onChange={(e) => {
                                                            setTargetUserSearch(e.target.value);
                                                            setIsUserDropdownOpen(true);
                                                        }}
                                                        onFocus={() => setIsUserDropdownOpen(true)}
                                                        placeholder="شماره موبایل کاربر (مثال: 0912...)، نام یا شناسه را جستجو کنید..."
                                                        className="w-full pl-10 pr-11 py-3.5 rounded-2xl border border-border-subtle bg-surface text-sm font-medium focus:ring-2 focus:ring-rose-500 outline-none transition-all"
                                                    />
                                                    {isUsersFetching && (
                                                        <Loader2
                                                            size={18}
                                                            className="absolute left-4 top-1/2 -translate-y-1/2 text-error animate-spin"
                                                        />
                                                    )}
                                                </div>

                                                {/* Dropdown Results */}
                                                {isUserDropdownOpen && targetUserSearch.trim().length >= 1 && (
                                                    <div className="absolute z-20 top-full mt-2 w-full bg-surface border border-border-subtle rounded-2xl shadow-xl max-h-60 overflow-y-auto divide-y divide-slate-100">
                                                        {isUsersLoading ? (
                                                            <div className="p-4 text-center text-xs text-foreground-muted flex items-center justify-center gap-2">
                                                                <Loader2 size={16} className="animate-spin text-error" />
                                                                <span>در حال جستجوی کاربران...</span>
                                                            </div>
                                                        ) : usersData?.items && usersData.items.length > 0 ? (
                                                            usersData.items.map((user) => {
                                                                const badge = getUserStatusBadge(user.status);
                                                                return (
                                                                    <button
                                                                        key={user.id}
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setSelectedTargetUser(user);
                                                                            setIsUserDropdownOpen(false);
                                                                        }}
                                                                        className="w-full p-3.5 flex items-center justify-between text-right hover:bg-error-subtle/50 transition-colors"
                                                                    >
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="w-8 h-8 rounded-xl bg-surface-secondary text-foreground-secondary flex items-center justify-center font-bold text-xs">
                                                                                {user.firstName?.charAt(0) || "ک"}
                                                                            </div>
                                                                            <div>
                                                                                <div className="font-bold text-xs text-foreground">
                                                                                    {user.firstName || user.lastName
                                                                                        ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
                                                                                        : "کاربر بدون نام"}
                                                                                </div>
                                                                                <div className="text-[11px] text-foreground-muted font-medium mt-0.5">
                                                                                    {toPersianDigits(user.mobileNumber)}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        <span
                                                                            className={`text-[10px] px-2 py-0.5 rounded-md font-bold border ${badge.bg}`}
                                                                        >
                                                                            {badge.label}
                                                                        </span>
                                                                    </button>
                                                                );
                                                            })
                                                        ) : (
                                                            <div className="p-4 text-center text-xs text-foreground-muted">
                                                                کاربری با مشخصات وارد شده یافت نشد
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Title Input */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-bold text-foreground">
                                            عنوان اطلاعیه
                                        </label>
                                        <span className="text-[11px] text-foreground-muted font-medium">
                                            {toPersianDigits(title.length)} / ۱۰۰ نویسه
                                        </span>
                                    </div>
                                    <input
                                        type="text"
                                        maxLength={100}
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="مثلاً: به‌روزرسانی قوانین و شرایط پلتفرم ملک‌تودی"
                                        className="w-full px-5 py-3.5 rounded-2xl border border-border-subtle outline-none focus:ring-2 focus:ring-indigo-500 bg-surface-secondary/40 focus:bg-surface transition-all font-bold text-sm"
                                    />
                                </div>

                                {/* Body Textarea */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-bold text-foreground">
                                            متن پیام
                                        </label>
                                        <span className="text-[11px] text-foreground-muted font-medium">
                                            {toPersianDigits(body.length)} / ۵۰۰ نویسه
                                        </span>
                                    </div>
                                    <textarea
                                        value={body}
                                        maxLength={500}
                                        onChange={(e) => setBody(e.target.value)}
                                        rows={6}
                                        placeholder="متن پیام اطلاعیه را بنویسید..."
                                        className="w-full px-5 py-4 rounded-2xl border border-border-subtle outline-none focus:ring-2 focus:ring-indigo-500 bg-surface-secondary/40 focus:bg-surface transition-all font-medium text-sm resize-none leading-relaxed"
                                    />
                                </div>

                                {/* Info Alert */}
                                <div className="bg-warning-subtle border border-warning/30 rounded-2xl p-4 flex gap-3 text-warning text-xs leading-relaxed font-medium">
                                    <Info className="shrink-0 mt-0.5 text-warning" size={18} />
                                    <p>
                                        این پیام بلافاصله پس از فشردن دکمه ارسال، برای تمام کاربران
                                        گروه هدف فرستاده شده و در تاریخچه ثبت خواهد شد. امکان لغو پس
                                        از ارسال وجود ندارد.
                                    </p>
                                </div>

                                {/* Submit & Cancel Buttons */}
                                <div className="flex items-center justify-between pt-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setTitle("");
                                            setBody("");
                                        }}
                                        className="px-6 py-3.5 rounded-2xl border border-border-subtle text-foreground-secondary hover:bg-surface-secondary text-xs font-bold transition"
                                    >
                                        پاک کردن فرم
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={
                                            broadcastMutation.isPending ||
                                            !title.trim() ||
                                            !body.trim()
                                        }
                                        className="bg-indigo-600 text-white px-10 py-3.5 rounded-2xl font-bold text-sm flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Send size={18} />
                                        <span>
                                            {broadcastMutation.isPending
                                                ? "در حال ارسال اطلاعیه..."
                                                : "ارسال نهایی اطلاعیه"}
                                        </span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Right Column: Live Mobile Preview (4 cols) */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-surface border border-border-subtle/90 rounded-3xl p-6 shadow-sm space-y-4 sticky top-24">
                            <div className="flex items-center gap-2 text-foreground font-bold text-sm">
                                <Smartphone size={18} className="text-indigo-600" />
                                <span>پیش‌نمایش زنده در گوشی کاربر</span>
                            </div>
                            <p className="text-xs text-secondary leading-relaxed">
                                نحوه نمایش نوتیفیکیشن در نوار اعلان گوشی همراه و پنل پیام‌های کاربر:
                            </p>

                            {/* Smartphone Card Simulator */}
                            <div className="bg-slate-900 rounded-[2.5rem] p-3 shadow-2xl border-4 border-slate-800">
                                {/* Speaker notch */}
                                <div className="w-24 h-4 bg-slate-800 rounded-full mx-auto mb-4" />

                                {/* Phone Screen */}
                                <div className="bg-surface-secondary rounded-3xl p-4 min-h-[320px] flex flex-col justify-start space-y-3">
                                    {/* Push Notification Banner */}
                                    <div className="bg-surface/95 backdrop-blur-md rounded-2xl p-4 shadow-md border border-border-subtle/60 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-5 h-5 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-[9px] font-black">
                                                    M
                                                </div>
                                                <span className="text-[11px] font-black text-foreground">
                                                    ملک‌تودی
                                                </span>
                                            </div>
                                            <span className="text-[10px] text-foreground-muted font-medium">
                                                اکنون
                                            </span>
                                        </div>

                                        <div className="space-y-1 text-right">
                                            <h4 className="text-xs font-black text-foreground line-clamp-1">
                                                {title || "عنوان اعلان شما در اینجا نمایش داده می‌شود"}
                                            </h4>
                                            <p className="text-[11px] text-foreground-secondary leading-relaxed line-clamp-3">
                                                {body ||
                                                    "متن پیام شما در قالب اعلان پوش به این صورت برای کاربران به نمایش درمی‌آید..."}
                                            </p>
                                        </div>
                                    </div>

                                    {/* In-app Notification Card Preview */}
                                    <div className="bg-surface rounded-2xl p-3.5 border border-border-subtle/70 shadow-sm space-y-1.5 mt-2">
                                        <div className="flex items-center justify-between text-[10px] text-foreground-muted">
                                            <span className="font-bold text-indigo-600">
                                                پیام سیستمی
                                            </span>
                                            <span>چند لحظه پیش</span>
                                        </div>
                                        <div className="font-bold text-xs text-foreground">
                                            {title || "عنوان پیام"}
                                        </div>
                                        <div className="text-[10px] text-foreground-muted line-clamp-2">
                                            {body || "متن پیام در پنل اعلان‌های کاربری..."}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* DETAILS MODAL */}
            {isDetailsModalOpen && selectedNotification && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div
                        className="bg-surface rounded-3xl max-w-xl w-full border border-border-subtle shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                        dir="rtl"
                    >
                        {/* Modal Header */}
                        <div className="p-6 bg-surface-secondary border-b border-border-subtle flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100">
                                    <Bell size={20} />
                                </div>
                                <div>
                                    <h3 className="font-black text-foreground text-base">
                                        جزئیات اعلان ارسالی
                                    </h3>
                                    <p className="text-xs text-foreground-muted">
                                        اطلاعات کامل فرستنده و محتوای ارسال شده
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsDetailsModalOpen(false)}
                                className="p-2 rounded-xl text-foreground-muted hover:text-foreground-secondary hover:bg-slate-200/60 transition"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-5">
                            {/* Sender Info Card */}
                            <div className="bg-surface-secondary border border-border-subtle/80 rounded-2xl p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-sm">
                                        {selectedNotification.adminName?.charAt(0) || "م"}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-foreground text-sm">
                                                {selectedNotification.adminName || "مدیر سیستم"}
                                            </span>
                                            <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                                                {selectedNotification.adminRole || "ادمین"}
                                            </span>
                                        </div>
                                        {selectedNotification.adminPhone && (
                                            <span className="text-xs text-foreground-muted font-medium">
                                                {toPersianDigits(selectedNotification.adminPhone)}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="text-left text-xs space-y-0.5">
                                    <span className="text-foreground-muted block font-medium">زمان ارسال</span>
                                    <span className="font-bold text-foreground">
                                        {formatPersianDate(selectedNotification.createdAt)}
                                    </span>
                                </div>
                            </div>

                            {/* Meta Grid */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3.5 bg-surface-secondary border border-border-subtle/70 rounded-2xl space-y-1">
                                    <span className="text-[11px] text-foreground-muted font-bold block">
                                        گروه مخاطبان
                                    </span>
                                    <span className="text-xs font-black text-foreground">
                                        {getAudienceConfig(selectedNotification.audience).label}
                                    </span>
                                </div>

                                <div className="p-3.5 bg-surface-secondary border border-border-subtle/70 rounded-2xl space-y-1">
                                    <span className="text-[11px] text-foreground-muted font-bold block">
                                        تعداد دریافت‌کنندگان
                                    </span>
                                    <span className="text-xs font-black text-foreground">
                                        {toPersianDigits(selectedNotification.recipientCount)} کاربر
                                    </span>
                                </div>
                            </div>

                            {/* Message Content */}
                            <div className="space-y-2">
                                <label className="text-xs font-black text-foreground-muted block">
                                    عنوان اعلان
                                </label>
                                <div className="p-3.5 bg-surface border border-border-subtle rounded-2xl font-bold text-sm text-foreground">
                                    {selectedNotification.title}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-foreground-muted block">
                                    متن پیام
                                </label>
                                <div className="p-4 bg-surface border border-border-subtle rounded-2xl font-medium text-sm text-foreground leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap">
                                    {selectedNotification.body}
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 bg-surface-secondary border-t border-border-subtle flex items-center justify-between gap-3">
                            <button
                                type="button"
                                onClick={() =>
                                    handleCopyText(
                                        `${selectedNotification.title}\n\n${selectedNotification.body}`,
                                        selectedNotification.id
                                    )
                                }
                                className="px-5 py-2.5 rounded-2xl border border-border-subtle bg-surface hover:bg-surface-secondary text-foreground-secondary text-xs font-bold flex items-center gap-2 transition"
                            >
                                <Copy size={16} />
                                <span>کپی متن</span>
                            </button>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => handleReuse(selectedNotification)}
                                    className="px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-2 transition shadow-md shadow-indigo-100"
                                >
                                    <RotateCcw size={16} />
                                    <span>ارسال مجدد این پیام</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
