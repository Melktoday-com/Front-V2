"use client";

import { RoleGuard } from "@/components/RoleGuard";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { RoleName } from "@/types/access";
import { Building2, Heart, Home, LogIn, MapPin, Search, ShieldCheck, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
    { icon: Home, label: "خانه", href: "/" },
    { icon: MapPin, label: "کاوش", href: "/explore" },
    { icon: Search, label: "جستجو", href: "/ads" },
    { icon: Building2, label: "آژانس‌ها", href: "/agency" },
    { icon: Heart, label: "علاقه‌مندی", href: "/favorites" },
    { icon: User, label: "پروفایل", href: "/profile" },
];

export function Sidebar() {
    const pathname = usePathname();
    const { isLoggedIn } = useAuth();

    if (pathname.includes('/profile/chat')) return null;
    if (pathname.startsWith('/admin')) return null;

    return (
        <aside className="hidden lg:flex flex-col w-64 bg-white border-l border-soft-border h-screen sticky top-0 p-6">
            <div className="mb-10 px-2">
                <span className="text-2xl font-black text-brand tracking-tighter">
                    MELK<span className="text-primary">TODAY</span>
                </span>
            </div>

            <nav className="flex-1 space-y-2">
                {navItems.map((item) => {
                    const active = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 group",
                                active
                                    ? "bg-brand text-white shadow-lg shadow-brand/20"
                                    : "text-secondary hover:bg-soft-bg"
                            )}
                        >
                            <item.icon className={cn(
                                "w-5 h-5",
                                active ? "text-primary" : "text-secondary group-hover:text-brand"
                            )} />
                            <span className="font-bold text-sm">{item.label}</span>
                        </Link>
                    );
                })}

                <RoleGuard roles={[RoleName.Admin, RoleName.SuperAdmin]}>
                    <Link
                        href="/admin"
                        className={cn(
                            "flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 group",
                            pathname.startsWith("/admin")
                                ? "bg-primary text-white shadow-lg shadow-primary/20"
                                : "text-primary/70 hover:bg-primary/5"
                        )}
                    >
                        <ShieldCheck className="w-5 h-5" />
                        <span className="font-bold text-sm">پنل مدیریت</span>
                    </Link>
                </RoleGuard>

                {!isLoggedIn && (
                    <Link
                        href="/auth"
                        className="flex items-center gap-3 px-4 py-3 rounded-2xl text-primary hover:bg-primary/5 transition-all mt-4 border border-dashed border-primary/30"
                    >
                        <LogIn className="w-5 h-5" />
                        <span className="font-bold text-sm">ورود به حساب</span>
                    </Link>
                )}
            </nav>

            <div className="mt-auto p-4 bg-soft-bg rounded-3xl border border-soft-border">
                <p className="text-xs text-secondary font-bold mb-2">نیاز به کمک داری؟</p>
                <button className="text-[10px] text-primary font-black underline">با پشتیبانی تماس بگیر</button>
            </div>
        </aside>
    );
}


export function MobileNav() {
    const pathname = usePathname();
    const { isLoggedIn } = useAuth();

    if (pathname.includes('/profile/chat')) return null;
    if (pathname.startsWith('/admin')) return null;

    return (
        <div className="lg:hidden fixed bottom-6 left-6 right-6 h-18 bg-white/80 backdrop-blur-xl border border-white/20 rounded-full flex items-center justify-around px-2 shadow-2xl shadow-brand/5 z-50">
            <Link
                href="/"
                className={cn(
                    "flex items-center justify-center w-12 h-12 rounded-full transition-all",
                    pathname === "/" ? "bg-primary text-white shadow-lg shadow-primary/30" : "text-secondary"
                )}
            >
                <Home className="w-6 h-6" />
            </Link>
            <Link
                href="/explore"
                className={cn(
                    "flex items-center justify-center w-12 h-12 rounded-full transition-all",
                    pathname === "/explore" ? "bg-primary text-white shadow-lg shadow-primary/30" : "text-secondary"
                )}
            >
                <MapPin className="w-6 h-6" />
            </Link>
            <Link
                href="/agency"
                className={cn(
                    "flex items-center justify-center w-12 h-12 rounded-full transition-all",
                    pathname === "/agency" ? "bg-primary text-white shadow-lg shadow-primary/30" : "text-secondary"
                )}
            >
                <Building2 className="w-6 h-6" />
            </Link>
            <Link
                href="/favorites"
                className={cn(
                    "flex items-center justify-center w-12 h-12 rounded-full transition-all",
                    pathname === "/favorites" ? "bg-primary text-white shadow-lg shadow-primary/30" : "text-secondary"
                )}
            >
                <Heart className="w-6 h-6" />
            </Link>
            <Link
                href={isLoggedIn ? "/profile" : "/auth"}
                className={cn(
                    "flex items-center justify-center w-12 h-12 rounded-full transition-all",
                    (pathname === "/profile" || pathname === "/auth") ? "bg-primary text-white shadow-lg shadow-primary/30" : "text-secondary"
                )}
            >
                <User className="w-6 h-6" />
            </Link>
        </div>
    );
}

