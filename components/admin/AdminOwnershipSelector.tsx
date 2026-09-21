"use client";

import React, { useState, useEffect, useCallback } from "react";
import { adminService } from "@/services/admin.service";
import { UserLookupResponse } from "@/types/api/admin.types";
import { Building2, User, CheckCircle2, UserPlus, AlertCircle, Loader2, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AdminOwnershipData {
    isPlatform: boolean;
    phoneNumber: string;
    firstName: string;
    lastName: string;
    isUserFound?: boolean;
    foundUserName?: string;
    targetOwnerId?: string;
}

interface AdminOwnershipSelectorProps {
    value: AdminOwnershipData;
    onChange: (data: AdminOwnershipData) => void;
    themeColor?: "blue" | "emerald";
}

export function AdminOwnershipSelector({
    value,
    onChange,
    themeColor = "blue",
}: AdminOwnershipSelectorProps) {
    const [isChecking, setIsChecking] = useState<boolean>(false);
    const [lookupError, setLookupError] = useState<string | null>(null);

    const checkUser = useCallback(async (phone: string) => {
        const cleanPhone = phone.trim();
        // Trigger lookup only when a valid Iranian mobile length or format is provided
        if (cleanPhone.length < 10) {
            onChange({
                ...value,
                phoneNumber: cleanPhone,
                isUserFound: undefined,
                foundUserName: undefined,
                targetOwnerId: undefined,
            });
            return;
        }

        setIsChecking(true);
        setLookupError(null);
        try {
            const res: UserLookupResponse = await adminService.lookupUserByPhone(cleanPhone);
            if (res.found && res.user) {
                const displayName =
                    res.user.displayName ||
                    [res.user.firstName, res.user.lastName].filter(Boolean).join(" ") ||
                    res.user.mobile;
                onChange({
                    ...value,
                    phoneNumber: cleanPhone,
                    isUserFound: true,
                    foundUserName: displayName,
                    targetOwnerId: res.user.userId,
                    firstName: res.user.firstName || value.firstName,
                    lastName: res.user.lastName || value.lastName,
                });
            } else {
                onChange({
                    ...value,
                    phoneNumber: cleanPhone,
                    isUserFound: false,
                    foundUserName: undefined,
                    targetOwnerId: undefined,
                });
            }
        } catch (error) {
            console.error("Error looking up user:", error);
            setLookupError("خطا در بررسی شماره تماس کاربر");
        } finally {
            setIsChecking(false);
        }
    }, [value, onChange]);

    // Debounce lookup when phoneNumber reaches 11 chars
    useEffect(() => {
        if (value.isPlatform) return;
        const clean = value.phoneNumber.trim();
        if (clean.length === 11 && value.isUserFound === undefined) {
            const timer = setTimeout(() => {
                checkUser(clean);
            }, 400);
            return () => clearTimeout(timer);
        }
    }, [value.phoneNumber, value.isPlatform, value.isUserFound, checkUser]);

    const activeColorClasses = themeColor === "emerald"
        ? {
            border: "border-emerald-600 bg-emerald-50/50 text-emerald-950",
            badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
            ring: "focus:ring-emerald-500",
            button: "bg-emerald-600 hover:bg-emerald-700 text-white",
        }
        : {
            border: "border-blue-600 bg-blue-50/50 text-blue-950",
            badge: "bg-blue-100 text-blue-800 border-blue-200",
            ring: "focus:ring-blue-500",
            button: "bg-blue-600 hover:bg-blue-700 text-white",
        };

    return (
        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 sm:p-6 mb-8 transition-all">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                    <h3 className="text-sm sm:text-base font-black text-slate-900">
                        مالکیت و نوع ثبت آگهی (پنل مدیریت)
                    </h3>
                </div>
                <span className="text-xs font-bold text-slate-500 bg-white px-2.5 py-1 rounded-full border border-slate-200">
                    ویژه ادمین
                </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-5">
                مشخص کنید این آگهی مستقیماً متعلق به سامانه (سازمانی) است یا از جانب یک کاربر در سیستم ثبت می‌شود.
            </p>

            {/* Ownership Type Radio Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                <button
                    type="button"
                    onClick={() => {
                        onChange({
                            ...value,
                            isPlatform: true,
                        });
                    }}
                    className={cn(
                        "flex items-start gap-3 p-4 rounded-2xl border-2 text-right transition-all cursor-pointer",
                        value.isPlatform
                            ? activeColorClasses.border
                            : "border-slate-200 bg-white hover:border-slate-300 text-slate-700"
                    )}
                >
                    <div className={cn(
                        "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
                        value.isPlatform ? "bg-white shadow-xs" : "bg-slate-100 text-slate-500"
                    )}>
                        <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="font-black text-xs sm:text-sm">آگهی سازمانی (پلتفرم)</div>
                        <div className="text-[11px] text-slate-500 mt-1 leading-normal font-medium">
                            ملک یا اقامتگاه متعلق به خود سامانه بوده و به عنوان آگهی رسمی نمایش داده می‌شود.
                        </div>
                    </div>
                </button>

                <button
                    type="button"
                    onClick={() => {
                        onChange({
                            ...value,
                            isPlatform: false,
                        });
                    }}
                    className={cn(
                        "flex items-start gap-3 p-4 rounded-2xl border-2 text-right transition-all cursor-pointer",
                        !value.isPlatform
                            ? activeColorClasses.border
                            : "border-slate-200 bg-white hover:border-slate-300 text-slate-700"
                    )}
                >
                    <div className={cn(
                        "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
                        !value.isPlatform ? "bg-white shadow-xs" : "bg-slate-100 text-slate-500"
                    )}>
                        <User className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="font-black text-xs sm:text-sm">به نام کاربر دیگر</div>
                        <div className="text-[11px] text-slate-500 mt-1 leading-normal font-medium">
                            ثبت به نیابت از مالک حقیقی یا حقوقی (کاربر موجود یا کاربر جدید).
                        </div>
                    </div>
                </button>
            </div>

            {/* Target User Details (when isPlatform is false) */}
            {!value.isPlatform && (
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4 animate-in fade-in duration-200">
                    <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1.5">
                            شماره تماس مالک (موبایل) <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <input
                                type="tel"
                                dir="ltr"
                                placeholder="09123456789"
                                value={value.phoneNumber}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    onChange({
                                        ...value,
                                        phoneNumber: val,
                                        isUserFound: undefined,
                                        foundUserName: undefined,
                                    });
                                }}
                                onBlur={() => {
                                    if (value.phoneNumber.trim().length >= 10) {
                                        checkUser(value.phoneNumber);
                                    }
                                }}
                                className={cn(
                                    "w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 font-mono pl-10",
                                    activeColorClasses.ring
                                )}
                            />
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                                {isChecking ? (
                                    <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                                ) : (
                                    <Phone className="w-4 h-4 text-slate-400" />
                                )}
                            </div>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                            شماره موبایل را وارد کرده و برای بررسی دکمه استعلام را بزنید یا فیلد را ترک نمایید.
                        </p>
                    </div>

                    {/* Lookup Status Feedback */}
                    {lookupError && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                            <span>{lookupError}</span>
                        </div>
                    )}

                    {value.isUserFound === true && (
                        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                <span className="font-bold">
                                    کاربر در سیستم یافت شد: {value.foundUserName}
                                </span>
                            </div>
                            <span className="text-[11px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-medium">
                                ثبت با حساب موجود
                            </span>
                        </div>
                    )}

                    {value.isUserFound === false && (
                        <div className="space-y-4">
                            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                                <UserPlus className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                <div>
                                    <span className="font-bold block mb-0.5">کاربر جدید</span>
                                    <span>
                                        این شماره در سامانه ثبت‌نام نشده است. هنگام ثبت نهایی، حساب کاربری به صورت خودکار برای ایشان ایجاد خواهد شد. لطفاً نام و نام خانوادگی مالک را تکمیل نمایید.
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                                        نام مالک <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="مثلاً علی"
                                        value={value.firstName}
                                        onChange={(e) =>
                                            onChange({
                                                ...value,
                                                firstName: e.target.value,
                                            })
                                        }
                                        className={cn(
                                            "w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2",
                                            activeColorClasses.ring
                                        )}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                                        نام خانوادگی مالک <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="مثلاً محمدی"
                                        value={value.lastName}
                                        onChange={(e) =>
                                            onChange({
                                                ...value,
                                                lastName: e.target.value,
                                            })
                                        }
                                        className={cn(
                                            "w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2",
                                            activeColorClasses.ring
                                        )}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
