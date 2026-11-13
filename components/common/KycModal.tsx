"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { userService } from "@/services/user.service";
import { CitizenType, ForeignIdType, KYCStatus } from "@/types/api/enums";
import { cn, toPersianDigits, toEnglishDigits, toOnlyDigits } from "@/lib/utils";
import { normalizeApiError } from "@/lib/api/error-handler";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
    ShieldCheck,
    User,
    Calendar,
    CreditCard,
    ArrowRight,
    ArrowLeft,
    X,
    Loader2,
    Globe,
    FileText,
} from "lucide-react";

// 12 Jalali Months
export const JALALI_MONTHS = [
    { id: 1, name: "فروردین", days: 31 },
    { id: 2, name: "اردیبهشت", days: 31 },
    { id: 3, name: "خرداد", days: 31 },
    { id: 4, name: "تیر", days: 31 },
    { id: 5, name: "مرداد", days: 31 },
    { id: 6, name: "شهریور", days: 31 },
    { id: 7, name: "مهر", days: 30 },
    { id: 8, name: "آبان", days: 30 },
    { id: 9, name: "آذر", days: 30 },
    { id: 10, name: "دی", days: 30 },
    { id: 11, name: "بهمن", days: 30 },
    { id: 12, name: "اسفند", days: 29 },
];

export const getCurrentJalaliYear = (): number => {
    try {
        const parts = new Intl.DateTimeFormat("en-US-u-ca-persian", { year: "numeric" }).formatToParts(new Date());
        const y = parts.find((p) => p.type === "year")?.value;
        if (y) return parseInt(y, 10);
    } catch {}
    return 1404;
};

export const calculateJalaliAge = (year: number | null, month: number | null, day: number | null): number | null => {
    if (!year || !month || !day) return null;
    let nowYear = 1404;
    let nowMonth = 8;
    let nowDay = 10;

    try {
        const parts = new Intl.DateTimeFormat("en-US-u-ca-persian", {
            year: "numeric",
            month: "numeric",
            day: "numeric",
        }).formatToParts(new Date());
        const y = parts.find((p) => p.type === "year")?.value;
        const m = parts.find((p) => p.type === "month")?.value;
        const d = parts.find((p) => p.type === "day")?.value;
        if (y) nowYear = parseInt(y, 10);
        if (m) nowMonth = parseInt(m, 10);
        if (d) nowDay = parseInt(d, 10);
    } catch {}

    let age = nowYear - year;
    if (nowMonth < month || (nowMonth === month && nowDay < day)) {
        age--;
    }
    return age;
};

export interface VerifiedKycData {
    firstName: string;
    lastName: string;
    nationalCode: string;
    birthDate?: string;
    citizenType: CitizenType;
}

export interface KycModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: (data: VerifiedKycData) => void;
    initialFirstName?: string;
    initialLastName?: string;
    initialNationalCode?: string;
    title?: string;
    subtitle?: string;
}

