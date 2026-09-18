"use client";

import { useTemporaryRentAdDetail } from "@/hooks/useTemporaryRent";
import { formatPrice, toPersianDigits } from "@/lib/utils";
import { temporaryRentService } from "@/services/temporary-rent.service";
import {
    Calendar,
    CheckCircle2,
    Clock,
    Copy,
    ExternalLink,
    Home,
    ImageIcon,
    Loader2,
    MapPin,
    Phone,
    ShieldAlert,
    Trash2,
    User,
    Users,
    X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";
import { toast } from "sonner";

interface TemporaryRentItemDetailModalProps {
    adId: string | null;
    isOpen: boolean;
    onClose: () => void;
    onDelete?: (adId: string) => void;
    isDeleting?: boolean;
    onPublish?: (adId: string) => void;
    isPublishing?: boolean;
}

const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
    DRAFT: { label: "پیش‌نویس", bg: "bg-slate-100", text: "text-slate-600" },
    PENDING_APPROVAL: { label: "در انتظار بررسی", bg: "bg-amber-100", text: "text-amber-700" },
    PUBLISHED: { label: "منتشر شده", bg: "bg-emerald-100", text: "text-emerald-700" },
    ARCHIVED: { label: "آرشیو شده", bg: "bg-slate-100", text: "text-slate-600" },
    REJECTED: { label: "رد شده", bg: "bg-rose-100", text: "text-rose-700" },
};

