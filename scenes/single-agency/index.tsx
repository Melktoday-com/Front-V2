"use client";

import { PropertyCard } from "@/components/ui/PropertyCard";
import { ReviewsSection } from "@/components/ui/ReviewsSection";
import { Select } from "@/components/ui/Select";
import { ErrorState } from "@/components/ui/StatusStates";
import { useAds } from "@/hooks/useAds";
import { useShowcaseListings } from "@/hooks/useShowcase";
import { useAgencyContact, useFollowAgency, useUnfollowAgency } from "@/hooks/useAgencies";
import { useAuth } from "@/hooks/useAuth";
import { useCreateConversation } from "@/hooks/useChat";
import { cn, formatPrice, toPersianDigits, getMediaUrl, getMediaPosterUrl } from "@/lib/utils";
import { agencyService } from "@/services/agency.service";
import { AgencyFull, AgencyPost } from "@/types/api/agency.types";
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
    Layers,
    List,
    Mail,
    MapPin,
    MessageCircle,
    MessageSquare,
    Phone,
    Play,
    Plus,
    Send,
    Share2,
    Sparkles,
    Star,
    Verified,
    X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSafeBack } from "@/hooks/useSafeBack";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
function getAgencyAdPricing(pricing?: any): { price: string | number; unit?: string } {
    if (!pricing || Object.keys(pricing).length === 0) {
        return { price: "توافقی" };
    }
    const values = pricing.values || pricing;
    const deposit = values.depositPrice ?? values.deposit;
    const rent = values.monthlyRent ?? values.monthly_rent;
    if (deposit !== undefined && rent !== undefined) {
        return {
            price: `رهن ${formatPrice(Number(deposit), "")} - اجاره ${formatPrice(Number(rent), "")}`,
            unit: "تومان",
        };
    }
    const total = values.totalPrice ?? values.price;
    if (total !== undefined) {
        const num = Number(total);
        return { price: num > 0 ? num : "توافقی", unit: num > 0 ? "تومان" : undefined };
    }
    if (deposit !== undefined) {
        const dep = Number(deposit);
        return { price: dep > 0 ? `ودیعه ${formatPrice(dep, "")}` : "توافقی", unit: dep > 0 ? "تومان" : undefined };
    }
    if (rent !== undefined) {
        const r = Number(rent);
        return { price: r > 0 ? `اجاره ${formatPrice(r, "")}` : "توافقی", unit: r > 0 ? "تومان" : undefined };
    }
    if (values.estimatedTotalPrice !== undefined) {
        const est = Number(values.estimatedTotalPrice);
        return { price: est > 0 ? `قیمت کل: ${formatPrice(est, "")}` : "توافقی", unit: est > 0 ? "تومان" : undefined };
    }
    if (values.goodwillPrice !== undefined) {
        const gw = Number(values.goodwillPrice);
        return { price: gw > 0 ? `سرقفلی: ${formatPrice(gw, "")}` : "توافقی", unit: gw > 0 ? "تومان" : undefined };
    }
    if (values.fractionPrice !== undefined) {
        const fp = Number(values.fractionPrice);
        return { price: fp > 0 ? `قدرالسهم: ${formatPrice(fp, "")}` : "توافقی", unit: fp > 0 ? "تومان" : undefined };
    }
    return { price: "توافقی" };
}

interface SingleAgencySceneProps {
    initialData?: AgencyFull;
}

