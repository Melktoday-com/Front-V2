"use client";

import { useCategories } from "@/hooks/useAds";
import { useGeoHierarchy } from "@/hooks/useGeoHierarchy";
import { useUploadMedia } from "@/hooks/useMedia";
import { adsService } from "@/services/ads.service";
import { AdMutationResponse, CreateAdDraftRequest } from "@/types/api/ads.types";
import { useMutation } from "@tanstack/react-query";
import { Check, ChevronLeft, ChevronRight, Image as ImageIcon, Loader2, MapPin, Tag, Upload, Wallet, X } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

// Leaflet is client-side only
const DynamicMapPicker = dynamic(() => import("@/components/ui/MapPicker"), { ssr: false });

type Step = "CATEGORY" | "BASIC_INFO" | "DETAILS" | "LOCATION" | "MEDIA" | "REVIEW";

export default function SubmitAdScene() {
    const router = useRouter();
    const [step, setStep] = useState<Step>("CATEGORY");
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
        longitude: 51.3890,
        mediaIds: [] as string[],
    });

    const { data: categories } = useCategories();
    const { data: geoHierarchy } = useGeoHierarchy();
    const { mutateAsync: uploadMedia, isPending: isUploading } = useUploadMedia();

    const createDraftMutation = useMutation({
        mutationFn: (data: CreateAdDraftRequest) => adsService.createDraft(data),
        onSuccess: (response: AdMutationResponse) => {
            toast.success("آگهی با موفقیت به عنوان پیش‌نویس ثبت شد");
            router.push(`/profile/ads`);
        },
        onError: () => {
            toast.error("خطا در ثبت آگهی");
        }
    });

    const handleNext = () => {
        const steps: Step[] = ["CATEGORY", "BASIC_INFO", "DETAILS", "LOCATION", "MEDIA", "REVIEW"];
        const currentIndex = steps.indexOf(step);

        // Basic validation
        if (step === "CATEGORY" && (!formData.cityId || !formData.categoryPath?.categoryKey)) {
            toast.error("لطفا شهر و دسته‌بندی را انتخاب کنید");
            return;
        }
        if (step === "BASIC_INFO" && (!formData.title || !formData.description)) {
            toast.error("لطفا عنوان و توضیحات را وارد کنید");
            return;
        }

        if (currentIndex === steps.length - 1) {
            createDraftMutation.mutate(formData as CreateAdDraftRequest);
        } else {
            setStep(steps[currentIndex + 1]);
        }
    };

    const handleBack = () => {
        const steps: Step[] = ["CATEGORY", "BASIC_INFO", "DETAILS", "LOCATION", "MEDIA", "REVIEW"];
        const currentIndex = steps.indexOf(step);
        if (currentIndex > 0) {
            setStep(steps[currentIndex - 1]);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        for (let i = 0; i < files.length; i++) {
            try {
                const result = await uploadMedia(files[i]);
                setFormData(prev => ({
                    ...prev,
                    mediaIds: [...(prev.mediaIds || []), result.mediaId]
                }));
            } catch (err) {
                toast.error("خطا در آپلود تصویر");
            }
        }
    };

    const removeMedia = (id: string) => {
        setFormData(prev => ({
            ...prev,
            mediaIds: (prev.mediaIds || []).filter((m: string) => m !== id) as any
        }));
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                {/* Stepper */}
                <nav aria-label="Progress" className="mb-12">
                    <ol role="list" className="flex items-center">
                        {[
                            { id: "CATEGORY", icon: Tag, label: "دسته‌بندی" },
                            { id: "BASIC_INFO", icon: Check, label: "اطلاعات پایه" },
                            { id: "DETAILS", icon: Wallet, label: "قیمت و جزئیات" },
                            { id: "LOCATION", icon: MapPin, label: "موقعیت" },
                            { id: "MEDIA", icon: ImageIcon, label: "تصاویر" },
                            { id: "REVIEW", icon: Check, label: "بازبینی" },
                        ].map((s, idx, arr) => (
                            <li key={s.id} className={`${idx !== arr.length - 1 ? "pr-8 sm:pr-20" : ""} relative`}>
                                <div className="flex items-center" aria-current={step === s.id ? "step" : undefined}>
                                    <div
                                        className={`${step === s.id
                                            ? "bg-primary text-white"
                                            : "bg-gray-200 text-gray-500"
                                            } h-10 w-10 rounded-full flex items-center justify-center transition-colors z-10 relative`}
                                    >
                                        <s.icon className="h-6 w-6" />
                                    </div>
                                    <span className="absolute top-12 -left-2 text-xs font-medium text-gray-500 whitespace-nowrap">
                                        {s.label}
                                    </span>
                                </div>
                                {idx !== arr.length - 1 && (
                                    <div className="absolute top-5 left-10 w-full h-0.5 bg-gray-200" />
                                )}
                            </li>
                        ))}
                    </ol>
                </nav>

                {/* Form Content */}
                <div className="bg-white rounded-2xl shadow-sm p-8 mt-16 min-h-[500px] flex flex-col justify-between">
                    <div>
                        {step === "CATEGORY" && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-bold text-gray-900">انتخاب دسته‌بندی و شهر</h2>
                                <div className="grid grid-cols-1 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">شهر</label>
                                        <select
                                            className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary"
                                            value={formData.cityId || ""}
                                            onChange={(e) => setFormData({ ...formData, cityId: e.target.value })}
                                        >
                                            <option value="">انتخاب کنید...</option>
                                            {geoHierarchy?.flatMap(p => p.cities).map(city => (
                                                <option key={city.id} value={city.id}>{city.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">نوع معامله</label>
                                        <div className="flex gap-4">
                                            {[
                                                { key: "sale", label: "فروش" },
                                                { key: "rent", label: "اجاره" },
                                                { key: "temporary", label: "اجاره روزانه" }
                                            ].map(bm => (
                                                <button
                                                    key={bm.key}
                                                    onClick={() => setFormData({
                                                        ...formData,
                                                        categoryPath: {
                                                            ...(formData.categoryPath || {} as any),
                                                            businessModelKey: bm.key
                                                        }
                                                    })}
                                                    className={`px-6 py-2 rounded-full border transition-all ${formData.categoryPath?.businessModelKey === bm.key
                                                        ? "bg-primary text-white border-primary"
                                                        : "bg-white text-gray-600 border-gray-200"
                                                        }`}
                                                >
                                                    {bm.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">دسته‌بندی</label>
                                        <div className="grid grid-cols-2 gap-4">
                                            {categories?.map(cat => (
                                                <button
                                                    key={cat.id}
                                                    onClick={() => setFormData({
                                                        ...formData,
                                                        categoryPath: {
                                                            ...(formData.categoryPath || {} as any),
                                                            categoryKey: cat.key,
                                                            attributeSchemaVersion: 1,
                                                            subcategoryKey: cat.subcategories[0]?.key || ""
                                                        }
                                                    })}
                                                    className={`p-4 border rounded-xl text-right transition-all ${formData.categoryPath?.categoryKey === cat.key
                                                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                                                        : "border-gray-200 hover:border-primary"
                                                        }`}
                                                >
                                                    <span className="block font-medium">{cat.displayName}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    {formData.categoryPath?.categoryKey && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">زیردسته</label>
                                            <select
                                                className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary"
                                                value={formData.categoryPath?.subcategoryKey || ""}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    categoryPath: {
                                                        ...(formData.categoryPath || {} as any),
                                                        subcategoryKey: e.target.value
                                                    }
                                                })}
                                            >
                                                {categories?.find(c => c.key === formData.categoryPath?.categoryKey)?.subcategories.map(sub => (
                                                    <option key={sub.key} value={sub.key}>{sub.displayName}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {step === "BASIC_INFO" && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-bold text-gray-900">اطلاعات پایه آگهی</h2>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">عنوان آگهی</label>
                                        <input
                                            type="text"
                                            className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary"
                                            placeholder="مثلاً: آپارتمان ۱۰۰ متری در ونک"
                                            value={formData.title || ""}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">توضیحات</label>
                                        <textarea
                                            rows={6}
                                            className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary"
                                            placeholder="جزئیات بیشتر در مورد ملک را اینجا بنویسید..."
                                            value={formData.description || ""}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === "DETAILS" && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-bold text-gray-900">قیمت و مشخصات فنی</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {formData.categoryPath?.businessModelKey === "sale" && (
                                        <div className="col-span-1 md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">قیمت کل (تومان)</label>
                                            <input
                                                type="number"
                                                className="w-full border-gray-300 rounded-lg shadow-sm"
                                                value={formData.rawPricing?.total_price || 0}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    rawPricing: { ...formData.rawPricing, total_price: Number(e.target.value) }
                                                })}
                                            />
                                        </div>
                                    )}
                                    {formData.categoryPath?.businessModelKey === "rent" && (
                                        <>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">ودیعه (تومان)</label>
                                                <input
                                                    type="number"
                                                    className="w-full border-gray-300 rounded-lg shadow-sm"
                                                    value={formData.rawPricing?.deposit_price || 0}
                                                    onChange={(e) => setFormData({
                                                        ...formData,
                                                        rawPricing: { ...formData.rawPricing, deposit_price: Number(e.target.value) }
                                                    })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">اجاره ماهیانه (تومان)</label>
                                                <input
                                                    type="number"
                                                    className="w-full border-gray-300 rounded-lg shadow-sm"
                                                    value={formData.rawPricing?.rent_price || 0}
                                                    onChange={(e) => setFormData({
                                                        ...formData,
                                                        rawPricing: { ...formData.rawPricing, rent_price: Number(e.target.value) }
                                                    })}
                                                />
                                            </div>
                                        </>
                                    )}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">متراژ (مترمربع)</label>
                                        <input
                                            type="number"
                                            className="w-full border-gray-300 rounded-lg shadow-sm"
                                            value={(formData.attributes as any)?.area || 0}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                attributes: { ...formData.attributes, area: Number(e.target.value) }
                                            })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">تعداد اتاق</label>
                                        <input
                                            type="number"
                                            className="w-full border-gray-300 rounded-lg shadow-sm"
                                            value={(formData.attributes as any)?.rooms || 0}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                attributes: { ...formData.attributes, rooms: Number(e.target.value) }
                                            })}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === "LOCATION" && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-bold text-gray-900">تعیین موقعیت روی نقشه</h2>
                                <p className="text-sm text-gray-500">برای تعیین دقیق موقعیت ملک، روی نقشه کلیک کنید یا نشانگر را جابجا کنید.</p>
                                <DynamicMapPicker
                                    initialCenter={[formData.latitude || 35.6892, formData.longitude || 51.3890]}
                                    onChange={(lat, lng) => setFormData({ ...formData, latitude: lat, longitude: lng })}
                                />
                            </div>
                        )}

                        {step === "MEDIA" && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-bold text-gray-900">تصاویر آگهی</h2>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                    {(formData.mediaIds as any[])?.map((id: string) => (
                                        <div key={id} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 group">
                                            <img
                                                src={`${process.env.NEXT_PUBLIC_API_URL}/media/${id}`}
                                                className="w-full h-full object-cover"
                                                alt="Property"
                                            />
                                            <button
                                                onClick={() => removeMedia(id)}
                                                className="absolute top-1 right-1 bg-white/80 p-1 rounded-full text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                    <label className="aspect-square rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-gray-50 transition-all">
                                        {isUploading ? (
                                            <Loader2 className="h-8 w-8 text-primary animate-spin" />
                                        ) : (
                                            <>
                                                <Upload className="h-8 w-8 text-gray-400" />
                                                <span className="text-xs text-gray-500 mt-2 font-medium">افزودن تصویر</span>
                                            </>
                                        )}
                                        <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} disabled={isUploading} />
                                    </label>
                                </div>
                            </div>
                        )}

                        {step === "REVIEW" && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-bold text-gray-900">بازبینی و ثبت نهایی</h2>
                                <div className="bg-gray-50 rounded-2xl p-6 space-y-4">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">عنوان:</span>
                                        <span className="font-bold">{formData.title}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">دسته‌بندی:</span>
                                        <span className="font-bold">{formData.categoryPath?.categoryKey} / {formData.categoryPath?.subcategoryKey}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">نوع معامله:</span>
                                        <span className="font-bold">{formData.categoryPath?.businessModelKey === 'sale' ? 'فروش' : 'اجاره'}</span>
                                    </div>
                                    <div className="border-t pt-4">
                                        <p className="text-gray-500 mb-2">توضیحات:</p>
                                        <p className="text-sm line-clamp-3">{formData.description}</p>
                                    </div>
                                </div>
                                <p className="text-xs text-warning bg-warning/10 p-4 rounded-xl">
                                    نکته: آگهی شما پس از ثبت، توسط ادمین بررسی و سپس منتشر خواهد شد.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Navigation Buttons */}
                    <div className="mt-12 flex items-center justify-between border-t pt-8">
                        <button
                            onClick={handleBack}
                            disabled={step === "CATEGORY"}
                            className="flex items-center text-gray-600 hover:text-gray-900 disabled:opacity-50 font-bold"
                        >
                            <ChevronRight className="h-5 w-5 ml-1" />
                            قبلی
                        </button>
                        <button
                            onClick={handleNext}
                            disabled={createDraftMutation.isPending}
                            className="bg-primary text-white px-8 py-3 rounded-xl font-black hover:bg-primary-dark transition-all flex items-center disabled:opacity-50 shadow-lg shadow-primary/20"
                        >
                            {createDraftMutation.isPending ? (
                                <Loader2 className="h-5 w-5 animate-spin ml-2" />
                            ) : null}
                            {step === "REVIEW" ? "تایید و ثبت پیش‌نویس" : "بعدی"}
                            {step !== "REVIEW" && <ChevronLeft className="h-5 w-5 mr-1" />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

