"use client";

import { CitySelector } from "@/components/CitySelector";
import { KycModal, VerifiedKycData } from "@/components/common/KycModal";
import { useAuth } from "@/hooks/useAuth";
import { useCityLookup } from "@/hooks/useCityLookup";
import { normalizeApiError } from "@/lib/api/error-handler";
import { cn, toEnglishDigits, toOnlyDigits, toPersianDigits } from "@/lib/utils";
import { agencyService } from "@/services/agency.service";
import { userService } from "@/services/user.service";
import { AgentApplicationType, ApplyAgentRequest } from "@/types/api/agency.types";
import { KYCStatus } from "@/types/api/enums";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    ArrowRight,
    Award,
    Building2,
    CheckCircle,
    CheckCircle2,
    Clock,
    FileCheck,
    Home,
    Info,
    MapPin,
    Pencil,
    RotateCcw,
    ShieldAlert,
    ShieldCheck,
    User,
    X,
    XCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

export default function AgencyApplyPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { isLoggedIn, isLoading: isAuthLoading } = useAuth();
    const queryClient = useQueryClient();
    const { getCityName } = useCityLookup();

    const [isReapplying, setIsReapplying] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [agentType, setAgentType] = useState<AgentApplicationType>("CONSULTANT");
    const [isCitySelectorOpen, setIsCitySelectorOpen] = useState(false);
    const [selectedCityName, setSelectedCityName] = useState("");
    const [isKycModalOpen, setIsKycModalOpen] = useState(false);

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        nationalCode: "",
        agencyName: "",
        guildCode: "",
        licenseNumber: "",
        cityId: "",
        phone: "",
        address: "",
        experienceYears: 1,
        description: "",
    });

    // Query current user profile to verify KYC status
    const {
        data: userProfile,
        isLoading: isProfileLoading,
        refetch: refetchProfile,
    } = useQuery({
        queryKey: ["me"],
        queryFn: () => userService.getMe(),
        enabled: !!isLoggedIn,
    });

    const isKycVerified = userProfile?.kycStatus === KYCStatus.VERIFIED;

    // Autofill firstName/lastName and nationalCode from user profile or saved KYC data
    useEffect(() => {
        if (!isLoggedIn) return;

        if (userProfile) {
            setFormData((prev) => ({
                ...prev,
                firstName: prev.firstName || userProfile.firstName || "",
                lastName: prev.lastName || userProfile.lastName || "",
            }));
        }

        try {
            const saved = localStorage.getItem("melktoday_verified_kyc");
            if (saved) {
                const parsed = JSON.parse(saved);
                setFormData((prev) => ({
                    ...prev,
                    firstName: prev.firstName || parsed.firstName || "",
                    lastName: prev.lastName || parsed.lastName || "",
                    nationalCode: prev.nationalCode || parsed.nationalCode || "",
                }));
            }
        } catch {}
    }, [isLoggedIn, userProfile]);

    // Check existing application
    const {
        data: myApp,
        isLoading: isAppLoading,
        refetch: refetchMyApp,
    } = useQuery({
        queryKey: ["agency", "my-application"],
        queryFn: () => agencyService.getMyApplication(),
        enabled: !!isLoggedIn,
    });

    // If existing application has national code or name, load it
    useEffect(() => {
        if (myApp) {
            const nameParts = (myApp.fullName || "").trim().split(" ");
            const first = nameParts[0] || "";
            const last = nameParts.slice(1).join(" ") || "";
            setFormData((prev) => ({
                ...prev,
                firstName: prev.firstName || first,
                lastName: prev.lastName || last,
                nationalCode: prev.nationalCode || myApp.nationalCode || "",
            }));
        }
    }, [myApp]);

    const startEditing = () => {
        if (!myApp) return;
        const nameParts = (myApp.fullName || "").trim().split(" ");
        const first = nameParts[0] || "";
        const last = nameParts.slice(1).join(" ") || "";

        setAgentType(myApp.agentType || "CONSULTANT");
        setFormData({
            firstName: first,
            lastName: last,
            nationalCode: myApp.nationalCode || "",
            agencyName: myApp.agencyName || "",
            guildCode: myApp.guildCode || "",
            licenseNumber: myApp.licenseNumber || "",
            cityId: myApp.cityId || "",
            phone: myApp.phone || "",
            address: myApp.address || "",
            experienceYears: myApp.experienceYears || 1,
            description: myApp.description || "",
        });
        if (myApp.cityId) {
            const name = getCityName(myApp.cityId);
            if (name && name !== "نامشخص" && name !== "در حال بارگذاری...") {
                setSelectedCityName(name);
            }
        }
        setIsEditing(true);
        setIsReapplying(false);
        if (typeof window !== "undefined") {
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setIsReapplying(false);
        if (searchParams.get("edit")) {
            router.replace("/agency/apply");
        }
    };

    useEffect(() => {
        if (formData.cityId && !selectedCityName) {
            const name = getCityName(formData.cityId);
            if (name && name !== "نامشخص" && name !== "در حال بارگذاری...") {
                setSelectedCityName(name);
            }
        }
    }, [formData.cityId, selectedCityName, getCityName]);

    useEffect(() => {
        if ((searchParams.get("edit") === "true" || searchParams.get("reapply") === "true") && myApp) {
            startEditing();
        }
    }, [searchParams, myApp]);

    // Handle successful KYC verification from modal
    const handleKycSuccess = (verifiedData: VerifiedKycData) => {
        setFormData((prev) => ({
            ...prev,
            firstName: verifiedData.firstName,
            lastName: verifiedData.lastName,
            nationalCode: verifiedData.nationalCode,
        }));
        refetchProfile();
        toast.success("احراز هویت با موفقیت تکمیل شد. اکنون مشخصات صنفی خود را وارد نمایید.");
    };

    // Update user profile name silently on submit
    const updateProfileMutation = useMutation({
        mutationFn: (data: { firstName: string; lastName: string }) =>
            userService.updateMe(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["user"] });
            queryClient.invalidateQueries({ queryKey: ["me"] });
        },
    });

    const submitMutation = useMutation({
        mutationFn: (payload: ApplyAgentRequest) => agencyService.applyForAgent(payload),
        onSuccess: () => {
            toast.success("درخواست شما با موفقیت ثبت شد و در صف بررسی کارشناسان قرار گرفت.");
            setIsReapplying(false);
            setIsEditing(false);
            queryClient.invalidateQueries({ queryKey: ["agency", "my-application"] });
            refetchMyApp();
        },
        onError: (err: Error) => {
            toast.error(normalizeApiError(err, "خطا در ثبت درخواست. لطفاً اطلاعات ورودی را بررسی نمایید."));
        },
    });

    const updateMutation = useMutation({
        mutationFn: (payload: ApplyAgentRequest) => agencyService.updateMyApplication(payload),
        onSuccess: () => {
            toast.success("اطلاعات درخواست شما با موفقیت بروزرسانی شد.");
            setIsEditing(false);
            queryClient.invalidateQueries({ queryKey: ["agency", "my-application"] });
            refetchMyApp();
        },
        onError: (err: Error) => {
            toast.error(normalizeApiError(err, "خطا در بروزرسانی درخواست. لطفاً اطلاعات ورودی را بررسی نمایید."));
        },
    });

    const isSaving = submitMutation.isPending || updateMutation.isPending;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // 1. Mandatory KYC Gate
        if (!isKycVerified) {
            toast.error("برای ثبت درخواست، ابتدا باید احراز هویت حساب کاربری را تکمیل فرمایید.");
            setIsKycModalOpen(true);
            return;
        }

        if (!formData.firstName.trim()) {
            toast.error("وارد کردن نام الزامی است.");
            return;
        }

        if (!formData.lastName.trim()) {
            toast.error("وارد کردن نام خانوادگی الزامی است.");
            return;
        }

        if (!formData.nationalCode.trim() || formData.nationalCode.trim().length !== 10) {
            toast.error("کد ملی باید ۱۰ رقم معتبر باشد.");
            return;
        }

        if (!formData.cityId) {
            toast.error("لطفاً شهر محل فعالیت را انتخاب کنید.");
            return;
        }

        if (agentType === "AGENCY") {
            if (!formData.agencyName.trim()) {
                toast.error("وارد کردن نام دفتر املاک الزامی است.");
                return;
            }
            if (!formData.guildCode.trim() || formData.guildCode.trim().length < 4 || formData.guildCode.trim().length > 12) {
                toast.error("شناسه صنفی یا شماره پروانه کسب باید بین ۴ تا ۱۲ رقم باشد.");
                return;
            }
        }

        const fullName = `${formData.firstName} ${formData.lastName}`.trim();

        const payload: ApplyAgentRequest = {
            agentType,
            fullName,
            nationalCode: formData.nationalCode.trim(),
            cityId: formData.cityId,
            phone: formData.phone.trim() || undefined,
            address: formData.address.trim() || undefined,
            experienceYears: Number(formData.experienceYears) || 0,
            description: formData.description.trim() || undefined,
        };

        if (agentType === "AGENCY") {
            payload.agencyName = formData.agencyName.trim();
            payload.guildCode = formData.guildCode.trim();
            payload.licenseNumber = formData.licenseNumber.trim() || undefined;
        }

        if (isEditing) {
            updateMutation.mutate(payload);
        } else {
            // Silently sync name to user profile
            updateProfileMutation.mutate({
                firstName: formData.firstName.trim(),
                lastName: formData.lastName.trim(),
            });

            submitMutation.mutate(payload);
        }
    };

    // Unauthenticated State
    if (!isAuthLoading && !isLoggedIn) {
        return (
            <div className="min-h-screen bg-surface-secondary py-20 px-4 flex items-center justify-center" dir="rtl">
                <div className="bg-surface rounded-3xl p-8 border border-border-subtle max-w-md w-full text-center space-y-4 shadow-sm">
                    <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center mx-auto">
                        <Building2 className="w-7 h-7" />
                    </div>
                    <div className="space-y-1">
                        <h2 className="text-base font-black text-foreground">ورود به حساب کاربری</h2>
                        <p className="text-xs text-foreground-secondary leading-relaxed font-medium">
                            جهت ثبت درخواست همکاری و دریافت ویترین صفحه اختصاصی مشاور یا دفتر املاک، ابتدا باید وارد حساب خود شوید.
                        </p>
                    </div>
                    <Link
                        href="/auth?redirect=/agency/apply"
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition-colors block shadow-sm"
                    >
                        ورود یا ثبت‌نام با شماره همراه
                    </Link>
                </div>
            </div>
        );
    }

    if (isAppLoading || isProfileLoading) {
        return (
            <div className="min-h-screen bg-surface-secondary py-16 px-4 flex items-center justify-center" dir="rtl">
                <div className="flex flex-col items-center gap-3 text-foreground-muted">
                    <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs font-bold">در حال بارگذاری اطلاعات...</span>
                </div>
            </div>
        );
    }

    const isViewingStatus = !!myApp && !isEditing && !isReapplying;

    return (
        <div className="min-h-screen bg-surface-secondary pb-24 lg:pb-10 pt-10 px-4 sm:px-6 lg:px-8" dir="rtl">
            <div className="max-w-3xl mx-auto space-y-6">
                {/* 1. Clean Top Bar for Edit / Reapply Mode */}
                {(isEditing || isReapplying) && (
                    <div className="flex items-center justify-between pb-1">
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleCancelEdit}
                                className="p-2 -mr-2 text-foreground-muted hover:text-foreground transition-colors cursor-pointer"
                                title="بازگشت"
                            >
                                <ArrowRight className="w-5 h-5" />
                            </button>
                            <h1 className="text-base sm:text-lg font-black text-foreground">
                                {isEditing ? "ویرایش مشخصات درخواست همکاری" : "ارسال مجدد درخواست همکاری"}
                            </h1>
                        </div>
                    </div>
                )}

                {/* Rejection note when reapplying */}
                {isReapplying && myApp?.adminNote && (
                    <div className="p-4 bg-error-subtle/80 border border-error/30 rounded-2xl space-y-1.5 text-xs text-rose-900">
                        <span className="font-black flex items-center gap-1.5">
                            <XCircle className="w-4 h-4 text-error shrink-0" />
                            علت رد درخواست قبلی توسط مدیریت:
                        </span>
                        <p className="leading-relaxed font-medium bg-surface/70 p-3 rounded-xl border border-rose-200/50">
                            {myApp.adminNote}
                        </p>
                    </div>
                )}

                {/* 2. Header for Fresh Application Mode */}
                {!myApp && (
                    <div className="bg-surface p-6 sm:p-8 rounded-3xl border border-border-subtle/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-info text-xs font-black">
                                <ShieldCheck className="w-4 h-4" />
                                <span>سامانه هوشمند احراز هویت مشاوران و دفاتر املاک</span>
                            </div>
                            <h1 className="text-xl sm:text-2xl font-black text-foreground">
                                درخواست ارتقا به حساب کارشناس یا دفتر املاک
                            </h1>
                            <p className="text-xs text-foreground-muted font-medium leading-relaxed">
                                با عضویت در ملک‌تودی، صاحب صفحه اختصاصی ویترین املاک خود شوید، آگهی و پست منتشر کنید و مستقیماً از کاربران پیام بگیرید.
                            </p>
                        </div>

                        <Link
                            href="/"
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-surface-secondary hover:bg-slate-200 text-foreground-secondary rounded-xl text-xs font-bold transition-colors shrink-0 w-fit"
                        >
                            <span>صفحه اصلی</span>
                            <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                        </Link>
                    </div>
                )}

                {/* 3. Header & Status Card for Viewing Existing Application */}
                {isViewingStatus && (
                    <>
                        <div className="flex items-center justify-between gap-4 pb-1">
                            <div>
                                <h1 className="text-lg sm:text-xl font-black text-foreground">
                                    وضعیت درخواست همکاری املاک
                                </h1>
                                <p className="text-xs text-foreground-muted font-medium mt-0.5">
                                    پیگیری پرونده ارتقا به حساب کارشناس یا دفتر املاک
                                </p>
                            </div>

                            <Link
                                href="/"
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-surface hover:bg-surface-secondary text-foreground-secondary border border-border-subtle rounded-xl text-xs font-bold transition-colors shrink-0"
                            >
                                <span>صفحه اصلی</span>
                                <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                            </Link>
                        </div>

                        <div className="bg-surface p-6 sm:p-8 rounded-3xl border border-border-subtle/80 shadow-xs space-y-6">
                            <div className="flex items-center gap-3 border-b border-border-subtle pb-4">
                                {myApp.status === "PENDING" && (
                                    <div className="w-12 h-12 rounded-2xl bg-warning-subtle text-warning flex items-center justify-center font-bold">
                                        <Clock className="w-6 h-6" />
                                    </div>
                                )}
                                {myApp.status === "APPROVED" && (
                                    <div className="w-12 h-12 rounded-2xl bg-success-subtle text-success flex items-center justify-center font-bold">
                                        <CheckCircle className="w-6 h-6" />
                                    </div>
                                )}
                                {myApp.status === "REJECTED" && (
                                    <div className="w-12 h-12 rounded-2xl bg-error-subtle text-error flex items-center justify-center font-bold">
                                        <XCircle className="w-6 h-6" />
                                    </div>
                                )}

                                <div>
                                    <h3 className="text-base font-black text-foreground">
                                        وضعیت آخرین درخواست شما:{" "}
                                        <span className={
                                            myApp.status === "APPROVED" ? "text-success font-black" :
                                                myApp.status === "REJECTED" ? "text-error font-black" : "text-warning font-black"
                                        }>
                                            {myApp.status === "APPROVED" ? "تأیید شده و فعال" :
                                                myApp.status === "REJECTED" ? "تأیید نشده" : "در انتظار بررسی کارشناس"}
                                        </span>
                                    </h3>
                                    <p className="text-xs text-foreground-muted font-medium mt-0.5">
                                        نوع درخواست: {myApp.agentType === "AGENCY" ? "دفتر املاک (پروانه‌دار)" : "مشاور املاک مستقل"}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                                <div className="p-3 bg-surface-secondary rounded-xl space-y-1">
                                    <span className="text-foreground-muted font-bold block">نام متقاضی:</span>
                                    <span className="font-bold text-foreground">{myApp.fullName}</span>
                                </div>
                                {myApp.agencyName && (
                                    <div className="p-3 bg-surface-secondary rounded-xl space-y-1">
                                        <span className="text-foreground-muted font-bold block">نام دفتر املاک:</span>
                                        <span className="font-bold text-foreground">{myApp.agencyName}</span>
                                    </div>
                                )}
                                <div className="p-3 bg-surface-secondary rounded-xl space-y-1">
                                    <span className="text-foreground-muted font-bold block">کد ملی:</span>
                                    <span className="font-mono font-bold text-foreground">{toPersianDigits(myApp.nationalCode)}</span>
                                </div>
                                {myApp.guildCode && (
                                    <div className="p-3 bg-surface-secondary rounded-xl space-y-1">
                                        <span className="text-foreground-muted font-bold block">شناسه صنفی:</span>
                                        <span className="font-mono font-bold text-foreground">{toPersianDigits(myApp.guildCode)}</span>
                                    </div>
                                )}
                            </div>

                            {/* Admin note if rejected */}
                            {myApp.status === "REJECTED" && myApp.adminNote && (
                                <div className="p-4 bg-error-subtle border border-error/30 rounded-2xl space-y-1 text-xs text-rose-900">
                                    <span className="font-black block">علت رد درخواست توسط مدیریت:</span>
                                    <p className="leading-relaxed">{myApp.adminNote}</p>
                                </div>
                            )}

                            {/* Action buttons */}
                            <div className="flex items-center gap-3 pt-2">
                                {myApp.status === "APPROVED" ? (
                                    <Link
                                        href="/agency/panel"
                                        className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-colors shadow-sm"
                                    >
                                        ورود به پنل مدیریت صفحه املاک
                                    </Link>
                                ) : myApp.status === "REJECTED" ? (
                                    <button
                                        type="button"
                                        onClick={startEditing}
                                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition-colors shadow-sm flex items-center gap-2 cursor-pointer"
                                    >
                                        <RotateCcw className="w-4 h-4" />
                                        <span>ارسال مجدد درخواست با اطلاعات اصلاح‌شده</span>
                                    </button>
                                ) : (
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 w-full">
                                        <div className="text-xs font-medium text-foreground-muted flex items-center gap-1.5">
                                            <Info className="w-4 h-4 text-amber-500 shrink-0" />
                                            <span>درخواست شما در حال حاضر در انتظار بررسی است. در صورت نیاز می‌توانید اطلاعات آن را ویرایش کنید.</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={startEditing}
                                            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black transition-colors shadow-sm flex items-center gap-1.5 shrink-0 cursor-pointer"
                                        >
                                            <Pencil className="w-3.5 h-3.5" />
                                            <span>ویرایش اطلاعات درخواست</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}

                {/* 4. Application Form Flow (Only when fresh, editing, or reapplying) */}
                {(!myApp || isReapplying || isEditing) && (
                    <div className="space-y-6">
                        {/* Step 1: KYC Verification Gate (If not verified yet) */}
                        {!isKycVerified ? (
                            <div className="bg-surface p-6 sm:p-8 rounded-3xl border border-amber-500/30 bg-amber-500/5 shadow-xs space-y-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                                        <ShieldAlert className="w-5 h-5" />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-sm font-black text-foreground">گام اول: احراز هویت اولیه کاربر (الزامی)</h3>
                                            <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 text-[10px] font-black">
                                                تکمیل نشده
                                            </span>
                                        </div>
                                        <p className="text-xs text-foreground-secondary leading-relaxed">
                                            جهت ثبت درخواست عضویت دفتر یا مشاور املاک، ابتدا لازم است هویت شما (کد ملی و تاریخ تولد) با سامانه ثبت احوال تطبیق داده شود.
                                            پس از تأیید، مشخصات هویتی شما به‌صورت خودکار در فرم درخواست ثبت شده و نیازی به ورود مجدد اطلاعات تکراری نخواهد بود.
                                        </p>
                                    </div>
                                </div>

                                <div className="pt-2 flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsKycModalOpen(true)}
                                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-blue-600/25 flex items-center gap-2 cursor-pointer"
                                    >
                                        <ShieldCheck className="w-4 h-4" />
                                        <span>تکمیل احراز هویت هوشمند و شروع درخواست</span>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* Verified Badge Banner */
                            <div className="p-4 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                                <div className="flex items-center gap-2.5 text-emerald-800">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                                    <div>
                                        <div className="font-black text-xs text-emerald-900">
                                            احراز هویت حساب کاربری تأیید شده است
                                        </div>
                                        <div className="text-[11px] text-emerald-700 mt-0.5">
                                            دارنده: {formData.firstName} {formData.lastName}
                                            {formData.nationalCode ? ` (کد ملی: ${toPersianDigits(formData.nationalCode)})` : ""}
                                        </div>
                                    </div>
                                </div>
                                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-800 font-bold text-[10px] self-start sm:self-auto">
                                    ثبت احوال تأیید شده ✓
                                </span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="bg-surface p-6 sm:p-8 rounded-3xl border border-border-subtle/80 shadow-xs space-y-6">
                            {/* Role Selection */}
                            <div className="space-y-3">
                                <label className="text-xs font-black text-foreground-secondary block">
                                    انتخاب نوع نقش درخواستی:
                                </label>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div
                                        onClick={() => setAgentType("CONSULTANT")}
                                        className={`p-3.5 sm:p-4 rounded-2xl border-2 cursor-pointer transition-all space-y-1.5 ${agentType === "CONSULTANT"
                                            ? "border-blue-600 bg-info-subtle/40 shadow-xs"
                                            : "border-border-subtle hover:border-border bg-surface"
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-xl bg-info-subtle/70 text-info flex items-center justify-center font-bold shrink-0">
                                                    <Award className="w-4 h-4" />
                                                </div>
                                                <h3 className="text-xs sm:text-sm font-black text-foreground">مشاور املاک مستقل</h3>
                                            </div>
                                            <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${agentType === "CONSULTANT" ? "border-blue-600 bg-blue-600" : "border-border"
                                                }`}>
                                                {agentType === "CONSULTANT" && <span className="w-1.5 h-1.5 rounded-full bg-surface" />}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-foreground-muted font-medium pr-1">
                                            مخصوص مشاورین املاک بدون نیاز به پروانه اختصاصی
                                        </p>
                                    </div>

                                    <div
                                        onClick={() => setAgentType("AGENCY")}
                                        className={`p-3.5 sm:p-4 rounded-2xl border-2 cursor-pointer transition-all space-y-1.5 ${agentType === "AGENCY"
                                            ? "border-purple-600 bg-purple-50/40 shadow-xs"
                                            : "border-border-subtle hover:border-border bg-surface"
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-xl bg-purple-100/70 text-purple-700 flex items-center justify-center font-bold shrink-0">
                                                    <Building2 className="w-4 h-4" />
                                                </div>
                                                <h3 className="text-xs sm:text-sm font-black text-foreground">آژانس / دفتر املاک</h3>
                                            </div>
                                            <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${agentType === "AGENCY" ? "border-purple-600 bg-purple-600" : "border-border"
                                                }`}>
                                                {agentType === "AGENCY" && <span className="w-1.5 h-1.5 rounded-full bg-surface" />}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-foreground-muted font-medium pr-1">
                                            مخصوص دفاتر املاک دارای پروانه رسمی و شناسه صنفی
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Inputs Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold text-foreground-secondary">نام *</label>
                                        {isKycVerified && <span className="text-[10px] text-emerald-600 font-bold">تأیید هویت شده ✓</span>}
                                    </div>
                                    <input
                                        type="text"
                                        value={formData.firstName}
                                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                        disabled={isKycVerified}
                                        placeholder="مثال: علی اکبر"
                                        className={cn(
                                            "w-full p-3 border rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500",
                                            isKycVerified ? "bg-surface-secondary/70 border-emerald-500/30 text-foreground font-bold cursor-not-allowed" : "bg-surface-secondary border-border-subtle"
                                        )}
                                        required
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold text-foreground-secondary">نام خانوادگی *</label>
                                        {isKycVerified && <span className="text-[10px] text-emerald-600 font-bold">تأیید هویت شده ✓</span>}
                                    </div>
                                    <input
                                        type="text"
                                        value={formData.lastName}
                                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                        disabled={isKycVerified}
                                        placeholder="مثال: هادیزاده"
                                        className={cn(
                                            "w-full p-3 border rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500",
                                            isKycVerified ? "bg-surface-secondary/70 border-emerald-500/30 text-foreground font-bold cursor-not-allowed" : "bg-surface-secondary border-border-subtle"
                                        )}
                                        required
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold text-foreground-secondary">کد ملی ۱۰ رقمی *</label>
                                        {isKycVerified && <span className="text-[10px] text-emerald-600 font-bold">تأیید هویت شده ✓</span>}
                                    </div>
                                    <input
                                        type="text"
                                        maxLength={10}
                                        value={formData.nationalCode}
                                        onChange={(e) => setFormData({ ...formData, nationalCode: toOnlyDigits(e.target.value) })}
                                        disabled={isKycVerified && Boolean(formData.nationalCode)}
                                        placeholder="کد ملی ۱۰ رقمی منطبق با سیم‌کارت"
                                        className={cn(
                                            "w-full p-3 border rounded-xl text-xs font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500",
                                            isKycVerified && Boolean(formData.nationalCode)
                                                ? "bg-surface-secondary/70 border-emerald-500/30 text-foreground font-bold cursor-not-allowed"
                                                : "bg-surface-secondary border-border-subtle"
                                        )}
                                        required
                                    />
                                </div>

                                {agentType === "AGENCY" && (
                                    <>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-foreground-secondary">نام دفتر املاک *</label>
                                            <input
                                                type="text"
                                                value={formData.agencyName}
                                                onChange={(e) => setFormData({ ...formData, agencyName: e.target.value })}
                                                placeholder="مثال: املاک رویال نیاوران"
                                                className="w-full p-3 bg-surface-secondary border border-border-subtle rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                                required
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <label className="text-xs font-bold text-foreground-secondary">
                                                    شناسه صنفی یا شماره پروانه کسب *
                                                </label>
                                                <span className="text-[11px] text-foreground-muted">۴ الی ۱۲ رقم</span>
                                            </div>
                                            <input
                                                type="text"
                                                maxLength={12}
                                                value={formData.guildCode}
                                                onChange={(e) => setFormData({ ...formData, guildCode: toOnlyDigits(e.target.value) })}
                                                placeholder="شناسه ۱۰ رقمی سامانه نوین اصناف یا شماره پروانه اتحادیه"
                                                className="w-full p-3 bg-surface-secondary border border-border-subtle rounded-xl text-xs font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                                required
                                            />
                                            <p className="text-[11px] text-foreground-muted">
                                                شناسه یکتای نوین اصناف (۱۰ رقم مانند ۰۴۶۸۰۹۷۴۴۹) یا شماره پروانه اتحادیه را وارد فرمایید.
                                            </p>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-foreground-secondary">شماره پروانه کسب / ثبت اتحادیه (اختیاری)</label>
                                            <input
                                                type="text"
                                                value={formData.licenseNumber}
                                                onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                                                placeholder="شماره مجوز ثبت اتحادیه املاک"
                                                className="w-full p-3 bg-surface-secondary border border-border-subtle rounded-xl text-xs font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                            />
                                        </div>
                                    </>
                                )}

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-foreground-secondary">شهر محل فعالیت *</label>
                                    <button
                                        type="button"
                                        onClick={() => setIsCitySelectorOpen(true)}
                                        className="w-full flex items-center justify-between p-3 bg-surface-secondary border border-border-subtle rounded-xl text-xs hover:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-right group"
                                    >
                                        <div className="flex items-center gap-2">
                                            <MapPin className="w-4 h-4 text-info shrink-0" />
                                            <span className={formData.cityId ? "font-bold text-foreground" : "text-foreground-muted"}>
                                                {selectedCityName || "انتخاب شهر محل فعالیت..."}
                                            </span>
                                        </div>
                                        <span className="text-[11px] text-info font-medium group-hover:underline">
                                            {formData.cityId ? "تغییر شهر" : "انتخاب"}
                                        </span>
                                    </button>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-foreground-secondary">شماره تماس مستقیم دفتر یا مشاور</label>
                                    <input
                                        type="text"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: toEnglishDigits(e.target.value) })}
                                        placeholder="تلفن ثابت یا همراه پشتیبان"
                                        className="w-full p-3 bg-surface-secondary border border-border-subtle rounded-xl text-xs font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-foreground-secondary">سابقه فعالیت ملکی (سال)</label>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        value={formData.experienceYears}
                                        onChange={(e) => setFormData({ ...formData, experienceYears: Number(toOnlyDigits(e.target.value)) })}
                                        className="w-full p-3 bg-surface-secondary border border-border-subtle rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    />
                                </div>

                                <div className="space-y-1.5 sm:col-span-2">
                                    <label className="text-xs font-bold text-foreground-secondary">آدرس دقیق {agentType === "AGENCY" ? "دفتر املاک" : "محل استقرار"}</label>
                                    <input
                                        type="text"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        placeholder="استان، شهر، خیابان، پلاک، طبقه و واحد..."
                                        className="w-full p-3 bg-surface-secondary border border-border-subtle rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    />
                                </div>

                                <div className="space-y-1.5 sm:col-span-2">
                                    <label className="text-xs font-bold text-foreground-secondary">بیوگرافی، تخصص‌ها یا توضیحات تکمیلی</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows={3}
                                        placeholder="توضیحاتی پیرامون مناطق تخصصی فعالیت، پروژه‌ها و سوابق کاری..."
                                        className="w-full p-3 bg-surface-secondary border border-border-subtle rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            {/* KYC Notice Box */}
                            <div className="p-4 bg-info-subtle/60 border border-info/30 rounded-2xl flex items-start gap-3">
                                <Info className="w-5 h-5 text-info shrink-0 mt-0.5" />
                                <div className="text-xs text-foreground leading-relaxed">
                                    <span className="font-black block mb-0.5">استعلام هوشمند جیبیت:</span>
                                    {agentType === "CONSULTANT" ? (
                                        <span>
                                            کد ملی ثبت‌شده با شماره همراه حساب در سامانه شاهکار تطبیق داده می‌شود.
                                        </span>
                                    ) : (
                                        <span>
                                            شناسه صنفی وارد شده به‌صورت برخط با پایگاه اصناف کشور و جیبیت استعلام شده و با کد ملی صاحب پروانه تطبیق داده می‌شود.
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className="pt-2 flex items-center justify-between gap-4">
                                {(isReapplying || isEditing) && (
                                    <button
                                        type="button"
                                        onClick={handleCancelEdit}
                                        className="py-3 px-5 border border-border-subtle rounded-xl text-xs font-bold text-foreground-secondary hover:bg-surface-secondary transition-colors"
                                    >
                                        انصراف
                                    </button>
                                )}

                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    {isSaving ? (
                                        <span>در حال اعتبارسنجی و ثبت تغییرات...</span>
                                    ) : isEditing ? (
                                        <>
                                            <FileCheck className="w-4 h-4" />
                                            <span>بروزرسانی مشخصات درخواست املاک</span>
                                        </>
                                    ) : isReapplying ? (
                                        <>
                                            <FileCheck className="w-4 h-4" />
                                            <span>ارسال مجدد درخواست جهت بررسی</span>
                                        </>
                                    ) : (
                                        <>
                                            <FileCheck className="w-4 h-4" />
                                            <span>ثبت نهایی درخواست عضویت و استعلام اصناف</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>

            {/* City Selector Modal */}
            <CitySelector
                isOpen={isCitySelectorOpen}
                onClose={() => setIsCitySelectorOpen(false)}
                onSelect={(city) => {
                    setFormData({ ...formData, cityId: city.id });
                    setSelectedCityName(city.name);
                    setIsCitySelectorOpen(false);
                }}
                currentCityId={formData.cityId}
            />

            {/* KYC Modal */}
            <KycModal
                isOpen={isKycModalOpen}
                onClose={() => setIsKycModalOpen(false)}
                onSuccess={handleKycSuccess}
                initialFirstName={formData.firstName}
                initialLastName={formData.lastName}
                initialNationalCode={formData.nationalCode}
                title="احراز هویت پیش از ثبت درخواست املاک"
                subtitle="جهت فعال‌سازی عضویت مشاور یا دفتر املاک، ابتدا باید هویت حساب کاربری تأیید شود."
            />
        </div>
    );
}
