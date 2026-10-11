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
    AlertCircle,
    ArrowUpRight,
    Award,
    BadgeCheck,
    BookOpen,
    Building2,
    Calendar,
    Check,
    CheckCircle2,
    ChevronLeft,
    Clock,
    Copy,
    ExternalLink,
    FileText,
    Globe,
    HelpCircle,
    LayoutDashboard,
    Mail,
    MapPin,
    MessageCircle,
    MessageSquare,
    Phone,
    Plus,
    Send,
    Settings,
    Share2,
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
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type Tab = "overview" | "settings" | "posts" | "messages";

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
    const { user, isLoggedIn } = useAuth();
    const router = useRouter();
    const handleBack = useSafeBack("/");
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<Tab>("overview");
    const [copiedLink, setCopiedLink] = useState(false);
    const [messageFilter, setMessageFilter] = useState<"all" | "pending" | "replied">("all");

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

    // Posts query & mutations
    const {
        data: postsData,
        isLoading: isLoadingPosts,
        refetch: refetchPosts,
    } = useQuery<AgencyPostsListResponse>({
        queryKey: ["agency-posts", agency?.id],
        queryFn: () => agencyService.listMyPosts(),
        enabled: !!agency?.id && (activeTab === "posts" || activeTab === "overview"),
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

    // Messages query & reply mutation
    const {
        data: messagesData,
        isLoading: isLoadingMessages,
        refetch: refetchMessages,
    } = useQuery<AgencyConsultationMessage[]>({
        queryKey: ["agency-messages", agency?.id],
        queryFn: () => agencyService.listMyMessages(),
        enabled: !!agency?.id && (activeTab === "messages" || activeTab === "overview"),
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
                            برای مدیریت صفحه ویترین، پاسخ‌گویی به درخواست‌های مشتریان و ویرایش اطلاعات، لطفاً ابتدا وارد حساب کاربری خود شوید.
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
        <div className="min-h-screen bg-canvas text-brand pb-28 lg:pb-16 selection:bg-accent/30" dir="rtl">
            {/* Apple-style Translucent Navigation Bar */}
            <header className="sticky top-0 z-30 bg-surface/85 backdrop-blur-xl border-b border-soft-border/70 shadow-[0_2px_15px_rgba(0,0,0,0.02)] transition-all">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-3">
                    {/* Brand & Back Button */}
                    <div className="flex items-center gap-3 min-w-0">
                        <button
                            onClick={handleBack}
                            aria-label="بازگشت"
                            className="w-10 h-10 rounded-2xl bg-soft-bg/80 hover:bg-soft-bg active:scale-95 border border-soft-border/60 flex items-center justify-center text-brand transition-all shrink-0 cursor-pointer"
                        >
                            <ChevronLeft className="w-5 h-5 rotate-180" />
                        </button>

                        <div className="flex items-center gap-3 min-w-0">
                            {agency.logoUrl ? (
                                <div className="w-10 h-10 rounded-2xl overflow-hidden border border-soft-border/80 bg-surface shrink-0 relative shadow-2xs">
                                    <Image
                                        src={getMediaUrl(agency.logoUrl)}
                                        alt={agency.agencyName || agency.name}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                            ) : (
                                <div className="w-10 h-10 rounded-2xl bg-brand text-accent font-black text-sm flex items-center justify-center shrink-0 shadow-2xs">
                                    {(agency.agencyName || agency.name || "م")[0]}
                                </div>
                            )}

                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <h1 className="text-sm sm:text-base font-black text-brand truncate tracking-tight">
                                        {agency.agencyName || agency.name}
                                    </h1>
                                    <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                                        {agency.agencyType === "AGENCY" ? "دفتر املاک" : "مشاور املاک"}
                                    </span>
                                </div>
                                <p className="text-[11px] text-secondary font-medium truncate hidden sm:block">
                                    مرکز مدیریت اختصاصی و ویترین عمومی
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Quick Action Badges & Public Showcase Link */}
                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                        {agency.verificationStatus === "VERIFIED" ? (
                            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 text-xs font-bold">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                <span>دارای تأیید هویت رسمی</span>
                            </div>
                        ) : (
                            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-700 border border-amber-500/20 text-xs font-bold">
                                <Clock className="w-3.5 h-3.5 text-amber-600" />
                                <span>در انتظار بررسی مدارک</span>
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={handleCopyLink}
                            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-surface hover:bg-soft-bg active:scale-95 text-secondary hover:text-brand border border-soft-border/70 text-xs font-bold transition-all shadow-2xs cursor-pointer"
                            title="کپی لینک ویترین"
                        >
                            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedLink ? "کپی شد" : "کپی لینک"}</span>
                        </button>

                        <Link
                            href={publicShowcasePath}
                            target="_blank"
                            className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl bg-brand hover:bg-brand/90 active:scale-95 text-white text-xs font-black transition-all shadow-sm shadow-brand/10"
                        >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span className="hidden xs:inline">صفحه عمومی</span>
                            <span className="xs:hidden">ویترین</span>
                        </Link>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-6">
                {/* Apple Segmented Control Tabs */}
                <div className="flex justify-center sm:justify-start">
                    <nav
                        aria-label="زبانه های پنل"
                        className="w-full sm:w-auto p-1.5 bg-soft-bg/80 backdrop-blur-md rounded-[20px] border border-soft-border/70 flex items-center gap-1 overflow-x-auto no-scrollbar shadow-2xs"
                    >
                        <button
                            type="button"
                            onClick={() => setActiveTab("overview")}
                            className={cn(
                                "flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all duration-200 select-none cursor-pointer whitespace-nowrap",
                                activeTab === "overview"
                                    ? "bg-surface text-brand shadow-[0_2px_8px_rgba(23,43,73,0.08)] scale-[1.01]"
                                    : "text-secondary hover:text-brand hover:bg-surface/50"
                            )}
                        >
                            <LayoutDashboard className="w-4 h-4 text-primary" />
                            <span>نمای کلی و آمار</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab("settings")}
                            className={cn(
                                "flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all duration-200 select-none cursor-pointer whitespace-nowrap",
                                activeTab === "settings"
                                    ? "bg-surface text-brand shadow-[0_2px_8px_rgba(23,43,73,0.08)] scale-[1.01]"
                                    : "text-secondary hover:text-brand hover:bg-surface/50"
                            )}
                        >
                            <Settings className="w-4 h-4 text-secondary" />
                            <span>شخصی‌سازی ویترین</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab("posts")}
                            className={cn(
                                "flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all duration-200 select-none cursor-pointer whitespace-nowrap",
                                activeTab === "posts"
                                    ? "bg-surface text-brand shadow-[0_2px_8px_rgba(23,43,73,0.08)] scale-[1.01]"
                                    : "text-secondary hover:text-brand hover:bg-surface/50"
                            )}
                        >
                            <BookOpen className="w-4 h-4 text-accent-foreground" />
                            <span>پست‌ها و استودیو</span>
                            {posts.length > 0 && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-soft-border/70 text-secondary font-bold">
                                    {toPersianDigits(posts.length)}
                                </span>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab("messages")}
                            className={cn(
                                "flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all duration-200 select-none cursor-pointer whitespace-nowrap relative",
                                activeTab === "messages"
                                    ? "bg-surface text-brand shadow-[0_2px_8px_rgba(23,43,73,0.08)] scale-[1.01]"
                                    : "text-secondary hover:text-brand hover:bg-surface/50"
                            )}
                        >
                            <MessageSquare className="w-4 h-4 text-emerald-600" />
                            <span>پیام‌ها و مشاوره‌ها</span>
                            {pendingMessagesCount > 0 && (
                                <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 text-[10px] font-black rounded-full bg-emerald-600 text-white shadow-xs">
                                    {toPersianDigits(pendingMessagesCount)}
                                </span>
                            )}
                        </button>
                    </nav>
                </div>

                {/* ───────────────────────────────────────────────────────────── */}
                {/* TAB 1: OVERVIEW & STATS                                      */}
                {/* ───────────────────────────────────────────────────────────── */}
                {activeTab === "overview" && (
                    <div className="space-y-6">
                        {/* Apple-style Hero Showcase Banner */}
                        <div className="relative overflow-hidden rounded-[28px] sm:rounded-[32px] bg-gradient-to-br from-brand via-[#1c3355] to-primary p-6 sm:p-8 text-white shadow-lg shadow-brand/10 border border-white/10">
                            {/* Ambient background decoration */}
                            <div className="absolute -left-16 -top-16 w-64 h-64 bg-accent/15 rounded-full blur-3xl pointer-events-none" />
                            <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-primary/20 rounded-full blur-3xl pointer-events-none" />

                            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="space-y-3 max-w-2xl">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-accent text-xs font-bold">
                                        <Sparkles className="w-3.5 h-3.5 text-accent" />
                                        <span>ویترین اختصاصی دیجیتال شما</span>
                                    </div>

                                    <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white leading-tight">
                                        {agency.agencyName || agency.name}
                                    </h2>

                                    {agency.bio && (
                                        <p className="text-xs sm:text-sm text-slate-200 line-clamp-2 leading-relaxed font-normal">
                                            {agency.bio}
                                        </p>
                                    )}

                                    {/* Showcase Link Pill */}
                                    <div className="flex flex-wrap items-center gap-2 pt-1">
                                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-black/25 backdrop-blur-md border border-white/10 text-xs font-mono text-slate-200 max-w-full">
                                            <Globe className="w-3.5 h-3.5 text-accent shrink-0" />
                                            <span className="truncate select-all text-[11px] sm:text-xs" dir="ltr">
                                                {fullPublicUrl}
                                            </span>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={handleCopyLink}
                                            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white text-xs font-bold transition-all border border-white/15 inline-flex items-center gap-1.5 cursor-pointer"
                                        >
                                            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                            <span>{copiedLink ? "کپی شد" : "کپی آدرس"}</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="flex flex-row md:flex-col gap-2.5 shrink-0">
                                    <Link
                                        href={publicShowcasePath}
                                        target="_blank"
                                        className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white text-brand hover:bg-slate-100 active:scale-95 text-xs sm:text-sm font-black transition-all shadow-md"
                                    >
                                        <ExternalLink className="w-4 h-4 text-primary" />
                                        <span>مشاهده ویترین آنلاین</span>
                                    </Link>

                                    <button
                                        type="button"
                                        onClick={() => setActiveTab("settings")}
                                        className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white/15 hover:bg-white/25 active:scale-95 text-white text-xs sm:text-sm font-bold transition-all border border-white/20 cursor-pointer"
                                    >
                                        <Settings className="w-4 h-4" />
                                        <span>ویرایش اطلاعات</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Apple KPI Metric Cards Grid */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                            {/* Metric 1 */}
                            <div className="p-4 sm:p-5 rounded-[24px] bg-surface/90 backdrop-blur-xl border border-soft-border/70 shadow-xs space-y-3 hover:shadow-sm transition-all">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-secondary">دنبال‌کنندگان</span>
                                    <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                                        <Users className="w-4 h-4" />
                                    </div>
                                </div>
                                <div>
                                    <div className="text-2xl sm:text-3xl font-black text-brand tracking-tight">
                                        {toPersianDigits(agency.followersCount || stats?.followerCount || 0)}
                                    </div>
                                    <span className="text-[11px] text-secondary/70">کاربران علاقه‌مند به ویترین</span>
                                </div>
                            </div>

                            {/* Metric 2 */}
                            <div className="p-4 sm:p-5 rounded-[24px] bg-surface/90 backdrop-blur-xl border border-soft-border/70 shadow-xs space-y-3 hover:shadow-sm transition-all">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-secondary">درخواست‌های مشاوره</span>
                                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                                        <MessageSquare className="w-4 h-4" />
                                    </div>
                                </div>
                                <div>
                                    <div className="text-2xl sm:text-3xl font-black text-brand tracking-tight">
                                        {toPersianDigits(agency.consultationsCount || stats?.consultationCount || messages.length || 0)}
                                    </div>
                                    <span className="text-[11px] text-emerald-600 font-bold">
                                        {pendingMessagesCount > 0 ? `${toPersianDigits(pendingMessagesCount)} پیام پاسخ داده‌نشده` : "تمام پیام‌ها پاسخ داده شده"}
                                    </span>
                                </div>
                            </div>

                            {/* Metric 3 */}
                            <div className="p-4 sm:p-5 rounded-[24px] bg-surface/90 backdrop-blur-xl border border-soft-border/70 shadow-xs space-y-3 hover:shadow-sm transition-all">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-secondary">امتیاز و اعتبار</span>
                                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                                        <Star className="w-4 h-4 fill-amber-500" />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center gap-1.5">
                                        {agency.rating != null && !isNaN(Number(agency.rating)) && Number(agency.rating) > 0 ? (
                                            <>
                                                <span className="text-2xl sm:text-3xl font-black text-brand">
                                                    {toPersianDigits(Number(agency.rating).toFixed(1))}
                                                </span>
                                                <span className="text-xs font-bold text-secondary">از ۵</span>
                                            </>
                                        ) : (
                                            <span className="text-base sm:text-lg font-bold text-secondary">بدون امتیاز</span>
                                        )}
                                    </div>
                                    <span className="text-[11px] text-secondary/70">بر اساس نظرات کاربران</span>
                                </div>
                            </div>

                            {/* Metric 4 */}
                            <div className="p-4 sm:p-5 rounded-[24px] bg-surface/90 backdrop-blur-xl border border-soft-border/70 shadow-xs space-y-3 hover:shadow-sm transition-all">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-secondary">وضعیت انتشار</span>
                                    <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                                        <BadgeCheck className="w-4 h-4" />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="relative flex h-2.5 w-2.5">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                                        </span>
                                        <span className="text-base sm:text-lg font-black text-brand">
                                            {agency.isActive ? "فعال و آنلاین" : "معلق"}
                                        </span>
                                    </div>
                                    <span className="text-[11px] text-secondary/70">در دسترس همه مراجعین</span>
                                </div>
                            </div>
                        </div>

                        {/* Content Studio Pro Feature Banner */}
                        <div className="rounded-[28px] bg-gradient-to-r from-soft-bg via-surface to-soft-bg border border-soft-border/80 p-6 sm:p-7 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-brand text-accent flex items-center justify-center shrink-0 shadow-sm">
                                    <Sparkles className="w-6 h-6" />
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-base font-black text-brand">استودیو اختصاصی تولید محتوا و مقالات</h3>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent/30 text-brand">
                                            ویژه مشاوران
                                        </span>
                                    </div>
                                    <p className="text-xs text-secondary leading-relaxed max-w-xl">
                                        با نگارش تحلیل‌های تخصصی منطقه، معرفی پروژه‌های ویژه و پست‌های تصویری، رتبه و توجه کاربران را به ویترین خود جلب کنید.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2.5 self-end md:self-center shrink-0">
                                <Link
                                    href="/posts/create"
                                    className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-brand hover:bg-brand/90 active:scale-95 text-white text-xs font-black transition-all shadow-md shadow-brand/10"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>ایجاد پست جدید</span>
                                </Link>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab("posts")}
                                    className="px-4 py-3 rounded-2xl bg-surface hover:bg-soft-bg active:scale-95 text-secondary hover:text-brand border border-soft-border/70 text-xs font-bold transition-all"
                                >
                                    مدیریت پست‌ها
                                </button>
                            </div>
                        </div>

                        {/* Recent Inquiries Preview (if any) */}
                        {messages.length > 0 && (
                            <div className="rounded-[28px] bg-surface/90 backdrop-blur-xl border border-soft-border/70 p-6 shadow-xs space-y-4">
                                <div className="flex items-center justify-between border-b border-soft-border/50 pb-3">
                                    <div className="flex items-center gap-2">
                                        <MessageSquare className="w-4 h-4 text-emerald-600" />
                                        <h3 className="text-sm font-black text-brand">آخرین درخواست‌های مشاوره</h3>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab("messages")}
                                        className="text-xs font-bold text-primary hover:underline cursor-pointer"
                                    >
                                        مشاهده همه ({toPersianDigits(messages.length)})
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {messages.slice(0, 4).map((msg) => (
                                        <div
                                            key={msg.id}
                                            onClick={() => {
                                                setActiveTab("messages");
                                                setReplyingMessage(msg);
                                                setReplyText(msg.replyMessage || "");
                                            }}
                                            className="p-4 rounded-2xl bg-soft-bg/40 hover:bg-soft-bg/80 border border-soft-border/60 transition-all cursor-pointer space-y-2 group"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-black text-brand group-hover:text-primary transition-colors">
                                                    {msg.subject}
                                                </span>
                                                <span
                                                    className={cn(
                                                        "text-[10px] font-bold px-2 py-0.5 rounded-full",
                                                        msg.status === "REPLIED"
                                                            ? "bg-emerald-500/10 text-emerald-700"
                                                            : "bg-amber-500/10 text-amber-700"
                                                    )}
                                                >
                                                    {msg.status === "REPLIED" ? "پاسخ داده شد" : "در انتظار پاسخ"}
                                                </span>
                                            </div>
                                            <p className="text-xs text-secondary line-clamp-1">{msg.message}</p>
                                            <div className="text-[10px] text-secondary/70 flex items-center justify-between pt-1">
                                                <span>{msg.senderName || "کاربر ناشناس"}</span>
                                                <span>{new Date(msg.createdAt).toLocaleDateString("fa-IR")}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ───────────────────────────────────────────────────────────── */}
                {/* TAB 2: SETTINGS & CUSTOMIZATION                              */}
                {/* ───────────────────────────────────────────────────────────── */}
                {activeTab === "settings" && (
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            updateShowcaseMutation.mutate(settingsForm);
                        }}
                        className="space-y-6"
                    >
                        {/* Section 1: Basic Identity (Apple Inset Grouped Card) */}
                        <div className="rounded-[28px] bg-surface/90 backdrop-blur-xl border border-soft-border/70 p-6 sm:p-8 shadow-xs space-y-6">
                            <div className="border-b border-soft-border/50 pb-4">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                                        <Building2 className="w-4 h-4" />
                                    </div>
                                    <h3 className="text-base font-black text-brand">مشخصات پایه و هویت برند</h3>
                                </div>
                                <p className="text-xs text-secondary mt-1">
                                    نام رسمی، شناسه نشانی اینترنتی و بیوگرافی معرفی برای نمایش عمومی.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-brand block">
                                        نام دفتر املاک یا مشاور <span className="text-status-error">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={settingsForm.agencyName}
                                        onChange={(e) => setSettingsForm({ ...settingsForm, agencyName: e.target.value })}
                                        className="w-full px-4 py-3 bg-soft-bg/30 border border-soft-border/80 rounded-2xl text-xs sm:text-sm text-brand placeholder:text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                        placeholder="مثال: املاک مدرن ونک"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-brand block">
                                        شناسه یکتای آدرس وب (Slug) - فقط حروف انگلیسی و عدد
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
                                        className="w-full px-4 py-3 bg-soft-bg/30 border border-soft-border/80 rounded-2xl text-xs sm:text-sm font-mono text-brand placeholder:text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-left"
                                    />
                                    <span className="text-[10px] text-secondary font-mono block truncate" dir="ltr">
                                        آدرس: {fullPublicUrl}
                                    </span>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-brand block">شماره پروانه کسب / مجوز صنفی</label>
                                    <input
                                        type="text"
                                        value={settingsForm.licenseNumber}
                                        onChange={(e) => setSettingsForm({ ...settingsForm, licenseNumber: e.target.value })}
                                        placeholder="مثال: ۱۲۳۴۵۶۷۸"
                                        className="w-full px-4 py-3 bg-soft-bg/30 border border-soft-border/80 rounded-2xl text-xs sm:text-sm text-brand placeholder:text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-brand block">کد عضویت اتحادیه املاک (کد صنف)</label>
                                    <input
                                        type="text"
                                        value={settingsForm.guildCode}
                                        onChange={(e) => setSettingsForm({ ...settingsForm, guildCode: e.target.value })}
                                        placeholder="مثال: ۹۸۷۶۵"
                                        className="w-full px-4 py-3 bg-soft-bg/30 border border-soft-border/80 rounded-2xl text-xs sm:text-sm text-brand placeholder:text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono"
                                    />
                                </div>

                                <div className="space-y-1.5 sm:col-span-2">
                                    <label className="text-xs font-bold text-brand block">بیوگرافی و معرفی تخصصی</label>
                                    <textarea
                                        value={settingsForm.bio}
                                        onChange={(e) => setSettingsForm({ ...settingsForm, bio: e.target.value })}
                                        rows={3}
                                        placeholder="توضیحاتی در مورد سوابق کاری، مناطق تحت پوشش، خدمات ویژه و نحوه همکاری..."
                                        className="w-full p-4 bg-soft-bg/30 border border-soft-border/80 rounded-2xl text-xs sm:text-sm text-brand placeholder:text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all leading-relaxed"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Visual Media & Banners */}
                        <div className="rounded-[28px] bg-surface/90 backdrop-blur-xl border border-soft-border/70 p-6 sm:p-8 shadow-xs space-y-6">
                            <div className="border-b border-soft-border/50 pb-4">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-xl bg-accent/20 text-brand flex items-center justify-center">
                                        <Sparkles className="w-4 h-4" />
                                    </div>
                                    <h3 className="text-base font-black text-brand">تصاویر نمایه و بنر سربرگ</h3>
                                </div>
                                <p className="text-xs text-secondary mt-1">
                                    تصاویر باکیفیت و رسمی موجب جلب اعتماد بیشتر بازدیدکنندگان می‌شود.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="p-4 rounded-2xl bg-soft-bg/25 border border-soft-border/60 space-y-2">
                                    <MediaIconUpload
                                        label="لوگوی رسمی دفتر یا تصویر پرتره مشاور"
                                        helperText="فرمت پیشنهادی: مربع با کیفیت بالا (PNG یا WebP)"
                                        value={settingsForm.logoUrl}
                                        onChange={(mediaId) => setSettingsForm({ ...settingsForm, logoUrl: mediaId })}
                                    />
                                </div>

                                <div className="p-4 rounded-2xl bg-soft-bg/25 border border-soft-border/60 space-y-2">
                                    <MediaIconUpload
                                        label="تصویر کاور و بنر بالای صفحه ویترین"
                                        helperText="فرمت پیشنهادی: افقی با نسبت ۱۶:۹ جهت نمایش چشم‌نواز در بالای صفحه"
                                        value={settingsForm.coverUrl}
                                        onChange={(mediaId) => setSettingsForm({ ...settingsForm, coverUrl: mediaId })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Contact Channels & Socials */}
                        <div className="rounded-[28px] bg-surface/90 backdrop-blur-xl border border-soft-border/70 p-6 sm:p-8 shadow-xs space-y-6">
                            <div className="border-b border-soft-border/50 pb-4">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                                        <Phone className="w-4 h-4" />
                                    </div>
                                    <h3 className="text-base font-black text-brand">راه‌های ارتباطی و شبکه‌های اجتماعی</h3>
                                </div>
                                <p className="text-xs text-secondary mt-1">
                                    اطلاعات تماس مستقیم جهت برقراری ارتباط سریع مراجعین و متقاضیان ملک.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-brand block flex items-center gap-1.5">
                                        <Phone className="w-3.5 h-3.5 text-secondary" />
                                        <span>تلفن ثابت دفتر</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={settingsForm.phone}
                                        onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                                        placeholder="۰۲۱..."
                                        dir="ltr"
                                        className="w-full px-4 py-3 bg-soft-bg/30 border border-soft-border/80 rounded-2xl text-xs sm:text-sm font-mono text-brand placeholder:text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-left"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-brand block flex items-center gap-1.5">
                                        <Smartphone className="w-3.5 h-3.5 text-secondary" />
                                        <span>شماره موبایل مستقیم</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={settingsForm.mobile}
                                        onChange={(e) => setSettingsForm({ ...settingsForm, mobile: e.target.value })}
                                        placeholder="۰۹۱۲..."
                                        dir="ltr"
                                        className="w-full px-4 py-3 bg-soft-bg/30 border border-soft-border/80 rounded-2xl text-xs sm:text-sm font-mono text-brand placeholder:text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-left"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-brand block flex items-center gap-1.5">
                                        <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                                        <span>شماره واتساپ</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={settingsForm.whatsapp}
                                        onChange={(e) => setSettingsForm({ ...settingsForm, whatsapp: e.target.value })}
                                        placeholder="۰۹..."
                                        dir="ltr"
                                        className="w-full px-4 py-3 bg-soft-bg/30 border border-soft-border/80 rounded-2xl text-xs sm:text-sm font-mono text-brand placeholder:text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-left"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-brand block flex items-center gap-1.5">
                                        <InstagramIcon className="w-3.5 h-3.5 text-pink-600" />
                                        <span>آیدی اینستاگرام (بدون @)</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={settingsForm.instagram}
                                        onChange={(e) => setSettingsForm({ ...settingsForm, instagram: e.target.value })}
                                        placeholder="melk_agency"
                                        dir="ltr"
                                        className="w-full px-4 py-3 bg-soft-bg/30 border border-soft-border/80 rounded-2xl text-xs sm:text-sm font-mono text-brand placeholder:text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-left"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-brand block flex items-center gap-1.5">
                                        <Send className="w-3.5 h-3.5 text-sky-500" />
                                        <span>آیدی یا کانال تلگرام</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={settingsForm.telegram}
                                        onChange={(e) => setSettingsForm({ ...settingsForm, telegram: e.target.value })}
                                        placeholder="melk_agency"
                                        dir="ltr"
                                        className="w-full px-4 py-3 bg-soft-bg/30 border border-soft-border/80 rounded-2xl text-xs sm:text-sm font-mono text-brand placeholder:text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-left"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-brand block flex items-center gap-1.5">
                                        <Globe className="w-3.5 h-3.5 text-primary" />
                                        <span>وب‌سایت اختصاصی</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={settingsForm.website}
                                        onChange={(e) => setSettingsForm({ ...settingsForm, website: e.target.value })}
                                        placeholder="https://..."
                                        dir="ltr"
                                        className="w-full px-4 py-3 bg-soft-bg/30 border border-soft-border/80 rounded-2xl text-xs sm:text-sm font-mono text-brand placeholder:text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-left"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 4: Physical Location & Hours */}
                        <div className="rounded-[28px] bg-surface/90 backdrop-blur-xl border border-soft-border/70 p-6 sm:p-8 shadow-xs space-y-6">
                            <div className="border-b border-soft-border/50 pb-4">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-xl bg-accent-foreground/10 text-brand flex items-center justify-center">
                                        <MapPin className="w-4 h-4" />
                                    </div>
                                    <h3 className="text-base font-black text-brand">موقعیت مکانی و ساعات پاسخ‌گویی</h3>
                                </div>
                                <p className="text-xs text-secondary mt-1">
                                    نشانی دقیق جهت مراجعه حضوری مراجعین و زمان‌های در دسترس بودن دفتر.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5 sm:col-span-2">
                                    <label className="text-xs font-bold text-brand block">ساعات کاری و پاسخگویی</label>
                                    <input
                                        type="text"
                                        value={settingsForm.workingHours}
                                        onChange={(e) => setSettingsForm({ ...settingsForm, workingHours: e.target.value })}
                                        placeholder="مثال: شنبه تا چهارشنبه از ۹:۰۰ تا ۲۱:۰۰ - پنجشنبه تا ۱۴:۰۰"
                                        className="w-full px-4 py-3 bg-soft-bg/30 border border-soft-border/80 rounded-2xl text-xs sm:text-sm text-brand placeholder:text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                    />
                                </div>

                                <div className="space-y-1.5 sm:col-span-2">
                                    <label className="text-xs font-bold text-brand block">آدرس دقیق پستی دفتر</label>
                                    <input
                                        type="text"
                                        value={settingsForm.address}
                                        onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                                        placeholder="مثال: تهران، میدان ونک، خیابان ملاصدرا، پلاک ..."
                                        className="w-full px-4 py-3 bg-soft-bg/30 border border-soft-border/80 rounded-2xl text-xs sm:text-sm text-brand placeholder:text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-brand block">کد پستی ۱۰ رقمی</label>
                                    <input
                                        type="text"
                                        value={settingsForm.postalCode}
                                        onChange={(e) => setSettingsForm({ ...settingsForm, postalCode: e.target.value })}
                                        placeholder="کد پستی ده‌رقمی"
                                        dir="ltr"
                                        className="w-full px-4 py-3 bg-soft-bg/30 border border-soft-border/80 rounded-2xl text-xs sm:text-sm font-mono text-brand placeholder:text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-left"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Floating / Sticky Save Action Bar */}
                        <div className="sticky bottom-4 z-20 bg-surface/90 backdrop-blur-xl border border-soft-border/80 p-4 rounded-2xl shadow-lg flex items-center justify-between gap-4">
                            <span className="text-xs text-secondary font-medium hidden sm:inline">
                                تغییرات بلافاصله پس از ذخیره در صفحه ویترین عمومی اعمال می‌شوند.
                            </span>

                            <div className="flex items-center gap-3 mr-auto">
                                <button
                                    type="submit"
                                    disabled={updateShowcaseMutation.isPending}
                                    className="px-6 py-3 bg-brand hover:bg-brand/90 active:scale-95 text-white rounded-xl text-xs sm:text-sm font-black transition-all shadow-md shadow-brand/10 disabled:opacity-50 inline-flex items-center gap-2 cursor-pointer"
                                >
                                    {updateShowcaseMutation.isPending && (
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    )}
                                    <span>{updateShowcaseMutation.isPending ? "در حال ذخیره‌سازی..." : "ذخیره تغییرات ویترین"}</span>
                                </button>
                            </div>
                        </div>
                    </form>
                )}

                {/* ───────────────────────────────────────────────────────────── */}
                {/* TAB 3: POSTS & CONTENT STUDIO                                */}
                {/* ───────────────────────────────────────────────────────────── */}
                {activeTab === "posts" && (
                    <div className="space-y-6">
                        {/* Header Action Card */}
                        <div className="rounded-[28px] bg-surface/90 backdrop-blur-xl border border-soft-border/70 p-6 sm:p-7 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <BookOpen className="w-5 h-5 text-accent-foreground" />
                                    <h3 className="text-base font-black text-brand">پست‌ها، تحلیل‌ها و مقالات اختصاصی</h3>
                                </div>
                                <p className="text-xs text-secondary">
                                    مقالات تخصصی و اخبار منطقه را مستقیماً در ویترین آژانس خود منتشر کنید.
                                </p>
                            </div>

                            <Link
                                href="/posts/create"
                                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-brand hover:bg-brand/90 active:scale-95 text-white text-xs sm:text-sm font-black transition-all shadow-md shadow-brand/10 shrink-0"
                            >
                                <Plus className="w-4 h-4" />
                                <span>نگارش و انتشار پست جدید</span>
                            </Link>
                        </div>

                        {/* Content Loading State */}
                        {isLoadingPosts ? (
                            <div className="rounded-[28px] bg-surface/90 backdrop-blur-xl border border-soft-border/70 p-12 text-center">
                                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                                <p className="text-xs font-bold text-secondary">در حال دریافت پست‌ها...</p>
                            </div>
                        ) : posts.length === 0 ? (
                            /* Empty State */
                            <div className="rounded-[32px] bg-surface/90 backdrop-blur-xl border border-soft-border/70 p-12 sm:p-16 text-center space-y-4">
                                <div className="w-16 h-16 rounded-[22px] bg-soft-bg/80 border border-soft-border/70 text-secondary flex items-center justify-center mx-auto">
                                    <BookOpen className="w-8 h-8" />
                                </div>
                                <div className="space-y-1 max-w-sm mx-auto">
                                    <h4 className="text-base font-black text-brand">هنوز هیچ پستی منتشر نکرده‌اید</h4>
                                    <p className="text-xs text-secondary leading-relaxed">
                                        با تولید محتوای ارزشمند و معرفی محله یا پروژه‌ها، رتبه و اعتماد مشتریان را ارتقا دهید.
                                    </p>
                                </div>
                                <div className="pt-2">
                                    <Link
                                        href="/posts/create"
                                        className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-brand hover:bg-brand/90 text-white text-xs font-black transition-all shadow-sm shadow-brand/10"
                                    >
                                        <Plus className="w-4 h-4" />
                                        <span>ایجاد اولین پست در استودیو</span>
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            /* Posts Grid */
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {posts.map((post) => (
                                    <div
                                        key={post.id}
                                        className="rounded-[24px] bg-surface/90 backdrop-blur-xl border border-soft-border/70 p-5 shadow-xs space-y-4 flex flex-col justify-between hover:border-soft-border transition-all"
                                    >
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span
                                                    className={cn(
                                                        "text-[10px] font-bold px-2.5 py-1 rounded-full",
                                                        post.isPublished
                                                            ? "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20"
                                                            : "bg-soft-bg text-secondary border border-soft-border/70"
                                                    )}
                                                >
                                                    {post.isPublished ? "منتشر شده در ویترین" : "پیش‌نویس"}
                                                </span>

                                                <span className="text-[11px] text-secondary font-medium">
                                                    {new Date(post.createdAt).toLocaleDateString("fa-IR")}
                                                </span>
                                            </div>

                                            <h4 className="text-sm sm:text-base font-black text-brand leading-snug line-clamp-2">
                                                {post.title}
                                            </h4>

                                            {post.summary && (
                                                <p className="text-xs text-secondary line-clamp-2 leading-relaxed">
                                                    {post.summary}
                                                </p>
                                            )}
                                        </div>

                                        <div className="pt-3 border-t border-soft-border/50 flex items-center justify-between text-xs">
                                            <div className="flex items-center gap-3 text-secondary text-[11px] font-medium">
                                                <span>بازدید: {toPersianDigits(post.viewCount || 0)}</span>
                                                {post.likeCount != null && (
                                                    <span>پسندها: {toPersianDigits(post.likeCount)}</span>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (window.confirm("آیا از حذف این پست اطمینان دارید؟ این عمل غیرقابل بازگشت است.")) {
                                                            deletePostMutation.mutate(post.id);
                                                        }
                                                    }}
                                                    disabled={deletePostMutation.isPending}
                                                    className="p-2 text-status-error hover:bg-status-error/10 rounded-xl font-bold transition-colors cursor-pointer"
                                                    title="حذف پست"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ───────────────────────────────────────────────────────────── */}
                {/* TAB 4: INQUIRIES & MESSAGES                                  */}
                {/* ───────────────────────────────────────────────────────────── */}
                {activeTab === "messages" && (
                    <div className="space-y-6">
                        {/* Header & Filter Controls */}
                        <div className="rounded-[28px] bg-surface/90 backdrop-blur-xl border border-soft-border/70 p-6 sm:p-7 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <MessageSquare className="w-5 h-5 text-emerald-600" />
                                    <h3 className="text-base font-black text-brand">صندوق پیام‌ها و درخواست‌های مشاوره</h3>
                                </div>
                                <p className="text-xs text-secondary">
                                    پیام‌های ثبت شده توسط بازدیدکنندگان ویترین شما با امکان پاسخ‌گویی آنلاین.
                                </p>
                            </div>

                            {/* Filter Pills */}
                            <div className="inline-flex items-center p-1 bg-soft-bg/80 rounded-2xl border border-soft-border/70 gap-1 self-start sm:self-auto">
                                <button
                                    type="button"
                                    onClick={() => setMessageFilter("all")}
                                    className={cn(
                                        "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                                        messageFilter === "all" ? "bg-surface text-brand shadow-xs" : "text-secondary hover:text-brand"
                                    )}
                                >
                                    همه ({toPersianDigits(messages.length)})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMessageFilter("pending")}
                                    className={cn(
                                        "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
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
                                        "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                                        messageFilter === "replied"
                                            ? "bg-surface text-brand shadow-xs"
                                            : "text-secondary hover:text-brand"
                                    )}
                                >
                                    پاسخ داده شده
                                </button>
                            </div>
                        </div>

                        {/* Messages Loading State */}
                        {isLoadingMessages ? (
                            <div className="rounded-[28px] bg-surface/90 backdrop-blur-xl border border-soft-border/70 p-12 text-center">
                                <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                                <p className="text-xs font-bold text-secondary">در حال فراخوانی پیام‌ها...</p>
                            </div>
                        ) : filteredMessages.length === 0 ? (
                            /* Empty State */
                            <div className="rounded-[32px] bg-surface/90 backdrop-blur-xl border border-soft-border/70 p-12 sm:p-16 text-center space-y-3">
                                <div className="w-16 h-16 rounded-[22px] bg-soft-bg/80 border border-soft-border/70 text-secondary flex items-center justify-center mx-auto">
                                    <MessageSquare className="w-8 h-8 text-secondary" />
                                </div>
                                <h4 className="text-base font-black text-brand">پیامی در این بخش وجود ندارد</h4>
                                <p className="text-xs text-secondary">
                                    پیام‌های ارسالی کاربران از طریق صفحه ویترین اختصاصی، در این قسمت نمایش داده می‌شوند.
                                </p>
                            </div>
                        ) : (
                            /* Messages List */
                            <div className="space-y-4">
                                {filteredMessages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className="rounded-[28px] bg-surface/90 backdrop-blur-xl border border-soft-border/70 p-5 sm:p-6 shadow-xs space-y-4 hover:shadow-sm transition-all"
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-soft-border/50 pb-3.5">
                                            <div>
                                                <h4 className="text-sm sm:text-base font-black text-brand">{msg.subject}</h4>
                                                <div className="flex flex-wrap items-center gap-3 text-xs text-secondary mt-1">
                                                    <span>فرستنده: <strong className="text-brand">{msg.senderName || "کاربر سایت"}</strong></span>
                                                    {msg.senderPhone && (
                                                        <a
                                                            href={`tel:${msg.senderPhone}`}
                                                            className="font-mono text-primary hover:underline flex items-center gap-1"
                                                            dir="ltr"
                                                        >
                                                            <Phone className="w-3 h-3" />
                                                            <span>{msg.senderPhone}</span>
                                                        </a>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 self-start sm:self-auto">
                                                <span
                                                    className={cn(
                                                        "px-2.5 py-1 rounded-full text-[10px] font-bold",
                                                        msg.status === "REPLIED"
                                                            ? "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20"
                                                            : "bg-amber-500/10 text-amber-700 border border-amber-500/20"
                                                    )}
                                                >
                                                    {msg.status === "REPLIED" ? "پاسخ داده شد" : "در انتظار پاسخ"}
                                                </span>
                                                <span className="text-[11px] text-secondary">
                                                    {new Date(msg.createdAt).toLocaleDateString("fa-IR")}
                                                </span>
                                            </div>
                                        </div>

                                        {/* User message body */}
                                        <div className="p-4 rounded-2xl bg-soft-bg/40 border border-soft-border/60 text-xs sm:text-sm text-brand leading-relaxed">
                                            {msg.message}
                                        </div>

                                        {/* Agent's Reply (if exists) */}
                                        {msg.replyMessage && (
                                            <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-black text-emerald-800 flex items-center gap-1.5">
                                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                                        <span>پاسخ ارسالی شما:</span>
                                                    </span>
                                                    {msg.respondedAt && (
                                                        <span className="text-[10px] text-emerald-700 font-medium">
                                                            {new Date(msg.respondedAt).toLocaleDateString("fa-IR")}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs sm:text-sm text-brand/90 leading-relaxed pt-1">
                                                    {msg.replyMessage}
                                                </p>
                                            </div>
                                        )}

                                        {/* Actions */}
                                        <div className="flex justify-end pt-1">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setReplyingMessage(msg);
                                                    setReplyText(msg.replyMessage || "");
                                                }}
                                                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary/10 hover:bg-primary/15 active:scale-95 text-primary text-xs font-bold transition-all cursor-pointer"
                                            >
                                                <Send className="w-3.5 h-3.5" />
                                                <span>{msg.replyMessage ? "ویرایش متن پاسخ" : "ارسال پاسخ به کاربر"}</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Apple-style Reply Bottom Sheet / Modal */}
            {replyingMessage && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all">
                    <div className="w-full max-w-lg bg-surface rounded-t-[32px] sm:rounded-[32px] p-6 sm:p-7 space-y-5 shadow-2xl border border-soft-border/70 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-soft-border/50 pb-3.5">
                            <div>
                                <h3 className="text-base font-black text-brand">
                                    پاسخ به: {replyingMessage.subject}
                                </h3>
                                <span className="text-xs text-secondary">
                                    فرستنده: {replyingMessage.senderName || "کاربر سایت"}
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setReplyingMessage(null)}
                                className="w-8 h-8 rounded-full bg-soft-bg hover:bg-soft-border/70 text-secondary hover:text-brand flex items-center justify-center transition-colors cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* User Message Quote */}
                        <div className="p-3.5 bg-soft-bg/50 border border-soft-border/60 rounded-2xl text-xs text-secondary leading-relaxed space-y-1">
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
                                className="w-full p-4 bg-soft-bg/30 border border-soft-border/80 rounded-2xl text-xs sm:text-sm text-brand placeholder:text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all leading-relaxed"
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-soft-border/50">
                            <button
                                type="button"
                                onClick={() => setReplyingMessage(null)}
                                className="px-4 py-2.5 rounded-xl border border-soft-border/80 text-xs font-bold text-secondary hover:bg-soft-bg transition-colors cursor-pointer"
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
                                className="px-5 py-2.5 rounded-xl bg-brand hover:bg-brand/90 active:scale-95 text-white text-xs font-black transition-all shadow-md shadow-brand/10 disabled:opacity-50 inline-flex items-center gap-2 cursor-pointer"
                            >
                                {replyMutation.isPending && (
                                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
