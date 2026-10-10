"use client";

import { ReviewsSection } from "@/components/ui/ReviewsSection";
import { ErrorState } from "@/components/ui/StatusStates";
import { TemporaryRentCard } from "@/components/ui/TemporaryRentCard";
import { useAuth } from "@/hooks/useAuth";
import { useCreateConversation } from "@/hooks/useChat";
import { useTemporaryRentAdDetail, useTemporaryRentAds } from "@/hooks/useTemporaryRent";
import { cn, formatPrice, toPersianDigits, getMediaUrl, getMediaPosterUrl } from "@/lib/utils";
import {
    Bath,
    Bed,
    Calendar,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock,
    Heart,
    MapPin,
    MessageCircle,
    Minus,
    Play,
    Plus,
    Share2,
    ShieldCheck,
    Star,
    Tv,
    Users,
    Utensils,
    Wifi,
    Wind,
    Copy,
    Phone,
    ShieldAlert,
    Sparkles,
    X,
} from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useSafeBack } from "@/hooks/useSafeBack";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useCityLookup } from "@/hooks/useCityLookup";
import { useShowcase } from "@/hooks/useShowcase";
import { useToggleSaveTemporaryRent } from "@/hooks/useFavorites";
import { PromotionModal } from "@/components/promotions/PromotionModal";
import { temporaryRentService } from "@/services/temporary-rent.service";
import type { TemporaryRentContactInfo } from "@/types/api/temporary-rent.types";

const Map = dynamic(() => import("@/components/ui/Map"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full min-h-[260px] bg-soft-bg animate-pulse rounded-2xl flex items-center justify-center text-text-light text-sm font-bold">
            در حال بارگذاری نقشه...
        </div>
    ),
});

