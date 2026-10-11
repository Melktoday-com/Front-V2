"use client";

import { useAgencyStats, useMyAgency } from "@/hooks/useAgencies";
import { useAuth } from "@/hooks/useAuth";
import { cn, toPersianDigits, getMediaUrl } from "@/lib/utils";
import { agencyService } from "@/services/agency.service";
import MediaIconUpload from "@/components/admin/MediaIconUpload";
import {
    AgencyConsultationMessage,
    AgencyPost,
    AgencyPostsListResponse,
    UpdateAgencyProfileRequest,
} from "@/types/api/agency.types";
import { normalizeApiError } from "@/lib/api/error-handler";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    ArrowUpRight,
    Award,
    BadgeCheck,
    BookOpen,
    Building2,
    Check,
    CheckCircle2,
    ChevronLeft,
    Clock,
    Copy,
    ExternalLink,
    Eye,
    Globe,
    LayoutDashboard,
    MapPin,
    MessageCircle,
    MessageSquare,
    Phone,
    Plus,
    Send,
    Settings,
    ShieldCheck,
    Smartphone,
    Sparkles,
    Star,
    Trash2,
    Users,
    X,
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

type Tab = "overview" | "settings" | "posts" | "messages";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "overview", label: "نمای کلی و آمار", icon: LayoutDashboard },
    { id: "settings", label: "شخصی‌سازی ویترین", icon: Settings },
    { id: "posts", label: "پست‌ها و مقالات", icon: BookOpen },
    { id: "messages", label: "پیام‌ها و مشاوره‌ها", icon: MessageSquare },
];

function InstagramIcon({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
            <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
        </svg>
    );
}

