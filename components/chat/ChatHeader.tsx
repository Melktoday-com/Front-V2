"use client";

import { cn } from "@/lib/utils";
import { Home, LayoutGrid, MapPin, Search, User, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export function ChatHeader() {
    const pathname = usePathname();
    const router = useRouter();

    const navItems = [
        { icon: Home, label: "خانه", href: "/" },
        { icon: Search, label: "آگهی‌ها", href: "/ads" },
        { icon: MapPin, label: "کاوش", href: "/explore" },
        { icon: User, label: "پروفایل", href: "/profile" },
    ];

    return (
        <header className="h-16 md:h-18 bg-white border-b border-soft-border flex items-center justify-between px-4 md:px-8 shrink-0 z-70 sticky top-0" dir="rtl">
            <div className="flex items-center gap-4 md:gap-10">
                <Link href="/" className="flex items-center gap-2">
                    <div className="w-9 h-9 bg-brand rounded-xl flex items-center justify-center shadow-lg shadow-brand/20">
                        <LayoutGrid className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-xl font-black text-brand tracking-tighter hidden xs:block">
                        MELK<span className="text-primary">TODAY</span>
                    </span>
                </Link>

                <nav className="flex items-center gap-1 md:gap-3">
                    {navItems.map((item) => {
                        const active = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200 group",
                                    active
                                        ? "bg-soft-bg text-brand"
                                        : "text-secondary hover:text-brand hover:bg-soft-bg/50"
                                )}
                            >
                                <item.icon className={cn(
                                    "w-4 h-4 md:w-5 h-5 transition-colors",
                                    active ? "text-primary" : "text-secondary group-hover:text-primary"
                                )} />
                                <span className={cn(
                                    "font-bold text-sm hidden md:block",
                                    active ? "text-brand" : "text-secondary group-hover:text-brand"
                                )}>
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}
                </nav>
            </div>

            <div className="flex items-center gap-3">
                <button
                    onClick={() => router.push('/profile')}
                    className="flex items-center gap-2 px-4 py-2 bg-soft-bg rounded-xl text-secondary hover:text-brand transition-all border border-soft-border group"
                >
                    <span className="text-xs md:text-sm font-bold">خروج از چت</span>
                    <X className="w-5 h-5 text-secondary group-hover:text-brand" />
                </button>
            </div>
        </header>
    );
}
