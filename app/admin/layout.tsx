"use client";

import { AccessGuard } from "@/components/AccessGuard";
import { cn } from "@/lib/utils";
import { RoleName } from "@/types/access";
import {
    AlertTriangle,
    ArrowRight,
    BarChart3,
    Bell,
    FileText,
    Home,
    Layers,
    LayoutDashboard,
    Map,
    Settings,
    Users,
    Wallet,
    Zap
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

const sidebarItems = [
    { name: "داشبورد", href: "/admin", icon: LayoutDashboard },
    { name: "آگهی‌ها", href: "/admin/ads", icon: FileText },
    { name: "کاربران", href: "/admin/users", icon: Users },
    { name: "کیف پول", href: "/admin/wallet", icon: Wallet },
    { name: "ارتقا آگهی", href: "/admin/promotions", icon: Zap },
    { name: "کمپین‌ها", href: "/admin/campaigns", icon: BarChart3 },
    { name: "مناطق جغرافیایی", href: "/admin/geo", icon: Map },
    { name: "دسته‌بندی‌ها", href: "/admin/categories", icon: Layers },
    { name: "گزارش‌ها", href: "/admin/reports", icon: AlertTriangle },
    { name: "اطلاع‌رسانی", href: "/admin/notifications", icon: Bell },
    { name: "تنظیمات پلن‌ها", href: "/admin/config", icon: Settings },
];

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    return (
        <AccessGuard roles={[RoleName.Admin, RoleName.SuperAdmin]}>
            <div className="flex min-h-screen bg-soft-bg admin-layout" dir="rtl">
                {/* Sidebar */}
                <aside className="w-64 bg-white border-l border-soft-border sticky top-0 h-screen overflow-y-auto p-6 flex flex-col">
                    <div className="mb-10 px-2">
                        <span className="text-2xl font-black text-brand tracking-tighter">
                            MELK<span className="text-primary">TODAY</span>
                            <span className="text-[10px] block font-bold text-secondary uppercase -mt-1 tracking-widest">Admin Panel</span>
                        </span>
                    </div>

                    <nav className="flex-1 space-y-2">
                        <div className="text-[10px] font-black text-secondary/50 uppercase mb-4 pr-4 tracking-widest">منوی مدیریت</div>
                        {sidebarItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 group",
                                        isActive
                                            ? "bg-primary text-white shadow-lg shadow-brand/20"
                                            : "text-secondary hover:bg-soft-bg"
                                    )}
                                >
                                    <Icon className={cn(
                                        "w-5 h-5",
                                        isActive ? "text-white" : "text-secondary group-hover:text-brand"
                                    )} />
                                    <span className="font-bold text-sm">{item.name}</span>
                                </Link>
                            );
                        })}

                        <div className="pt-6 mt-6 border-t border-soft-border space-y-2">
                            <div className="text-[10px] font-black text-secondary/50 uppercase mb-4 pr-4 tracking-widest">پلتفرم</div>
                            <Link
                                href="/"
                                className="flex items-center gap-3 px-4 py-3 rounded-2xl text-secondary hover:bg-soft-bg transition-all duration-200 group"
                            >
                                <Home className="w-5 h-5 group-hover:text-brand" />
                                <span className="font-bold text-sm text-secondary group-hover:text-brand">صفحه اصلی سایت</span>
                            </Link>
                            <Link
                                href="/"
                                className="flex items-center gap-3 px-4 py-3 rounded-2xl text-primary hover:bg-primary/5 transition-all duration-200 group border border-dashed border-primary/30"
                            >
                                <ArrowRight className="w-5 h-5" />
                                <span className="font-bold text-sm">بازگشت به پلتفرم</span>
                            </Link>
                        </div>
                    </nav>

                    <div className="mt-10 p-4 bg-soft-bg rounded-3xl border border-soft-border">
                        <p className="text-xs text-secondary font-bold mb-2">مدیریت سیستم</p>
                        <p className="text-[10px] text-secondary/60 leading-relaxed font-medium">دسترسی شما به عنوان مدیر محدود به رعایت قوانین پلتفرم است.</p>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 overflow-auto">
                    <header className="h-16 bg-white border-b border-soft-border flex items-center justify-between px-8 sticky top-0 z-10">
                        <div className="flex items-center gap-4">
                            <h2 className="text-brand font-black text-lg">
                                {sidebarItems.find(i => i.href === pathname)?.name || "مدیریت"}
                            </h2>
                        </div>
                        <div className="flex items-center gap-4">
                            {/* Profile indicator could go here */}
                        </div>
                    </header>
                    <div className="p-8">
                        {children}
                    </div>
                </main>
            </div>
        </AccessGuard>
    );
}
