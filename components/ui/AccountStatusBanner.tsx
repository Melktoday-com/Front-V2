"use client";

import { useUserStatus } from "@/hooks/useUserStatus";
import { AlertCircle, Bell, ChevronLeft, ShieldAlert, XCircle } from "lucide-react";
import Link from "next/link";
import React from "react";
import { cn } from "@/lib/utils";

interface AccountStatusBannerProps {
    className?: string;
    showNotificationLink?: boolean;
}

export function AccountStatusBanner({
    className,
    showNotificationLink = true,
}: AccountStatusBannerProps) {
    const { isRestricted, isBanned, isSuspended, restrictionTitle, restrictionMessage } = useUserStatus();

    if (!isRestricted) return null;

    return (
        <div
            className={cn(
                "rounded-2xl p-4 border transition-all shadow-sm",
                isBanned
                    ? "bg-rose-50 border-rose-200 text-rose-900"
                    : "bg-amber-50 border-amber-200 text-amber-900",
                className
            )}
        >
            <div className="flex items-start gap-3">
                <div
                    className={cn(
                        "p-2 rounded-xl shrink-0 mt-0.5",
                        isBanned ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"
                    )}
                >
                    {isBanned ? <XCircle className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                    <h4 className="font-black text-sm">{restrictionTitle}</h4>
                    <p className="text-xs leading-relaxed opacity-90">{restrictionMessage}</p>

                    {showNotificationLink && (
                        <div className="pt-2 flex items-center gap-3">
                            <Link
                                href="/notifications"
                                className={cn(
                                    "inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors",
                                    isBanned
                                        ? "bg-rose-600 text-white hover:bg-rose-700"
                                        : "bg-amber-600 text-white hover:bg-amber-700"
                                )}
                            >
                                <Bell className="w-3.5 h-3.5" />
                                <span>مشاهده جزئیات در اعلان‌ها</span>
                                <ChevronLeft className="w-3.5 h-3.5" />
                            </Link>

                            <Link
                                href="/profile"
                                className="text-xs font-bold underline opacity-80 hover:opacity-100"
                            >
                                ویرایش پروفایل
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
