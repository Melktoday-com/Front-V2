"use client";

import { RoleGuard } from "@/components/RoleGuard";
import { useAuth } from "@/hooks/useAuth";
import { useConversations } from "@/hooks/useChat";
import { useUnreadNotificationsCount } from "@/hooks/useNotifications";
import { cn, toPersianDigits } from "@/lib/utils";
import { RoleName } from "@/types/access";
import {
    Bell,
    Building2,
    Heart,
    Home,
    LogIn,
    MapPin,
    MessageSquare,
    Plus,
    PlusCircle,
    Search,
    ShieldCheck,
    User,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
    { icon: Home, label: "خانه", href: "/" },
    { icon: MapPin, label: "کاوش", href: "/explore" },
    { icon: Search, label: "جستجو", href: "/ads" },
    { icon: Building2, label: "آژانس‌ها", href: "/agency" },
    { icon: Heart, label: "علاقه‌مندی‌ها", href: "/favorites" },
    { icon: User, label: "پروفایل", href: "/profile" },
];

export function Sidebar() {
    const pathname = usePathname();
    const { isLoggedIn } = useAuth();
    const { data: conversations } = useConversations();
    const { data: unreadNotificationsCount = 0 } = useUnreadNotificationsCount();

    const unreadChatCount = conversations?.reduce((sum, c) => sum + (c.unreadCount || 0), 0) ?? 0;

    if (pathname.includes("/profile/chat")) return null;
    if (pathname.startsWith("/admin")) return null;

    const isItemActive = (href: string) => {
        if (href === "/") return pathname === "/";
        return pathname.startsWith(href);
    };

    return (
        <aside className="hidden lg:flex flex-col w-64 bg-white border-l border-soft-border h-screen sticky top-0 p-6 z-30">
            <div className="mb-8 px-2 flex items-center justify-between">
                <Link href="/" className="text-2xl font-black text-brand tracking-tighter">
                    MELK<span className="text-primary">TODAY</span>
                </Link>
            </div>

            {/* Prominent Submit Ad CTA Button */}
            <Link
                href="/ads/submit"
                className="flex items-center justify-center gap-2 w-full py-3.5 px-4 rounded-2xl bg-brand text-white font-bold text-sm shadow-md hover:bg-brand/90 transition-all mb-6 group"
            >
                <PlusCircle className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                <span>ثبت رایگان آگهی</span>
            </Link>

            <nav className="flex-1 space-y-2 overflow-y-auto">
                {navItems.map((item) => {
                    const active = isItemActive(item.href);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 group",
                                active
                                    ? "bg-primary text-white shadow-lg shadow-brand/20 font-black"
                                    : "text-secondary hover:bg-soft-bg font-bold"
                            )}
                        >
                            <item.icon
                                className={cn(
                                    "w-5 h-5",
                                    active ? "text-white" : "text-secondary group-hover:text-brand"
                                )}
                            />
                            <span className="text-sm">{item.label}</span>
                        </Link>
                    );
                })}

                {isLoggedIn && (
                    <>
                        <Link
                            href="/profile/chat"
                            className={cn(
                                "flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-200 group",
                                pathname.startsWith("/profile/chat")
                                    ? "bg-primary text-white shadow-lg shadow-brand/20 font-black"
                                    : "text-secondary hover:bg-soft-bg font-bold"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <MessageSquare
                                    className={cn(
                                        "w-5 h-5",
                                        pathname.startsWith("/profile/chat")
                                            ? "text-white"
                                            : "text-secondary group-hover:text-brand"
                                    )}
                                />
                                <span className="text-sm">پیام‌ها</span>
                            </div>
                            {unreadChatCount > 0 && (
                                <span className={cn(
                                    "px-2 py-0.5 rounded-full text-xs font-black",
                                    pathname.startsWith("/profile/chat")
                                        ? "bg-white text-primary"
                                        : "bg-primary/15 text-primary"
                                )}>
                                    {toPersianDigits(unreadChatCount)}
                                </span>
                            )}
                        </Link>

                        <Link
                            href="/notifications"
                            className={cn(
                                "flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-200 group",
                                pathname.startsWith("/notifications")
                                    ? "bg-primary text-white shadow-lg shadow-brand/20 font-black"
                                    : "text-secondary hover:bg-soft-bg font-bold"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <Bell
                                    className={cn(
                                        "w-5 h-5",
                                        pathname.startsWith("/notifications")
                                            ? "text-white"
                                            : "text-secondary group-hover:text-brand"
                                    )}
                                />
                                <span className="text-sm">اعلان‌ها</span>
                            </div>
                            {unreadNotificationsCount > 0 && (
                                <span className="px-2 py-0.5 rounded-full text-xs font-black bg-red-500 text-white animate-pulse">
                                    {toPersianDigits(unreadNotificationsCount)}
                                </span>
                            )}
                        </Link>
                    </>
                )}

                <RoleGuard roles={[RoleName.Admin, RoleName.SuperAdmin]}>
                    <Link
                        href="/admin"
                        className={cn(
                            "flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 group font-bold",
                            pathname.startsWith("/admin")
                                ? "bg-primary text-white shadow-lg shadow-primary/20"
                                : "text-primary/70 hover:bg-primary/5"
                        )}
                    >
                        <ShieldCheck className="w-5 h-5" />
                        <span className="text-sm">پنل مدیریت</span>
                    </Link>
                </RoleGuard>

                {!isLoggedIn && (
                    <Link
                        href="/auth"
                        className="flex items-center gap-3 px-4 py-3 rounded-2xl text-primary hover:bg-primary/5 transition-all mt-4 border border-dashed border-primary/30 font-bold"
                    >
                        <LogIn className="w-5 h-5" />
                        <span className="text-sm">ورود به حساب</span>
                    </Link>
                )}
            </nav>

            <div className="mt-auto p-4 bg-soft-bg rounded-3xl border border-soft-border">
                <p className="text-xs text-secondary font-bold mb-2">نیاز به راهنمایی دارید؟</p>
                <Link href="/profile/chat" className="text-[11px] text-primary font-black hover:underline">
                    تماس با پشتیبانی آنلاین
                </Link>
            </div>
        </aside>
    );
}

export function MobileNav() {
    const pathname = usePathname();
    const { isLoggedIn } = useAuth();

    if (pathname.includes("/profile/chat")) return null;
    if (pathname.startsWith("/admin")) return null;

    const isHome = pathname === "/";
    const isExplore =
        (pathname.startsWith("/explore") || pathname.startsWith("/ads")) &&
        pathname !== "/ads/submit";
    const isSubmit = pathname === "/ads/submit";
    const isFavorites = pathname.startsWith("/favorites");
    const isProfile =
        pathname.startsWith("/profile") || (!isLoggedIn && pathname.startsWith("/auth"));

    return (
        <nav
            aria-label="منوی موبایل"
            className="lg:hidden fixed bottom-5 left-4 right-4 h-16 bg-white/90 backdrop-blur-xl border border-gray-100/60 rounded-full flex items-center justify-around px-3 shadow-2xl shadow-brand/10 z-50"
        >
            {/* 1. Home */}
            <Link
                href="/"
                aria-label="خانه"
                className={cn(
                    "flex flex-col items-center justify-center w-11 h-11 rounded-full transition-all",
                    isHome
                        ? "bg-primary text-white shadow-md shadow-primary/30"
                        : "text-secondary hover:text-brand"
                )}
            >
                <Home className="w-5 h-5" />
            </Link>

            {/* 2. Explore / Search */}
            <Link
                href="/explore"
                aria-label="کاوش و جستجو"
                className={cn(
                    "flex flex-col items-center justify-center w-11 h-11 rounded-full transition-all",
                    isExplore
                        ? "bg-primary text-white shadow-md shadow-primary/30"
                        : "text-secondary hover:text-brand"
                )}
            >
                <MapPin className="w-5 h-5" />
            </Link>

            {/* 3. Center Elevated Submit Ad Button */}
            <Link
                href="/ads/submit"
                aria-label="ثبت آگهی جدید"
                className={cn(
                    "flex items-center justify-center w-13 h-13 -mt-6 rounded-full transition-transform active:scale-90 border-4 border-white shadow-lg",
                    isSubmit
                        ? "bg-brand text-white shadow-brand/40"
                        : "bg-primary text-white shadow-primary/40 hover:bg-primary/90"
                )}
            >
                <Plus className="w-7 h-7 stroke-[2.5]" />
            </Link>

            {/* 4. Favorites */}
            <Link
                href="/favorites"
                aria-label="علاقه‌مندی‌ها"
                className={cn(
                    "flex flex-col items-center justify-center w-11 h-11 rounded-full transition-all",
                    isFavorites
                        ? "bg-primary text-white shadow-md shadow-primary/30"
                        : "text-secondary hover:text-brand"
                )}
            >
                <Heart className="w-5 h-5" />
            </Link>

            {/* 5. Profile */}
            <Link
                href={isLoggedIn ? "/profile" : "/auth"}
                aria-label="حساب کاربری"
                className={cn(
                    "flex flex-col items-center justify-center w-11 h-11 rounded-full transition-all",
                    isProfile
                        ? "bg-primary text-white shadow-md shadow-primary/30"
                        : "text-secondary hover:text-brand"
                )}
            >
                <User className="w-5 h-5" />
            </Link>
        </nav>
    );
}
