"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService } from "@/services/admin.service";
import { HostApplicationResponse } from "@/types/api/admin.types";
import {
  Home,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  Eye,
  RefreshCw,
  AlertCircle,
  Phone,
  User,
  ShieldCheck,
  Building,
  MapPin,
  Calendar,
  X,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { normalizeApiError } from "@/lib/api/error-handler";
import { toPersianDigits } from "@/lib/utils";

export default function AdminHostsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedApp, setSelectedApp] = useState<HostApplicationResponse | null>(null);
  const [rejectModalApp, setRejectModalApp] = useState<HostApplicationResponse | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>("");

  // Fetch host applications
  const { data: rawApps = [], isLoading, isFetching, refetch } = useQuery({
    queryKey: ["admin", "host-applications"],
    queryFn: () => adminService.listHostApplications(),
  });

  const applications: HostApplicationResponse[] = Array.isArray(rawApps) ? rawApps : [];

  // Filtered applications
  const filteredApps = useMemo(() => {
    return applications.filter((app) => {
      const matchesStatus =
        statusFilter === "ALL" || app.status === statusFilter;
      const searchLower = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !searchLower ||
        (app.fullName && app.fullName.toLowerCase().includes(searchLower)) ||
        (app.hostName && app.hostName.toLowerCase().includes(searchLower)) ||
        (app.mobileNumber && app.mobileNumber.includes(searchLower)) ||
        (app.nationalCode && app.nationalCode.includes(searchLower));

      return matchesStatus && matchesSearch;
    });
  }, [applications, statusFilter, searchQuery]);

  // Review mutation
  const reviewMutation = useMutation({
    mutationFn: ({
      id,
      status,
      rejectionReason,
    }: {
      id: string;
      status: "APPROVED" | "REJECTED";
      rejectionReason?: string;
    }) => adminService.reviewHostApplication(id, { status, rejectionReason }),
    onSuccess: (_, vars) => {
      toast.success(
        vars.status === "APPROVED"
          ? "درخواست میزبانی با موفقیت تأیید گردید."
          : "درخواست میزبانی رد شد."
      );
      setSelectedApp(null);
      setRejectModalApp(null);
      setRejectionReason("");
      queryClient.invalidateQueries({ queryKey: ["admin", "host-applications"] });
    },
    onError: (err: Error) => {
      toast.error(normalizeApiError(err, "خطا در بررسی درخواست میزبانی"));
    },
  });

  const handleApprove = (app: HostApplicationResponse) => {
    if (confirm(`آیا از تأیید درخواست میزبانی «${app.fullName}» اطمینان دارید؟`)) {
      reviewMutation.mutate({ id: app.id, status: "APPROVED" });
    }
  };

  const handleRejectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModalApp) return;
    if (!rejectionReason.trim()) {
      toast.error("لطفاً دلیل رد درخواست را وارد نمایید.");
      return;
    }
    reviewMutation.mutate({
      id: rejectModalApp.id,
      status: "REJECTED",
      rejectionReason: rejectionReason.trim(),
    });
  };

  // Status counts
  const pendingCount = applications.filter((a) => a.status === "PENDING").length;
  const approvedCount = applications.filter((a) => a.status === "APPROVED").length;
  const rejectedCount = applications.filter((a) => a.status === "REJECTED").length;

  return (
    <div className="space-y-8" dir="rtl">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-soft-border shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Home className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-brand">
                مدیریت درخواست‌های میزبانی اقامتگاه
              </h1>
              <p className="text-xs text-secondary font-medium mt-1">
                بررسی مدارک، تایید صلاحیت و مدیریت درخواست‌های ثبت اقامتگاه‌های روزانه و بوم‌گردی
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-soft-bg hover:bg-slate-100 text-secondary rounded-xl text-xs font-bold transition-all self-start md:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin text-brand" : ""}`} />
          <span>به‌روزرسانی</span>
        </button>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-soft-border flex items-center justify-between">
          <div>
            <p className="text-xs text-secondary font-bold">کل متقاضیان</p>
            <p className="text-2xl font-black text-brand mt-1">
              {toPersianDigits(applications.length)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-soft-border flex items-center justify-between">
          <div>
            <p className="text-xs text-secondary font-bold">در انتظار بررسی</p>
            <p className="text-2xl font-black text-amber-600 mt-1">
              {toPersianDigits(pendingCount)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-soft-border flex items-center justify-between">
          <div>
            <p className="text-xs text-secondary font-bold">تأیید شده</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">
              {toPersianDigits(approvedCount)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-soft-border flex items-center justify-between">
          <div>
            <p className="text-xs text-secondary font-bold">رد شده</p>
            <p className="text-2xl font-black text-rose-600 mt-1">
              {toPersianDigits(rejectedCount)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <XCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-soft-border flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-soft-bg rounded-xl w-full md:w-auto overflow-x-auto">
          {[
            { key: "ALL", label: "همه" },
            { key: "PENDING", label: `در انتظار (${pendingCount})` },
            { key: "APPROVED", label: "تایید شده" },
            { key: "REJECTED", label: "رد شده" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                statusFilter === tab.key
                  ? "bg-white text-brand shadow-xs"
                  : "text-secondary hover:text-brand"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-secondary/60 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="جستجو با نام، کد ملی یا شماره همراه..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-3 pr-10 py-2 bg-soft-bg border border-transparent focus:border-soft-border focus:bg-white rounded-xl text-xs text-brand font-medium outline-none transition-all placeholder:text-secondary/50"
          />
        </div>
      </div>

      {/* Applications List */}
      {isLoading ? (
        <div className="bg-white p-12 rounded-3xl border border-soft-border text-center">
          <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
          <p className="text-xs text-secondary font-bold">در حال دریافت لیست درخواست‌ها...</p>
        </div>
      ) : filteredApps.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-soft-border text-center">
          <AlertCircle className="w-10 h-10 text-secondary/30 mx-auto mb-3" />
          <p className="text-sm text-secondary font-bold">هیچ درخواستی با مشخصات انتخاب‌شده یافت نشد.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredApps.map((app) => (
            <div
              key={app.id}
              className="bg-white p-6 rounded-3xl border border-soft-border hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-black text-brand line-clamp-1">
                      {app.fullName}
                    </h3>
                    <p className="text-xs text-secondary font-medium mt-0.5">
                      نام اقامتگاه: {app.hostName || "نامشخص"}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black ${
                      app.status === "APPROVED"
                        ? "bg-emerald-50 text-emerald-700"
                        : app.status === "REJECTED"
                        ? "bg-rose-50 text-rose-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {app.status === "APPROVED"
                      ? "تأیید شده"
                      : app.status === "REJECTED"
                      ? "رد شده"
                      : "در انتظار بررسی"}
                  </span>
                </div>

                <div className="pt-2 border-t border-soft-border space-y-2 text-xs text-secondary">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-secondary/60 shrink-0" />
                    <span>شماره همراه:</span>
                    <span className="font-bold text-brand dir-ltr">{app.mobileNumber}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-secondary/60 shrink-0" />
                    <span>کد ملی:</span>
                    <span className="font-bold text-brand">{app.nationalCode}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Building className="w-3.5 h-3.5 text-secondary/60 shrink-0" />
                    <span>تعداد واحدها:</span>
                    <span className="font-bold text-brand">
                      {toPersianDigits(app.propertyCount || 1)} اقامتگاه
                    </span>
                  </div>

                  {app.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-secondary/60 shrink-0 mt-0.5" />
                      <span className="line-clamp-1">{app.address}</span>
                    </div>
                  )}

                  {app.rejectionReason && (
                    <div className="p-2.5 rounded-xl bg-rose-50 text-rose-800 text-[11px] font-medium leading-relaxed">
                      <strong>دلیل رد:</strong> {app.rejectionReason}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-soft-border flex items-center gap-2">
                <button
                  onClick={() => setSelectedApp(app)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-soft-bg hover:bg-slate-100 text-secondary rounded-xl text-xs font-bold transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>مشاهده کامل</span>
                </button>

                {app.status === "PENDING" && (
                  <>
                    <button
                      onClick={() => handleApprove(app)}
                      disabled={reviewMutation.isPending}
                      className="inline-flex items-center justify-center gap-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors"
                      title="تأیید درخواست"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>تایید</span>
                    </button>

                    <button
                      onClick={() => {
                        setRejectModalApp(app);
                        setRejectionReason("");
                      }}
                      disabled={reviewMutation.isPending}
                      className="inline-flex items-center justify-center gap-1 py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition-colors"
                      title="رد درخواست"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>رد</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-soft-border pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Home className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-brand">جزئیات درخواست میزبانی</h3>
                  <p className="text-xs text-secondary font-medium">کد رهگیری: {selectedApp.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                className="w-8 h-8 rounded-full hover:bg-soft-bg text-secondary flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed">
              <div className="grid grid-cols-2 gap-3 p-4 bg-soft-bg rounded-2xl">
                <div>
                  <p className="text-secondary/70 font-medium">نام متقاضی:</p>
                  <p className="font-bold text-brand mt-0.5">{selectedApp.fullName}</p>
                </div>
                <div>
                  <p className="text-secondary/70 font-medium">کد ملی:</p>
                  <p className="font-bold text-brand mt-0.5">{selectedApp.nationalCode}</p>
                </div>
                <div>
                  <p className="text-secondary/70 font-medium">شماره همراه:</p>
                  <p className="font-bold text-brand mt-0.5 dir-ltr text-right">{selectedApp.mobileNumber}</p>
                </div>
                <div>
                  <p className="text-secondary/70 font-medium">نام اقامتگاه:</p>
                  <p className="font-bold text-brand mt-0.5">{selectedApp.hostName || "ثبت‌نشده"}</p>
                </div>
                <div>
                  <p className="text-secondary/70 font-medium">تعداد اقامتگاه‌ها:</p>
                  <p className="font-bold text-brand mt-0.5">{toPersianDigits(selectedApp.propertyCount || 1)} واحد</p>
                </div>
                <div>
                  <p className="text-secondary/70 font-medium">وضعیت احراز هویت:</p>
                  <p className="font-bold text-brand mt-0.5">{selectedApp.kycStatus}</p>
                </div>
              </div>

              {selectedApp.address && (
                <div className="p-3 bg-soft-bg rounded-xl">
                  <p className="text-secondary/70 font-medium mb-1">نشانی اقامتگاه / دفتر:</p>
                  <p className="font-bold text-brand">{selectedApp.address}</p>
                </div>
              )}

              {selectedApp.description && (
                <div className="p-3 bg-soft-bg rounded-xl">
                  <p className="text-secondary/70 font-medium mb-1">توضیحات تکمیلی متقاضی:</p>
                  <p className="text-brand leading-relaxed">{selectedApp.description}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-soft-border">
              <button
                onClick={() => setSelectedApp(null)}
                className="px-4 py-2 bg-soft-bg hover:bg-slate-100 text-secondary rounded-xl text-xs font-bold transition-colors"
              >
                بستن
              </button>
              {selectedApp.status === "PENDING" && (
                <>
                  <button
                    onClick={() => {
                      const app = selectedApp;
                      setSelectedApp(null);
                      setRejectModalApp(app);
                    }}
                    className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition-colors"
                  >
                    رد درخواست
                  </button>
                  <button
                    onClick={() => {
                      handleApprove(selectedApp);
                    }}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors"
                  >
                    تأیید صلاحیت میزبان
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalApp && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleRejectSubmit}
            className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between border-b border-soft-border pb-3">
              <h3 className="text-sm font-black text-rose-700 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-rose-600" />
                رد درخواست میزبانی
              </h3>
              <button
                type="button"
                onClick={() => setRejectModalApp(null)}
                className="w-7 h-7 rounded-full hover:bg-soft-bg text-secondary flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-secondary font-medium">
              شما در حال رد درخواست میزبانی متعلق به «<strong>{rejectModalApp.fullName}</strong>» هستید.
              لطفاً علت رد درخواست را جهت اطلاع متقاضی درج فرمایید:
            </p>

            <textarea
              required
              rows={4}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="مثال: عدم تطابق کد ملی با مدارک ثبتی / نقص در مجوزهای گردشگری..."
              className="w-full p-3 bg-soft-bg border border-soft-border rounded-2xl text-xs text-brand outline-none focus:bg-white focus:border-rose-300 transition-all resize-none"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectModalApp(null)}
                className="px-4 py-2 bg-soft-bg hover:bg-slate-100 text-secondary rounded-xl text-xs font-bold transition-colors"
              >
                انصراف
              </button>
              <button
                type="submit"
                disabled={reviewMutation.isPending}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>ثبت و رد قطعی</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
