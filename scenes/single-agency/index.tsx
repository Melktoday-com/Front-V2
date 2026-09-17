"use client";

import { PropertyCard } from "@/components/ui/PropertyCard";
import { ReviewsSection } from "@/components/ui/ReviewsSection";
import { Select } from "@/components/ui/Select";
import { ErrorState } from "@/components/ui/StatusStates";
import { useAds } from "@/hooks/useAds";
import { useAgency, useFollowAgency, useUnfollowAgency } from "@/hooks/useAgencies";
import { useAuth } from "@/hooks/useAuth";
import { useCreateConversation } from "@/hooks/useChat";
import { cn, formatPrice, toPersianDigits } from "@/lib/utils";
import { agencyService } from "@/services/agency.service";
import { useMutation } from "@tanstack/react-query";
import {
    Building,
    Check,
    ChevronRight,
    Globe,
    Grid,
    Heart,
    List,
    Mail,
    MapPin,
    MessageCircle,
    MessageSquare,
    Phone,
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
    const { id } = useParams() as { id: string };
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<"listings" | "reviews">("listings");
    const [viewMode, setViewMode] = useState<"grid" | "feed">("feed");
    const [isConsultationModalOpen, setIsConsultationModalOpen] = useState(false);
    const [consultationSubject, setConsultationSubject] = useState("مشاوره عمومی ملک");
    const [consultationMessage, setConsultationMessage] = useState("");
    const [contactMethod, setContactMethod] = useState<"phone" | "chat">("phone");

    const { isLoggedIn } = useAuth();
    const {
        data: agency,
        isLoading: isLoadingAgency,
        error: agencyError,
        refetch: refetchAgency,
    } = useAgency(id);

    const { data: adsResponse, isLoading: isLoadingAds } = useAds({
        ownerId: id,
        limit: 30,
    });

    const followMutation = useFollowAgency();
    const unfollowMutation = useUnfollowAgency();
    const chatMutation = useCreateConversation();

    const consultationMutation = useMutation({
        mutationFn: () =>
            agencyService.requestConsultation(id, {
                subject: consultationSubject,
                message: consultationMessage,
                preferredContactMethod: contactMethod,
            }),
        onSuccess: () => {
            toast.success("درخواست مشاوره شما با موفقیت ثبت شد و به مشاورین آژانس ارجاع داده شد.");
            setIsConsultationModalOpen(false);
            setConsultationMessage("");
        },
        onError: () => {
            toast.error("خطا در ارسال درخواست مشاوره");
        },
    });

    const handleFollow = () => {
        if (!isLoggedIn) {
            router.push("/auth");
            return;
        }
        if (agency?.isFollowing) {
            unfollowMutation.mutate(id);
        } else {
            followMutation.mutate(id);
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
                subjectId: id,
            },
            {
                onSuccess: (res) => {
                    const convId = (res as any)?.conversationId || (res as any)?.id;
                    if (convId) {
                        router.push(`/profile/chat?id=${convId}`);
                    } else {
                        router.push("/profile/chat");
                    }
                },
                onError: () => {
                    toast.error("خطا در ایجاد مکالمه با آژانس");
                },
            }
        );
    };

    const handleShare = () => {
        if (typeof navigator !== "undefined" && navigator.share) {
            navigator.share({
                title: agency?.name,
                url: window.location.href,
            }).catch(() => {});
        } else if (typeof navigator !== "undefined" && navigator.clipboard) {
            navigator.clipboard.writeText(window.location.href);
            toast.success("لینک آژانس کپی شد");
        }
    };

    if (isLoadingAgency) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-text-light font-bold text-sm">در حال دریافت اطلاعات آژانس...</p>
            </div>
        );
    }

    if (agencyError || !agency) {
        return (
            <div className="p-6 text-center py-20">
                <ErrorState message="آژانس مورد نظر یافت نشد" onRetry={() => refetchAgency()} />
            </div>
        );
    }

    const ads = adsResponse?.items || [];
    const followerCount = agency.followerCount ?? 0;

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-28">
            {/* Navigation Bar */}
            <div className="flex items-center justify-between mb-6">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-1 text-xs font-bold text-text-light hover:text-brand transition-colors"
                >
                    <ChevronRight className="w-5 h-5" />
                    <span>بازگشت</span>
                </button>
                <h1 className="text-sm font-black text-brand">پروفایل آژانس املاک</h1>
                <button
                    onClick={handleShare}
                    className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-text-main transition-colors"
                    title="اشتراک‌گذاری"
                >
                    <Share2 className="w-4 h-4" />
                </button>
            </div>

            {/* Instagram Profile Header */}
            <section className="bg-white rounded-3xl border border-gray-100 p-6 shadow-xs mb-6">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                    {/* Avatar with Circular Ring */}
                    <div className="relative shrink-0">
                        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full p-1 ring-2 ring-primary/40 overflow-hidden bg-gray-50 relative">
                            <Image
                                src={agency.logoUrl || "/agency-placeholder.png"}
                                alt={agency.name}
                                fill
                                priority
                                className="object-cover rounded-full"
                            />
                        </div>
                    </div>

                    {/* Agency Info & Stats */}
                    <div className="flex-1 text-center sm:text-right">
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
                            <h2 className="text-xl sm:text-2xl font-black text-brand">{agency.name}</h2>
                            {agency.isVerified && (
                                <span title="تایید شده">
                                    <Verified className="w-5 h-5 text-primary fill-primary/15" />
                                </span>
                            )}
                        </div>

                        {/* 3 Horizontal Instagram Counters */}
                        <div className="flex items-center justify-center sm:justify-start gap-6 my-4 border-y border-gray-100 py-3 text-center">
                            <div>
                                <span className="text-base sm:text-lg font-black text-brand block">
                                    {toPersianDigits(ads.length)}
                                </span>
                                <span className="text-xs text-text-light">آگهی‌ها</span>
                            </div>
                            <div className="w-px h-6 bg-gray-200" />
                            <div>
                                <span className="text-base sm:text-lg font-black text-brand block">
                                    {toPersianDigits(followerCount)}
                                </span>
                                <span className="text-xs text-text-light">دنبال‌کننده</span>
                            </div>
                            <div className="w-px h-6 bg-gray-200" />
                            <div>
                                <span className="text-base sm:text-lg font-black text-brand block flex items-center justify-center gap-1">
                                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                                    {toPersianDigits(agency.rating?.toFixed(1) || "5.0")}
                                </span>
                                <span className="text-xs text-text-light">امتیاز</span>
                            </div>
                        </div>

                        {/* Bio & Details */}
                        {agency.bio && (
                            <p className="text-xs sm:text-sm text-text-main leading-relaxed mb-3 max-w-xl">
                                {agency.bio}
                            </p>
                        )}

                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-text-light">
                            {agency.phone && (
                                <a
                                    href={`tel:${agency.phone}`}
                                    className="flex items-center gap-1 text-brand font-bold hover:text-primary transition-colors"
                                >
                                    <Phone className="w-3.5 h-3.5 text-primary" />
                                    <span dir="ltr">{toPersianDigits(agency.phone)}</span>
                                </a>
                            )}
                            {agency.website && (
                                <a
                                    href={agency.website.startsWith("http") ? agency.website : `https://${agency.website}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-1 text-primary font-bold hover:underline"
                                >
                                    <Globe className="w-3.5 h-3.5" />
                                    <span>وب‌سایت آژانس</span>
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                {/* Instagram Action Row */}
                <div className="flex flex-wrap items-center gap-2.5 mt-6 pt-5 border-t border-gray-100">
                    <button
                        onClick={handleFollow}
                        disabled={followMutation.isPending || unfollowMutation.isPending}
                        className={cn(
                            "flex-1 py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95",
                            agency.isFollowing
                                ? "bg-gray-100 text-brand border border-gray-200"
                                : "bg-primary text-white shadow-md shadow-primary/20 hover:bg-primary/90"
                        )}
                    >
                        {agency.isFollowing ? (
                            <>
                                <Check className="w-4 h-4 text-primary" />
                                <span>دنبال می‌کنید</span>
                            </>
                        ) : (
                            <>
                                <Heart className="w-4 h-4" />
                                <span>دنبال کردن</span>
                            </>
                        )}
                    </button>

                    <button
                        onClick={() => setIsConsultationModalOpen(true)}
                        className="flex-1 py-2.5 px-4 rounded-xl bg-brand text-white font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-brand/90 transition-all active:scale-95 shadow-md shadow-brand/20"
                    >
                        <MessageSquare className="w-4 h-4 text-primary" />
                        <span>درخواست مشاوره</span>
                    </button>

                    <button
                        onClick={handleChat}
                        disabled={chatMutation.isPending}
                        className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-brand hover:bg-gray-100 transition-colors"
                        title="ارسال پیام آنلاین"
                    >
                        <MessageCircle className="w-4 h-4" />
                    </button>
                </div>
            </section>

            {/* Tabs & View Mode Selector */}
            <div className="flex items-center justify-between border-b border-gray-200 mb-6">
                <div className="flex gap-6">
                    <button
                        onClick={() => setActiveTab("listings")}
                        className={cn(
                            "pb-3 font-bold text-xs sm:text-sm border-b-2 transition-colors",
                            activeTab === "listings"
                                ? "border-brand text-brand font-black"
                                : "border-transparent text-text-light hover:text-brand"
                        )}
                    >
                        آگهی‌های فعال ({toPersianDigits(ads.length)})
                    </button>
                    <button
                        onClick={() => setActiveTab("reviews")}
                        className={cn(
                            "pb-3 font-bold text-xs sm:text-sm border-b-2 transition-colors",
                            activeTab === "reviews"
                                ? "border-brand text-brand font-black"
                                : "border-transparent text-text-light hover:text-brand"
                        )}
                    >
                        نظرات و امتیازها
                    </button>
                </div>

                {activeTab === "listings" && (
                    <div className="flex items-center gap-1 pb-2">
                        <button
                            onClick={() => setViewMode("feed")}
                            className={cn(
                                "p-1.5 rounded-lg transition-colors",
                                viewMode === "feed" ? "bg-gray-200 text-brand" : "text-gray-400 hover:text-brand"
                            )}
                            title="نمایش لیستی"
                        >
                            <List className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode("grid")}
                            className={cn(
                                "p-1.5 rounded-lg transition-colors",
                                viewMode === "grid" ? "bg-gray-200 text-brand" : "text-gray-400 hover:text-brand"
                            )}
                            title="نمایش مربعی اینستاگرام"
                        >
                            <Grid className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>

            {/* Listings Tab */}
            {activeTab === "listings" && (
                <div>
                    {isLoadingAds ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="aspect-[4/3] bg-gray-100 animate-pulse rounded-2xl" />
                            ))}
                        </div>
                    ) : ads.length === 0 ? (
                        <div className="py-20 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                            <p className="text-text-light font-bold text-sm">در حال حاضر آگهی فعالی از این آژانس ثبت نشده است.</p>
                        </div>
                    ) : viewMode === "grid" ? (
                        /* 3-Column Square Instagram Grid with Price Overlay */
                        <div className="grid grid-cols-3 gap-1.5 sm:gap-3">
                            {ads.map((ad) => {
                                const priceVal = Object.values(ad.pricing)[0];
                                const mediaUrl = ad.mediaIds?.[0]
                                    ? `${process.env.NEXT_PUBLIC_API_URL}/media/${ad.mediaIds[0]}`
                                    : "/property-placeholder.svg";

                                return (
                                    <Link
                                        key={ad.adId}
                                        href={`/ads/${ad.adId}`}
                                        className="group relative aspect-square rounded-xl sm:rounded-2xl overflow-hidden bg-gray-100"
                                    >
                                        <Image
                                            src={mediaUrl}
                                            alt={ad.title}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2 sm:p-3 text-white">
                                            <span className="text-[10px] sm:text-xs font-black truncate">{ad.title}</span>
                                            <span className="text-[10px] sm:text-xs font-bold text-primary">
                                                {formatPrice(priceVal)}
                                            </span>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    ) : (
                        /* Standard Card Feed */
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {ads.map((ad) => (
                                <PropertyCard
                                    key={ad.adId}
                                    adId={ad.adId}
                                    title={ad.title}
                                    price={Object.values(ad.pricing)[0] ?? 0}
                                    rating={4.8}
                                    location={ad.cityId}
                                    image={
                                        ad.mediaIds && ad.mediaIds.length > 0
                                            ? `${process.env.NEXT_PUBLIC_API_URL}/media/${ad.mediaIds[0]}`
                                            : "/property-placeholder.svg"
                                    }
                                    category={ad.categoryPath?.subcategoryKey}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Reviews Tab */}
            {activeTab === "reviews" && (
                <div className="bg-white rounded-3xl">
                    <ReviewsSection targetId={id} targetType="agency" />
                </div>
            )}

            {/* Consultation Modal */}
            {isConsultationModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
                    <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 border border-gray-100">
                        <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                            <h3 className="font-black text-brand text-base">درخواست مشاوره تخصصی</h3>
                            <button
                                onClick={() => setIsConsultationModalOpen(false)}
                                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-text-light hover:bg-gray-200"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-4 text-xs">
                            <div>
                                <Select
                                    label="موضوع مشاوره"
                                    value={consultationSubject}
                                    onChange={(val) => setConsultationSubject(val)}
                                    options={[
                                        { value: "مشاوره خرید ملک", label: "مشاوره خرید ملک" },
                                        { value: "مشاوره رهن و اجاره", label: "مشاوره رهن و اجاره" },
                                        { value: "کارشناسی قیمت ملک", label: "کارشناسی قیمت ملک" },
                                        { value: "مشاوره سرمایه‌گذاری ملکی", label: "مشاوره سرمایه‌گذاری ملکی" },
                                        { value: "مشاوره عمومی ملک", label: "سایر موارد" },
                                    ]}
                                    placeholder="موضوع مشاوره را انتخاب کنید..."
                                />
                            </div>

                            <div>
                                <label className="block font-bold text-brand mb-1.5">روش ارتباطی ترجیحی</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setContactMethod("phone")}
                                        className={cn(
                                            "py-2.5 px-3 rounded-xl border font-bold transition-all flex items-center justify-center gap-1.5",
                                            contactMethod === "phone"
                                                ? "bg-brand text-white border-brand"
                                                : "bg-gray-50 border-gray-200 text-text-light"
                                        )}
                                    >
                                        <Phone className="w-3.5 h-3.5" />
                                        <span>تماس تلفنی</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setContactMethod("chat")}
                                        className={cn(
                                            "py-2.5 px-3 rounded-xl border font-bold transition-all flex items-center justify-center gap-1.5",
                                            contactMethod === "chat"
                                                ? "bg-brand text-white border-brand"
                                                : "bg-gray-50 border-gray-200 text-text-light"
                                        )}
                                    >
                                        <MessageCircle className="w-3.5 h-3.5" />
                                        <span>چت آنلاین</span>
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block font-bold text-brand mb-1.5">توضیحات و نیازمندی شما</label>
                                <textarea
                                    rows={4}
                                    value={consultationMessage}
                                    onChange={(e) => setConsultationMessage(e.target.value)}
                                    placeholder="محدوده بودجه، متراژ و مشخصات مدنظرتان را بنویسید..."
                                    className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary outline-hidden leading-relaxed"
                                />
                            </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setIsConsultationModalOpen(false)}
                                className="flex-1 py-3 rounded-xl border border-gray-200 font-bold text-xs text-text-light hover:bg-gray-50"
                            >
                                انصراف
                            </button>
                            <button
                                type="button"
                                onClick={() => consultationMutation.mutate()}
                                disabled={consultationMutation.isPending || !consultationMessage.trim()}
                                className="flex-1 py-3 rounded-xl bg-primary text-white font-black text-xs hover:bg-primary/90 shadow-md shadow-primary/20 disabled:opacity-50 transition-all"
                            >
                                {consultationMutation.isPending ? "در حال ارسال..." : "ارسال درخواست"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
