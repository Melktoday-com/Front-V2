"use client";

import { ReviewsSection } from "@/components/ui/ReviewsSection";
import { ErrorState } from "@/components/ui/StatusStates";
import { TemporaryRentCard } from "@/components/ui/TemporaryRentCard";
import { useAuth } from "@/hooks/useAuth";
import { useCreateConversation } from "@/hooks/useChat";
import { useTemporaryRentAdDetail, useTemporaryRentAds } from "@/hooks/useTemporaryRent";
import { cn, formatPrice, toPersianDigits } from "@/lib/utils";
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
    Plus,
    Share2,
    ShieldCheck,
    Star,
    Tv,
    Users,
    Utensils,
    Wifi,
    Wind,
} from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

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

    const { isLoggedIn } = useAuth();
    const chatMutation = useCreateConversation();

    const { data: residence, isLoading, error, refetch } = useTemporaryRentAdDetail(id);

    const { data: similarResidences } = useTemporaryRentAds(
        {
            limit: 4,
            cityId: residence?.cityId,
            status: "PUBLISHED",
        },
        { enabled: !!residence?.cityId }
    );

    const [isFavorite, setIsFavorite] = useState(false);
    const [nights, setNights] = useState(1);
    const [activeImageIndex, setActiveImageIndex] = useState(0);

    const images = useMemo(() => {
        if (!residence?.mediaIds || residence.mediaIds.length === 0) {
            return ["/property-placeholder.svg"];
        }
        return residence.mediaIds.map((mid) => `${process.env.NEXT_PUBLIC_API_URL}/media/${mid}`);
    }, [residence?.mediaIds]);

    const activeImage = images[activeImageIndex] || images[0] || "/property-placeholder.svg";

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
                    onClick={() => router.back()}
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
                        onClick={() => setIsFavorite(!isFavorite)}
                        className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                            isFavorite ? "bg-red-500 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                        )}
                        title="افزودن به علاقه‌مندی‌ها"
                    >
                        <Heart className={cn("w-4 h-4", isFavorite && "fill-current")} />
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
                        <span>{residence.cityName || residence.cityId}</span>
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
                    <Image
                        src={activeImage}
                        alt={residence.title}
                        fill
                        priority
                        className="object-cover transition-opacity duration-300"
                    />
                    <div className="absolute top-4 right-4 bg-orange-600/90 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full">
                        اجاره روزانه
                    </div>
                </div>

                {images.length > 1 && (
                    <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                        {images.map((url, idx) => (
                            <button
                                key={idx}
                                onClick={() => setActiveImageIndex(idx)}
                                className={cn(
                                    "relative w-20 h-16 sm:w-24 sm:h-18 rounded-2xl overflow-hidden shrink-0 border-2 transition-all",
                                    activeImageIndex === idx
                                        ? "border-orange-500 scale-105 shadow-md"
                                        : "border-transparent opacity-70 hover:opacity-100"
                                )}
                            >
                                <Image src={url} alt={`تصویر ${idx + 1}`} fill className="object-cover" />
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
                    <div className="flex items-center justify-between p-5 bg-orange-50/30 rounded-3xl border border-orange-100/60">
                        <div className="flex items-center gap-3.5">
                            <div className="w-14 h-14 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-black text-xl border-2 border-white shadow-xs">
                                {residence.owner?.fullName?.[0] || "م"}
                            </div>
                            <div>
                                <h3 className="font-bold text-base text-brand">
                                    میزبان: {residence.owner?.fullName || "میزبان مَلک‌تودی"}
                                </h3>
                                <p className="text-xs text-text-light mt-0.5 flex items-center gap-1">
                                    <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                                    میزبان تایید هویت شده
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleChat}
                            disabled={chatMutation.isPending}
                            className="flex items-center gap-1.5 px-4 py-2 bg-white rounded-xl border border-gray-200 text-xs font-bold text-brand hover:border-primary shadow-xs transition-colors"
                        >
                            <MessageCircle className="w-4 h-4 text-primary" />
                            <span>ارسال پیام</span>
                        </button>
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

                        {/* Booking CTA Button */}
                        <button
                            onClick={handleChat}
                            disabled={chatMutation.isPending}
                            className="w-full py-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-sm rounded-2xl shadow-lg shadow-orange-500/25 active:scale-98 transition-all flex items-center justify-center gap-2"
                        >
                            <MessageCircle className="w-5 h-5" />
                            <span>درخواست رزرو و گفتگو با میزبان</span>
                        </button>

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
                                    location={item.cityName || residence.cityName || item.cityId || "ایران"}
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
                <button
                    onClick={handleChat}
                    disabled={chatMutation.isPending}
                    className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl text-xs font-black shadow-md shadow-orange-500/25 active:scale-95 transition-transform flex items-center gap-1.5"
                >
                    <MessageCircle className="w-4 h-4" />
                    <span>رزرو و گفتگو</span>
                </button>
            </div>
        </div>
    );
}
