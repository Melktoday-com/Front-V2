"use client";

import { PropertyCard } from "@/components/ui/PropertyCard";
import { ReviewsSection } from "@/components/ui/ReviewsSection";
import { Select } from "@/components/ui/Select";
import { ErrorState } from "@/components/ui/StatusStates";
import { useAds } from "@/hooks/useAds";
import { useAgencyContact, useFollowAgency, useUnfollowAgency } from "@/hooks/useAgencies";
import { useAuth } from "@/hooks/useAuth";
import { useCreateConversation } from "@/hooks/useChat";
import { cn, formatPrice, toPersianDigits } from "@/lib/utils";
import { agencyService } from "@/services/agency.service";
import { AgencyPost } from "@/types/api/agency.types";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
    Award,
    BookOpen,
    Building,
    Building2,
    Calendar,
    Check,
    ChevronRight,
    ExternalLink,
    Eye,
    Globe,
    Grid,
    Heart,
    List,
    Mail,
    MapPin,
    MessageCircle,
    MessageSquare,
    Phone,
    Send,
    Share2,
    Star,
    Verified,
    X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function SingleAgencyScene() {
    const params = useParams();
    const idOrSlug = (params.idOrSlug || params.id) as string;
    const router = useRouter();

    const [activeTab, setActiveTab] = useState<"listings" | "posts" | "about" | "reviews">("listings");
    const [viewMode, setViewMode] = useState<"grid" | "feed">("feed");

    // Consultation modal states
    const [isConsultationModalOpen, setIsConsultationModalOpen] = useState(false);
    const [consultationSubject, setConsultationSubject] = useState("مشاوره عمومی ملک");
    const [consultationMessage, setConsultationMessage] = useState("");
    const [senderName, setSenderName] = useState("");
    const [senderPhone, setSenderPhone] = useState("");

    // Post reader modal
    const [readingPost, setReadingPost] = useState<AgencyPost | null>(null);

    const { isLoggedIn, user } = useAuth();
    const [contactRequested, setContactRequested] = useState(false);

    // Fetch agency showcase data (supports UUID or slug)
    const {
        data: agency,
        isLoading: isLoadingAgency,
        error: agencyError,
        refetch: refetchAgency,
    } = useQuery({
        queryKey: ["agency-showcase", idOrSlug],
        queryFn: () => agencyService.getPublicShowcase(idOrSlug),
        enabled: !!idOrSlug,
    });

    const targetAgencyId = agency?.id || idOrSlug;

    // Contact query — triggered only after authenticated user interaction
    const {
        data: contactData,
        isLoading: isLoadingContact,
    } = useAgencyContact(targetAgencyId, {
        enabled: contactRequested && isLoggedIn && !!targetAgencyId,
    });

    const handleRevealContact = () => {
        if (!isLoggedIn) {
            toast.error("برای مشاهده اطلاعات تماس، لطفاً وارد حساب کاربری خود شوید.");
            router.push(`/auth?returnUrl=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname : "")}`);
            return;
        }
        setContactRequested(true);
    };

    // Ads query
    const { data: adsResponse, isLoading: isLoadingAds } = useAds({
        ownerId: targetAgencyId,
        limit: 30,
    });

    // Posts query
    const { data: postsData, isLoading: isLoadingPosts } = useQuery({
        queryKey: ["agency-public-posts", targetAgencyId],
        queryFn: () => agencyService.getPublicPosts(targetAgencyId),
        enabled: !!targetAgencyId,
    });

    const followMutation = useFollowAgency();
    const unfollowMutation = useUnfollowAgency();
    const chatMutation = useCreateConversation();

    const consultationMutation = useMutation({
        mutationFn: () =>
            agencyService.sendMessageToAgency(targetAgencyId, {
                subject: consultationSubject,
                message: consultationMessage,
                senderName: senderName.trim() || undefined,
                senderPhone: senderPhone.trim() || undefined,
            }),
        onSuccess: () => {
            toast.success("پیام شما با موفقیت به صفحه املاک ارسال شد.");
            setIsConsultationModalOpen(false);
            setConsultationMessage("");
            setSenderName("");
            setSenderPhone("");
        },
        onError: () => {
            toast.error("خطا در ارسال پیام به صفحه املاک.");
        },
    });

    const handleFollow = () => {
        if (!isLoggedIn) {
            router.push("/auth");
            return;
        }
        if (agency?.isFollowing) {
            unfollowMutation.mutate(targetAgencyId);
        } else {
            followMutation.mutate(targetAgencyId);
        }
    };

    const handleChat = () => {
        if (!isLoggedIn) {
            router.push("/auth");
            return;
        }
        chatMutation.mutate(
            {
                subjectType: "AGENCY",
                subjectId: targetAgencyId,
            },
            {
                onSuccess: (conv) => {
                    router.push(`/chat?id=${conv.id}`);
                },
                onError: () => {
                    toast.error("خطا در برقراری ارتباط چت");
                },
            }
        );
    };

    if (isLoadingAgency) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-8 space-y-6" dir="rtl">
                <div className="h-44 bg-gray-100 rounded-3xl animate-pulse" />
                <div className="flex gap-4">
                    <div className="w-24 h-24 rounded-full bg-gray-200 animate-pulse -mt-12 mr-6" />
                    <div className="space-y-2 flex-1 pt-2">
                        <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse" />
                        <div className="h-4 bg-gray-100 rounded w-1/2 animate-pulse" />
                    </div>
                </div>
            </div>
        );
    }

    if (agencyError || !agency) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-16" dir="rtl">
                <ErrorState
                    message="صفحه املاک یافت نشد یا غیرفعال شده است."
                    onRetry={() => refetchAgency()}
                />
            </div>
        );
    }

    const ads = adsResponse?.items || [];
    const posts = postsData?.items || [];
    const followerCount = agency.followersCount ?? agency.followerCount ?? 0;

    return (
        <div className="max-w-4xl mx-auto px-3 sm:px-6 py-6 pb-24" dir="rtl">
            {/* Top Navigation */}
            <div className="flex items-center justify-between mb-4">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-1 text-xs font-bold text-text-light hover:text-brand transition-colors"
                >
                    <ChevronRight className="w-4 h-4" />
                    <span>بازگشت</span>
                </button>
                <button
                    onClick={() => {
                        if (navigator.share) {
                            navigator.share({
                                title: agency.agencyName || agency.name,
                                url: window.location.href,
                            });
                        } else {
                            navigator.clipboard.writeText(window.location.href);
                            toast.success("لینک صفحه کپی شد");
                        }
                    }}
                    className="p-2 rounded-xl bg-gray-100 text-brand hover:bg-gray-200 transition-colors"
                >
                    <Share2 className="w-4 h-4" />
                </button>
            </div>

            {/* Showcase Hero Section */}
            <section className="bg-white rounded-3xl border border-gray-200/80 shadow-xs overflow-hidden mb-6">
                {/* Cover Banner */}
                <div className="h-36 sm:h-52 w-full bg-gradient-to-r from-slate-800 via-blue-900 to-indigo-900 relative">
                    {agency.coverUrl && (
                        <img
                            src={agency.coverUrl}
                            alt={agency.agencyName || agency.name}
                            className="w-full h-full object-cover"
                        />
                    )}
                    <div className="absolute top-4 left-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-black shadow-xs ${
                            agency.agencyType === "AGENCY"
                                ? "bg-purple-600 text-white"
                                : "bg-blue-600 text-white"
                        }`}>
                            {agency.agencyType === "AGENCY" ? "دفتر املاک رسمی" : "مشاور املاک مستقل"}
                        </span>
                    </div>
                </div>

                {/* Profile Info Header */}
                <div className="px-5 sm:px-8 pb-6 pt-0 relative">
                    <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between -mt-14 sm:-mt-16 mb-4 gap-4">
                        {/* Avatar / Logo */}
                        <div className="relative">
                            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl border-4 border-white shadow-md bg-white overflow-hidden flex items-center justify-center font-black text-2xl text-brand">
                                {agency.logoUrl ? (
                                    <img
                                        src={agency.logoUrl}
                                        alt={agency.agencyName || agency.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    (agency.agencyName || agency.name || "A").slice(0, 1)
                                )}
                            </div>
                            {agency.verificationStatus === "VERIFIED" && (
                                <div className="absolute -bottom-1 -left-1 bg-blue-600 text-white p-1 rounded-full shadow-xs" title="تأیید هویت رسمی">
                                    <Verified className="w-4 h-4 fill-blue-600 text-white" />
                                </div>
                            )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            {user?.userId && agency?.ownerUserId === user.userId ? (
                                <Link
                                    href="/agency/panel"
                                    className="flex-1 sm:flex-initial py-2.5 px-5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs bg-slate-900 text-white hover:bg-slate-800"
                                >
                                    <Building2 className="w-3.5 h-3.5 text-blue-400" />
                                    <span>مدیریت صفحه املاک</span>
                                </Link>
                            ) : (
                                <button
                                    onClick={handleFollow}
                                    disabled={followMutation.isPending || unfollowMutation.isPending}
                                    className={cn(
                                        "flex-1 sm:flex-initial py-2.5 px-5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs",
                                        agency.isFollowing
                                            ? "bg-slate-100 text-slate-800 border border-slate-200"
                                            : "bg-blue-600 text-white hover:bg-blue-700"
                                    )}
                                >
                                    {agency.isFollowing ? (
                                        <>
                                            <Check className="w-3.5 h-3.5 text-blue-600" />
                                            <span>دنبال می‌کنید</span>
                                        </>
                                    ) : (
                                        <>
                                            <Heart className="w-3.5 h-3.5" />
                                            <span>دنبال کردن</span>
                                        </>
                                    )}
                                </button>
                            )}

                            <button
                                onClick={() => setIsConsultationModalOpen(true)}
                                className="flex-1 sm:flex-initial py-2.5 px-5 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-slate-800 transition-all shadow-xs"
                            >
                                <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                                <span>ارسال پیام و مشاوره</span>
                            </button>

                            <button
                                onClick={handleChat}
                                disabled={chatMutation.isPending}
                                className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-colors"
                                title="چت آنلاین"
                            >
                                <MessageCircle className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Agency Title & Stats */}
                    <div className="space-y-3 text-center sm:text-right">
                        <div>
                            <div className="flex items-center justify-center sm:justify-start gap-2">
                                <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                                    {agency.agencyName || agency.name}
                                </h1>
                            </div>
                            {agency.slug && (
                                <span className="text-xs text-slate-400 font-mono">@{agency.slug}</span>
                            )}
                        </div>

                        {/* Bio */}
                        {agency.bio && (
                            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl">
                                {agency.bio}
                            </p>
                        )}

                        {/* Counters Row */}
                        <div className="flex items-center justify-center sm:justify-start gap-6 border-y border-slate-100 py-3 text-center">
                            <div>
                                <span className="text-base sm:text-lg font-black text-slate-900 block">
                                    {toPersianDigits(ads.length)}
                                </span>
                                <span className="text-xs text-slate-400">آگهی‌های ملکی</span>
                            </div>
                            <div className="w-px h-6 bg-slate-200" />
                            <div>
                                <span className="text-base sm:text-lg font-black text-slate-900 block">
                                    {toPersianDigits(posts.length)}
                                </span>
                                <span className="text-xs text-slate-400">پست‌ها و مقالات</span>
                            </div>
                            <div className="w-px h-6 bg-slate-200" />
                            <div>
                                <span className="text-base sm:text-lg font-black text-slate-900 block">
                                    {toPersianDigits(followerCount)}
                                </span>
                                <span className="text-xs text-slate-400">دنبال‌کننده</span>
                            </div>
                            <div className="w-px h-6 bg-slate-200" />
                            <div>
                                <span className="text-base sm:text-lg font-black text-slate-900 block flex items-center justify-center gap-1">
                                    {agency.rating != null && !isNaN(Number(agency.rating)) && Number(agency.rating) > 0 ? (
                                        <>
                                            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                                            {toPersianDigits(Number(agency.rating).toFixed(1))}
                                        </>
                                    ) : (
                                        <span />
                                    )}
                                </span>
                                <span className="text-xs text-slate-400">امتیاز</span>
                            </div>
                        </div>

                        {/* Contact Badges */}
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-1 text-xs">
                            {contactData ? (
                                <>
                                    {contactData.mobile && (
                                        <a
                                            href={`tel:${contactData.mobile}`}
                                            className="inline-flex items-center gap-1.5 text-slate-800 font-bold bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors border border-slate-200/60"
                                        >
                                            <Phone className="w-3.5 h-3.5 text-blue-600" />
                                            <span dir="ltr">{contactData.mobile}</span>
                                        </a>
                                    )}
                                    {contactData.phone && (
                                        <a
                                            href={`tel:${contactData.phone}`}
                                            className="inline-flex items-center gap-1.5 text-slate-800 font-bold bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors border border-slate-200/60"
                                        >
                                            <Phone className="w-3.5 h-3.5 text-slate-500" />
                                            <span dir="ltr">{contactData.phone}</span>
                                        </a>
                                    )}
                                    {!contactData.mobile && !contactData.phone && (
                                        <span className="inline-flex items-center gap-1 text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg font-medium">
                                            شماره تماسی ثبت نشده است
                                        </span>
                                    )}
                                </>
                            ) : isLoadingContact ? (
                                <div className="inline-flex items-center gap-2 text-slate-600 bg-slate-100 px-3.5 py-1.5 rounded-lg animate-pulse font-medium border border-slate-200/60">
                                    <Phone className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                                    <span>در حال دریافت اطلاعات تماس...</span>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleRevealContact}
                                    className="inline-flex items-center gap-1.5 text-blue-700 font-bold bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3.5 py-1.5 rounded-lg transition-all shadow-sm active:scale-95 cursor-pointer"
                                >
                                    <Phone className="w-3.5 h-3.5 text-blue-600" />
                                    <span>مشاهده اطلاعات تماس</span>
                                </button>
                            )}
                            {agency.instagram && (
                                <a
                                    href={`https://instagram.com/${agency.instagram}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 text-pink-700 font-bold bg-pink-50 hover:bg-pink-100 px-3 py-1.5 rounded-lg transition-colors"
                                >
                                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                                        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
                                    </svg>
                                    <span>اینستاگرام</span>
                                </a>
                            )}
                            {agency.website && (
                                <a
                                    href={agency.website.startsWith("http") ? agency.website : `https://${agency.website}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 text-blue-700 font-bold bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                                >
                                    <Globe className="w-3.5 h-3.5" />
                                    <span>وب‌سایت رسمی</span>
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Showcase Tabs */}
            <div className="flex items-center justify-between border-b border-slate-200 mb-6">
                <div className="flex gap-4 sm:gap-8">
                    <button
                        onClick={() => setActiveTab("listings")}
                        className={cn(
                            "pb-3 font-bold text-xs sm:text-sm border-b-2 transition-colors",
                            activeTab === "listings"
                                ? "border-blue-600 text-blue-600 font-black"
                                : "border-transparent text-slate-400 hover:text-slate-800"
                        )}
                    >
                        آگهی‌های ملکی ({toPersianDigits(ads.length)})
                    </button>

                    <button
                        onClick={() => setActiveTab("posts")}
                        className={cn(
                            "pb-3 font-bold text-xs sm:text-sm border-b-2 transition-colors",
                            activeTab === "posts"
                                ? "border-blue-600 text-blue-600 font-black"
                                : "border-transparent text-slate-400 hover:text-slate-800"
                        )}
                    >
                        پست‌ها و مقالات ({toPersianDigits(posts.length)})
                    </button>

                    <button
                        onClick={() => setActiveTab("about")}
                        className={cn(
                            "pb-3 font-bold text-xs sm:text-sm border-b-2 transition-colors",
                            activeTab === "about"
                                ? "border-blue-600 text-blue-600 font-black"
                                : "border-transparent text-slate-400 hover:text-slate-800"
                        )}
                    >
                        مشخصات و آدرس
                    </button>

                    <button
                        onClick={() => setActiveTab("reviews")}
                        className={cn(
                            "pb-3 font-bold text-xs sm:text-sm border-b-2 transition-colors",
                            activeTab === "reviews"
                                ? "border-blue-600 text-blue-600 font-black"
                                : "border-transparent text-slate-400 hover:text-slate-800"
                        )}
                    >
                        نظرات کاربران
                    </button>
                </div>
            </div>

            {/* TAB 1: LISTINGS */}
            {activeTab === "listings" && (
                <div>
                    {isLoadingAds ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="aspect-[4/3] bg-slate-100 animate-pulse rounded-2xl" />
                            ))}
                        </div>
                    ) : ads.length === 0 ? (
                        <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                            <p className="text-slate-400 font-bold text-sm">در حال حاضر آگهی فعالی از این صفحه ثبت نشده است.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {ads.map((ad) => (
                                <PropertyCard
                                    key={ad.adId}
                                    adId={ad.adId}
                                    title={ad.title}
                                    price={ad.pricing ? (Object.values(ad.pricing)[0] ?? 0) : 0}
                                    location={ad.cityId}
                                    image={
                                        ad.mediaIds && ad.mediaIds.length > 0
                                            ? `${process.env.NEXT_PUBLIC_API_URL}/media/${ad.mediaIds[0]}`
                                            : "/property-placeholder.svg"
                                    }
                                    category={ad.subcategoryTitle || ad.categoryPath?.subcategoryTitle || ad.categoryPath?.subcategoryKey}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* TAB 2: POSTS */}
            {activeTab === "posts" && (
                <div>
                    {isLoadingPosts ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="h-44 bg-slate-100 animate-pulse rounded-3xl" />
                            ))}
                        </div>
                    ) : posts.length === 0 ? (
                        <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                            <p className="text-slate-400 font-bold text-sm">هنوز پستی در این صفحه منتشر نشده است.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {posts.map((post: AgencyPost) => (
                                <div
                                    key={post.id}
                                    onClick={() => setReadingPost(post)}
                                    className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs hover:border-blue-400 transition-all cursor-pointer flex flex-col justify-between space-y-3 group"
                                >
                                    {post.mediaUrls && post.mediaUrls.length > 0 && (
                                        <div className="h-40 w-full rounded-2xl overflow-hidden bg-slate-100">
                                            <img
                                                src={post.mediaUrls[0]}
                                                alt={post.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        </div>
                                    )}

                                    <div className="space-y-1.5">
                                        <h3 className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                                            {post.title}
                                        </h3>
                                        {post.summary && (
                                            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                                                {post.summary}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100">
                                        <span>{new Date(post.createdAt).toLocaleDateString("fa-IR")}</span>
                                        <span className="flex items-center gap-1">
                                            <Eye className="w-3.5 h-3.5" />
                                            <span>{post.viewCount || 0} بازدید</span>
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* TAB 3: ABOUT */}
            {activeTab === "about" && (
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
                    <h3 className="text-base font-black text-slate-900">مشخصات صنفی و اطلاعات تماس</h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        {agency.guildCode && (
                            <div className="p-4 bg-slate-50 rounded-2xl space-y-1">
                                <span className="text-slate-400 font-bold block">شناسه صنفی اصناف:</span>
                                <span className="font-mono font-bold text-slate-900 text-sm">{agency.guildCode}</span>
                            </div>
                        )}
                        {agency.licenseNumber && (
                            <div className="p-4 bg-slate-50 rounded-2xl space-y-1">
                                <span className="text-slate-400 font-bold block">شماره پروانه کسب:</span>
                                <span className="font-mono font-bold text-slate-900 text-sm">{agency.licenseNumber}</span>
                            </div>
                        )}
                        {agency.workingHours && (
                            <div className="p-4 bg-slate-50 rounded-2xl space-y-1 sm:col-span-2">
                                <span className="text-slate-400 font-bold block">ساعات کاری:</span>
                                <span className="font-bold text-slate-900">{agency.workingHours}</span>
                            </div>
                        )}
                        {agency.address && (
                            <div className="p-4 bg-slate-50 rounded-2xl space-y-1 sm:col-span-2">
                                <span className="text-slate-400 font-bold block">آدرس رسمی:</span>
                                <span className="font-medium text-slate-800 leading-relaxed">{agency.address}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB 4: REVIEWS */}
            {activeTab === "reviews" && (
                <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
                    <ReviewsSection targetId={targetAgencyId} targetType="agency" />
                </div>
            )}

            {/* Send Message / Consultation Modal */}
            {isConsultationModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-100">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2">
                                <MessageSquare className="w-5 h-5 text-blue-600" />
                                <h3 className="text-base font-black text-slate-900">
                                    ارسال پیام به {agency.agencyName || agency.name}
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsConsultationModalOpen(false)}
                                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-3 text-xs">
                            <div className="space-y-1">
                                <label className="text-slate-700 font-bold">نام و نام خانوادگی شما</label>
                                <input
                                    type="text"
                                    value={senderName}
                                    onChange={(e) => setSenderName(e.target.value)}
                                    placeholder="مثال: محمد رضایی"
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-slate-700 font-bold">شماره تماس جهت هماهنگی</label>
                                <input
                                    type="text"
                                    value={senderPhone}
                                    onChange={(e) => setSenderPhone(e.target.value)}
                                    placeholder="۰۹۱۲..."
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-slate-700 font-bold">موضوع پیام یا درخواست</label>
                                <input
                                    type="text"
                                    value={consultationSubject}
                                    onChange={(e) => setConsultationSubject(e.target.value)}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-slate-700 font-bold">متن پیام *</label>
                                <textarea
                                    rows={4}
                                    value={consultationMessage}
                                    onChange={(e) => setConsultationMessage(e.target.value)}
                                    placeholder="درخواست ملکی یا سوال خود را اینجا مطرح فرمایید..."
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                                />
                            </div>
                        </div>

                        <div className="flex gap-2 pt-2 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setIsConsultationModalOpen(false)}
                                className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-xs text-slate-600 hover:bg-slate-50"
                            >
                                انصراف
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    if (!consultationMessage.trim()) {
                                        toast.error("متن پیام نمی‌تواند خالی باشد.");
                                        return;
                                    }
                                    consultationMutation.mutate();
                                }}
                                disabled={consultationMutation.isPending}
                                className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-black text-xs hover:bg-blue-700 shadow-sm"
                            >
                                {consultationMutation.isPending ? "در حال ارسال..." : "ارسال مستقیم پیام"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Read Post Modal */}
            {readingPost && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-4 shadow-2xl border border-slate-100 my-8">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="text-base font-black text-slate-900">{readingPost.title}</h3>
                            <button
                                type="button"
                                onClick={() => setReadingPost(null)}
                                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center"
                            >
                                ✕
                            </button>
                        </div>

                        {readingPost.mediaUrls && readingPost.mediaUrls.length > 0 && (
                            <div className="h-60 w-full rounded-2xl overflow-hidden bg-slate-100">
                                <img src={readingPost.mediaUrls[0]} alt={readingPost.title} className="w-full h-full object-cover" />
                            </div>
                        )}

                        <div className="text-xs text-slate-400 flex items-center gap-3">
                            <span>منتشر شده در: {new Date(readingPost.createdAt).toLocaleDateString("fa-IR")}</span>
                            <span>بازدید: {readingPost.viewCount || 0}</span>
                        </div>

                        <div className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line py-2">
                            {readingPost.content}
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex justify-end">
                            <button
                                type="button"
                                onClick={() => setReadingPost(null)}
                                className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                            >
                                بستن
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
