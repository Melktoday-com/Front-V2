"use client";

import { useAgencyStats, useMyAgency } from "@/hooks/useAgencies";
import { useAuth } from "@/hooks/useAuth";
import { cn, toPersianDigits, getMediaUrl, getMediaPosterUrl, toEnglishDigits, toOnlyDigits } from "@/lib/utils";
import { agencyService } from "@/services/agency.service";
import MediaIconUpload from "@/components/admin/MediaIconUpload";
import {
    AgencyPost,
    AgencyPostsListResponse,
    UpdateAgencyProfileRequest,
    UpdateAgencyPostRequest,
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
    ChevronLeft,
    Clock,
    Copy,
    Edit3,
    ExternalLink,
    Eye,
    EyeOff,
    Globe,
    Heart,
    ImageIcon,
    LayoutDashboard,
    MapPin,
    MessageCircle,
    PenTool,
    Phone,
    Plus,
    RotateCcw,
    Search,
    Send,
    Settings,
    ShieldCheck,
    Smartphone,
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

type Tab = "overview" | "settings" | "posts";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "overview", label: "نمای کلی و آمار", icon: LayoutDashboard },
    { id: "settings", label: "شخصی‌سازی ویترین", icon: Settings },
    { id: "posts", label: "پست‌ها و مقالات", icon: BookOpen },
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
    const [isEditing, setIsEditing] = useState(false);
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

    // Reference initial values to detect if user changed anything
    const initialFormValues = useMemo(() => {
        if (!agency) return null;
        return {
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
        };
    }, [agency]);

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

    // Update showcase mutation
    const updateShowcaseMutation = useMutation({
        mutationFn: (data: UpdateAgencyProfileRequest) => agencyService.updateMyShowcase(data),
        onSuccess: () => {
            toast.success("تنظیمات صفحه ویترین با موفقیت ذخیره شد.");
            setIsEditing(false);
            queryClient.invalidateQueries({ queryKey: ["my-agency"] });
        },
        onError: (err: Error) => {
            toast.error(normalizeApiError(err, "خطا در بروزرسانی صفحه املاک."));
        },
    });

    // Posts query & mutations
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

    // Showcase post search & filter state
    const [postSearch, setPostSearch] = useState("");
    const [postStatusFilter, setPostStatusFilter] = useState<"all" | "published" | "draft">("all");

    // Edit post modal state
    const [editingPost, setEditingPost] = useState<AgencyPost | null>(null);
    const [editForm, setEditForm] = useState<{
        title: string;
        slug: string;
        summary: string;
        content: string;
        isPublished: boolean;
    }>({
        title: "",
        slug: "",
        summary: "",
        content: "",
        isPublished: true,
    });

    const togglePublishMutation = useMutation({
        mutationFn: ({ postId, isPublished }: { postId: string; isPublished: boolean }) =>
            agencyService.updateMyPost(postId, { isPublished }),
        onSuccess: (_data, variables) => {
            toast.success(variables.isPublished ? "پست با موفقیت منتشر شد." : "پست به حالت پیش‌نویس منتقل شد.");
            refetchPosts();
            queryClient.invalidateQueries({ queryKey: ["agency-posts"] });
            queryClient.invalidateQueries({ queryKey: ["agency-public-posts"] });
        },
        onError: (err: Error) => {
            toast.error(normalizeApiError(err, "خطا در تغییر وضعیت انتشار پست."));
        },
    });

    const updatePostMutation = useMutation({
        mutationFn: ({ postId, data }: { postId: string; data: UpdateAgencyPostRequest }) =>
            agencyService.updateMyPost(postId, data),
        onSuccess: () => {
            toast.success("پست با موفقیت بروزرسانی شد.");
            setEditingPost(null);
            refetchPosts();
            queryClient.invalidateQueries({ queryKey: ["agency-posts"] });
            queryClient.invalidateQueries({ queryKey: ["agency-public-posts"] });
        },
        onError: (err: Error) => {
            toast.error(normalizeApiError(err, "خطا در بروزرسانی پست."));
        },
    });

    const handleOpenEdit = (post: AgencyPost) => {
        setEditingPost(post);
        setEditForm({
            title: post.title || "",
            slug: post.slug || "",
            summary: post.summary || "",
            content: post.content || "",
            isPublished: post.isPublished ?? true,
        });
    };

    const handleSaveEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingPost) return;
        if (!editForm.title.trim()) {
            toast.error("عنوان پست نمی‌تواند خالی باشد.");
            return;
        }
        updatePostMutation.mutate({
            postId: editingPost.id,
            data: {
                title: editForm.title.trim(),
                slug: editForm.slug.trim() || undefined,
                summary: editForm.summary.trim() || undefined,
                content: editForm.content,
                isPublished: editForm.isPublished,
            },
        });
    };

    const filteredPosts = useMemo(() => {
        return posts.filter((p) => {
            const matchesSearch =
                !postSearch.trim() ||
                p.title.toLowerCase().includes(postSearch.toLowerCase()) ||
                (p.summary && p.summary.toLowerCase().includes(postSearch.toLowerCase())) ||
                (p.content && p.content.toLowerCase().includes(postSearch.toLowerCase()));

            const matchesStatus =
                postStatusFilter === "all" ||
                (postStatusFilter === "published" && p.isPublished) ||
                (postStatusFilter === "draft" && !p.isPublished);

            return matchesSearch && matchesStatus;
        });
    }, [posts, postSearch, postStatusFilter]);

    const deletePostMutation = useMutation({
        mutationFn: (postId: string) => agencyService.deleteMyPost(postId),
        onSuccess: () => {
            toast.success("پست با موفقیت حذف شد.");
            refetchPosts();
            queryClient.invalidateQueries({ queryKey: ["agency-posts"] });
            queryClient.invalidateQueries({ queryKey: ["agency-public-posts"] });
        },
        onError: (err: Error) => {
            toast.error(normalizeApiError(err, "خطا در حذف پست."));
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
                            برای مدیریت صفحه ویترین، ویرایش اطلاعات و انتشار مقالات، ابتدا وارد حساب کاربری خود شوید.
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
            {/* Clean Apple Navigation Bar */}
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
                                        <BadgeCheck className="w-4 h-4 text-success shrink-0" />
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
                        <button
                            type="button"
                            onClick={handleCopyLink}
                            className="p-2 sm:px-3 sm:py-2 rounded-xl sm:rounded-2xl bg-soft-bg/60 hover:bg-soft-bg active:scale-95 text-secondary hover:text-brand border border-soft-border/70 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                            title="کپی آدرس ویترین"
                            aria-label="کپی آدرس ویترین"
                        >
                            {copiedLink ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                            <span className="hidden sm:inline">{copiedLink ? "کپی شد" : "کپی لینک"}</span>
                        </button>

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
                                tab.id === "posts" && posts.length > 0 ? posts.length : null;

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
                {/* ───────────────────────────────────────────────────────────── */}
                {/* SECTION 1: OVERVIEW & STATS                                  */}
                {/* ───────────────────────────────────────────────────────────── */}
                <section id="section-overview" className="space-y-5 scroll-mt-28">
                    {/* Clean Apple Showcase Card */}
                    <div className="rounded-[24px] sm:rounded-[28px] bg-surface border border-soft-border/70 p-5 sm:p-7 shadow-xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="space-y-1.5 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                                        {agency.agencyType === "AGENCY" ? "دفتر املاک" : "مشاور املاک"}
                                    </span>
                                    {agency.verificationStatus === "VERIFIED" ? (
                                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-success border border-emerald-500/20 flex items-center gap-1">
                                            <ShieldCheck className="w-3 h-3 text-success" />
                                            <span>تأیید هویت رسمی</span>
                                        </span>
                                    ) : (
                                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-warning border border-amber-500/20 flex items-center gap-1">
                                            <Clock className="w-3 h-3 text-warning" />
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

                    {/* Apple KPI Metric Grid (Followers, Posts, Rating, Status) */}
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
                                <span>مقالات و پست‌ها</span>
                                <BookOpen className="w-3.5 h-3.5 text-accent-foreground" />
                            </span>
                            <div className="text-xl sm:text-2xl font-black text-brand">
                                {toPersianDigits(posts.length)}
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
                            <div className="text-base sm:text-lg font-black text-success">
                                {agency.isActive ? "فعال و آنلاین" : "معلق"}
                            </div>
                        </div>
                    </div>

                    {/* Content Studio Callout */}
                    <div className="rounded-2xl bg-soft-bg/60 border border-soft-border/70 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-brand text-accent flex items-center justify-center shrink-0">
                                <PenTool className="w-4 h-4" />
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
                    {/* Header with Edit Toggle */}
                    <div className="border-b border-soft-border/60 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <Settings className="w-5 h-5 text-secondary" />
                            <div>
                                <h2 className="text-base sm:text-lg font-black text-brand">تنظیمات و هویت صفحه ویترین</h2>
                                <p className="text-[11px] text-secondary">
                                    {isEditing
                                        ? "در حال ویرایش اطلاعات ویترین - پس از اعمال تغییرات، دکمه ذخیره فعال خواهد شد."
                                        : "مشاهده مشخصات عمومی ویترین. برای تغییر هر بخش روی «ویرایش اطلاعات» کلیک کنید."}
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
                            updateShowcaseMutation.mutate(settingsForm);
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
                                        disabled={!isEditing}
                                        value={settingsForm.agencyName}
                                        onChange={(e) => setSettingsForm({ ...settingsForm, agencyName: e.target.value })}
                                        className={cn(
                                            "w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm text-brand transition-all",
                                            isEditing
                                                ? "bg-surface border border-soft-border/80 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                                : "bg-soft-bg/40 border border-soft-border/50 text-secondary cursor-not-allowed"
                                        )}
                                        placeholder="مثال: املاک مدرن ونک"
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
                                        placeholder="tehran-modern-melk"
                                        dir="ltr"
                                        className={cn(
                                            "w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-mono text-brand transition-all text-left",
                                            isEditing
                                                ? "bg-surface border border-soft-border/80 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                                : "bg-soft-bg/40 border border-soft-border/50 text-secondary cursor-not-allowed"
                                        )}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-brand block">شماره پروانه کسب / مجوز صنفی</label>
                                    <input
                                        type="text"
                                        disabled={!isEditing}
                                        value={settingsForm.licenseNumber}
                                        onChange={(e) => setSettingsForm({ ...settingsForm, licenseNumber: e.target.value })}
                                        placeholder="مثال: ۱۲۳۴۵۶۷۸"
                                        className={cn(
                                            "w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-mono text-brand transition-all",
                                            isEditing
                                                ? "bg-surface border border-soft-border/80 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                                : "bg-soft-bg/40 border border-soft-border/50 text-secondary cursor-not-allowed"
                                        )}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-brand block">کد عضویت اتحادیه املاک (کد صنف)</label>
                                    <input
                                        type="text"
                                        disabled={!isEditing}
                                        value={settingsForm.guildCode}
                                        onChange={(e) => setSettingsForm({ ...settingsForm, guildCode: e.target.value })}
                                        placeholder="مثال: ۹۸۷۶۵"
                                        className={cn(
                                            "w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-mono text-brand transition-all",
                                            isEditing
                                                ? "bg-surface border border-soft-border/80 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                                : "bg-soft-bg/40 border border-soft-border/50 text-secondary cursor-not-allowed"
                                        )}
                                    />
                                </div>

                                <div className="space-y-1.5 sm:col-span-2">
                                    <label className="text-xs font-bold text-brand block">بیوگرافی و معرفی تخصصی</label>
                                    <textarea
                                        disabled={!isEditing}
                                        value={settingsForm.bio}
                                        onChange={(e) => setSettingsForm({ ...settingsForm, bio: e.target.value })}
                                        rows={3}
                                        placeholder="توضیحاتی در مورد سوابق کاری، مناطق تحت پوشش، خدمات ویژه و نحوه همکاری..."
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
                                        label="لوگوی رسمی دفتر یا تصویر پرتره"
                                        helperText="فرمت: مربع با کیفیت بالا"
                                        disabled={!isEditing}
                                        value={settingsForm.logoUrl}
                                        onChange={(mediaId) => setSettingsForm({ ...settingsForm, logoUrl: mediaId })}
                                    />
                                </div>

                                <div className="p-3.5 rounded-xl bg-soft-bg/30 border border-soft-border/60">
                                    <MediaIconUpload
                                        label="تصویر بنر سربرگ (کاور بالای صفحه)"
                                        helperText="فرمت: افقی با نسبت ۱۶:۹"
                                        disabled={!isEditing}
                                        value={settingsForm.coverUrl}
                                        onChange={(mediaId) => setSettingsForm({ ...settingsForm, coverUrl: mediaId })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section: Contacts */}
                        <div className={cn(
                            "rounded-[24px] bg-surface border transition-all p-5 sm:p-7 shadow-xs space-y-4",
                            isEditing ? "border-primary/40 ring-1 ring-primary/20" : "border-soft-border/70"
                        )}>
                            <h3 className="text-sm font-black text-brand flex items-center gap-2">
                                <Phone className="w-4 h-4 text-success" />
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

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-brand block flex items-center gap-1.5">
                                        <Smartphone className="w-3.5 h-3.5 text-secondary" />
                                        <span>شماره همراه</span>
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
                                        <MessageCircle className="w-3.5 h-3.5 text-success" />
                                        <span>واتساپ</span>
                                    </label>
                                    <input
                                        type="text"
                                        disabled={!isEditing}
                                        value={settingsForm.whatsapp}
                                        onChange={(e) => setSettingsForm({ ...settingsForm, whatsapp: e.target.value })}
                                        placeholder="۰۹..."
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
                                        <InstagramIcon className="w-3.5 h-3.5 text-pink-600" />
                                        <span>اینستاگرام</span>
                                    </label>
                                    <input
                                        type="text"
                                        disabled={!isEditing}
                                        value={settingsForm.instagram}
                                        onChange={(e) => setSettingsForm({ ...settingsForm, instagram: e.target.value })}
                                        placeholder="نام کاربری بدون @"
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
                                        <Send className="w-3.5 h-3.5 text-sky-500" />
                                        <span>تلگرام</span>
                                    </label>
                                    <input
                                        type="text"
                                        disabled={!isEditing}
                                        value={settingsForm.telegram}
                                        onChange={(e) => setSettingsForm({ ...settingsForm, telegram: e.target.value })}
                                        placeholder="آیدی تلگرام"
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
                                        <Globe className="w-3.5 h-3.5 text-primary" />
                                        <span>وب‌سایت</span>
                                    </label>
                                    <input
                                        type="text"
                                        disabled={!isEditing}
                                        value={settingsForm.website}
                                        onChange={(e) => setSettingsForm({ ...settingsForm, website: e.target.value })}
                                        placeholder="https://..."
                                        dir="ltr"
                                        className={cn(
                                            "w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-mono text-brand transition-all text-left",
                                            isEditing
                                                ? "bg-surface border border-soft-border/80 focus:outline-none focus:ring-2 focus:ring-primary/20 text-left"
                                                : "bg-soft-bg/40 border border-soft-border/50 text-secondary cursor-not-allowed"
                                        )}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section: Location */}
                        <div className={cn(
                            "rounded-[24px] bg-surface border transition-all p-5 sm:p-7 shadow-xs space-y-4",
                            isEditing ? "border-primary/40 ring-1 ring-primary/20" : "border-soft-border/70"
                        )}>
                            <h3 className="text-sm font-black text-brand flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-brand" />
                                <span>موقعیت مکانی و ساعات فعالیت</span>
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5 sm:col-span-2">
                                    <label className="text-xs font-bold text-brand block">ساعات کاری و پاسخگویی</label>
                                    <input
                                        type="text"
                                        disabled={!isEditing}
                                        value={settingsForm.workingHours}
                                        onChange={(e) => setSettingsForm({ ...settingsForm, workingHours: e.target.value })}
                                        placeholder="مثال: شنبه تا چهارشنبه از ۹:۰۰ تا ۲۱:۰۰"
                                        className={cn(
                                            "w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm text-brand transition-all",
                                            isEditing
                                                ? "bg-surface border border-soft-border/80 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                : "bg-soft-bg/40 border border-soft-border/50 text-secondary cursor-not-allowed"
                                        )}
                                    />
                                </div>

                                <div className="space-y-1.5 sm:col-span-2">
                                    <label className="text-xs font-bold text-brand block">آدرس دقیق پستی</label>
                                    <input
                                        type="text"
                                        disabled={!isEditing}
                                        value={settingsForm.address}
                                        onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                                        placeholder="مثال: تهران، میدان ونک، خیابان ملاصدرا..."
                                        className={cn(
                                            "w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm text-brand transition-all",
                                            isEditing
                                                ? "bg-surface border border-soft-border/80 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                : "bg-soft-bg/40 border border-soft-border/50 text-secondary cursor-not-allowed"
                                        )}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-brand block">کد پستی ۱۰ رقمی</label>
                                    <input
                                        type="text"
                                        disabled={!isEditing}
                                        value={settingsForm.postalCode}
                                        onChange={(e) => setSettingsForm({ ...settingsForm, postalCode: toOnlyDigits(e.target.value) })}
                                        placeholder="کد پستی"
                                        dir="ltr"
                                        className={cn(
                                            "w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-mono text-brand transition-all text-left",
                                            isEditing
                                                ? "bg-surface border border-soft-border/80 focus:outline-none focus:ring-2 focus:ring-primary/20 text-left"
                                                : "bg-soft-bg/40 border border-soft-border/50 text-secondary cursor-not-allowed"
                                        )}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Save Action Button: Only visible/active when in editing mode */}
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
                                        disabled={!hasChanges || updateShowcaseMutation.isPending}
                                        className={cn(
                                            "px-5 py-2 rounded-xl text-xs sm:text-sm font-black transition-all inline-flex items-center gap-2 cursor-pointer shadow-sm",
                                            hasChanges
                                                ? "bg-brand hover:bg-brand/90 text-white shadow-brand/10 active:scale-95"
                                                : "bg-soft-bg text-secondary/50 cursor-not-allowed border border-soft-border/50"
                                        )}
                                    >
                                        {updateShowcaseMutation.isPending && (
                                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        )}
                                        <span>{updateShowcaseMutation.isPending ? "در حال ذخیره‌سازی..." : "ذخیره تغییرات"}</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </form>
                </section>

                {/* ───────────────────────────────────────────────────────────── */}
                {/* SECTION 3: POSTS & ARTICLES                                  */}
                {/* ───────────────────────────────────────────────────────────── */}
                <section id="section-posts" className="space-y-6 scroll-mt-28">
                    {/* Header */}
                    <div className="border-b border-soft-border/60 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-accent-foreground" />
                            <div>
                                <h2 className="text-base sm:text-lg font-black text-brand">پست‌ها و مقالات اختصاصی ویترین</h2>
                                <p className="text-[11px] text-secondary">
                                    {posts.length > 0
                                        ? `${toPersianDigits(posts.length)} مطلب ثبت شده (${toPersianDigits(posts.filter((p) => p.isPublished).length)} منتشر شده)`
                                        : "مطالب تحلیلی، اخبار و معرفی پروژه‌های ملکی"}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Link
                                href={publicShowcasePath}
                                target="_blank"
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-soft-bg hover:bg-slate-200/60 text-secondary hover:text-brand text-xs font-bold transition-all border border-soft-border/70"
                            >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>مشاهده ویترین زنده</span>
                            </Link>

                            <Link
                                href="/posts/create"
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand hover:bg-brand/90 active:scale-95 text-white text-xs font-black transition-all shadow-2xs shrink-0"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span>پست جدید</span>
                            </Link>
                        </div>
                    </div>

                    {/* Filter and Search Bar */}
                    {posts.length > 0 && (
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-surface p-3 rounded-2xl border border-soft-border/60">
                            {/* Search Input */}
                            <div className="relative flex-1">
                                <Search className="w-4 h-4 text-secondary absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                <input
                                    type="text"
                                    value={postSearch}
                                    onChange={(e) => setPostSearch(e.target.value)}
                                    placeholder="جستجو در عنوان یا متن پست‌ها..."
                                    className="w-full pr-9 pl-8 py-2 rounded-xl bg-soft-bg/50 border border-soft-border/60 text-xs sm:text-sm text-brand placeholder:text-secondary/60 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                />
                                {postSearch && (
                                    <button
                                        type="button"
                                        onClick={() => setPostSearch("")}
                                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-secondary hover:text-brand p-1"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>

                            {/* Status Filter Tabs */}
                            <div className="flex items-center gap-1 bg-soft-bg/70 p-1 rounded-xl self-end sm:self-auto shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setPostStatusFilter("all")}
                                    className={cn(
                                        "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                                        postStatusFilter === "all"
                                            ? "bg-surface text-brand shadow-2xs"
                                            : "text-secondary hover:text-brand"
                                    )}
                                >
                                    همه ({toPersianDigits(posts.length)})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPostStatusFilter("published")}
                                    className={cn(
                                        "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                                        postStatusFilter === "published"
                                            ? "bg-surface text-success shadow-2xs font-black"
                                            : "text-secondary hover:text-brand"
                                    )}
                                >
                                    منتشر شده ({toPersianDigits(posts.filter((p) => p.isPublished).length)})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPostStatusFilter("draft")}
                                    className={cn(
                                        "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                                        postStatusFilter === "draft"
                                            ? "bg-surface text-amber-600 shadow-2xs font-black"
                                            : "text-secondary hover:text-brand"
                                    )}
                                >
                                    پیش‌نویس ({toPersianDigits(posts.filter((p) => !p.isPublished).length)})
                                </button>
                            </div>
                        </div>
                    )}

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
                                    با انتشار تحلیل‌های بازار و معرفی ملک‌ها، مشتریان بیشتری به ویترین دفتر خود جذب کنید.
                                </p>
                            </div>
                            <div className="pt-1">
                                <Link
                                    href="/posts/create"
                                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand text-white text-xs font-black shadow-sm"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>نوشتن اولین پست</span>
                                </Link>
                            </div>
                        </div>
                    ) : filteredPosts.length === 0 ? (
                        <div className="rounded-2xl bg-surface border border-soft-border/70 p-8 text-center space-y-2">
                            <p className="text-xs font-bold text-secondary">پستی با مشخصات فیلتر یا جستجو شده یافت نشد.</p>
                            <button
                                type="button"
                                onClick={() => {
                                    setPostSearch("");
                                    setPostStatusFilter("all");
                                }}
                                className="text-xs font-black text-primary hover:underline cursor-pointer"
                            >
                                بازنشانی فیلترها
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredPosts.map((post) => {
                                const firstMedia = post.mediaIds?.[0];
                                const liveUrl = `/posts/${encodeURIComponent(post.slug || post.id)}`;

                                return (
                                    <div
                                        key={post.id}
                                        className="rounded-2xl bg-surface border border-soft-border/70 p-4 sm:p-5 shadow-2xs space-y-4 flex flex-col justify-between hover:border-soft-border hover:shadow-sm transition-all"
                                    >
                                        <div className="space-y-3">
                                            {/* Media Thumbnail */}
                                            {firstMedia ? (
                                                <div className="h-40 w-full rounded-xl overflow-hidden bg-soft-bg relative">
                                                    <img
                                                        src={getMediaPosterUrl(firstMedia)}
                                                        alt={post.title}
                                                        className="w-full h-full object-cover"
                                                        loading="lazy"
                                                    />
                                                    <span
                                                        className={cn(
                                                            "absolute top-2 right-2 text-[10px] font-black px-2.5 py-1 rounded-lg backdrop-blur-xs shadow-xs",
                                                            post.isPublished
                                                                ? "bg-emerald-600/90 text-white"
                                                                : "bg-amber-600/90 text-white"
                                                        )}
                                                    >
                                                        {post.isPublished ? "منتشر شده" : "پیش‌نویس"}
                                                    </span>
                                                    {post.category && (
                                                        <span className="absolute top-2 left-2 text-[10px] font-bold px-2.5 py-1 rounded-lg bg-black/60 text-white backdrop-blur-xs">
                                                            {post.category}
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="h-24 w-full rounded-xl bg-gradient-to-r from-slate-800 to-indigo-900 p-3 flex items-start justify-between text-white relative">
                                                    <span
                                                        className={cn(
                                                            "text-[10px] font-black px-2.5 py-1 rounded-lg backdrop-blur-xs shadow-xs",
                                                            post.isPublished
                                                                ? "bg-emerald-600/90 text-white"
                                                                : "bg-amber-600/90 text-white"
                                                        )}
                                                    >
                                                        {post.isPublished ? "منتشر شده" : "پیش‌نویس"}
                                                    </span>
                                                    <BookOpen className="w-4 h-4 text-white/60" />
                                                </div>
                                            )}

                                            {/* Post Header Details */}
                                            <div className="space-y-1.5">
                                                <div className="flex items-center justify-between text-[11px] text-secondary">
                                                    <span>
                                                        تاریخ: {new Date(post.createdAt).toLocaleDateString("fa-IR")}
                                                    </span>
                                                    {post.slug && (
                                                        <span className="font-mono text-[10px] text-secondary/70 truncate max-w-[140px]" dir="ltr">
                                                            /{post.slug}
                                                        </span>
                                                    )}
                                                </div>

                                                <h4 className="text-xs sm:text-sm font-black text-brand line-clamp-2">
                                                    {post.title}
                                                </h4>

                                                {(post.summary || post.content) && (
                                                    <p className="text-xs text-secondary line-clamp-2 leading-relaxed">
                                                        {post.summary || post.content.slice(0, 100)}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Stats and Action Buttons */}
                                        <div className="pt-3 border-t border-soft-border/50 flex items-center justify-between text-xs">
                                            {/* Metrics */}
                                            <div className="flex items-center gap-3 text-secondary text-[11px]">
                                                <span className="flex items-center gap-1">
                                                    <Eye className="w-3.5 h-3.5" />
                                                    <span>{toPersianDigits(post.viewCount || 0)}</span>
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500/20" />
                                                    <span>{toPersianDigits(post.likeCount || 0)}</span>
                                                </span>
                                            </div>

                                            {/* Studio Actions */}
                                            <div className="flex items-center gap-1">
                                                {/* Live View */}
                                                <Link
                                                    href={liveUrl}
                                                    target="_blank"
                                                    className="p-1.5 text-secondary hover:text-brand hover:bg-soft-bg rounded-lg transition-colors"
                                                    title="مشاهده صفحه زنده"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                </Link>

                                                {/* Toggle Publish / Draft */}
                                                <button
                                                    type="button"
                                                    disabled={togglePublishMutation.isPending}
                                                    onClick={() =>
                                                        togglePublishMutation.mutate({
                                                            postId: post.id,
                                                            isPublished: !post.isPublished,
                                                        })
                                                    }
                                                    className={cn(
                                                        "p-1.5 rounded-lg transition-colors cursor-pointer",
                                                        post.isPublished
                                                            ? "text-emerald-600 hover:bg-emerald-500/10"
                                                            : "text-amber-600 hover:bg-amber-500/10"
                                                    )}
                                                    title={post.isPublished ? "تغییر به پیش‌نویس" : "انتشار در ویترین"}
                                                >
                                                    {post.isPublished ? (
                                                        <Eye className="w-4 h-4" />
                                                    ) : (
                                                        <EyeOff className="w-4 h-4" />
                                                    )}
                                                </button>

                                                {/* Edit Post */}
                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenEdit(post)}
                                                    className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer"
                                                    title="ویرایش مشخصات پست"
                                                >
                                                    <Edit3 className="w-4 h-4" />
                                                </button>

                                                {/* Delete Post */}
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
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>
            </main>

            {/* Edit Post Modal Dialog */}
            {editingPost && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label="ویرایش پست"
                    className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
                >
                    <div className="bg-surface rounded-3xl max-w-xl w-full p-6 sm:p-7 space-y-4 shadow-2xl border border-soft-border my-8 animate-in fade-in zoom-in-95">
                        <div className="flex items-center justify-between border-b border-soft-border/70 pb-3">
                            <div className="flex items-center gap-2">
                                <Edit3 className="w-4 h-4 text-primary" />
                                <h3 className="text-sm sm:text-base font-black text-brand">ویرایش پست ویترین</h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setEditingPost(null)}
                                className="w-7 h-7 rounded-full bg-soft-bg text-secondary hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveEdit} className="space-y-4 text-xs sm:text-sm">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-brand block">عنوان پست *</label>
                                <input
                                    type="text"
                                    value={editForm.title}
                                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                    placeholder="عنوان جذاب برای پست..."
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-soft-border/80 text-brand focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-brand block">آدرس اینترنتی یکتا (Slug - اختیاری)</label>
                                <input
                                    type="text"
                                    value={editForm.slug}
                                    onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })}
                                    placeholder="villa-shomal-tehran"
                                    dir="ltr"
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-soft-border/80 text-brand font-mono text-left focus:outline-none focus:ring-2 focus:ring-primary/20"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-brand block">خلاصه کوتاه</label>
                                <textarea
                                    value={editForm.summary}
                                    onChange={(e) => setEditForm({ ...editForm, summary: e.target.value })}
                                    placeholder="توضیح کوتاه ۱ الی ۲ خطی برای پیش‌نمایش در کارت‌ها..."
                                    rows={2}
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-soft-border/80 text-brand focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-brand block">متن و محتوای پست</label>
                                <textarea
                                    value={editForm.content}
                                    onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                                    placeholder="محتوای متنی کامل، نکات کارشناسی یا توضیحات ملک..."
                                    rows={5}
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-soft-border/80 text-brand focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y"
                                />
                            </div>

                            <div className="flex items-center justify-between p-3 rounded-xl bg-soft-bg/60 border border-soft-border/50">
                                <div>
                                    <span className="text-xs font-bold text-brand block">وضعیت انتشار عمومی</span>
                                    <span className="text-[11px] text-secondary">
                                        در صورت فعال بودن، پست در ویترین شما و کاوش سایت نمایش داده می‌شود.
                                    </span>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={editForm.isPublished}
                                    onChange={(e) => setEditForm({ ...editForm, isPublished: e.target.checked })}
                                    className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-soft-border/70">
                                <button
                                    type="button"
                                    onClick={() => setEditingPost(null)}
                                    className="px-4 py-2 rounded-xl border border-soft-border text-xs font-bold text-secondary hover:bg-soft-bg transition-colors cursor-pointer"
                                >
                                    انصراف
                                </button>
                                <button
                                    type="submit"
                                    disabled={updatePostMutation.isPending}
                                    className="px-5 py-2 rounded-xl bg-brand hover:bg-brand/90 text-white text-xs font-black transition-all cursor-pointer shadow-xs disabled:opacity-50"
                                >
                                    {updatePostMutation.isPending ? "در حال ذخیره..." : "ذخیره تغییرات"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
