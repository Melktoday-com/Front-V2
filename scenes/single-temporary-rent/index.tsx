"use client";

import { PromotionModal } from "@/components/promotions/PromotionModal";
import { ReviewsSection } from "@/components/ui/ReviewsSection";
import { ErrorState } from "@/components/ui/StatusStates";
import { TemporaryRentCard } from "@/components/ui/TemporaryRentCard";
import { useAuth } from "@/hooks/useAuth";
import { useCreateConversation } from "@/hooks/useChat";
import { useCityLookup } from "@/hooks/useCityLookup";
import { useToggleSaveTemporaryRent } from "@/hooks/useFavorites";
import { useSafeBack } from "@/hooks/useSafeBack";
import { useShowcase } from "@/hooks/useShowcase";
import { useTemporaryRentAdDetail, useTemporaryRentAds } from "@/hooks/useTemporaryRent";
import { formatLocationDisplay, getFloorArea } from "@/lib/location";
import { cn, formatPrice, getMediaPosterUrl, getMediaUrl, toPersianDigits } from "@/lib/utils";
import { temporaryRentService } from "@/services/temporary-rent.service";
import { AdStatus } from "@/types/api/enums";
import type { TemporaryRentAd, TemporaryRentContactInfo, TemporaryRentPricingReadModel } from "@/types/api/temporary-rent.types";
import {
    Bath,
    Bed,
    Building2,
    Calendar,
    CheckCircle2,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Clock,
    Copy,
    CreditCard,
    FileText,
    Heart,
    Info,
    Layers,
    Loader2,
    Lock,
    LucideIcon,
    MapPin,
    Maximize2,
    MessageCircle,
    Minus,
    Pencil,
    Phone,
    Play,
    Plus,
    Share2,
    ShieldAlert,
    ShieldCheck,
    Sparkles,
    Star,
    Tag,
    Users,
    X,
} from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
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

function getResidenceRate(pricing?: TemporaryRentPricingReadModel | null): number {
    if (!pricing?.pricing) return 0;
    const p = pricing.pricing as any;
    switch (pricing.priceModelKey) {
        case "DAILY_RENT_STANDARD":
        case "WEEKLY_MONTHLY_RENT":
            return p.nightlyPrice || 0;
        case "WEEKEND_PEAK_RENT":
            return p.midweekNightlyPrice || p.weekendNightlyPrice || p.nightlyPrice || 0;
        case "EVENT_VENUE_RENT":
            return p.eventBasePrice || p.nightlyPrice || 0;
        default:
            return p.nightlyPrice || 0;
    }
}

interface ResidenceDetailSceneProps {
    initialData?: TemporaryRentAd;
}

