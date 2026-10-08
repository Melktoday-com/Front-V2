"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { agencyService } from "@/services/agency.service";
import { showcaseService } from "@/services/showcase.service";
import {
    FileText,
    Building2,
    Home,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
    ArrowRight,
    RefreshCw,
    UserCheck,
    RotateCcw,
    ChevronLeft,
    Phone,
    MapPin,
    ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toPersianDigits } from "@/lib/utils";

type ActiveTab = "ALL" | "AGENCY" | "HOST";

export default function UserRequestsPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<ActiveTab>("ALL");

    // Fetch agency application
    const {
        data: agencyApp,
        isLoading: isLoadingAgency,
        isFetching: isFetchingAgency,
        refetch: refetchAgency,
    } = useQuery({
        queryKey: ["agency", "my-application"],
        queryFn: async () => {
            try {
                return await agencyService.getMyApplication();
            } catch {
                return null;
            }
        },
        retry: false,
    });

    // Fetch host application
    const {
        data: hostApp,
        isLoading: isLoadingHost,
        isFetching: isFetchingHost,
        refetch: refetchHost,
    } = useQuery({
        queryKey: ["hosts", "my-application"],
        queryFn: async () => {
            try {
                return await showcaseService.getMyHostApplication();
            } catch {
                return null;
            }
        },
        retry: false,
    });

    const isRefreshing = isFetchingAgency || isFetchingHost;
    const isLoading = isLoadingAgency || isLoadingHost;

    const handleRefreshAll = () => {
        refetchAgency();
        refetchHost();
    };

    const hasAnyRequests = Boolean(agencyApp || hostApp);

    return (
        <div className="max-w-4xl mx-auto px-4 pt-8 pb-36 lg:pb-8 space-y-6" dir="rtl">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-soft-border shadow-xs">
                <div className="flex items-center gap-3.5">
                    <Link
                        href="/profile"
                        className="p-2.5 rounded-2xl bg-soft-bg hover:bg-soft-border/50 text-secondary transition-colors"
                        title="بازگشت به حساب کاربری"
                    >
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-xl font-black text-brand">درخواست‌های من</h1>
                        <p className="text-xs text-secondary mt-0.5">
                            پیگیری وضعیت درخواست‌های عضویت املاک، دفاتر مشاور و میزبانی اقامتگاه
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleRefreshAll}
                        disabled={isRefreshing}
                        className="p-2.5 text-secondary hover:text-brand hover:bg-soft-bg rounded-2xl border border-soft-border transition"
                        title="بروزرسانی وضعیت"
                    >
                        <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-primary" : ""}`} />
                    </button>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 bg-soft-bg p-1.5 rounded-2xl border border-soft-border w-fit text-xs font-bold">
                <button
                    onClick={() => setActiveTab("ALL")}
                    className={`px-4 py-2 rounded-xl transition-all ${
                        activeTab === "ALL"
                            ? "bg-white text-brand shadow-xs font-black"
                            : "text-secondary hover:text-brand"
                    }`}
                >
                    همه درخواست‌ها
                </button>
                <button
                    onClick={() => setActiveTab("AGENCY")}
                    className={`px-4 py-2 rounded-xl transition-all ${
                        activeTab === "AGENCY"
                            ? "bg-white text-brand shadow-xs font-black"
                            : "text-secondary hover:text-brand"
                    }`}
                >
                    املاک و مشاوران
                </button>
                <button
                    onClick={() => setActiveTab("HOST")}
                    className={`px-4 py-2 rounded-xl transition-all ${
                        activeTab === "HOST"
                            ? "bg-white text-brand shadow-xs font-black"
                            : "text-secondary hover:text-brand"
                    }`}
                >
                    میزبانی اقامتگاه
                </button>
            </div>

            {/* Loading */}
            {isLoading ? (
                <div className="py-20 text-center text-secondary flex flex-col items-center justify-center gap-3">
                    <RefreshCw className="w-8 h-8 animate-spin text-primary" />
                    <span className="text-xs font-bold">در حال دریافت وضعیت درخواست‌ها...</span>
                </div>
            ) : !hasAnyRequests ? (
                /* Empty State */
                <div className="bg-white rounded-3xl p-10 border border-soft-border text-center space-y-6 shadow-xs">
                    <div className="w-16 h-16 rounded-3xl bg-soft-bg text-secondary/40 flex items-center justify-center mx-auto">
                        <FileText className="w-8 h-8" />
                    </div>
                    <div className="space-y-1.5 max-w-md mx-auto">
                        <h3 className="text-base font-black text-brand">هیچ درخواستی ثبت نشده است</h3>
                        <p className="text-xs text-secondary leading-relaxed">
                            شما تاکنون درخواستی جهت عضویت به عنوان مشاور/دفتر املاک یا ثبت میزبانی اقامتگاه‌های روزانه ارسال نکرده‌اید.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                        <Link
                            href="/agency/apply"
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 bg-brand text-white rounded-2xl text-xs font-bold hover:bg-brand/90 transition shadow-xs"
                        >
                            <Building2 className="w-4 h-4 text-primary" />
                            <span>ثبت درخواست مشاور / دفتر املاک</span>
                        </Link>
                        <Link
                            href="/host/apply"
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 bg-soft-bg text-brand hover:bg-soft-border/50 border border-soft-border rounded-2xl text-xs font-bold transition"
                        >
                            <Home className="w-4 h-4 text-emerald-600" />
                            <span>ثبت درخواست میزبانی اقامتگاه</span>
                        </Link>
                    </div>
                </div>
            ) : (
                /* Requests List */
                <div className="space-y-4">
                    {/* Agency Application Card */}
                    {(activeTab === "ALL" || activeTab === "AGENCY") && agencyApp && (
                        <div className="bg-white rounded-3xl border border-soft-border p-6 shadow-xs space-y-5">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-soft-border pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                                        <Building2 className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-sm font-black text-brand">
                                                درخواست عضویت {agencyApp.agentType === "AGENCY" ? "دفتر املاک" : "مشاور املاک"}
                                            </h3>
                                            <span className="text-[10px] font-mono bg-soft-bg px-2 py-0.5 rounded-md text-secondary">
                                                ID: {agencyApp.id.slice(0, 8)}
                                            </span>
                                        </div>
                                        <p className="text-xs text-secondary mt-0.5">
                                            نام متقاضی: {agencyApp.fullName}
                                            {agencyApp.agencyName && ` — ${agencyApp.agencyName}`}
                                        </p>
                                    </div>
                                </div>

                                {/* Status Badge */}
                                <div>
                                    {agencyApp.status === "PENDING" && (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                            <Clock className="w-4 h-4" />
                                            <span>در انتظار بررسی مدیریت</span>
                                        </span>
                                    )}
                                    {agencyApp.status === "APPROVED" && (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                            <CheckCircle2 className="w-4 h-4" />
                                            <span>تایید شده</span>
                                        </span>
                                    )}
                                    {agencyApp.status === "REJECTED" && (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                                            <XCircle className="w-4 h-4" />
                                            <span>رد شده</span>
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-soft-bg/60 p-4 rounded-2xl">
                                <div>
                                    <span className="text-secondary block mb-0.5">کد ملی:</span>
                                    <span className="font-bold text-brand">{toPersianDigits(agencyApp.nationalCode)}</span>
                                </div>
                                {agencyApp.licenseNumber && (
                                    <div>
                                        <span className="text-secondary block mb-0.5">شماره پروانه کسب:</span>
                                        <span className="font-bold text-brand">{toPersianDigits(agencyApp.licenseNumber)}</span>
                                    </div>
                                )}
                                <div>
                                    <span className="text-secondary block mb-0.5">تاریخ ارسال:</span>
                                    <span className="font-bold text-brand">
                                        {new Date(agencyApp.createdAt).toLocaleDateString("fa-IR")}
                                    </span>
                                </div>
                                {agencyApp.reviewedAt && (
                                    <div>
                                        <span className="text-secondary block mb-0.5">تاریخ بررسی:</span>
                                        <span className="font-bold text-brand">
                                            {new Date(agencyApp.reviewedAt).toLocaleDateString("fa-IR")}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Rejection Alert Box */}
                            {agencyApp.status === "REJECTED" && (
                                <div className="bg-red-50/80 border border-red-200 rounded-2xl p-4 space-y-2">
                                    <div className="flex items-center gap-2 text-red-700 font-bold text-xs">
                                        <ShieldAlert className="w-4 h-4" />
                                        <span>علت رد درخواست توسط مدیریت:</span>
                                    </div>
                                    <p className="text-xs text-red-800 leading-relaxed font-medium">
                                        {agencyApp.rejectionReason || "اطلاعات یا مدارک ارسالی با ضوابط سامانه تطابق نداشت."}
                                    </p>
                                    {agencyApp.adminNote && (
                                        <p className="text-[11px] text-red-600 bg-white/70 p-2 rounded-lg border border-red-100">
                                            یادداشت مدیر: {agencyApp.adminNote}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex items-center justify-end gap-3 pt-1">
                                {agencyApp.status === "PENDING" && (
                                    <Link
                                        href="/agency/apply"
                                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-white rounded-xl text-xs font-bold hover:bg-amber-600 transition shadow-sm"
                                    >
                                        <RotateCcw className="w-4 h-4" />
                                        <span>ویرایش درخواست</span>
                                    </Link>
                                )}
                                {agencyApp.status === "REJECTED" && (
                                    <Link
                                        href="/agency/apply"
                                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 transition shadow-sm"
                                    >
                                        <RotateCcw className="w-4 h-4" />
                                        <span>ویرایش و ارسال مجدد درخواست</span>
                                    </Link>
                                )}
                                {agencyApp.status === "APPROVED" && (
                                    <Link
                                        href="/agency"
                                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition shadow-sm"
                                    >
                                        <Building2 className="w-4 h-4" />
                                        <span>ورود به پنل آژانس و مشاوران</span>
                                    </Link>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Host Application Card */}
                    {(activeTab === "ALL" || activeTab === "HOST") && hostApp && (
                        <div className="bg-white rounded-3xl border border-soft-border p-6 shadow-xs space-y-5">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-soft-border pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                                        <Home className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-sm font-black text-brand">درخواست میزبانی اقامتگاه</h3>
                                            <span className="text-[10px] font-mono bg-soft-bg px-2 py-0.5 rounded-md text-secondary">
                                                ID: {hostApp.id.slice(0, 8)}
                                            </span>
                                        </div>
                                        <p className="text-xs text-secondary mt-0.5">
                                            نام میزبان: {hostApp.hostName || hostApp.fullName}
                                        </p>
                                    </div>
                                </div>

                                {/* Status Badge */}
                                <div>
                                    {hostApp.status === "PENDING" && (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                            <Clock className="w-4 h-4" />
                                            <span>در انتظار بررسی مدیریت</span>
                                        </span>
                                    )}
                                    {hostApp.status === "APPROVED" && (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                            <CheckCircle2 className="w-4 h-4" />
                                            <span>تایید شده</span>
                                        </span>
                                    )}
                                    {hostApp.status === "REJECTED" && (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                                            <XCircle className="w-4 h-4" />
                                            <span>رد شده</span>
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-soft-bg/60 p-4 rounded-2xl">
                                <div>
                                    <span className="text-secondary block mb-0.5">تعداد اقامتگاه‌ها:</span>
                                    <span className="font-bold text-brand">
                                        {toPersianDigits(hostApp.propertyCount || 1)} واحد
                                    </span>
                                </div>
                                <div>
                                    <span className="text-secondary block mb-0.5">شماره تماس:</span>
                                    <span className="font-bold text-brand" dir="ltr">
                                        {toPersianDigits(hostApp.mobileNumber)}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-secondary block mb-0.5">تاریخ ارسال:</span>
                                    <span className="font-bold text-brand">
                                        {new Date(hostApp.createdAt).toLocaleDateString("fa-IR")}
                                    </span>
                                </div>
                                {hostApp.reviewedAt && (
                                    <div>
                                        <span className="text-secondary block mb-0.5">تاریخ بررسی:</span>
                                        <span className="font-bold text-brand">
                                            {new Date(hostApp.reviewedAt).toLocaleDateString("fa-IR")}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Rejection Alert Box */}
                            {hostApp.status === "REJECTED" && (
                                <div className="bg-red-50/80 border border-red-200 rounded-2xl p-4 space-y-2">
                                    <div className="flex items-center gap-2 text-red-700 font-bold text-xs">
                                        <ShieldAlert className="w-4 h-4" />
                                        <span>علت رد درخواست میزبانی:</span>
                                    </div>
                                    <p className="text-xs text-red-800 leading-relaxed font-medium">
                                        {hostApp.rejectionReason || "اطلاعات اقامتگاه با ضوابط سامانه میزبانی همخوانی نداشت."}
                                    </p>
                                    {hostApp.adminNote && (
                                        <p className="text-[11px] text-red-600 bg-white/70 p-2 rounded-lg border border-red-100">
                                            یادداشت مدیر: {hostApp.adminNote}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex items-center justify-end gap-3 pt-1">
                                {hostApp.status === "PENDING" && (
                                    <Link
                                        href="/host/apply"
                                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-white rounded-xl text-xs font-bold hover:bg-amber-600 transition shadow-sm"
                                    >
                                        <RotateCcw className="w-4 h-4" />
                                        <span>ویرایش درخواست</span>
                                    </Link>
                                )}
                                {hostApp.status === "REJECTED" && (
                                    <Link
                                        href="/host/apply"
                                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 transition shadow-sm"
                                    >
                                        <RotateCcw className="w-4 h-4" />
                                        <span>ویرایش و ارسال مجدد درخواست</span>
                                    </Link>
                                )}
                                {hostApp.status === "APPROVED" && (
                                    <Link
                                        href="/profile/temporary-rent"
                                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition shadow-sm"
                                    >
                                        <Home className="w-4 h-4" />
                                        <span>ورود به پنل میزبانی اقامتگاه</span>
                                    </Link>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
