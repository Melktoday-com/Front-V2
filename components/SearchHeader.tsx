"use client";

import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { Bell, MapPin, Search, User } from "lucide-react";
import Link from "next/link";

export function SearchHeader() {
    const { isLoggedIn } = useAuth();

    return (
        <div className="space-y-6 lg:space-y-10">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 bg-soft-bg px-4 py-2 rounded-[20px] border border-soft-border">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span className="text-brand font-bold text-xs">تهران، سعادت آباد</span>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="secondary" size="icon" className="rounded-full w-10 h-10 transition-transform hover:scale-105">
                        <Search className="w-5 h-5 text-brand lg:hidden" />
                        <Bell className="w-5 h-5 text-brand" />
                    </Button>
                    <div className="flex items-center gap-3">
                        {isLoggedIn ? (
                            <Link href="/profile" className="w-10 h-10 rounded-full bg-soft-bg border border-soft-border flex items-center justify-center overflow-hidden transition-all hover:border-primary">
                                <User className="w-5 h-5 text-brand" />
                            </Link>
                        ) : (
                            <Link href="/auth">
                                <Button size="sm" className="hidden lg:flex rounded-full h-10 px-6">ورود | ثبت نام</Button>
                                <div className="lg:hidden w-10 h-10 rounded-full bg-soft-bg border border-soft-border flex items-center justify-center">
                                    <User className="w-5 h-5 text-brand" />
                                </div>
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            <div className="space-y-4 lg:space-y-6">
                <h1 className="text-brand text-2xl lg:text-4xl font-black leading-tight max-w-2xl">
                    به دنبال بهترین محل
                    <br />
                    برای زندگی هستی؟
                </h1>
                <div className="relative group max-w-xl">
                    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                        <Search className="w-5 h-5 text-secondary group-focus-within:text-primary transition-colors" />
                    </div>
                    <input
                        type="text"
                        placeholder="جستجوی خانه، آپارتمان و..."
                        className="w-full bg-soft-bg border-none rounded-[20px] py-4 pr-12 pl-4 text-sm font-bold text-brand focus:ring-2 focus:ring-primary/20 placeholder:text-secondary-300 outline-none transition-all shadow-sm group-hover:shadow-md"
                    />
                </div>
            </div>
        </div>
    );
}