export default function TemporaryRentItemDetailModal({
    adId,
    isOpen,
    onClose,
    onDelete,
    isDeleting = false,
    onPublish,
    isPublishing = false,
}: TemporaryRentItemDetailModalProps) {
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [contactInfo, setContactInfo] = useState<{ phoneNumber?: string; ownerName?: string } | null>(null);
    const [isLoadingContact, setIsLoadingContact] = useState(false);

    const { data: ad, isLoading } = useTemporaryRentAdDetail(adId || "");

    if (!isOpen || !adId) return null;

    const handleCopyId = () => {
        navigator.clipboard.writeText(adId);
        toast.success("شناسه اقامتگاه در کلیپ‌بورد کپی شد");
    };

    const handleLoadContact = async () => {
        if (contactInfo) return;
        setIsLoadingContact(true);
        try {
            const info = await temporaryRentService.getContactInfo(adId);
            setContactInfo(info);
        } catch {
            toast.error("خطا در دریافت اطلاعات تماس مالک");
        } finally {
            setIsLoadingContact(false);
        }
    };

    const mediaList = ad?.mediaIds || [];
    const statusInfo = statusConfig[ad?.status || ""] || {
        label: ad?.status || "نامشخص",
        bg: "bg-slate-100",
        text: "text-slate-600",
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div
                className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col border border-slate-200"
                dir="rtl"
            >
                {/* Header */}
                <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                            <Home className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <h3 className="text-base font-black text-slate-900 truncate">
                                    {ad?.title || "جزئیات اقامتگاه"}
                                </h3>
                                <span
                                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${statusInfo.bg} ${statusInfo.text}`}
                                >
                                    {statusInfo.label}
                                </span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-slate-400 font-mono mt-0.5">
                                <span>ID: {adId}</span>
                                <button
                                    type="button"
                                    onClick={handleCopyId}
                                    className="hover:text-slate-700 p-0.5 transition-colors"
                                    title="کپی شناسه"
                                >
                                    <Copy className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors shrink-0"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {isLoading ? (
                        <div className="py-20 flex flex-col items-center justify-center gap-3">
                            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                            <span className="text-sm font-bold text-slate-500">
                                در حال دریافت جزئیات اقامتگاه...
                            </span>
                        </div>
                    ) : !ad ? (
                        <div className="py-20 text-center text-slate-400 font-bold">
                            اطلاعاتی برای این اقامتگاه یافت نشد.
                        </div>
                    ) : (
                        <>
                            {/* Images Gallery */}
                            {mediaList.length > 0 ? (
                                <div className="space-y-3">
                                    <div className="relative w-full h-64 sm:h-80 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                                        <Image
                                            src={`${process.env.NEXT_PUBLIC_API_URL}/media/${mediaList[activeImageIndex]}`}
                                            alt={ad.title}
                                            fill
                                            unoptimized
                                            className="object-cover"
                                        />
                                    </div>
                                    {mediaList.length > 1 && (
                                        <div className="flex items-center gap-2 overflow-x-auto pb-2">
                                            {mediaList.map((mId, index) => (
                                                <button
                                                    key={mId}
                                                    type="button"
                                                    onClick={() => setActiveImageIndex(index)}
                                                    className={`relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                                                        activeImageIndex === index
                                                            ? "border-emerald-600 shadow-md scale-95"
                                                            : "border-transparent opacity-60 hover:opacity-100"
                                                    }`}
                                                >
                                                    <Image
                                                        src={`${process.env.NEXT_PUBLIC_API_URL}/media/${mId}`}
                                                        alt=""
                                                        fill
                                                        unoptimized
                                                        className="object-cover"
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="w-full h-44 rounded-2xl bg-slate-50 border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 gap-2">
                                    <ImageIcon className="w-8 h-8 opacity-40" />
                                    <span className="text-xs font-bold">عکسی برای این اقامتگاه ثبت نشده است</span>
                                </div>
                            )}

                            {/* Core Specs Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                                    <span className="text-xs text-slate-400 font-bold block">نرخ شبانه</span>
                                    <span className="text-base font-black text-emerald-600">
                                        {formatPrice(ad.pricing?.nightlyPrice || 0, "")}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-bold mr-1">تومان</span>
                                </div>

                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                                    <span className="text-xs text-slate-400 font-bold block">حداکثر ظرفیت</span>
                                    <span className="text-base font-black text-slate-800">
                                        {toPersianDigits(ad.maxGuests || ad.guestCapacity || 1)}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-bold mr-1">مهمان</span>
                                </div>

                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                                    <span className="text-xs text-slate-400 font-bold block">موقعیت</span>
                                    <span className="text-sm font-bold text-slate-800 truncate block">
                                        {ad.cityName || ad.cityId || "نامشخص"}
                                    </span>
                                    <span className="text-[10px] text-slate-400 block font-mono">
                                        {ad.latitude && ad.longitude
                                            ? `${ad.latitude.toFixed(3)}, ${ad.longitude.toFixed(3)}`
                                            : "بدون مختصات"}
                                    </span>
                                </div>

                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                                    <span className="text-xs text-slate-400 font-bold block">تاریخ ثبت</span>
                                    <span className="text-xs font-bold text-slate-700 block">
                                        {new Date(ad.createdAt).toLocaleDateString("fa-IR")}
                                    </span>
                                    <span className="text-[10px] text-slate-400 block">
                                        بروزرسانی: {new Date(ad.updatedAt).toLocaleDateString("fa-IR")}
                                    </span>
                                </div>
                            </div>

                            {/* Description */}
                            {ad.description && (
                                <div className="space-y-2">
                                    <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                                        توضیحات اقامتگاه
                                    </h4>
                                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100 whitespace-pre-line">
                                        {ad.description}
                                    </p>
                                </div>
                            )}

                            {/* Dynamic Attributes */}
                            {ad.attributes && Object.keys(ad.attributes).length > 0 && (
                                <div className="space-y-2.5">
                                    <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                                        امکانات و ویژگی‌ها
                                    </h4>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {Object.entries(ad.attributes).map(([key, val]) => {
                                            const displayVal =
                                                typeof val === "boolean"
                                                    ? val
                                                        ? "دارد"
                                                        : "ندارد"
                                                    : String(val);

                                            return (
                                                <div
                                                    key={key}
                                                    className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl text-xs"
                                                >
                                                    <span className="font-bold text-slate-500">{key}:</span>
                                                    <span className="font-black text-slate-800">
                                                        {toPersianDigits(displayVal)}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Host Information */}
                            <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl space-y-3">
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                                            <User className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <span className="text-xs font-bold text-slate-700 block">
                                                شناسه مالک / میزبان:
                                            </span>
                                            <span className="text-xs font-mono text-slate-500 font-bold">
                                                {ad.ownerId}
                                            </span>
                                        </div>
                                    </div>

                                    {!contactInfo ? (
                                        <button
                                            type="button"
                                            onClick={handleLoadContact}
                                            disabled={isLoadingContact}
                                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                                        >
                                            {isLoadingContact ? (
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            ) : (
                                                <Phone className="w-3.5 h-3.5" />
                                            )}
                                            <span>مشاهده شماره تماس مالک</span>
                                        </button>
                                    ) : (
                                        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-emerald-200">
                                            <Phone className="w-4 h-4 text-emerald-600" />
                                            <span className="text-xs font-black text-slate-800 font-mono" dir="ltr">
                                                {contactInfo.phoneNumber}
                                            </span>
                                            {contactInfo.ownerName && (
                                                <span className="text-xs text-slate-500 font-bold mr-2">
                                                    ({contactInfo.ownerName})
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0">
                    <div className="flex items-center gap-2">
                        <Link
                            href={`/temporary-rent/${adId}`}
                            target="_blank"
                            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors shadow-xs"
                        >
                            <ExternalLink className="w-4 h-4" />
                            <span>مشاهده صفحه عمومی اقامتگاه</span>
                        </Link>

                        {onPublish && ad?.status !== "PUBLISHED" && (
                            <button
                                type="button"
                                onClick={() => onPublish(adId)}
                                disabled={isPublishing}
                                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                            >
                                {isPublishing ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <CheckCircle2 className="w-4 h-4" />
                                )}
                                <span>تایید و انتشار اقامتگاه</span>
                            </button>
                        )}

                        {onDelete && (
                            <button
                                type="button"
                                onClick={() => onDelete(adId)}
                                disabled={isDeleting}
                                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                            >
                                {isDeleting ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Trash2 className="w-4 h-4" />
                                )}
                                <span>حذف این اقامتگاه</span>
                            </button>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-colors"
                    >
                        بستن
                    </button>
                </div>
            </div>
        </div>
    );
}
