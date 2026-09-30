"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useMyAgency } from "@/hooks/useAgencies";
import { useHostProfile } from "@/hooks/useShowcase";
import { useCreatePost } from "@/hooks/usePosts";
import { RoleName } from "@/types/access";
import { InstagramPostEditor } from "@/components/posts/InstagramPostEditor";
import { MediumPostEditor } from "@/components/posts/MediumPostEditor";
import { Button } from "@/components/ui/Button";
import { getMediaUrl, cn } from "@/lib/utils";
import {
  Sparkles,
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
  Info,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { PublisherType } from "@/types/api/post.types";

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

  // Active Post Format
  const [postFormat, setPostFormat] = useState<PostFormat>("instagram");

  // Selected Publisher
  const [selectedPublisherKey, setSelectedPublisherKey] = useState<string>("");

  // ── Instagram Form State ────────────────────────────────────────────────
  const [igTitle, setIgTitle] = useState("");
  const [igCaption, setIgCaption] = useState("");
  const [igCategory, setIgCategory] = useState("معرفی ملک ویژه");
  const [igMediaUrls, setIgMediaUrls] = useState<string[]>([]);
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
    const hostHeader = (hostProfile as any)?.header;
    const hostId = hostHeader?.id || (hostProfile as any)?.id;
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
        if (parsed.mediaUrls) setIgMediaUrls(parsed.mediaUrls);
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
    if (igTitle || igCaption || igMediaUrls.length > 0) {
      localStorage.setItem(
        "melktoday_draft_instagram",
        JSON.stringify({
          title: igTitle,
          caption: igCaption,
          category: igCategory,
          mediaUrls: igMediaUrls,
          location: igLocation,
        })
      );
    }
  }, [igTitle, igCaption, igCategory, igMediaUrls, igLocation]);

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
      setIgMediaUrls([]);
      setIgLocation("");
      localStorage.removeItem("melktoday_draft_instagram");
      toast.success("پیش‌نویس اینستاگرامی پاک شد.");
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

  // Submit Post handler
  const handleSubmit = (isPublished: boolean = true) => {
    if (!activePublisher) {
      toast.error("هویت ناشر معتبر یافت نشد.");
      return;
    }

    if (postFormat === "instagram") {
      if (!igTitle.trim()) {
        toast.error("لطفاً عنوان یا تیتر کوتاه پست را وارد کنید.");
        return;
      }
      if (!igCaption.trim()) {
        toast.error("لطفاً متن کپشن پست را وارد کنید.");
        return;
      }
      if (igMediaUrls.length === 0) {
        toast.error("برای پست تصویری، حداقل یک عکس الزامی است.");
        return;
      }

      createPostMutation.mutate(
        {
          publisherType: activePublisher.type,
          publisherId: activePublisher.id,
          title: igTitle.trim(),
          summary: igCaption.trim().slice(0, 150),
          content: igCaption.trim(),
          category: igCategory,
          mediaUrls: igMediaUrls,
          isPublished,
        },
        {
          onSuccess: () => {
            localStorage.removeItem("melktoday_draft_instagram");
            redirectToShowcase(activePublisher);
          },
        }
      );
    } else {
      // Medium article format
      if (!medTitle.trim()) {
        toast.error("لطفاً عنوان اصلی مقاله را وارد کنید.");
        return;
      }
      if (!medContent.trim()) {
        toast.error("لطفاً متن کامل محتوا یا مقاله را وارد کنید.");
        return;
      }
      if (!medFeaturedImage.trim()) {
        toast.error("لطفاً تصویر شاخص مقاله را انتخاب کنید.");
        return;
      }

      const allMedia = medFeaturedImage.trim() ? [medFeaturedImage.trim()] : [];

      createPostMutation.mutate(
        {
          publisherType: activePublisher.type,
          publisherId: activePublisher.id,
          title: medTitle.trim(),
          slug: medSlug.trim() || undefined,
          summary: medSummary.trim() || undefined,
          content: medContent.trim(),
          category: medCategory,
          mediaUrls: allMedia,
          isPublished,
        },
        {
          onSuccess: () => {
            localStorage.removeItem("melktoday_draft_medium");
            redirectToShowcase(activePublisher);
          },
        }
      );
    }
  };

  const redirectToShowcase = (pub: PublisherOption) => {
    if (pub.type === "PLATFORM") {
      router.push("/platform");
    } else if (pub.type === "AGENCY") {
      router.push(`/agency/showcase/${encodeURIComponent(pub.id)}`);
    } else if (pub.type === "HOST") {
      router.push(`/host/${encodeURIComponent(pub.id)}`);
    } else {
      router.push("/explore");
    }
  };

  // ── LOADING STATE ────────────────────────────────────────────────────────
  if (isLoadingAuth || isLoadingAgency || isLoadingHost) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center" dir="rtl">
        <div className="space-y-4">
          <Loader2 className="w-10 h-10 border-primary text-primary animate-spin mx-auto" />
          <p className="text-sm font-bold text-slate-600">در حال بررسی سطح دسترسی و نقش کاربری شما...</p>
        </div>
      </div>
    );
  }

  // ── UNAUTHENTICATED STATE ────────────────────────────────────────────────
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6" dir="rtl">
        <div className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-sm max-w-md w-full text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black text-slate-900">نیاز به ورود به حساب کاربری</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              برای تولید و انتشار پست‌های تصویری و مقالات تخصصی، لطفاً ابتدا وارد حساب خود شوید.
            </p>
          </div>
          <Link
            href="/auth?returnUrl=/posts/create"
            className="w-full inline-flex items-center justify-center py-3.5 bg-primary hover:bg-primary/90 text-white rounded-2xl text-xs font-black transition-all shadow-md"
          >
            ورود یا ثبت‌نام در ملک تودی
          </Link>
        </div>
      </div>
    );
  }

  // ── UNAUTHORIZED ROLE STATE (Neither Host, Agency, nor Platform Admin) ───
  if (publisherOptions.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6" dir="rtl">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-xs text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-black text-slate-900">
                امکان انتشار پست ویژه نقش‌های مجاز است
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
                در سامانه ملک تودی، قابلیت تولید و انتشار پست‌های ویترینی و مقالات تحلیلی تنها برای
                <span className="font-bold text-slate-900"> مشاوران و دفاتر املاک (Agency)</span>،
                <span className="font-bold text-slate-900"> میزبانان اقامتگاه (Host)</span> و
                <span className="font-bold text-slate-900"> مدیریت رسمی پلتفرم</span>
                در دسترس است.
              </p>
            </div>

            {/* Application Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-right">
              <Link
                href="/agency/apply"
                className="p-5 rounded-2xl border-2 border-blue-100 hover:border-blue-400 bg-blue-50/40 hover:bg-blue-50 transition-all group flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <h3 className="font-black text-sm text-slate-900 group-hover:text-blue-700 transition-colors">
                    ثبت درخواست مشاور / دفتر املاک
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    ایجاد ویترین اختصاصی آژانس، ثبت آگهی‌های نامحدود و انتشار پست‌های تحلیلی.
                  </p>
                </div>
                <span className="text-xs font-bold text-blue-600 flex items-center gap-1 group-hover:underline pt-2">
                  <span>تکمیل فرم درخواست</span>
                  <ChevronLeft className="w-3.5 h-3.5" />
                </span>
              </Link>

              <Link
                href="/host/apply"
                className="p-5 rounded-2xl border-2 border-emerald-100 hover:border-emerald-400 bg-emerald-50/40 hover:bg-emerald-50 transition-all group flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                    <Hotel className="w-5 h-5" />
                  </div>
                  <h3 className="font-black text-sm text-slate-900 group-hover:text-emerald-700 transition-colors">
                    ثبت‌نام به عنوان میزبان اقامتگاه
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    معرفی اقامتگاه‌های روزانه، بومگردی و ویلا با صفحه اختصاصی و انتشار پست‌های ویژه.
                  </p>
                </div>
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 group-hover:underline pt-2">
                  <span>ارتقای حساب به میزبان</span>
                  <ChevronLeft className="w-3.5 h-3.5" />
                </span>
              </Link>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <Link
                href="/explore"
                className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
              >
                بازگشت به صفحه کاوش و مقالات
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── AUTHORIZED POST CREATION INTERFACE ──────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50/80 py-8 px-4 sm:px-6 lg:px-8" dir="rtl">
      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
        {/* ── TOP NAV / BREADCRUMB & PUBLISHER STATUS ──────────────────── */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
              <Link href="/explore" className="hover:text-primary transition-colors">
                کاوش
              </Link>
              <span>/</span>
              <span className="text-slate-700">تولید محتوا و ایجاد پست</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">
              استودیو ایجاد و انتشار پست اختصاصی
            </h1>
          </div>

          {/* Active Publisher Badge / Switcher */}
          <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
            <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-primary shadow-xs shrink-0">
              {activePublisher?.type === "PLATFORM" && <ShieldCheck className="w-5 h-5 text-primary" />}
              {activePublisher?.type === "HOST" && <Hotel className="w-5 h-5 text-emerald-600" />}
              {activePublisher?.type === "AGENCY" && <Building2 className="w-5 h-5 text-blue-600" />}
            </div>
            <div className="text-right flex-1 min-w-0">
              <span className="text-[10px] text-slate-400 font-bold block">هویت نویسنده / ناشر:</span>
              {publisherOptions.length > 1 ? (
                <select
                  value={selectedPublisherKey}
                  onChange={(e) => setSelectedPublisherKey(e.target.value)}
                  className="text-xs font-black text-slate-800 bg-transparent outline-none cursor-pointer"
                >
                  {publisherOptions.map((opt) => (
                    <option key={`${opt.type}:${opt.id}`} value={`${opt.type}:${opt.id}`}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-xs font-black text-slate-800 truncate block">
                  {activePublisher?.name}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── FORMAT SELECTOR (Instagram vs Medium) ────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Format 1: Instagram Carousel */}
          <button
            type="button"
            onClick={() => setPostFormat("instagram")}
            className={cn(
              "p-5 rounded-3xl border-2 text-right transition-all flex items-start gap-4 cursor-pointer relative overflow-hidden group shadow-xs",
              postFormat === "instagram"
                ? "bg-gradient-to-bl from-pink-500/10 via-purple-500/5 to-white border-pink-500 shadow-md ring-2 ring-pink-500/20"
                : "bg-white border-slate-200 hover:border-slate-300"
            )}
          >
            <div
              className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 shadow-sm",
                postFormat === "instagram"
                  ? "bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 text-white"
                  : "bg-slate-100 text-slate-600"
              )}
            >
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm sm:text-base text-slate-900">
                  پست تصویری و اسلایدی (اینستاگرام)
                </h3>
                {postFormat === "instagram" && (
                  <span className="text-[10px] font-black bg-pink-500 text-white px-2 py-0.5 rounded-full">
                    فعال
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                آپلود چند تصویر اسلایدر، کپشن کوتاه، هشتگ‌گذاری و مناسب برای معرفی تور ملک و نکات سریع.
              </p>
            </div>
          </button>

          {/* Format 2: Medium Markdown Article */}
          <button
            type="button"
            onClick={() => setPostFormat("medium")}
            className={cn(
              "p-5 rounded-3xl border-2 text-right transition-all flex items-start gap-4 cursor-pointer relative overflow-hidden group shadow-xs",
              postFormat === "medium"
                ? "bg-gradient-to-bl from-emerald-500/10 via-teal-500/5 to-white border-emerald-600 shadow-md ring-2 ring-emerald-500/20"
                : "bg-white border-slate-200 hover:border-slate-300"
            )}
          >
            <div
              className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 shadow-sm",
                postFormat === "medium"
                  ? "bg-emerald-700 text-white"
                  : "bg-slate-100 text-slate-600"
              )}
            >
              <BookOpen className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm sm:text-base text-slate-900">
                  مقاله و گزارش جامع (مدیوم / ویرگول)
                </h3>
                {postFormat === "medium" && (
                  <span className="text-[10px] font-black bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                    فعال
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                تصویر شاخص، پشتیبانی کامل از Markdown، وارد کردن فایل .md و درج نامحدود تصاویر بین متن.
              </p>
            </div>
          </button>
        </div>

        {/* ── ACTIVE EDITOR RENDER ─────────────────────────────────────── */}
        {activePublisher && (
          <div>
            {postFormat === "instagram" ? (
              <InstagramPostEditor
                publisher={activePublisher}
                title={igTitle}
                setTitle={setIgTitle}
                caption={igCaption}
                setCaption={setIgCaption}
                category={igCategory}
                setCategory={setIgCategory}
                mediaUrls={igMediaUrls}
                setMediaUrls={setIgMediaUrls}
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
          </div>
        )}

        {/* ── BOTTOM ACTION BAR ────────────────────────────────────────── */}
        <div className="sticky bottom-6 z-40 bg-white/95 backdrop-blur-md p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
            <button
              type="button"
              onClick={clearDraft}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>پاک‌سازی فرم</span>
            </button>

            <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
              پیش‌نویس شما به طور خودکار در مرورگر ذخیره می‌شود
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSubmit(false)}
              disabled={createPostMutation.isPending}
              className="rounded-2xl gap-2 font-bold text-xs py-3 px-5 border-slate-300"
            >
              <Save className="w-4 h-4" />
              <span>ذخیره به عنوان پیش‌نویس</span>
            </Button>

            <Button
              type="button"
              onClick={() => handleSubmit(true)}
              disabled={createPostMutation.isPending}
              className="rounded-2xl gap-2 font-black text-xs py-3 px-7 bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20"
            >
              {createPostMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>در حال انتشار...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>انتشار رسمی و فوری</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
