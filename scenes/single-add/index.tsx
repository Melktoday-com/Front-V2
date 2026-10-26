"use client";

import { PromotionModal } from "@/components/promotions/PromotionModal";
import { PropertyCard } from "@/components/ui/PropertyCard";
import { useAd, useAdContact, useAds } from "@/hooks/useAds";
import { useAuth } from "@/hooks/useAuth";
import { useCategoryLookup } from "@/hooks/useCategoryLookup";
import { useCreateConversation } from "@/hooks/useChat";
import { useCityLookup } from "@/hooks/useCityLookup";
import { useToggleSaveAd } from "@/hooks/useFavorites";
import { useSafeBack } from "@/hooks/useSafeBack";
import { cn, formatAdPrice, formatPrice, getMediaPosterUrl, getMediaUrl, toPersianDigits } from "@/lib/utils";
import { getFloorArea } from "@/lib/location";
import { adsService } from "@/services/ads.service";
import { AdDetail, AdSummary, NamedReference, SubcategoryConfigResponse } from "@/types/api/ads.types";
import { AdStatus } from "@/types/api/enums";
import { useQuery } from "@tanstack/react-query";
import {
    Bed,
    Building,
    Building2,
    Calendar,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Copy,
    CreditCard,
    FileText,
    Heart,
    Layers,
    Lock,
    MapPin,
    Maximize2,
    MessageCircle,
    Minus,
    Pencil,
    Phone,
    Play,
    Share2,
    ShieldAlert,
    ShieldCheck,
    Sparkles,
    Tag,
    X,
    LucideIcon
} from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
    [AdStatus.PUBLISHED]: {
        label: "منتشر شده",
        bg: "bg-success-subtle/80",
        text: "text-success",
        border: "border-success/30",
    },
    [AdStatus.DRAFT]: {
        label: "پیش‌نویس",
        bg: "bg-surface-secondary",
        text: "text-foreground-secondary",
        border: "border-border-subtle",
    },
    [AdStatus.PENDING_APPROVAL]: {
        label: "در حال بررسی",
        bg: "bg-warning-subtle/80",
        text: "text-warning",
        border: "border-warning/30",
    },
    [AdStatus.REJECTED]: {
        label: "رد شده",
        bg: "bg-error-subtle/80",
        text: "text-error",
        border: "border-error/30",
    },
    [AdStatus.ARCHIVED]: {
        label: "بایگانی شده",
        bg: "bg-purple-50",
        text: "text-purple-700",
        border: "border-purple-200",
    },
};

const Map = dynamic(() => import("@/components/ui/Map"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full min-h-[260px] bg-soft-bg animate-pulse rounded-2xl flex items-center justify-center text-text-light text-sm font-bold">
            در حال بارگذاری نقشه...
        </div>
    ),
});