export default function AgencyPanelScene() {
    const { isLoggedIn } = useAuth();
    const router = useRouter();
    const handleBack = useSafeBack("/");
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<Tab>("overview");
    const [copiedLink, setCopiedLink] = useState(false);
    const [messageFilter, setMessageFilter] = useState<"all" | "pending" | "replied">("all");
    const swiperRef = useRef<SwiperType | null>(null);
    const isManualScrollingRef = useRef(false);

    const { data: agency, isLoading: isLoadingAgency } = useMyAgency();
    const { data: stats } = useAgencyStats(agency?.id || "");

    // Settings form state
    const [settingsForm, setSettingsForm] = useState({
        agencyName: "",
        slug: "",
        bio: "",
        logoUrl: "",
        coverUrl: "",
        licenseNumber: "",
        guildCode: "",
        website: "",
        phone: "",
        mobile: "",
        whatsapp: "",
        telegram: "",
        instagram: "",
        address: "",
        postalCode: "",
        workingHours: "",
    });

    useEffect(() => {
        if (agency) {
            setSettingsForm({
                agencyName: agency.agencyName || agency.name || "",
                slug: agency.slug || "",
                bio: agency.bio || "",
                logoUrl: agency.logoUrl || "",
                coverUrl: agency.coverUrl || "",
                licenseNumber: agency.licenseNumber || "",
                guildCode: agency.guildCode || "",
                website: agency.website || "",
                phone: agency.phone || "",
                mobile: agency.mobile || "",
                whatsapp: agency.whatsapp || "",
                telegram: agency.telegram || "",
                instagram: agency.instagram || "",
                address: agency.address || "",
                postalCode: agency.postalCode || "",
                workingHours: agency.workingHours || "",
            });
        }
    }, [agency]);

    // Update showcase mutation
    const updateShowcaseMutation = useMutation({
        mutationFn: (data: UpdateAgencyProfileRequest) => agencyService.updateMyShowcase(data),
        onSuccess: () => {
            toast.success("تنظیمات صفحه ویترین با موفقیت ذخیره شد.");
            queryClient.invalidateQueries({ queryKey: ["my-agency"] });
        },
        onError: (err: Error) => {
            toast.error(normalizeApiError(err, "خطا در بروزرسانی صفحه املاک."));
        },
    });

    // Posts query & mutations - loaded for the page
    const {
        data: postsData,
        isLoading: isLoadingPosts,
        refetch: refetchPosts,
    } = useQuery<AgencyPostsListResponse>({
        queryKey: ["agency-posts", agency?.id],
        queryFn: () => agencyService.listMyPosts(),
        enabled: !!agency?.id,
    });

    const posts: AgencyPost[] = useMemo(() => {
        return postsData?.items ?? [];
    }, [postsData]);

    const deletePostMutation = useMutation({
        mutationFn: (postId: string) => agencyService.deleteMyPost(postId),
        onSuccess: () => {
            toast.success("پست با موفقیت حذف شد.");
            refetchPosts();
        },
        onError: (err: Error) => {
            toast.error(normalizeApiError(err, "خطا در حذف پست."));
        },
    });

    // Messages query & reply mutation - loaded for the page
    const {
        data: messagesData,
        isLoading: isLoadingMessages,
        refetch: refetchMessages,
    } = useQuery<AgencyConsultationMessage[]>({
        queryKey: ["agency-messages", agency?.id],
        queryFn: () => agencyService.listMyMessages(),
        enabled: !!agency?.id,
    });

    const messages: AgencyConsultationMessage[] = useMemo(() => {
        return Array.isArray(messagesData) ? messagesData : [];
    }, [messagesData]);

    const pendingMessagesCount = useMemo(() => {
        return messages.filter((m) => m.status === "PENDING").length;
    }, [messages]);

    const filteredMessages = useMemo(() => {
        if (messageFilter === "pending") return messages.filter((m) => m.status === "PENDING");
        if (messageFilter === "replied") return messages.filter((m) => m.status === "REPLIED");
        return messages;
    }, [messages, messageFilter]);

    const [replyingMessage, setReplyingMessage] = useState<AgencyConsultationMessage | null>(null);
    const [replyText, setReplyText] = useState("");

    const replyMutation = useMutation({
        mutationFn: ({ messageId, replyMessage }: { messageId: string; replyMessage: string }) =>
            agencyService.replyToMessage(messageId, { replyMessage }),
        onSuccess: () => {
            toast.success("پاسخ شما با موفقیت ارسال شد.");
            setReplyingMessage(null);
            setReplyText("");
            refetchMessages();
        },
        onError: (err: Error) => {
            toast.error(normalizeApiError(err, "خطا در ارسال پاسخ."));
        },
    });

    const publicShowcasePath = `/agency/showcase/${agency?.slug || agency?.id || ""}`;
    const fullPublicUrl = typeof window !== "undefined" ? `${window.location.origin}${publicShowcasePath}` : publicShowcasePath;

    const handleCopyLink = () => {
        if (typeof navigator !== "undefined" && navigator.clipboard) {
            navigator.clipboard.writeText(fullPublicUrl);
            setCopiedLink(true);
            toast.success("لینک صفحه ویترین با موفقیت کپی شد");
            setTimeout(() => setCopiedLink(false), 2500);
        }
    };

    // Scroll smoothly to section when tab clicked
    const scrollToSection = (tabId: Tab) => {
        setActiveTab(tabId);
        isManualScrollingRef.current = true;
        const targetElement = document.getElementById(`section-${tabId}`);
        if (targetElement) {
            // Header (approx 60px) + Swiper Bar (approx 55px) + extra margin (15px) = 130px
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
                        <Building2 className="w-8 h-8" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-xl font-black text-brand tracking-tight">ورود به پنل آژانس</h2>
                        <p className="text-xs sm:text-sm text-secondary leading-relaxed">
                            برای مدیریت صفحه ویترین، پاسخ‌گویی به درخواست‌های مشتریان و ویرایش اطلاعات، ابتدا وارد حساب کاربری خود شوید.
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
    if (isLoadingAgency) {
        return (
            <div className="min-h-screen bg-canvas flex items-center justify-center p-6 text-center" dir="rtl">
                <div className="space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto animate-pulse">
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                    <p className="text-xs sm:text-sm font-bold text-secondary">در حال فراخوانی اطلاعات پنل املاک...</p>
                </div>
            </div>
        );
    }

    // No Agency Profile State
    if (!agency) {
        return (
            <div className="min-h-screen bg-canvas flex items-center justify-center p-4 sm:p-6 text-center" dir="rtl">
                <div className="w-full max-w-lg bg-surface/90 backdrop-blur-xl border border-soft-border/70 p-8 sm:p-10 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-6">
                    <div className="w-18 h-18 rounded-[24px] bg-accent/20 border border-accent/40 text-brand flex items-center justify-center mx-auto">
                        <Award className="w-9 h-9 text-brand" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-xl font-black text-brand tracking-tight">شما هنوز صفحه املاک یا ویترین فعال ندارید</h2>
                        <p className="text-xs sm:text-sm text-secondary leading-relaxed">
                            با ارتقا به حساب مشاور یا دفتر املاک، می‌توانید صاحب صفحه اختصاصی، نشان تأیید اعتبار و دسترسی به استودیو انتشار محتوا شوید.
                        </p>
                    </div>
                    <div className="pt-2">
                        <Link
                            href="/agency/apply"
                            className="inline-flex items-center justify-center gap-2 w-full py-4 bg-brand hover:bg-brand/90 active:scale-[0.98] text-white rounded-2xl text-xs sm:text-sm font-black transition-all shadow-md shadow-brand/10"
                        >
                            <span>ثبت درخواست ارتقا به مشاور یا دفتر املاک</span>
                            <ArrowUpRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-canvas text-brand pb-32 lg:pb-16 selection:bg-accent/30" dir="rtl">
            {/* Clean Apple Navigation Bar (Minimal on mobile, informative on desktop) */}
            <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur-xl border-b border-soft-border/70 transition-all">
                <div className="max-w-6xl mx-auto px-3.5 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-3">
                    {/* Back Button & Agency Title */}
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                        <button
                            onClick={handleBack}
                            aria-label="بازگشت"
                            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-soft-bg/80 hover:bg-soft-bg active:scale-95 border border-soft-border/60 flex items-center justify-center text-brand transition-all shrink-0 cursor-pointer"
                        >
                            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 rotate-180" />
                        </button>

                        <div className="flex items-center gap-2 min-w-0">
                            {agency.logoUrl ? (
                                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl overflow-hidden border border-soft-border/80 bg-surface shrink-0 relative shadow-2xs">
                                    <Image
                                        src={getMediaUrl(agency.logoUrl)}
                                        alt={agency.agencyName || agency.name}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                            ) : null}

                            <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <h1 className="text-xs sm:text-sm md:text-base font-black text-brand truncate">
                                        {agency.agencyName || agency.name}
                                    </h1>
                                    {agency.verificationStatus === "VERIFIED" && (
                                        <BadgeCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                                    )}
                                </div>
                                <span className="text-[10px] text-secondary font-medium hidden md:block">
                                    پنل مدیریت ویترین املاک
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Actions: Clean & Minimal on mobile */}
                    <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
                        {/* Copy link button (icon only on mobile) */}
                        <button
                            type="button"
                            onClick={handleCopyLink}
                            className="p-2 sm:px-3 sm:py-2 rounded-xl sm:rounded-2xl bg-soft-bg/60 hover:bg-soft-bg active:scale-95 text-secondary hover:text-brand border border-soft-border/70 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                            title="کپی آدرس ویترین"
                            aria-label="کپی آدرس ویترین"
                        >
                            {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                            <span className="hidden sm:inline">{copiedLink ? "کپی شد" : "کپی لینک"}</span>
                        </button>

                        {/* Open Showcase Link */}
                        <Link
                            href={publicShowcasePath}
                            target="_blank"
                            className="p-2 sm:px-3.5 sm:py-2 rounded-xl sm:rounded-2xl bg-brand hover:bg-brand/90 active:scale-95 text-white text-xs font-black transition-all shadow-xs flex items-center gap-1.5"
                            title="مشاهده صفحه ویترین"
                            aria-label="مشاهده صفحه ویترین"
                        >
                            <ExternalLink className="w-4 h-4" />
                            <span className="hidden sm:inline">مشاهده ویترین</span>
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
                                tab.id === "messages" && pendingMessagesCount > 0
                                    ? pendingMessagesCount
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
                                            <span
                                                className={cn(
                                                    "text-[10px] px-1.5 py-0.2 rounded-full font-bold",
                                                    tab.id === "messages" && pendingMessagesCount > 0
                                                        ? "bg-emerald-600 text-white"
                                                        : "bg-soft-border/70 text-secondary"
                                                )}
                                            >
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

            {/* Main Content: All Sections stacked sequentially with smooth anchors */}
            <main className="max-w-6xl mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-12">
                {/* ───────────────────────────────────────────────────────────── */}
                {/* SECTION 1: OVERVIEW & STATS                                  */}
                {/* ───────────────────────────────────────────────────────────── */}
                <section id="section-overview" className="space-y-5 scroll-mt-28">
                    {/* Simplified, Calm Apple Showcase Card */}
                    <div className="rounded-[24px] sm:rounded-[28px] bg-surface border border-soft-border/70 p-5 sm:p-7 shadow-xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="space-y-1.5 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                                        {agency.agencyType === "AGENCY" ? "دفتر املاک" : "مشاور املاک"}
                                    </span>
                                    {agency.verificationStatus === "VERIFIED" ? (
                                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 flex items-center gap-1">
                                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                            <span>تأیید هویت رسمی</span>
                                        </span>
                                    ) : (
                                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 border border-amber-500/20 flex items-center gap-1">
                                            <Clock className="w-3 h-3 text-amber-600" />
                                            <span>در انتظار مدارک</span>
                                        </span>
                                    )}
                                </div>

                                <h2 className="text-lg sm:text-xl font-black text-brand tracking-tight">
                                    {agency.agencyName || agency.name}
                                </h2>

                                {agency.bio && (
                                    <p className="text-xs sm:text-sm text-secondary line-clamp-2 leading-relaxed">
                                        {agency.bio}
                                    </p>
                                )}

                                {/* Compact Link Pill */}
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
                                    onClick={() => scrollToSection("settings")}
                                    className="px-4 py-2.5 rounded-xl bg-soft-bg hover:bg-soft-border/70 text-brand text-xs font-bold transition-all border border-soft-border/70 cursor-pointer"
                                >
                                    ویرایش سریع
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Apple KPI Metric Grid (Clean, balanced 4 cards) */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        <div className="p-4 rounded-2xl bg-surface border border-soft-border/70 shadow-2xs space-y-1">
                            <span className="text-[11px] font-bold text-secondary flex items-center justify-between">
                                <span>دنبال‌کنندگان</span>
                                <Users className="w-3.5 h-3.5 text-primary" />
                            </span>
                            <div className="text-xl sm:text-2xl font-black text-brand">
                                {toPersianDigits(agency.followersCount || stats?.followerCount || 0)}
                            </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-surface border border-soft-border/70 shadow-2xs space-y-1">
                            <span className="text-[11px] font-bold text-secondary flex items-center justify-between">
                                <span>مشاوره‌ها</span>
                                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                            </span>
                            <div className="text-xl sm:text-2xl font-black text-brand">
                                {toPersianDigits(agency.consultationsCount || stats?.consultationCount || messages.length || 0)}
                            </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-surface border border-soft-border/70 shadow-2xs space-y-1">
                            <span className="text-[11px] font-bold text-secondary flex items-center justify-between">
                                <span>امتیاز رضایت</span>
                                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                            </span>
                            <div className="text-xl sm:text-2xl font-black text-brand">
                                {agency.rating != null && !isNaN(Number(agency.rating)) && Number(agency.rating) > 0 ? (
                                    <span>{toPersianDigits(Number(agency.rating).toFixed(1))} <span className="text-xs font-normal text-secondary">از ۵</span></span>
                                ) : (
                                    <span className="text-sm font-bold text-secondary">بدون نظر</span>
                                )}
                            </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-surface border border-soft-border/70 shadow-2xs space-y-1">
                            <span className="text-[11px] font-bold text-secondary flex items-center justify-between">
                                <span>وضعیت ویترین</span>
                                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            </span>
                            <div className="text-base sm:text-lg font-black text-emerald-700">
                                {agency.isActive ? "فعال و آنلاین" : "معلق"}
                            </div>
                        </div>
                    </div>

                    {/* Content Studio Minimal Callout */}
                    <div className="rounded-2xl bg-soft-bg/60 border border-soft-border/70 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-brand text-accent flex items-center justify-center shrink-0">
                                <Sparkles className="w-4 h-4" />
                            </div>
                            <div>
                                <h3 className="text-xs sm:text-sm font-black text-brand">استودیو انتشار محتوا و تحلیل بازار</h3>
                                <p className="text-[11px] text-secondary">نگارش پست‌های تحلیلی، معرفی پروژه‌ها و مقالات ویژه املاک</p>
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
                {/* SECTION 2: SETTINGS & CUSTOMIZATION                          */}
                {/* ───────────────────────────────────────────────────────────── */}
                <section id="section-settings" className="space-y-6 scroll-mt-28">
                    <div className="border-b border-soft-border/60 pb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Settings className="w-5 h-5 text-secondary" />
                            <div>
                                <h2 className="text-base sm:text-lg font-black text-brand">تنظیمات و هویت صفحه ویترین</h2>
                                <p className="text-[11px] text-secondary">شخصی‌سازی اطلاعات عمومی، تصاویر و پل‌های ارتباطی دفتر املاک</p>
                            </div>
                        </div>
                    </div>

                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            updateShowcaseMutation.mutate(settingsForm);
                        }}
                        className="space-y-6"
                    >
                        {/* Section: Basic Identity */}
                        <div className="rounded-[24px] bg-surface border border-soft-border/70 p-5 sm:p-7 shadow-xs space-y-4">
                            <h3 className="text-sm font-black text-brand flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-primary" />
                                <span>مشخصات پایه و نام برند</span>
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-brand block">
                                        نام دفتر املاک یا مشاور <span className="text-status-error">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={settingsForm.agencyName}
                                        onChange={(e) => setSettingsForm({ ...settingsForm, agencyName: e.target.value })}
                                        className="w-full px-3.5 py-2.5 bg-soft-bg/30 border border-soft-border/80 rounded-xl text-xs sm:text-sm text-brand focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                        placeholder="مثال: املاک مدرن ونک"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-brand block">
                                        شناسه آدرس وب (Slug) - فقط انگلیسی
                                    </label>
                                    <input
                                        type="text"
                                        value={settingsForm.slug}
                                        onChange={(e) =>
                                            setSettingsForm({
                                                ...settingsForm,
                                                slug: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""),
                                            })
                                        }
                                        placeholder="tehran-modern-melk"
                                        dir="ltr"
                                        className="w-full px-3.5 py-2.5 bg-soft-bg/30 border border-soft-border/80 rounded-xl text-xs sm:text-sm font-mono text-brand focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-left"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-brand block">شماره پروانه کسب / مجوز صنفی</label>
                                    <input
                                        type="text"
                                        value={settingsForm.licenseNumber}
                                        onChange={(e) => setSettingsForm({ ...settingsForm, licenseNumber: e.target.value })}
                                        placeholder="مثال: ۱۲۳۴۵۶۷۸"
                                        className="w-full px-3.5 py-2.5 bg-soft-bg/30 border border-soft-border/80 rounded-xl text-xs sm:text-sm text-brand focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-brand block">کد عضویت اتحادیه املاک (کد صنف)</label>
                                    <input
                                        type="text"
                                        value={settingsForm.guildCode}
                                        onChange={(e) => setSettingsForm({ ...settingsForm, guildCode: e.target.value })}
                                        placeholder="مثال: ۹۸۷۶۵"
                                        className="w-full px-3.5 py-2.5 bg-soft-bg/30 border border-soft-border/80 rounded-xl text-xs sm:text-sm text-brand focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono"
                                    />
                                </div>

                                <div className="space-y-1.5 sm:col-span-2">
                                    <label className="text-xs font-bold text-brand block">بیوگرافی و معرفی تخصصی</label>
                                    <textarea
                                        value={settingsForm.bio}
                                        onChange={(e) => setSettingsForm({ ...settingsForm, bio: e.target.value })}
                                        rows={3}
                                        placeholder="توضیحاتی در مورد سوابق کاری، مناطق تحت پوشش، خدمات ویژه و نحوه همکاری..."
                                        className="w-full p-3 bg-soft-bg/30 border border-soft-border/80 rounded-xl text-xs sm:text-sm text-brand focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary leading-relaxed"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section: Media & Visuals */}
                        <div className="rounded-[24px] bg-surface border border-soft-border/70 p-5 sm:p-7 shadow-xs space-y-4">
                            <h3 className="text-sm font-black text-brand flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-accent" />
                                <span>تصاویر نمایه و بنر سربرگ</span>
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-3.5 rounded-xl bg-soft-bg/30 border border-soft-border/60">
                                    <MediaIconUpload
                                        label="لوگوی رسمی دفتر یا تصویر پرتره"
                                        helperText="فرمت: مربع با کیفیت بالا"
                                        value={settingsForm.logoUrl}
                                        onChange={(mediaId) => setSettingsForm({ ...settingsForm, logoUrl: mediaId })}
                                    />
                                </div>

                                <div className="p-3.5 rounded-xl bg-soft-bg/30 border border-soft-border/60">
                                    <MediaIconUpload
                                        label="تصویر بنر سربرگ (کاور بالای صفحه)"
                                        helperText="فرمت: افقی با نسبت ۱۶:۹"
                                        value={settingsForm.coverUrl}
                                        onChange={(mediaId) => setSettingsForm({ ...settingsForm, coverUrl: mediaId })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section: Contacts */}
                        <div className="rounded-[24px] bg-surface border border-soft-border/70 p-5 sm:p-7 shadow-xs space-y-4">
                            <h3 className="text-sm font-black text-brand flex items-center gap-2">
                                <Phone className="w-4 h-4 text-emerald-600" />
                                <span>راه‌های ارتباطی و شبکه‌های اجتماعی</span>
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-brand block flex items-center gap-1.5">
                                        <Phone className="w-3.5 h-3.5 text-secondary" />
                                        <span>تلفن ثابت</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={settingsForm.phone}
                                        onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                                        placeholder="۰۲۱..."
                                        dir="ltr"
                                        className="w-full px-3.5 py-2.5 bg-soft-bg/30 border border-soft-border/80 rounded-xl text-xs sm:text-sm font-mono text-brand focus:outline-none focus:ring-2 focus:ring-primary/20 text-left"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-brand block flex items-center gap-1.5">
                                        <Smartphone className="w-3.5 h-3.5 text-secondary" />
                                        <span>شماره همراه</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={settingsForm.mobile}
                                        onChange={(e) => setSettingsForm({ ...settingsForm, mobile: e.target.value })}
                                        placeholder="۰۹۱۲..."
                                        dir="ltr"
                                        className="w-full px-3.5 py-2.5 bg-soft-bg/30 border border-soft-border/80 rounded-xl text-xs sm:text-sm font-mono text-brand focus:outline-none focus:ring-2 focus:ring-primary/20 text-left"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-brand block flex items-center gap-1.5">
                                        <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                                        <span>واتساپ</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={settingsForm.whatsapp}
                                        onChange={(e) => setSettingsForm({ ...settingsForm, whatsapp: e.target.value })}
                                        placeholder="۰۹..."
                                        dir="ltr"
                                        className="w-full px-3.5 py-2.5 bg-soft-bg/30 border border-soft-border/80 rounded-xl text-xs sm:text-sm font-mono text-brand focus:outline-none focus:ring-2 focus:ring-primary/20 text-left"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-brand block flex items-center gap-1.5">
                                        <InstagramIcon className="w-3.5 h-3.5 text-pink-600" />
                                        <span>اینستاگرام</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={settingsForm.instagram}
                                        onChange={(e) => setSettingsForm({ ...settingsForm, instagram: e.target.value })}
                                        placeholder="نام کاربری بدون @"
                                        dir="ltr"
                                        className="w-full px-3.5 py-2.5 bg-soft-bg/30 border border-soft-border/80 rounded-xl text-xs sm:text-sm font-mono text-brand focus:outline-none focus:ring-2 focus:ring-primary/20 text-left"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-brand block flex items-center gap-1.5">
                                        <Send className="w-3.5 h-3.5 text-sky-500" />
                                        <span>تلگرام</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={settingsForm.telegram}
                                        onChange={(e) => setSettingsForm({ ...settingsForm, telegram: e.target.value })}
                                        placeholder="آیدی تلگرام"
                                        dir="ltr"
                                        className="w-full px-3.5 py-2.5 bg-soft-bg/30 border border-soft-border/80 rounded-xl text-xs sm:text-sm font-mono text-brand focus:outline-none focus:ring-2 focus:ring-primary/20 text-left"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-brand block flex items-center gap-1.5">
                                        <Globe className="w-3.5 h-3.5 text-primary" />
                                        <span>وب‌سایت</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={settingsForm.website}
                                        onChange={(e) => setSettingsForm({ ...settingsForm, website: e.target.value })}
                                        placeholder="https://..."
                                        dir="ltr"
                                        className="w-full px-3.5 py-2.5 bg-soft-bg/30 border border-soft-border/80 rounded-xl text-xs sm:text-sm font-mono text-brand focus:outline-none focus:ring-2 focus:ring-primary/20 text-left"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section: Location */}
                        <div className="rounded-[24px] bg-surface border border-soft-border/70 p-5 sm:p-7 shadow-xs space-y-4">
                            <h3 className="text-sm font-black text-brand flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-brand" />
                                <span>موقعیت مکانی و ساعات فعالیت</span>
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5 sm:col-span-2">
                                    <label className="text-xs font-bold text-brand block">ساعات کاری و پاسخگویی</label>
                                    <input
                                        type="text"
                                        value={settingsForm.workingHours}
                                        onChange={(e) => setSettingsForm({ ...settingsForm, workingHours: e.target.value })}
                                        placeholder="مثال: شنبه تا چهارشنبه از ۹:۰۰ تا ۲۱:۰۰"
                                        className="w-full px-3.5 py-2.5 bg-soft-bg/30 border border-soft-border/80 rounded-xl text-xs sm:text-sm text-brand focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>

                                <div className="space-y-1.5 sm:col-span-2">
                                    <label className="text-xs font-bold text-brand block">آدرس دقیق پستی</label>
                                    <input
                                        type="text"
                                        value={settingsForm.address}
                                        onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                                        placeholder="مثال: تهران، میدان ونک، خیابان ملاصدرا..."
                                        className="w-full px-3.5 py-2.5 bg-soft-bg/30 border border-soft-border/80 rounded-xl text-xs sm:text-sm text-brand focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-brand block">کد پستی ۱۰ رقمی</label>
                                    <input
                                        type="text"
                                        value={settingsForm.postalCode}
                                        onChange={(e) => setSettingsForm({ ...settingsForm, postalCode: e.target.value })}
                                        placeholder="کد پستی"
                                        dir="ltr"
                                        className="w-full px-3.5 py-2.5 bg-soft-bg/30 border border-soft-border/80 rounded-xl text-xs sm:text-sm font-mono text-brand focus:outline-none focus:ring-2 focus:ring-primary/20 text-left"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Save Button */}
                        <div className="flex justify-end pt-2">
                            <button
                                type="submit"
                                disabled={updateShowcaseMutation.isPending}
                                className="w-full sm:w-auto px-6 py-3 bg-brand hover:bg-brand/90 active:scale-95 text-white rounded-xl text-xs sm:text-sm font-black transition-all shadow-sm shadow-brand/10 disabled:opacity-50 inline-flex items-center justify-center gap-2 cursor-pointer"
                            >
                                {updateShowcaseMutation.isPending && (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                )}
                                <span>{updateShowcaseMutation.isPending ? "در حال ذخیره‌سازی..." : "ذخیره تغییرات ویترین"}</span>
                            </button>
                        </div>
                    </form>
                </section>

                {/* ───────────────────────────────────────────────────────────── */}
                {/* SECTION 3: POSTS & ARTICLES                                  */}
                {/* ───────────────────────────────────────────────────────────── */}
                <section id="section-posts" className="space-y-6 scroll-mt-28">
                    <div className="border-b border-soft-border/60 pb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-accent-foreground" />
                            <div>
                                <h2 className="text-base sm:text-lg font-black text-brand">پست‌ها و مقالات اختصاصی</h2>
                                <p className="text-[11px] text-secondary">
                                    {posts.length > 0 ? `${toPersianDigits(posts.length)} مطلب منتشر شده یا پیش‌نویس` : "مطالب تحلیلی و اخبار ویترین"}
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
                                    با انتشار تحلیل‌های بازار، اعتبار ویترین دفتر خود را افزایش دهید.
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
                                            <span
                                                className={cn(
                                                    "text-[10px] font-bold px-2 py-0.5 rounded-full",
                                                    post.isPublished
                                                        ? "bg-emerald-500/10 text-emerald-700"
                                                        : "bg-soft-bg text-secondary"
                                                )}
                                            >
                                                {post.isPublished ? "منتشر شده" : "پیش‌نویس"}
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
                                            بازدید: {toPersianDigits(post.viewCount || 0)}
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
                                            title="حذف"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* ───────────────────────────────────────────────────────────── */}
                {/* SECTION 4: INQUIRIES & MESSAGES                              */}
                {/* ───────────────────────────────────────────────────────────── */}
                <section id="section-messages" className="space-y-6 scroll-mt-28">
                    <div className="border-b border-soft-border/60 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-emerald-600" />
                            <div>
                                <h2 className="text-base sm:text-lg font-black text-brand">صندوق پیام‌ها و درخواست‌های مشاوره</h2>
                                <p className="text-[11px] text-secondary">پیام‌های ارسال‌شده توسط کاربران ویترین اختصاصی شما</p>
                            </div>
                        </div>

                        {/* Filter Chips */}
                        <div className="inline-flex items-center p-1 bg-soft-bg/80 rounded-xl border border-soft-border/70 gap-1 self-start sm:self-auto">
                            <button
                                type="button"
                                onClick={() => setMessageFilter("all")}
                                className={cn(
                                    "px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                                    messageFilter === "all" ? "bg-surface text-brand shadow-xs" : "text-secondary hover:text-brand"
                                )}
                            >
                                همه ({toPersianDigits(messages.length)})
                            </button>
                            <button
                                type="button"
                                onClick={() => setMessageFilter("pending")}
                                className={cn(
                                    "px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                                    messageFilter === "pending"
                                        ? "bg-surface text-brand shadow-xs"
                                        : "text-secondary hover:text-brand"
                                )}
                            >
                                در انتظار ({toPersianDigits(pendingMessagesCount)})
                            </button>
                            <button
                                type="button"
                                onClick={() => setMessageFilter("replied")}
                                className={cn(
                                    "px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                                    messageFilter === "replied"
                                        ? "bg-surface text-brand shadow-xs"
                                        : "text-secondary hover:text-brand"
                                )}
                            >
                                پاسخ داده شده
                            </button>
                        </div>
                    </div>

                    {isLoadingMessages ? (
                        <div className="rounded-2xl bg-surface border border-soft-border/70 p-10 text-center">
                            <div className="w-7 h-7 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                            <p className="text-xs font-bold text-secondary">در حال دریافت پیام‌ها...</p>
                        </div>
                    ) : filteredMessages.length === 0 ? (
                        <div className="rounded-2xl bg-surface border border-soft-border/70 p-8 sm:p-12 text-center space-y-2">
                            <div className="w-12 h-12 rounded-2xl bg-soft-bg border border-soft-border/70 text-secondary flex items-center justify-center mx-auto">
                                <MessageSquare className="w-6 h-6 text-secondary" />
                            </div>
                            <h4 className="text-sm font-black text-brand">پیامی یافت نشد</h4>
                            <p className="text-xs text-secondary">پیام‌های جدید کاربران در این بخش نمایش داده می‌شوند.</p>
                        </div>
                    ) : (
                        <div className="space-y-3.5">
                            {filteredMessages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className="rounded-2xl bg-surface border border-soft-border/70 p-4 sm:p-5 shadow-2xs space-y-3"
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-soft-border/50 pb-2.5">
                                        <div>
                                            <h4 className="text-xs sm:text-sm font-black text-brand">{msg.subject}</h4>
                                            <div className="flex items-center gap-2 text-[11px] text-secondary mt-0.5">
                                                <span>{msg.senderName || "کاربر ناشناس"}</span>
                                                {msg.senderPhone && (
                                                    <a
                                                        href={`tel:${msg.senderPhone}`}
                                                        className="font-mono text-primary hover:underline"
                                                        dir="ltr"
                                                    >
                                                        {msg.senderPhone}
                                                    </a>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <span
                                                className={cn(
                                                    "px-2 py-0.5 rounded-full text-[10px] font-bold",
                                                    msg.status === "REPLIED"
                                                        ? "bg-emerald-500/10 text-emerald-700"
                                                        : "bg-amber-500/10 text-amber-700"
                                                )}
                                            >
                                                {msg.status === "REPLIED" ? "پاسخ داده شد" : "در انتظار پاسخ"}
                                            </span>
                                            <span className="text-[10px] text-secondary">
                                                {new Date(msg.createdAt).toLocaleDateString("fa-IR")}
                                            </span>
                                        </div>
                                    </div>

                                    {/* User query */}
                                    <div className="p-3 rounded-xl bg-soft-bg/30 text-xs text-brand leading-relaxed">
                                        {msg.message}
                                    </div>

                                    {/* Agent response if exists */}
                                    {msg.replyMessage && (
                                        <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-1">
                                            <span className="text-[11px] font-black text-emerald-800 flex items-center gap-1">
                                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                                <span>پاسخ شما:</span>
                                            </span>
                                            <p className="text-xs text-brand leading-relaxed">{msg.replyMessage}</p>
                                        </div>
                                    )}

                                    <div className="flex justify-end pt-1">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setReplyingMessage(msg);
                                                setReplyText(msg.replyMessage || "");
                                            }}
                                            className="px-3.5 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/15 text-primary text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
                                        >
                                            <Send className="w-3 h-3" />
                                            <span>{msg.replyMessage ? "ویرایش پاسخ" : "ارسال پاسخ"}</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </main>

            {/* Apple-style Reply Bottom Sheet / Modal */}
            {replyingMessage && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all">
                    <div className="w-full max-w-lg bg-surface rounded-t-[28px] sm:rounded-[28px] p-5 sm:p-6 space-y-4 shadow-2xl border border-soft-border/70 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-soft-border/50 pb-3">
                            <div>
                                <h3 className="text-sm sm:text-base font-black text-brand">
                                    پاسخ به: {replyingMessage.subject}
                                </h3>
                                <span className="text-xs text-secondary">
                                    فرستنده: {replyingMessage.senderName || "کاربر سایت"}
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setReplyingMessage(null)}
                                className="w-7 h-7 rounded-full bg-soft-bg hover:bg-soft-border/70 text-secondary flex items-center justify-center transition-colors cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* User Message Quote */}
                        <div className="p-3 bg-soft-bg/50 border border-soft-border/60 rounded-xl text-xs text-secondary leading-relaxed space-y-1">
                            <span className="font-bold text-brand block">متن درخواست کاربر:</span>
                            <p className="line-clamp-3">{replyingMessage.message}</p>
                        </div>

                        {/* Reply Textarea */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-brand block">متن پاسخ شما:</label>
                            <textarea
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                rows={4}
                                placeholder="پاسخ خود به کاربر را با لحنی محترمانه و حرفه‌ای در این قسمت بنویسید..."
                                className="w-full p-3 bg-soft-bg/30 border border-soft-border/80 rounded-xl text-xs sm:text-sm text-brand focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary leading-relaxed"
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-soft-border/50">
                            <button
                                type="button"
                                onClick={() => setReplyingMessage(null)}
                                className="px-3.5 py-2 rounded-xl border border-soft-border/80 text-xs font-bold text-secondary hover:bg-soft-bg transition-colors cursor-pointer"
                            >
                                انصراف
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    if (!replyText.trim()) {
                                        toast.error("متن پاسخ نمی‌تواند خالی باشد.");
                                        return;
                                    }
                                    replyMutation.mutate({
                                        messageId: replyingMessage.id,
                                        replyMessage: replyText.trim(),
                                    });
                                }}
                                disabled={replyMutation.isPending}
                                className="px-4 py-2 rounded-xl bg-brand hover:bg-brand/90 active:scale-95 text-white text-xs font-black transition-all shadow-xs disabled:opacity-50 inline-flex items-center gap-1.5 cursor-pointer"
                            >
                                {replyMutation.isPending && (
                                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                )}
                                <span>{replyMutation.isPending ? "در حال ارسال..." : "ارسال پاسخ"}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
