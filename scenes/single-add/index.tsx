"use client";

import { useAd, useAdContact, useAds } from "@/hooks/useAds";
import { useAuth } from "@/hooks/useAuth";
import { useCreateConversation } from "@/hooks/useChat";
import { cn, formatPrice, toPersianDigits } from "@/lib/utils";
import { AdSummary } from "@/types/api/ads.types";
import {
    Bath,
    Bed,
    Building,
    Calendar,
    CheckCircle2,
    ChevronRight,
    Heart,
    Layers,
    MapPin,
    Maximize2,
    MessageCircle,
    Phone,
    Share2,
    ShieldCheck,
    Sparkles,
    Star,
} from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PropertyCard } from "@/components/ui/PropertyCard";

const Map = dynamic(() => import("@/components/ui/Map"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full min-h-[260px] bg-soft-bg animate-pulse rounded-2xl flex items-center justify-center text-text-light text-sm font-bold">
            در حال بارگذاری نقشه...
        </div>
    ),
});

export default function SingleAdScene() {
    const { id } = useParams() as { id: string };
    const router = useRouter();
    const [isFavorite, setIsFavorite] = useState(false);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [showFullPhone, setShowFullPhone] = useState(false);

    const { isLoggedIn } = useAuth();
    const chatMutation = useCreateConversation();
    const { data: ad, isLoading, error } = useAd(id);
    const { data: contact } = useAdContact(id);

    // Nearby / similar ads in the same city
    const { data: similarAds } = useAds(
        {
            cityId: ad?.cityId,
            limit: 4,
            status: "PUBLISHED",
        },
        { enabled: !!ad?.cityId }
    );

    // Collect all media URLs
    const mediaUrls = useMemo(() => {
        if (!ad?.mediaIds || ad.mediaIds.length === 0) {
            return ["/property-placeholder.svg"];
        }
        return ad.mediaIds.map((mId) => `${process.env.NEXT_PUBLIC_API_URL}/media/${mId}`);
    }, [ad?.mediaIds]);

    const activeImage = mediaUrls[activeImageIndex] || mediaUrls[0] || "/property-placeholder.svg";

    const handleChat = () => {
        if (!isLoggedIn) {
            router.push("/auth");
            return;
        }
        chatMutation.mutate(
            {
                subjectType: "PROPERTY",
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
                    toast.error("خطا در ایجاد مکالمه");
                },
            }
        );
    };

    const handleShare = () => {
        if (typeof navigator !== "undefined" && navigator.share) {
            navigator.share({
                title: ad?.title,
                url: window.location.href,
            }).catch(() => {});
        } else if (typeof navigator !== "undefined" && navigator.clipboard) {
            navigator.clipboard.writeText(window.location.href);
            toast.success("لینک آگهی کپی شد");
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-text-light text-sm font-bold">در حال دریافت جزئیات ملک...</p>
            </div>
        );
    }

    if (error || !ad) {
        return (
            <div className="p-6 text-center py-20">
                <p className="text-text-main font-bold text-lg mb-4">آگهی مورد نظر یافت نشد یا حذف شده است.</p>
                <button
                    onClick={() => router.push("/ads")}
                    className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl shadow-md text-sm"
                >
                    بازگشت به لیست آگهی‌ها
                </button>
            </div>
        );
    }

    // Pricing calculation
    const pricing = ad.pricing || {};
    let priceMain = "توافقی";
    let priceSub: string | null = null;

    if (pricing.mortgagePrice !== undefined && pricing.rentPrice !== undefined) {
        priceMain = `رهن: ${formatPrice(pricing.mortgagePrice)}`;
        priceSub = `اجاره ماهانه: ${formatPrice(pricing.rentPrice)}`;
    } else if (pricing.totalPrice !== undefined) {
        priceMain = formatPrice(pricing.totalPrice);
    } else if (pricing.nightlyPrice !== undefined) {
        priceMain = `${formatPrice(pricing.nightlyPrice)} /شب`;
    } else if (Object.values(pricing).length > 0) {
        priceMain = formatPrice(Object.values(pricing)[0]);
    }

    // Attributes extraction
    const attrs = ad.attributes || {};
    const area = attrs.area || attrs.meterage || attrs.size;
    const rooms = attrs.rooms || attrs.bedrooms;
    const floor = attrs.floor;
    const totalFloors = attrs.totalFloors;
    const buildYear = attrs.buildYear || attrs.yearBuilt;
    const hasElevator = attrs.hasElevator ?? attrs.elevator;
    const hasParking = attrs.hasParking ?? attrs.parking;
    const hasStorage = attrs.hasStorage ?? attrs.storage;
    const hasBalcony = attrs.hasBalcony ?? attrs.balcony;

    const lat = ad.location?.latitude ?? ad.location?.lat;
    const lng = ad.location?.longitude ?? ad.location?.lng;
    const hasCoords = typeof lat === "number" && typeof lng === "number";

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-32 lg:pb-12">
            {/* Top Navigation & Breadcrumb */}
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

            {/* Gallery Section */}
            <section className="space-y-3">
                <div className="relative w-full aspect-[16/10] sm:aspect-[16/8] rounded-3xl overflow-hidden bg-gray-100 shadow-md">
                    <Image
                        src={activeImage}
                        alt={ad.title}
                        fill
                        priority
                        className="object-cover transition-opacity duration-300"
                    />
                    <div className="absolute top-4 right-4 bg-brand/80 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full">
                        {ad.categoryPath.subcategoryKey || ad.categoryPath.categoryKey}
                    </div>
                </div>

                {/* Thumbnails */}
                {mediaUrls.length > 1 && (
                    <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                        {mediaUrls.map((url, idx) => (
                            <button
                                key={idx}
                                onClick={() => setActiveImageIndex(idx)}
                                className={cn(
                                    "relative w-20 h-16 sm:w-24 sm:h-18 rounded-2xl overflow-hidden shrink-0 border-2 transition-all",
                                    activeImageIndex === idx ? "border-primary scale-105 shadow-md" : "border-transparent opacity-70 hover:opacity-100"
                                )}
                            >
                                <Image src={url} alt={`تصویر ${idx + 1}`} fill className="object-cover" />
                            </button>
                        ))}
                    </div>
                )}
            </section>

            {/* Main Content & Sidebar Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
                {/* Right / Main column (2 cols) */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Title & Price Header */}
                    <div className="border-b border-gray-100 pb-6">
                        <div className="flex flex-col gap-2">
                            <span className="text-2xl sm:text-3xl font-black text-brand leading-tight">
                                {priceMain}
                            </span>
                            {priceSub && (
                                <span className="text-base sm:text-lg font-bold text-secondary-600">
                                    {priceSub}
                                </span>
                            )}
                        </div>

                        <h1 className="text-lg sm:text-2xl font-bold text-text-main mt-3">
                            {ad.title}
                        </h1>

                        <div className="flex items-center gap-1.5 text-text-light text-sm mt-2">
                            <MapPin className="w-4 h-4 shrink-0 text-primary" />
                            <span>شهر: {ad.cityId}</span>
                            <span className="text-gray-300">•</span>
                            <span className="text-xs">
                                ثبت: {new Date(ad.createdAt).toLocaleDateString("fa-IR")}
                            </span>
                        </div>
                    </div>

                    {/* Key Specs Row (Zillow style) */}
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 bg-gray-50/70 p-4 rounded-2xl border border-gray-100">
                        {area && (
                            <div className="flex flex-col items-center justify-center p-2 text-center">
                                <Maximize2 className="w-5 h-5 text-text-light mb-1" />
                                <span className="text-xs text-text-light">متراژ</span>
                                <span className="text-sm font-black text-brand">{toPersianDigits(area)} متر</span>
                            </div>
                        )}
                        {rooms && (
                            <div className="flex flex-col items-center justify-center p-2 text-center">
                                <Bed className="w-5 h-5 text-text-light mb-1" />
                                <span className="text-xs text-text-light">اتاق خواب</span>
                                <span className="text-sm font-black text-brand">{toPersianDigits(rooms)} خوابه</span>
                            </div>
                        )}
                        {floor !== undefined && (
                            <div className="flex flex-col items-center justify-center p-2 text-center">
                                <Layers className="w-5 h-5 text-text-light mb-1" />
                                <span className="text-xs text-text-light">طبقه</span>
                                <span className="text-sm font-black text-brand">
                                    {toPersianDigits(floor)} {totalFloors ? `از ${toPersianDigits(totalFloors)}` : ""}
                                </span>
                            </div>
                        )}
                        {buildYear && (
                            <div className="flex flex-col items-center justify-center p-2 text-center">
                                <Calendar className="w-5 h-5 text-text-light mb-1" />
                                <span className="text-xs text-text-light">سال ساخت</span>
                                <span className="text-sm font-black text-brand">{toPersianDigits(buildYear)}</span>
                            </div>
                        )}
                    </div>

                    {/* Amenities & Features */}
                    {(hasElevator !== undefined || hasParking !== undefined || hasStorage !== undefined || hasBalcony !== undefined) && (
                        <div className="space-y-3">
                            <h2 className="text-base font-black text-brand">امکانات اصلی ملک</h2>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div className={cn(
                                    "flex items-center gap-2 p-3 rounded-xl border text-xs font-bold",
                                    hasElevator ? "bg-green-50/50 border-green-200 text-green-700" : "bg-gray-50 border-gray-100 text-gray-400"
                                )}>
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span>آسانسور</span>
                                </div>
                                <div className={cn(
                                    "flex items-center gap-2 p-3 rounded-xl border text-xs font-bold",
                                    hasParking ? "bg-green-50/50 border-green-200 text-green-700" : "bg-gray-50 border-gray-100 text-gray-400"
                                )}>
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span>پارکینگ</span>
                                </div>
                                <div className={cn(
                                    "flex items-center gap-2 p-3 rounded-xl border text-xs font-bold",
                                    hasStorage ? "bg-green-50/50 border-green-200 text-green-700" : "bg-gray-50 border-gray-100 text-gray-400"
                                )}>
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span>انباری</span>
                                </div>
                                <div className={cn(
                                    "flex items-center gap-2 p-3 rounded-xl border text-xs font-bold",
                                    hasBalcony ? "bg-green-50/50 border-green-200 text-green-700" : "bg-gray-50 border-gray-100 text-gray-400"
                                )}>
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span>بالکن</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Description */}
                    <div className="space-y-3">
                        <h2 className="text-base font-black text-brand">توضیحات</h2>
                        <div className="bg-gray-50/60 p-5 rounded-2xl border border-gray-100 text-sm text-text-main leading-relaxed whitespace-pre-line">
                            {ad.description || "توضیحاتی برای این آگهی ثبت نشده است."}
                        </div>
                    </div>

                    {/* Map Location */}
                    {hasCoords && (
                        <div className="space-y-3">
                            <h2 className="text-base font-black text-brand">موقعیت روی نقشه</h2>
                            <div className="h-64 rounded-2xl overflow-hidden border border-gray-100 shadow-xs">
                                <Map
                                    ads={[ad]}
                                    center={[lat, lng]}
                                    zoom={15}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Left column (Desktop Contact Card & Actions) */}
                <div className="space-y-6">
                    <div className="sticky top-6 bg-white p-6 rounded-3xl border border-gray-100 shadow-lg space-y-5">
                        <h3 className="font-black text-brand text-base border-b border-gray-100 pb-3">
                            اطلاعات تماس آگهی‌دهنده
                        </h3>

                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-lg">
                                م
                            </div>
                            <div>
                                <h4 className="font-bold text-sm text-brand">
                                    آگهی‌دهنده ملک‌تودی
                                </h4>
                                <span className="text-[11px] text-text-light flex items-center gap-1">
                                    <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                                    کاربر تایید شده
                                </span>
                            </div>
                        </div>

                        <div className="space-y-3 pt-2">
                            {contact?.mobileNumber ? (
                                showFullPhone ? (
                                    <a
                                        href={`tel:${contact.mobileNumber}`}
                                        className="flex items-center justify-center gap-2 w-full py-3.5 bg-primary text-white font-bold text-sm rounded-2xl shadow-md hover:bg-primary/90 transition-all"
                                    >
                                        <Phone className="w-4 h-4" />
                                        <span dir="ltr">{toPersianDigits(contact.mobileNumber)}</span>
                                    </a>
                                ) : (
                                    <button
                                        onClick={() => setShowFullPhone(true)}
                                        className="flex items-center justify-center gap-2 w-full py-3.5 bg-primary text-white font-bold text-sm rounded-2xl shadow-md hover:bg-primary/90 transition-all"
                                    >
                                        <Phone className="w-4 h-4" />
                                        <span>مشاهده شماره تماس</span>
                                    </button>
                                )
                            ) : (
                                <button
                                    disabled
                                    className="w-full py-3.5 bg-gray-100 text-gray-400 font-bold text-sm rounded-2xl cursor-not-allowed"
                                >
                                    شماره تماس ثبت نشده
                                </button>
                            )}

                            <button
                                onClick={handleChat}
                                disabled={chatMutation.isPending}
                                className="flex items-center justify-center gap-2 w-full py-3.5 bg-brand text-white font-bold text-sm rounded-2xl shadow-md hover:bg-brand/90 transition-all disabled:opacity-50"
                            >
                                <MessageCircle className="w-4 h-4" />
                                <span>شروع گفتگوی آنلاین</span>
                            </button>
                        </div>

                        <p className="text-[11px] text-text-light text-center leading-relaxed">
                            قبل از انجام معامله حضوری یا پرداخت ودیعه، حتماً از اصالت سند و هویت مالک اطمینان حاصل فرمایید.
                        </p>
                    </div>
                </div>
            </div>

            {/* Similar Ads Section */}
            {similarAds?.items && similarAds.items.filter((a) => a.adId !== id).length > 0 && (
                <section className="mt-14 pt-8 border-t border-gray-100">
                    <h2 className="text-xl font-black text-brand mb-6">آگهی‌های مشابه در این شهر</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {similarAds.items
                            .filter((a) => a.adId !== id)
                            .slice(0, 4)
                            .map((item: AdSummary) => (
                                <PropertyCard
                                    key={item.adId}
                                    adId={item.adId}
                                    title={item.title}
                                    price={Object.values(item.pricing)[0] ?? 0}
                                    rating={4.7}
                                    location={ad.cityId}
                                    image={
                                        item.mediaIds?.[0]
                                            ? `${process.env.NEXT_PUBLIC_API_URL}/media/${item.mediaIds[0]}`
                                            : "/property-placeholder.svg"
                                    }
                                    category={item.categoryPath.subcategoryKey}
                                />
                            ))}
                    </div>
                </section>
            )}

            {/* Sticky Mobile Bottom Bar (Zillow mobile pattern) */}
            <div className="fixed bottom-0 left-0 right-0 p-3.5 bg-white/95 backdrop-blur-xl border-t border-gray-200/70 flex items-center justify-between gap-3 z-40 lg:hidden shadow-2xl">
                <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-[11px] text-text-light font-bold">قیمت</span>
                    <span className="text-sm font-black text-brand truncate">{priceMain}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    {contact?.mobileNumber && (
                        <a
                            href={`tel:${contact.mobileNumber}`}
                            className="flex items-center gap-1.5 px-4 py-2.5 bg-primary text-white rounded-xl text-xs font-bold shadow-md shadow-primary/25 active:scale-95 transition-transform"
                        >
                            <Phone className="w-4 h-4" />
                            <span>تماس</span>
                        </a>
                    )}
                    <button
                        onClick={handleChat}
                        disabled={chatMutation.isPending}
                        className="flex items-center gap-1.5 px-4 py-2.5 bg-brand text-white rounded-xl text-xs font-bold hover:bg-brand/90 active:scale-95 transition-transform"
                    >
                        <MessageCircle className="w-4 h-4" />
                        <span>چت</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
