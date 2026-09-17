"use client";

import { AlertOctagon, Home, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service if configured
        console.error("Melktoday App Error:", error);
    }, [error]);

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center" dir="rtl">
            <div className="w-24 h-24 rounded-3xl bg-error/10 flex items-center justify-center border border-error/20 mb-6 shadow-inner">
                <AlertOctagon className="w-12 h-12 text-error" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-brand mb-3">
                متأسفانه مشکلی پیش آمده است!
            </h1>
            <p className="text-secondary text-sm sm:text-base max-w-md leading-relaxed mb-6">
                در پردازش این درخواست خطایی رخ داد. لطفاً مجدداً تلاش کنید یا به صفحه اصلی بازگردید.
            </p>

            {error?.digest && (
                <div className="mb-8 px-4 py-2 bg-soft-bg rounded-xl border border-soft-border text-[11px] font-mono text-secondary">
                    کد خطا: {error.digest}
                </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-3 w-full max-w-xs">
                <button
                    onClick={() => reset()}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-primary text-white font-black text-sm hover:bg-primary/90 transition-colors shadow-md shadow-primary/20"
                >
                    <RotateCcw className="w-4 h-4" />
                    <span>تلاش مجدد</span>
                </button>

                <Link
                    href="/"
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-soft-bg text-brand font-bold text-sm hover:bg-soft-border transition-colors border border-soft-border"
                >
                    <Home className="w-4 h-4" />
                    <span>صفحه اصلی</span>
                </Link>
            </div>
        </div>
    );
}
