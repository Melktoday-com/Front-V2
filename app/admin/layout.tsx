"use client";

import { RoleGuard } from "@/components/RoleGuard";
import { RoleName } from "@/types/access";
import {
    AlertTriangle,
    Bell,
    FileText,
    LayoutDashboard,
    Map,
    Users,
    Wallet
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

const sidebarItems = [
    { name: "داشبورد", href: "/admin", icon: LayoutDashboard },
    { name: "آگهی‌ها", href: "/admin/ads", icon: FileText },
    { name: "کاربران", href: "/admin/users", icon: Users },
    { name: "کیف پول", href: "/admin/wallet", icon: Wallet },
    { name: "مناطق جغرافیایی", href: "/admin/geo", icon: Map },
    { name: "گزارش‌ها", href: "/admin/reports", icon: AlertTriangle },
    { name: "اطلاع‌رسانی", href: "/admin/notifications", icon: Bell },
];

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    return (
        <RoleGuard roles={[RoleName.Admin, RoleName.SuperAdmin]}>
            <div className="flex min-h-screen bg-gray-50 admin-layout" dir="rtl">
                {/* Sidebar */}
                <aside className="w-64 bg-white border-l border-gray-200 sticky top-0 h-screen overflow-y-auto">
                    <div className="p-6">
                        <h1 className="text-xl font-bold text-gray-800">پنل مدیریت ملک‌تودی</h1>
                    </div>
                    <nav className="mt-2 text-right">
                        {sidebarItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-6 py-3 transition-colors ${isActive
                                        ? "bg-blue-50 text-blue-600 border-r-4 border-blue-600"
                                        : "text-gray-600 hover:bg-gray-50"
                                        }`}
                                >
                                    <Icon size={20} />
                                    <span className="font-medium">{item.name}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="flex-1 overflow-auto bg-gray-50">
                    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8">
                        <div className="flex items-center gap-4">
                            <h2 className="text-lg font-semibold text-gray-700">
                                {sidebarItems.find(i => i.href === pathname)?.name || "مدیریت"}
                            </h2>
                        </div>
                        <div className="flex items-center gap-4">
                            {/* Add Admin profile/logout if needed */}
                        </div>
                    </header>
                    <div className="p-8">
                        {children}
                    </div>
                </main>
            </div>
        </RoleGuard>
    );
}
