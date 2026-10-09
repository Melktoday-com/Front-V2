"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useMyAgency } from "@/hooks/useAgencies";
import { useHostProfile } from "@/hooks/useShowcase";
import { useCreatePost } from "@/hooks/usePosts";
import { RoleName } from "@/types/access";
import type { MediaReference } from "@/types/api/media.types";
import { InstagramPostEditor } from "@/components/posts/InstagramPostEditor";
import { MediumPostEditor } from "@/components/posts/MediumPostEditor";
import { Button } from "@/components/ui/Button";
import { getMediaUrl, toPersianDigits, cn } from "@/lib/utils";
import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";
import {
  BookOpen,
  Send,
  Save,
  ArrowRight,
  ShieldCheck,
  Building2,
  Hotel,
  AlertTriangle,
  Lock,
  ChevronLeft,
  Trash2,
  CheckCircle2,
  Loader2,
  Layers,
  Feather,
  Eye,
  FileText,
  Image as ImageIcon,
  Check,
  HelpCircle,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { PublisherType } from "@/types/api/post.types";
import { ShowcaseResponse, HostAbout } from "@/types/api/showcase.types";
import axios from "axios";

type PostFormat = "instagram" | "medium";

interface PublisherOption {
  type: PublisherType;
  id: string;
  name: string;
  avatarUrl?: string;
  isVerified?: boolean;
  label: string;
}

export default function CreatePostScene() {
  const router = useRouter();
  const { user, isLoggedIn, isLoading: isLoadingAuth } = useAuth();
  const { data: myAgency, isLoading: isLoadingAgency } = useMyAgency();
  const { data: hostProfile, isLoading: isLoadingHost } = useHostProfile();
  const createPostMutation = useCreatePost();

  // Wizard Step: 1 = Choose Publisher & Format, 2 = Create Content, 3 = Review & Publish
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Active Post Format
  const [postFormat, setPostFormat] = useState<PostFormat>("instagram");

  // Selected Publisher Key
  const [selectedPublisherKey, setSelectedPublisherKey] = useState<string>("");

  // ── Instagram Form State ────────────────────────────────────────────────
  const [igTitle, setIgTitle] = useState("");
  const [igCaption, setIgCaption] = useState("");
  const [igCategory, setIgCategory] = useState("معرفی ملک ویژه");
  const [igMedia, setIgMedia] = useState<MediaReference[]>([]);
  const [igLocation, setIgLocation] = useState("");

  // ── Medium Form State ───────────────────────────────────────────────────
  const [medTitle, setMedTitle] = useState("");
  const [medSummary, setMedSummary] = useState("");
  const [medContent, setMedContent] = useState("");
  const [medSlug, setMedSlug] = useState("");
  const [medCategory, setMedCategory] = useState("تحلیل بازار مسکن");
  const [medFeaturedImage, setMedFeaturedImage] = useState("");

  // Determine allowed publisher options based on user role and profiles
  const publisherOptions: PublisherOption[] = useMemo(() => {
    const options: PublisherOption[] = [];

    const isAdmin =
      user?.activeRole === RoleName.Admin ||
      user?.activeRole === RoleName.SuperAdmin;

    // 1. Admin -> Platform publisher
    if (isAdmin) {
      options.push({
        type: "PLATFORM",
        id: "melktoday-official",
        name: "ملک‌تودی (پلتفرم رسمی)",
        isVerified: true,
        label: "پلتفرم رسمی ملک‌تودی",
      });
    }

    // 2. Real Estate Agency / Agent
    if (myAgency) {
      options.push({
        type: "AGENCY",
        id: myAgency.id,
        name: myAgency.name,
        avatarUrl: myAgency.logoUrl || undefined,
        isVerified: myAgency.isVerified,
        label: `دفتر املاک: ${myAgency.name}`,
      });
    }

    // 3. Host Profile / Landlord
    const hostProfileData = hostProfile as ShowcaseResponse<HostAbout> | null | undefined;
    const hostHeader = hostProfileData?.header;
    const hostId = hostHeader?.id;
    if (hostId) {
      options.push({
        type: "HOST",
        id: hostId,
        name: hostHeader?.title || "میزبان اقامتگاه",
        avatarUrl: hostHeader?.avatarUrl || undefined,
        isVerified: hostHeader?.isVerified ?? true,
        label: `میزبان: ${hostHeader?.title || "اقامتگاه"}`,
      });
    }

    return options;
  }, [user, myAgency, hostProfile]);

  // Set default selected publisher
  useEffect(() => {
    if (publisherOptions.length > 0 && !selectedPublisherKey) {
      setSelectedPublisherKey(`${publisherOptions[0].type}:${publisherOptions[0].id}`);
    }
  }, [publisherOptions, selectedPublisherKey]);

  const activePublisher = useMemo(() => {
    if (!selectedPublisherKey) return publisherOptions[0] || null;
    const [type, id] = selectedPublisherKey.split(":");
    return (
      publisherOptions.find((p) => p.type === type && p.id === id) ||
      publisherOptions[0] ||
      null
    );
  }, [selectedPublisherKey, publisherOptions]);

  // Load draft from localStorage if available
  useEffect(() => {
    try {
      const savedIg = localStorage.getItem("melktoday_draft_instagram");
      if (savedIg) {
        const parsed = JSON.parse(savedIg);
        if (parsed.title) setIgTitle(parsed.title);
        if (parsed.caption) setIgCaption(parsed.caption);
        if (parsed.category) setIgCategory(parsed.category);
        if (parsed.mediaIds && Array.isArray(parsed.mediaIds)) {
          setIgMedia(parsed.mediaIds as MediaReference[]);
        }
        if (parsed.location) setIgLocation(parsed.location);
      }

      const savedMed = localStorage.getItem("melktoday_draft_medium");
      if (savedMed) {
        const parsed = JSON.parse(savedMed);
        if (parsed.title) setMedTitle(parsed.title);
        if (parsed.summary) setMedSummary(parsed.summary);
        if (parsed.content) setMedContent(parsed.content);
        if (parsed.slug) setMedSlug(parsed.slug);
        if (parsed.category) setMedCategory(parsed.category);
        if (parsed.featuredImage) setMedFeaturedImage(parsed.featuredImage);
      }
    } catch {
      // ignore
    }
  }, []);

  // Auto-save draft on changes
  useEffect(() => {
    if (igTitle || igCaption || igMedia.length > 0) {
      localStorage.setItem(
        "melktoday_draft_instagram",
        JSON.stringify({
          title: igTitle,
          caption: igCaption,
          category: igCategory,
          mediaIds: igMedia,
          location: igLocation,
        })
      );
    }
  }, [igTitle, igCaption, igCategory, igMedia, igLocation]);

  useEffect(() => {
    if (medTitle || medContent || medFeaturedImage) {
      localStorage.setItem(
        "melktoday_draft_medium",
        JSON.stringify({
          title: medTitle,
          summary: medSummary,
          content: medContent,
          slug: medSlug,
          category: medCategory,
          featuredImage: medFeaturedImage,
        })
      );
    }
  }, [medTitle, medSummary, medContent, medSlug, medCategory, medFeaturedImage]);

  const clearDraft = () => {
    if (postFormat === "instagram") {
      setIgTitle("");
      setIgCaption("");
      setIgMedia([]);
      setIgLocation("");
      localStorage.removeItem("melktoday_draft_instagram");
      toast.success("پیش‌نویس قالب تصویری پاک شد.");
    } else {
      setMedTitle("");
      setMedSummary("");
      setMedContent("");
      setMedSlug("");
      setMedFeaturedImage("");
      localStorage.removeItem("melktoday_draft_medium");
      toast.success("پیش‌نویس مقاله پاک شد.");
    }
  };

  // Step Validation logic
  const handleNextFromStep1 = () => {
    if (!activePublisher) {
      toast.error("لطفاً ابتدا هویت ناشر را انتخاب کنید.");
      return;
    }
    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNextFromStep2 = () => {
    if (postFormat === "instagram") {
      if (igMedia.length === 0) {
        toast.error("لطفاً حداقل یک تصویر برای پست اسلایدی آپلود کنید.");
        return;
      }
      if (!igTitle.trim() && !igCaption.trim()) {
        toast.error("لطفاً عنوان یا کپشن پست را وارد کنید.");
        return;
      }
    } else {
      if (!medTitle.trim()) {
        toast.error("لطفاً عنوان مقاله را وارد کنید.");
        return;
      }
      if (!medContent.trim() || medContent.trim().length < 20) {
        toast.error("لطفاً متن کامل مقاله را وارد کنید (حداقل ۲۰ کاراکتر).");
        return;
      }
    }
    setCurrentStep(3);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Handle Submit / Publish
  const handlePublish = async (isPublished = true) => {
    if (!activePublisher) {
      toast.error("ناشر پست مشخص نیست.");
      return;
    }

    try {
      if (postFormat === "instagram") {
        if (igMedia.length === 0) {
          toast.error("لطفاً حداقل یک تصویر برای پست اینستاگرامی آپلود کنید.");
          return;
        }

        const effectiveTitle =
          igTitle.trim() ||
          igCaption.trim().slice(0, 45) ||
          `پست تصویری ${activePublisher.name}`;

        const created = await createPostMutation.mutateAsync({
          publisherType: activePublisher.type,
          publisherId: activePublisher.id,
          title: effectiveTitle,
          content: igCaption.trim() || effectiveTitle,
          category: igCategory || "معرفی ملک ویژه",
          mediaIds: igMedia,
          isPublished,
          isFeatured: false,
        });

        localStorage.removeItem("melktoday_draft_instagram");
        toast.success(
          isPublished
            ? "پست با موفقیت منتشر شد و در اکسپلور قرار گرفت!"
            : "پست با موفقیت به صورت پیش‌نویس ذخیره شد."
        );
        router.push(`/posts/${created.slug || created.id}`);
      } else {
        if (!medTitle.trim()) {
          toast.error("لطفاً عنوان مقاله را وارد کنید.");
          return;
        }
        if (!medContent.trim()) {
          toast.error("متن مقاله نمی‌تواند خالی باشد.");
          return;
        }

        const mediaIds: MediaReference[] = [];
        if (medFeaturedImage) {
          mediaIds.push({ id: medFeaturedImage, type: "IMAGE" });
        }

        const created = await createPostMutation.mutateAsync({
          publisherType: activePublisher.type,
          publisherId: activePublisher.id,
          title: medTitle.trim(),
          summary: medSummary.trim() || undefined,
          content: medContent.trim(),
          slug: medSlug.trim() || undefined,
          category: medCategory || "تحلیل بازار مسکن",
          mediaIds,
          isPublished,
          isFeatured: false,
        });

        localStorage.removeItem("melktoday_draft_medium");
        toast.success(
          isPublished
            ? "مقاله تخصصی با موفقیت منتشر شد!"
            : "مقاله به عنوان پیش‌نویس ذخیره شد."
        );
        router.push(`/posts/${created.slug || created.id}`);
      }
    } catch (err) {
      const errorMsg =
        axios.isAxiosError(err) && (err.response?.data as { message?: string } | undefined)?.message
          ? (err.response?.data as { message: string }).message
          : err instanceof Error
          ? err.message
          : "خطایی در انتشار پست رخ داد.";
      toast.error(errorMsg);
    }
  };

  // ── Loading & Auth Guards ──────────────────────────────────────────────
  if (isLoadingAuth || isLoadingAgency || isLoadingHost) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3" dir="rtl">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm font-bold text-slate-600">در حال بارگذاری استودیو محتوا...</p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 rounded-3xl bg-white border border-slate-200 text-center space-y-5 shadow-sm" dir="rtl">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
          <Lock className="w-7 h-7" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-lg font-black text-brand">ورود به حساب کاربری</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            برای انتشار پست و مقالات ملکی، لطفاً ابتدا وارد حساب کاربری خود شوید.
          </p>
        </div>
        <Link
          href={`/auth?redirect=${encodeURIComponent("/posts/create")}`}
          className="inline-flex w-full items-center justify-center gap-2 py-3 rounded-2xl bg-brand text-white text-sm font-bold hover:bg-brand/90 transition-all shadow-xs"
        >
          <span>ورود / ثبت‌نام</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  // Permission Guard
  if (publisherOptions.length === 0) {
    return (
      <div className="max-w-lg mx-auto my-16 p-8 rounded-3xl bg-white border border-slate-200 text-center space-y-6 shadow-sm" dir="rtl">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-black text-brand">دسترسی ناشر یافت نشد</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            در حال حاضر تنها <strong className="text-brand">آژانس‌های املاک تایید شده</strong>، <strong className="text-brand">میزبان‌های اقامتگاه</strong> و <strong className="text-brand">مدیران پلتفرم</strong> امکان تولید و انتشار محتوا در بخش کاوش را دارند.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <Link
            href="/agency/apply"
            className="p-4 rounded-2xl border border-slate-200 hover:border-primary bg-slate-50 hover:bg-white text-right space-y-1 transition-all group"
          >
            <div className="flex items-center justify-between">
              <Building2 className="w-5 h-5 text-brand group-hover:text-primary transition-colors" />
              <ChevronLeft className="w-4 h-4 text-slate-400 group-hover:-translate-x-1 transition-transform" />
            </div>
            <p className="text-xs font-black text-brand">ثبت دفتر املاک</p>
            <p className="text-[11px] text-slate-500">ارسال درخواست عضویت آژانس</p>
          </Link>
          <Link
            href="/host/apply"
            className="p-4 rounded-2xl border border-slate-200 hover:border-primary bg-slate-50 hover:bg-white text-right space-y-1 transition-all group"
          >
            <div className="flex items-center justify-between">
              <Hotel className="w-5 h-5 text-brand group-hover:text-primary transition-colors" />
              <ChevronLeft className="w-4 h-4 text-slate-400 group-hover:-translate-x-1 transition-transform" />
            </div>
            <p className="text-xs font-black text-brand">ثبت‌نام میزبان</p>
            <p className="text-[11px] text-slate-500">فعال‌سازی پروفایل میزبانی</p>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-w-0 max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 pb-28 lg:pb-10 space-y-8" dir="rtl">

      {/* ── TOP HEADER & WIZARD STEPPER ─────────────────────────────────── */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-brand text-[11px] font-bold">
                استودیو محتوای ملک‌تودی
              </span>
              {activePublisher && (
                <span className="flex items-center gap-1 text-xs text-primary font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{activePublisher.name}</span>
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-brand mt-1.5">
              ایجاد و انتشار محتوای جدید
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={clearDraft}
              className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>پاکسازی فرم</span>
            </button>
            <Link
              href="/explore"
              className="flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-bold text-brand bg-slate-100 hover:bg-slate-200 transition-all"
            >
              <span>مشاهده اکسپلور</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* ── STEPPER TABS ────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          {/* Step 1 */}
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className={cn(
              "flex items-center gap-2 sm:gap-3 p-3 rounded-2xl text-right transition-all border",
              currentStep === 1
                ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                : currentStep > 1
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
            )}
          >
            <div
              className={cn(
                "w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0",
                currentStep === 1
                  ? "bg-primary text-slate-950"
                  : currentStep > 1
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-200 text-slate-600"
              )}
            >
              {currentStep > 1 ? <Check className="w-4 h-4" /> : "۱"}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black truncate">مرحله اول</p>
              <p className="text-[10px] opacity-80 truncate hidden sm:block">ناشر و قالب محتوا</p>
            </div>
          </button>

          {/* Step 2 */}
          <button
            type="button"
            onClick={() => {
              if (currentStep > 2 || activePublisher) setCurrentStep(2);
            }}
            className={cn(
              "flex items-center gap-2 sm:gap-3 p-3 rounded-2xl text-right transition-all border",
              currentStep === 2
                ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                : currentStep > 2
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
            )}
          >
            <div
              className={cn(
                "w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0",
                currentStep === 2
                  ? "bg-primary text-slate-950"
                  : currentStep > 2
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-200 text-slate-600"
              )}
            >
              {currentStep > 2 ? <Check className="w-4 h-4" /> : "۲"}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black truncate">مرحله دوم</p>
              <p className="text-[10px] opacity-80 truncate hidden sm:block">طراحی و نگارش</p>
            </div>
          </button>

          {/* Step 3 */}
          <button
            type="button"
            onClick={() => {
              if (
                (postFormat === "instagram" && (igMedia.length > 0 || igTitle || igCaption)) ||
                (postFormat === "medium" && medTitle && medContent)
              ) {
                setCurrentStep(3);
              }
            }}
            className={cn(
              "flex items-center gap-2 sm:gap-3 p-3 rounded-2xl text-right transition-all border",
              currentStep === 3
                ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
            )}
          >
            <div
              className={cn(
                "w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0",
                currentStep === 3
                  ? "bg-primary text-slate-950"
                  : "bg-slate-200 text-slate-600"
              )}
            >
              ۳
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black truncate">مرحله سوم</p>
              <p className="text-[10px] opacity-80 truncate hidden sm:block">بازبینی و انتشار</p>
            </div>
          </button>
        </div>
      </div>

      {/* ── STEP 1: CHOOSE PUBLISHER & FORMAT ──────────────────────────── */}
      {currentStep === 1 && (
        <div className="space-y-6">
          {/* 1.1 Publisher Identity Selection */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div>
              <h2 className="text-sm sm:text-base font-black text-brand flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <span>۱. انتخاب هویت ناشر (انتشار از طرف کدام صفحه؟)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                مشخص کنید این محتوا در کدام پروفایل رسمی و با چه نشانی به کاربران اکسپلور نمایش داده شود.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {publisherOptions.map((pub) => {
                const key = `${pub.type}:${pub.id}`;
                const isSelected = selectedPublisherKey === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedPublisherKey(key)}
                    className={cn(
                      "p-4 rounded-2xl border text-right transition-all relative flex flex-col justify-between gap-3",
                      isSelected
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-xs"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 shrink-0 font-black text-xs overflow-hidden">
                        {pub.avatarUrl ? (
                          <img
                            src={getMediaUrl(pub.avatarUrl)}
                            alt={pub.name}
                            className="w-full h-full object-cover"
                          />
                        ) : pub.type === "PLATFORM" ? (
                          <ShieldCheck className="w-5 h-5 text-brand" />
                        ) : pub.type === "HOST" ? (
                          <Hotel className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <Building2 className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-black text-brand truncate">{pub.name}</p>
                        <p className="text-[11px] text-slate-500">{pub.label}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400">
                        {pub.type === "PLATFORM" ? "پلتفرم رسمی" : pub.type === "HOST" ? "میزبان اقامتگاه" : "آژانس املاک"}
                      </span>
                      {isSelected ? (
                        <span className="px-2 py-0.5 rounded-md bg-primary text-slate-950 text-[10px] font-black flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          <span>انتخاب شده</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400">انتخاب</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 1.2 Content Format Selection */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div>
              <h2 className="text-sm sm:text-base font-black text-brand flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                <span>۲. انتخاب فرمت و سبک پست</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                قالب مناسب محتوای خود را جهت نمایش جذاب در فید اکسپلور انتخاب کنید.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Instagram Format */}
              <button
                type="button"
                onClick={() => setPostFormat("instagram")}
                className={cn(
                  "p-5 rounded-3xl border text-right transition-all space-y-4 relative group",
                  postFormat === "instagram"
                    ? "border-brand bg-slate-50 ring-2 ring-brand/10 shadow-sm"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-brand text-primary flex items-center justify-center shadow-xs">
                    <Layers className="w-6 h-6" />
                  </div>
                  {postFormat === "instagram" && (
                    <span className="px-3 py-1 rounded-full bg-brand text-white text-[11px] font-black flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 text-primary" />
                      <span>قالب فعال</span>
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm font-black text-brand">
                    سبک اینستاگرام (چندرسانه‌ای و اسلایدی)
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    مناسب معرفی سریع املاک، تورهای ویدیویی و تصویری، آگهی‌های ویژه و اسلایدهای آموزشی با تصاویر متعدد و کپشن کوتاه.
                  </p>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-200/60 text-[11px] text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                    <span>پشتیبانی از ۱ تا ۱۰ تصویر باکیفیت در قالب اسلایدر</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                    <span>کپشن روان با هشتگ‌های پربازدید ملکی</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                    <span>نمایش مستقیم در گرید و فید کاوش اینستاگرامی</span>
                  </div>
                </div>
              </button>

              {/* Medium Format */}
              <button
                type="button"
                onClick={() => setPostFormat("medium")}
                className={cn(
                  "p-5 rounded-3xl border text-right transition-all space-y-4 relative group",
                  postFormat === "medium"
                    ? "border-brand bg-slate-50 ring-2 ring-brand/10 shadow-sm"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-brand text-white flex items-center justify-center shadow-xs">
                    <Feather className="w-6 h-6 text-primary" />
                  </div>
                  {postFormat === "medium" && (
                    <span className="px-3 py-1 rounded-full bg-brand text-white text-[11px] font-black flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 text-primary" />
                      <span>قالب فعال</span>
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm font-black text-brand">
                    سبک مدیوم (مقاله و تحلیل تخصصی)
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    مناسب مقالات بلند، تحلیل روند بازار مسکن، راهنماهای جامع خرید و فروش، نکات حقوقی و گزارش‌های پژوهشی.
                  </p>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-200/60 text-[11px] text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                    <span>تصویر شاخص بزرگ (Hero Cover) و ساختار مقاله تمیز</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                    <span>ویرایشگر غنی مارک‌داون + درج تصاویر بین متن</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                    <span>محاسبه خودکار زمان مطالعه و اسلاگ سئو سفارشی</span>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Action Bar Step 1 */}
          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={handleNextFromStep1}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-brand text-white text-xs sm:text-sm font-bold hover:bg-brand/90 transition-all shadow-xs"
            >
              <span>ادامه و ورود به ویرایشگر محتوا</span>
              <ChevronLeft className="w-4 h-4 text-primary" />
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 2: CONTENT EDITOR ──────────────────────────────────────── */}
      {currentStep === 2 && activePublisher && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block" />
              <span className="text-xs font-bold text-slate-700">
                قالب فعال: {postFormat === "instagram" ? "اسلایدی و تصویری (اینستاگرام)" : "مقاله تحلیلی و متنی (مدیوم)"}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="text-xs font-bold text-brand hover:text-primary transition-colors flex items-center gap-1"
            >
              <span>تغییر ناشر یا قالب</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {postFormat === "instagram" ? (
            <InstagramPostEditor
              publisher={activePublisher}
              title={igTitle}
              setTitle={setIgTitle}
              caption={igCaption}
              setCaption={setIgCaption}
              category={igCategory}
              setCategory={setIgCategory}
              media={igMedia}
              setMedia={setIgMedia}
              locationTag={igLocation}
              setLocationTag={setIgLocation}
            />
          ) : (
            <MediumPostEditor
              publisher={activePublisher}
              title={medTitle}
              setTitle={setMedTitle}
              summary={medSummary}
              setSummary={setMedSummary}
              content={medContent}
              setContent={setMedContent}
              slug={medSlug}
              setSlug={setMedSlug}
              category={medCategory}
              setCategory={setMedCategory}
              featuredImageUrl={medFeaturedImage}
              setFeaturedImageUrl={setMedFeaturedImage}
            />
          )}

          {/* Action Bar Step 2 */}
          <div className="flex items-center justify-between bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-2xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all"
            >
              <ArrowRight className="w-4 h-4" />
              <span>مرحله قبل (انتخاب قالب)</span>
            </button>

            <button
              type="button"
              onClick={handleNextFromStep2}
              className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-brand text-white text-xs font-bold hover:bg-brand/90 transition-all shadow-xs"
            >
              <span>مرحله بعد: بازبینی و انتشار نهایی</span>
              <ChevronLeft className="w-4 h-4 text-primary" />
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3: REVIEW & PUBLISH ────────────────────────────────────── */}
      {currentStep === 3 && activePublisher && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Summary & Metadata */}
            <div className="lg:col-span-6 space-y-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
                <div>
                  <h2 className="text-base font-black text-brand flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                    <span>مشخصات و تنظیمات نهایی پست</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    قبل از انتشار نهایی، مشخصات را بررسی کنید.
                  </p>
                </div>

                <div className="space-y-3 divide-y divide-slate-100 text-xs">
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-slate-500">ناشر محتوا:</span>
                    <span className="font-bold text-brand">{activePublisher.name}</span>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-slate-500">فرمت انتخابی:</span>
                    <span className="font-bold text-brand">
                      {postFormat === "instagram" ? "پست اسلایدی (اینستاگرام)" : "مقاله تفصیلی (مدیوم)"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-slate-500">عنوان:</span>
                    <span className="font-bold text-brand text-left max-w-[200px] truncate">
                      {postFormat === "instagram" ? (igTitle || igCaption.slice(0, 30) || "پست تصویری") : medTitle}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-slate-500">دسته‌بندی:</span>
                    <span className="font-bold text-primary">
                      {postFormat === "instagram" ? igCategory : medCategory}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-slate-500">تعداد رسانه‌ها:</span>
                    <span className="font-bold text-brand">
                      {postFormat === "instagram"
                        ? `${toPersianDigits(igMedia.length)} تصویر اسلایدی`
                        : medFeaturedImage
                        ? "۱ تصویر شاخص + تصاویر داخل متن"
                        : "بدون تصویر شاخص"}
                    </span>
                  </div>
                </div>

                {/* Direct Action Buttons */}
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <button
                    type="button"
                    disabled={createPostMutation.isPending}
                    onClick={() => handlePublish(true)}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-primary text-slate-950 font-black text-sm hover:bg-primary/90 transition-all shadow-md disabled:opacity-50"
                  >
                    {createPostMutation.isPending ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>در حال ارسال و انتشار محتوا...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        <span>انتشار رسمی در اکسپلور و صفحه ناشر</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    disabled={createPostMutation.isPending}
                    onClick={() => handlePublish(false)}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>ذخیره به عنوان پیش‌نویس (غیرعمومی)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="w-full text-center text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors pt-2"
                  >
                    بازگشت به مرحله ویرایش محتوا
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Live Preview */}
            <div className="lg:col-span-6 space-y-4">
              <div className="bg-slate-50 p-4 rounded-3xl border border-slate-200">
                <div className="flex items-center gap-2 mb-3">
                  <Eye className="w-4 h-4 text-brand" />
                  <h3 className="text-xs font-black text-brand">پیش‌نمایش خروجی زنده</h3>
                </div>

                {postFormat === "instagram" ? (
                  /* Instagram Card Preview */
                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs space-y-3">
                    <div className="p-3 flex items-center justify-between border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-100 border border-primary/20 overflow-hidden flex items-center justify-center text-slate-700 text-xs font-bold">
                          {activePublisher.avatarUrl ? (
                            <img
                              src={getMediaUrl(activePublisher.avatarUrl)}
                              alt={activePublisher.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Building2 className="w-4 h-4 text-brand" />
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-black text-brand">{activePublisher.name}</p>
                          <span className="text-[10px] text-primary font-bold">{igCategory}</span>
                        </div>
                      </div>
                    </div>

                    <div className="relative aspect-square w-full bg-slate-900 overflow-hidden">
                      {igMedia.length > 0 ? (
                        <img
                          src={getMediaUrl(igMedia[0])}
                          alt="اسلاید اول"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs font-bold">
                          تصویری انتخاب نشده
                        </div>
                      )}
                      {igMedia.length > 1 && (
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-bold">
                          ۱ / {toPersianDigits(igMedia.length)}
                        </div>
                      )}
                    </div>

                    <div className="p-3 space-y-1.5">
                      <p className="text-xs font-bold text-brand">{igTitle || "عنوان پست"}</p>
                      <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                        {igCaption || "کپشن و توضیحات پست در این بخش قرار می‌گیرد..."}
                      </p>
                    </div>
                  </div>
                ) : (
                  /* Medium Article Preview */
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
                    {medFeaturedImage && (
                      <div className="aspect-video w-full rounded-xl overflow-hidden bg-slate-100">
                        <img
                          src={getMediaUrl(medFeaturedImage)}
                          alt="تصویر شاخص"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-primary">{medCategory}</span>
                      <h4 className="text-base font-black text-brand leading-snug">
                        {medTitle || "عنوان مقاله تخصصی"}
                      </h4>
                    </div>
                    {medSummary && (
                      <p className="text-xs text-slate-600 italic bg-slate-50 p-3 rounded-xl border-r-2 border-primary">
                        {medSummary}
                      </p>
                    )}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                      <span>توسط: {activePublisher.name}</span>
                      <span>زمان مطالعه تخمینی: {toPersianDigits(Math.max(1, Math.ceil((medContent?.length || 0) / 400)))} دقیقه</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
