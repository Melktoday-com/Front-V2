"use client";

import {
    AlertTriangle,
    Clock,
    LucideIcon,
    TrendingUp,
    Users,
    Wallet,
    Zap,
    BarChart3,
    ArrowUpRight,
    Check,
    FileText,
    Map
} from "lucide-react";
import Link from "next/link";

interface StatsCardProps {
    title: string;
    value: string;
    icon: LucideIcon;
    color: string;
    description?: string;
}

const StatsCard = ({ title, value, icon: Icon, color, description }: StatsCardProps) => (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-start justify-between">
        <div>
            <p className="text-sm text-gray-500 mb-1">{title}</p>
            <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
            {description && <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                <TrendingUp size={12} />
                {description}
            </p>}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
            <Icon size={24} />
        </div>
    </div>
);

function QuickActionLink({ href, title, description, icon: Icon }: any) {
    return (
        <Link href={href} className="group bg-white p-4 rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all">
            <div className="flex items-start gap-4">
                <div className="p-2 bg-gray-50 text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-600 rounded-lg transition-colors">
                    <Icon size={20} />
                </div>
                <div>
                    <h4 className="font-bold text-sm text-gray-800 group-hover:text-blue-600 transition-colors">{title}</h4>
                    <p className="text-xs text-gray-500 mt-1">{description}</p>
                </div>
            </div>
        </Link>
    );
}

export default function AdminDashboard() {
    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-800">خلاصه وضعیت سیستم</h1>
                <p className="text-gray-500 mt-1">گزارش کلی از عملکرد بخش‌های مختلف ملک‌تودی</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                    title="کاربران جدید (امروز)"
                    value="۴۸"
                    icon={Users}
                    color="bg-blue-100 text-blue-600"
                    description="۱۲٪ افزایش نسبت به دیروز"
                />
                <StatsCard
                    title="آگهی‌های در انتظار تایید"
                    value="۱۵"
                    icon={Clock}
                    color="bg-amber-100 text-amber-600"
                />
                <StatsCard
                    title="گزارش‌های بررسی نشده"
                    value="۷"
                    icon={AlertTriangle}
                    color="bg-red-100 text-red-600"
                />
                <StatsCard
                    title="پرداخت‌های امروز"
                    value="۱۲,۴۰۰,۰۰۰ ریال"
                    icon={Wallet}
                    color="bg-green-100 text-green-600"
                    description="۸٪ افزایش"
                />
            </div>

            {/* Quick Actions */}
            <div className="space-y-6">
                <h3 className="text-lg font-bold text-gray-800">دسترسی سریع به پنل‌ها</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                    <QuickActionLink href="/admin/ads" title="تایید آگهی‌ها" description="بررسی آگهی‌های معلق" icon={FileText} />
                    <QuickActionLink href="/admin/reports" title="گزارش‌های تخلف" description="بررسی گزارش‌های کاربران" icon={AlertTriangle} />
                    <QuickActionLink href="/admin/promotions" title="درخواست‌های ارتقا" description="بررسی نردبان و فوری" icon={Zap} />
                    <QuickActionLink href="/admin/users" title="مدیریت کاربران" description="جستجو و تغییر دسترسی" icon={Users} />
                    <QuickActionLink href="/admin/notifications" title="ارسال پیام انبوه" description="اطلاع‌رسانی به کاربران" icon={BarChart3} />
                    <QuickActionLink href="/admin/config" title="تنظیمات سیستم" description="پلن‌ها و محدودیت‌ها" icon={ArrowUpRight} />
                    <QuickActionLink href="/admin/geo" title="مناطق جغرافیایی" description="مدیریت شهرها و محله‌ها" icon={Map} />
                    <QuickActionLink href="/admin/wallet" title="امور مالی" description="مشاهده تراکنش‌ها و تسویه" icon={Wallet} />
                </div>
            </div>

            {/* System Health / Placeholder for Dynamic activities */}
            <div className="bg-white rounded-xl border border-gray-200 p-8 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-4">
                    <Check size={32} />
                </div>
                <h3 className="font-bold text-gray-800 text-lg">وضعیت سیستم: سالم</h3>
                <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
                    تمامی سرویس‌های زیرمجموعه از جمله پایگاه داده، سیستم پیامک و درگاه پرداخت در وضعیت عملیاتی قرار دارند.
                </p>
            </div>
        </div>
    );
}
