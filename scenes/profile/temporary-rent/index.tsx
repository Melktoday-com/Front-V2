"use client";

import { useAuth } from "@/hooks/useAuth";
import { useUserStatus } from "@/hooks/useUserStatus";
import { AccountStatusBanner } from "@/components/ui/AccountStatusBanner";
import {
    useTemporaryRentAds,
    usePublishTemporaryRent,
    useDeleteTemporaryRent,
} from "@/hooks/useTemporaryRent";
import { useHostProfile, useUpdateHostProfile, useShowcasePosts } from "@/hooks/useShowcase";
import { showcaseService } from "@/services/showcase.service";
import MediaIconUpload from "@/components/admin/MediaIconUpload";
import { PromotionModal } from "@/components/promotions/PromotionModal";
import { UpdateHostProfileRequest } from "@/types/api/showcase.types";
import type { TemporaryRentPricingReadModel } from "@/types/api/temporary-rent.types";
import { cn, formatCurrency, getMediaUrl, toEnglishDigits, toOnlyDigits, toPersianDigits } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Award,
    BadgeCheck,
    BookOpen,
    Building2,
    Calendar,
    Check,
    ChevronLeft,
    Clock,
    Copy,
    Edit3,
    ExternalLink,
    Eye,
    Home,
    ImageIcon,
    Info,
    LayoutDashboard,
    MapPin,
    PenTool,
    Phone,
    Plus,
    Rocket,
    RotateCcw,
    Settings,
    ShieldCheck,
    Smartphone,
    Star,
    Trash2,
    Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSafeBack } from "@/hooks/useSafeBack";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";

import "swiper/css";
import "swiper/css/free-mode";

function formatTemporaryRentPricing(pricing?: TemporaryRentPricingReadModel | null): { label: string; formatted: string; hasCurrency: boolean } {
    if (!pricing) {
        return { label: "قیمت", formatted: "توافقی", hasCurrency: false };
    }
    switch (pricing.priceModelKey) {
        case "DAILY_RENT_STANDARD":
            return {
                label: "اجاره هر شب",
                formatted: formatCurrency(pricing.pricing.nightlyPrice),
                hasCurrency: pricing.pricing.nightlyPrice > 0,
            };
        case "WEEKLY_MONTHLY_RENT":
            return {
                label: "اجاره هر شب",
                formatted: formatCurrency(pricing.pricing.nightlyPrice),
                hasCurrency: pricing.pricing.nightlyPrice > 0,
            };
        case "WEEKEND_PEAK_RENT": {
            const amount = pricing.pricing.midweekNightlyPrice || pricing.pricing.weekendNightlyPrice;
            return {
                label: "اجاره هر شب",
                formatted: formatCurrency(amount),
                hasCurrency: amount > 0,
            };
        }
        case "EVENT_VENUE_RENT":
            return {
                label: "پایه برگزاری مراسم",
                formatted: formatCurrency(pricing.pricing.eventBasePrice),
                hasCurrency: pricing.pricing.eventBasePrice > 0,
            };
        case null:
            return {
                label: "اجاره هر شب",
                formatted: formatCurrency(pricing.legacyNightlyPrice),
                hasCurrency: pricing.legacyNightlyPrice > 0,
            };
        default:
            return {
                label: "قیمت",
                formatted: "توافقی",
                hasCurrency: false,
            };
    }
}

type Tab = "overview" | "rentals" | "settings" | "posts";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "overview", label: "نمای کلی و آمار", icon: LayoutDashboard },
    { id: "rentals", label: "اقامتگاه‌های من", icon: Home },
    { id: "settings", label: "شخصی‌سازی ویترین", icon: Settings },
    { id: "posts", label: "پست‌ها و مقالات", icon: BookOpen },
];

const statusLabels: Record<string, { label: string; color: string; border: string }> = {
    DRAFT: { label: "پیش‌نویس", color: "bg-surface-secondary text-foreground-secondary", border: "border-border-subtle" },
    PENDING_APPROVAL: { label: "در حال بررسی", color: "bg-amber-500/10 text-warning", border: "border-amber-500/20" },
    PUBLISHED: { label: "منتشر شده", color: "bg-emerald-500/10 text-success", border: "border-emerald-500/20" },
    ARCHIVED: { label: "آرشیو شده", color: "bg-rose-500/10 text-error", border: "border-rose-500/20" },
};

