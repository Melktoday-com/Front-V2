"use client";

import { AccessGuard } from "@/components/AccessGuard";
import { cn } from "@/lib/utils";
import { RoleName } from "@/types/access";
import { useAdminPermissions } from "@/hooks/useAdminPermissions";
import {
    AlertTriangle,
    ArrowRight,
    BarChart3,
    Bell,
    Archive,
    Building2,
    Calendar,
    FileText,
    Globe,
    Home,
    LayoutDashboard,
    Map,
    Settings,
    ShieldAlert,
    ShieldCheck,
    Users,
    Wallet,
    Zap,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

interface SidebarItem {
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    requiredPermissions?: string[];
}

const sidebarItems: SidebarItem[] = [
    { name: "داشبورد", href: "/admin", icon: LayoutDashboard },
    { name: "مدیریت مدیران", href: "/admin/admins", icon: ShieldCheck, requiredPermissions: ["admins.manage"] },
    { name: "آگهی‌ها و دسته‌بندی‌ها", href: "/admin/ads", icon: FileText, requiredPermissions: ["ads.view", "categories.manage"] },
    { name: "مدیریت املاک و مشاوران", href: "/admin/agencies", icon: Building2, requiredPermissions: ["agencies.manage"] },
    { name: "درخواست‌های میزبانی", href: "/admin/hosts", icon: Home, requiredPermissions: ["hosts.manage"] },
    { name: "سطل زباله و آرشیو", href: "/admin/archive", icon: Archive, requiredPermissions: ["archive.manage"] },
    { name: "کاربران", href: "/admin/users", icon: Users, requiredPermissions: ["users.view", "users.manage"] },
    { name: "کیف پول", href: "/admin/wallet", icon: Wallet, requiredPermissions: ["wallet.manage"] },
    { name: "ارتقا آگهی", href: "/admin/promotions", icon: Zap, requiredPermissions: ["promotions.manage"] },
    { name: "کمپین‌ها", href: "/admin/campaigns", icon: BarChart3, requiredPermissions: ["promotions.manage"] },
    { name: "مناطق جغرافیایی", href: "/admin/geo", icon: Map, requiredPermissions: ["geo.manage"] },
    { name: "اجاره موقت و روزانه", href: "/admin/temporary-rent", icon: Calendar, requiredPermissions: ["temporary_rent.view"] },
    { name: "صفحه رسمی پلتفرم", href: "/admin/platform", icon: Globe, requiredPermissions: ["posts.view", "posts.manage"] },
    { name: "گزارش‌ها", href: "/admin/reports", icon: AlertTriangle, requiredPermissions: ["reports.manage"] },
    { name: "اطلاع‌رسانی", href: "/admin/notifications", icon: Bell, requiredPermissions: ["notifications.manage", "users.manage"] },
    { name: "تنظیمات پلن‌ها", href: "/admin/config", icon: Settings, requiredPermissions: ["config.manage"] },
];

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const { isSuperAdmin, hasAnyPermission, isLoading } = useAdminPermissions();

    const visibleSidebarItems = sidebarItems.filter((item) => {
        if (!item.requiredPermissions || item.requiredPermissions.length === 0) return true;
        if (isSuperAdmin) return true;
        return hasAnyPermission(item.requiredPermissions);
    });

    const currentItem = sidebarItems.find(
        (item) => item.href === pathname || (item.href !== "/admin" && pathname.startsWith(item.href))
    );
    const isBlocked =
        !isLoading &&
        currentItem?.requiredPermissions &&
        !isSuperAdmin &&
        !hasAnyPermission(currentItem.requiredPermissions);

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
                        {visibleSidebarItems.map((item) => {
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
                    {isBlocked ? (
                        <div className="p-8 md:p-16 flex items-center justify-center min-h-[60vh]">
                            <div className="bg-white border border-red-200 rounded-3xl p-8 max-w-md w-full text-center shadow-sm space-y-4">
                                <ShieldAlert className="w-16 h-16 text-red-500 mx-auto" />
                                <h2 className="text-xl font-black text-slate-800">عدم دسترسی به این بخش</h2>
                                <p className="text-sm text-secondary leading-relaxed">
                                    حساب کاربری شما دسترسی لازم برای مشاهده یا مدیریت این بخش را ندارد. در صورت نیاز با مدیر ارشد هماهنگ نمایید.
                                </p>
                                <div className="pt-2">
                                    <Link
                                        href="/admin"
                                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl text-xs font-bold shadow-lg shadow-brand/20 hover:bg-primary/90 transition"
                                    >
                                        <span>بازگشت به داشبورد</span>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="p-8">
                            {children}
                        </div>
                    )}
                </main>
            </div>
        </AccessGuard>
    );
}
