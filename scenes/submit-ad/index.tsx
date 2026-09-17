"use client";

import { useAd, useCategories } from "@/hooks/useAds";
import { useGeoHierarchy } from "@/hooks/useGeoHierarchy";
import { useUploadMedia } from "@/hooks/useMedia";
import { cn, formatPrice, toPersianDigits } from "@/lib/utils";
import { adsService } from "@/services/ads.service";
import { CreateAdDraftRequest } from "@/types/api/ads.types";
import { useMutation } from "@tanstack/react-query";
import {
    Check,
    ChevronLeft,
    ChevronRight,
    Image as ImageIcon,
    Loader2,
    MapPin,
    Send,
    Tag,
    Upload,
    Wallet,
    X,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// Leaflet is client-side only
const DynamicMapPicker = dynamic(() => import("@/components/ui/MapPicker"), { ssr: false });

type Step = "CATEGORY" | "BASIC_INFO" | "DETAILS" | "LOCATION" | "MEDIA" | "REVIEW";

const STEPS_CONFIG: { id: Step; label: string; icon: any }[] = [
    { id: "CATEGORY", icon: Tag, label: "دسته‌بندی" },
    { id: "BASIC_INFO", icon: Check, label: "اطلاعات پایه" },
    { id: "DETAILS", icon: Wallet, label: "قیمت و مشخصات" },
    { id: "LOCATION", icon: MapPin, label: "موقعیت" },
    { id: "MEDIA", icon: ImageIcon, label: "تصاویر" },
    { id: "REVIEW", icon: Send, label: "بازبینی و ثبت" },
];

export default function SubmitAdScene() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const editAdId = searchParams.get("edit");

    const [step, setStep] = useState<Step>("CATEGORY");
    const [submitForApproval, setSubmitForApproval] = useState(false);
    const [formData, setFormData] = useState<Partial<CreateAdDraftRequest>>({
        attributes: {
            area: 0,
            rooms: 0,
            floor: 0,
        },
        rawPricing: {
            total_price: 0,
            rent_price: 0,
            deposit_price: 0,
        },
        latitude: 35.6892,
        longitude: 51.389,
        mediaIds: [] as string[],
    });

    const { data: categories } = useCategories();
    const { data: geoHierarchy } = useGeoHierarchy();
    const { mutateAsync: uploadMedia, isPending: isUploading } = useUploadMedia();

    // Fetch ad if editing
    const { data: existingAd, isLoading: isLoadingExisting } = useAd(editAdId || "");

    // Pre-fill form in edit mode
    useEffect(() => {
        if (existingAd) {
            setFormData({
                cityId: existingAd.cityId,
                categoryPath: existingAd.categoryPath,
                title: existingAd.title,
                description: existingAd.description,
                attributes: existingAd.attributes || {},
                rawPricing: existingAd.pricing || {},
                latitude: existingAd.location?.latitude ?? 35.6892,
                longitude: existingAd.location?.longitude ?? 51.389,
                mediaIds: existingAd.mediaIds || [],
            });
        }
    }, [existingAd]);

    const submitMutation = useMutation({
        mutationFn: async ({ shouldPublish }: { shouldPublish: boolean }) => {
            let adId = editAdId;

            if (editAdId) {
                // Update existing ad
                await adsService.update(editAdId, {
                    title: formData.title,
                    description: formData.description,
                    rawPricing: formData.rawPricing,
                    attributes: formData.attributes,
                });
            } else {
                // Create draft
                const created = await adsService.createDraft(formData as CreateAdDraftRequest);
                adId = created.adId;
            }

            // If user requested approval review, submit it
            if (shouldPublish && adId) {
                await adsService.submitForReview(adId);
            }

            return { adId, shouldPublish };
        },
        onSuccess: ({ shouldPublish }) => {
            if (shouldPublish) {
                toast.success("آگهی با موفقیت ثبت و جهت تایید به ادمین ارسال شد");
            } else {
                toast.success("آگهی با موفقیت به عنوان پیش‌نویس ذخیره شد");
            }
            router.push("/profile/ads");
        },
        onError: () => {
            toast.error("خطا در ذخیره‌سازی آگهی");
        },
    });

    const currentStepIndex = STEPS_CONFIG.findIndex((s) => s.id === step);

    const handleNext = () => {
        // Validation
        if (step === "CATEGORY" && (!formData.cityId || !formData.categoryPath?.categoryKey)) {
            toast.error("لطفاً شهر و دسته‌بندی ملک را مشخص کنید");
            return;
        }
        if (step === "BASIC_INFO" && (!formData.title || !formData.description)) {
            toast.error("لطفاً عنوان و توضیحات کامل آگهی را وارد کنید");
            return;
        }

        if (currentStepIndex === STEPS_CONFIG.length - 1) {
            submitMutation.mutate({ shouldPublish: submitForApproval });
        } else {
            setStep(STEPS_CONFIG[currentStepIndex + 1].id);
        }
    };

    const handleBack = () => {
        if (currentStepIndex > 0) {
            setStep(STEPS_CONFIG[currentStepIndex - 1].id);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        for (let i = 0; i < files.length; i++) {
            try {
                const result = await uploadMedia(files[i]);
                setFormData((prev) => ({
                    ...prev,
                    mediaIds: [...(prev.mediaIds || []), result.mediaId],
                }));
            } catch {
                toast.error("خطا در آپلود تصویر");
            }
        }
    };

    const removeMedia = (id: string) => {
        setFormData((prev) => ({
            ...prev,
            mediaIds: (prev.mediaIds || []).filter((m: string) => m !== id),
        }));
    };

    if (editAdId && isLoadingExisting) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-text-light font-bold text-sm">در حال دریافت اطلاعات آگهی...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50 py-8 px-4 sm:px-6 lg:px-8 pb-32">
            <div className="max-w-3xl mx-auto">
                <header className="mb-6">
                    <h1 className="text-2xl font-black text-brand">
                        {editAdId ? "ویرایش آگهی" : "ثبت رایگان آگهی ملک"}
                    </h1>
                    <p className="text-xs text-text-light mt-1">
                        اطلاعات ملک خود را با دقت تکمیل کنید تا در سریع‌ترین زمان متقاضیان با شما تماس بگیرند.
                    </p>
                </header>

                {/* Mobile Compact Step Indicator */}
                <div className="sm:hidden mb-6 bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
                    <div className="flex justify-between items-center text-xs font-bold text-brand mb-2">
                        <span>
                            مرحله {toPersianDigits(currentStepIndex + 1)} از {toPersianDigits(STEPS_CONFIG.length)}:
                        </span>
                        <span className="text-primary">{STEPS_CONFIG[currentStepIndex].label}</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                        <div
                            className="bg-primary h-full transition-all duration-300 rounded-full"
                            style={{ width: `${((currentStepIndex + 1) / STEPS_CONFIG.length) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Desktop Stepper */}
                <nav aria-label="مراحل ثبت" className="hidden sm:block mb-8">
                    <ol role="list" className="flex items-center justify-between">
                        {STEPS_CONFIG.map((s, idx) => {
                            const isCurrent = step === s.id;
                            const isCompleted = currentStepIndex > idx;
                            return (
                                <li key={s.id} className="relative flex-1">
                                    <div className="flex flex-col items-center group">
                                        <div
                                            className={cn(
                                                "h-10 w-10 rounded-full flex items-center justify-center transition-colors z-10 relative font-bold text-xs shadow-xs",
                                                isCurrent
                                                    ? "bg-primary text-white ring-4 ring-primary/20"
                                                    : isCompleted
                                                    ? "bg-brand text-white"
                                                    : "bg-gray-200 text-gray-500"
                                            )}
                                        >
                                            <s.icon className="h-5 w-5" />
                                        </div>
                                        <span
                                            className={cn(
                                                "text-xs font-bold mt-2 text-center whitespace-nowrap transition-colors",
                                                isCurrent ? "text-primary" : "text-text-light"
                                            )}
                                        >
                                            {s.label}
                                        </span>
                                    </div>
                                    {idx < STEPS_CONFIG.length - 1 && (
                                        <div
                                            className={cn(
                                                "absolute top-5 right-1/2 w-full h-0.5 -z-0",
                                                isCompleted ? "bg-brand" : "bg-gray-200"
                                            )}
                                        />
                                    )}
                                </li>
                            );
                        })}
                    </ol>
                </nav>

                {/* Form Card Content */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8 min-h-[480px] flex flex-col justify-between">
                    <div>
                        {/* 1. CATEGORY */}
                        {step === "CATEGORY" && (
                            <div className="space-y-6">
                                <h2 className="text-lg font-black text-brand">انتخاب شهر و دسته‌بندی</h2>
                                <div className="grid grid-cols-1 gap-5">
                                    <div>
                                        <label className="block text-xs font-bold text-brand mb-2">شهر ملک</label>
                                        <select
                                            className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-sm focus:bg-white focus:ring-2 focus:ring-primary outline-hidden font-medium"
                                            value={formData.cityId || ""}
                                            onChange={(e) => setFormData({ ...formData, cityId: e.target.value })}
                                        >
                                            <option value="">انتخاب شهر...</option>
                                            {geoHierarchy?.flatMap((p) => p.cities).map((city) => (
                                                <option key={city.id} value={city.id}>
                                                    {city.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-brand mb-2">نوع معامله</label>
                                        <div className="flex flex-wrap gap-3">
                                            {[
                                                { key: "buy_sell", label: "فروش" },
                                                { key: "rent_mortgage", label: "رهن و اجاره" },
                                                { key: "daily_rent", label: "اجاره روزانه" },
                                            ].map((bm) => (
                                                <button
                                                    type="button"
                                                    key={bm.key}
                                                    onClick={() =>
                                                        setFormData({
                                                            ...formData,
                                                            categoryPath: {
                                                                ...(formData.categoryPath || ({} as any)),
                                                                businessModelKey: bm.key,
                                                            },
                                                        })
                                                    }
                                                    className={cn(
                                                        "px-5 py-2.5 rounded-xl border text-xs font-bold transition-all",
                                                        formData.categoryPath?.businessModelKey === bm.key
                                                            ? "bg-brand text-white border-brand shadow-xs"
                                                            : "bg-gray-50 text-text-light border-gray-200 hover:bg-gray-100"
                                                    )}
                                                >
                                                    {bm.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-brand mb-2">دسته‌بندی اصلی</label>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                            {categories?.map((cat) => (
                                                <button
                                                    type="button"
                                                    key={cat.id || cat.key}
                                                    onClick={() =>
                                                        setFormData({
                                                            ...formData,
                                                            categoryPath: {
                                                                ...(formData.categoryPath || ({} as any)),
                                                                categoryKey: cat.key,
                                                                attributeSchemaVersion: 1,
                                                                subcategoryKey: cat.subcategories?.[0]?.key || "",
                                                            },
                                                        })
                                                    }
                                                    className={cn(
                                                        "p-4 border rounded-2xl text-right transition-all",
                                                        formData.categoryPath?.categoryKey === cat.key
                                                            ? "border-primary bg-primary/10 text-brand font-bold shadow-xs"
                                                            : "border-gray-200 hover:border-primary/40 text-text-light"
                                                    )}
                                                >
                                                    <span className="block text-sm">{cat.displayName}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {formData.categoryPath?.categoryKey && (
                                        <div>
                                            <label className="block text-xs font-bold text-brand mb-2">زیردسته ملک</label>
                                            <select
                                                className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-sm focus:bg-white focus:ring-2 focus:ring-primary outline-hidden font-medium"
                                                value={formData.categoryPath?.subcategoryKey || ""}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        categoryPath: {
                                                            ...(formData.categoryPath || ({} as any)),
                                                            subcategoryKey: e.target.value,
                                                        },
                                                    })
                                                }
                                            >
                                                {categories
                                                    ?.find((c) => c.key === formData.categoryPath?.categoryKey)
                                                    ?.subcategories?.map((sub) => (
                                                        <option key={sub.key} value={sub.key}>
                                                            {sub.displayName}
                                                        </option>
                                                    ))}
                                            </select>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* 2. BASIC_INFO */}
                        {step === "BASIC_INFO" && (
                            <div className="space-y-6">
                                <h2 className="text-lg font-black text-brand">عنوان و توضیحات آگهی</h2>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-brand mb-2">
                                            عنوان جذاب برای آگهی
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-sm focus:bg-white focus:ring-2 focus:ring-primary outline-hidden"
                                            placeholder="مثلاً: آپارتمان ۱۱۰ متری دو خوابه نوساز، نورگیر عالی"
                                            value={formData.title || ""}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-brand mb-2">
                                            توضیحات تکمیلی
                                        </label>
                                        <textarea
                                            rows={6}
                                            className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-sm focus:bg-white focus:ring-2 focus:ring-primary outline-hidden leading-relaxed"
                                            placeholder="امکانات، مشخصات محله، شرایط بازدید و جزئیات دقیق ملک را شرح دهید..."
                                            value={formData.description || ""}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 3. DETAILS */}
                        {step === "DETAILS" && (
                            <div className="space-y-6">
                                <h2 className="text-lg font-black text-brand">قیمت و مشخصات فنی</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {formData.categoryPath?.businessModelKey === "buy_sell" && (
                                        <div className="col-span-1 md:col-span-2">
                                            <label className="block text-xs font-bold text-brand mb-2">
                                                قیمت کل (تومان)
                                            </label>
                                            <input
                                                type="number"
                                                className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-sm focus:bg-white focus:ring-2 focus:ring-primary outline-hidden"
                                                value={formData.rawPricing?.total_price || ""}
                                                placeholder="مثال: ۵۵۰۰۰۰۰۰۰۰"
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        rawPricing: {
                                                            ...formData.rawPricing,
                                                            total_price: Number(e.target.value),
                                                        },
                                                    })
                                                }
                                            />
                                        </div>
                                    )}

                                    {formData.categoryPath?.businessModelKey === "rent_mortgage" && (
                                        <>
                                            <div>
                                                <label className="block text-xs font-bold text-brand mb-2">
                                                    ودیعه / رهن (تومان)
                                                </label>
                                                <input
                                                    type="number"
                                                    className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-sm focus:bg-white focus:ring-2 focus:ring-primary outline-hidden"
                                                    value={formData.rawPricing?.deposit_price || ""}
                                                    placeholder="مثال: ۳۰۰۰۰۰۰۰۰"
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            rawPricing: {
                                                                ...formData.rawPricing,
                                                                deposit_price: Number(e.target.value),
                                                            },
                                                        })
                                                    }
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-brand mb-2">
                                                    اجاره ماهیانه (تومان)
                                                </label>
                                                <input
                                                    type="number"
                                                    className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-sm focus:bg-white focus:ring-2 focus:ring-primary outline-hidden"
                                                    value={formData.rawPricing?.rent_price || ""}
                                                    placeholder="مثال: ۱۲۰۰۰۰۰۰"
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            rawPricing: {
                                                                ...formData.rawPricing,
                                                                rent_price: Number(e.target.value),
                                                            },
                                                        })
                                                    }
                                                />
                                            </div>
                                        </>
                                    )}

                                    <div>
                                        <label className="block text-xs font-bold text-brand mb-2">
                                            متراژ (مترمربع)
                                        </label>
                                        <input
                                            type="number"
                                            className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-sm focus:bg-white focus:ring-2 focus:ring-primary outline-hidden"
                                            value={(formData.attributes as any)?.area || ""}
                                            placeholder="مثال: ۹۵"
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    attributes: {
                                                        ...formData.attributes,
                                                        area: Number(e.target.value),
                                                    },
                                                })
                                            }
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-brand mb-2">تعداد اتاق</label>
                                        <input
                                            type="number"
                                            className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-sm focus:bg-white focus:ring-2 focus:ring-primary outline-hidden"
                                            value={(formData.attributes as any)?.rooms || ""}
                                            placeholder="مثال: ۲"
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    attributes: {
                                                        ...formData.attributes,
                                                        rooms: Number(e.target.value),
                                                    },
                                                })
                                            }
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 4. LOCATION */}
                        {step === "LOCATION" && (
                            <div className="space-y-4">
                                <h2 className="text-lg font-black text-brand">تعیین موقعیت روی نقشه</h2>
                                <p className="text-xs text-text-light">
                                    با کلیک یا جابجایی نشانگر روی نقشه، موقعیت تقریبی ملک را مشخص نمایید.
                                </p>
                                <div className="rounded-2xl overflow-hidden border border-gray-200 h-80">
                                    <DynamicMapPicker
                                        initialCenter={[formData.latitude || 35.6892, formData.longitude || 51.389]}
                                        onChange={(lat, lng) =>
                                            setFormData({ ...formData, latitude: lat, longitude: lng })
                                        }
                                    />
                                </div>
                            </div>
                        )}

                        {/* 5. MEDIA */}
                        {step === "MEDIA" && (
                            <div className="space-y-6">
                                <h2 className="text-lg font-black text-brand">تصاویر ملک</h2>
                                <p className="text-xs text-text-light">
                                    آگهی‌هایی که تصویر دارند تا ۵ برابر بیشتر بازدید دریافت می‌کنند.
                                </p>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                    {(formData.mediaIds as any[])?.map((id: string) => (
                                        <div
                                            key={id}
                                            className="relative aspect-square rounded-2xl overflow-hidden border border-gray-200 group shadow-xs"
                                        >
                                            <img
                                                src={`${process.env.NEXT_PUBLIC_API_URL}/media/${id}`}
                                                className="w-full h-full object-cover"
                                                alt="تصویر آگهی"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeMedia(id)}
                                                className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full shadow-md transition-opacity"
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                    <label className="aspect-square rounded-2xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all">
                                        {isUploading ? (
                                            <Loader2 className="h-8 w-8 text-primary animate-spin" />
                                        ) : (
                                            <>
                                                <Upload className="h-7 w-7 text-gray-400 mb-1" />
                                                <span className="text-xs text-text-light font-bold">افزودن تصویر</span>
                                            </>
                                        )}
                                        <input
                                            type="file"
                                            multiple
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleFileChange}
                                            disabled={isUploading}
                                        />
                                    </label>
                                </div>
                            </div>
                        )}

                        {/* 6. REVIEW */}
                        {step === "REVIEW" && (
                            <div className="space-y-6">
                                <h2 className="text-lg font-black text-brand">بازبینی اطلاعات آگهی</h2>
                                <div className="bg-gray-50/80 rounded-2xl p-6 space-y-3 border border-gray-100 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-text-light">عنوان:</span>
                                        <span className="font-bold text-brand">{formData.title}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-text-light">دسته‌بندی:</span>
                                        <span className="font-bold text-brand">
                                            {formData.categoryPath?.categoryKey} / {formData.categoryPath?.subcategoryKey}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-text-light">نوع معامله:</span>
                                        <span className="font-bold text-brand">
                                            {formData.categoryPath?.businessModelKey === "buy_sell"
                                                ? "فروش"
                                                : "رهن و اجاره"}
                                        </span>
                                    </div>
                                    <div className="border-t border-gray-200/60 pt-3">
                                        <p className="text-text-light text-xs mb-1">توضیحات:</p>
                                        <p className="text-xs text-text-main line-clamp-3 leading-relaxed">
                                            {formData.description}
                                        </p>
                                    </div>
                                </div>

                                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 text-xs text-amber-800 leading-relaxed">
                                    می‌توانید آگهی را ذخیره کنید و بعداً ویرایش نمایید، یا مستقیماً برای تایید و انتشار
                                    به کارشناسان ارسال فرمایید.
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Navigation Buttons */}
                    <div className="mt-10 flex items-center justify-between border-t border-gray-100 pt-6">
                        <button
                            type="button"
                            onClick={handleBack}
                            disabled={step === "CATEGORY"}
                            className="flex items-center text-text-light hover:text-brand disabled:opacity-30 font-bold text-xs"
                        >
                            <ChevronRight className="h-4 w-4 ml-1" />
                            مرحله قبل
                        </button>

                        {step === "REVIEW" ? (
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSubmitForApproval(false);
                                        submitMutation.mutate({ shouldPublish: false });
                                    }}
                                    disabled={submitMutation.isPending}
                                    className="px-4 py-2.5 rounded-xl border border-gray-200 text-text-main font-bold text-xs hover:bg-gray-50 transition-colors"
                                >
                                    ذخیره پیش‌نویس
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSubmitForApproval(true);
                                        submitMutation.mutate({ shouldPublish: true });
                                    }}
                                    disabled={submitMutation.isPending}
                                    className="px-6 py-2.5 rounded-xl bg-primary text-white font-black text-xs hover:bg-primary/90 shadow-md shadow-primary/20 flex items-center gap-1.5 transition-all"
                                >
                                    {submitMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                                    <span>ارسال برای تایید و انتشار</span>
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={handleNext}
                                className="bg-primary text-white px-7 py-2.5 rounded-xl font-black text-xs hover:bg-primary/90 transition-all flex items-center shadow-md shadow-primary/20"
                            >
                                <span>مرحله بعد</span>
                                <ChevronLeft className="h-4 w-4 mr-1" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
