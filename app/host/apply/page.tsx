"use client";

import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { showcaseService } from "@/services/showcase.service";
import { CitySelector } from "@/components/CitySelector";
import {
  AlertCircle,
  ArrowRight,
  Award,
  CheckCircle,
  Clock,
  FileCheck,
  Home,
  Info,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  UserCheck,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HostApplicationRequest } from "@/types/api/showcase.types";
import { cn } from "@/lib/utils";

export default function HostApplyPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [isCitySelectorOpen, setIsCitySelectorOpen] = useState(false);
  const [selectedCityName, setSelectedCityName] = useState("");
  const [isReapplying, setIsReapplying] = useState(false);

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

  // Check existing landlord application
  const {
    data: myApp,
    isLoading: isAppLoading,
    refetch: refetchMyApp,
  } = useQuery({
    queryKey: ["hosts", "my-application"],
    queryFn: () => showcaseService.getMyHostApplication(),
  });

  const submitMutation = useMutation({
    mutationFn: (payload: HostApplicationRequest) => showcaseService.applyForHost(payload),
    onSuccess: () => {
      toast.success("درخواست میزبانی شما با موفقیت ثبت شد و در صف بررسی قرار گرفت.");
      setIsReapplying(false);
      queryClient.invalidateQueries({ queryKey: ["hosts", "my-application"] });
      refetchMyApp();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "خطا در ثبت درخواست میزبانی. لطفاً ورودی‌ها را بررسی نمایید.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

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

    submitMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8" dir="rtl">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/temporary-rent"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
            <span>بازگشت به اقامتگاه‌ها</span>
          </Link>
          <span className="text-xs font-medium text-slate-400">فرم رسمی درخواست میزبانی</span>
        </div>

        {/* Hero Section */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-800 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-emerald-200 text-xs font-bold">
              <Sparkles className="w-4 h-4 text-emerald-300" />
              <span>پیوستن به جمع میزبانان معتبر ملک‌تودی</span>
            </div>
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
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Home className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-800">ویترین اختصاصی میزبان</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">صفحه عمومی با لینک مستقیم به اقامتگاه‌های شما</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-800">احراز هویت معتبر</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">تطبیق کدملی در سامانه شاهکار و اعطای نشان تایید</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-800">ارتباط مستقیم با مهمانان</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">امکان دنبال‌شدن توسط مسافران و دریافت تماس مستقیم</p>
            </div>
          </div>
        </div>

        {/* Application Status Banner (If already applied) */}
        {!isAppLoading && myApp && !isReapplying && (
          <div
            className={cn(
              "rounded-2xl p-6 border shadow-sm space-y-4",
              myApp.status === "PENDING" && "bg-amber-50/70 border-amber-200",
              myApp.status === "APPROVED" && "bg-emerald-50/70 border-emerald-200",
              myApp.status === "REJECTED" && "bg-red-50/70 border-red-200"
            )}
          >
            <div className="flex items-start gap-3">
              {myApp.status === "PENDING" && <Clock className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />}
              {myApp.status === "APPROVED" && <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />}
              {myApp.status === "REJECTED" && <XCircle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />}
              <div className="space-y-1">
                <h2 className="text-sm font-black text-slate-800">
                  {myApp.status === "PENDING" && "درخواست میزبانی شما در حال بررسی است"}
                  {myApp.status === "APPROVED" && "درخواست میزبانی شما تایید شده و فعال است"}
                  {myApp.status === "REJECTED" && "درخواست میزبانی شما تایید نشد"}
                </h2>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  {myApp.status === "PENDING" &&
                    "اطلاعات ارسالی شما در صف بررسی کارشناسان قرار دارد. نتیجه استعلام و بررسی معمولاً ظرف ۲۴ ساعت مشخص می‌شود."}
                  {myApp.status === "APPROVED" &&
                    "نقش میزبانی برای حساب کاربری شما فعال است و می‌توانید اقامتگاه‌های خود را مدیریت نمایید."}
                  {myApp.status === "REJECTED" &&
                    (myApp.rejectionReason || "علت رد درخواست: نقص مدارک یا عدم تطابق شماره همراه با کدملی.")}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200/60 flex flex-wrap gap-3">
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
                    className="px-4 py-2 bg-white border border-emerald-300 text-emerald-700 hover:bg-emerald-50 rounded-xl text-xs font-bold transition-colors"
                  >
                    ثبت اقامتگاه جدید
                  </Link>
                </>
              )}

              {myApp.status === "REJECTED" && (
                <button
                  onClick={() => setIsReapplying(true)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
                >
                  ارسال مجدد درخواست با اطلاعات اصلاح‌شده
                </button>
              )}
            </div>
          </div>
        )}

        {/* Application Form */}
        {(isReapplying || !myApp || myApp.status === "REJECTED") && (
          <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-base font-black text-slate-800">مشخصات متقاضی و عنوان میزبانی</h2>
              <p className="text-xs text-slate-500 mt-1">
                اطلاعات هویتی با سامانه شاهکار تطبیق داده خواهد شد.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">نام و نام خانوادگی متقاضی *</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="مثال: علی رضایی"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">کد ملی (۱۰ رقم) *</label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  value={formData.nationalCode}
                  onChange={(e) => setFormData({ ...formData, nationalCode: e.target.value })}
                  placeholder="مثال: 0012345678"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">عنوان یا برند میزبانی *</label>
                <input
                  type="text"
                  required
                  value={formData.hostName}
                  onChange={(e) => setFormData({ ...formData, hostName: e.target.value })}
                  placeholder="مثال: اقامتگاه‌های ساحلی رضایی"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                />
              </div>

              {/* City Selection Trigger - Proper Modal */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">شهر محل اقامتگاه *</label>
                <button
                  type="button"
                  onClick={() => setIsCitySelectorOpen(true)}
                  className="w-full flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs hover:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-right group"
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className={formData.cityId ? "font-bold text-slate-800" : "text-slate-400"}>
                      {selectedCityName || "انتخاب شهر اقامتگاه..."}
                    </span>
                  </div>
                  <span className="text-[11px] text-emerald-600 font-medium group-hover:underline">
                    {formData.cityId ? "تغییر شهر" : "انتخاب"}
                  </span>
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">شماره همراه معتبر (به نام متقاضی) *</label>
                <input
                  type="text"
                  required
                  value={formData.mobileNumber}
                  onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                  placeholder="مثال: 09123456789"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">تلفن تماس ثابت یا پشتیبان</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="مثال: 01155223344"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-slate-700">تعداد تقریبی اقامتگاه‌های تحت مدیریت</label>
                <input
                  type="number"
                  min={1}
                  value={formData.propertyCount}
                  onChange={(e) => setFormData({ ...formData, propertyCount: parseInt(e.target.value, 10) || 1 })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-slate-700">آدرس اقامتگاه اصلی یا دفتر میزبان</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="مثال: رامسر، بلوار کازینو، پلاک ۱۰"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-slate-700">توضیحات و سوابق میزبانی</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="توضیحاتی در مورد نوع اقامتگاه‌ها (ویلا، سوئیت، کلبه)، امکانات و تجربه میزبانی شما..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors resize-none"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              {isReapplying && (
                <button
                  type="button"
                  onClick={() => setIsReapplying(false)}
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                >
                  انصراف
                </button>
              )}
              <button
                type="submit"
                disabled={submitMutation.isPending}
                className="flex-1 sm:flex-initial px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                {submitMutation.isPending ? (
                  <span>در حال ثبت درخواست...</span>
                ) : (
                  <>
                    <FileCheck className="w-4 h-4" />
                    <span>ثبت درخواست میزبانی و استعلام شاهکار</span>
                  </>
                )}
              </button>
            </div>
          </form>
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
    </div>
  );
}
