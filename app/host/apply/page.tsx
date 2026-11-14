"use client";

import { CitySelector } from "@/components/CitySelector";
import { KycModal, VerifiedKycData } from "@/components/common/KycModal";
import { AccountStatusBanner } from "@/components/ui/AccountStatusBanner";
import { useAuth } from "@/hooks/useAuth";
import { useCityLookup } from "@/hooks/useCityLookup";
import { useUserStatus } from "@/hooks/useUserStatus";
import { normalizeApiError } from "@/lib/api/error-handler";
import { cn, toEnglishDigits, toOnlyDigits, toPersianDigits } from "@/lib/utils";
import { showcaseService } from "@/services/showcase.service";
import { userService } from "@/services/user.service";
import { KYCStatus } from "@/types/api/enums";
import { HostApplicationRequest } from "@/types/api/showcase.types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  Building2,
  CheckCircle,
  CheckCircle2,
  Clock,
  FileCheck,
  Home,
  MapPin,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

export default function HostApplyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoggedIn, isLoading: isAuthLoading } = useAuth();
  const { isRestricted } = useUserStatus();
  const queryClient = useQueryClient();
  const { getCityName } = useCityLookup();

  const [isCitySelectorOpen, setIsCitySelectorOpen] = useState(false);
  const [selectedCityName, setSelectedCityName] = useState("");
  const [isReapplying, setIsReapplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isKycModalOpen, setIsKycModalOpen] = useState(false);

  const [formData, setFormData] = useState<HostApplicationRequest>({
    fullName: "",
    nationalCode: "",
    hostName: "",
    cityId: "",
    mobileNumber: "",
    phone: "",
    address: "",
    propertyCount: 1,
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

  // Autofill user name, mobile and nationalCode from user profile or saved KYC data
  useEffect(() => {
    if (!isLoggedIn) return;

    if (userProfile) {
      const userFullName = `${userProfile.firstName || ""} ${userProfile.lastName || ""}`.trim();
      setFormData((prev) => ({
        ...prev,
        fullName: prev.fullName || userFullName,
        mobileNumber: prev.mobileNumber || userProfile.mobileNumber || "",
      }));
    }

    try {
      const saved = localStorage.getItem("melktoday_verified_kyc");
      if (saved) {
        const parsed = JSON.parse(saved);
        const savedFullName = `${parsed.firstName || ""} ${parsed.lastName || ""}`.trim();
        setFormData((prev) => ({
          ...prev,
          fullName: prev.fullName || savedFullName,
          nationalCode: prev.nationalCode || parsed.nationalCode || "",
        }));
      }
    } catch {}
  }, [isLoggedIn, userProfile]);

  // Check existing landlord application
  const {
    data: myApp,
    isLoading: isAppLoading,
    refetch: refetchMyApp,
  } = useQuery({
    queryKey: ["hosts", "my-application"],
    queryFn: () => showcaseService.getMyHostApplication(),
    enabled: !!isLoggedIn,
  });

  useEffect(() => {
    if (myApp) {
      setFormData((prev) => ({
        ...prev,
        fullName: prev.fullName || myApp.fullName || "",
        nationalCode: prev.nationalCode || myApp.nationalCode || "",
      }));
    }
  }, [myApp]);

  const startEditing = () => {
    if (!myApp) return;
    setFormData({
      fullName: myApp.fullName || "",
      nationalCode: myApp.nationalCode || "",
      hostName: myApp.hostName || "",
      cityId: myApp.cityId || "",
      mobileNumber: myApp.mobileNumber || "",
      phone: myApp.phone || "",
      address: myApp.address || "",
      propertyCount: myApp.propertyCount || 1,
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
    if ((searchParams.get("edit") === "true" || searchParams.get("reapply") === "true") && myApp) {
      startEditing();
    }
  }, [searchParams, myApp]);

  // Handle successful KYC verification from modal
  const handleKycSuccess = (verifiedData: VerifiedKycData) => {
    setFormData((prev) => ({
      ...prev,
      fullName: `${verifiedData.firstName} ${verifiedData.lastName}`.trim(),
      nationalCode: verifiedData.nationalCode,
    }));
    refetchProfile();
    toast.success("احراز هویت شما با موفقیت تکمیل شد. اکنون مشخصات اقامتگاه خود را وارد فرمایید.");
  };

  const submitMutation = useMutation({
    mutationFn: (payload: HostApplicationRequest) => showcaseService.applyForHost(payload),
    onSuccess: () => {
      toast.success("درخواست میزبانی شما با موفقیت ثبت شد و در صف بررسی قرار گرفت.");
      setIsReapplying(false);
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["hosts", "my-application"] });
      refetchMyApp();
    },
    onError: (err: Error) => {
      toast.error(normalizeApiError(err, "خطا در ثبت درخواست میزبانی. لطفاً ورودی‌ها را بررسی نمایید."));
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: HostApplicationRequest) => showcaseService.updateMyHostApplication(payload),
    onSuccess: () => {
      toast.success("اطلاعات درخواست میزبانی شما با موفقیت بروزرسانی شد.");
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["hosts", "my-application"] });
      refetchMyApp();
    },
    onError: (err: Error) => {
      toast.error(normalizeApiError(err, "خطا در بروزرسانی درخواست میزبانی. لطفاً ورودی‌ها را بررسی نمایید."));
    },
  });

  const isSaving = submitMutation.isPending || updateMutation.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isRestricted) {
      toast.error("حساب کاربری شما محدود شده است و امکان ثبت درخواست میزبانی وجود ندارد.");
      return;
    }

    // 1. Mandatory KYC Gate
    if (!isKycVerified) {
      toast.error("برای ثبت درخواست میزبانی، ابتدا باید احراز هویت اولیه حساب خود را تکمیل فرمایید.");
      setIsKycModalOpen(true);
      return;
    }

    if (!formData.fullName.trim()) {
      toast.error("لطفاً نام و نام خانوادگی را وارد کنید.");
      return;
    }

    if (!formData.nationalCode.trim() || formData.nationalCode.trim().length !== 10) {
      toast.error("کد ملی باید ۱۰ رقم معتبر باشد.");
      return;
    }

    if (!formData.hostName.trim()) {
      toast.error("لطفاً نام یا عنوان میزبانی خود را مشخص کنید.");
      return;
    }

    if (!formData.cityId) {
      toast.error("لطفاً شهر محل فعالیت و اقامتگاه را از مودال انتخاب کنید.");
      return;
    }

    if (!formData.mobileNumber.trim()) {
      toast.error("لطفاً شماره همراه معتبر وارد کنید.");
      return;
    }

    if (isEditing) {
      updateMutation.mutate(formData);
    } else {
      submitMutation.mutate(formData);
    }
  };

  // Unauthenticated State
  if (!isAuthLoading && !isLoggedIn) {
    return (
      <div className="min-h-screen bg-surface-secondary py-20 px-4 flex items-center justify-center" dir="rtl">
        <div className="bg-surface rounded-3xl p-8 border border-border-subtle max-w-md w-full text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
            <Home className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-black text-foreground">ورود به حساب کاربری</h2>
            <p className="text-xs text-foreground-secondary leading-relaxed font-medium">
              جهت ثبت درخواست میزبانی و معرفی اقامتگاه‌های روزانه خود در ملک‌تودی، ابتدا باید وارد حساب شوید.
            </p>
          </div>
          <Link
            href="/auth?redirect=/host/apply"
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-colors block shadow-sm"
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
          <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold">در حال بارگذاری اطلاعات میزبانی...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-secondary pb-24 lg:pb-10 py-10 px-4 sm:px-6 lg:px-8" dir="rtl">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/temporary-rent"
            className="p-2 -mr-2 text-foreground-muted hover:text-foreground transition-colors"
            title="بازگشت"
            aria-label="بازگشت"
          >
            <ArrowRight className="w-5 h-5" />
          </Link>
          <span className="text-xs font-medium text-foreground-muted">فرم رسمی درخواست میزبانی</span>
        </div>

        {isRestricted && <AccountStatusBanner />}

        {/* Hero Section */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-800 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-xl space-y-3">
            <h1 className="text-2xl sm:text-3xl font-black leading-tight">
              درخواست میزبانی و ثبت اقامتگاه‌های روزانه
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed font-medium">
              ویلای ساحلی، کلبه جنگلی یا آپارتمان مبله خود را با ویترین اختصاصی به هزاران مسافر در سراسر کشور معرفی کنید.
            </p>
          </div>
          <div className="absolute left-[-20px] bottom-[-20px] opacity-15 pointer-events-none">
            <Home className="w-64 h-64 text-white" />
          </div>
        </div>

        {/* Features / Guarantees Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-surface p-4 rounded-2xl border border-border-subtle shadow-sm flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-success-subtle text-success flex items-center justify-center shrink-0">
              <Home className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-black text-foreground">ویترین اختصاصی میزبان</h3>
              <p className="text-[11px] text-foreground-muted mt-0.5">صفحه عمومی با لینک مستقیم به اقامتگاه‌های شما</p>
            </div>
          </div>

          <div className="bg-surface p-4 rounded-2xl border border-border-subtle shadow-sm flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-info-subtle text-info flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-black text-foreground">احراز هویت معتبر</h3>
              <p className="text-[11px] text-foreground-muted mt-0.5">تطبیق کدملی در سامانه ثبت احوال و شاهکار</p>
            </div>
          </div>

          <div className="bg-surface p-4 rounded-2xl border border-border-subtle shadow-sm flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-warning-subtle text-warning flex items-center justify-center shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-black text-foreground">ارتباط مستقیم با مهمانان</h3>
              <p className="text-[11px] text-foreground-muted mt-0.5">امکان تماس و دنبال‌شدن مستقیم توسط مسافران</p>
            </div>
          </div>
        </div>

        {/* Application Status Banner (If already applied) */}
        {myApp && !isReapplying && (
          <div
            className={cn(
              "rounded-2xl p-6 border shadow-sm space-y-4",
              myApp.status === "PENDING" && "bg-warning-subtle/70 border-warning/30",
              myApp.status === "APPROVED" && "bg-success-subtle/70 border-success/30",
              myApp.status === "REJECTED" && "bg-error-subtle/70 border-error/30"
            )}
          >
            <div className="flex items-start gap-3">
              {myApp.status === "PENDING" && <Clock className="w-6 h-6 text-warning shrink-0 mt-0.5" />}
              {myApp.status === "APPROVED" && <CheckCircle className="w-6 h-6 text-success shrink-0 mt-0.5" />}
              {myApp.status === "REJECTED" && <XCircle className="w-6 h-6 text-error shrink-0 mt-0.5" />}
              <div className="space-y-1">
                <h2 className="text-sm font-black text-foreground">
                  {myApp.status === "PENDING" && "درخواست میزبانی شما در حال بررسی است"}
                  {myApp.status === "APPROVED" && "درخواست میزبانی شما تایید شده و فعال است"}
                  {myApp.status === "REJECTED" && "درخواست میزبانی شما تایید نشد"}
                </h2>
                <p className="text-xs text-foreground-secondary leading-relaxed font-medium">
                  {myApp.status === "PENDING" &&
                    "اطلاعات ارسالی شما در صف بررسی کارشناسان قرار دارد. نتیجه استعلام و بررسی ظرف ۲۴ ساعت مشخص می‌شود."}
                  {myApp.status === "APPROVED" &&
                    "نقش میزبانی برای حساب کاربری شما فعال است و می‌توانید اقامتگاه‌های خود را مدیریت نمایید."}
                  {myApp.status === "REJECTED" &&
                    (myApp.rejectionReason || "علت رد درخواست: نقص مدارک یا عدم تطابق شماره همراه با کدملی.")}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-border-subtle/60 flex flex-wrap gap-3">
              {myApp.status === "APPROVED" && (
                <>
                  <Link
                    href="/profile/temporary-rent"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
                  >
                    مدیریت اقامتگاه‌های من
                  </Link>
                  <Link
                    href="/profile/temporary-rent/new"
                    className="px-4 py-2 bg-surface border border-emerald-300 text-success hover:bg-success-subtle rounded-xl text-xs font-bold transition-colors"
                  >
                    ثبت اقامتگاه جدید
                  </Link>
                </>
              )}

              {myApp.status === "PENDING" && (
                <div className="flex items-center gap-3">
                  {!isEditing ? (
                    <button
                      type="button"
                      onClick={startEditing}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>ویرایش اطلاعات درخواست</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 bg-surface border border-border-subtle text-foreground-muted hover:text-foreground rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      انصراف از ویرایش
                    </button>
                  )}
                </div>
              )}

              {myApp.status === "REJECTED" && (
                <button
                  type="button"
                  onClick={startEditing}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm cursor-pointer"
                >
                  ارسال مجدد درخواست با اطلاعات اصلاح‌شده
                </button>
              )}
            </div>
          </div>
        )}

        {/* Application Form */}
        {(isReapplying || isEditing || !myApp || myApp.status === "REJECTED") && (
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
                      جهت امنیت مسافران و امکان ثبت اقامتگاه، ابتدا هویت شما (کد ملی و تاریخ تولد) با سامانه ثبت احوال تطبیق داده می‌شود.
                      پس از تأیید، نام و کد ملی شما به‌صورت خودکار در فرم درخواست ثبت شده و نیازی به ورود مجدد اطلاعات تکراری نیست.
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setIsKycModalOpen(true)}
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-emerald-600/25 flex items-center gap-2 cursor-pointer"
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
                      نام متقاضی: {formData.fullName}
                      {formData.nationalCode ? ` (کد ملی: ${toPersianDigits(formData.nationalCode)})` : ""}
                    </div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-800 font-bold text-[10px] self-start sm:self-auto">
                  ثبت احوال تأیید شده ✓
                </span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="bg-surface rounded-3xl p-6 sm:p-8 border border-border-subtle shadow-sm space-y-6">
              <div className="border-b border-border-subtle pb-4">
                <h2 className="text-base font-black text-foreground">
                  {isEditing ? "ویرایش مشخصات درخواست میزبانی" : "مشخصات متقاضی و اقامتگاه"}
                </h2>
                <p className="text-xs text-foreground-muted mt-1">
                  مشخصات هویتی قفل شده و سایر اطلاعات را تکمیل فرمایید.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-foreground-secondary">نام و نام خانوادگی متقاضی *</label>
                    {isKycVerified && <span className="text-[10px] text-emerald-600 font-bold">تأیید هویت شده ✓</span>}
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    disabled={isKycVerified}
                    placeholder="مثال: علی رضایی"
                    className={cn(
                      "w-full p-3 border rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors",
                      isKycVerified ? "bg-surface-secondary/70 border-emerald-500/30 text-foreground font-bold cursor-not-allowed" : "bg-surface-secondary border-border-subtle"
                    )}
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-foreground-secondary">کد ملی (۱۰ رقم) *</label>
                    {isKycVerified && <span className="text-[10px] text-emerald-600 font-bold">تأیید هویت شده ✓</span>}
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    value={formData.nationalCode}
                    onChange={(e) => setFormData({ ...formData, nationalCode: toOnlyDigits(e.target.value) })}
                    disabled={isKycVerified && Boolean(formData.nationalCode)}
                    placeholder="مثال: 0012345678"
                    className={cn(
                      "w-full p-3 border rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors",
                      isKycVerified && Boolean(formData.nationalCode)
                        ? "bg-surface-secondary/70 border-emerald-500/30 text-foreground font-bold cursor-not-allowed"
                        : "bg-surface-secondary border-border-subtle"
                    )}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground-secondary">عنوان یا برند میزبانی *</label>
                  <input
                    type="text"
                    required
                    value={formData.hostName}
                    onChange={(e) => setFormData({ ...formData, hostName: e.target.value })}
                    placeholder="مثال: ویلاهای ساحلی و کوهستانی رضایی"
                    className="w-full p-3 bg-surface-secondary border border-border-subtle rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                  />
                </div>

                {/* City Selection Trigger */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground-secondary">شهر محل اقامتگاه *</label>
                  <button
                    type="button"
                    onClick={() => setIsCitySelectorOpen(true)}
                    className="w-full flex items-center justify-between p-3 bg-surface-secondary border border-border-subtle rounded-xl text-xs hover:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-right group cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-success shrink-0" />
                      <span className={formData.cityId ? "font-bold text-foreground" : "text-foreground-muted"}>
                        {selectedCityName || "انتخاب شهر اقامتگاه..."}
                      </span>
                    </div>
                    <span className="text-[11px] text-success font-medium group-hover:underline">
                      {formData.cityId ? "تغییر شهر" : "انتخاب"}
                    </span>
                  </button>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-foreground-secondary">شماره همراه متقاضی *</label>
                    <span className="text-[10px] text-emerald-600 font-bold">شماره ثبت‌نامی ✓</span>
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.mobileNumber}
                    onChange={(e) => setFormData({ ...formData, mobileNumber: toOnlyDigits(e.target.value) })}
                    disabled={Boolean(userProfile?.mobileNumber)}
                    placeholder="مثال: 09123456789"
                    className={cn(
                      "w-full p-3 border rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors",
                      Boolean(userProfile?.mobileNumber)
                        ? "bg-surface-secondary/70 border-emerald-500/30 text-foreground font-bold cursor-not-allowed"
                        : "bg-surface-secondary border-border-subtle"
                    )}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground-secondary">تلفن تماس ثابت یا پشتیبان</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: toEnglishDigits(e.target.value) })}
                    placeholder="مثال: 01155223344"
                    className="w-full p-3 bg-surface-secondary border border-border-subtle rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-foreground-secondary">تعداد تقریبی اقامتگاه‌های تحت مدیریت</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formData.propertyCount}
                    onChange={(e) => setFormData({ ...formData, propertyCount: parseInt(toOnlyDigits(e.target.value), 10) || 1 })}
                    className="w-full p-3 bg-surface-secondary border border-border-subtle rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-foreground-secondary">آدرس اقامتگاه اصلی یا دفتر میزبان</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="مثال: رامسر، بلوار کازینو، کوچه یاس، پلاک ۱۰"
                    className="w-full p-3 bg-surface-secondary border border-border-subtle rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-foreground-secondary">توضیحات و سوابق میزبانی</label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="توضیحاتی در مورد نوع اقامتگاه‌ها (ویلا، سوئیت، کلبه)، امکانات و تجربه میزبانی شما..."
                    className="w-full p-3 bg-surface-secondary border border-border-subtle rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors resize-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-border-subtle flex items-center justify-end gap-3">
                {(isReapplying || isEditing) && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsReapplying(false);
                      setIsEditing(false);
                    }}
                    className="px-4 py-3 bg-surface-secondary hover:bg-slate-200 text-foreground-secondary rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    انصراف
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 sm:flex-initial px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSaving ? (
                    <span>در حال ذخیره و پردازش...</span>
                  ) : isEditing ? (
                    <>
                      <FileCheck className="w-4 h-4" />
                      <span>بروزرسانی مشخصات درخواست میزبانی</span>
                    </>
                  ) : (
                    <>
                      <FileCheck className="w-4 h-4" />
                      <span>ثبت درخواست میزبانی و استعلام هویت</span>
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
        initialFirstName={userProfile?.firstName || ""}
        initialLastName={userProfile?.lastName || ""}
        initialNationalCode={formData.nationalCode}
        title="احراز هویت پیش از ثبت درخواست میزبانی"
        subtitle="جهت فعال‌سازی عضویت میزبان، ابتدا مشخصات هویتی شما باید در سامانه ثبت احوال تأیید شود."
      />
    </div>
  );
}
