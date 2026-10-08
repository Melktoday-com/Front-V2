"use client";

import { useAd, useAdContact, useAds } from "@/hooks/useAds";
import { useAuth } from "@/hooks/useAuth";
import { useCreateConversation } from "@/hooks/useChat";
import { cn, formatPrice, toPersianDigits, getMediaUrl, getMediaPosterUrl } from "@/lib/utils";
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
    Lock,
    MapPin,
    Maximize2,
    MessageCircle,
    Phone,
    Play,
    Share2,
    ShieldAlert,
    ShieldCheck,
    Sparkles,
    Star,
    Copy,
    X,
} from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useCityLookup } from "@/hooks/useCityLookup";
import { useCategoryLookup } from "@/hooks/useCategoryLookup";
import { PropertyCard } from "@/components/ui/PropertyCard";
import { useToggleSaveAd } from "@/hooks/useFavorites";

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
    const [saved, setSaved] = useState(false);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [showFullPhone, setShowFullPhone] = useState(false);
    const [isContactModalOpen, setIsContactModalOpen] = useState(false);

    const { isLoggedIn } = useAuth();
    const chatMutation = useCreateConversation();
    const toggleSaveMutation = useToggleSaveAd();
    const { data: ad, isLoading, error } = useAd(id);
    const { data: contact } = useAdContact(id);

    useEffect(() => {
        if (ad?.isSaved !== undefined) {
            setSaved(ad.isSaved);
        }
    }, [ad?.isSaved]);

    const handleToggleSave = async () => {
        if (!isLoggedIn) {
            toast.error('لطفاً ابتدا وارد حساب کاربری خود شوید');
            router.push(`/auth?returnUrl=/ads/${id}`);
            return;
        }
        const nextState = !saved;
        setSaved(nextState);
        try {
            await toggleSaveMutation.mutateAsync(id);
            toast.success(nextState ? 'آگهی در نشان‌شده‌ها ذخیره شد' : 'آگهی از نشان‌شده‌ها حذف شد');
        } catch {
            setSaved(!nextState);
        }
    };

    const { getCityName } = useCityLookup();
    const { getSubcategoryName, getCategoryName, getCategoryPathLabel } = useCategoryLookup();

    const cityName = ad?.cityName || getCityName(ad?.cityId);
    const provinceName = ad?.provinceName;

    const rawCatKey = ad?.categoryPath?.categoryKey;
    const rawSubKey = ad?.categoryPath?.subcategoryKey;

    const categoryTitle =
        ad?.categoryTitle ||
        ad?.categoryPath?.categoryTitle ||
        getCategoryName(rawCatKey);

    const subcategoryTitle =
        ad?.subcategoryTitle ||
        ad?.categoryPath?.subcategoryTitle ||
        getSubcategoryName(rawSubKey, rawCatKey);

    // Nearby / similar ads in the same city
    const { data: similarAds } = useAds(
        {
            cityId: ad?.cityId,
            limit: 4,
            status: "PUBLISHED",
        },
        { enabled: !!ad?.cityId }
    );

    // Collect all media items
    const mediaItems = useMemo(() => {
        if (!ad?.mediaIds || ad.mediaIds.length === 0) {
            return [{ id: "placeholder", url: "/property-placeholder.svg", isVideo: false, posterUrl: undefined }];
        }
        return ad.mediaIds.map((mId, index) => {
            const id = typeof mId === "string" ? mId : (mId.id || `media-${index}`);
            const type = typeof mId === "object" && mId !== null && "type" in mId ? mId.type : undefined;
            const isVideo = type === "VIDEO";
            return {
                id,
                url: getMediaUrl(mId),
                posterUrl: isVideo ? getMediaPosterUrl(mId) : undefined,
                isVideo,
            };
        });
    }, [ad?.mediaIds]);

    const activeMedia = mediaItems[activeImageIndex] || mediaItems[0] || { id: "placeholder", url: "/property-placeholder.svg", isVideo: false, posterUrl: undefined };

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
                        onClick={handleToggleSave}
                        className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center transition-colors active:scale-95",
                            saved ? "bg-red-500 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                        )}
                        title={saved ? "حذف از نشان‌شده‌ها" : "نشان کردن آگهی"}
                        aria-label="نشان کردن آگهی"
                    >
                        <Heart className={cn("w-4 h-4", saved && "fill-current")} />
                    </button>
                </div>
            </div>

            {/* Gallery Section */}
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
                            alt={ad.title}
                            fill
                            priority
                            className="object-cover transition-opacity duration-300"
                        />
                    )}
                    <div className="absolute top-4 right-4 flex items-center gap-1.5 z-10">
                        {subcategoryTitle && (
                            <span className="bg-brand/85 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                                {subcategoryTitle}
                            </span>
                        )}
                        {categoryTitle && categoryTitle !== subcategoryTitle && (
                            <span className="bg-black/40 backdrop-blur-md text-white/90 text-xs font-medium px-2.5 py-1 rounded-full">
                                {categoryTitle}
                            </span>
                        )}
                    </div>
                </div>

                {/* Thumbnails */}
                {mediaItems.length > 1 && (
                    <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                        {mediaItems.map((media, idx) => (
                            <button
                                key={media.id || idx}
                                onClick={() => setActiveImageIndex(idx)}
                                className={cn(
                                    "relative w-20 h-16 sm:w-24 sm:h-18 rounded-2xl overflow-hidden shrink-0 border-2 transition-all",
                                    activeImageIndex === idx ? "border-primary scale-105 shadow-md" : "border-transparent opacity-70 hover:opacity-100"
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

                        <div className="flex flex-wrap items-center gap-1.5 text-text-light text-sm mt-2">
                            <MapPin className="w-4 h-4 shrink-0 text-primary" />
                            <span>{provinceName ? `${provinceName}، ${cityName}` : `شهر: ${cityName}`}</span>
                            {categoryTitle && (
                                <>
                                    <span className="text-gray-300">•</span>
                                    <span>دسته: <strong className="font-bold text-text-main">{categoryTitle}</strong></span>
                                </>
                            )}
                            {subcategoryTitle && (
                                <>
                                    <span className="text-gray-300">•</span>
                                    <span>زیردسته: <strong className="font-bold text-text-main">{subcategoryTitle}</strong></span>
                                </>
                            )}
                            <span className="text-gray-300">•</span>
                            <span className="text-xs">
                                ثبت: {new Date(ad.createdAt).toLocaleDateString("fa-IR")}
                            </span>
                        </div>
                    </div>

                    {/* Category & Subcategory Pills */}
                    {(categoryTitle || subcategoryTitle) && (
                        <div className="flex flex-wrap items-center gap-2">
                            {categoryTitle && (
                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-xl border border-gray-100 text-xs">
                                    <span className="text-text-light">دسته اصلی:</span>
                                    <span className="font-bold text-brand">{categoryTitle}</span>
                                </div>
                            )}
                            {subcategoryTitle && (
                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-xl border border-primary/20 text-xs">
                                    <span className="text-primary/70">زیردسته:</span>
                                    <span className="font-bold">{subcategoryTitle}</span>
                                </div>
                            )}
                        </div>
                    )}

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
                            <button
                                onClick={() => setIsContactModalOpen(true)}
                                className="flex items-center justify-center gap-2 w-full py-3.5 bg-primary text-white font-bold text-sm rounded-2xl shadow-md hover:bg-primary/90 transition-all cursor-pointer"
                            >
                                <Phone className="w-4 h-4" />
                                <span>اطلاعات تماس آگهی‌دهنده</span>
                            </button>

                            <button
                                onClick={handleChat}
                                disabled={chatMutation.isPending}
                                className="flex items-center justify-center gap-2 w-full py-3.5 bg-brand text-white font-bold text-sm rounded-2xl shadow-md hover:bg-brand/90 transition-all disabled:opacity-50 cursor-pointer"
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
                                    location={getCityName(item.cityId || ad.cityId)}
                                    image={getMediaPosterUrl(item.mediaIds?.[0])}
                                    isVideo={item.mediaIds?.[0]?.type === "VIDEO"}
                                    category={
                                        getSubcategoryName(item.categoryPath?.subcategoryKey, item.categoryPath?.categoryKey) ||
                                        getCategoryName(item.categoryPath?.categoryKey) ||
                                        item.categoryPath?.subcategoryKey
                                    }
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
                    <button
                        onClick={() => setIsContactModalOpen(true)}
                        className="flex items-center gap-1.5 px-4 py-2.5 bg-primary text-white rounded-xl text-xs font-bold shadow-md shadow-primary/25 active:scale-95 transition-transform cursor-pointer"
                    >
                        <Phone className="w-4 h-4" />
                        <span>تماس</span>
                    </button>
                    <button
                        onClick={handleChat}
                        disabled={chatMutation.isPending}
                        className="flex items-center gap-1.5 px-4 py-2.5 bg-brand text-white rounded-xl text-xs font-bold hover:bg-brand/90 active:scale-95 transition-transform cursor-pointer"
                    >
                        <MessageCircle className="w-4 h-4" />
                        <span>چت</span>
                    </button>
                </div>
            </div>

            {/* RESPONSIVE CONTACT MODAL (Desktop Dialog / Mobile Drawer) */}
            {isContactModalOpen && (
                <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
                        onClick={() => setIsContactModalOpen(false)}
                    />

                    {/* Responsive Container */}
                    <div className="relative z-10 w-full md:max-w-md bg-white rounded-t-3xl md:rounded-3xl p-6 shadow-2xl transition-all max-h-[85vh] overflow-y-auto">
                        <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-primary/10 text-primary rounded-xl">
                                    <Phone className="w-4 h-4" />
                                </div>
                                <h3 className="font-black text-brand text-base">اطلاعات تماس آگهی‌دهنده</h3>
                            </div>
                            <button
                                onClick={() => setIsContactModalOpen(false)}
                                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-50 transition cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {!isLoggedIn ? (
                            <div className="text-center py-4 space-y-4">
                                <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
                                    <Lock className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-black text-brand text-sm mb-1">ورود به حساب کاربری</h4>
                                    <p className="text-xs text-text-light leading-relaxed">
                                        جهت مشاهده شماره تماس یا آغاز گفتگوی آنلاین، لطفاً ابتدا وارد حساب کاربری خود شوید.
                                    </p>
                                </div>
                                <button
                                    onClick={() => router.push(`/auth?returnUrl=/ads/${id}`)}
                                    className="w-full py-3 bg-primary text-white font-bold text-xs rounded-2xl shadow-sm hover:bg-primary/90 transition cursor-pointer"
                                >
                                    ورود به حساب کاربری
                                </button>
                            </div>
                        ) : contact?.phoneHidden || (!contact?.phoneNumber && !contact?.mobileNumber) ? (
                            <div className="space-y-4">
                                <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl flex items-start gap-3">
                                    <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                    <div className="text-xs">
                                        <h5 className="font-black text-amber-950 mb-1">شماره تماس مخفی شده است</h5>
                                        <p className="text-amber-900/80 leading-relaxed">
                                            به درخواست آگهی‌دهنده و جهت حفظ حریم خصوصی، شماره تلفن مستقیم مخفی شده است. شما می‌توانید از طریق چت آنلاین با ایشان در ارتباط باشید.
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
                                {(() => {
                                    const phoneNum = contact?.phoneNumber || contact?.mobileNumber || "";
                                    return (
                                        <>
                                            <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-between">
                                                <div>
                                                    <span className="text-[11px] text-text-light block mb-0.5">شماره تماس مستقیم:</span>
                                                    <span className="text-lg font-black text-brand tracking-widest font-mono" dir="ltr">
                                                        {toPersianDigits(phoneNum)}
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        if (navigator.clipboard) {
                                                            navigator.clipboard.writeText(phoneNum);
                                                            toast.success("شماره تماس کپی شد");
                                                        }
                                                    }}
                                                    className="p-2.5 bg-white border border-gray-200 hover:bg-gray-100 rounded-xl text-gray-600 transition shadow-xs cursor-pointer"
                                                    title="کپی شماره"
                                                >
                                                    <Copy className="w-4 h-4" />
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3 pt-1">
                                                <a
                                                    href={`tel:${phoneNum}`}
                                                    className="flex items-center justify-center gap-2 py-3.5 bg-primary text-white font-bold text-xs rounded-2xl shadow-sm hover:bg-primary/90 transition text-center"
                                                >
                                                    <Phone className="w-4 h-4" />
                                                    <span>تماس تلفنی</span>
                                                </a>
                                                <button
                                                    onClick={() => {
                                                        setIsContactModalOpen(false);
                                                        handleChat();
                                                    }}
                                                    disabled={chatMutation.isPending}
                                                    className="flex items-center justify-center gap-2 py-3.5 bg-brand text-white font-bold text-xs rounded-2xl shadow-sm hover:bg-brand/90 transition cursor-pointer"
                                                >
                                                    <MessageCircle className="w-4 h-4" />
                                                    <span>ارسال چت</span>
                                                </button>
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                        )}

                        <p className="mt-5 text-[11px] text-text-light text-center leading-relaxed">
                            قبل از هرگونه بیعانه یا معامله، هویت مالک و مدارک رسمی ملک را بررسی فرمایید.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