export default function TemporaryRentPanelScene() {
    const router = useRouter();
    const handleBack = useSafeBack("/");
    const queryClient = useQueryClient();
    const { user, isLoggedIn } = useAuth();
    const { isRestricted } = useUserStatus();

    const [activeTab, setActiveTab] = useState<Tab>("overview");
    const [copiedLink, setCopiedLink] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [rentalFilter, setRentalFilter] = useState<"all" | "published" | "draft">("all");
    const [promotingAd, setPromotingAd] = useState<{ id: string; title: string } | null>(null);

    const swiperRef = useRef<SwiperType | null>(null);
    const isManualScrollingRef = useRef(false);

    // Host profile query & mutation
    const { data: hostProfile, isLoading: isLoadingHost } = useHostProfile();
    const updateHostMutation = useUpdateHostProfile();

    // Host Rentals (Temporary Rent Ads) query
    const { data: adsResponse, isLoading: isLoadingRentals } = useTemporaryRentAds(
        user?.userId ? { ownerId: user.userId } : {},
        { enabled: !!user?.userId }
    );

    const rentals = useMemo(() => {
        return adsResponse?.items ?? [];
    }, [adsResponse]);

    const filteredRentals = useMemo(() => {
        if (rentalFilter === "published") return rentals.filter((r) => r.status === "PUBLISHED");
        if (rentalFilter === "draft") return rentals.filter((r) => r.status === "DRAFT");
        return rentals;
    }, [rentals, rentalFilter]);

    // Host Posts query
    const hostIdentifier = hostProfile?.slug || hostProfile?.id || hostProfile?.userId || user?.userId || "";
    const {
        data: postsData,
        isLoading: isLoadingPosts,
        refetch: refetchPosts,
    } = useShowcasePosts("host", hostIdentifier);

    const posts = useMemo(() => {
        return postsData?.items ?? [];
    }, [postsData]);

    const deletePostMutation = useMutation({
        mutationFn: (postId: string) => showcaseService.deletePost(postId),
        onSuccess: () => {
            toast.success("پست با موفقیت حذف شد.");
            refetchPosts();
        },
        onError: () => {
            toast.error("خطا در حذف پست.");
        },
    });

    // Temporary rent mutations
    const publishMutation = usePublishTemporaryRent();
    const deleteMutation = useDeleteTemporaryRent();

    const handlePublishRental = async (id: string) => {
        if (isRestricted) {
            toast.error("حساب کاربری شما محدود شده است و امکان انتشار آگهی وجود ندارد.");
            return;
        }
        try {
            await publishMutation.mutateAsync(id);
            toast.success("اقامتگاه با موفقیت منتشر شد");
        } catch {
            toast.error("خطا در انتشار اقامتگاه. لطفاً اطلاعات را بررسی کنید.");
        }
    };

    const handleDeleteRental = async (id: string) => {
        if (!window.confirm("آیا از حذف این اقامتگاه اطمینان دارید؟")) return;
        try {
            await deleteMutation.mutateAsync(id);
            toast.success("اقامتگاه با موفقیت حذف شد");
        } catch {
            toast.error("خطا در حذف اقامتگاه");
        }
    };

    // Settings form state
    const [settingsForm, setSettingsForm] = useState({
        hostName: "",
        slug: "",
        bio: "",
        avatarUrl: "",
        coverUrl: "",
        phone: "",
        mobile: "",
        address: "",
    });

    const initialFormValues = useMemo(() => {
        if (!hostProfile) return null;
        return {
            hostName: hostProfile.hostName || hostProfile.title || "",
            slug: hostProfile.slug || "",
            bio: hostProfile.bio || "",
            avatarUrl: hostProfile.avatarUrl || "",
            coverUrl: hostProfile.coverUrl || "",
            phone: hostProfile.phone || "",
            mobile: hostProfile.mobile || "",
            address: hostProfile.address || "",
        };
    }, [hostProfile]);

    useEffect(() => {
        if (initialFormValues) {
            setSettingsForm(initialFormValues);
        }
    }, [initialFormValues]);

    const hasChanges = useMemo(() => {
        if (!initialFormValues) return false;
        return (Object.keys(initialFormValues) as (keyof typeof initialFormValues)[]).some(
            (key) => settingsForm[key] !== initialFormValues[key]
        );
    }, [settingsForm, initialFormValues]);

    const handleRevertChanges = () => {
        if (initialFormValues) {
            setSettingsForm(initialFormValues);
        }
        setIsEditing(false);
    };

    const publicShowcasePath = `/host/${hostProfile?.slug || hostProfile?.id || hostProfile?.userId || user?.userId || ""}`;
    const fullPublicUrl = typeof window !== "undefined" ? `${window.location.origin}${publicShowcasePath}` : publicShowcasePath;

    const handleCopyLink = () => {
        if (typeof navigator !== "undefined" && navigator.clipboard) {
            navigator.clipboard.writeText(fullPublicUrl);
            setCopiedLink(true);
            toast.success("لینک ویترین میزبان با موفقیت کپی شد");
            setTimeout(() => setCopiedLink(false), 2500);
        }
    };

    // Scroll smoothly to section when tab clicked
    const scrollToSection = (tabId: Tab) => {
        setActiveTab(tabId);
        isManualScrollingRef.current = true;
        const targetElement = document.getElementById(`section-${tabId}`);
        if (targetElement) {
            const topOffset = targetElement.getBoundingClientRect().top + window.scrollY - 130;
            window.scrollTo({
                top: topOffset,
                behavior: "smooth",
            });
            setTimeout(() => {
                isManualScrollingRef.current = false;
            }, 800);
        }
    };

    // Scroll spy: Update activeTab as user scrolls down the page
    useEffect(() => {
        const handleScroll = () => {
            if (isManualScrollingRef.current) return;
            const scrollPosition = window.scrollY + 160;

            for (let i = TABS.length - 1; i >= 0; i--) {
                const section = document.getElementById(`section-${TABS[i].id}`);
                if (section && section.offsetTop <= scrollPosition) {
                    const currentTab = TABS[i].id;
                    setActiveTab(currentTab);
                    const tabIndex = TABS.findIndex((t) => t.id === currentTab);
                    if (swiperRef.current && tabIndex !== -1) {
                        swiperRef.current.slideTo(tabIndex);
                    }
                    break;
                }
            }
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Unauthenticated State
    if (!isLoggedIn) {
        return (
            <div className="min-h-screen bg-canvas flex items-center justify-center p-4 sm:p-6 text-center" dir="rtl">
                <div className="w-full max-w-md bg-surface/90 backdrop-blur-xl border border-soft-border/70 p-8 sm:p-10 rounded-[28px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-6">
                    <div className="w-16 h-16 rounded-[22px] bg-primary/10 border border-primary/15 text-primary flex items-center justify-center mx-auto shadow-inner">
                        <Home className="w-8 h-8" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-xl font-black text-brand tracking-tight">ورود به پنل میزبانی</h2>
                        <p className="text-xs sm:text-sm text-secondary leading-relaxed">
                            برای مدیریت اقامتگاه‌ها، ویرایش ویترین و انتشار مقالات، ابتدا وارد حساب کاربری خود شوید.
                        </p>
                    </div>
                    <button
                        onClick={() => router.push("/auth")}
                        className="w-full py-3.5 bg-brand hover:bg-brand/90 active:scale-[0.98] text-white rounded-2xl text-xs sm:text-sm font-black transition-all shadow-md shadow-brand/10 cursor-pointer"
                    >
                        ورود به حساب کاربری
                    </button>
                </div>
            </div>
        );
    }

    // Loading State
    if (isLoadingRentals && isLoadingHost) {
        return (
            <div className="min-h-screen bg-canvas flex items-center justify-center p-6 text-center" dir="rtl">
                <div className="space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto animate-pulse">
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                    <p className="text-xs sm:text-sm font-bold text-secondary">در حال فراخوانی پنل میزبانی و اقامتگاه‌ها...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-canvas text-brand pb-32 lg:pb-16 selection:bg-accent/30" dir="rtl">
            {/* Clean Apple Navigation Bar */}
            <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur-xl border-b border-soft-border/70 transition-all">
                <div className="max-w-6xl mx-auto px-3.5 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-3">
                    {/* Back Button & Host Title */}
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                        <button
                            onClick={handleBack}
                            aria-label="بازگشت"
                            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-soft-bg/80 hover:bg-soft-bg active:scale-95 border border-soft-border/60 flex items-center justify-center text-brand transition-all shrink-0 cursor-pointer"
                        >
                            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 rotate-180" />
                        </button>

                        <div className="flex items-center gap-2 min-w-0">
                            {hostProfile?.avatarUrl ? (
                                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl overflow-hidden border border-soft-border/80 bg-surface shrink-0 relative shadow-2xs">
                                    <Image
                                        src={getMediaUrl(hostProfile.avatarUrl)}
                                        alt={hostProfile.hostName || "میزبان"}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                            ) : null}

                            <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <h1 className="text-xs sm:text-sm md:text-base font-black text-brand truncate">
                                        {hostProfile?.hostName || "پنل اقامتگاه‌ها و میزبانی"}
                                    </h1>
                                    {hostProfile?.isVerified && (
                                        <BadgeCheck className="w-4 h-4 text-success shrink-0" />
                                    )}
                                </div>
                                <span className="text-[10px] text-secondary font-medium hidden md:block">
                                    مدیریت اقامتگاه‌ها و ویترین اجاره موقت
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Actions: Clean & Minimal on mobile */}
                    <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
                        <button
                            type="button"
                            onClick={handleCopyLink}
                            className="p-2 sm:px-3 sm:py-2 rounded-xl sm:rounded-2xl bg-soft-bg/60 hover:bg-soft-bg active:scale-95 text-secondary hover:text-brand border border-soft-border/70 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                            title="کپی آدرس ویترین میزبان"
                            aria-label="کپی آدرس ویترین میزبان"
                        >
                            {copiedLink ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                            <span className="hidden sm:inline">{copiedLink ? "کپی شد" : "کپی لینک"}</span>
                        </button>

                        <Link
                            href={publicShowcasePath}
                            target="_blank"
                            className="p-2 sm:px-3.5 sm:py-2 rounded-xl sm:rounded-2xl bg-brand hover:bg-brand/90 active:scale-95 text-white text-xs font-black transition-all shadow-xs flex items-center gap-1.5"
                            title="مشاهده ویترین عمومی"
                            aria-label="مشاهده ویترین عمومی"
                        >
                            <ExternalLink className="w-4 h-4" />
                            <span className="hidden sm:inline">ویترین میزبان</span>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Apple-style Sticky Tabs powered by Swiper */}
            <div className="sticky top-14 sm:top-16 z-20 bg-canvas/80 backdrop-blur-xl border-b border-soft-border/60 py-2 sm:py-2.5 transition-all">
                <div className="max-w-6xl mx-auto px-3.5 sm:px-6 lg:px-8">
                    <Swiper
                        modules={[FreeMode]}
                        freeMode={{ enabled: true, momentum: true }}
                        slidesPerView="auto"
                        spaceBetween={8}
                        onBeforeInit={(swiper) => {
                            swiperRef.current = swiper;
                        }}
                        className="w-full !overflow-visible"
                    >
                        {TABS.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            const badgeCount =
                                tab.id === "rentals" && rentals.length > 0
                                    ? rentals.length
                                    : tab.id === "posts" && posts.length > 0
                                    ? posts.length
                                    : null;

                            return (
                                <SwiperSlide key={tab.id} className="!w-auto">
                                    <button
                                        type="button"
                                        onClick={() => scrollToSection(tab.id)}
                                        className={cn(
                                            "inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs font-black transition-all duration-200 select-none cursor-pointer whitespace-nowrap",
                                            isActive
                                                ? "bg-surface text-brand border border-soft-border shadow-xs scale-[1.02]"
                                                : "bg-soft-bg/50 text-secondary hover:text-brand hover:bg-soft-bg/80 border border-transparent"
                                        )}
                                    >
                                        <Icon className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4", isActive ? "text-primary" : "text-secondary")} />
                                        <span>{tab.label}</span>
                                        {badgeCount !== null && (
                                            <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-soft-border/70 text-secondary">
                                                {toPersianDigits(badgeCount)}
                                            </span>
                                        )}
                                    </button>
                                </SwiperSlide>
                            );
                        })}
                    </Swiper>
                </div>
            </div>

            {/* Main Content: Stacked Sections with Smooth Anchors */}
            <main className="max-w-6xl mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-12">
                {isRestricted && <AccountStatusBanner />}

                {/* ───────────────────────────────────────────────────────────── */}
                {/* SECTION 1: OVERVIEW & STATS                                  */}
                {/* ───────────────────────────────────────────────────────────── */}
                <section id="section-overview" className="space-y-5 scroll-mt-28">
                    {/* Clean Apple Showcase Card */}
                    <div className="rounded-[24px] sm:rounded-[28px] bg-surface border border-soft-border/70 p-5 sm:p-7 shadow-xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="space-y-1.5 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-success border border-emerald-500/20">
                                        میزبان اقامتگاه
                                    </span>
                                    {hostProfile?.isVerified ? (
                                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-success border border-emerald-500/20 flex items-center gap-1">
                                            <ShieldCheck className="w-3 h-3 text-success" />
                                            <span>میزبان تایید شده</span>
                                        </span>
                                    ) : (
                                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-warning border border-amber-500/20 flex items-center gap-1">
                                            <Clock className="w-3 h-3 text-warning" />
                                            <span>حساب عادی</span>
                                        </span>
                                    )}
                                </div>

                                <h2 className="text-lg sm:text-xl font-black text-brand tracking-tight">
                                    {hostProfile?.hostName || "ویترین اقامتگاه‌های شما"}
                                </h2>

                                {hostProfile?.bio && (
                                    <p className="text-xs sm:text-sm text-secondary line-clamp-2 leading-relaxed">
                                        {hostProfile.bio}
                                    </p>
                                )}

                                <div className="pt-1 flex items-center gap-2">
                                    <span className="text-[11px] text-secondary font-mono truncate max-w-xs" dir="ltr">
                                        {fullPublicUrl}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0">
                                <Link
                                    href={publicShowcasePath}
                                    target="_blank"
                                    className="px-4 py-2.5 rounded-xl bg-brand hover:bg-brand/90 active:scale-95 text-white text-xs font-black transition-all shadow-xs inline-flex items-center gap-1.5"
                                >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>مشاهده زنده</span>
                                </Link>
                                <button
                                    type="button"
                                    onClick={() => {
                                        scrollToSection("settings");
                                        setIsEditing(true);
                                    }}
                                    className="px-4 py-2.5 rounded-xl bg-soft-bg hover:bg-soft-border/70 text-brand text-xs font-bold transition-all border border-soft-border/70 cursor-pointer inline-flex items-center gap-1.5"
                                >
                                    <Edit3 className="w-3.5 h-3.5 text-secondary" />
                                    <span>ویرایش ویترین</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Apple KPI Metric Grid (Rentals, Posts, Rating, Status) */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        <div className="p-4 rounded-2xl bg-surface border border-soft-border/70 shadow-2xs space-y-1">
                            <span className="text-[11px] font-bold text-secondary flex items-center justify-between">
                                <span>اقامتگاه‌ها</span>
                                <Home className="w-3.5 h-3.5 text-primary" />
                            </span>
                            <div className="text-xl sm:text-2xl font-black text-brand">
                                {toPersianDigits(rentals.length)}
                            </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-surface border border-soft-border/70 shadow-2xs space-y-1">
                            <span className="text-[11px] font-bold text-secondary flex items-center justify-between">
                                <span>پست‌ها و راهنماها</span>
                                <BookOpen className="w-3.5 h-3.5 text-accent-foreground" />
                            </span>
                            <div className="text-xl sm:text-2xl font-black text-brand">
                                {toPersianDigits(posts.length)}
                            </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-surface border border-soft-border/70 shadow-2xs space-y-1">
                            <span className="text-[11px] font-bold text-secondary flex items-center justify-between">
                                <span>امتیاز مهمانان</span>
                                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                            </span>
                            <div className="text-xl sm:text-2xl font-black text-brand">
                                {hostProfile?.rating != null && !isNaN(Number(hostProfile.rating)) && Number(hostProfile.rating) > 0 ? (
                                    <span>{toPersianDigits(Number(hostProfile.rating).toFixed(1))} <span className="text-xs font-normal text-secondary">از ۵</span></span>
                                ) : (
                                    <span className="text-sm font-bold text-secondary">بدون نظر</span>
                                )}
                            </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-surface border border-soft-border/70 shadow-2xs space-y-1">
                            <span className="text-[11px] font-bold text-secondary flex items-center justify-between">
                                <span>وضعیت میزبانی</span>
                                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            </span>
                            <div className="text-base sm:text-lg font-black text-success">
                                {isRestricted ? "محدود شده" : "فعال و آنلاین"}
                            </div>
                        </div>
                    </div>

                    {/* Content Studio Minimal Callout */}
                    <div className="rounded-2xl bg-soft-bg/60 border border-soft-border/70 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-brand text-accent flex items-center justify-center shrink-0">
                                <PenTool className="w-4 h-4" />
                            </div>
                            <div>
                                <h3 className="text-xs sm:text-sm font-black text-brand">استودیو انتشار پست و راهنمای اقامتگاه</h3>
                                <p className="text-[11px] text-secondary">معرفی تصویری امکانات، راهنمای سفر و جاذبه‌های گردشگری برای مسافران</p>
                            </div>
                        </div>
                        <Link
                            href="/posts/create"
                            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-brand hover:bg-brand/90 text-white text-xs font-black transition-all shrink-0 shadow-2xs"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span>ایجاد پست جدید</span>
                        </Link>
                    </div>
                </section>

                {/* ───────────────────────────────────────────────────────────── */}
                {/* SECTION 2: RENTALS MANAGEMENT                                */}
                {/* ───────────────────────────────────────────────────────────── */}
                <section id="section-rentals" className="space-y-6 scroll-mt-28">
                    <div className="border-b border-soft-border/60 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <Home className="w-5 h-5 text-primary" />
                            <div>
                                <h2 className="text-base sm:text-lg font-black text-brand">اقامتگاه‌های ثبت‌شده</h2>
                                <p className="text-[11px] text-secondary">
                                    مدیریت وضعیت، قیمت‌گذاری و ارتقای اقامتگاه‌های اجاره موقت
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-auto">
                            {/* Filter Chips */}
                            <div className="inline-flex items-center p-1 bg-soft-bg/80 rounded-xl border border-soft-border/70 gap-1">
                                <button
                                    type="button"
                                    onClick={() => setRentalFilter("all")}
                                    className={cn(
                                        "px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                                        rentalFilter === "all" ? "bg-surface text-brand shadow-xs" : "text-secondary hover:text-brand"
                                    )}
                                >
                                    همه ({toPersianDigits(rentals.length)})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRentalFilter("published")}
                                    className={cn(
                                        "px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                                        rentalFilter === "published" ? "bg-surface text-brand shadow-xs" : "text-secondary hover:text-brand"
                                    )}
                                >
                                    منتشر شده
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRentalFilter("draft")}
                                    className={cn(
                                        "px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                                        rentalFilter === "draft" ? "bg-surface text-brand shadow-xs" : "text-secondary hover:text-brand"
                                    )}
                                >
                                    پیش‌نویس
                                </button>
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    if (isRestricted) {
                                        toast.error("حساب کاربری شما محدود شده است و امکان ثبت اقامتگاه وجود ندارد.");
                                        return;
                                    }
                                    router.push("/profile/temporary-rent/new");
                                }}
                                disabled={isRestricted}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand hover:bg-brand/90 active:scale-95 text-white text-xs font-black transition-all shadow-2xs shrink-0 cursor-pointer disabled:opacity-50"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span>ثبت اقامتگاه</span>
                            </button>
                        </div>
                    </div>

                    {isLoadingRentals ? (
                        <div className="rounded-2xl bg-surface border border-soft-border/70 p-10 text-center">
                            <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                            <p className="text-xs font-bold text-secondary">در حال دریافت لیست اقامتگاه‌ها...</p>
                        </div>
                    ) : filteredRentals.length === 0 ? (
                        <div className="rounded-2xl bg-surface border border-soft-border/70 p-8 sm:p-12 text-center space-y-3">
                            <div className="w-12 h-12 rounded-2xl bg-soft-bg border border-soft-border/70 text-secondary flex items-center justify-center mx-auto">
                                <Home className="w-6 h-6" />
                            </div>
                            <div className="space-y-1 max-w-sm mx-auto">
                                <h4 className="text-sm font-black text-brand">اقامتگاهی در این بخش یافت نشد</h4>
                                <p className="text-xs text-secondary">
                                    همین حالا اولین آگهی اجاره موقت خود را ثبت کرده و میزبانی را آغاز کنید.
                                </p>
                            </div>
                            <div className="pt-1">
                                <button
                                    type="button"
                                    onClick={() => router.push("/profile/temporary-rent/new")}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand text-white text-xs font-black cursor-pointer"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>ثبت اولین اقامتگاه</span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {filteredRentals.map((ad) => (
                                <div
                                    key={ad.id}
                                    className="rounded-[24px] bg-surface border border-soft-border/70 p-4 sm:p-5 shadow-2xs hover:shadow-xs transition-all space-y-4"
                                >
                                    <div className="flex flex-col sm:flex-row gap-4">
                                        {/* Image */}
                                        <div className="w-full sm:w-44 h-36 rounded-2xl bg-soft-bg/60 overflow-hidden relative shrink-0 border border-soft-border/50">
                                            {ad.mediaIds && ad.mediaIds.length > 0 ? (
                                                <Image
                                                    src={getMediaUrl(ad.mediaIds[0])}
                                                    alt={ad.title}
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex flex-col items-center justify-center text-secondary/50 gap-1">
                                                    <Info className="w-5 h-5" />
                                                    <span className="text-[10px] font-bold">بدون تصویر</span>
                                                </div>
                                            )}
                                            <div className="absolute top-2.5 right-2.5">
                                                <span
                                                    className={cn(
                                                        "px-2 py-0.5 rounded-lg text-[10px] font-black border shadow-xs",
                                                        statusLabels[ad.status]?.color,
                                                        statusLabels[ad.status]?.border
                                                    )}
                                                >
                                                    {statusLabels[ad.status]?.label || ad.status}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 flex flex-col justify-between space-y-2">
                                            <div className="space-y-1.5">
                                                <h3 className="text-sm sm:text-base font-black text-brand leading-snug">
                                                    {ad.title}
                                                </h3>

                                                <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-secondary text-xs font-bold">
                                                    <div className="flex items-center gap-1.5">
                                                        <MapPin className="w-3.5 h-3.5 text-primary" />
                                                        <span>{ad.cityName || "شهر"}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <Users className="w-3.5 h-3.5 text-secondary" />
                                                        <span>تا {toPersianDigits(ad.maxGuests)} نفر</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <Calendar className="w-3.5 h-3.5 text-secondary" />
                                                        <span>{new Date(ad.createdAt).toLocaleDateString("fa-IR")}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-soft-border/40">
                                                <div>
                                                    {(() => {
                                                        const trPrice = formatTemporaryRentPricing(ad.pricing);
                                                        return (
                                                            <>
                                                                <span className="text-[10px] text-secondary font-bold block">{trPrice.label}:</span>
                                                                <span className="text-sm font-black text-primary">
                                                                    {trPrice.formatted} {trPrice.hasCurrency && <span className="text-[10px] font-normal text-secondary">تومان</span>}
                                                                </span>
                                                            </>
                                                        );
                                                    })()}
                                                </div>

                                                <div className="flex flex-wrap items-center gap-2">
                                                    {ad.status === "DRAFT" && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handlePublishRental(ad.id)}
                                                            disabled={publishMutation.isPending}
                                                            className="px-3 py-1.5 rounded-xl bg-primary text-white hover:bg-primary/90 text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                                                        >
                                                            <Rocket className="w-3.5 h-3.5" />
                                                            <span>انتشار آگهی</span>
                                                        </button>
                                                    )}

                                                    {ad.status === "PUBLISHED" && !ad.isFeatured && !ad.isUrgent && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setPromotingAd({ id: ad.id, title: ad.title })}
                                                            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                                                        >
                                                            <Award className="w-3.5 h-3.5" />
                                                            <span>ارتقا (فوری/نردبان)</span>
                                                        </button>
                                                    )}

                                                    <Link
                                                        href={`/temporary-rent/${ad.id}`}
                                                        className="px-3 py-1.5 rounded-xl border border-soft-border/80 text-secondary hover:text-brand hover:bg-soft-bg text-xs font-bold transition-all"
                                                    >
                                                        مشاهده
                                                    </Link>

                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteRental(ad.id)}
                                                        disabled={deleteMutation.isPending}
                                                        className="p-1.5 rounded-xl text-status-error hover:bg-status-error/10 transition-colors cursor-pointer"
                                                        title="حذف اقامتگاه"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* ───────────────────────────────────────────────────────────── */}
                {/* SECTION 3: SETTINGS & HOST SHOWCASE CUSTOMIZATION            */}
                {/* ───────────────────────────────────────────────────────────── */}
                <section id="section-settings" className="space-y-6 scroll-mt-28">
                    {/* Header with Edit Toggle */}
                    <div className="border-b border-soft-border/60 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <Settings className="w-5 h-5 text-secondary" />
                            <div>
                                <h2 className="text-base sm:text-lg font-black text-brand">تنظیمات و ویترین اختصاصی میزبان</h2>
                                <p className="text-[11px] text-secondary">
                                    {isEditing
                                        ? "در حال ویرایش اطلاعات ویترین - پس از اعمال تغییرات، دکمه ذخیره فعال خواهد شد."
                                        : "مشاهده مشخصات عمومی میزبان. برای تغییر اطلاعات روی «ویرایش اطلاعات» کلیک کنید."}
                                </p>
                            </div>
                        </div>

                        {/* Edit Mode Buttons */}
                        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                            {isEditing ? (
                                <button
                                    type="button"
                                    onClick={handleRevertChanges}
                                    className="px-3.5 py-1.5 rounded-xl border border-soft-border text-secondary hover:bg-soft-bg text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    <span>انصراف</span>
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setIsEditing(true)}
                                    className="px-4 py-2 rounded-xl bg-brand hover:bg-brand/90 active:scale-95 text-white text-xs font-black transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                                >
                                    <Edit3 className="w-3.5 h-3.5" />
                                    <span>ویرایش اطلاعات</span>
                                </button>
                            )}
                        </div>
                    </div>

                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            if (!hasChanges) {
                                toast.info("تغییری برای ذخیره ثبت نشده است.");
                                return;
                            }
                            updateHostMutation.mutate(settingsForm as UpdateHostProfileRequest, {
                                onSuccess: () => {
                                    setIsEditing(false);
                                    queryClient.invalidateQueries({ queryKey: ["hosts"] });
                                },
                            });
                        }}
                        className="space-y-6"
                    >
                        {/* Section: Basic Identity */}
                        <div className={cn(
                            "rounded-[24px] bg-surface border transition-all p-5 sm:p-7 shadow-xs space-y-4",
                            isEditing ? "border-primary/40 ring-1 ring-primary/20" : "border-soft-border/70"
                        )}>
                            <h3 className="text-sm font-black text-brand flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-primary" />
                                <span>مشخصات پایه و عنوان میزبان</span>
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-brand block">
                                        نام میزبان یا عنوان اقامتگاه <span className="text-status-error">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        disabled={!isEditing}
                                        value={settingsForm.hostName}
                                        onChange={(e) => setSettingsForm({ ...settingsForm, hostName: e.target.value })}
                                        className={cn(
                                            "w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm text-brand transition-all",
                                            isEditing
                                                ? "bg-surface border border-soft-border/80 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                                : "bg-soft-bg/40 border border-soft-border/50 text-secondary cursor-not-allowed"
                                        )}
                                        placeholder="مثال: ویلاهای اختصاصی شمال - میزبان رضایی"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-brand block">
                                        شناسه آدرس وب (Slug) - فقط انگلیسی
                                    </label>
                                    <input
                                        type="text"
                                        disabled={!isEditing}
                                        value={settingsForm.slug}
                                        onChange={(e) =>
                                            setSettingsForm({
                                                ...settingsForm,
                                                slug: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""),
                                            })
                                        }
                                        placeholder="host-rezaei"
                                        dir="ltr"
                                        className={cn(
                                            "w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-mono text-brand transition-all text-left",
                                            isEditing
                                                ? "bg-surface border border-soft-border/80 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                                : "bg-soft-bg/40 border border-soft-border/50 text-secondary cursor-not-allowed"
                                        )}
                                    />
                                </div>

                                <div className="space-y-1.5 sm:col-span-2">
                                    <label className="text-xs font-bold text-brand block">معرفی میزبان و تجربه مهمان‌نوازی</label>
                                    <textarea
                                        disabled={!isEditing}
                                        value={settingsForm.bio}
                                        onChange={(e) => setSettingsForm({ ...settingsForm, bio: e.target.value })}
                                        rows={3}
                                        placeholder="توضیحاتی در مورد سوابق میزبانی، قوانین عمومی اقامتگاه، خدمات ویژه مسافران و شرایط پذیرش..."
                                        className={cn(
                                            "w-full p-3 rounded-xl text-xs sm:text-sm text-brand transition-all leading-relaxed",
                                            isEditing
                                                ? "bg-surface border border-soft-border/80 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                                : "bg-soft-bg/40 border border-soft-border/50 text-secondary cursor-not-allowed"
                                        )}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section: Media & Visuals */}
                        <div className={cn(
                            "rounded-[24px] bg-surface border transition-all p-5 sm:p-7 shadow-xs space-y-4",
                            isEditing ? "border-primary/40 ring-1 ring-primary/20" : "border-soft-border/70"
                        )}>
                            <h3 className="text-sm font-black text-brand flex items-center gap-2">
                                <ImageIcon className="w-4 h-4 text-accent" />
                                <span>تصاویر نمایه و بنر سربرگ</span>
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-3.5 rounded-xl bg-soft-bg/30 border border-soft-border/60">
                                    <MediaIconUpload
                                        label="تصویر پرتره میزبان یا نشان اقامتگاه"
                                        helperText="فرمت: مربع با کیفیت بالا"
                                        disabled={!isEditing}
                                        value={settingsForm.avatarUrl}
                                        onChange={(mediaId) => setSettingsForm({ ...settingsForm, avatarUrl: mediaId })}
                                    />
                                </div>

                                <div className="p-3.5 rounded-xl bg-soft-bg/30 border border-soft-border/60">
                                    <MediaIconUpload
                                        label="تصویر بنر سربرگ (کاور بالای صفحه ویترین)"
                                        helperText="فرمت: افقی با نسبت ۱۶:۹"
                                        disabled={!isEditing}
                                        value={settingsForm.coverUrl}
                                        onChange={(mediaId) => setSettingsForm({ ...settingsForm, coverUrl: mediaId })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section: Contacts & Location */}
                        <div className={cn(
                            "rounded-[24px] bg-surface border transition-all p-5 sm:p-7 shadow-xs space-y-4",
                            isEditing ? "border-primary/40 ring-1 ring-primary/20" : "border-soft-border/70"
                        )}>
                            <h3 className="text-sm font-black text-brand flex items-center gap-2">
                                <Phone className="w-4 h-4 text-success" />
                                <span>اطلاعات تماس و موقعیت</span>
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-brand block flex items-center gap-1.5">
                                        <Smartphone className="w-3.5 h-3.5 text-secondary" />
                                        <span>شماره همراه جهت هماهنگی</span>
                                    </label>
                                    <input
                                        type="text"
                                        disabled={!isEditing}
                                        value={settingsForm.mobile}
                                        onChange={(e) => setSettingsForm({ ...settingsForm, mobile: toOnlyDigits(e.target.value) })}
                                        placeholder="۰۹۱۲..."
                                        dir="ltr"
                                        className={cn(
                                            "w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-mono text-brand transition-all text-left",
                                            isEditing
                                                ? "bg-surface border border-soft-border/80 focus:outline-none focus:ring-2 focus:ring-primary/20 text-left"
                                                : "bg-soft-bg/40 border border-soft-border/50 text-secondary cursor-not-allowed"
                                        )}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-brand block flex items-center gap-1.5">
                                        <Phone className="w-3.5 h-3.5 text-secondary" />
                                        <span>تلفن ثابت</span>
                                    </label>
                                    <input
                                        type="text"
                                        disabled={!isEditing}
                                        value={settingsForm.phone}
                                        onChange={(e) => setSettingsForm({ ...settingsForm, phone: toEnglishDigits(e.target.value) })}
                                        placeholder="۰۲۱..."
                                        dir="ltr"
                                        className={cn(
                                            "w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-mono text-brand transition-all text-left",
                                            isEditing
                                                ? "bg-surface border border-soft-border/80 focus:outline-none focus:ring-2 focus:ring-primary/20 text-left"
                                                : "bg-soft-bg/40 border border-soft-border/50 text-secondary cursor-not-allowed"
                                        )}
                                    />
                                </div>

                                <div className="space-y-1.5 sm:col-span-2 md:col-span-1">
                                    <label className="text-xs font-bold text-brand block flex items-center gap-1.5">
                                        <MapPin className="w-3.5 h-3.5 text-secondary" />
                                        <span>محدوده یا نشانی اقامتگاه</span>
                                    </label>
                                    <input
                                        type="text"
                                        disabled={!isEditing}
                                        value={settingsForm.address}
                                        onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                                        placeholder="مثال: استان مازندران، نوشهر..."
                                        className={cn(
                                            "w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm text-brand transition-all",
                                            isEditing
                                                ? "bg-surface border border-soft-border/80 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                : "bg-soft-bg/40 border border-soft-border/50 text-secondary cursor-not-allowed"
                                        )}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Save Action Button */}
                        {isEditing && (
                            <div className="sticky bottom-4 z-20 bg-surface/95 backdrop-blur-xl border border-soft-border/80 p-3.5 sm:p-4 rounded-2xl shadow-lg flex items-center justify-between gap-3 transition-all animate-in fade-in slide-in-from-bottom-2">
                                <div className="flex items-center gap-2 text-xs">
                                    <span className={cn(
                                        "w-2 h-2 rounded-full",
                                        hasChanges ? "bg-amber-500 animate-pulse" : "bg-secondary/40"
                                    )} />
                                    <span className="text-secondary font-medium">
                                        {hasChanges ? "تغییرات اعمال‌شده آماده ذخیره‌سازی هستند." : "تغییری در فیلدها اعمال نشده است."}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={handleRevertChanges}
                                        className="px-3.5 py-2 rounded-xl border border-soft-border text-xs font-bold text-secondary hover:bg-soft-bg transition-all cursor-pointer"
                                    >
                                        انصراف
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={!hasChanges || updateHostMutation.isPending}
                                        className={cn(
                                            "px-5 py-2 rounded-xl text-xs sm:text-sm font-black transition-all inline-flex items-center gap-2 cursor-pointer shadow-sm",
                                            hasChanges
                                                ? "bg-brand hover:bg-brand/90 text-white shadow-brand/10 active:scale-95"
                                                : "bg-soft-bg text-secondary/50 cursor-not-allowed border border-soft-border/50"
                                        )}
                                    >
                                        {updateHostMutation.isPending && (
                                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        )}
                                        <span>{updateHostMutation.isPending ? "در حال ذخیره‌سازی..." : "ذخیره تغییرات"}</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </form>
                </section>

                {/* ───────────────────────────────────────────────────────────── */}
                {/* SECTION 4: HOST POSTS & ARTICLES                             */}
                {/* ───────────────────────────────────────────────────────────── */}
                <section id="section-posts" className="space-y-6 scroll-mt-28">
                    <div className="border-b border-soft-border/60 pb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-accent-foreground" />
                            <div>
                                <h2 className="text-base sm:text-lg font-black text-brand">پست‌ها و مقالات اختصاصی میزبان</h2>
                                <p className="text-[11px] text-secondary">
                                    {posts.length > 0 ? `${toPersianDigits(posts.length)} مطلب منتشر شده یا تور اقامتگاه` : "راهنماهای سفر و معرفی اقامتگاه"}
                                </p>
                            </div>
                        </div>

                        <Link
                            href="/posts/create"
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand hover:bg-brand/90 active:scale-95 text-white text-xs font-black transition-all shadow-2xs shrink-0"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span>پست جدید</span>
                        </Link>
                    </div>

                    {isLoadingPosts ? (
                        <div className="rounded-2xl bg-surface border border-soft-border/70 p-10 text-center">
                            <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                            <p className="text-xs font-bold text-secondary">در حال دریافت پست‌ها...</p>
                        </div>
                    ) : posts.length === 0 ? (
                        <div className="rounded-2xl bg-surface border border-soft-border/70 p-8 sm:p-12 text-center space-y-3">
                            <div className="w-12 h-12 rounded-2xl bg-soft-bg border border-soft-border/70 text-secondary flex items-center justify-center mx-auto">
                                <BookOpen className="w-6 h-6" />
                            </div>
                            <div className="space-y-1 max-w-sm mx-auto">
                                <h4 className="text-sm font-black text-brand">هنوز پستی ثبت نشده است</h4>
                                <p className="text-xs text-secondary">
                                    با انتشار راهنماهای سفر و جاذبه‌های اطراف اقامتگاه، رزروهای بیشتری دریافت کنید.
                                </p>
                            </div>
                            <div className="pt-1">
                                <Link
                                    href="/posts/create"
                                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand text-white text-xs font-black"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>نوشتن اولین پست</span>
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {posts.map((post) => (
                                <div
                                    key={post.id}
                                    className="rounded-2xl bg-surface border border-soft-border/70 p-4 sm:p-5 shadow-2xs space-y-3 flex flex-col justify-between hover:border-soft-border transition-all"
                                >
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-success">
                                                منتشر شده
                                            </span>
                                            <span className="text-[10px] text-secondary">
                                                {new Date(post.createdAt).toLocaleDateString("fa-IR")}
                                            </span>
                                        </div>

                                        <h4 className="text-xs sm:text-sm font-black text-brand line-clamp-2">
                                            {post.title}
                                        </h4>

                                        {post.summary && (
                                            <p className="text-xs text-secondary line-clamp-2 leading-relaxed">
                                                {post.summary}
                                            </p>
                                        )}
                                    </div>

                                    <div className="pt-2.5 border-t border-soft-border/50 flex items-center justify-between text-xs">
                                        <span className="text-secondary text-[11px]">
                                            پسندها: {toPersianDigits(post.likeCount || 0)}
                                        </span>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (window.confirm("آیا از حذف این پست اطمینان دارید؟")) {
                                                    deletePostMutation.mutate(post.id);
                                                }
                                            }}
                                            disabled={deletePostMutation.isPending}
                                            className="p-1.5 text-status-error hover:bg-status-error/10 rounded-lg transition-colors cursor-pointer"
                                            title="حذف پست"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </main>

            {/* Promotion Modal for temporary rent boost */}
            <PromotionModal
                isOpen={Boolean(promotingAd)}
                onClose={() => setPromotingAd(null)}
                listingId={promotingAd?.id || ""}
                listingTitle={promotingAd?.title || ""}
                itemType="TEMPORARY_RENTAL"
            />
        </div>
    );
}
