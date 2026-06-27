"use client";

import {
    AlertTriangle,
    Clock,
    LucideIcon,
    TrendingUp,
    Users,
    Wallet
} from "lucide-react";

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

            {/* Recent Activities Section (Placeholders) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                        <h3 className="font-semibold text-gray-700">آخرین آگهی‌های منتظر تایید</h3>
                        <button className="text-sm text-blue-600 hover:underline">مشاهده همه</button>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gray-200 rounded-md"></div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-800">آپارتمان ۷۵ متری - سعادت آباد</p>
                                        <p className="text-xs text-gray-500">توسط: علی محمدی • ۲ ساعت پیش</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button className="p-1 px-3 text-xs bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors">تایید</button>
                                    <button className="p-1 px-3 text-xs bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors">رد</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                        <h3 className="font-semibold text-gray-700">گزارش‌های اخیر تخلف</h3>
                        <button className="text-sm text-blue-600 hover:underline">مشاهده همه</button>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
                                        <AlertTriangle size={16} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-800">محتوای نامناسب در آگهی</p>
                                        <p className="text-xs text-gray-500">شناسه آگهی: #۱۲۳۴۵ • ۴ ساعت پیش</p>
                                    </div>
                                </div>
                                <button className="p-1 px-3 text-xs border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50">بررسی</button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
