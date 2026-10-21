"use client";

import { CitySelector } from "@/components/CitySelector";
import { useAuth } from "@/hooks/useAuth";
import { useCityLookup } from "@/hooks/useCityLookup";
import { normalizeApiError } from "@/lib/api/error-handler";
import { toEnglishDigits, toOnlyDigits } from "@/lib/utils";
import { agencyService } from "@/services/agency.service";
import { userService } from "@/services/user.service";
import { AgentApplicationType, ApplyAgentRequest } from "@/types/api/agency.types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    ArrowRight,
    Award,
    Building2,
    CheckCircle,
    Clock,
    FileCheck,
    Home,
    Info,
    MapPin,
    RotateCcw,
    ShieldCheck,
    XCircle
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

export default function AgencyApplyPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { isLoggedIn } = useAuth();
    const queryClient = useQueryClient();
    const { getCityName } = useCityLookup();

    const [isReapplying, setIsReapplying] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [agentType, setAgentType] = useState<AgentApplicationType>("CONSULTANT");
    const [isCitySelectorOpen, setIsCitySelectorOpen] = useState(false);
    const [selectedCityName, setSelectedCityName] = useState("");

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

    // Autofill firstName/lastName from user profile
    useEffect(() => {
        if (!isLoggedIn) return;
        userService.getMe().then((profile) => {
            setFormData((prev) => ({
                ...prev,
                firstName: prev.firstName || profile.firstName || "",
                lastName: prev.lastName || profile.lastName || "",
            }));
        }).catch(() => {/* silently ignore */ });
    }, [isLoggedIn]);

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
        if (searchParams.get("edit") === "true" && myApp && myApp.status === "PENDING") {
            startEditing();
        }
    }, [searchParams, myApp]);

    // Update user profile name silently on submit
    const updateProfileMutation = useMutation({
        mutationFn: (data: { firstName: string; lastName: string }) =>
            userService.updateMe(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["user"] });
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

        if (!formData.firstName.trim()) {
            toast.error("لطفاً نام متقاضی را وارد کنید.");
            return;
        }

        if (!formData.lastName.trim()) {
            toast.error("لطفاً نام خانوادگی متقاضی را وارد کنید.");
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
            if (!formData.guildCode.trim() || formData.guildCode.trim().length !== 10) {
                toast.error("شناسه صنفی اصناف برای دفتر املاک باید ۱۰ رقم معتبر باشد.");
                return;
            }
        }

        const fullName = `${formData.firstName} ${formData.lastName}`;

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

    return (
        <div className="min-h-screen bg-surface-secondary pb-24 lg:pb-10 pt-10 px-4 sm:px-6 lg:px-8" dir="rtl">
            <div className="max-w-3xl mx-auto space-y-8">
                {/* Top Header */}
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

                {/* Status Box if User Already Applied */}
                {!isAppLoading && myApp && !isReapplying && (
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
                                        myApp.status === "PENDING"
                                            ? "text-warning"
                                            : myApp.status === "APPROVED"
                                                ? "text-success"
                                                : "text-error"
                                    }>
                                        {myApp.status === "PENDING" && "در انتظار بررسی توسط مدیریت"}
                                        {myApp.status === "APPROVED" && "تأیید شده و حساب شما ارتقا یافت"}
                                        {myApp.status === "REJECTED" && "رد شده"}
                                    </span>
                                </h3>
                                <p className="text-xs text-foreground-muted font-medium">
                                    ثبت شده برای: {myApp.agentType === "AGENCY" ? "دفتر املاک" : "مشاور املاک"} در تاریخ{" "}
                                    {new Date(myApp.createdAt).toLocaleDateString("fa-IR")}
                                </p>
                            </div>
                        </div>

                        {/* Details summary */}
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
                                <span className="font-mono font-bold text-foreground">{myApp.nationalCode}</span>
                            </div>
                            {myApp.guildCode && (
                                <div className="p-3 bg-surface-secondary rounded-xl space-y-1">
                                    <span className="text-foreground-muted font-bold block">شناسه صنفی:</span>
                                    <span className="font-mono font-bold text-foreground">{myApp.guildCode}</span>
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
                                    onClick={() => setIsReapplying(true)}
                                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition-colors shadow-sm"
                                >
                                    ارسال مجدد درخواست با اطلاعات اصلاح‌شده
                                </button>
                            ) : (
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 w-full">
                                    <div className="text-xs font-medium text-foreground-muted flex items-center gap-1.5">
                                        <Info className="w-4 h-4 text-amber-500 shrink-0" />
                                        <span>درخواست شما در حال حاضر در انتظار بررسی است. در صورت نیاز می‌توانید اطلاعات آن را ویرایش کنید.</span>
                                    </div>
                                    {!isEditing ? (
                                        <button
                                            type="button"
                                            onClick={startEditing}
                                            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black transition-colors shadow-sm flex items-center gap-1.5 shrink-0"
                                        >
                                            <RotateCcw className="w-3.5 h-3.5" />
                                            <span>ویرایش اطلاعات درخواست</span>
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => setIsEditing(false)}
                                            className="px-5 py-2.5 bg-surface border border-border-subtle text-foreground-muted hover:text-foreground rounded-xl text-xs font-black transition-colors shrink-0"
                                        >
                                            انصراف از ویرایش
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Simultaneous Host Opportunity Banner */}
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-white text-emerald-600 flex items-center justify-center shadow-xs shrink-0">
                            <Home className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="text-sm font-black text-emerald-900">ثبت‌نام همزمان به عنوان میزبان اقامتگاه</h4>
                            <p className="text-xs text-emerald-700/80 mt-0.5 font-medium leading-relaxed">
                                می‌توانید همزمان با فعالیت املاک، اقامتگاه‌ها و ویلاهای روزانه خود را نیز در ملک‌تودی اجاره دهید.
                            </p>
                        </div>
                    </div>
                    <Link
                        href="/host/apply"
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition shadow-sm shrink-0"
                    >
                        <Home className="w-4 h-4" />
                        <span>ثبت درخواست میزبانی</span>
                    </Link>
                </div>

                {/* Application Form */}
                {(!myApp || isReapplying || isEditing) && (
                    <form onSubmit={handleSubmit} className="bg-surface p-6 sm:p-8 rounded-3xl border border-border-subtle/80 shadow-xs space-y-6">
                        {/* Step 1: Select Agent Type */}
                        <div className="space-y-3">
                            <label className="text-xs font-black text-foreground-secondary block">
                                انتخاب نوع نقش درخواستی:
                            </label>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div
                                    onClick={() => setAgentType("CONSULTANT")}
                                    className={`p-5 rounded-2xl border-2 cursor-pointer transition-all space-y-2 ${agentType === "CONSULTANT"
                                        ? "border-blue-600 bg-info-subtle/40 shadow-xs"
                                        : "border-border-subtle hover:border-border bg-surface"
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="w-10 h-10 rounded-xl bg-info-subtle/70 text-info flex items-center justify-center font-bold">
                                            <Award className="w-5 h-5" />
                                        </div>
                                        <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${agentType === "CONSULTANT" ? "border-blue-600 bg-blue-600" : "border-border"
                                            }`}>
                                            {agentType === "CONSULTANT" && <span className="w-1.5 h-1.5 rounded-full bg-surface" />}
                                        </span>
                                    </div>
                                    <h3 className="text-sm font-black text-foreground">مشاور املاک مستقل</h3>
                                    <p className="text-[11px] text-foreground-muted leading-relaxed font-medium">
                                        مخصوص کارشناسان و مشاورین ملکی بدون نیاز به دفتر فیزیکی. احراز هویت با تطبیق کدملی و سامانه شاهکار جیبیت انجام می‌پذیرد.
                                    </p>
                                </div>

                                <div
                                    onClick={() => setAgentType("AGENCY")}
                                    className={`p-5 rounded-2xl border-2 cursor-pointer transition-all space-y-2 ${agentType === "AGENCY"
                                        ? "border-purple-600 bg-purple-50/40 shadow-xs"
                                        : "border-border-subtle hover:border-border bg-surface"
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="w-10 h-10 rounded-xl bg-purple-100/70 text-purple-700 flex items-center justify-center font-bold">
                                            <Building2 className="w-5 h-5" />
                                        </div>
                                        <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${agentType === "AGENCY" ? "border-purple-600 bg-purple-600" : "border-border"
                                            }`}>
                                            {agentType === "AGENCY" && <span className="w-1.5 h-1.5 rounded-full bg-surface" />}
                                        </span>
                                    </div>
                                    <h3 className="text-sm font-black text-foreground">دفتر / آژانس معاملات ملکی</h3>
                                    <p className="text-[11px] text-foreground-muted leading-relaxed font-medium">
                                        مخصوص بنگاه‌ها و دفاتر رسمی دارای پروانه کسب. احراز هویت با شناسه صنفی ۱۰ رقمی اصناف جیبیت صورت می‌گیرد.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Step 2: Form Inputs */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-foreground-secondary">نام *</label>
                                <input
                                    type="text"
                                    value={formData.firstName}
                                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                    placeholder="مثال: علی"
                                    className="w-full p-3 bg-surface-secondary border border-border-subtle rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-foreground-secondary">نام خانوادگی *</label>
                                <input
                                    type="text"
                                    value={formData.lastName}
                                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                    placeholder="مثال: احمدی"
                                    className="w-full p-3 bg-surface-secondary border border-border-subtle rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-foreground-secondary">کد ملی ۱۰ رقمی *</label>
                                <input
                                    type="text"
                                    maxLength={10}
                                    value={formData.nationalCode}
                                    onChange={(e) => setFormData({ ...formData, nationalCode: toOnlyDigits(e.target.value) })}
                                    placeholder="کد ملی ۱۰ رقمی منطبق با سیم‌کارت"
                                    className="w-full p-3 bg-surface-secondary border border-border-subtle rounded-xl text-xs font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
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
                                        <label className="text-xs font-bold text-foreground-secondary">شناسه صنفی ۱۰ رقمی اصناف *</label>
                                        <input
                                            type="text"
                                            maxLength={10}
                                            value={formData.guildCode}
                                            onChange={(e) => setFormData({ ...formData, guildCode: toOnlyDigits(e.target.value) })}
                                            placeholder="شناسه ۱۰ رقمی پروانه کسب اصناف"
                                            className="w-full p-3 bg-surface-secondary border border-border-subtle rounded-xl text-xs font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-foreground-secondary">شماره پروانه کسب (اختیاری)</label>
                                        <input
                                            type="text"
                                            value={formData.licenseNumber}
                                            onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                                            placeholder="شماره مجوز ثبت اتحادیه"
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
                                <label className="text-xs font-bold text-foreground-secondary">شماره تماس مستقیم</label>
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
                                <span className="font-black block mb-0.5">احراز هویت هوشمند:</span>
                                {agentType === "CONSULTANT" ? (
                                    <span>
                                        کد ملی وارد شده با شماره همراه ثبت‌نامی شما در سامانه شاهکار تطبیق داده خواهد شد تا از صحت مالکیت و هویت مشاور اطمینان حاصل شود.
                                    </span>
                                ) : (
                                    <span>
                                        شناسه صنفی ۱۰ رقمی دفتر املاک به‌صورت برخط با پایگاه دبیرخانه هیات عالی نظارت بر سازمان‌های صنفی کشور تطبیق داده می‌شود.
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-2 flex items-center justify-between gap-4">
                            {(isReapplying || isEditing) && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsReapplying(false);
                                        setIsEditing(false);
                                    }}
                                    className="py-3 px-5 border border-border-subtle rounded-xl text-xs font-bold text-foreground-secondary hover:bg-surface-secondary"
                                >
                                    انصراف
                                </button>
                            )}

                            <button
                                type="submit"
                                disabled={isSaving}
                                className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition-colors shadow-sm flex items-center justify-center gap-2"
                            >
                                {isSaving ? (
                                    <span>در حال اعتبارسنجی و ثبت تغییرات...</span>
                                ) : isEditing ? (
                                    <>
                                        <FileCheck className="w-4 h-4" />
                                        <span>بروزرسانی مشخصات درخواست املاک</span>
                                    </>
                                ) : (
                                    <>
                                        <FileCheck className="w-4 h-4" />
                                        <span>ثبت نهایی درخواست عضویت و استعلام هویت</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>

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
        </div>
    );
}
