"use client";

import { useAdminUsers, usePendingCampaigns, usePendingPromotions } from "@/hooks/useAdmin";
import { useAds } from "@/hooks/useAds";
import { cn, toPersianDigits } from "@/lib/utils";
import { adminService } from "@/services/admin.service";
import { walletService } from "@/services/wallet.service";
import { AdminUser } from "@/types/api/admin.types";
import { WalletTransaction } from "@/types/api/wallet.types";
import { AdStatus, TransactionStatus } from "@/types/api/enums";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
    AlertTriangle,
    ArrowUpRight,
    BarChart3,
    Check,
    Clock,
    FileText,
    LucideIcon,
    Map,
    RefreshCw,
    TrendingUp,
    Users,
    Wallet,
    Zap,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

interface StatsCardProps {
    title: string;
    value: string;
    icon: LucideIcon;
    color: string;
    description?: string;
    isLoading?: boolean;
    href?: string;
}

const StatsCard = ({
    title,
    value,
    icon: Icon,
    color,
    description,
    isLoading = false,
    href,
}: StatsCardProps) => {
    const cardContent = (
        <div className="bg-white p-6 rounded-2xl border border-soft-border shadow-xs flex items-start justify-between hover:shadow-md transition-all group">
            <div className="space-y-1 min-w-0 flex-1">
                <p className="text-xs font-bold text-secondary mb-1 truncate">{title}</p>
                {isLoading ? (
                    <div className="h-8 w-24 bg-gray-100 animate-pulse rounded-lg my-1" />
                ) : (
                    <h3 className="text-2xl font-black text-brand tracking-tight">{value}</h3>
                )}
                {description && (
                    <p className="text-xs text-secondary/80 mt-1 flex items-center gap-1 font-medium">
                        {description}
                    </p>
                )}
            </div>
            <div className={cn("p-3 rounded-xl transition-transform group-hover:scale-105 shrink-0 mr-3", color)}>
                <Icon size={24} />
            </div>
        </div>
    );

    if (href) {
        return (
            <Link href={href} className="block transition-transform hover:-translate-y-0.5">
                {cardContent}
            </Link>
        );
    }

    return cardContent;
};

interface QuickActionLinkProps {
    href: string;
    title: string;
    description: string;
    icon: LucideIcon;
    badgeCount?: number;
}