export default function SingleAgencyScene({ initialData }: SingleAgencySceneProps = {}) {
    const params = useParams();
    const idOrSlug = (params?.idOrSlug || params?.id || initialData?.slug || initialData?.id) as string;
    const router = useRouter();
    const handleBack = useSafeBack("/");

    const [activeTab, setActiveTab] = useState<"listings" | "posts" | "about" | "reviews">("listings");
    const [viewMode, setViewMode] = useState<"grid" | "feed">("grid");
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
        initialData,
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

    // Ads / Listings query using official showcase listings endpoint
    const { data: adsResponse, isLoading: isLoadingAds } = useShowcaseListings(
        "agency",
        idOrSlug,
        { limit: 30 }
    );

    // Posts query
    const { data: postsData, isLoading: isLoadingPosts } = useQuery({
        queryKey: ["agency-public-posts", targetAgencyId],
        queryFn: () => agencyService.getPublicPosts(targetAgencyId),
        enabled: !!targetAgencyId,
    });

    const followMutation = useFollowAgency();
    const unfollowMutation = useUnfollowAgency();
    const chatMutation = useCreateConversation();

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
                    router.push(`/profile/chat?id=${conv.id}`);
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
                <div className="h-44 bg-surface-secondary rounded-3xl animate-pulse" />
                <div className="flex gap-4">
                    <div className="w-24 h-24 rounded-full bg-gray-200 animate-pulse -mt-12 mr-6" />
                    <div className="space-y-2 flex-1 pt-2">
                        <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse" />
                        <div className="h-4 bg-surface-secondary rounded w-1/2 animate-pulse" />
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
        <div className="max-w-4xl mx-auto px-3 sm:px-6 py-6 pb-24 lg:pb-10" dir="rtl">
            {/* Top Navigation */}
            <div className="flex items-center justify-between mb-4">
                <button
                    onClick={handleBack}
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
                    className="p-2 rounded-xl bg-surface-secondary text-brand hover:bg-gray-200 transition-colors"
                >
                    <Share2 className="w-4 h-4" />
                </button>
            </div>

            {/* Showcase Hero Section */}
            <section className="bg-surface rounded-3xl border border-border-subtle/80 shadow-xs overflow-hidden mb-6">
                {/* Cover Banner */}
                <div className="h-36 sm:h-52 w-full bg-gradient-to-r from-slate-800 via-blue-900 to-indigo-900 relative">
                    {agency.coverUrl && (
                        <img
                            src={getMediaUrl(agency.coverUrl)}
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
                            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl border-4 border-white shadow-md bg-surface overflow-hidden flex items-center justify-center font-black text-2xl text-brand">
                                {agency.logoUrl ? (
                                    <img
                                        src={getMediaUrl(agency.logoUrl)}
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
                                            ? "bg-surface-secondary text-foreground border border-border-subtle"
                                            : "bg-blue-600 text-white hover:bg-blue-700"
                                    )}
                                >
                                    {agency.isFollowing ? (
                                        <>
                                            <Check className="w-3.5 h-3.5 text-info" />
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
                                onClick={handleChat}
                                disabled={chatMutation.isPending}
                                className="flex-1 sm:flex-initial py-2.5 px-5 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-slate-800 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                            >
                                <MessageCircle className="w-4 h-4 text-blue-400" />
                                <span>{chatMutation.isPending ? "در حال اتصال به چت..." : "گفتگو و مشاوره آنلاین"}</span>
                            </button>
                        </div>
                    </div>

                    {/* Agency Title & Stats */}
                    <div className="space-y-3 text-center sm:text-right">
                        <div>
                            <div className="flex items-center justify-center sm:justify-start gap-2">
                                <h1 className="text-xl sm:text-2xl font-black text-foreground">
                                    {agency.agencyName || agency.name}
                                </h1>
                            </div>
                            {agency.slug && (
                                <span className="text-xs text-foreground-muted font-mono">@{agency.slug}</span>
                            )}
                        </div>

                        {/* Bio */}
                        {agency.bio && (
                            <p className="text-xs sm:text-sm text-foreground-secondary leading-relaxed max-w-2xl">
                                {agency.bio}
                            </p>
                        )}

                        {/* Counters Row */}
                        <div className="flex items-center justify-center sm:justify-start gap-6 border-y border-border-subtle py-3 text-center">
                            <div>
                                <span className="text-base sm:text-lg font-black text-foreground block">
                                    {toPersianDigits(ads.length)}
                                </span>
                                <span className="text-xs text-foreground-muted">آگهی‌های ملکی</span>
                            </div>
                            <div className="w-px h-6 bg-slate-200" />
                            <div>
                                <span className="text-base sm:text-lg font-black text-foreground block">
                                    {toPersianDigits(posts.length)}
                                </span>
                                <span className="text-xs text-foreground-muted">پست‌ها و مقالات</span>
                            </div>
                            <div className="w-px h-6 bg-slate-200" />
                            <div>
                                <span className="text-base sm:text-lg font-black text-foreground block">
                                    {toPersianDigits(followerCount)}
                                </span>
                                <span className="text-xs text-foreground-muted">دنبال‌کننده</span>
                            </div>
                            <div className="w-px h-6 bg-slate-200" />
                            <div>
                                <span className="text-base sm:text-lg font-black text-foreground block flex items-center justify-center gap-1">
                                    {agency.rating != null && !isNaN(Number(agency.rating)) && Number(agency.rating) > 0 ? (
                                        <>
                                            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                                            {toPersianDigits(Number(agency.rating).toFixed(1))}
                                        </>
                                    ) : (
                                        <span />
                                    )}
                                </span>
                                <span className="text-xs text-foreground-muted">امتیاز</span>
                            </div>
                        </div>

                        {/* Contact Badges */}
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-1 text-xs">
                            {contactData ? (
                                <>
                                    {contactData.mobile && (
                                        <a
                                            href={`tel:${contactData.mobile}`}
                                            className="inline-flex items-center gap-1.5 text-foreground font-bold bg-surface-secondary hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors border border-border-subtle/60"
                                        >
                                            <Phone className="w-3.5 h-3.5 text-info" />
                                            <span dir="ltr">{contactData.mobile}</span>
                                        </a>
                                    )}
                                    {contactData.phone && (
                                        <a
                                            href={`tel:${contactData.phone}`}
                                            className="inline-flex items-center gap-1.5 text-foreground font-bold bg-surface-secondary hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors border border-border-subtle/60"
                                        >
                                            <Phone className="w-3.5 h-3.5 text-foreground-muted" />
                                            <span dir="ltr">{contactData.phone}</span>
                                        </a>
                                    )}
                                    {!contactData.mobile && !contactData.phone && (
                                        <span className="inline-flex items-center gap-1 text-foreground-muted bg-surface-secondary px-3 py-1.5 rounded-lg font-medium">
                                            شماره تماسی ثبت نشده است
                                        </span>
                                    )}
                                </>
                            ) : isLoadingContact ? (
                                <div className="inline-flex items-center gap-2 text-foreground-secondary bg-surface-secondary px-3.5 py-1.5 rounded-lg animate-pulse font-medium border border-border-subtle/60">
                                    <Phone className="w-3.5 h-3.5 text-info animate-spin" />
                                    <span>در حال دریافت اطلاعات تماس...</span>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleRevealContact}
                                    className="inline-flex items-center gap-1.5 text-info font-bold bg-info-subtle hover:bg-info-subtle border border-info/30 px-3.5 py-1.5 rounded-lg transition-all shadow-sm active:scale-95 cursor-pointer"
                                >
                                    <Phone className="w-3.5 h-3.5 text-info" />
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
                                    className="inline-flex items-center gap-1 text-info font-bold bg-info-subtle hover:bg-info-subtle px-3 py-1.5 rounded-lg transition-colors"
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
            <div className="flex items-center justify-between border-b border-border-subtle mb-6">
                <div className="flex gap-4 sm:gap-8">
                    <button
                        onClick={() => setActiveTab("listings")}
                        className={cn(
                            "pb-3 font-bold text-xs sm:text-sm border-b-2 transition-colors",
                            activeTab === "listings"
                                ? "border-blue-600 text-info font-black"
                                : "border-transparent text-foreground-muted hover:text-foreground"
                        )}
                    >
                        آگهی‌های ملکی ({toPersianDigits(ads.length)})
                    </button>

                    <button
                        onClick={() => setActiveTab("posts")}
                        className={cn(
                            "pb-3 font-bold text-xs sm:text-sm border-b-2 transition-colors",
                            activeTab === "posts"
                                ? "border-blue-600 text-info font-black"
                                : "border-transparent text-foreground-muted hover:text-foreground"
                        )}
                    >
                        پست‌ها و مقالات ({toPersianDigits(posts.length)})
                    </button>

                    <button
                        onClick={() => setActiveTab("about")}
                        className={cn(
                            "pb-3 font-bold text-xs sm:text-sm border-b-2 transition-colors",
                            activeTab === "about"
                                ? "border-blue-600 text-info font-black"
                                : "border-transparent text-foreground-muted hover:text-foreground"
                        )}
                    >
                        مشخصات و آدرس
                    </button>

                    <button
                        onClick={() => setActiveTab("reviews")}
                        className={cn(
                            "pb-3 font-bold text-xs sm:text-sm border-b-2 transition-colors",
                            activeTab === "reviews"
                                ? "border-blue-600 text-info font-black"
                                : "border-transparent text-foreground-muted hover:text-foreground"
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
                                <div key={i} className="aspect-[4/3] bg-surface-secondary animate-pulse rounded-2xl" />
                            ))}
                        </div>
                    ) : ads.length === 0 ? (
                        <div className="py-20 text-center bg-surface rounded-3xl border border-dashed border-border-subtle">
                            <p className="text-foreground-muted font-bold text-sm">در حال حاضر آگهی فعالی از این صفحه ثبت نشده است.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {ads.map((ad: any) => {
                                const adPrice = getAgencyAdPricing(ad.pricing);
                                const adId = ad.adId || ad.id;
                                const mediaList = ad.mediaIds || ad.media_ids || [];
                                const firstMedia = mediaList[0];
                                const categoryName =
                                    ad.subcategoryTitle ||
                                    ad.categoryPath?.subcategoryTitle ||
                                    ad.categoryPath?.subcategoryKey ||
                                    ad.category_path?.subcategoryKey;
                                return (
                                    <PropertyCard
                                        key={adId}
                                        id={adId}
                                        adId={adId}
                                        title={ad.title}
                                        price={adPrice.price}
                                        unit={adPrice.unit}
                                        location={ad.cityName || ad.cityId || ad.city_id}
                                        image={getMediaPosterUrl(firstMedia)}
                                        isVideo={firstMedia?.type === "VIDEO"}
                                        category={categoryName}
                                        badgeName={ad.isFeatured || ad.is_featured ? "ویژه" : undefined}
                                        isUrgent={ad.isUrgent}
                                        isLadder={ad.isLadder}
                                    />
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* TAB 2: POSTS (INSTAGRAM-STYLE SHOWCASE) */}
            {activeTab === "posts" && (
                <div className="space-y-4">
                    {/* Creator Studio Quick Access for Agency Owner */}
                    {user?.userId && agency?.ownerUserId === user.userId && (
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-gradient-to-l from-purple-50 via-indigo-50 to-blue-50 border border-purple-200/80 rounded-2xl shadow-xs">
                            <div className="space-y-0.5">
                                <h4 className="text-xs font-black text-purple-950 flex items-center gap-1.5">
                                    <Sparkles className="w-4 h-4 text-purple-600" />
                                    <span>استودیو و مدیریت محتوای ویترین</span>
                                </h4>
                                <p className="text-[11px] text-purple-800 font-medium">
                                    شما مدیر این ویترین هستید. پست‌های اسلایدی جدید بسازید یا محتوای فعلی را مدیریت کنید.
                                </p>
                            </div>
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <Link
                                    href="/posts/create"
                                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black transition-all shadow-xs active:scale-95"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>پست جدید</span>
                                </Link>
                                <Link
                                    href="/agency/panel#section-posts"
                                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-surface hover:bg-slate-100 text-purple-950 border border-purple-300 rounded-xl text-xs font-bold transition-all"
                                >
                                    <BookOpen className="w-3.5 h-3.5 text-purple-600" />
                                    <span>مدیریت پست‌ها</span>
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* View Mode Switcher Header */}
                    <div className="flex items-center justify-between py-1">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-foreground">
                                محتوای منتشر شده
                            </span>
                            <span className="text-xs text-foreground-muted bg-surface-secondary px-2 py-0.5 rounded-full font-bold">
                                {toPersianDigits(posts.length)}
                            </span>
                        </div>

                        {/* Instagram-style View Switcher */}
                        <div className="inline-flex items-center p-1 bg-surface-secondary border border-border-subtle rounded-xl gap-1">
                            <button
                                type="button"
                                onClick={() => setViewMode("grid")}
                                className={cn(
                                    "p-1.5 rounded-lg text-xs transition-all flex items-center gap-1 cursor-pointer",
                                    viewMode === "grid"
                                        ? "bg-surface text-info shadow-xs font-black"
                                        : "text-foreground-muted hover:text-foreground"
                                )}
                                title="نمایش شبکه‌ای (اینستاگرام)"
                            >
                                <Grid className="w-4 h-4" />
                                <span className="hidden sm:inline text-[11px]">شبکه‌ای</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode("feed")}
                                className={cn(
                                    "p-1.5 rounded-lg text-xs transition-all flex items-center gap-1 cursor-pointer",
                                    viewMode === "feed"
                                        ? "bg-surface text-info shadow-xs font-black"
                                        : "text-foreground-muted hover:text-foreground"
                                )}
                                title="نمایش فید (کارت‌ها)"
                            >
                                <List className="w-4 h-4" />
                                <span className="hidden sm:inline text-[11px]">فید</span>
                            </button>
                        </div>
                    </div>

                    {isLoadingPosts ? (
                        viewMode === "grid" ? (
                            <div className="grid grid-cols-3 gap-1.5 sm:gap-3 lg:gap-4">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <div key={i} className="aspect-square bg-surface-secondary animate-pulse rounded-xl sm:rounded-2xl" />
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <div key={i} className="h-44 bg-surface-secondary animate-pulse rounded-2xl" />
                                ))}
                            </div>
                        )
                    ) : posts.length === 0 ? (
                        <div className="py-20 text-center bg-surface rounded-3xl border border-dashed border-border-subtle space-y-3">
                            <div className="w-14 h-14 mx-auto rounded-2xl bg-surface-secondary flex items-center justify-center text-foreground-muted">
                                <Grid className="w-7 h-7" />
                            </div>
                            <h4 className="text-sm font-black text-foreground">هنوز پستی در این صفحه منتشر نشده است</h4>
                            <p className="text-xs text-foreground-muted max-w-sm mx-auto leading-relaxed">
                                تمام پست‌ها، مقالات و تحلیل‌های بازار ثبت شده توسط این صفحه در این بخش نمایش داده می‌شوند.
                            </p>
                            {user?.userId && agency?.ownerUserId === user.userId && (
                                <Link
                                    href="/posts/create"
                                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black transition-colors shadow-xs"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>اولین پست خود را بسازید</span>
                                </Link>
                            )}
                        </div>
                    ) : viewMode === "grid" ? (
                        /* Instagram 3-Column Square Grid */
                        <div className="grid grid-cols-3 gap-1.5 sm:gap-3 lg:gap-4">
                            {posts.map((post: AgencyPost) => {
                                const firstMedia = post.mediaIds?.[0];
                                const hasMultipleMedia = (post.mediaIds?.length || 0) > 1;
                                const isVideo = firstMedia?.type === "VIDEO";
                                const postUrl = `/posts/${encodeURIComponent(post.slug || post.id)}`;

                                return (
                                    <Link
                                        key={post.id}
                                        href={postUrl}
                                        className="group relative aspect-square rounded-xl sm:rounded-2xl overflow-hidden bg-surface-secondary block focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                                    >
                                        {/* Cover Image or Fallback */}
                                        {firstMedia ? (
                                            <img
                                                src={getMediaPosterUrl(firstMedia)}
                                                alt={post.title}
                                                className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                                                loading="lazy"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-slate-800 via-slate-900 to-indigo-950 p-2 sm:p-3 flex flex-col justify-between text-white">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-bold text-white/70">
                                                        {post.category || "مقاله ملکی"}
                                                    </span>
                                                    <BookOpen className="w-3.5 h-3.5 text-white/60" />
                                                </div>
                                                <p className="text-[11px] sm:text-xs font-bold line-clamp-3 text-white/95 leading-snug">
                                                    {post.title}
                                                </p>
                                                <span className="text-[9px] text-white/50">ملک‌تودی</span>
                                            </div>
                                        )}

                                        {/* Instagram Media Badges */}
                                        <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 z-10 pointer-events-none">
                                            {hasMultipleMedia ? (
                                                <span className="p-1 sm:p-1.5 rounded-lg bg-black/60 text-white backdrop-blur-xs shadow-xs inline-flex items-center justify-center">
                                                    <Layers className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                                </span>
                                            ) : isVideo ? (
                                                <span className="p-1 sm:p-1.5 rounded-lg bg-black/60 text-white backdrop-blur-xs shadow-xs inline-flex items-center justify-center">
                                                    <Play className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-white" />
                                                </span>
                                            ) : null}
                                        </div>

                                        {/* Instagram Hover / Active Overlay */}
                                        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-2 sm:p-3.5 text-white z-10 pointer-events-none">
                                            {/* Top: Category Tag */}
                                            <div className="flex items-center justify-end">
                                                {post.category && (
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-white max-w-[90%] truncate">
                                                        {post.category}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Center: Heart and Eye metrics */}
                                            <div className="flex items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm font-black">
                                                <span className="flex items-center gap-1 sm:gap-1.5 drop-shadow-sm">
                                                    <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-white text-white" />
                                                    <span>{toPersianDigits(post.likeCount || 0)}</span>
                                                </span>
                                                <span className="flex items-center gap-1 sm:gap-1.5 drop-shadow-sm">
                                                    <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                                                    <span>{toPersianDigits(post.viewCount || 0)}</span>
                                                </span>
                                            </div>

                                            {/* Bottom: Title */}
                                            <p className="text-[10px] sm:text-xs font-bold line-clamp-2 leading-tight drop-shadow-sm text-right text-white/95">
                                                {post.title}
                                            </p>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    ) : (
                        /* Feed View (Card Stream) */
                        <div className="space-y-4">
                            {posts.map((post: AgencyPost) => {
                                const firstMedia = post.mediaIds?.[0];
                                const postUrl = `/posts/${encodeURIComponent(post.slug || post.id)}`;

                                return (
                                    <Link
                                        key={post.id}
                                        href={postUrl}
                                        className="bg-surface p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-border-subtle/80 shadow-xs hover:border-blue-400 hover:shadow-md transition-all flex flex-col sm:flex-row gap-4 group block"
                                    >
                                        {firstMedia && (
                                            <div className="h-44 sm:h-36 sm:w-48 rounded-xl sm:rounded-2xl overflow-hidden bg-surface-secondary shrink-0 relative">
                                                <img
                                                    src={getMediaPosterUrl(firstMedia)}
                                                    alt={post.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                    loading="lazy"
                                                />
                                                {firstMedia.type === "VIDEO" && (
                                                    <span className="absolute top-2 left-2 p-1.5 rounded-lg bg-black/60 text-white backdrop-blur-xs">
                                                        <Play className="w-3.5 h-3.5 fill-white" />
                                                    </span>
                                                )}
                                                {(post.mediaIds?.length || 0) > 1 && (
                                                    <span className="absolute top-2 left-2 p-1.5 rounded-lg bg-black/60 text-white backdrop-blur-xs">
                                                        <Layers className="w-3.5 h-3.5" />
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        <div className="flex-1 flex flex-col justify-between space-y-2">
                                            <div className="space-y-1.5">
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-[11px] font-bold text-info bg-info-subtle px-2 py-0.5 rounded-full">
                                                        {post.category || "پست ملکی"}
                                                    </span>
                                                    <span className="text-foreground-muted text-[11px]">
                                                        {new Date(post.createdAt).toLocaleDateString("fa-IR")}
                                                    </span>
                                                </div>

                                                <h3 className="text-sm sm:text-base font-black text-foreground group-hover:text-info transition-colors line-clamp-2">
                                                    {post.title}
                                                </h3>

                                                {(post.summary || post.content) && (
                                                    <p className="text-xs text-foreground-muted line-clamp-2 leading-relaxed">
                                                        {post.summary || post.content.slice(0, 120)}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="flex items-center justify-between text-xs text-foreground-muted pt-2 border-t border-border-subtle">
                                                <div className="flex items-center gap-4">
                                                    <span className="flex items-center gap-1">
                                                        <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500/20" />
                                                        <span>{toPersianDigits(post.likeCount || 0)} پسند</span>
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Eye className="w-3.5 h-3.5" />
                                                        <span>{toPersianDigits(post.viewCount || 0)} بازدید</span>
                                                    </span>
                                                </div>
                                                <span className="text-info font-bold group-hover:translate-x-[-2px] transition-transform inline-flex items-center gap-1">
                                                    <span>مطالعه کامل</span>
                                                    <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* TAB 3: ABOUT */}
            {activeTab === "about" && (
                <div className="bg-surface p-6 sm:p-8 rounded-3xl border border-border-subtle/80 shadow-xs space-y-6">
                    <h3 className="text-base font-black text-foreground">مشخصات صنفی و اطلاعات تماس</h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        {agency.guildCode && (
                            <div className="p-4 bg-surface-secondary rounded-2xl space-y-1">
                                <span className="text-foreground-muted font-bold block">شناسه صنفی اصناف:</span>
                                <span className="font-mono font-bold text-foreground text-sm">{agency.guildCode}</span>
                            </div>
                        )}
                        {agency.licenseNumber && (
                            <div className="p-4 bg-surface-secondary rounded-2xl space-y-1">
                                <span className="text-foreground-muted font-bold block">شماره پروانه کسب:</span>
                                <span className="font-mono font-bold text-foreground text-sm">{agency.licenseNumber}</span>
                            </div>
                        )}
                        {agency.workingHours && (
                            <div className="p-4 bg-surface-secondary rounded-2xl space-y-1 sm:col-span-2">
                                <span className="text-foreground-muted font-bold block">ساعات کاری:</span>
                                <span className="font-bold text-foreground">{agency.workingHours}</span>
                            </div>
                        )}
                        {agency.address && (
                            <div className="p-4 bg-surface-secondary rounded-2xl space-y-1 sm:col-span-2">
                                <span className="text-foreground-muted font-bold block">آدرس رسمی:</span>
                                <span className="font-medium text-foreground leading-relaxed">{agency.address}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB 4: REVIEWS */}
            {activeTab === "reviews" && (
                <div className="bg-surface p-6 rounded-3xl border border-border-subtle/80 shadow-xs">
                    <ReviewsSection targetId={targetAgencyId} targetType="agency" />
                </div>
            )}
        </div>
    );
}
