"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService } from "@/services/admin.service";
import {
    Building2,
    UserCheck,
    Clock,
    CheckCircle,
    XCircle,
    Search,
    Filter,
    Eye,
    ShieldAlert,
    ExternalLink,
    RefreshCw,
    AlertCircle,
    FileCheck2,
    ToggleLeft,
    ToggleRight,
    Award,
    Briefcase,
    Phone,
    MapPin,
} from "lucide-react";
import { toast } from "sonner";
import { AgentApplicationResponse, AgencyFull } from "@/types/api/agency.types";
import { normalizeApiError } from "@/lib/api/error-handler";
import { getMediaUrl } from "@/lib/utils";

export default function AdminAgenciesPage() {
    const queryClient = useQueryClient();
    const [currentTab, setCurrentTab] = useState<"applications" | "agencies">("applications");

    // Applications filters
    const [appStatus, setAppStatus] = useState<string>("ALL");
    const [appType, setAppType] = useState<string>("ALL");
    const [selectedApp, setSelectedApp] = useState<AgentApplicationResponse | null>(null);
    const [adminNote, setAdminNote] = useState<string>("");

    // Agencies filters
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [agencyTypeFilter, setAgencyTypeFilter] = useState<string>("ALL");

    // Queries
    const {
        data: applicationsData,
        isLoading: isAppsLoading,
        refetch: refetchApps,
        isFetching: isAppsFetching,
    } = useQuery({
        queryKey: ["admin", "agency-applications", appStatus, appType],
        queryFn: () =>
            adminService.listAgencyApplications({
                status: appStatus === "ALL" ? undefined : appStatus,
                agentType: appType === "ALL" ? undefined : appType,
            }),
    });

    const {
        data: agenciesData,
        isLoading: isAgenciesLoading,
        refetch: refetchAgencies,
        isFetching: isAgenciesFetching,
    } = useQuery({
        queryKey: ["admin", "agencies", agencyTypeFilter, searchQuery],
        queryFn: () =>
            adminService.listAdminAgencies({
                agencyType: agencyTypeFilter === "ALL" ? undefined : agencyTypeFilter,
                search: searchQuery.trim() || undefined,
            }),
    });

    // Review application mutation
    const reviewMutation = useMutation({
        mutationFn: ({ id, status, adminNote, rejectionReason }: { id: string; status: "APPROVED" | "REJECTED"; adminNote?: string; rejectionReason?: string }) =>
            adminService.reviewAgencyApplication(id, {
                status,
                adminNote: adminNote || rejectionReason,
                rejectionReason: rejectionReason || adminNote,
            }),
        onSuccess: (_, vars) => {
            toast.success(vars.status === "APPROVED" ? "درخواست با موفقیت تأیید و عامل فعال گردید." : "درخواست رد شد.");
            setSelectedApp(null);
            setAdminNote("");
            queryClient.invalidateQueries({ queryKey: ["admin", "agency-applications"] });
            queryClient.invalidateQueries({ queryKey: ["admin", "agencies"] });
        },
        onError: (err: Error) => {
            toast.error(normalizeApiError(err, "خطا در ثبت بررسی درخواست."));
        },
    });

    // Toggle active status mutation
    const toggleActiveMutation = useMutation({
        mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
            adminService.setAgencyActiveStatus(id, isActive),
        onSuccess: (_, vars) => {
            toast.success(vars.isActive ? "املاک فعال شد." : "املاک با موفقیت معلق (Suspend) گردید.");
            queryClient.invalidateQueries({ queryKey: ["admin", "agencies"] });
        },
        onError: (err: Error) => {
            toast.error(normalizeApiError(err, "خطا در تغییر وضعیت املاک."));
        },
    });

    const applications: AgentApplicationResponse[] = applicationsData || [];
    const agencies = agenciesData?.items || [];

    return (
        <div className="space-y-6" dir="rtl">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-surface p-6 rounded-3xl border border-border-subtle/80 shadow-xs">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-info-subtle text-info flex items-center justify-center">
                        <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-foreground">
                            مدیریت دفاتر املاک و مشاوران
                        </h1>
                        <p className="text-xs font-medium text-foreground-muted mt-0.5">
                            بررسی درخواست‌های عضویت، احراز هویت با جیبیت، و نظارت بر ویترین دفاتر و مشاورین
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => {
                            if (currentTab === "applications") refetchApps();
                            else refetchAgencies();
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-surface-secondary hover:bg-slate-200 text-foreground-secondary rounded-xl text-xs font-bold transition-colors"
                    >
                        <RefreshCw className={`w-4 h-4 ${isAppsFetching || isAgenciesFetching ? "animate-spin text-info" : ""}`} />
                        <span>بروزرسانی</span>
                    </button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 p-1.5 bg-surface-secondary/80 rounded-2xl border border-border-subtle/80 w-fit max-w-full">
                <button
                    type="button"
                    onClick={() => setCurrentTab("applications")}
                    className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all ${
                        currentTab === "applications"
                            ? "bg-surface text-foreground shadow-sm ring-1 ring-slate-200"
                            : "text-foreground-secondary hover:text-foreground hover:bg-surface/50"
                    }`}
                >
                    <UserCheck className="w-4 h-4 text-info" />
                    <span>درخواست‌های عضویت ({applications.length})</span>
                </button>

                <button
                    type="button"
                    onClick={() => setCurrentTab("agencies")}
                    className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all ${
                        currentTab === "agencies"
                            ? "bg-surface text-foreground shadow-sm ring-1 ring-slate-200"
                            : "text-foreground-secondary hover:text-foreground hover:bg-surface/50"
                    }`}
                >
                    <Briefcase className="w-4 h-4 text-indigo-600" />
                    <span>املاک و مشاوران ثبت‌شده ({agencies.length})</span>
                </button>
            </div>

            {/* TAB 1: APPLICATIONS */}
            {currentTab === "applications" && (
                <div className="space-y-4">
                    {/* Filters Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-4 bg-surface p-4 rounded-2xl border border-border-subtle/80 shadow-xs">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-bold text-foreground-muted ml-1">وضعیت:</span>
                            {["ALL", "PENDING", "APPROVED", "REJECTED"].map((st) => (
                                <button
                                    key={st}
                                    type="button"
                                    onClick={() => setAppStatus(st)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                                        appStatus === st
                                            ? "bg-blue-600 text-white"
                                            : "bg-surface-secondary text-foreground-secondary hover:bg-slate-200"
                                    }`}
                                >
                                    {st === "ALL" && "همه"}
                                    {st === "PENDING" && "در انتظار بررسی"}
                                    {st === "APPROVED" && "تأیید شده"}
                                    {st === "REJECTED" && "رد شده"}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-foreground-muted ml-1">نوع:</span>
                            {["ALL", "CONSULTANT", "AGENCY"].map((tp) => (
                                <button
                                    key={tp}
                                    type="button"
                                    onClick={() => setAppType(tp)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                                        appType === tp
                                            ? "bg-slate-800 text-white"
                                            : "bg-surface-secondary text-foreground-secondary hover:bg-slate-200"
                                    }`}
                                >
                                    {tp === "ALL" && "همه"}
                                    {tp === "CONSULTANT" && "مشاور املاک"}
                                    {tp === "AGENCY" && "دفتر املاک"}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Table */}
                    {isAppsLoading ? (
                        <div className="bg-surface p-12 rounded-3xl border border-border-subtle/80 text-center">
                            <RefreshCw className="w-8 h-8 text-info animate-spin mx-auto mb-3" />
                            <p className="text-sm font-bold text-foreground-secondary">در حال دریافت درخواست‌ها...</p>
                        </div>
                    ) : applications.length === 0 ? (
                        <div className="bg-surface rounded-3xl border border-border-subtle/80 p-16 text-center">
                            <Clock className="w-12 h-12 text-foreground-muted mx-auto mb-3" />
                            <h3 className="text-base font-bold text-foreground">هیچ درخواستی با این فیلتر یافت نشد</h3>
                            <p className="text-xs text-foreground-muted mt-1">درخواست‌های جدید کاربران برای تبدیل شدن به مشاور یا دفتر املاک در اینجا نمایش داده می‌شوند.</p>
                        </div>
                    ) : (
                        <div className="bg-surface rounded-3xl border border-border-subtle/80 overflow-hidden shadow-xs">
                            <div className="overflow-x-auto">
                                <table className="w-full text-right text-xs">
                                    <thead className="bg-surface-secondary/80 border-b border-border-subtle text-foreground-muted font-bold">
                                        <tr>
                                            <th className="py-4 px-6">نام متقاضی / املاک</th>
                                            <th className="py-4 px-6">نوع عامل</th>
                                            <th className="py-4 px-6">کدملی / شناسه صنفی</th>
                                            <th className="py-4 px-6">شماره تماس</th>
                                            <th className="py-4 px-6">استعلام هویت جیبیت</th>
                                            <th className="py-4 px-6">وضعیت</th>
                                            <th className="py-4 px-6 text-left">عملیات</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-foreground-secondary">
                                        {applications.map((app) => (
                                            <tr key={app.id} className="hover:bg-surface-secondary/50 transition-colors">
                                                <td className="py-4 px-6">
                                                    <div className="font-bold text-foreground">{app.fullName}</div>
                                                    {app.agencyName && (
                                                        <div className="text-[11px] text-info font-medium">{app.agencyName}</div>
                                                    )}
                                                </td>
                                                <td className="py-4 px-6">
                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold ${
                                                        app.agentType === "AGENCY"
                                                            ? "bg-purple-50 text-purple-700"
                                                            : "bg-info-subtle text-info"
                                                    }`}>
                                                        {app.agentType === "AGENCY" ? <Building2 className="w-3 h-3" /> : <Award className="w-3 h-3" />}
                                                        <span>{app.agentType === "AGENCY" ? "دفتر املاک" : "مشاور املاک"}</span>
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6 font-mono text-foreground-secondary">
                                                    <div>کدملی: {app.nationalCode}</div>
                                                    {app.guildCode && <div className="text-[11px] text-foreground-muted">صنفی: {app.guildCode}</div>}
                                                </td>
                                                <td className="py-4 px-6 text-foreground-secondary font-mono">
                                                    {app.phone || "-"}
                                                </td>
                                                <td className="py-4 px-6">
                                                    {(() => {
                                                        const kyc = app.kycDetails || app.jibitVerificationData;
                                                        if (kyc?.matched !== undefined) {
                                                            return kyc.matched ? (
                                                                <span className="inline-flex items-center gap-1 text-success font-bold text-[11px]">
                                                                    <CheckCircle className="w-3.5 h-3.5" />
                                                                    <span>تطابق شاهکار تأیید</span>
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 text-error font-bold text-[11px]">
                                                                    <XCircle className="w-3.5 h-3.5" />
                                                                    <span>عدم تطابق کدملی</span>
                                                                </span>
                                                            );
                                                        }
                                                        if (kyc?.corporation) {
                                                            return (
                                                                <span className="inline-flex items-center gap-1 text-success font-bold text-[11px]">
                                                                    <CheckCircle className="w-3.5 h-3.5" />
                                                                    <span>اصناف استعلام شد</span>
                                                                </span>
                                                            );
                                                        }
                                                        return <span className="text-foreground-muted text-[11px]">-</span>;
                                                    })()}
                                                </td>
                                                <td className="py-4 px-6">
                                                    {app.status === "PENDING" && (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-warning-subtle text-warning font-bold text-[11px]">
                                                            <Clock className="w-3 h-3" />
                                                            <span>در انتظار بررسی</span>
                                                        </span>
                                                    )}
                                                    {app.status === "APPROVED" && (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-success-subtle text-success font-bold text-[11px]">
                                                            <CheckCircle className="w-3 h-3" />
                                                            <span>تأیید شده</span>
                                                        </span>
                                                    )}
                                                    {app.status === "REJECTED" && (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-error-subtle text-error font-bold text-[11px]">
                                                            <XCircle className="w-3 h-3" />
                                                            <span>رد شده</span>
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-4 px-6 text-left">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedApp(app);
                                                            setAdminNote(app.adminNote || "");
                                                        }}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-secondary hover:bg-slate-200 text-foreground rounded-lg text-xs font-bold transition-colors"
                                                    >
                                                        <Eye className="w-3.5 h-3.5" />
                                                        <span>بررسی کامل</span>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* TAB 2: REGISTERED AGENCIES */}
            {currentTab === "agencies" && (
                <div className="space-y-4">
                    {/* Search & Filters */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-surface p-4 rounded-2xl border border-border-subtle/80 shadow-xs">
                        <div className="relative w-full sm:w-80">
                            <Search className="w-4 h-4 text-foreground-muted absolute right-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="جستجو بر اساس نام، شماره یا کد صنفی..."
                                className="w-full pl-3 pr-9 py-2 bg-surface-secondary border border-border-subtle rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            />
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <span className="text-xs font-bold text-foreground-muted">نوع:</span>
                            {["ALL", "AGENCY", "CONSULTANT"].map((tp) => (
                                <button
                                    key={tp}
                                    type="button"
                                    onClick={() => setAgencyTypeFilter(tp)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                                        agencyTypeFilter === tp
                                            ? "bg-blue-600 text-white"
                                            : "bg-surface-secondary text-foreground-secondary hover:bg-slate-200"
                                    }`}
                                >
                                    {tp === "ALL" && "همه"}
                                    {tp === "AGENCY" && "دفاتر املاک"}
                                    {tp === "CONSULTANT" && "مشاورین املاک"}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Agencies Table */}
                    {isAgenciesLoading ? (
                        <div className="bg-surface p-12 rounded-3xl border border-border-subtle/80 text-center">
                            <RefreshCw className="w-8 h-8 text-info animate-spin mx-auto mb-3" />
                            <p className="text-sm font-bold text-foreground-secondary">در حال دریافت لیست املاک...</p>
                        </div>
                    ) : agencies.length === 0 ? (
                        <div className="bg-surface rounded-3xl border border-border-subtle/80 p-16 text-center">
                            <Briefcase className="w-12 h-12 text-foreground-muted mx-auto mb-3" />
                            <h3 className="text-base font-bold text-foreground">هیچ املاکی یافت نشد</h3>
                            <p className="text-xs text-foreground-muted mt-1">دفاتر و مشاورین املاک تأیید شده در این بخش فهرست می‌شوند.</p>
                        </div>
                    ) : (
                        <div className="bg-surface rounded-3xl border border-border-subtle/80 overflow-hidden shadow-xs">
                            <div className="overflow-x-auto">
                                <table className="w-full text-right text-xs">
                                    <thead className="bg-surface-secondary/80 border-b border-border-subtle text-foreground-muted font-bold">
                                        <tr>
                                            <th className="py-4 px-6">عنوان املاک / مشاور</th>
                                            <th className="py-4 px-6">نوع عامل</th>
                                            <th className="py-4 px-6">کد صنفی / ملی</th>
                                            <th className="py-4 px-6">تماس</th>
                                            <th className="py-4 px-6">وضعیت تأییدیه</th>
                                            <th className="py-4 px-6">وضعیت فعالیت</th>
                                            <th className="py-4 px-6 text-left">عملیات</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-foreground-secondary">
                                        {agencies.map((agency: AgencyFull) => (
                                            <tr key={agency.id} className="hover:bg-surface-secondary/50 transition-colors">
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-xl bg-surface-secondary border border-border-subtle flex items-center justify-center font-bold text-foreground-secondary shrink-0 overflow-hidden">
                                                            {agency.logoUrl ? (
                                                                <img src={getMediaUrl(agency.logoUrl)} alt={agency.agencyName} className="w-full h-full object-cover" />
                                                            ) : (
                                                                agency.agencyName?.slice(0, 1) || "A"
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-foreground">{agency.agencyName}</div>
                                                            {agency.slug && <div className="text-[11px] text-foreground-muted font-mono">@{agency.slug}</div>}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold ${
                                                        agency.agencyType === "AGENCY"
                                                            ? "bg-purple-50 text-purple-700"
                                                            : "bg-info-subtle text-info"
                                                    }`}>
                                                        {agency.agencyType === "AGENCY" ? "دفتر املاک" : "مشاور املاک"}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6 font-mono text-foreground-muted">
                                                    {agency.guildCode ? `صنف: ${agency.guildCode}` : agency.nationalCode ? `ملی: ${agency.nationalCode}` : "-"}
                                                </td>
                                                <td className="py-4 px-6 text-foreground-secondary font-mono">
                                                    {agency.mobile || agency.phone || "-"}
                                                </td>
                                                <td className="py-4 px-6">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                                                        agency.verificationStatus === "VERIFIED"
                                                            ? "bg-success-subtle text-success"
                                                            : "bg-warning-subtle text-warning"
                                                    }`}>
                                                        {agency.verificationStatus === "VERIFIED" ? "تأیید رسمی" : "در انتظار تأیید"}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleActiveMutation.mutate({ id: agency.id, isActive: !agency.isActive })}
                                                        disabled={toggleActiveMutation.isPending}
                                                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition-colors ${
                                                            agency.isActive
                                                                ? "bg-success-subtle text-success hover:bg-success-subtle"
                                                                : "bg-error-subtle text-error hover:bg-error-subtle"
                                                        }`}
                                                    >
                                                        {agency.isActive ? <ToggleRight className="w-4 h-4 text-success" /> : <ToggleLeft className="w-4 h-4 text-error" />}
                                                        <span>{agency.isActive ? "فعال" : "معلق"}</span>
                                                    </button>
                                                </td>
                                                <td className="py-4 px-6 text-left">
                                                    <Link
                                                        href={`/agency/showcase/${agency.slug || agency.id}`}
                                                        target="_blank"
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-surface-secondary hover:bg-slate-200 text-foreground-secondary rounded-lg text-xs font-bold transition-colors"
                                                    >
                                                        <ExternalLink className="w-3.5 h-3.5" />
                                                        <span>مشاهده ویترین</span>
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Application Detail & Review Modal */}
            {selectedApp && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-surface rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl border border-border-subtle my-8">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between border-b border-border-subtle pb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-info-subtle text-info flex items-center justify-center font-bold">
                                    <FileCheck2 className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-foreground">
                                        بررسی درخواست عضویت {selectedApp.agentType === "AGENCY" ? "دفتر املاک" : "مشاور املاک"}
                                    </h3>
                                    <p className="text-xs text-foreground-muted font-medium">
                                        ثبت شده در {new Date(selectedApp.createdAt).toLocaleDateString("fa-IR")}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedApp(null)}
                                className="w-8 h-8 rounded-full bg-surface-secondary text-foreground-muted hover:bg-slate-200 flex items-center justify-center font-bold"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            <div className="p-3 bg-surface-secondary rounded-xl space-y-1">
                                <span className="text-foreground-muted font-bold block">نام متقاضی:</span>
                                <span className="font-bold text-foreground text-sm">{selectedApp.fullName}</span>
                            </div>

                            <div className="p-3 bg-surface-secondary rounded-xl space-y-1">
                                <span className="text-foreground-muted font-bold block">نام دفتر املاک:</span>
                                <span className="font-bold text-foreground text-sm">{selectedApp.agencyName || "-"}</span>
                            </div>

                            <div className="p-3 bg-surface-secondary rounded-xl space-y-1">
                                <span className="text-foreground-muted font-bold block">کد ملی:</span>
                                <span className="font-mono font-bold text-foreground">{selectedApp.nationalCode}</span>
                            </div>

                            <div className="p-3 bg-surface-secondary rounded-xl space-y-1">
                                <span className="text-foreground-muted font-bold block">شناسه صنفی اصناف:</span>
                                <span className="font-mono font-bold text-foreground">{selectedApp.guildCode || "-"}</span>
                            </div>

                            <div className="p-3 bg-surface-secondary rounded-xl space-y-1">
                                <span className="text-foreground-muted font-bold block">شماره پروانه کسب:</span>
                                <span className="font-mono font-bold text-foreground">{selectedApp.licenseNumber || "-"}</span>
                            </div>

                            <div className="p-3 bg-surface-secondary rounded-xl space-y-1">
                                <span className="text-foreground-muted font-bold block">شماره تماس:</span>
                                <span className="font-mono font-bold text-foreground">{selectedApp.phone || "-"}</span>
                            </div>

                            <div className="p-3 bg-surface-secondary rounded-xl space-y-1 md:col-span-2">
                                <span className="text-foreground-muted font-bold block">آدرس:</span>
                                <span className="text-foreground">{selectedApp.address || "-"}</span>
                            </div>

                            {selectedApp.description && (
                                <div className="p-3 bg-surface-secondary rounded-xl space-y-1 md:col-span-2">
                                    <span className="text-foreground-muted font-bold block">توضیحات و بیوگرافی:</span>
                                    <p className="text-foreground-secondary leading-relaxed">{selectedApp.description}</p>
                                </div>
                            )}
                        </div>

                        {/* Jibit Verification Banner */}
                        <div className="p-4 bg-info-subtle/60 border border-info/30 rounded-2xl space-y-2">
                            <div className="flex items-center gap-2 text-foreground font-bold text-xs">
                                <ShieldAlert className="w-4 h-4 text-info" />
                                <span>نتیجه استعلام احراز هویت هوشمند (سرویس جیبیت):</span>
                            </div>
                            <pre className="text-[11px] font-mono bg-surface p-3 rounded-xl border border-info/30/80 text-foreground-secondary overflow-x-auto">
                                {JSON.stringify(selectedApp.kycDetails || selectedApp.jibitVerificationData || { message: "اطلاعات استعلام ثبت نشده است" }, null, 2)}
                            </pre>
                        </div>

                        {/* Review Action Section */}
                        {selectedApp.status === "PENDING" && (
                            <div className="space-y-4 pt-2 border-t border-border-subtle">
                                <div>
                                    <label className="text-xs font-bold text-foreground-secondary block mb-1.5">
                                        یادداشت ادمین (در صورت رد شدن، برای متقاضی نمایش داده می‌شود):
                                    </label>
                                    <textarea
                                        value={adminNote}
                                        onChange={(e) => setAdminNote(e.target.value)}
                                        rows={3}
                                        placeholder="توضیحات تکمیلی یا علت رد درخواست..."
                                        className="w-full p-3 bg-surface-secondary border border-border-subtle rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    />
                                </div>

                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => reviewMutation.mutate({ id: selectedApp.id, status: "APPROVED" })}
                                        disabled={reviewMutation.isPending}
                                        className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-colors shadow-sm"
                                    >
                                        تأیید درخواست و فعال‌سازی نقش Agent
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => reviewMutation.mutate({ id: selectedApp.id, status: "REJECTED", adminNote })}
                                        disabled={reviewMutation.isPending}
                                        className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black transition-colors shadow-sm"
                                    >
                                        رد درخواست متقاضی
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
