"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { agencyService } from "@/services/agency.service";
import { useCities } from "@/hooks/useGeo";
import {
    Award,
    Building2,
    CheckCircle,
    Clock,
    FileCheck,
    Info,
    Phone,
    ShieldCheck,
    UserCheck,
    XCircle,
    ArrowRight,
    MapPin,
    AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AgentApplicationType, ApplyAgentRequest } from "@/types/api/agency.types";
import { CityItem } from "@/types/api/geo.types";
import { normalizeApiError } from "@/lib/api/error-handler";

export default function AgencyApplyPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { data: citiesData } = useCities({ limit: 100 });

    const [isReapplying, setIsReapplying] = useState(false);
    const [agentType, setAgentType] = useState<AgentApplicationType>("CONSULTANT");

    const [formData, setFormData] = useState({
        applicantName: "",
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

    // Check existing application
    const {
        data: myApp,
        isLoading: isAppLoading,
        refetch: refetchMyApp,
    } = useQuery({
        queryKey: ["agency", "my-application"],
        queryFn: () => agencyService.getMyApplication(),
    });

    const submitMutation = useMutation({
        mutationFn: (payload: ApplyAgentRequest) => agencyService.applyForAgent(payload),
        onSuccess: () => {
            toast.success("درخواست شما با موفقیت ثبت شد و در صف بررسی کارشناسان قرار گرفت.");
            setIsReapplying(false);
            queryClient.invalidateQueries({ queryKey: ["agency", "my-application"] });
        },
        onError: (err: Error) => {
            toast.error(normalizeApiError(err, "خطا در ثبت درخواست. لطفاً اطلاعات ورودی را بررسی نمایید."));
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.applicantName.trim()) {
            toast.error("لطفاً نام و نام خانوادگی متقاضی را وارد کنید.");
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

        const payload: ApplyAgentRequest = {
            agentType,
            applicantName: formData.applicantName.trim(),
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

        submitMutation.mutate(payload);
    };

    const cities = citiesData?.items || citiesData?.cities || [];

    return (
        <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8" dir="rtl">
            <div className="max-w-3xl mx-auto space-y-8">
                {/* Top Header */}
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-blue-600 text-xs font-black">
                            <ShieldCheck className="w-4 h-4" />
                            <span>سامانه هوشمند احراز هویت مشاوران و دفاتر املاک</span>
                        </div>
                        <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                            درخواست ارتقا به حساب کارشناس یا دفتر املاک
                        </h1>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed">
                            با عضویت در ملک‌تودی، صاحب صفحه اختصاصی ویترین املاک خود شوید، آگهی و پست منتشر کنید و مستقیماً از کاربران پیام بگیرید.
                        </p>
                    </div>

                    <Link
                        href="/"
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors shrink-0 w-fit"
                    >
                        <span>صفحه اصلی</span>
                        <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                    </Link>
                </div>

                {/* Status Box if User Already Applied */}
                {!isAppLoading && myApp && !isReapplying && (
                    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                            {myApp.status === "PENDING" && (
                                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                                    <Clock className="w-6 h-6" />
                                </div>
                            )}
                            {myApp.status === "APPROVED" && (
                                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                                    <CheckCircle className="w-6 h-6" />
                                </div>
                            )}
                            {myApp.status === "REJECTED" && (
                                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                                    <XCircle className="w-6 h-6" />
                                </div>
                            )}

                            <div>
                                <h3 className="text-base font-black text-slate-900">
                                    وضعیت آخرین درخواست شما:{" "}
                                    <span className={
                                        myApp.status === "PENDING"
                                            ? "text-amber-600"
                                            : myApp.status === "APPROVED"
                                            ? "text-emerald-600"
                                            : "text-rose-600"
                                    }>
                                        {myApp.status === "PENDING" && "در انتظار بررسی توسط مدیریت"}
                                        {myApp.status === "APPROVED" && "تأیید شده و حساب شما ارتقا یافت"}
                                        {myApp.status === "REJECTED" && "رد شده"}
                                    </span>
                                </h3>
                                <p className="text-xs text-slate-500 font-medium">
                                    ثبت شده برای: {myApp.agentType === "AGENCY" ? "دفتر املاک" : "مشاور املاک"} در تاریخ{" "}
                                    {new Date(myApp.createdAt).toLocaleDateString("fa-IR")}
                                </p>
                            </div>
                        </div>

                        {/* Details summary */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                            <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                                <span className="text-slate-400 font-bold block">نام متقاضی:</span>
                                <span className="font-bold text-slate-900">{myApp.applicantName}</span>
                            </div>
                            {myApp.agencyName && (
                                <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                                    <span className="text-slate-400 font-bold block">نام دفتر املاک:</span>
                                    <span className="font-bold text-slate-900">{myApp.agencyName}</span>
                                </div>
                            )}
                            <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                                <span className="text-slate-400 font-bold block">کد ملی:</span>
                                <span className="font-mono font-bold text-slate-900">{myApp.nationalCode}</span>
                            </div>
                            {myApp.guildCode && (
                                <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                                    <span className="text-slate-400 font-bold block">شناسه صنفی:</span>
                                    <span className="font-mono font-bold text-slate-900">{myApp.guildCode}</span>
                                </div>
                            )}
                        </div>

                        {/* Admin note if rejected */}
                        {myApp.status === "REJECTED" && myApp.adminNote && (
                            <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl space-y-1 text-xs text-rose-900">
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
                                <div className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                                    <Info className="w-4 h-4 text-amber-500" />
                                    <span>درخواست شما در اسرع وقت بررسی خواهد شد. برای پیگیری نیازی به ارسال مجدد نیست.</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Application Form */}
                {(!myApp || isReapplying) && (
                    <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
                        {/* Step 1: Select Agent Type */}
                        <div className="space-y-3">
                            <label className="text-xs font-black text-slate-700 block">
                                انتخاب نوع نقش درخواستی:
                            </label>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div
                                    onClick={() => setAgentType("CONSULTANT")}
                                    className={`p-5 rounded-2xl border-2 cursor-pointer transition-all space-y-2 ${
                                        agentType === "CONSULTANT"
                                            ? "border-blue-600 bg-blue-50/40 shadow-xs"
                                            : "border-slate-200 hover:border-slate-300 bg-white"
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="w-10 h-10 rounded-xl bg-blue-100/70 text-blue-700 flex items-center justify-center font-bold">
                                            <Award className="w-5 h-5" />
                                        </div>
                                        <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                            agentType === "CONSULTANT" ? "border-blue-600 bg-blue-600" : "border-slate-300"
                                        }`}>
                                            {agentType === "CONSULTANT" && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                                        </span>
                                    </div>
                                    <h3 className="text-sm font-black text-slate-900">مشاور املاک مستقل</h3>
                                    <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                                        مخصوص کارشناسان و مشاورین ملکی بدون نیاز به دفتر فیزیکی. احراز هویت با تطبیق کدملی و سامانه شاهکار جیبیت انجام می‌پذیرد.
                                    </p>
                                </div>

                                <div
                                    onClick={() => setAgentType("AGENCY")}
                                    className={`p-5 rounded-2xl border-2 cursor-pointer transition-all space-y-2 ${
                                        agentType === "AGENCY"
                                            ? "border-purple-600 bg-purple-50/40 shadow-xs"
                                            : "border-slate-200 hover:border-slate-300 bg-white"
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="w-10 h-10 rounded-xl bg-purple-100/70 text-purple-700 flex items-center justify-center font-bold">
                                            <Building2 className="w-5 h-5" />
                                        </div>
                                        <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                            agentType === "AGENCY" ? "border-purple-600 bg-purple-600" : "border-slate-300"
                                        }`}>
                                            {agentType === "AGENCY" && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                                        </span>
                                    </div>
                                    <h3 className="text-sm font-black text-slate-900">دفتر / آژانس معاملات ملکی</h3>
                                    <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                                        مخصوص بنگاه‌ها و دفاتر رسمی دارای پروانه کسب. احراز هویت با شناسه صنفی ۱۰ رقمی اصناف جیبیت صورت می‌گیرد.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Step 2: Form Inputs */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700">نام و نام خانوادگی متقاضی *</label>
                                <input
                                    type="text"
                                    value={formData.applicantName}
                                    onChange={(e) => setFormData({ ...formData, applicantName: e.target.value })}
                                    placeholder="مثال: علی احمدی"
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700">کد ملی ۱۰ رقمی *</label>
                                <input
                                    type="text"
                                    maxLength={10}
                                    value={formData.nationalCode}
                                    onChange={(e) => setFormData({ ...formData, nationalCode: e.target.value.replace(/\D/g, "") })}
                                    placeholder="کد ملی ۱۰ رقمی منطبق با سیم‌کارت"
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    required
                                />
                            </div>

                            {agentType === "AGENCY" && (
                                <>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700">نام دفتر املاک *</label>
                                        <input
                                            type="text"
                                            value={formData.agencyName}
                                            onChange={(e) => setFormData({ ...formData, agencyName: e.target.value })}
                                            placeholder="مثال: املاک رویال نیاوران"
                                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700">شناسه صنفی ۱۰ رقمی اصناف *</label>
                                        <input
                                            type="text"
                                            maxLength={10}
                                            value={formData.guildCode}
                                            onChange={(e) => setFormData({ ...formData, guildCode: e.target.value.replace(/\D/g, "") })}
                                            placeholder="شناسه ۱۰ رقمی پروانه کسب اصناف"
                                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700">شماره پروانه کسب (اختیاری)</label>
                                        <input
                                            type="text"
                                            value={formData.licenseNumber}
                                            onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                                            placeholder="شماره مجوز ثبت اتحادیه"
                                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                        />
                                    </div>
                                </>
                            )}

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700">شهر محل فعالیت *</label>
                                <select
                                    value={formData.cityId}
                                    onChange={(e) => setFormData({ ...formData, cityId: e.target.value })}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    required
                                >
                                    <option value="">انتخاب شهر...</option>
                                    {cities.map((city: CityItem) => (
                                        <option key={city.id} value={city.id}>
                                            {city.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700">شماره تماس مستقیم</label>
                                <input
                                    type="text"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="تلفن ثابت یا همراه پشتیبان"
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700">سابقه فعالیت ملکی (سال)</label>
                                <input
                                    type="number"
                                    min={0}
                                    max={60}
                                    value={formData.experienceYears}
                                    onChange={(e) => setFormData({ ...formData, experienceYears: Number(e.target.value) })}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                            </div>

                            <div className="space-y-1.5 sm:col-span-2">
                                <label className="text-xs font-bold text-slate-700">آدرس دقیق {agentType === "AGENCY" ? "دفتر املاک" : "محل استقرار"}</label>
                                <input
                                    type="text"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    placeholder="استان، شهر، خیابان، پلاک، طبقه و واحد..."
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                            </div>

                            <div className="space-y-1.5 sm:col-span-2">
                                <label className="text-xs font-bold text-slate-700">بیوگرافی، تخصص‌ها یا توضیحات تکمیلی</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={3}
                                    placeholder="توضیحاتی پیرامون مناطق تخصصی فعالیت، پروژه‌ها و سوابق کاری..."
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                            </div>
                        </div>

                        {/* KYC Notice Box */}
                        <div className="p-4 bg-blue-50/60 border border-blue-100 rounded-2xl flex items-start gap-3">
                            <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                            <div className="text-xs text-blue-900 leading-relaxed">
                                <span className="font-black block mb-0.5">احراز هویت هوشمند از طریق درگاه جیبیت (Jibit):</span>
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
                            {isReapplying && (
                                <button
                                    type="button"
                                    onClick={() => setIsReapplying(false)}
                                    className="py-3 px-5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
                                >
                                    انصراف
                                </button>
                            )}

                            <button
                                type="submit"
                                disabled={submitMutation.isPending}
                                className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition-colors shadow-sm flex items-center justify-center gap-2"
                            >
                                {submitMutation.isPending ? (
                                    <span>در حال اعتبارسنجی و ثبت درخواست...</span>
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
        </div>
    );
}
