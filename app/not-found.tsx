"use client";

import { Building2, Compass, Home, Plus, Search, Undo2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NotFound() {
    const router = useRouter();

    return (
        <div className="min-h-[85vh] flex flex-col items-center justify-center p-6 text-center" dir="rtl">
            {/* Visual Icon */}
            <div className="relative mb-8">
                <div className="w-32 h-32 rounded-3xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner">
                    <Building2 className="w-16 h-16 text-primary" />
                </div>
                <div className="absolute -bottom-2 -left-2 bg-brand text-white px-3 py-1 rounded-full text-xs font-black shadow-md">
                    ۴۰۴
                </div>
            </div>

            {/* Typography */}
            <h1 className="text-2xl sm:text-3xl font-black text-brand mb-3">
                صفحه‌ای که به دنبال آن بودید پیدا نشد!
            </h1>
            <p className="text-secondary text-sm sm:text-base max-w-md leading-relaxed mb-8">
                ممکن است آدرس صفحه تغییر کرده باشد یا آگهی مورد نظر منقضی یا حذف شده باشد.
            </p>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center justify-center gap-3 w-full max-w-md">
                <button
                    onClick={() => router.back()}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl border border-soft-border bg-white text-brand font-bold text-sm hover:bg-soft-bg transition-colors shadow-xs"
                >
                    <Undo2 className="w-4 h-4" />
                    <span>صفحه قبلی</span>
                </button>

                <Link
                    href="/"
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-primary text-white font-black text-sm hover:bg-primary/90 transition-colors shadow-md shadow-primary/20"
                >
                    <Home className="w-4 h-4" />
                    <span>صفحه اصلی</span>
                </Link>

                <Link
                    href="/ads"
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-soft-bg text-brand font-bold text-sm hover:bg-soft-border transition-colors border border-soft-border"
                >
                    <Search className="w-4 h-4" />
                    <span>جستجوی املاک</span>
                </Link>
            </div>

            {/* Quick Links Section */}
            <div className="mt-12 pt-8 border-t border-soft-border/80 w-full max-w-lg flex flex-wrap items-center justify-around gap-4 text-xs font-bold text-secondary">
                <Link href="/temporary-rent" className="hover:text-primary transition-colors flex items-center gap-1.5">
                    <Compass className="w-4 h-4" />
                    <span>اجاره روزانه و ویلا</span>
                </Link>
                <Link href="/agency" className="hover:text-primary transition-colors flex items-center gap-1.5">
                    <Building2 className="w-4 h-4" />
                    <span>آژانس‌های املاک</span>
                </Link>
                <Link href="/ads/submit" className="text-primary hover:underline flex items-center gap-1.5 font-black">
                    <Plus className="w-4 h-4" />
                    <span>ثبت رایگان آگهی</span>
                </Link>
            </div>
        </div>
    );
}
