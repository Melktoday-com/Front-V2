"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface SubpageHeaderProps {
    title: React.ReactNode;
    onBack?: () => void;
    backHref?: string;
    action?: React.ReactNode;
    className?: string;
    titleClassName?: string;
}

export function SubpageHeader({
    title,
    onBack,
    backHref,
    action,
    className,
    titleClassName,
}: SubpageHeaderProps) {
    const router = useRouter();

    const handleBackClick = () => {
        if (onBack) {
            onBack();
        } else if (backHref) {
            router.push(backHref);
        } else {
            router.back();
        }
    };

    return (
        <header
            className={cn(
                "relative flex items-center justify-center min-h-[44px] mb-6 shrink-0 select-none",
                className
            )}
            dir="rtl"
        >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center">
                {backHref && !onBack ? (
                    <Link
                        href={backHref}
                        aria-label="بازگشت"
                        title="بازگشت"
                        className="p-2 -mr-2 text-secondary hover:text-brand hover:bg-soft-bg/80 rounded-xl transition-all active:scale-95 cursor-pointer shrink-0"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </Link>
                ) : (
                    <button
                        type="button"
                        onClick={handleBackClick}
                        aria-label="بازگشت"
                        title="بازگشت"
                        className="p-2 -mr-2 text-secondary hover:text-brand hover:bg-soft-bg/80 rounded-xl transition-all active:scale-95 cursor-pointer shrink-0"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>
                )}
            </div>

            <h1
                className={cn(
                    "text-base sm:text-lg font-black text-brand text-center truncate px-12",
                    titleClassName
                )}
            >
                {title}
            </h1>

            {action && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center shrink-0">
                    {action}
                </div>
            )}
        </header>
    );
}
