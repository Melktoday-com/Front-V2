"use client";

import { useAgencyStats, useMyAgency } from "@/hooks/useAgencies";
import { useAuth } from "@/hooks/useAuth";
import { cn, toPersianDigits } from "@/lib/utils";
import { agencyService } from "@/services/agency.service";
import { AgencyConsultationMessage, AgencyPost, UpdateAgencyProfileRequest } from "@/types/api/agency.types";
import { normalizeApiError } from "@/lib/api/error-handler";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    AlertCircle,
    ArrowUpRight,
    Award,
    BarChart3,
    BookOpen,
    Building2,
    CheckCircle2,
    ChevronLeft,
    Clock,
    ExternalLink,
    FileText,
    Globe,
    Image as ImageIcon,
    LayoutDashboard,
    Mail,
    MapPin,
    MessageSquare,
    Phone,
    Plus,
    Send,
    Settings,
    Share2,
    Star,
    Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

type Tab = "overview" | "settings" | "posts" | "messages";

export default function AgencyPanelScene() {
    const { user, isLoggedIn } = useAuth();
    const router = useRouter();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<Tab>("overview");

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
    const { data: posts = [], isLoading: isLoadingPosts, refetch: refetchPosts } = useQuery({
        queryKey: ["agency-posts", agency?.id],
        queryFn: () => agencyService.listMyPosts(),
        enabled: !!agency?.id && activeTab === "posts",
    });

    const [postModal, setPostModal] = useState<{
        isOpen: boolean;
        isEdit: boolean;
        postId?: string;
        title: string;
        slug: string;
        summary: string;
        content: string;
        mediaUrls: string;
        isPublished: boolean;
    } | null>(null);

    interface SavePostInput {
        isEdit?: boolean;
        postId?: string;
        title: string;
        slug?: string;
        summary?: string;
        content: string;
        mediaUrls?: string;
        isPublished: boolean;
    }

    const savePostMutation = useMutation({
        mutationFn: (data: SavePostInput) => {
            const payload = {
                title: data.title,
                slug: data.slug || undefined,
                summary: data.summary || undefined,
                content: data.content,
                mediaUrls: data.mediaUrls ? data.mediaUrls.split(",").map((s: string) => s.trim()).filter(Boolean) : [],
                isPublished: data.isPublished,
            };
            if (data.isEdit && data.postId) {
                return agencyService.updateMyPost(data.postId, payload);
            }
            return agencyService.createMyPost(payload);
        },
        onSuccess: () => {
            toast.success("پست با موفقیت ذخیره شد.");
            setPostModal(null);
            refetchPosts();
        },
        onError: (err: Error) => {
            toast.error(normalizeApiError(err, "خطا در ذخیره پست."));
        },
    });

    const deletePostMutation = useMutation({
        mutationFn: (postId: string) => agencyService.deleteMyPost(postId),
        onSuccess: () => {
            toast.success("پست حذف شد.");
            refetchPosts();
        },
        onError: (err: Error) => {
            toast.error(normalizeApiError(err, "خطا در حذف پست."));
        },
    });

    // Messages query & reply mutation
    const { data: messages = [], isLoading: isLoadingMessages, refetch: refetchMessages } = useQuery({
        queryKey: ["agency-messages", agency?.id],
        queryFn: () => agencyService.listMyMessages(),
        enabled: !!agency?.id && activeTab === "messages",
    });

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

    if (!isLoggedIn) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center" dir="rtl">
                <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xs max-w-md w-full space-y-4">
                    <Building2 className="w-12 h-12 text-slate-400 mx-auto" />
                    <h2 className="text-lg font-black text-slate-900">نیاز به ورود به حساب کاربری</h2>
                    <p className="text-xs text-slate-500">برای مدیریت صفحه املاک و ویترین خود، ابتدا وارد سیستم شوید.</p>
                    <button
                        onClick={() => router.push("/auth")}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors"
                    >
                        ورود به حساب کاربری
                    </button>
                </div>
            </div>
        );
    }

    if (isLoadingAgency) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center" dir="rtl">
                <div className="space-y-3">
                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xs font-bold text-slate-600">در حال فراخوانی اطلاعات صفحه املاک...</p>
                </div>
            </div>
        );
    }

    if (!agency) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center" dir="rtl">
                <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xs max-w-md w-full space-y-5">
                    <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
                        <Award className="w-8 h-8" />
                    </div>
                    <h2 className="text-lg font-black text-slate-900">شما هنوز صفحه املاک یا نقش Agent ندارید</h2>
                    <p className="text-xs text-slate-500 leading-relaxed">
                        برای داشتن صفحه اختصاصی ویترین، انتشار پست و معرفی خدمات ملکی، ابتدا فرم درخواست مشاور یا دفتر املاک را تکمیل نمایید.
                    </p>
                    <Link
                        href="/agency/apply"
                        className="w-full inline-flex items-center justify-center gap-2 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition-colors shadow-sm"
                    >
                        <span>ثبت درخواست ارتقا به مشاور یا دفتر املاک</span>
                        <ArrowUpRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        );
    }

    const publicShowcaseUrl = `/agency/showcase/${agency.slug || agency.id}`;

    return (
        <div className="min-h-screen bg-slate-50 pb-20" dir="rtl">
            {/* Top Navigation Bar */}
            <header className="bg-white border-b border-slate-200/80 sticky top-0 z-20 px-6 py-4 flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.push("/")}
                        className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600"
                    >
                        <ChevronLeft className="w-5 h-5 rotate-180" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-base font-black text-slate-900">
                                {agency.agencyName || agency.name}
                            </h1>
                            <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-blue-50 text-blue-700">
                                {agency.agencyType === "AGENCY" ? "دفتر املاک" : "مشاور املاک"}
                            </span>
                        </div>
                        <span className="text-[11px] text-slate-400 font-medium">پنل مدیریت ویترین و صفحه اختصاصی</span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Link
                        href={publicShowcaseUrl}
                        target="_blank"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                    >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>مشاهده صفحه عمومی</span>
                    </Link>

                    {agency.verificationStatus === "VERIFIED" ? (
                        <div className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>تأیید هویت رسمی</span>
                        </div>
                    ) : (
                        <div className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 text-xs font-bold">
                            <Clock className="w-3.5 h-3.5" />
                            <span>در انتظار تایید مدارک</span>
                        </div>
                    )}
                </div>
            </header>

            <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
                {/* Tabs Bar */}
                <div className="flex items-center gap-2 p-1.5 bg-slate-200/60 rounded-2xl w-fit max-w-full overflow-x-auto">
                    <button
                        onClick={() => setActiveTab("overview")}
                        className={cn(
                            "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all",
                            activeTab === "overview"
                                ? "bg-white text-slate-900 shadow-sm"
                                : "text-slate-600 hover:text-slate-900"
                        )}
                    >
                        <LayoutDashboard className="w-4 h-4 text-blue-600" />
                        <span>داشبورد و آمار</span>
                    </button>

                    <button
                        onClick={() => setActiveTab("settings")}
                        className={cn(
                            "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all",
                            activeTab === "settings"
                                ? "bg-white text-slate-900 shadow-sm"
                                : "text-slate-600 hover:text-slate-900"
                        )}
                    >
                        <Settings className="w-4 h-4 text-slate-700" />
                        <span>شخصی‌سازی صفحه ویترین</span>
                    </button>

                    <button
                        onClick={() => setActiveTab("posts")}
                        className={cn(
                            "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all",
                            activeTab === "posts"
                                ? "bg-white text-slate-900 shadow-sm"
                                : "text-slate-600 hover:text-slate-900"
                        )}
                    >
                        <BookOpen className="w-4 h-4 text-purple-600" />
                        <span>پست‌ها و مقالات من</span>
                    </button>

                    <button
                        onClick={() => setActiveTab("messages")}
                        className={cn(
                            "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all",
                            activeTab === "messages"
                                ? "bg-white text-slate-900 shadow-sm"
                                : "text-slate-600 hover:text-slate-900"
                        )}
                    >
                        <MessageSquare className="w-4 h-4 text-emerald-600" />
                        <span>صندوق پیام‌ها و درخواست‌ها</span>
                    </button>
                </div>

                {/* TAB 1: OVERVIEW */}
                {activeTab === "overview" && (
                    <div className="space-y-6">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-1">
                                <span className="text-slate-400 text-xs font-bold block">تعداد دنبال‌کنندگان</span>
                                <div className="text-2xl font-black text-slate-900">
                                    {agency.followersCount || stats?.followerCount || 0}
                                </div>
                            </div>

                            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-1">
                                <span className="text-slate-400 text-xs font-bold block">درخواست‌های مشاوره</span>
                                <div className="text-2xl font-black text-slate-900">
                                    {agency.consultationsCount || stats?.consultationCount || 0}
                                </div>
                            </div>

                            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-1">
                                <span className="text-slate-400 text-xs font-bold block">امتیاز رضایت</span>
                                <div className="flex items-center gap-1.5">
                                    {agency.rating != null && !isNaN(Number(agency.rating)) && Number(agency.rating) > 0 ? (
                                        <>
                                            <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                                            <span className="text-2xl font-black text-slate-900">
                                                {toPersianDigits(Number(agency.rating).toFixed(1))}
                                            </span>
                                        </>
                                    ) : (
                                        <span className="text-base font-bold text-slate-400">بدون امتیاز</span>
                                    )}
                                </div>
                            </div>

                            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-1">
                                <span className="text-slate-400 text-xs font-bold block">وضعیت صفحه در سایت</span>
                                <div className="text-sm font-black text-emerald-600 flex items-center gap-1 mt-1.5">
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span>{agency.isActive ? "فعال و آنلاین" : "معلق"}</span>
                                </div>
                            </div>
                        </div>

                        {/* Showcase link banner */}
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-6 sm:p-8 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                            <div className="space-y-1">
                                <h3 className="text-lg font-black">لینک اختصاصی صفحه ویترین شما:</h3>
                                <p className="text-blue-100 text-xs font-mono select-all">
                                    {typeof window !== "undefined" ? window.location.origin : ""}{publicShowcaseUrl}
                                </p>
                            </div>

                            <Link
                                href={publicShowcaseUrl}
                                target="_blank"
                                className="px-5 py-3 bg-white text-blue-900 hover:bg-blue-50 rounded-2xl text-xs font-black transition-colors shrink-0 inline-flex items-center gap-2 shadow-xs"
                            >
                                <ExternalLink className="w-4 h-4" />
                                <span>باز کردن ویترین</span>
                            </Link>
                        </div>
                    </div>
                )}

                {/* TAB 2: SETTINGS & PERSONALIZATION */}
                {activeTab === "settings" && (
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            updateShowcaseMutation.mutate(settingsForm);
                        }}
                        className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6"
                    >
                        <div className="border-b border-slate-100 pb-4">
                            <h2 className="text-base font-black text-slate-900">شخصی‌سازی هویت بصری و اطلاعات ویترین</h2>
                            <p className="text-xs text-slate-500 mt-0.5">
                                اطلاعات این بخش در صفحه عمومی املاک برای تمامی بازدیدکنندگان نمایش داده می‌شود.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700">نام املاک / عنوان برند</label>
                                <input
                                    type="text"
                                    value={settingsForm.agencyName}
                                    onChange={(e) => setSettingsForm({ ...settingsForm, agencyName: e.target.value })}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700">شناسه یکتای آدرس وب (Slug) - فقط انگلیسی</label>
                                <input
                                    type="text"
                                    value={settingsForm.slug}
                                    onChange={(e) => setSettingsForm({ ...settingsForm, slug: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "") })}
                                    placeholder="مثال: tehran-melk"
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-left focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                            </div>

                            <div className="space-y-1.5 sm:col-span-2">
                                <label className="text-xs font-bold text-slate-700">بیوگرافی و معرفی کوتاه</label>
                                <textarea
                                    value={settingsForm.bio}
                                    onChange={(e) => setSettingsForm({ ...settingsForm, bio: e.target.value })}
                                    rows={3}
                                    placeholder="توضیحاتی درباره تخصص، محدوده فعالیت و مزایای دفتر شما..."
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700">آدرس تصویر لوگو (URL)</label>
                                <input
                                    type="text"
                                    value={settingsForm.logoUrl}
                                    onChange={(e) => setSettingsForm({ ...settingsForm, logoUrl: e.target.value })}
                                    placeholder="https://..."
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-left focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700">آدرس تصویر کاور یا بنر بالا (URL)</label>
                                <input
                                    type="text"
                                    value={settingsForm.coverUrl}
                                    onChange={(e) => setSettingsForm({ ...settingsForm, coverUrl: e.target.value })}
                                    placeholder="https://..."
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-left focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700">تلفن ثابت</label>
                                <input
                                    type="text"
                                    value={settingsForm.phone}
                                    onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700">شماره موبایل جهت تماس مستقیم</label>
                                <input
                                    type="text"
                                    value={settingsForm.mobile}
                                    onChange={(e) => setSettingsForm({ ...settingsForm, mobile: e.target.value })}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700">شماره واتساپ</label>
                                <input
                                    type="text"
                                    value={settingsForm.whatsapp}
                                    onChange={(e) => setSettingsForm({ ...settingsForm, whatsapp: e.target.value })}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700">آیدی اینستاگرام (بدون @)</label>
                                <input
                                    type="text"
                                    value={settingsForm.instagram}
                                    onChange={(e) => setSettingsForm({ ...settingsForm, instagram: e.target.value })}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-left focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700">آیدی یا لینک تلگرام</label>
                                <input
                                    type="text"
                                    value={settingsForm.telegram}
                                    onChange={(e) => setSettingsForm({ ...settingsForm, telegram: e.target.value })}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-left focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700">وب‌سایت رسمی</label>
                                <input
                                    type="text"
                                    value={settingsForm.website}
                                    onChange={(e) => setSettingsForm({ ...settingsForm, website: e.target.value })}
                                    placeholder="https://..."
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-left focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                            </div>

                            <div className="space-y-1.5 sm:col-span-2">
                                <label className="text-xs font-bold text-slate-700">ساعات کاری و پاسخگویی</label>
                                <input
                                    type="text"
                                    value={settingsForm.workingHours}
                                    onChange={(e) => setSettingsForm({ ...settingsForm, workingHours: e.target.value })}
                                    placeholder="مثال: شنبه تا پنجشنبه از ساعت ۹ الی ۲۱"
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                            </div>

                            <div className="space-y-1.5 sm:col-span-2">
                                <label className="text-xs font-bold text-slate-700">آدرس کامل</label>
                                <input
                                    type="text"
                                    value={settingsForm.address}
                                    onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                            </div>
                        </div>

                        <div className="pt-2 flex justify-end">
                            <button
                                type="submit"
                                disabled={updateShowcaseMutation.isPending}
                                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition-colors shadow-sm"
                            >
                                {updateShowcaseMutation.isPending ? "در حال ذخیره‌سازی..." : "ذخیره تغییرات صفحه ویترین"}
                            </button>
                        </div>
                    </form>
                )}

                {/* TAB 3: POSTS MANAGEMENT */}
                {activeTab === "posts" && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
                            <div>
                                <h3 className="text-base font-black text-slate-900">پست‌ها و مطالب اختصاصی ویترین</h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    پست‌های تحلیلی، اخبار محله، یا معرفی پروژه‌ها را مستقل از آگهی‌های ملکی منتشر کنید.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setPostModal({
                                    isOpen: true,
                                    isEdit: false,
                                    title: "",
                                    slug: "",
                                    summary: "",
                                    content: "",
                                    mediaUrls: "",
                                    isPublished: true,
                                })}
                                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black transition-colors shadow-sm"
                            >
                                <Plus className="w-4 h-4" />
                                <span>ارسال پست جدید</span>
                            </button>
                        </div>

                        {isLoadingPosts ? (
                            <div className="bg-white p-12 rounded-3xl border border-slate-200/80 text-center">
                                <p className="text-xs font-bold text-slate-600">در حال دریافت پست‌ها...</p>
                            </div>
                        ) : posts.length === 0 ? (
                            <div className="bg-white rounded-3xl border border-slate-200/80 p-16 text-center space-y-3">
                                <BookOpen className="w-12 h-12 text-slate-400 mx-auto" />
                                <h4 className="text-sm font-black text-slate-800">شما هنوز هیچ پستی منتشر نکرده‌اید</h4>
                                <p className="text-xs text-slate-500">انتشار مقالات و پست‌های کاربردی اعتبار صفحه املاک شما را افزایش می‌دهد.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {posts.map((post: AgencyPost) => (
                                    <div key={post.id} className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3 flex flex-col justify-between">
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                                    post.isPublished ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
                                                }`}>
                                                    {post.isPublished ? "منتشر شده" : "پیش‌نویس"}
                                                </span>
                                                <span className="text-[11px] text-slate-400">
                                                    {new Date(post.createdAt).toLocaleDateString("fa-IR")}
                                                </span>
                                            </div>

                                            <h4 className="text-sm font-black text-slate-900 leading-snug">{post.title}</h4>
                                            {post.summary && (
                                                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{post.summary}</p>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500">
                                            <div className="flex items-center gap-3">
                                                <span>بازدید: {post.viewCount || 0}</span>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setPostModal({
                                                        isOpen: true,
                                                        isEdit: true,
                                                        postId: post.id,
                                                        title: post.title,
                                                        slug: post.slug,
                                                        summary: post.summary || "",
                                                        content: post.content,
                                                        mediaUrls: (post.mediaUrls || []).join(", "),
                                                        isPublished: post.isPublished,
                                                    })}
                                                    className="px-2.5 py-1 text-blue-600 hover:bg-blue-50 rounded-lg font-bold"
                                                >
                                                    ویرایش
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => deletePostMutation.mutate(post.id)}
                                                    className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 rounded-lg font-bold"
                                                >
                                                    حذف
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 4: MESSAGES & INQUIRIES */}
                {activeTab === "messages" && (
                    <div className="space-y-6">
                        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
                            <h3 className="text-base font-black text-slate-900">پیام‌ها و مشاوره‌های دریافتی از کاربران</h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                کاربران از طریق صفحه ویترین اختصاصی شما پیام ارسال می‌کنند و می‌توانید مستقیماً پاسخ دهید.
                            </p>
                        </div>

                        {isLoadingMessages ? (
                            <div className="bg-white p-12 rounded-3xl border border-slate-200/80 text-center">
                                <p className="text-xs font-bold text-slate-600">در حال بارگذاری پیام‌ها...</p>
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="bg-white rounded-3xl border border-slate-200/80 p-16 text-center space-y-2">
                                <MessageSquare className="w-12 h-12 text-slate-400 mx-auto" />
                                <h4 className="text-sm font-black text-slate-800">هیچ پیامی در صندوق دریافت وجود ندارد</h4>
                                <p className="text-xs text-slate-500">پیام‌های جدید کاربران در این قسمت نمایش داده خواهد شد.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {messages.map((msg: AgencyConsultationMessage) => (
                                    <div key={msg.id} className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                                            <div>
                                                <h4 className="text-sm font-black text-slate-900">{msg.subject}</h4>
                                                <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                                                    <span>فرستنده: {msg.senderName || "کاربر ناشناس"}</span>
                                                    {msg.senderPhone && <span className="font-mono">تلفن: {msg.senderPhone}</span>}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                                    msg.status === "REPLIED" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                                                }`}>
                                                    {msg.status === "REPLIED" ? "پاسخ داده شده" : "در انتظار پاسخ"}
                                                </span>
                                                <span className="text-[11px] text-slate-400">
                                                    {new Date(msg.createdAt).toLocaleDateString("fa-IR")}
                                                </span>
                                            </div>
                                        </div>

                                        <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-2xl">
                                            {msg.message}
                                        </p>

                                        {msg.replyMessage && (
                                            <div className="p-4 bg-emerald-50/60 border border-emerald-100 rounded-2xl space-y-1">
                                                <span className="text-[11px] font-black text-emerald-800 block">پاسخ شما:</span>
                                                <p className="text-xs text-slate-700 leading-relaxed">{msg.replyMessage}</p>
                                            </div>
                                        )}

                                        <div className="flex justify-end">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setReplyingMessage(msg);
                                                    setReplyText(msg.replyMessage || "");
                                                }}
                                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition-colors"
                                            >
                                                <Send className="w-3.5 h-3.5" />
                                                <span>{msg.replyMessage ? "ویرایش پاسخ" : "ارسال پاسخ"}</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modal for Create/Edit Post */}
            {postModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-slate-100 my-8">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="text-base font-black text-slate-900">
                                {postModal.isEdit ? "ویرایش پست" : "ایجاد پست جدید در صفحه ویترین"}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setPostModal(null)}
                                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-3">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-700">عنوان پست *</label>
                                <input
                                    type="text"
                                    value={postModal.title}
                                    onChange={(e) => setPostModal({ ...postModal, title: e.target.value })}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-700">اسلاگ (شناسه در آدرس - اختیاری)</label>
                                <input
                                    type="text"
                                    value={postModal.slug}
                                    onChange={(e) => setPostModal({ ...postModal, slug: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "-") })}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-left"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-700">خلاصه کوتاه</label>
                                <input
                                    type="text"
                                    value={postModal.summary}
                                    onChange={(e) => setPostModal({ ...postModal, summary: e.target.value })}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-700">محتوای کامل پست *</label>
                                <textarea
                                    value={postModal.content}
                                    onChange={(e) => setPostModal({ ...postModal, content: e.target.value })}
                                    rows={5}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-700">لینک تصاویر (با کاما جدا کنید)</label>
                                <input
                                    type="text"
                                    value={postModal.mediaUrls}
                                    onChange={(e) => setPostModal({ ...postModal, mediaUrls: e.target.value })}
                                    placeholder="https://... , https://..."
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-left"
                                />
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="publishCheck"
                                    checked={postModal.isPublished}
                                    onChange={(e) => setPostModal({ ...postModal, isPublished: e.target.checked })}
                                    className="w-4 h-4 rounded text-blue-600"
                                />
                                <label htmlFor="publishCheck" className="text-xs font-bold text-slate-700 cursor-pointer">
                                    انتشار فوری در صفحه عمومی ویترین
                                </label>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setPostModal(null)}
                                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                            >
                                انصراف
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    if (!postModal.title.trim() || !postModal.content.trim()) {
                                        toast.error("عنوان و متن پست الزامی هستند.");
                                        return;
                                    }
                                    savePostMutation.mutate(postModal);
                                }}
                                disabled={savePostMutation.isPending}
                                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black"
                            >
                                {savePostMutation.isPending ? "در حال ذخیره..." : "ذخیره پست"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal for Replying to Messages */}
            {replyingMessage && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-100">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="text-base font-black text-slate-900">
                                پاسخ به پیام: {replyingMessage.subject}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setReplyingMessage(null)}
                                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
                            <span className="font-bold text-slate-700">متن پیام کاربر:</span>
                            <p className="text-slate-600">{replyingMessage.message}</p>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700">پاسخ شما:</label>
                            <textarea
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                rows={4}
                                placeholder="پاسخ خود به کاربر را در اینجا بنویسید..."
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20"
                            />
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setReplyingMessage(null)}
                                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
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
                                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black"
                            >
                                {replyMutation.isPending ? "در حال ارسال..." : "ارسال پاسخ"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