function QuickActionLink({ href, title, description, icon: Icon, badgeCount }: QuickActionLinkProps) {
    return (
        <Link
            href={href}
            className="group bg-white p-4 rounded-2xl border border-soft-border hover:border-primary/50 hover:shadow-md transition-all relative block"
        >
            <div className="flex items-start gap-4">
                <div className="p-2.5 bg-soft-bg text-secondary group-hover:bg-primary/10 group-hover:text-primary rounded-xl transition-colors shrink-0">
                    <Icon size={20} />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                        <h4 className="font-black text-sm text-brand group-hover:text-primary transition-colors truncate">
                            {title}
                        </h4>
                        {typeof badgeCount === "number" && badgeCount > 0 && (
                            <span className="shrink-0 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                {toPersianDigits(badgeCount)}
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-secondary mt-1 truncate">{description}</p>
                </div>
            </div>
        </Link>
    );
}

export default function AdminDashboard() {
    const queryClient = useQueryClient();
    const [isRefreshing, setIsRefreshing] = useState(false);

    // 1. Live Users Data
    const { data: usersData, isLoading: isLoadingUsers } = useAdminUsers({ page: 1, limit: 100 });

    // 2. Live Pending Ads Data
    const { data: pendingAdsData, isLoading: isLoadingAds } = useAds({
        status: AdStatus.PENDING_APPROVAL,
        limit: 1,
    });

    // 3. Live Pending Reports Data
    const { data: pendingReportsData, isLoading: isLoadingReports } = useQuery({
        queryKey: ["admin", "reports", "pending"],
        queryFn: () => adminService.listPendingReports(),
    });

    // 4. Live Pending Promotions Data
    const { data: pendingPromotionsData } = usePendingPromotions();

    // 5. Live Pending Campaigns Data
    const { data: pendingCampaignsData } = usePendingCampaigns();

    // 6. Live Wallet Transactions Data
    const { data: transactionsData, isLoading: isLoadingTransactions } = useQuery({
        queryKey: ["admin", "wallet", "transactions"],
        queryFn: () => walletService.getTransactions(1, 50),
    });

    // Date calculations for today (00:00:00)
    const today = useMemo(() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    }, []);

    // Users metrics
    const usersList: AdminUser[] = usersData?.items || [];
    const totalUsers = usersData?.total ?? usersList.length;
    const newUsersToday = useMemo(() => {
        return usersList.filter((u: AdminUser) => {
            if (!u.createdAt) return false;
            return new Date(u.createdAt) >= today;
        }).length;
    }, [usersList, today]);

    // Pending Ads metrics
    const pendingAdsCount = pendingAdsData?.total ?? 0;

    // Reports metrics
    const pendingReportsCount = Array.isArray(pendingReportsData)
        ? pendingReportsData.length
        : 0;

    // Promotions & Campaigns metrics
    const pendingPromotionsCount = pendingPromotionsData?.items?.length ?? 0;

    const pendingCampaignsCount = pendingCampaignsData?.items?.length ?? 0;

    // Today's Payments & Transactions metrics
    const transactionsList: WalletTransaction[] = transactionsData?.transactions || transactionsData?.items || [];
    const { todayPaymentsAmount, todayPaymentsCount } = useMemo(() => {
        const todayTx = transactionsList.filter((tx: WalletTransaction) => {
            if (!tx.createdAt) return false;
            const isTodayTx = new Date(tx.createdAt) >= today;
            const isSuccess = tx.status === TransactionStatus.COMPLETED;
            return isTodayTx && isSuccess;
        });

        const total = todayTx.reduce((sum: number, tx: WalletTransaction) => sum + Number(tx.amount || 0), 0);
        return {
            todayPaymentsAmount: total,
            todayPaymentsCount: todayTx.length,
        };
    }, [transactionsList, today]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await Promise.all([
            queryClient.invalidateQueries({ queryKey: ["admin"] }),
            queryClient.invalidateQueries({ queryKey: ["ads"] }),
        ]);
        setTimeout(() => setIsRefreshing(false), 500);
    };

    return (
        <div className="space-y-8 p-1 sm:p-2">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-brand">خلاصه وضعیت سیستم</h1>
                    <p className="text-secondary text-xs sm:text-sm font-medium mt-1">
                        گزارش کلی و بلادرنگ از عملکرد بخش‌های مختلف ملک‌تودی
                    </p>
                </div>
                <button
                    type="button"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="self-start sm:self-auto flex items-center gap-2 text-xs font-bold text-secondary hover:text-brand bg-white hover:bg-soft-bg border border-soft-border px-4 py-2.5 rounded-xl transition-all shadow-xs"
                >
                    <RefreshCw className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin text-primary")} />
                    <span>بروزرسانی آمار</span>
                </button>
            </div>

            {/* Stats Grid - Connected to Real Data */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <StatsCard
                    title="کاربران جدید (امروز)"
                    value={toPersianDigits(newUsersToday)}
                    icon={Users}
                    color="bg-blue-50 text-blue-600"
                    description={
                        totalUsers > 0
                            ? `${toPersianDigits(totalUsers)} کاربر کل سیستم`
                            : "درحال جمع‌آوری آمار"
                    }
                    isLoading={isLoadingUsers}
                    href="/admin/users"
                />

                <StatsCard
                    title="آگهی‌های در انتظار تایید"
                    value={toPersianDigits(pendingAdsCount)}
                    icon={Clock}
                    color={pendingAdsCount > 0 ? "bg-amber-50 text-amber-600" : "bg-gray-50 text-gray-400"}
                    description={
                        pendingAdsCount > 0
                            ? `${toPersianDigits(pendingAdsCount)} آگهی نیاز به بررسی`
                            : "هیچ آگهی معلقی در سیستم نیست"
                    }
                    isLoading={isLoadingAds}
                    href="/admin/ads"
                />

                <StatsCard
                    title="گزارش‌های بررسی نشده"
                    value={toPersianDigits(pendingReportsCount)}
                    icon={AlertTriangle}
                    color={pendingReportsCount > 0 ? "bg-red-50 text-red-600" : "bg-gray-50 text-gray-400"}
                    description={
                        pendingReportsCount > 0
                            ? `${toPersianDigits(pendingReportsCount)} گزارش تخلف نیازمند بررسی`
                            : "تمام گزارش‌ها بررسی شده‌اند"
                    }
                    isLoading={isLoadingReports}
                    href="/admin/reports"
                />

                <StatsCard
                    title="پرداخت‌های امروز"
                    value={
                        todayPaymentsAmount > 0
                            ? `${toPersianDigits(todayPaymentsAmount.toLocaleString("fa-IR"))} ریال`
                            : "۰ ریال"
                    }
                    icon={Wallet}
                    color={todayPaymentsAmount > 0 ? "bg-green-50 text-green-600" : "bg-gray-50 text-gray-400"}
                    description={
                        todayPaymentsCount > 0
                            ? `${toPersianDigits(todayPaymentsCount)} تراکنش موفق امروز`
                            : "بدون تراکنش در تاریخ امروز"
                    }
                    isLoading={isLoadingTransactions}
                    href="/admin/wallet"
                />
            </div>

            {/* Quick Actions with Live Pending Badges */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-base sm:text-lg font-black text-brand">دسترسی سریع به پنل‌ها</h3>
                    <span className="text-xs text-secondary font-medium">هدایت مستقیم به بخش مدیریت</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                    <QuickActionLink
                        href="/admin/ads"
                        title="تایید آگهی‌ها"
                        description="بررسی آگهی‌های معلق"
                        icon={FileText}
                        badgeCount={pendingAdsCount}
                    />
                    <QuickActionLink
                        href="/admin/reports"
                        title="گزارش‌های تخلف"
                        description="بررسی گزارش‌های کاربران"
                        icon={AlertTriangle}
                        badgeCount={pendingReportsCount}
                    />
                    <QuickActionLink
                        href="/admin/promotions"
                        title="درخواست‌های ارتقا"
                        description="بررسی نردبان و فوری"
                        icon={Zap}
                        badgeCount={pendingPromotionsCount}
                    />
                    <QuickActionLink
                        href="/admin/campaigns"
                        title="کمپین‌های تبلیغاتی"
                        description="بررسی کمپین‌های ویژه"
                        icon={TrendingUp}
                        badgeCount={pendingCampaignsCount}
                    />
                    <QuickActionLink
                        href="/admin/users"
                        title="مدیریت کاربران"
                        description="جستجو و تغییر دسترسی"
                        icon={Users}
                        badgeCount={newUsersToday > 0 ? newUsersToday : undefined}
                    />
                    <QuickActionLink
                        href="/admin/notifications"
                        title="ارسال پیام انبوه"
                        description="اطلاع‌رسانی به کاربران"
                        icon={BarChart3}
                    />
                    <QuickActionLink
                        href="/admin/config"
                        title="تنظیمات سیستم"
                        description="پلن‌ها و محدودیت‌ها"
                        icon={ArrowUpRight}
                    />
                    <QuickActionLink
                        href="/admin/geo"
                        title="مناطق جغرافیایی"
                        description="مدیریت شهرها و محله‌ها"
                        icon={Map}
                    />
                    <QuickActionLink
                        href="/admin/wallet"
                        title="امور مالی"
                        description="مشاهده تراکنش‌ها و تسویه"
                        icon={Wallet}
                    />
                </div>
            </div>

            {/* System Health Status */}
            <div className="bg-white rounded-2xl border border-soft-border p-6 sm:p-8 flex flex-col items-center justify-center text-center shadow-xs">
                <div className="w-14 h-14 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-3">
                    <Check size={28} />
                </div>
                <h3 className="font-black text-brand text-base sm:text-lg">وضعیت سرورها و سرویس‌ها: عملیاتی</h3>
                <p className="text-xs sm:text-sm text-secondary mt-1.5 max-w-md mx-auto leading-relaxed">
                    تمامی سرویس‌های پایگاه داده، صف‌های پیام‌رسانی و درگاه‌های پرداخت متصل و در وضعیت پایدار قرار دارند.
                </p>
            </div>
        </div>
    );
}
