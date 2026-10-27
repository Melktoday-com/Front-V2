"use client";

import { PropertyCard } from "@/components/ui/PropertyCard";
import { ReviewsSection } from "@/components/ui/ReviewsSection";
import { Select } from "@/components/ui/Select";
import { ErrorState } from "@/components/ui/StatusStates";
import { useAds } from "@/hooks/useAds";
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
    List,
    Mail,
    MapPin,
    MessageCircle,
    MessageSquare,
    Phone,
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
import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";
function getAgencyAdPricing(pricing?: Record<string, number | boolean | string> | null): { price: string | number; unit?: string } {
    if (!pricing || Object.keys(pricing).length === 0) {
        return { price: "توافقی" };
    }
    if (pricing.depositPrice !== undefined && pricing.monthlyRent !== undefined) {
        return {
            price: `رهن ${formatPrice(Number(pricing.depositPrice), "")} - اجاره ${formatPrice(Number(pricing.monthlyRent), "")}`,
            unit: "تومان",
        };
    }
    if (pricing.totalPrice !== undefined) {
        const total = Number(pricing.totalPrice);
        return { price: total > 0 ? total : "توافقی", unit: total > 0 ? "تومان" : undefined };
    }
    if (pricing.depositPrice !== undefined) {
        const dep = Number(pricing.depositPrice);
        return { price: dep > 0 ? `ودیعه ${formatPrice(dep, "")}` : "توافقی", unit: dep > 0 ? "تومان" : undefined };
    }
    if (pricing.monthlyRent !== undefined) {
        const rent = Number(pricing.monthlyRent);
        return { price: rent > 0 ? `اجاره ${formatPrice(rent, "")}` : "توافقی", unit: rent > 0 ? "تومان" : undefined };
    }
    if (pricing.estimatedTotalPrice !== undefined) {
        const est = Number(pricing.estimatedTotalPrice);
        return { price: est > 0 ? `قیمت کل: ${formatPrice(est, "")}` : "توافقی", unit: est > 0 ? "تومان" : undefined };
    }
    if (pricing.goodwillPrice !== undefined) {
        const gw = Number(pricing.goodwillPrice);
        return { price: gw > 0 ? `سرقفلی: ${formatPrice(gw, "")}` : "توافقی", unit: gw > 0 ? "تومان" : undefined };
    }
    if (pricing.fractionPrice !== undefined) {
        const fp = Number(pricing.fractionPrice);
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
    const [viewMode, setViewMode] = useState<"grid" | "feed">("feed");

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
                            {ads.map((ad) => {
                                const adPrice = getAgencyAdPricing(ad.pricing);
                                return (
                                    <PropertyCard
                                        key={ad.adId}
                                        adId={ad.adId}
                                        title={ad.title}
                                        price={adPrice.price}
                                        unit={adPrice.unit}
                                        location={ad.cityName || ad.cityId}
                                        image={getMediaPosterUrl(ad.mediaIds?.[0])}
                                        isVideo={ad.mediaIds?.[0]?.type === "VIDEO"}
                                        category={ad.subcategoryTitle || ad.categoryPath?.subcategoryTitle || ad.categoryPath?.subcategoryKey}
                                        badgeName={ad.isFeatured ? "ویژه" : undefined}
                                        isUrgent={ad.isUrgent}
                                        isLadder={ad.isLadder}
                                    />
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* TAB 2: POSTS */}
            {activeTab === "posts" && (
                <div className="space-y-4">
                    {user?.userId && agency?.ownerUserId === user.userId && (
                        <div className="flex items-center justify-between p-4 bg-gradient-to-l from-purple-50 to-indigo-50 border border-purple-200/80 rounded-2xl shadow-xs">
                            <div className="space-y-0.5">
                                <h4 className="text-xs font-black text-purple-900 flex items-center gap-1.5">
                                    <BookOpen className="w-4 h-4 text-purple-600" />
                                    <span>استودیو تولید و انتشار محتوا</span>
                                </h4>
                                <p className="text-[11px] text-purple-700 font-medium">
                                    پست‌های اسلایدی جدید یا مقالات تحلیلی را برای ویترین خود منتشر کنید.
                                </p>
                            </div>
                            <Link
                                href="/posts/create"
                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black transition-colors shrink-0 shadow-xs"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span>ایجاد پست جدید</span>
                            </Link>
                        </div>
                    )}

                    {isLoadingPosts ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="h-44 bg-surface-secondary animate-pulse rounded-3xl" />
                            ))}
                        </div>
                    ) : posts.length === 0 ? (
                        <div className="py-20 text-center bg-surface rounded-3xl border border-dashed border-border-subtle space-y-3">
                            <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
                            <p className="text-foreground-muted font-bold text-sm">هنوز پستی در این صفحه منتشر نشده است.</p>
                            {user?.userId && agency?.ownerUserId === user.userId && (
                                <Link
                                    href="/posts/create"
                                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black transition-colors"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>اولین پست خود را بسازید</span>
                                </Link>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {posts.map((post: AgencyPost) => (
                                <div
                                    key={post.id}
                                    onClick={() => setReadingPost(post)}
                                    className="bg-surface p-5 rounded-3xl border border-border-subtle/80 shadow-xs hover:border-blue-400 transition-all cursor-pointer flex flex-col justify-between space-y-3 group"
                                >
                                    {(() => {
                                        const firstMedia = post.mediaIds?.[0];
                                        if (!firstMedia) return null;
                                        return (
                                            <div className="h-40 w-full rounded-2xl overflow-hidden bg-surface-secondary">
                                                <img
                                                    src={getMediaPosterUrl(firstMedia)}
                                                    alt={post.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                            </div>
                                        );
                                    })()}

                                    <div className="space-y-1.5">
                                        <h3 className="text-sm font-black text-foreground group-hover:text-info transition-colors">
                                            {post.title}
                                        </h3>
                                        {(post.summary || post.content) && (
                                            <p className="text-xs text-foreground-muted line-clamp-2 leading-relaxed">
                                                {post.summary || post.content.slice(0, 100)}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between text-xs text-foreground-muted pt-2 border-t border-border-subtle">
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

            {/* Read Post Modal */}
            {readingPost && (
                <div role="dialog" aria-modal="true" aria-label="مشاهده پست" className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-surface rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-4 shadow-2xl border border-border-subtle my-8">
                        <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                            <h3 className="text-base font-black text-foreground">{readingPost.title}</h3>
                            <button
                                type="button"
                                onClick={() => setReadingPost(null)}
                                className="w-8 h-8 rounded-full bg-surface-secondary text-foreground-muted hover:bg-slate-200 flex items-center justify-center"
                            >
                                ✕
                            </button>
                        </div>

                        {(() => {
                            const firstMedia = readingPost.mediaIds?.[0];
                            if (!firstMedia) return null;
                            const isVideo = firstMedia.type === "VIDEO";
                            if (isVideo) {
                                return (
                                    <div className="h-60 w-full rounded-2xl overflow-hidden bg-slate-950">
                                        <video
                                            src={getMediaUrl(firstMedia)}
                                            poster={getMediaPosterUrl(firstMedia)}
                                            controls
                                            playsInline
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                );
                            }
                            return (
                                <div className="h-60 w-full rounded-2xl overflow-hidden bg-surface-secondary">
                                    <img src={getMediaUrl(firstMedia)} alt={readingPost.title} className="w-full h-full object-cover" />
                                </div>
                            );
                        })()}

                        <div className="text-xs text-foreground-muted flex items-center gap-3">
                            <span>منتشر شده در: {new Date(readingPost.createdAt).toLocaleDateString("fa-IR")}</span>
                            <span>بازدید: {readingPost.viewCount || 0}</span>
                        </div>

                        <div className="pt-2">
                            <MarkdownRenderer content={readingPost.content} />
                        </div>

                        <div className="pt-3 border-t border-border-subtle flex items-center justify-between">
                            <Link
                                href={`/posts/${encodeURIComponent(readingPost.slug || readingPost.id)}`}
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-info hover:text-blue-700"
                            >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>مشاهده در صفحه اختصاصی</span>
                            </Link>

                            <button
                                type="button"
                                onClick={() => setReadingPost(null)}
                                className="px-5 py-2 rounded-xl bg-surface-secondary hover:bg-slate-200 text-foreground-secondary text-xs font-bold"
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