export default function ResidenceDetailScene({ initialData }: ResidenceDetailSceneProps = {}) {
    const params = useParams();
    const id = ((params?.id as string) || initialData?.id) || "";
    const router = useRouter();
    const handleBack = useSafeBack("/");

    const { isLoggedIn, user } = useAuth();
    const chatMutation = useCreateConversation();
    const [showReviews, setShowReviews] = useState(false);

    const { data: residence, isLoading, error, refetch } = useTemporaryRentAdDetail(id, initialData);
    const isOwner = Boolean(user && residence?.ownerId && user.userId === residence.ownerId);
    const isPublished = residence?.status === AdStatus.PUBLISHED;
    const isPromoted = Boolean((residence as any)?.isUrgent || (residence as any)?.isLadder);
    const isEligibleForPromotion = isOwner && isPublished;

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
            toast.error("لطفاً ابتدا وارد حساب کاربری خود شوید");
            router.push(`/auth?returnUrl=/temporary-rent/${id}`);
            return;
        }
        const nextState = !saved;
        setSaved(nextState);
        try {
            await toggleSaveTempMutation.mutateAsync(id);
            toast.success(nextState ? "اقامتگاه در نشان‌شده‌ها ذخیره شد" : "اقامتگاه از نشان‌شده‌ها حذف شد");
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
            router.push(`/auth?returnUrl=/temporary-rent/${id}`);
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
            }).catch(() => { });
        } else if (typeof navigator !== "undefined" && navigator.clipboard) {
            navigator.clipboard.writeText(window.location.href);
            toast.success("لینک اقامتگاه در کلیپ‌بورد کپی شد");
        }
    };

    const handleCopyId = () => {
        if (typeof navigator !== "undefined" && navigator.clipboard && residence) {
            navigator.clipboard.writeText(residence.id);
            toast.success("کد اقامتگاه در حافظه کپی شد");
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
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

    const pricing = (residence.pricing?.pricing || {}) as Record<string, any>;
    const priceModelKey = residence.pricing?.priceModelKey || "DAILY_RENT_STANDARD";
    const nightlyPrice = getResidenceRate(residence.pricing);
    const totalPrice = nightlyPrice * nights;

    const coords = residence.location?.coordinates;
    const lat = coords?.latitude ?? residence.latitude;
    const lng = coords?.longitude ?? residence.longitude;
    const hasCoords = typeof lat === "number" && typeof lng === "number" && !(lat === 0 && lng === 0);

    const attributeList = residence.attributeList || [];
    const booleanFeatures: { key: string; label: string; value: boolean }[] = [];
    const technicalSpecs: { key: string; label: string; displayValue: string }[] = [];
    const processedKeys = new Set<string>();

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

    const rawAttrs = residence.attributes || {};
    for (const [key, rawVal] of Object.entries(rawAttrs)) {
        if (processedKeys.has(key)) continue;
        if (rawVal === undefined || rawVal === null || rawVal === "") continue;
        if (key === "availability_window") continue;

        processedKeys.add(key);
        const label = key;
        const isBool = typeof rawVal === "boolean";

        if (isBool) {
            booleanFeatures.push({ key, label, value: Boolean(rawVal) });
        } else {
            const displayVal = typeof rawVal === "number" ? toPersianDigits(rawVal) : String(rawVal);
            technicalSpecs.push({ key, label, displayValue: displayVal });
        }
    }

    const rawGuests = rawAttrs.max_guests ?? residence.maxGuests ?? residence.guestCapacity;
    const guestCapacity = rawGuests !== undefined && rawGuests !== null && !isNaN(Number(rawGuests))
        ? Number(rawGuests)
        : null;

    const floorArea = getFloorArea(residence);

    const rawRooms = rawAttrs.rooms_count ?? rawAttrs.rooms;
    const roomsCount = rawRooms !== undefined && rawRooms !== null && !isNaN(Number(rawRooms))
        ? Number(rawRooms)
        : null;

    const rawBathrooms = rawAttrs.bathrooms;
    const bathroomsCount = rawBathrooms !== undefined && rawBathrooms !== null && !isNaN(Number(rawBathrooms))
        ? Number(rawBathrooms)
        : null;

    const checkInTime = rawAttrs.check_in_time ? String(rawAttrs.check_in_time) : null;
    const checkOutTime = rawAttrs.check_out_time ? String(rawAttrs.check_out_time) : null;

    const categoryTitle =
        residence.category?.label ||
        residence.categoryTitle ||
        residence.categoryPath?.categoryTitle ||
        "اقامتگاه و ویلا";

    const subcategoryTitle =
        residence.subcategory?.label ||
        residence.subcategoryTitle ||
        residence.categoryPath?.subcategoryTitle ||
        "اجاره روزانه";

    const getPriceModelTitle = (key: string) => {
        switch (key) {
            case "DAILY_RENT_STANDARD":
                return "اجاره روزانه استاندارد";
            case "WEEKEND_PEAK_RENT":
                return "اجاره با نرخ آخر هفته و ایام پیک";
            case "WEEKLY_MONTHLY_RENT":
                return "اجاره هفتگی و ماهانه با تخفیف";
            case "EVENT_VENUE_RENT":
                return "اجاره برگزاری مراسم و رویداد";
            default:
                return "اجاره موقت و روزانه";
        }
    };

    const statusConfig = STATUS_CONFIG[residence.status] || STATUS_CONFIG.PUBLISHED;

    // Key metrics cards
    const keyMetrics: { label: string; value: string; icon: LucideIcon }[] = [];

    if (guestCapacity !== null) {
        keyMetrics.push({
            label: "ظرفیت مهمان",
            value: `حداکثر ${toPersianDigits(guestCapacity)} نفر`,
            icon: Users,
        });
    }

    if (floorArea !== null) {
        keyMetrics.push({
            label: "متراژ زیربنا",
            value: `${toPersianDigits(floorArea)} متر`,
            icon: Maximize2,
        });
    }

    if (roomsCount !== null) {
        keyMetrics.push({
            label: "تعداد اتاق",
            value: roomsCount > 0 ? `${toPersianDigits(roomsCount)} خواب` : "بدون خواب (سوئیت)",
            icon: Bed,
        });
    }

    if (bathroomsCount !== null) {
        keyMetrics.push({
            label: "سرویس بهداشتی",
            value: `${toPersianDigits(bathroomsCount)} سرویس`,
            icon: Bath,
        });
    }

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-32 lg:pb-12">
            {/* Top Navigation & Breadcrumb Actions */}
            <div className="flex items-center justify-between mb-4">
                <button
                    onClick={handleBack}
                    className="p-2 -mr-2 text-foreground-muted hover:text-brand transition-colors cursor-pointer"
                    aria-label="بازگشت"
                    title="بازگشت"
                >
                    <ChevronRight className="w-6 h-6" />
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
                        title={saved ? "حذف از نشان‌شده‌ها" : "نشان کردن اقامتگاه"}
                        aria-label="نشان کردن اقامتگاه"
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
                            alt={residence.title}
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
                        <span className="bg-primary/90 backdrop-blur-md text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
                            اجاره موقت و روزانه
                        </span>
                    </div>
                </div>

                {/* Thumbnails Strip */}
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
                                <span className={cn("text-xs font-black px-2.5 py-1 rounded-xl bg-surface border", statusConfig.border, statusConfig.text)}>
                                    وضعیت: {statusConfig.label}
                                </span>
                                <span className="text-xs text-text-main font-medium">
                                    {residence.status === AdStatus.PENDING_APPROVAL
                                        ? "اقامتگاه در انتظار بررسی و تایید کارشناسان سامانه است."
                                        : residence.status === AdStatus.DRAFT
                                            ? "این اقامتگاه در حالت پیش‌نویس قرار دارد و هنوز برای میهمانان منتشر نشده است."
                                            : "این اقامتگاه در وضعیت فعال قرار ندارد."}
                                </span>
                            </div>
                            {isOwner && (
                                <button
                                    onClick={() => router.push(`/profile/temporary-rent/new?edit=${residence.id}`)}
                                    className="px-3.5 py-1.5 bg-brand text-white text-xs font-bold rounded-xl hover:bg-brand/90 transition shadow-xs self-start sm:self-auto shrink-0"
                                >
                                    ویرایش اقامتگاه
                                </button>
                            )}
                        </div>
                    )}

                    {/* Title & Metadata Header */}
                    <div className="space-y-3 pb-2 border-b border-border-subtle">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <h1 className="text-xl sm:text-2xl font-black text-brand leading-tight">
                                {residence.title}
                            </h1>
                            <button
                                onClick={handleCopyId}
                                className="inline-flex items-center gap-1.5 text-xs text-foreground-muted hover:text-brand bg-surface-secondary px-2.5 py-1 rounded-lg border border-border-subtle transition self-start sm:self-auto cursor-pointer"
                                title="کپی کد اقامتگاه"
                            >
                                <span className="text-[11px]">کد:</span>
                                <span className="font-mono text-[11px] truncate max-w-[120px]">{residence.id.slice(0, 8)}...</span>
                                <Copy className="w-3.5 h-3.5 text-foreground-muted" />
                            </button>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-text-light font-medium">
                            <div className="flex items-center gap-1 text-brand font-bold">
                                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                                <span>{toPersianDigits("4.9")}</span>
                                <span className="text-text-light text-[11px]">(امتیاز مسافران)</span>
                            </div>
                            <span className="text-gray-300">•</span>
                            <div className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                                <span>{formatLocationDisplay(residence.location, cityName)}</span>
                            </div>
                            {residence.createdAt && (
                                <>
                                    <span className="text-gray-300">•</span>
                                    <span>ثبت: {new Date(residence.createdAt).toLocaleDateString("fa-IR")}</span>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Key Metrics Chips */}
                    {keyMetrics.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {keyMetrics.map((m, idx) => {
                                const IconComponent = m.icon;
                                return (
                                    <div
                                        key={idx}
                                        className="bg-surface border border-border-subtle p-3.5 rounded-2xl flex items-center gap-3 shadow-xs hover:border-primary/40 transition-colors"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                            <IconComponent className="w-5 h-5" />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-xs text-text-light">{m.label}</span>
                                            <span className="text-sm font-black text-brand truncate max-w-full">{m.value}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Financial Terms & Rates Card */}
                    <div className="bg-surface-secondary/50 rounded-2xl p-5 border border-border-subtle space-y-4">
                        <div className="flex items-center justify-between border-b border-border-subtle/70 pb-3">
                            <div className="flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-primary" />
                                <h2 className="text-sm sm:text-base font-black text-brand">نرخ و شرایط مالی اقامتگاه</h2>
                            </div>
                            <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-primary/10 text-primary border border-primary/20">
                                {getPriceModelTitle(priceModelKey)}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs sm:text-sm">
                            <div className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border-subtle/60">
                                <span className="text-text-light">نرخ اجاره هر شب:</span>
                                <span className="font-black text-brand">
                                    {nightlyPrice > 0 ? formatPrice(nightlyPrice) : "توافقی"}
                                </span>
                            </div>

                            {pricing.weekendNightlyPrice !== undefined && Number(pricing.weekendNightlyPrice) > 0 && (
                                <div className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border-subtle/60">
                                    <span className="text-text-light">نرخ آخر هفته (پنجشنبه و جمعه):</span>
                                    <span className="font-black text-brand">
                                        {formatPrice(Number(pricing.weekendNightlyPrice))}
                                    </span>
                                </div>
                            )}

                            {pricing.midweekNightlyPrice !== undefined && Number(pricing.midweekNightlyPrice) > 0 && (
                                <div className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border-subtle/60">
                                    <span className="text-text-light">نرخ ایام وسط هفته:</span>
                                    <span className="font-black text-brand">
                                        {formatPrice(Number(pricing.midweekNightlyPrice))}
                                    </span>
                                </div>
                            )}

                            {pricing.weeklyDiscountPercent !== undefined && Number(pricing.weeklyDiscountPercent) > 0 && (
                                <div className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border-subtle/60">
                                    <span className="text-text-light">تخفیف رزرو بیش از ۷ شب:</span>
                                    <span className="font-black text-success">
                                        {toPersianDigits(pricing.weeklyDiscountPercent)}٪ تخفیف
                                    </span>
                                </div>
                            )}

                            {pricing.monthlyDiscountPercent !== undefined && Number(pricing.monthlyDiscountPercent) > 0 && (
                                <div className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border-subtle/60">
                                    <span className="text-text-light">تخفیف رزرو ماهانه (۳۰ شب):</span>
                                    <span className="font-black text-success">
                                        {toPersianDigits(pricing.monthlyDiscountPercent)}٪ تخفیف
                                    </span>
                                </div>
                            )}

                            {pricing.extraGuestPrice !== undefined && Number(pricing.extraGuestPrice) > 0 && (
                                <div className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border-subtle/60">
                                    <span className="text-text-light">هزینه هر نفر مهمان اضافه:</span>
                                    <span className="font-black text-brand">
                                        {formatPrice(Number(pricing.extraGuestPrice))}
                                    </span>
                                </div>
                            )}

                            {pricing.cleaningFee !== undefined && Number(pricing.cleaningFee) > 0 && (
                                <div className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border-subtle/60">
                                    <span className="text-text-light">هزینه نظافت نهایی:</span>
                                    <span className="font-black text-brand">
                                        {formatPrice(Number(pricing.cleaningFee))}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* House Rules & Timing Section */}
                    <div className="space-y-3">
                        <h2 className="text-base font-black text-brand">مقررات و ساعات ورود و خروج</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-surface-secondary/50 p-4 rounded-2xl border border-border-subtle text-xs">
                            <div className="flex items-center gap-3 p-3 bg-surface rounded-xl border border-border-subtle/60">
                                <Clock className="w-5 h-5 text-primary shrink-0" />
                                <div>
                                    <span className="font-black text-brand block">ساعت ورود میهمان</span>
                                    <span className="text-text-light">
                                        {checkInTime ? `از ساعت ${toPersianDigits(checkInTime)} به بعد` : "از ساعت ۱۴:۰۰ به بعد (طبق هماهنگی)"}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-surface rounded-xl border border-border-subtle/60">
                                <Clock className="w-5 h-5 text-primary shrink-0" />
                                <div>
                                    <span className="font-black text-brand block">ساعت خروج و تحویل</span>
                                    <span className="text-text-light">
                                        {checkOutTime ? `تا قبل از ساعت ${toPersianDigits(checkOutTime)}` : "تا قبل از ساعت ۱۲:۰۰ ظهر"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Amenities & Boolean Features */}
                    {booleanFeatures.length > 0 && (
                        <div className="space-y-3">
                            <h2 className="text-base font-black text-brand">امکانات اصلی اقامتگاه</h2>
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

                    {/* Technical Specifications */}
                    {technicalSpecs.length > 0 && (
                        <div className="space-y-3">
                            <h2 className="text-base font-black text-brand">مشخصات و شرایط اقامت</h2>
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
                        <h2 className="text-base font-black text-brand">توضیحات و امکانات اقامتگاه</h2>
                        <div className="bg-surface-secondary/60 p-5 rounded-2xl border border-border-subtle text-sm text-text-main leading-relaxed whitespace-pre-line">
                            {residence.description || "توضیحاتی برای این اقامتگاه ثبت نشده است."}
                        </div>
                    </div>

                    {/* Map Location */}
                    {hasCoords && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h2 className="text-base font-black text-brand">موقعیت تقریبی روی نقشه</h2>
                                <span className="text-[11px] text-text-light">
                                    موقعیت دقیق پس از ثبت درخواست ارسال خواهد شد
                                </span>
                            </div>
                            <div className="h-64 rounded-2xl overflow-hidden border border-border-subtle shadow-xs">
                                <Map
                                    ads={[{
                                        adId: residence.id,
                                        title: residence.title,
                                        pricing: {},
                                        location: { coordinates: { latitude: lat!, longitude: lng! } },
                                    } as any]}
                                    center={[lat!, lng!]}
                                    zoom={15}
                                />
                            </div>
                        </div>
                    )}

                    {/* Host Showcase Box */}
                    <div className="p-4 rounded-2xl bg-surface-secondary/70 border border-border-subtle/70 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            {hostAvatar ? (
                                <img
                                    src={getMediaUrl(hostAvatar)}
                                    alt={hostName}
                                    className="w-12 h-12 rounded-xl object-cover border border-border-subtle shadow-xs shrink-0"
                                />
                            ) : (
                                <div className="w-12 h-12 rounded-xl bg-brand text-white flex items-center justify-center font-black text-lg shrink-0">
                                    {hostName ? hostName.charAt(0) : "م"}
                                </div>
                            )}
                            <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <h4 className="font-black text-sm text-brand truncate">{hostName}</h4>
                                    {isHostVerified && (
                                        <span className="text-primary shrink-0" title="تایید هویت شده">
                                            <ShieldCheck className="w-4 h-4" />
                                        </span>
                                    )}
                                </div>
                                <span className="text-[11px] text-foreground-muted block mt-0.5">میزبان اقامتگاه</span>
                            </div>
                        </div>
                        {hostShowcaseUrl && (
                            <Link
                                href={hostShowcaseUrl}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-surface hover:bg-surface-secondary text-brand border border-border-subtle text-xs font-bold transition-colors shrink-0 shadow-xs cursor-pointer"
                            >
                                <span>مشاهده ویترین</span>
                                <ChevronLeft className="w-3.5 h-3.5" />
                            </Link>
                        )}
                    </div>

                    {/* Safety Guideline Box */}
                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-3">
                        <ShieldAlert className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                        <div className="text-xs">
                            <h5 className="font-black text-amber-950 mb-1">راهنمای رزرو امن اقامتگاه</h5>
                            <p className="text-amber-900/80 leading-relaxed">
                                پیش از پرداخت وجه یا بیعانه، حتماً از شرایط اقامتگاه و هویت میزبان اطمینان حاصل فرمایید. گفتگوی آنلاین و هماهنگی رسمی از طریق پیام‌رسان سامانه را در اولویت قرار دهید.
                            </p>
                        </div>
                    </div>

                    {/* Guest Reviews Section */}
                    <div className="bg-surface rounded-2xl p-5 border border-border-subtle space-y-4">
                        <button
                            type="button"
                            onClick={() => setShowReviews(!showReviews)}
                            className="w-full flex items-center justify-between text-right cursor-pointer"
                        >
                            <div className="flex items-center gap-2">
                                <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                                <h2 className="text-sm sm:text-base font-black text-brand">نظرات و امتیازات میهمانان</h2>
                            </div>
                            <ChevronDown className={cn("w-5 h-5 text-text-light transition-transform", showReviews && "rotate-180")} />
                        </button>
                        {showReviews && (
                            <div className="pt-3 border-t border-border-subtle">
                                <ReviewsSection
                                    targetType="temporary-rent"
                                    targetId={id}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Left column (Desktop Sticky Sidebar) */}
                <div className="space-y-6 hidden lg:block">
                    <div className="sticky top-6 bg-surface p-5 sm:p-6 rounded-2xl border border-border-subtle shadow-card space-y-5">
                        {/* Header */}
                        <div className="flex items-center justify-between pb-3.5 border-b border-border-subtle/80">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                    {isOwner ? (
                                        <ShieldCheck className="w-5 h-5" />
                                    ) : (
                                        <Phone className="w-5 h-5" />
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-black text-brand text-base leading-tight">
                                        {isOwner ? "مدیریت اقامتگاه" : "رزرو و اطلاعات تماس"}
                                    </h3>
                                    <p className="text-[11px] text-foreground-muted mt-0.5">
                                        {isOwner ? "پنل اختصاصی میزبان اقامتگاه" : "هماهنگی مستقیم با میزبان"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {isOwner ? (
                            <div className="space-y-3">
                                <div className="p-3.5 bg-warning-subtle/70 border border-warning/30 rounded-2xl flex items-center gap-2.5 text-xs font-bold text-amber-950">
                                    <ShieldCheck className="w-4 h-4 text-warning shrink-0" />
                                    <span>این اقامتگاه توسط شما ثبت شده است.</span>
                                </div>

                                {isPublished && isPromoted && (
                                    <div className="flex items-center justify-center gap-2 w-full py-3 bg-warning-subtle border border-warning/30 text-warning font-black text-xs rounded-2xl shadow-xs">
                                        <Sparkles className="w-4 h-4 text-warning" />
                                        <span>اقامتگاه شما ارتقا یافته است (فوری / نردبان)</span>
                                    </div>
                                )}

                                {isEligibleForPromotion && (
                                    <button
                                        onClick={() => setIsPromotionModalOpen(true)}
                                        className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-sm rounded-xl shadow-md shadow-amber-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                        <Sparkles className="w-4 h-4" />
                                        <span>{isPromoted ? "نردبان مجدد اقامتگاه" : "ارتقای اقامتگاه (فوری / نردبان)"}</span>
                                    </button>
                                )}

                                <button
                                    type="button"
                                    onClick={() => router.push(`/profile/temporary-rent/new?edit=${residence.id}`)}
                                    className="w-full py-2.5 px-4 bg-surface-secondary hover:bg-border/30 text-foreground border border-border-subtle font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
                                >
                                    <Pencil className="w-3.5 h-3.5 text-foreground-muted" />
                                    <span>ویرایش اطلاعات اقامتگاه</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => router.push("/profile/temporary-rent")}
                                    className="w-full py-2 text-center text-xs text-foreground-muted hover:text-brand font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
                                >
                                    <span>مشاهده در لیست اقامتگاه‌های من</span>
                                    <ChevronLeft className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Price header */}
                                <div className="flex items-baseline justify-between border-b border-border-subtle pb-3">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-2xl font-black text-brand">
                                            {nightlyPrice > 0 ? formatPrice(nightlyPrice, "") : "توافقی"}
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
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-brand">مدت اقامت (تعداد شب)</label>
                                    <div className="flex items-center justify-between p-3 rounded-xl border border-border-subtle bg-surface-secondary">
                                        <span className="text-xs font-bold text-brand">{toPersianDigits(nights)} شب</span>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setNights(Math.max(1, nights - 1))}
                                                className="w-7 h-7 rounded-lg bg-surface border border-border-subtle flex items-center justify-center text-text-main hover:bg-surface-secondary active:scale-95 transition-transform"
                                            >
                                                <Minus className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setNights(nights + 1)}
                                                className="w-7 h-7 rounded-lg bg-surface border border-border-subtle flex items-center justify-center text-text-main hover:bg-surface-secondary active:scale-95 transition-transform"
                                            >
                                                <Plus className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Price Breakdown */}
                                <div className="space-y-2 text-xs text-text-light border-t border-border-subtle pt-3">
                                    <div className="flex justify-between">
                                        <span>{formatPrice(nightlyPrice, "")} تومان × {toPersianDigits(nights)} شب</span>
                                        <span className="font-bold text-brand">{formatPrice(totalPrice, "")} تومان</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>کارمزد خدمات سامانه</span>
                                        <span className="text-success font-bold">رایگان</span>
                                    </div>
                                    <div className="flex justify-between border-t border-border-subtle pt-2.5 text-sm font-black text-brand">
                                        <span>مجموع برآورد اقامت</span>
                                        <span>{formatPrice(totalPrice)}</span>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="space-y-2.5 pt-2">
                                    <button
                                        type="button"
                                        onClick={handleOpenContact}
                                        disabled={isLoadingContact}
                                        className="w-full py-3.5 px-4 bg-primary hover:bg-primary/90 text-white font-bold text-sm rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
                                    >
                                        {isLoadingContact ? <Loader2 className="w-4 h-4 animate-spin" /> : <Phone className="w-4 h-4" />}
                                        <span>اطلاعات تماس با میزبان</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleChat}
                                        disabled={chatMutation.isPending}
                                        className="w-full py-3 px-4 bg-brand hover:bg-brand/90 text-white font-bold text-sm rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
                                    >
                                        {chatMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
                                        <span>شروع گفتگوی آنلاین</span>
                                    </button>
                                </div>

                                <p className="text-[10px] text-text-light text-center leading-relaxed pt-1">
                                    هماهنگی و تایید نهایی پذیرش توسط میزبان اقامتگاه انجام می‌شود.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Similar Residences Section */}
            {(() => {
                const filteredSimilar = (similarResidences?.items || []).filter((r) => r.id !== id);
                if (filteredSimilar.length === 0) return null;

                return (
                    <section className="mt-14 pt-8 border-t border-border-subtle">
                        <h2 className="text-xl font-black text-brand mb-6">اقامتگاه‌های مشابه در {cityName || "این شهر"}</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {filteredSimilar.slice(0, 4).map((item) => (
                                <TemporaryRentCard
                                    key={item.id}
                                    id={item.id}
                                    title={item.title}
                                    nightlyPrice={getResidenceRate(item.pricing)}
                                    location={item.cityName || cityName}
                                    mediaIds={item.mediaIds}
                                    isUrgent={item.isUrgent}
                                    isLadder={item.isLadder}
                                    rooms={(item as any).rooms}
                                    maxGuests={item.maxGuests}
                                />
                            ))}
                        </div>
                    </section>
                );
            })()}

            {/* Sticky Mobile Bottom Bar */}
            <div className="fixed bottom-0 left-0 right-0 p-3.5 bg-surface/95 backdrop-blur-xl border-t border-border-subtle/70 flex items-center justify-between gap-3 z-40 lg:hidden shadow-2xl">
                <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-[11px] text-text-light font-bold">اجاره هر شب</span>
                    <span className="text-sm font-black text-brand truncate">{formatPrice(nightlyPrice)}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    {isOwner ? (
                        <>
                            {isEligibleForPromotion && (
                                <button
                                    onClick={() => setIsPromotionModalOpen(true)}
                                    className="flex items-center gap-1 px-3 py-2.5 bg-accent text-accent-foreground rounded-xl text-xs font-black shadow-xs active:scale-95 transition-transform cursor-pointer"
                                >
                                    <Sparkles className="w-3.5 h-3.5" />
                                    <span>{isPromoted ? "نردبان" : "ارتقا"}</span>
                                </button>
                            )}
                            {isPublished && isPromoted && (
                                <span className="flex items-center gap-1 px-2.5 py-2 bg-warning-subtle text-warning rounded-xl text-xs font-bold">
                                    <Sparkles className="w-3.5 h-3.5 text-warning" />
                                    <span>ارتقا یافته</span>
                                </span>
                            )}
                            <button
                                onClick={() => router.push(`/profile/temporary-rent/new?edit=${residence.id}`)}
                                className="flex items-center gap-1.5 px-3 py-2.5 bg-brand text-white rounded-xl text-xs font-bold active:scale-95 transition-transform cursor-pointer"
                            >
                                <Pencil className="w-3.5 h-3.5" />
                                <span>ویرایش</span>
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={handleOpenContact}
                                disabled={isLoadingContact}
                                className="flex items-center gap-1.5 px-4 py-2.5 bg-primary text-white rounded-xl text-xs font-bold shadow-md shadow-primary/25 active:scale-95 transition-transform cursor-pointer"
                            >
                                {isLoadingContact ? <Loader2 className="w-4 h-4 animate-spin" /> : <Phone className="w-4 h-4" />}
                                <span>تماس با میزبان</span>
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

            {/* Responsive Contact Reveal Modal */}
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
                    <div className="relative z-10 w-full md:max-w-md bg-surface rounded-t-3xl md:rounded-3xl p-6 shadow-2xl transition-all max-h-[90vh] overflow-y-auto">
                        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-4 md:hidden" />
                        <div className="flex items-center justify-between pb-4 border-b border-border-subtle mb-5">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-emerald-500/10 text-success rounded-xl">
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
                                className="p-1.5 text-foreground-muted hover:text-foreground-secondary rounded-xl hover:bg-surface-secondary transition cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {!contactInfo?.phoneNumber ? (
                            <div className="space-y-4">
                                <div className="p-4 bg-warning-subtle/70 border border-warning/30 rounded-2xl flex items-start gap-3">
                                    <ShieldAlert className="w-5 h-5 text-warning shrink-0 mt-0.5" />
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
                                    className="w-full py-3.5 bg-brand hover:bg-brand/90 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    <MessageCircle className="w-4 h-4" />
                                    <span>ارسال پیام در چت آنلاین</span>
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="p-4 bg-surface-secondary border border-border-subtle rounded-2xl flex items-center justify-between">
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
                                        className="p-2.5 bg-surface border border-border-subtle text-brand rounded-xl hover:bg-surface-secondary transition shadow-xs cursor-pointer"
                                        title="کپی شماره"
                                    >
                                        <Copy className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="flex items-center gap-2.5 pt-2">
                                    <a
                                        href={`tel:${contactInfo.phoneNumber}`}
                                        className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer text-center"
                                    >
                                        <Phone className="w-4 h-4" />
                                        <span>تماس تلفنی</span>
                                    </a>
                                    <button
                                        onClick={() => {
                                            setIsContactModalOpen(false);
                                            handleChat();
                                        }}
                                        className="flex-1 py-3 border border-border-subtle hover:bg-surface-secondary text-brand font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
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