function getAdSummaryPricing(pricing?: Record<string, number | boolean | string> | null): { price: string | number; unit?: string } {
    if (!pricing) return { price: "توافقی" };
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

interface SingleAdSceneProps {
    adId?: string;
    initialData?: AdDetail;
}

export default function SingleAdScene({ adId, initialData }: SingleAdSceneProps = {}) {
    const params = useParams();
    const id = adId || ((params?.id as string) || initialData?.adId) || "";
    const router = useRouter();
    const handleBack = useSafeBack("/");
    const [saved, setSaved] = useState(false);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [showFullPhone, setShowFullPhone] = useState(false);
    const [isContactModalOpen, setIsContactModalOpen] = useState(false);
    const [isPromotionModalOpen, setIsPromotionModalOpen] = useState(false);

    const { user, isLoggedIn } = useAuth();
    const chatMutation = useCreateConversation();
    const toggleSaveMutation = useToggleSaveAd();
    const { data: ad, isLoading, error } = useAd(id, initialData);
    const { data: contact } = useAdContact(id, { enabled: !!id && isLoggedIn });

    const isOwner = isLoggedIn && !!user?.userId && user?.userId === ad?.ownerId;
    const isPublished = ad?.status === AdStatus.PUBLISHED || (ad?.status as string) === "PUBLISHED";
    const isPromoted = Boolean(ad?.isFeatured);
    const isEligibleForPromotion = isOwner && isPublished;
    const isRegularUser = !ad?.publisher || ad?.publisher?.type === "user" || ad?.publisher?.type === "platform";

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

    const location = ad?.location;
    const cityName = location?.city?.name || ad?.cityName || getCityName(ad?.cityId);
    const neighbourhoodName = location?.neighbourhood?.name;
    const provinceName = location?.province?.name || ad?.provinceName;
    const areaName = neighbourhoodName;

    const rawCatKey = ad?.categoryPath?.categoryKey || ad?.category?.id;
    const rawSubKey = ad?.categoryPath?.subcategoryKey || ad?.subcategory?.id;

    const categoryTitle =
        ad?.categoryTitle ||
        ad?.categoryPath?.categoryTitle ||
        getCategoryName(rawCatKey);

    const subcategoryTitle =
        ad?.subcategoryTitle ||
        ad?.categoryPath?.subcategoryTitle ||
        getSubcategoryName(rawSubKey, rawCatKey);

    // Fetch dynamic subcategory config to support any subcategory schema
    const { data: subcatConfig } = useQuery<SubcategoryConfigResponse>({
        queryKey: ["subcategory-config", rawSubKey, rawCatKey],
        queryFn: () => adsService.getSubcategoryConfig(rawSubKey!, rawCatKey),
        enabled: Boolean(rawSubKey),
        staleTime: 1000 * 60 * 60,
    });

    // Similar ads filtered by subcategory and city
    const { data: similarAds } = useAds(
        {
            cityId: ad?.cityId,
            categoryKey: rawCatKey,
            subcategoryKey: rawSubKey,
            limit: 12,
            status: "PUBLISHED",
        },
        { enabled: Boolean(ad && (rawSubKey || ad?.cityId)) }
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
            }).catch(() => { });
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

    if (pricing.depositPrice !== undefined && pricing.monthlyRent !== undefined) {
        priceMain = `رهن: ${formatAdPrice(Number(pricing.depositPrice))}`;
        priceSub = `اجاره ماهانه: ${formatAdPrice(Number(pricing.monthlyRent))}`;
    } else if (pricing.totalPrice !== undefined) {
        const total = Number(pricing.totalPrice);
        priceMain = total > 0 ? formatAdPrice(total) : "توافقی";
    } else if (pricing.depositPrice !== undefined) {
        const dep = Number(pricing.depositPrice);
        priceMain = dep > 0 ? `ودیعه: ${formatAdPrice(dep)}` : "توافقی";
    } else if (pricing.monthlyRent !== undefined) {
        const rent = Number(pricing.monthlyRent);
        priceMain = rent > 0 ? `اجاره: ${formatAdPrice(rent)}` : "توافقی";
    } else if (pricing.estimatedTotalPrice !== undefined) {
        const est = Number(pricing.estimatedTotalPrice);
        priceMain = est > 0 ? `پیش‌بینی: ${formatAdPrice(est)}` : "توافقی";
    } else if (pricing.goodwillPrice !== undefined) {
        const gw = Number(pricing.goodwillPrice);
        priceMain = gw > 0 ? `سرقفلی: ${formatAdPrice(gw)}` : "توافقی";
    } else if (pricing.fractionPrice !== undefined) {
        const frac = Number(pricing.fractionPrice);
        priceMain = frac > 0 ? `قدرالسهم: ${formatAdPrice(frac)}` : "توافقی";
    } else if (pricing.prepaymentAmount !== undefined) {
        const prep = Number(pricing.prepaymentAmount);
        priceMain = prep > 0 ? `پیش‌پرداخت: ${formatAdPrice(prep)}` : "توافقی";
        if (pricing.monthlyLeaseInstallment !== undefined) {
            priceSub = `اجاره ماهانه: ${formatAdPrice(Number(pricing.monthlyLeaseInstallment))}`;
        }
    }

    if (pricing.prepaidMonths !== undefined && !priceSub) {
        priceSub = `پیش‌پرداخت: ${toPersianDigits(String(pricing.prepaidMonths))} ماه`;
    }

    // Business model label (Server schema first, then categoryPath)
    const rawModel = ad.categoryPath?.businessModelKey;
    const dynamicPriceModel = subcatConfig?.allowedPriceModels?.find(
        (m) => m.key?.toLowerCase() === rawModel?.toLowerCase() || m.id?.toLowerCase() === rawModel?.toLowerCase()
    );
    const businessModelTitle =
        dynamicPriceModel?.displayName ||
        ad.categoryPath?.businessModelTitle ||
        rawModel ||
        null;

    // Attributes extraction supporting all subcategories dynamically
    const rawAttrs = (ad.attributes as Record<string, any>) || {};
    const booleanFeatures: { key: string; label: string; value: boolean }[] = [];
    const technicalSpecs: { key: string; label: string; displayValue: string }[] = [];
    const processedKeys = new Set<string>();

    const attributeList = ad.attributeList || [];

    // 1. Process items from attributeList provided by backend
    if (attributeList.length > 0) {
        for (const item of attributeList) {
            processedKeys.add(item.key);
            const isBool = typeof item.value === "boolean" ||
                item.displayValue === "دارد" ||
                item.displayValue === "ندارد";

            if (isBool) {
                const val = typeof item.value === "boolean" ? item.value : item.displayValue === "دارد";
                booleanFeatures.push({ key: item.key, label: item.label, value: val });
            } else {
                technicalSpecs.push({
                    key: item.key,
                    label: item.label,
                    displayValue: item.displayValue || String(item.value ?? "—"),
                });
            }
        }
    }

    // 2. Dynamically process any raw attributes from ad.attributes not in attributeList
    const attrDefs = subcatConfig?.attributeDefinitions || [];
    for (const [key, rawVal] of Object.entries(rawAttrs)) {
        if (processedKeys.has(key)) continue;
        if (rawVal === undefined || rawVal === null || rawVal === "") continue;

        processedKeys.add(key);

        const def = attrDefs.find((d) => d.key === key);
        const label = def?.label || key;
        const isBool = def?.type === "BOOLEAN" || typeof rawVal === "boolean";

        if (isBool) {
            booleanFeatures.push({
                key,
                label,
                value: Boolean(rawVal),
            });
        } else {
            let displayVal = String(rawVal);
            if (def?.type === "SELECT" && def.options) {
                const opt = def.options.find((o) => o.key === String(rawVal));
                if (opt) displayVal = opt.label;
            } else if (typeof rawVal === "number") {
                displayVal = toPersianDigits(rawVal);
            }
            technicalSpecs.push({
                key,
                label,
                displayValue: displayVal,
            });
        }
    }

    const getAttributeIcon = (key: string) => {
        const k = key.toLowerCase();
        if (k.includes("area") || k.includes("meterage") || k.includes("size") || k.includes("land") || k.includes("shed")) return Maximize2;
        if (k.includes("room") || k.includes("bed")) return Bed;
        if (k.includes("floor") || k.includes("unit") || k.includes("level")) return Layers;
        if (k.includes("year") || k.includes("date") || k.includes("age") || k.includes("construction")) return Calendar;
        if (k.includes("width") || k.includes("height") || k.includes("passage") || k.includes("frontage")) return Building;
        if (k.includes("price") || k.includes("rent") || k.includes("deposit") || k.includes("share") || k.includes("percent")) return Tag;
        if (k.includes("deed") || k.includes("permit") || k.includes("document") || k.includes("contract")) return FileText;
        return Building2;
    };

    // Top Key Specs Chips (Dynamically adapt to any property category based on technicalSpecs)
    const keyMetrics: { label: string; value: string; icon: LucideIcon }[] = [];

    const topArea = getFloorArea(ad) || rawAttrs.land_area || rawAttrs.building_area || rawAttrs.shed_area || rawAttrs.meterage;
    if (topArea && !technicalSpecs.some(s => s.key.toLowerCase().includes("area"))) {
        keyMetrics.push({
            label: "متراژ",
            value: `${toPersianDigits(topArea)} متر`,
            icon: Maximize2,
        });
    }

    for (const spec of technicalSpecs) {
        if (keyMetrics.length >= 4) break;
        keyMetrics.push({
            label: spec.label,
            value: spec.displayValue,
            icon: getAttributeIcon(spec.key),
        });
    }

    const hasFinancialDetails = Boolean(
        businessModelTitle ||
        pricing.monthlyRent !== undefined ||
        pricing.depositPrice !== undefined ||
        pricing.prepaidMonths !== undefined ||
        pricing.totalPrice !== undefined ||
        pricing.prepaymentAmount !== undefined ||
        pricing.monthlyLeaseInstallment !== undefined ||
        pricing.goodwillPrice !== undefined ||
        pricing.fractionPrice !== undefined ||
        rawAttrs.owner_share_percentage !== undefined ||
        rawAttrs.developer_gratuitous_payment !== undefined
    );

    const statusConfig = STATUS_CONFIG[ad.status] || STATUS_CONFIG.PUBLISHED;

    const coords = location?.coordinates;
    const lat = coords?.latitude;
    const lng = coords?.longitude;
    const hasCoords = typeof lat === "number" && typeof lng === "number" && !(lat === 0 && lng === 0);

    const handleCopyId = () => {
        if (typeof navigator !== "undefined" && navigator.clipboard) {
            navigator.clipboard.writeText(ad.adId);
            toast.success("کد آگهی در حافظه کپی شد");
        }
    };

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-32 lg:pb-12">
            {/* Top Navigation & Breadcrumb */}
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
                        className="w-10 h-10 rounded-full bg-surface-secondary hover:bg-gray-200 flex items-center justify-center text-text-main transition-colors"
                        title="اشتراک‌گذاری"
                    >
                        <Share2 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={handleToggleSave}
                        className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center transition-colors active:scale-95",
                            saved ? "bg-red-500 text-white" : "bg-surface-secondary hover:bg-gray-200 text-foreground-secondary"
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
                <div className="relative w-full aspect-[16/10] sm:aspect-[16/8] rounded-3xl overflow-hidden bg-surface-secondary shadow-md">
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
                        {ad.isDecorativeImages && (
                            <span className="bg-amber-600/90 backdrop-blur-md text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
                                تصاویر تزئینی است
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
                    {/* Status Alert Banner for non-published ads */}
                    {!isPublished && (
                        <div className={cn(
                            "p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3",
                            statusConfig.bg,
                            statusConfig.border
                        )}>
                            <div className="flex items-center gap-2.5">
                                <ShieldAlert className={cn("w-5 h-5 shrink-0", statusConfig.text)} />
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-medium text-foreground-secondary">وضعیت آگهی:</span>
                                        <span className={cn("text-xs font-black px-2 py-0.5 rounded-full border", statusConfig.bg, statusConfig.border, statusConfig.text)}>
                                            {statusConfig.label}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-foreground-muted mt-0.5">
                                        {ad.status === AdStatus.DRAFT
                                            ? "این آگهی در حالت پیش‌نویس است و هنوز در سایت منتشر نشده است."
                                            : ad.status === AdStatus.PENDING_APPROVAL
                                                ? "این آگهی در دست بررسی کارشناسان ملک تودی است."
                                                : ad.status === AdStatus.REJECTED
                                                    ? "این آگهی تایید نشده است. لطفاً برای ویرایش اقدام نمایید."
                                                    : "این آگهی بایگانی یا غیرفعال شده است."}
                                    </p>
                                </div>
                            </div>
                            {isOwner && (
                                <button
                                    onClick={() => router.push(`/submit-ad?edit=${ad.adId}`)}
                                    className="flex items-center justify-center gap-1.5 px-4 py-2 bg-brand text-white rounded-xl text-xs font-bold hover:bg-brand/90 transition-colors shrink-0 shadow-xs cursor-pointer"
                                >
                                    <Pencil className="w-3.5 h-3.5" />
                                    <span>ویرایش آگهی</span>
                                </button>
                            )}
                        </div>
                    )}

                    {/* Title & Price Header */}
                    <div className="border-b border-border-subtle pb-6">

                        <div className="flex items-start justify-between gap-3 mt-3">
                            <h1 className="text-lg sm:text-2xl font-bold text-text-main">
                                {ad.title}
                            </h1>
                            {ad.isDecorativeImages && (
                                <span className="shrink-0 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-bold">
                                    تصاویر تزئینی است
                                </span>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 text-text-light text-sm mt-2">
                            <MapPin className="w-4 h-4 shrink-0 text-primary" />
                            <span>
                                {provinceName
                                    ? `${provinceName}، ${cityName}${areaName ? `، ${areaName}` : ""}`
                                    : `شهر: ${cityName}${areaName ? `، ${areaName}` : ""}`}
                            </span>
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
                                ثبت: {ad.createdAt ? new Date(ad.createdAt).toLocaleDateString("fa-IR") : "—"}
                            </span>
                        </div>

                    </div>

                    {/* Financial Terms Card */}
                    {hasFinancialDetails && (
                        <div className="bg-surface-secondary/50 rounded-2xl p-5 border border-border-subtle space-y-4">
                            <div className="flex items-center justify-between border-b border-border-subtle/70 pb-3">
                                <div className="flex items-center gap-2">
                                    <CreditCard className="w-5 h-5 text-primary" />
                                    <h2 className="text-sm sm:text-base font-black text-brand">شرایط مالی و قرارداد</h2>
                                </div>
                                {businessModelTitle && (
                                    <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-primary/10 text-primary border border-primary/20">
                                        {businessModelTitle}
                                    </span>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs sm:text-sm">
                                {pricing.depositPrice !== undefined && (
                                    <div className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border-subtle/60">
                                        <span className="text-text-light">مبلغ ودیعه / رهن:</span>
                                        <span className="font-black text-brand">
                                            {Number(pricing.depositPrice) > 0 ? formatPrice(Number(pricing.depositPrice)) : "توافقی"}
                                        </span>
                                    </div>
                                )}
                                {pricing.monthlyRent !== undefined && (
                                    <div className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border-subtle/60">
                                        <span className="text-text-light">اجاره ماهیانه:</span>
                                        <span className="font-black text-brand">
                                            {Number(pricing.monthlyRent) > 0 ? formatPrice(Number(pricing.monthlyRent)) : "توافقی"}
                                        </span>
                                    </div>
                                )}
                                {pricing.prepaidMonths !== undefined && (
                                    <div className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border-subtle/60">
                                        <span className="text-text-light">پیش‌پرداخت اجاره:</span>
                                        <span className="font-black text-brand">
                                            {toPersianDigits(String(pricing.prepaidMonths))} ماه
                                        </span>
                                    </div>
                                )}
                                {pricing.totalPrice !== undefined && (
                                    <div className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border-subtle/60">
                                        <span className="text-text-light">قیمت کل:</span>
                                        <span className="font-black text-brand">
                                            {Number(pricing.totalPrice) > 0 ? formatPrice(Number(pricing.totalPrice)) : "توافقی"}
                                        </span>
                                    </div>
                                )}
                                {pricing.prepaymentAmount !== undefined && (
                                    <div className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border-subtle/60">
                                        <span className="text-text-light">پیش‌پرداخت اولیه:</span>
                                        <span className="font-black text-brand">
                                            {formatPrice(Number(pricing.prepaymentAmount))}
                                        </span>
                                    </div>
                                )}
                                {pricing.monthlyLeaseInstallment !== undefined && (
                                    <div className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border-subtle/60">
                                        <span className="text-text-light">قسط ماهانه:</span>
                                        <span className="font-black text-brand">
                                            {formatPrice(Number(pricing.monthlyLeaseInstallment))}
                                        </span>
                                    </div>
                                )}
                                {pricing.goodwillPrice !== undefined && (
                                    <div className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border-subtle/60">
                                        <span className="text-text-light">حق سرقفلی:</span>
                                        <span className="font-black text-brand">
                                            {formatPrice(Number(pricing.goodwillPrice))}
                                        </span>
                                    </div>
                                )}
                                {pricing.fractionPrice !== undefined && (
                                    <div className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border-subtle/60">
                                        <span className="text-text-light">قدرالسهم:</span>
                                        <span className="font-black text-brand">
                                            {formatPrice(Number(pricing.fractionPrice))}
                                        </span>
                                    </div>
                                )}
                                {rawAttrs.owner_share_percentage !== undefined && (
                                    <div className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border-subtle/60">
                                        <span className="text-text-light">درصد سهم مالک:</span>
                                        <span className="font-black text-brand">
                                            {toPersianDigits(rawAttrs.owner_share_percentage)}٪
                                        </span>
                                    </div>
                                )}
                                {rawAttrs.developer_gratuitous_payment !== undefined && (
                                    <div className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border-subtle/60">
                                        <span className="text-text-light">مبلغ بلاعوض پیشنهادی:</span>
                                        <span className="font-black text-brand">
                                            {formatPrice(Number(rawAttrs.developer_gratuitous_payment))}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Key Specs Row (Dynamic top chips adapting to any subcategory) */}
                    {keyMetrics.length > 0 && (
                        <div className={cn(
                            "grid gap-3 bg-surface-secondary/70 p-4 rounded-2xl border border-border-subtle",
                            keyMetrics.length === 1 ? "grid-cols-1" :
                                keyMetrics.length === 2 ? "grid-cols-2" :
                                    keyMetrics.length === 3 ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-4"
                        )}>
                            {keyMetrics.map((m, idx) => {
                                const IconComp = m.icon;
                                return (
                                    <div key={idx} className="flex flex-col items-center justify-center p-2 text-center">
                                        <IconComp className="w-5 h-5 text-text-light mb-1" />
                                        <span className="text-xs text-text-light">{m.label}</span>
                                        <span className="text-sm font-black text-brand truncate max-w-full">{m.value}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Amenities & Boolean Features */}
                    {booleanFeatures.length > 0 && (
                        <div className="space-y-3">
                            <h2 className="text-base font-black text-brand">امکانات اصلی ملک</h2>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {booleanFeatures.map((feat) => (
                                    <div
                                        key={feat.key}
                                        className={cn(
                                            "flex items-center justify-between p-3 rounded-xl border text-xs font-bold transition-colors",
                                            feat.value
                                                ? "bg-success-subtle/50 border-success/30 text-success"
                                                : "bg-surface-secondary border-border-subtle text-foreground-muted"
                                        )}
                                    >
                                        <span>{feat.label}</span>
                                        {feat.value ? (
                                            <span className="flex items-center gap-1 text-[11px] font-black text-success">
                                                دارد
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-[11px] text-foreground-muted">
                                                ندارد
                                                <Minus className="w-3.5 h-3.5" />

                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Technical Specifications / Attribute List */}
                    {technicalSpecs.length > 0 && (
                        <div className="space-y-3">
                            <h2 className="text-base font-black text-brand">مشخصات و ویژگی‌های فنی</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {technicalSpecs.map((spec) => (
                                    <div
                                        key={spec.key}
                                        className="flex items-center justify-between p-3.5 rounded-xl bg-surface-secondary/50 border border-border-subtle text-xs sm:text-sm"
                                    >
                                        <span className="text-text-light font-medium">{spec.label}</span>
                                        <span className="font-bold text-brand">{spec.displayValue}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Description */}
                    <div className="space-y-3">
                        <h2 className="text-base font-black text-brand">توضیحات</h2>
                        <div className="bg-surface-secondary/60 p-5 rounded-2xl border border-border-subtle text-sm text-text-main leading-relaxed whitespace-pre-line">
                            {ad.description || "توضیحاتی برای این آگهی ثبت نشده است."}
                        </div>
                    </div>

                    {/* Map Location */}
                    {hasCoords && (
                        <div className="space-y-3">
                            <h2 className="text-base font-black text-brand">موقعیت روی نقشه</h2>
                            <div className="h-64 rounded-2xl overflow-hidden border border-border-subtle shadow-xs">
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
                <div className={cn("space-y-6", isRegularUser && "hidden lg:block")}>
                    <div className="sticky top-6 bg-surface p-6 rounded-3xl border border-border-subtle shadow-lg space-y-5">
                        <h3 className="font-black text-brand text-base border-b border-border-subtle pb-3">
                            اطلاعات تماس آگهی‌دهنده
                        </h3>

                        {/* Publisher Info */}
                        <div className="flex items-center gap-3">
                            {ad.publisher?.avatar ? (
                                <img
                                    src={ad.publisher.avatar}
                                    alt={ad.publisher.name}
                                    className="w-12 h-12 rounded-full object-cover border border-border-subtle shadow-xs shrink-0"
                                />
                            ) : (
                                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-lg shrink-0">
                                    {ad.publisher?.name ? ad.publisher.name.charAt(0) : "م"}
                                </div>
                            )}
                            <div className="min-w-0 flex-1">
                                <h4 className="font-bold text-sm text-brand truncate">
                                    {ad.publisher?.name || "آگهی‌دهنده ملک‌تودی"}
                                </h4>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    {ad.publisher?.type === "agency" && (
                                        <span className="text-[11px] text-text-light font-medium">مشاور املاک / آژانس</span>
                                    )}
                                    {ad.publisher?.type === "host" && (
                                        <span className="text-[11px] text-text-light font-medium">میزبان اقامتگاه</span>
                                    )}
                                    {(!ad.publisher || ad.publisher.type === "user" || ad.publisher.type === "platform") && (
                                        <span className="text-[11px] text-text-light font-medium">
                                            {ad.publisher?.type === "platform" ? "سامانه ملک‌تودی" : "کاربر ملک‌تودی"}
                                        </span>
                                    )}
                                    {ad.publisher?.isVerified && (
                                        <span className="text-[11px] text-primary flex items-center gap-0.5 font-bold">
                                            <ShieldCheck className="w-3.5 h-3.5" />
                                            تایید شده
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Showcase link if publisher is host or agency */}
                        {ad.publisher && ad.publisher.type !== "user" && ad.publisher.slug && (
                            <button
                                onClick={() => router.push(ad.publisher!.type === "host" ? `/host/${ad.publisher!.slug}` : `/agency/showcase/${ad.publisher!.slug}`)}
                                className="w-full py-2.5 px-3 rounded-xl border border-border-subtle/80 hover:bg-surface-secondary text-xs font-bold text-brand flex items-center justify-between transition-colors cursor-pointer"
                            >
                                <span>{ad.publisher.type === "host" ? "مشاهده پروفایل و سایر اقامتگاه‌ها" : "مشاهده ویترین و آگهی‌های آژانس"}</span>
                                <ChevronLeft className="w-4 h-4 text-foreground-muted" />
                            </button>
                        )}

                        <div className="space-y-3 pt-2">
                            {isOwner ? (
                                <>
                                    <div className="p-3.5 bg-warning-subtle/70 border border-warning/30/80 rounded-2xl flex items-center gap-2.5 text-xs font-bold text-amber-950">
                                        <ShieldCheck className="w-4 h-4 text-warning shrink-0" />
                                        <span>این آگهی توسط شما ثبت شده است.</span>
                                    </div>

                                    {/* Already promoted indicator */}
                                    {isPublished && isPromoted && (
                                        <div className="flex items-center justify-center gap-2 w-full py-3 bg-warning-subtle border border-warning/30 text-warning font-black text-xs rounded-2xl shadow-xs">
                                            <Sparkles className="w-4 h-4 text-warning" />
                                            <span>آگهی شما ارتقا یافته است (فوری / ویژه)</span>
                                        </div>
                                    )}

                                    {/* Promotion Action if eligible */}
                                    {isEligibleForPromotion && (
                                        <button
                                            onClick={() => setIsPromotionModalOpen(true)}
                                            className="flex items-center justify-center gap-2 w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-sm rounded-2xl shadow-md shadow-orange-500/20 active:scale-98 transition-all cursor-pointer"
                                        >
                                            <Sparkles className="w-4 h-4" />
                                            <span>{isPromoted ? "نردبان مجدد آگهی" : "ارتقای آگهی (فوری / نردبان)"}</span>
                                        </button>
                                    )}

                                    {/* Not published notice */}
                                    {!isPublished && (
                                        <div className="p-2.5 bg-surface-secondary border border-border-subtle text-foreground-secondary text-xs text-center rounded-xl font-medium">
                                            {ad?.status === AdStatus.PENDING_APPROVAL
                                                ? "آگهی در انتظار بررسی و تایید کارشناسان است"
                                                : "آگهی در حالت فعال نمی‌باشد"}
                                        </div>
                                    )}

                                    {/* Owner edit action */}
                                    <button
                                        onClick={() => router.push(`/ads/submit?edit=${ad.adId}`)}
                                        className="flex items-center justify-center gap-2 w-full py-3 bg-brand/5 hover:bg-brand/10 text-brand font-bold text-xs rounded-2xl border border-brand/20 transition-all cursor-pointer active:scale-98"
                                    >
                                        <Pencil className="w-4 h-4" />
                                        <span>ویرایش اطلاعات آگهی</span>
                                    </button>

                                    <button
                                        onClick={() => router.push(`/profile/ads`)}
                                        className="w-full py-2 text-center text-xs text-secondary hover:text-brand font-bold transition-colors cursor-pointer"
                                    >
                                        مدیریت در پنل کاربری
                                    </button>
                                </>
                            ) : (
                                <>
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
                                </>
                            )}
                        </div>

                        <p className="text-[11px] text-text-light text-center leading-relaxed">
                            قبل از انجام معامله حضوری یا پرداخت ودیعه، حتماً از اصالت سند و هویت مالک اطمینان حاصل فرمایید.
                        </p>
                    </div>
                </div>
            </div>

            {/* Similar Ads Section */}
            {(() => {
                const filteredSimilar = (similarAds?.items || []).filter((a) => {
                    if (a.adId === id) return false;
                    const itemSubKey = a.categoryPath?.subcategoryKey || a.subcategory?.id;
                    const itemCatKey = a.categoryPath?.categoryKey || a.category?.id;
                    if (rawSubKey && itemSubKey && itemSubKey !== rawSubKey) return false;
                    if (rawCatKey && itemCatKey && itemCatKey !== rawCatKey) return false;
                    return true;
                });

                if (filteredSimilar.length === 0) return null;

                return (
                    <section className="mt-14 pt-8 border-t border-border-subtle">
                        <h2 className="text-xl font-black text-brand mb-6">آگهی‌های مشابه</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {filteredSimilar
                                .slice(0, 4)
                                .map((item: AdSummary) => (
                                    <PropertyCard
                                        key={item.adId}
                                        adId={item.adId}
                                        title={item.title}
                                        price={getAdSummaryPricing(item.pricing).price}
                                        unit={getAdSummaryPricing(item.pricing).unit}
                                        location={getCityName(item.cityId || ad.cityId)}
                                        image={getMediaPosterUrl(item.mediaIds?.[0])}
                                        isVideo={item.mediaIds?.[0]?.type === "VIDEO"}
                                        category={
                                            getSubcategoryName(item.categoryPath?.subcategoryKey, item.categoryPath?.categoryKey) ||
                                            getCategoryName(item.categoryPath?.categoryKey) ||
                                            item.categoryPath?.subcategoryKey
                                        }
                                        publisher={item.publisher}
                                        date={item.createdAt}
                                    />
                                ))}
                        </div>
                    </section>
                );
            })()}

            {/* Sticky Mobile Bottom Bar (Zillow mobile pattern) */}
            <div className="fixed bottom-0 left-0 right-0 p-3.5 bg-surface/95 backdrop-blur-xl border-t border-border-subtle/70 flex items-center justify-between gap-3 z-40 lg:hidden shadow-2xl">
                <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-[11px] text-text-light font-bold">قیمت</span>
                    <span className="text-sm font-black text-brand truncate">{priceMain}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
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
                                <span className="flex items-center gap-1 px-2.5 py-2 bg-warning-subtle text-warning rounded-xl text-xs font-bold">
                                    <Sparkles className="w-3.5 h-3.5 text-warning" />
                                    <span>ارتقا یافته</span>
                                </span>
                            )}
                            <button
                                onClick={() => router.push(`/ads/submit?edit=${ad.adId}`)}
                                className="flex items-center gap-1.5 px-3 py-2.5 bg-brand text-white rounded-xl text-xs font-bold active:scale-95 transition-transform cursor-pointer"
                            >
                                <Pencil className="w-3.5 h-3.5" />
                                <span>ویرایش</span>
                            </button>
                        </>
                    ) : (
                        <>
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
                        </>
                    )}
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
                    <div className="relative z-10 w-full md:max-w-md bg-surface rounded-t-3xl md:rounded-3xl p-6 shadow-2xl transition-all max-h-[85vh] overflow-y-auto">
                        <div className="flex items-center justify-between pb-4 border-b border-border-subtle mb-5">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-primary/10 text-primary rounded-xl">
                                    <Phone className="w-4 h-4" />
                                </div>
                                <h3 className="font-black text-brand text-base">اطلاعات تماس آگهی‌دهنده</h3>
                            </div>
                            <button
                                onClick={() => setIsContactModalOpen(false)}
                                className="p-1.5 text-foreground-muted hover:text-foreground-secondary rounded-xl hover:bg-surface-secondary transition cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {!isLoggedIn ? (
                            <div className="text-center py-4 space-y-4">
                                <div className="w-12 h-12 bg-warning-subtle text-warning rounded-2xl flex items-center justify-center mx-auto">
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
                                <div className="p-4 bg-warning-subtle/70 border border-warning/30/80 rounded-2xl flex items-start gap-3">
                                    <ShieldAlert className="w-5 h-5 text-warning shrink-0 mt-0.5" />
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
                                            <div className="p-4 bg-surface-secondary border border-border-subtle rounded-2xl flex items-center justify-between">
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
                                                    className="p-2.5 bg-surface border border-border-subtle hover:bg-surface-secondary rounded-xl text-foreground-secondary transition shadow-xs cursor-pointer"
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

            {/* Promotion Modal */}
            <PromotionModal
                isOpen={isPromotionModalOpen}
                onClose={() => setIsPromotionModalOpen(false)}
                listingId={id}
                listingTitle={ad?.title || ""}
            />
        </div>
    );
}