export default function ResidenceDetailScene() {
    const params = useParams();
    const id = params.id as string;
    const router = useRouter();
    const handleBack = useSafeBack("/");

    const { isLoggedIn, user } = useAuth();
    const chatMutation = useCreateConversation();

    const { data: residence, isLoading, error, refetch } = useTemporaryRentAdDetail(id);
    const isOwner = Boolean(user && residence?.ownerId && user.userId === residence.ownerId);
    const isPublished = residence?.status === 'PUBLISHED';
    const isPromoted = Boolean(residence?.isFeatured || residence?.isUrgent);
    const isEligibleForPromotion = isOwner && isPublished && !isPromoted;

    const { getCityName } = useCityLookup();
    const cityName = residence?.cityName || getCityName(residence?.cityId);

    const hostIdentifier = residence?.owner?.slug || residence?.publisher?.slug || residence?.owner?.id || residence?.ownerId;
    const { data: hostShowcase } = useShowcase("host", hostIdentifier || "");

    const hostName = hostShowcase?.header?.title || residence?.owner?.fullName || residence?.publisher?.name || "میزبان ملک تودی";
    const hostAvatar = hostShowcase?.header?.avatarUrl || residence?.owner?.avatarUrl || residence?.publisher?.avatar;
    const isHostVerified = hostShowcase?.header?.isVerified ?? true;
    const hostSlug = hostShowcase?.header?.slug || residence?.owner?.slug || residence?.publisher?.slug || hostIdentifier;
    const isAgencyPublisher = residence?.publisher?.type === "agency";
    const hostShowcaseUrl = hostSlug
        ? isAgencyPublisher
            ? `/agency/showcase/${hostSlug}`
            : `/host/${hostSlug}`
        : undefined;

    const { data: similarResidences } = useTemporaryRentAds(
        {
            limit: 4,
            cityId: residence?.cityId,
            status: "PUBLISHED",
        },
        { enabled: !!residence?.cityId }
    );

    const toggleSaveTempMutation = useToggleSaveTemporaryRent();
    const [saved, setSaved] = useState(false);
    const [nights, setNights] = useState(1);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [isPromotionModalOpen, setIsPromotionModalOpen] = useState(false);
    const [isContactModalOpen, setIsContactModalOpen] = useState(false);
    const [contactInfo, setContactInfo] = useState<TemporaryRentContactInfo | null>(null);
    const [isLoadingContact, setIsLoadingContact] = useState(false);

    const handleOpenContact = async () => {
        if (!isLoggedIn) {
            toast.error("لطفاً ابتدا وارد حساب کاربری خود شوید");
            router.push(`/auth?returnUrl=/temporary-rent/${id}`);
            return;
        }
        setIsLoadingContact(true);
        try {
            const data = await temporaryRentService.getContactInfo(id);
            setContactInfo(data);
            setIsContactModalOpen(true);
        } catch {
            toast.error("خطا در دریافت اطلاعات تماس میزبان");
        } finally {
            setIsLoadingContact(false);
        }
    };

    useEffect(() => {
        if (residence?.isSaved !== undefined) {
            setSaved(residence.isSaved);
        }
    }, [residence?.isSaved]);

    const handleToggleSave = async () => {
        if (!isLoggedIn) {
            toast.error('لطفاً ابتدا وارد حساب کاربری خود شوید');
            router.push(`/auth?returnUrl=/temporary-rent/${id}`);
            return;
        }
        const nextState = !saved;
        setSaved(nextState);
        try {
            await toggleSaveTempMutation.mutateAsync(id);
            toast.success(nextState ? 'اقامتگاه در نشان‌شده‌ها ذخیره شد' : 'اقامتگاه از نشان‌شده‌ها حذف شد');
        } catch {
            setSaved(!nextState);
        }
    };

    const mediaItems = useMemo(() => {
        if (!residence?.mediaIds || residence.mediaIds.length === 0) {
            return [{ id: "placeholder", url: "/property-placeholder.svg", isVideo: false, posterUrl: undefined }];
        }
        return residence.mediaIds.map((mid, index) => {
            const id = typeof mid === "string" ? mid : (mid.id || `media-${index}`);
            const type = typeof mid === "object" && mid !== null && "type" in mid ? mid.type : undefined;
            const isVideo = type === "VIDEO";
            return {
                id,
                url: getMediaUrl(mid),
                posterUrl: isVideo ? getMediaPosterUrl(mid) : undefined,
                isVideo,
            };
        });
    }, [residence?.mediaIds]);

    const activeMedia = mediaItems[activeImageIndex] || mediaItems[0] || { id: "placeholder", url: "/property-placeholder.svg", isVideo: false, posterUrl: undefined };

    const handleChat = () => {
        if (!isLoggedIn) {
            router.push("/auth");
            return;
        }
        chatMutation.mutate(
            {
                subjectType: "RENTAL",
                subjectId: id,
            },
            {
                onSuccess: (res) => {
                    const convId = res.id;
                    if (convId) {
                        router.push(`/profile/chat?id=${convId}`);
                    } else {
                        router.push("/profile/chat");
                    }
                },
                onError: () => {
                    toast.error("خطا در برقراری ارتباط با میزبان");
                },
            }
        );
    };

    const handleShare = () => {
        if (typeof navigator !== "undefined" && navigator.share) {
            navigator.share({
                title: residence?.title,
                url: window.location.href,
            }).catch(() => {});
        } else if (typeof navigator !== "undefined" && navigator.clipboard) {
            navigator.clipboard.writeText(window.location.href);
            toast.success("لینک اقامتگاه کپی شد");
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
                <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-text-light text-sm font-bold">در حال بارگذاری اطلاعات اقامتگاه...</p>
            </div>
        );
    }

    if (error || !residence) {
        return (
            <div className="p-6">
                <ErrorState message="خطا در بارگذاری اطلاعات اقامتگاه" onRetry={() => refetch()} />
            </div>
        );
    }

    const nightlyPrice = residence.pricing.nightlyPrice;
    const totalPrice = nightlyPrice * nights;
    const lat = residence.latitude;
    const lng = residence.longitude;
    const hasCoords = typeof lat === "number" && typeof lng === "number";

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-32 lg:pb-16">
            {/* Top Navigation */}
            <div className="flex items-center justify-between mb-4">
                <button
                    onClick={handleBack}
                    className="flex items-center gap-1.5 text-xs font-bold text-text-light hover:text-brand transition-colors"
                >
                    <ChevronRight className="w-5 h-5" />
                    <span>بازگشت</span>
                </button>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleShare}
                        className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-text-main transition-colors"
                        title="اشتراک‌گذاری"
                    >
                        <Share2 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={handleToggleSave}
                        className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center transition-colors active:scale-95",
                            saved ? "bg-red-500 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                        )}
                        title={saved ? "حذف از نشان‌شده‌ها" : "نشان کردن اقامتگاه"}
                        aria-label="نشان کردن اقامتگاه"
                    >
                        <Heart className={cn("w-4 h-4", saved && "fill-current")} />
                    </button>
                </div>
            </div>

            {/* Header Titles */}
            <div className="mb-6">
                <h1 className="text-xl sm:text-3xl font-black text-brand leading-tight">
                    {residence.title}
                </h1>
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-text-light mt-2 font-medium">
                    <div className="flex items-center gap-1 text-brand font-bold">
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                        <span>{toPersianDigits("4.9")}</span>
                        <span className="text-text-light text-[11px]">(امتیاز مسافران)</span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span>{cityName}</span>
                    </div>
                    {residence.address && (
                        <>
                            <span>•</span>
                            <span className="truncate max-w-xs">{residence.address}</span>
                        </>
                    )}
                </div>
            </div>

            {/* Gallery Grid (Airbnb Style) */}
            <section className="space-y-3">
                <div className="relative w-full aspect-[16/10] sm:aspect-[16/8] rounded-3xl overflow-hidden bg-gray-100 shadow-md">
                    {activeMedia.isVideo ? (
                        <video
                            src={activeMedia.url}
                            poster={activeMedia.posterUrl}
                            controls
                            playsInline
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <Image
                            src={activeMedia.url}
                            alt={residence.title}
                            fill
                            priority
                            className="object-cover transition-opacity duration-300"
                        />
                    )}
                    <div className="absolute top-4 right-4 bg-orange-600/90 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full z-10">
                        اجاره روزانه
                    </div>
                </div>

                {mediaItems.length > 1 && (
                    <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                        {mediaItems.map((media, idx) => (
                            <button
                                key={media.id || idx}
                                onClick={() => setActiveImageIndex(idx)}
                                className={cn(
                                    "relative w-20 h-16 sm:w-24 sm:h-18 rounded-2xl overflow-hidden shrink-0 border-2 transition-all",
                                    activeImageIndex === idx
                                        ? "border-orange-500 scale-105 shadow-md"
                                        : "border-transparent opacity-70 hover:opacity-100"
                                )}
                            >
                                {media.isVideo ? (
                                    <div className="relative w-full h-full bg-slate-900 flex items-center justify-center">
                                        {media.posterUrl && (
                                            <Image src={media.posterUrl} alt={`ویدیو ${idx + 1}`} fill className="object-cover opacity-80" />
                                        )}
                                        <Play className="w-5 h-5 text-white fill-white relative z-10 drop-shadow" />
                                        <span className="absolute bottom-1 right-1 text-[10px] text-white bg-black/60 px-1 rounded z-10">ویدیو</span>
                                    </div>
                                ) : (
                                    <Image src={media.url} alt={`تصویر ${idx + 1}`} fill className="object-cover" />
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </section>

            {/* Main Content & Sticky Booking Card Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
                {/* Right / Main Column (2 cols) */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Key Specs Pills */}
                    <div className="flex flex-wrap items-center gap-3 py-4 border-y border-gray-100 text-xs font-bold text-brand">
                        <div className="flex items-center gap-2 bg-orange-50/60 text-orange-950 px-4 py-2.5 rounded-full border border-orange-100">
                            <Users className="w-4 h-4 text-orange-600" />
                            <span>ظرفیت تا {toPersianDigits(residence.maxGuests || residence.guestCapacity || 2)} نفر</span>
                        </div>
                        <div className="flex items-center gap-2 bg-gray-50 px-4 py-2.5 rounded-full border border-gray-100 text-text-light">
                            <Bed className="w-4 h-4 text-primary" />
                            <span>{toPersianDigits(residence.attributes?.rooms ? String(residence.attributes.rooms) : 1)} اتاق خواب</span>
                        </div>
                        <div className="flex items-center gap-2 bg-gray-50 px-4 py-2.5 rounded-full border border-gray-100 text-text-light">
                            <Bath className="w-4 h-4 text-primary" />
                            <span>{toPersianDigits(residence.attributes?.bathrooms ? String(residence.attributes.bathrooms) : 1)} سرویس بهداشتی</span>
                        </div>
                    </div>

                    {/* Host Profile */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-orange-50/40 rounded-3xl border border-orange-100">
                        <div className="flex items-center gap-3.5">
                            {hostAvatar ? (
                                hostShowcaseUrl ? (
                                    <Link
                                        href={hostShowcaseUrl}
                                        className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-white shadow-xs shrink-0 bg-gray-100 hover:ring-2 hover:ring-orange-400 transition-all cursor-pointer"
                                        title={`مشاهده ویترین ${hostName}`}
                                    >
                                        <Image
                                            src={getMediaUrl(hostAvatar)}
                                            alt={hostName}
                                            fill
                                            className="object-cover"
                                        />
                                    </Link>
                                ) : (
                                    <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-white shadow-xs shrink-0 bg-gray-100">
                                        <Image
                                            src={getMediaUrl(hostAvatar)}
                                            alt={hostName}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                )
                            ) : hostShowcaseUrl ? (
                                <Link
                                    href={hostShowcaseUrl}
                                    className="w-14 h-14 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-black text-xl border-2 border-white shadow-xs shrink-0 hover:bg-orange-200 transition-colors cursor-pointer"
                                    title={`مشاهده ویترین ${hostName}`}
                                >
                                    {hostName?.[0] || "م"}
                                </Link>
                            ) : (
                                <div className="w-14 h-14 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-black text-xl border-2 border-white shadow-xs shrink-0">
                                    {hostName?.[0] || "م"}
                                </div>
                            )}
                            <div>
                                {hostShowcaseUrl ? (
                                    <Link
                                        href={hostShowcaseUrl}
                                        className="font-bold text-base text-brand hover:text-orange-600 transition-colors cursor-pointer block"
                                    >
                                        میزبان: {hostName}
                                    </Link>
                                ) : (
                                    <h3 className="font-bold text-base text-brand">
                                        میزبان: {hostName}
                                    </h3>
                                )}
                                <p className="text-xs text-text-light mt-0.5 flex items-center gap-1">
                                    {isHostVerified && (
                                        <>
                                            <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                                            میزبان تایید هویت شده
                                        </>
                                    )}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            {hostShowcaseUrl && (
                                <Link
                                    href={hostShowcaseUrl}
                                    className="flex items-center gap-1.5 px-3.5 py-2 bg-white rounded-xl border border-orange-200 text-xs font-bold text-orange-950 hover:bg-orange-50 shadow-xs transition-colors cursor-pointer"
                                >
                                    <span>مشاهده ویترین میزبان</span>
                                    <ChevronLeft className="w-4 h-4 text-orange-600" />
                                </Link>
                            )}
                            {!isOwner && (
                                <button
                                    onClick={handleChat}
                                    disabled={chatMutation.isPending}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-white rounded-xl border border-gray-200 text-xs font-bold text-brand hover:border-primary shadow-xs transition-colors cursor-pointer"
                                >
                                    <MessageCircle className="w-4 h-4 text-primary" />
                                    <span>ارسال پیام</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-3">
                        <h2 className="text-lg font-black text-brand">درباره این اقامتگاه</h2>
                        <div className="bg-gray-50/60 p-5 rounded-2xl border border-gray-100 text-sm text-text-main leading-relaxed whitespace-pre-line">
                            {residence.description || "توضیحاتی برای این اقامتگاه ثبت نشده است."}
                        </div>
                    </div>

                    {/* Amenities Grid */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-black text-brand">امکانات اقامتگاه</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-bold">
                            <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-gray-50 border border-gray-100 text-text-main">
                                <Wifi className="w-4 h-4 text-primary shrink-0" />
                                <span>اینترنت وای‌فای</span>
                            </div>
                            <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-gray-50 border border-gray-100 text-text-main">
                                <Wind className="w-4 h-4 text-primary shrink-0" />
                                <span>سیستم سرمایش و گرمایش</span>
                            </div>
                            <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-gray-50 border border-gray-100 text-text-main">
                                <Utensils className="w-4 h-4 text-primary shrink-0" />
                                <span>وسایل پخت و پز آشپزخانه</span>
                            </div>
                            <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-gray-50 border border-gray-100 text-text-main">
                                <Tv className="w-4 h-4 text-primary shrink-0" />
                                <span>تلویزیون</span>
                            </div>
                            <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-gray-50 border border-gray-100 text-text-main">
                                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                                <span>پارکینگ اختصاصی</span>
                            </div>
                            <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-gray-50 border border-gray-100 text-text-main">
                                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                                <span>ملحفه و روبالشتی بهداشتی</span>
                            </div>
                        </div>
                    </div>

                    {/* House Rules & Check-in info */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-black text-brand">مقررات و شرایط ورود و خروج</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-orange-50/20 p-5 rounded-3xl border border-orange-100 text-xs">
                            <div className="flex items-center gap-3">
                                <Clock className="w-5 h-5 text-orange-600 shrink-0" />
                                <div>
                                    <span className="font-black text-brand block">ساعت ورود</span>
                                    <span className="text-text-light">از ساعت ۱۴:۰۰ به بعد</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Clock className="w-5 h-5 text-orange-600 shrink-0" />
                                <div>
                                    <span className="font-black text-brand block">ساعت خروج</span>
                                    <span className="text-text-light">تا قبل از ساعت ۱۲:۰۰ ظهر</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Interactive Leaflet Map */}
                    {hasCoords && (
                        <div className="space-y-3">
                            <h2 className="text-lg font-black text-brand">موقعیت اقامتگاه روی نقشه</h2>
                            <div className="h-64 rounded-3xl overflow-hidden border border-gray-100 shadow-xs">
                                <Map
                                    ads={[]}
                                    center={[lat, lng]}
                                    zoom={14}
                                />
                            </div>
                        </div>
                    )}

                    {/* Reviews */}
                    <ReviewsSection targetId={id} targetType="temporary-rent" />
                </div>

                {/* Left Column (Sticky Booking Card - Airbnb Style) */}
                <div>
                    <div className="sticky top-6 bg-white p-6 rounded-3xl border border-gray-100 shadow-xl space-y-5">
                        {/* Price display */}
                        <div className="flex items-baseline justify-between border-b border-gray-100 pb-4">
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-black text-brand">
                                    {formatPrice(nightlyPrice, "")}
                                </span>
                                <span className="text-xs font-bold text-text-light">تومان</span>
                                <span className="text-xs text-text-light">/ هر شب</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs font-bold text-brand">
                                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                                <span>۴.۹</span>
                            </div>
                        </div>

                        {/* Nights Selector */}
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-brand">مدت اقامت (تعداد شب)</label>
                            <div className="flex items-center justify-between p-3 rounded-2xl border border-gray-200 bg-gray-50">
                                <span className="text-xs font-bold text-brand">
                                    {toPersianDigits(nights)} شب
                                </span>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setNights(Math.max(1, nights - 1))}
                                        className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-text-main hover:bg-gray-100 active:scale-95 transition-transform"
                                    >
                                        <Minus className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setNights(nights + 1)}
                                        className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-text-main hover:bg-gray-100 active:scale-95 transition-transform"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Price Breakdown */}
                        <div className="space-y-2.5 text-xs text-text-light border-t border-gray-100 pt-4">
                            <div className="flex justify-between">
                                <span>{formatPrice(nightlyPrice, "")} تومان × {toPersianDigits(nights)} شب</span>
                                <span className="font-bold text-brand">{formatPrice(totalPrice, "")} تومان</span>
                            </div>
                            <div className="flex justify-between">
                                <span>کارمزد خدمات</span>
                                <span className="text-green-600 font-bold">رایگان</span>
                            </div>
                            <div className="flex justify-between border-t border-gray-100 pt-3 text-sm font-black text-brand">
                                <span>مجموع کل</span>
                                <span>{formatPrice(totalPrice)}</span>
                            </div>
                        </div>

                        {isOwner ? (
                            <div className="space-y-3">
                                <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-2xl flex items-center gap-2.5 text-xs font-bold text-amber-950">
                                    <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                                    <span>این اقامتگاه توسط شما ثبت شده است.</span>
                                </div>

                                {/* Owner Promotion CTA if eligible */}
                                {isEligibleForPromotion && (
                                    <button
                                        onClick={() => setIsPromotionModalOpen(true)}
                                        className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-sm rounded-2xl shadow-md shadow-amber-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                        <Sparkles className="w-4 h-4" />
                                        <span>ارتقای اقامتگاه (فوری / نردبان)</span>
                                    </button>
                                )}

                                {/* Already promoted indicator */}
                                {isPublished && isPromoted && (
                                    <div className="flex items-center justify-center gap-2 w-full py-3 bg-amber-50 border border-amber-200 text-amber-800 font-black text-xs rounded-2xl shadow-xs">
                                        <Sparkles className="w-4 h-4 text-amber-600" />
                                        <span>اقامتگاه شما ارتقا یافته است (فوری / ویژه)</span>
                                    </div>
                                )}

                                {!isPublished && (
                                    <div className="p-2.5 bg-gray-50 border border-gray-200 text-gray-600 text-xs text-center rounded-xl font-medium">
                                        {residence?.status === 'PENDING_APPROVAL'
                                            ? "اقامتگاه در انتظار تایید کارشناسان است"
                                            : "اقامتگاه در حالت فعال نمی‌باشد"}
                                    </div>
                                )}

                                <button
                                    onClick={() => router.push('/profile/temporary-rent')}
                                    className="w-full py-3 bg-brand/5 hover:bg-brand/10 text-brand font-bold text-xs rounded-2xl border border-brand/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                                >
                                    <span>مدیریت در پنل اقامتگاه‌ها</span>
                                </button>
                            </div>
                        ) : (
                            <>
                                {/* Booking CTA Button */}
                                <button
                                    onClick={handleChat}
                                    disabled={chatMutation.isPending}
                                    className="w-full py-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-sm rounded-2xl shadow-lg shadow-orange-500/25 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    <MessageCircle className="w-5 h-5" />
                                    <span>درخواست رزرو و گفتگو با میزبان</span>
                                </button>

                                {/* Contact Host Direct CTA */}
                                <button
                                    onClick={handleOpenContact}
                                    disabled={isLoadingContact}
                                    className="w-full py-3 bg-gray-50 hover:bg-gray-100 text-brand font-bold text-xs rounded-2xl border border-gray-200 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                                >
                                    <Phone className="w-4 h-4 text-emerald-600" />
                                    <span>{isLoadingContact ? "در حال دریافت..." : "اطلاعات تماس با میزبان"}</span>
                                </button>


                            </>
                        )}

                        <p className="text-[10px] text-text-light text-center leading-relaxed">
                            در این مرحله وجهی کسر نمی‌شود. هماهنگی نهایی پس از تایید میزبان صورت می‌گیرد.
                        </p>
                    </div>
                </div>
            </div>

            {/* Similar Residences Section */}
            {similarResidences?.items && similarResidences.items.filter((r) => r.id !== id).length > 0 && (
                <section className="mt-16 pt-8 border-t border-gray-100">
                    <h2 className="text-xl font-black text-brand mb-6">اقامتگاه‌های مشابه در این منطقه</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {similarResidences.items
                            .filter((r) => r.id !== id)
                            .slice(0, 4)
                            .map((item) => (
                                <TemporaryRentCard
                                    key={item.id}
                                    id={item.id}
                                    title={item.title}
                                    nightlyPrice={item.pricing.nightlyPrice}
                                    location={item.cityName || getCityName(item.cityId) || cityName || "ایران"}
                                    mediaIds={item.mediaIds}
                                    maxGuests={item.maxGuests}
                                />
                            ))}
                    </div>
                </section>
            )}

            {/* Sticky Mobile Reservation Bar (Airbnb Mobile Pattern) */}
            <div className="fixed bottom-0 left-0 right-0 p-3.5 bg-white/95 backdrop-blur-xl border-t border-gray-200/70 flex items-center justify-between gap-3 z-40 lg:hidden shadow-2xl">
                <div className="flex flex-col min-w-0">
                    <div className="flex items-baseline gap-1">
                        <span className="text-base font-black text-brand">{formatPrice(nightlyPrice, "")}</span>
                        <span className="text-xs text-text-light font-bold">تومان</span>
                    </div>
                    <span className="text-[11px] text-text-light font-medium">هر شب</span>
                </div>
                <div className="flex items-center gap-2">
                    {isOwner ? (
                        <>
                            {isEligibleForPromotion && (
                                <button
                                    onClick={() => setIsPromotionModalOpen(true)}
                                    className="flex items-center gap-1 px-3 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-xs font-black shadow-md shadow-orange-500/20 active:scale-95 transition-transform cursor-pointer"
                                >
                                    <Sparkles className="w-3.5 h-3.5" />
                                    <span>ارتقا</span>
                                </button>
                            )}
                            {isPublished && isPromoted && (
                                <span className="flex items-center gap-1 px-2.5 py-2 bg-amber-100 text-amber-800 rounded-xl text-xs font-bold">
                                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                                    <span>ارتقا یافته</span>
                                </span>
                            )}
                            <button
                                onClick={() => router.push('/profile/temporary-rent')}
                                className="px-4 py-2.5 bg-brand text-white rounded-xl text-xs font-bold active:scale-95 transition-transform cursor-pointer"
                            >
                                <span>مدیریت</span>
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={handleOpenContact}
                                disabled={isLoadingContact}
                                className="p-2.5 bg-gray-100 hover:bg-gray-200 text-brand rounded-xl border border-gray-200 transition-all flex items-center justify-center cursor-pointer"
                                title="تماس با میزبان"
                            >
                                <Phone className="w-4 h-4 text-emerald-600" />
                            </button>
                            <button
                                onClick={handleChat}
                                disabled={chatMutation.isPending}
                                className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl text-xs font-black shadow-md shadow-orange-500/25 active:scale-95 transition-transform flex items-center gap-1.5 cursor-pointer"
                            >
                                <MessageCircle className="w-4 h-4" />
                                <span>رزرو و گفتگو</span>
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Contact Reveal Modal */}
            {isContactModalOpen && (
                <div
                    role="dialog"
                    aria-modal="true"
                    className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4"
                >
                    <div
                        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
                        onClick={() => setIsContactModalOpen(false)}
                    />
                    <div className="relative z-10 w-full md:max-w-md bg-white rounded-t-3xl md:rounded-3xl p-6 shadow-2xl transition-all max-h-[90vh] overflow-y-auto">
                        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-4 md:hidden" />
                        <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-xl">
                                    <Phone className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-black text-brand text-base">اطلاعات تماس با میزبان</h3>
                                    <p className="text-text-light text-[11px] truncate max-w-[240px]">
                                        {contactInfo?.ownerName ? `میزبان: ${contactInfo.ownerName}` : residence?.title}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsContactModalOpen(false)}
                                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-50 transition cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {!contactInfo?.phoneNumber ? (
                            <div className="space-y-4">
                                <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl flex items-start gap-3">
                                    <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                    <div className="text-xs">
                                        <h5 className="font-black text-amber-950 mb-1">شماره تماس مخفی شده است</h5>
                                        <p className="text-amber-900/80 leading-relaxed">
                                            به درخواست میزبان و جهت حفظ حریم خصوصی، شماره تلفن مستقیم مخفی شده است. شما می‌توانید از طریق چت آنلاین با ایشان در ارتباط باشید.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setIsContactModalOpen(false);
                                        handleChat();
                                    }}
                                    disabled={chatMutation.isPending}
                                    className="w-full py-3.5 bg-brand hover:bg-brand/90 text-white font-bold text-xs rounded-2xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    <MessageCircle className="w-4 h-4" />
                                    <span>ارسال پیام در چت آنلاین</span>
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-between">
                                    <div>
                                        <span className="text-[11px] text-text-light block mb-0.5">شماره تماس مستقیم:</span>
                                        <span className="text-lg font-black text-brand tracking-widest font-mono" dir="ltr">
                                            {toPersianDigits(contactInfo.phoneNumber)}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => {
                                            if (navigator.clipboard) {
                                                navigator.clipboard.writeText(contactInfo.phoneNumber);
                                                toast.success("شماره تماس در کلیپ‌بورد کپی شد");
                                            }
                                        }}
                                        className="p-2.5 bg-white border border-gray-200 text-brand rounded-xl hover:bg-gray-50 transition shadow-xs cursor-pointer"
                                        title="کپی شماره"
                                    >
                                        <Copy className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="flex items-center gap-2.5 pt-2">
                                    <a
                                        href={`tel:${contactInfo.phoneNumber}`}
                                        className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer text-center"
                                    >
                                        <Phone className="w-4 h-4" />
                                        <span>تماس تلفنی</span>
                                    </a>
                                    <button
                                        onClick={() => {
                                            setIsContactModalOpen(false);
                                            handleChat();
                                        }}
                                        className="flex-1 py-3 border border-gray-200 hover:bg-gray-50 text-brand font-bold text-xs rounded-2xl transition flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                        <MessageCircle className="w-4 h-4" />
                                        <span>ارسال پیام آنلاین</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Promotion Modal */}
            <PromotionModal
                isOpen={isPromotionModalOpen}
                onClose={() => setIsPromotionModalOpen(false)}
                listingId={id}
                listingTitle={residence?.title || ""}
                itemType="TEMPORARY_RENTAL"
            />
        </div>
    );
}