export function KycModal({
    isOpen,
    onClose,
    onSuccess,
    initialFirstName = "",
    initialLastName = "",
    initialNationalCode = "",
    title = "احراز هویت هوشمند کاربران",
    subtitle = "جهت ثبت درخواست، تأیید مشخصات در سامانه ثبت احوال الزامی است.",
}: KycModalProps) {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const [citizenType, setCitizenType] = useState<CitizenType>(CitizenType.IRANIAN);
    const [kycFirstName, setKycFirstName] = useState(initialFirstName);
    const [kycLastName, setKycLastName] = useState(initialLastName);
    const [nationalCode, setNationalCode] = useState(initialNationalCode);

    // Foreigner fields
    const [foreignIdType, setForeignIdType] = useState<ForeignIdType>(ForeignIdType.FIDA);
    const [foreignId, setForeignId] = useState("");
    const [documentUrl, setDocumentUrl] = useState("");

    // Date Picker States
    const [selectedYear, setSelectedYear] = useState<number | null>(null);
    const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
    const [selectedDay, setSelectedDay] = useState<number | null>(null);
    const [isDatePickerView, setIsDatePickerView] = useState(false);
    const [datePickerSubStep, setDatePickerSubStep] = useState<"year" | "month" | "day">("year");

    useEffect(() => {
        if (initialFirstName && !kycFirstName) setKycFirstName(initialFirstName);
        if (initialLastName && !kycLastName) setKycLastName(initialLastName);
        if (initialNationalCode && !nationalCode) setNationalCode(initialNationalCode);
    }, [initialFirstName, initialLastName, initialNationalCode]);

    const currentJalaliYear = useMemo(() => getCurrentJalaliYear(), []);

    const yearsList = useMemo(() => {
        const list: number[] = [];
        for (let y = currentJalaliYear; y >= 1320; y--) {
            list.push(y);
        }
        return list;
    }, [currentJalaliYear]);

    const currentMonthMaxDays = useMemo(() => {
        if (!selectedMonth) return 31;
        if (selectedMonth <= 6) return 31;
        if (selectedMonth <= 11) return 30;
        return 29;
    }, [selectedMonth]);

    const userAge = useMemo(() => {
        return calculateJalaliAge(selectedYear, selectedMonth, selectedDay);
    }, [selectedYear, selectedMonth, selectedDay]);

    const handleOpenDatePicker = () => {
        if (!selectedYear) {
            setDatePickerSubStep("year");
        } else if (!selectedMonth) {
            setDatePickerSubStep("month");
        } else {
            setDatePickerSubStep("day");
        }
        setIsDatePickerView(true);
    };

    const handleSelectYear = (y: number) => {
        setSelectedYear(y);
        setDatePickerSubStep("month");
    };

    const handleSelectMonth = (m: number) => {
        setSelectedMonth(m);
        setDatePickerSubStep("day");
    };

    const handleSelectDay = (d: number) => {
        setSelectedDay(d);
        setIsDatePickerView(false);
    };

    const kycMutation = useMutation({
        mutationFn: () => {
            const formattedBirthDate =
                selectedYear && selectedMonth && selectedDay
                    ? `${selectedYear}${String(selectedMonth).padStart(2, "0")}${String(selectedDay).padStart(2, "0")}`
                    : undefined;

            const finalFirstName = kycFirstName.trim();
            const finalLastName = kycLastName.trim();
            const finalNationalCode = toOnlyDigits(nationalCode);

            const userId = user?.userId || "me";

            return userService.verifyKyc(userId, {
                citizenType,
                nationalCode: citizenType === CitizenType.IRANIAN ? finalNationalCode : undefined,
                foreignIdType: citizenType === CitizenType.FOREIGNER ? foreignIdType : undefined,
                foreignId: citizenType === CitizenType.FOREIGNER ? foreignId.trim() : undefined,
                documentUrl: citizenType === CitizenType.FOREIGNER ? documentUrl.trim() : undefined,
                birthDate: formattedBirthDate,
                firstName: finalFirstName || undefined,
                lastName: finalLastName || undefined,
            });
        },
        onSuccess: (res) => {
            const isVerified =
                res.status === KYCStatus.VERIFIED ||
                String(res.status).toLowerCase() === "verified";
            const isInProgress =
                res.status === KYCStatus.IN_PROGRESS ||
                String(res.status).toLowerCase() === "in_progress";

            const verifiedData: VerifiedKycData = {
                firstName: kycFirstName.trim(),
                lastName: kycLastName.trim(),
                nationalCode: toOnlyDigits(nationalCode),
                birthDate:
                    selectedYear && selectedMonth && selectedDay
                        ? `${selectedYear}${String(selectedMonth).padStart(2, "0")}${String(selectedDay).padStart(2, "0")}`
                        : undefined,
                citizenType,
            };

            if (isVerified) {
                toast.success("احراز هویت شما با موفقیت تأیید شد.");
                try {
                    localStorage.setItem("melktoday_verified_kyc", JSON.stringify(verifiedData));
                } catch {}

                queryClient.invalidateQueries({ queryKey: ["user"] });
                queryClient.invalidateQueries({ queryKey: ["me"] });
                queryClient.invalidateQueries({ queryKey: ["auth-session"] });

                onSuccess?.(verifiedData);
                onClose();
            } else if (isInProgress) {
                toast.success(res.reason || "مدارک هویتی با موفقیت ثبت شد و در صف بررسی کارشناس قرار گرفت.");
                try {
                    localStorage.setItem("melktoday_verified_kyc", JSON.stringify(verifiedData));
                } catch {}

                queryClient.invalidateQueries({ queryKey: ["user"] });
                queryClient.invalidateQueries({ queryKey: ["me"] });

                onSuccess?.(verifiedData);
                onClose();
            } else {
                const failureMsg =
                    res.similarityPercentage !== undefined && res.similarityPercentage > 0
                        ? `میزان تطابق اطلاعات با سازمان ثبت احوال (${toPersianDigits(res.similarityPercentage)}٪) کمتر از حد نصاب است. لطفاً نام و نام خانوادگی را دقیقاً مطابق با شناسنامه وارد فرمایید.`
                        : res.reason || "اطلاعات با سامانه ثبت احوال همخوانی ندارد. لطفاً صحت مشخصات را بررسی فرمایید.";
                toast.error(failureMsg);
            }
        },
        onError: (err: any) => {
            const msg = normalizeApiError(err, "خطا در استعلام یا ثبت احراز هویت");
            toast.error(msg);
        },
    });

    if (!isOpen) return null;

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (citizenType === CitizenType.IRANIAN) {
            if (!kycFirstName.trim() || !kycLastName.trim()) {
                toast.error("لطفاً نام و نام خانوادگی را مطابق با شناسنامه وارد فرمایید.");
                return;
            }
            const cleanNat = toOnlyDigits(nationalCode);
            if (!cleanNat || cleanNat.length !== 10) {
                toast.error("کد ملی باید ۱۰ رقم معتبر باشد.");
                return;
            }
            if (!selectedYear || !selectedMonth || !selectedDay) {
                toast.error("لطفاً تاریخ تولد خود را انتخاب کنید.");
                return;
            }
        } else {
            if (!kycFirstName.trim() || !kycLastName.trim()) {
                toast.error("لطفاً نام و نام خانوادگی را وارد فرمایید.");
                return;
            }
            if (!foreignId.trim()) {
                toast.error("وارد کردن شماره شناسایی اتباع الزامی است.");
                return;
            }
        }

        kycMutation.mutate();
    };

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in overflow-y-auto"
            dir="rtl"
        >
            <div className="bg-surface rounded-t-[28px] sm:rounded-3xl p-5 sm:p-8 max-w-md w-full shadow-2xl space-y-4 border border-border-subtle my-0 sm:my-8 max-h-[92vh] overflow-y-auto animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
                {/* Mobile Drawer Handle */}
                <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-2 sm:hidden" />

                {isDatePickerView ? (
                    <div className="space-y-4 animate-in fade-in zoom-in-95">
                        {/* Header & Back Action */}
                        <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
                            <div className="flex items-center gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => setIsDatePickerView(false)}
                                    className="w-8 h-8 rounded-xl bg-surface-secondary hover:bg-slate-200 border border-border-subtle flex items-center justify-center text-foreground-secondary hover:text-foreground transition-all cursor-pointer"
                                    title="بازگشت به فرم"
                                >
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                                <div>
                                    <h4 className="text-sm font-black text-foreground">انتخاب تاریخ تولد</h4>
                                    <p className="text-[11px] text-foreground-muted">سال، ماه و روز تولد خود را مشخص فرمایید</p>
                                </div>
                            </div>

                            {selectedYear && selectedMonth && selectedDay && (
                                <div className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 text-xs font-black">
                                    {toPersianDigits(`${selectedYear}/${String(selectedMonth).padStart(2, "0")}/${String(selectedDay).padStart(2, "0")}`)}
                                </div>
                            )}
                        </div>

                        {/* Step Selector Tabs */}
                        <div className="grid grid-cols-3 gap-2 p-1 rounded-2xl bg-surface-secondary border border-border-subtle">
                            <button
                                type="button"
                                onClick={() => setDatePickerSubStep("year")}
                                className={cn(
                                    "py-2 px-2.5 rounded-xl text-center text-xs font-bold transition-all cursor-pointer",
                                    datePickerSubStep === "year"
                                        ? "bg-blue-600 text-white shadow-xs font-black"
                                        : "text-foreground-secondary hover:text-foreground"
                                )}
                            >
                                سال {selectedYear ? `(${toPersianDigits(selectedYear)})` : ""}
                            </button>
                            <button
                                type="button"
                                onClick={() => setDatePickerSubStep("month")}
                                className={cn(
                                    "py-2 px-2.5 rounded-xl text-center text-xs font-bold transition-all cursor-pointer",
                                    datePickerSubStep === "month"
                                        ? "bg-blue-600 text-white shadow-xs font-black"
                                        : "text-foreground-secondary hover:text-foreground"
                                )}
                            >
                                ماه {selectedMonth ? `(${JALALI_MONTHS[selectedMonth - 1]?.name})` : ""}
                            </button>
                            <button
                                type="button"
                                onClick={() => setDatePickerSubStep("day")}
                                className={cn(
                                    "py-2 px-2.5 rounded-xl text-center text-xs font-bold transition-all cursor-pointer",
                                    datePickerSubStep === "day"
                                        ? "bg-blue-600 text-white shadow-xs font-black"
                                        : "text-foreground-secondary hover:text-foreground"
                                )}
                            >
                                روز {selectedDay ? `(${toPersianDigits(selectedDay)})` : ""}
                            </button>
                        </div>

                        {/* 1. Year Grid */}
                        {datePickerSubStep === "year" && (
                            <div className="space-y-2">
                                <div className="text-xs text-foreground-secondary font-bold">سال تولد خود را انتخاب نمایید:</div>
                                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-60 sm:max-h-72 overflow-y-auto p-1.5 border border-border-subtle rounded-2xl bg-surface-secondary/50">
                                    {yearsList.map((y) => (
                                        <button
                                            key={y}
                                            type="button"
                                            onClick={() => handleSelectYear(y)}
                                            className={cn(
                                                "py-2.5 rounded-xl text-center text-xs font-bold transition-all cursor-pointer active:scale-95",
                                                selectedYear === y
                                                    ? "bg-blue-600 text-white shadow-sm font-black"
                                                    : "bg-surface hover:bg-blue-50 border border-border-subtle text-foreground"
                                            )}
                                        >
                                            {toPersianDigits(y)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 2. Month Grid */}
                        {datePickerSubStep === "month" && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs text-foreground-secondary font-bold">
                                    <span>ماه تولد را انتخاب کنید:</span>
                                    {selectedYear && (
                                        <span className="text-blue-600 text-xs">سال انتخاب‌شده: {toPersianDigits(selectedYear)}</span>
                                    )}
                                </div>
                                <div className="grid grid-cols-3 gap-2.5 max-h-60 sm:max-h-72 overflow-y-auto p-1.5">
                                    {JALALI_MONTHS.map((m) => (
                                        <button
                                            key={m.id}
                                            type="button"
                                            onClick={() => handleSelectMonth(m.id)}
                                            className={cn(
                                                "py-3 px-2 rounded-2xl text-center text-xs font-bold transition-all cursor-pointer active:scale-95 border",
                                                selectedMonth === m.id
                                                    ? "bg-blue-600 text-white border-blue-600 shadow-sm font-black"
                                                    : "bg-surface-secondary border-border-subtle hover:border-blue-500 text-foreground"
                                            )}
                                        >
                                            <span className="text-sm block">{m.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 3. Day Grid */}
                        {datePickerSubStep === "day" && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs text-foreground-secondary font-bold">
                                    <span>روز تولد را انتخاب کنید ({selectedMonth ? JALALI_MONTHS[selectedMonth - 1]?.name : ""}):</span>
                                    {selectedYear && selectedMonth && (
                                        <span className="text-blue-600 text-xs">
                                            {toPersianDigits(selectedYear)} / {JALALI_MONTHS[selectedMonth - 1]?.name}
                                        </span>
                                    )}
                                </div>
                                <div className="grid grid-cols-7 gap-2 max-h-60 sm:max-h-72 overflow-y-auto p-2 border border-border-subtle rounded-2xl bg-surface-secondary/50">
                                    {Array.from({ length: currentMonthMaxDays }, (_, i) => i + 1).map((d) => (
                                        <button
                                            key={d}
                                            type="button"
                                            onClick={() => handleSelectDay(d)}
                                            className={cn(
                                                "w-10 h-10 mx-auto rounded-xl text-center text-xs font-bold transition-all cursor-pointer flex items-center justify-center active:scale-95",
                                                selectedDay === d
                                                    ? "bg-blue-600 text-white shadow-sm font-black"
                                                    : "bg-surface hover:bg-blue-50 border border-border-subtle text-foreground"
                                            )}
                                        >
                                            {toPersianDigits(d)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Footer */}
                        <div className="pt-3 border-t border-border-subtle flex items-center justify-between">
                            <button
                                type="button"
                                onClick={() => setIsDatePickerView(false)}
                                className="h-11 px-5 w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-md shadow-blue-600/25 transition-all cursor-pointer flex items-center justify-center gap-2"
                            >
                                <span>تأیید و بازگشت به فرم</span>
                                <ArrowLeft className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleFormSubmit} className="space-y-4">
                        <div className="flex justify-between items-center border-b border-border-subtle pb-3">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                                    <ShieldCheck className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-black text-foreground text-sm">{title}</h3>
                                    <p className="text-[11px] text-foreground-muted">{subtitle}</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                className="w-8 h-8 rounded-full bg-surface-secondary flex items-center justify-center text-foreground-muted hover:bg-slate-200 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Citizenship Tabs */}
                        <div className="flex bg-surface-secondary p-1 rounded-2xl border border-border-subtle text-xs font-bold">
                            <button
                                type="button"
                                onClick={() => setCitizenType(CitizenType.IRANIAN)}
                                className={cn(
                                    "flex-1 py-2 rounded-xl transition-all",
                                    citizenType === CitizenType.IRANIAN
                                        ? "bg-surface text-foreground shadow-xs"
                                        : "text-foreground-secondary hover:text-foreground"
                                )}
                            >
                                شهروند ایرانی
                            </button>
                            <button
                                type="button"
                                onClick={() => setCitizenType(CitizenType.FOREIGNER)}
                                className={cn(
                                    "flex-1 py-2 rounded-xl transition-all",
                                    citizenType === CitizenType.FOREIGNER
                                        ? "bg-surface text-foreground shadow-xs"
                                        : "text-foreground-secondary hover:text-foreground"
                                )}
                            >
                                اتباع خارجی
                            </button>
                        </div>

                        {citizenType === CitizenType.IRANIAN ? (
                            <>
                                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-2.5 text-[11px] text-amber-900 leading-relaxed">
                                    نکته: نام و نام خانوادگی باید دقیقاً مطابق با شناسنامه (با پیشوند و پسوند) و کد ملی منطبق با مالک سیم‌کارت باشد.
                                </div>

                                <div className="space-y-3 text-xs">
                                    <div className="grid grid-cols-2 gap-2.5">
                                        <div>
                                            <label className="block font-bold text-foreground mb-1.5 flex items-center gap-1.5">
                                                <User className="w-3.5 h-3.5 text-blue-600" />
                                                <span>نام (مطابق شناسنامه) *</span>
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="مثلاً: علی اکبر"
                                                value={kycFirstName}
                                                onChange={(e) => setKycFirstName(e.target.value)}
                                                className="w-full p-3 border border-border-subtle rounded-xl bg-surface-secondary focus:bg-surface focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden text-right text-xs font-bold"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block font-bold text-foreground mb-1.5 flex items-center gap-1.5">
                                                <User className="w-3.5 h-3.5 text-blue-600" />
                                                <span>نام خانوادگی *</span>
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="مثلاً: هادیزاده"
                                                value={kycLastName}
                                                onChange={(e) => setKycLastName(e.target.value)}
                                                className="w-full p-3 border border-border-subtle rounded-xl bg-surface-secondary focus:bg-surface focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden text-right text-xs font-bold"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block font-bold text-foreground mb-1.5 flex items-center gap-1.5">
                                            <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                                            <span>کد ملی ۱۰ رقمی *</span>
                                        </label>
                                        <input
                                            type="text"
                                            maxLength={10}
                                            placeholder="مثلاً: ۰۹۳۱۶۲۹۷۲۱"
                                            dir="ltr"
                                            value={nationalCode}
                                            onChange={(e) => setNationalCode(toOnlyDigits(e.target.value))}
                                            className="w-full p-3 border border-border-subtle rounded-xl bg-surface-secondary focus:bg-surface focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden text-center text-sm tracking-widest font-mono font-bold"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <label className="font-bold text-foreground flex items-center gap-1.5">
                                                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                                                <span>تاریخ تولد *</span>
                                            </label>
                                            {userAge !== null && (
                                                <span className={cn(
                                                    "text-[10px] px-2 py-0.5 rounded-full font-bold",
                                                    userAge < 18
                                                        ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                                                        : "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                                                )}>
                                                    سن: {toPersianDigits(userAge)} سال
                                                </span>
                                            )}
                                        </div>

                                        <button
                                            type="button"
                                            onClick={handleOpenDatePicker}
                                            className={cn(
                                                "w-full p-3 border rounded-xl flex items-center justify-between transition-all group cursor-pointer",
                                                selectedYear && selectedMonth && selectedDay
                                                    ? "border-blue-500/50 bg-blue-500/5 hover:border-blue-500 text-foreground"
                                                    : "border-border-subtle bg-surface-secondary hover:border-blue-500/50 text-foreground-muted"
                                            )}
                                        >
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-blue-600" />
                                                <span className={cn(
                                                    "text-xs font-bold",
                                                    selectedYear && selectedMonth && selectedDay ? "text-foreground font-black" : "text-foreground-muted font-normal"
                                                )}>
                                                    {selectedYear && selectedMonth && selectedDay
                                                        ? toPersianDigits(`${selectedYear} / ${String(selectedMonth).padStart(2, "0")} / ${String(selectedDay).padStart(2, "0")}`)
                                                        : "برای انتخاب تاریخ تولد کلیک کنید"}
                                                </span>
                                            </div>
                                            <span className="text-[10px] text-blue-600 font-bold bg-blue-500/10 px-2 py-1 rounded-lg">
                                                {selectedYear && selectedMonth && selectedDay ? "تغییر تاریخ" : "انتخاب تاریخ"}
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="space-y-3 text-xs">
                                <div className="grid grid-cols-2 gap-2.5">
                                    <div>
                                        <label className="block font-bold text-foreground mb-1.5">نام *</label>
                                        <input
                                            type="text"
                                            value={kycFirstName}
                                            onChange={(e) => setKycFirstName(e.target.value)}
                                            className="w-full p-3 border border-border-subtle rounded-xl bg-surface-secondary focus:bg-surface text-xs font-bold"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block font-bold text-foreground mb-1.5">نام خانوادگی *</label>
                                        <input
                                            type="text"
                                            value={kycLastName}
                                            onChange={(e) => setKycLastName(e.target.value)}
                                            className="w-full p-3 border border-border-subtle rounded-xl bg-surface-secondary focus:bg-surface text-xs font-bold"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block font-bold text-foreground mb-1.5">نوع مدرک شناسایی</label>
                                    <select
                                        value={foreignIdType}
                                        onChange={(e) => setForeignIdType(e.target.value as ForeignIdType)}
                                        className="w-full p-3 border border-border-subtle rounded-xl bg-surface-secondary text-xs font-bold"
                                    >
                                        <option value={ForeignIdType.FIDA}>کد فراگیر اتباع (فیدا)</option>
                                        <option value={ForeignIdType.PASSPORT}>گذرنامه / پاسپورت</option>
                                        <option value={ForeignIdType.AMAYESH}>کارت آمایش</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block font-bold text-foreground mb-1.5">شماره مدرک / کد فراگیر *</label>
                                    <input
                                        type="text"
                                        value={foreignId}
                                        onChange={(e) => setForeignId(e.target.value)}
                                        className="w-full p-3 border border-border-subtle rounded-xl bg-surface-secondary text-xs font-mono font-bold"
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        <div className="pt-3 border-t border-border-subtle flex items-center gap-2">
                            <button
                                type="submit"
                                disabled={kycMutation.isPending}
                                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-md shadow-blue-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                            >
                                {kycMutation.isPending ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>در حال استعلام از ثبت احوال...</span>
                                    </>
                                ) : (
                                    <>
                                        <ShieldCheck className="w-4 h-4" />
                                        <span>تأیید هویت و ادامه درخواست</span>
                                    </>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="py-3 px-4 border border-border-subtle hover:bg-surface-secondary text-foreground-secondary rounded-xl text-xs font-bold transition-colors cursor-pointer"
                            >
                                انصراف
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
