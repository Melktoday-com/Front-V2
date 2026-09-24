"use client";

import { CitySelector } from "@/components/CitySelector";
import { DynamicAttributeRenderer } from "@/components/dynamic-form/DynamicAttributeRenderer";
import { DynamicPricingFields } from "@/components/dynamic-form/DynamicPricingFields";
import { useCity } from "@/components/providers/CityProvider";
import { Select } from "@/components/ui/Select";
import { useAd, useCategories } from "@/hooks/useAds";
import { useGeoHierarchy } from "@/hooks/useGeoHierarchy";
import { useUploadMedia } from "@/hooks/useMedia";
import { cn, formatPrice, toPersianDigits, getMediaUrl } from "@/lib/utils";
import { normalizeApiError } from "@/lib/api/error-handler";
import { adsService } from "@/services/ads.service";
import { CreateAdDraftRequest, PriceModel, SubcategoryConfigResponse } from "@/types/api/ads.types";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
    Check,
    ChevronLeft,
    ChevronRight,
    Image as ImageIcon,
    Info,
    Loader2,
    LucideIcon,
    MapPin,
    Send,
    Sparkles,
    Tag,
    Upload,
    Wallet,
    X
} from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AdminOwnershipSelector, AdminOwnershipData } from "@/components/admin/AdminOwnershipSelector";
import { adminService } from "@/services/admin.service";
import { AdminCreateAdRequest } from "@/types/api/admin.types";

// Leaflet is client-side only
const DynamicMapPicker = dynamic(() => import("@/components/ui/MapPicker"), { ssr: false });

type Step = "CATEGORY" | "BASIC_INFO" | "DETAILS" | "LOCATION" | "MEDIA" | "REVIEW";

const STEPS_CONFIG: { id: Step; label: string; icon: LucideIcon }[] = [
    { id: "CATEGORY", icon: Tag, label: "دسته‌بندی" },
    { id: "BASIC_INFO", icon: Check, label: "اطلاعات پایه" },
    { id: "DETAILS", icon: Wallet, label: "قیمت و مشخصات" },
    { id: "LOCATION", icon: MapPin, label: "موقعیت" },
    { id: "MEDIA", icon: ImageIcon, label: "تصاویر" },
    { id: "REVIEW", icon: Send, label: "بازبینی و ثبت" },
];

interface SubmitAdSceneProps {
    adminMode?: boolean;
}

export default function SubmitAdScene({ adminMode = false }: SubmitAdSceneProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const editAdId = searchParams.get("edit");
    const { selectedCity } = useCity();

    const [adminOwnership, setAdminOwnership] = useState<AdminOwnershipData>({
        isPlatform: true,
        phoneNumber: "",
        firstName: "",
        lastName: "",
    });

    const [step, setStep] = useState<Step>("CATEGORY");
    const [submitForApproval, setSubmitForApproval] = useState(false);
    const [isCitySelectorOpen, setIsCitySelectorOpen] = useState(false);
    const [cityName, setCityName] = useState(selectedCity?.name || "");
    const [pricingErrors, setPricingErrors] = useState<Record<string, string>>({});
    const [attributeErrors, setAttributeErrors] = useState<Record<string, string>>({});
    const [titleError, setTitleError] = useState<string>("");
    const [descriptionError, setDescriptionError] = useState<string>("");

    const initialCoords = (selectedCity?.centerPoint?.latitude && selectedCity?.centerPoint?.longitude)
        ? { latitude: selectedCity.centerPoint.latitude, longitude: selectedCity.centerPoint.longitude }
        : { latitude: 35.6892, longitude: 51.3890 };

    const [formData, setFormData] = useState<Partial<CreateAdDraftRequest>>({
        cityId: selectedCity?.id || undefined,
        categoryPath: {
            categoryKey: "",
            subcategoryKey: "",
            businessModelKey: "",
            attributeSchemaVersion: 1,
        },
        attributes: {},
        rawPricing: {},
        latitude: initialCoords.latitude,
        longitude: initialCoords.longitude,
        mediaIds: [] as string[],
    });

    const { data: categories } = useCategories();
    const { data: geoHierarchy } = useGeoHierarchy();
    const { mutateAsync: uploadMedia, isPending: isUploading } = useUploadMedia();

    // Fetch ad if editing
    const { data: existingAd, isLoading: isLoadingExisting } = useAd(editAdId || "");

    // Fetch dynamic subcategory config when subcategoryKey is selected
    const selectedSubcategoryKey = formData.categoryPath?.subcategoryKey;
    const selectedCategoryKey = formData.categoryPath?.categoryKey;

    const { data: subcatConfig, isLoading: isLoadingConfig } = useQuery<SubcategoryConfigResponse>({
        queryKey: ["subcategory-config", selectedSubcategoryKey, selectedCategoryKey],
        queryFn: () => adsService.getSubcategoryConfig(selectedSubcategoryKey!, selectedCategoryKey),
        enabled: Boolean(selectedSubcategoryKey),
        staleTime: 1000 * 60 * 5,
    });

    // Active price model resolution
    const activePriceModel = useMemo<PriceModel | undefined>(() => {
        if (!subcatConfig?.allowedPriceModels?.length) return undefined;
        const currentKey = formData.categoryPath?.businessModelKey;
        if (currentKey) {
            const found = subcatConfig.allowedPriceModels.find(
                (m) => m.key === currentKey || m.id === currentKey
            );
            if (found) return found;
        }
        // Default to default model or first allowed
        return (
            subcatConfig.allowedPriceModels.find((m) => m.isDefault) ||
            subcatConfig.allowedPriceModels[0]
        );
    }, [subcatConfig, formData.categoryPath?.businessModelKey]);

    // Automatically set businessModelKey when subcatConfig loads and no key is set yet
    useEffect(() => {
        if (activePriceModel && (!formData.categoryPath?.businessModelKey || formData.categoryPath.businessModelKey !== activePriceModel.key)) {
            setFormData((prev) => ({
                ...prev,
                categoryPath: {
                    categoryKey: prev.categoryPath?.categoryKey || "",
                    subcategoryKey: prev.categoryPath?.subcategoryKey || "",
                    attributeSchemaVersion: prev.categoryPath?.attributeSchemaVersion || 1,
                    businessModelKey: activePriceModel.key,
                },
            }));
        }
    }, [activePriceModel]);

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

    // Ensure default city is set from selectedCity if not in edit mode and cityId is empty
    useEffect(() => {
        if (!editAdId && selectedCity?.id && !formData.cityId) {
            setFormData((prev) => ({
                ...prev,
                cityId: selectedCity.id,
                latitude: selectedCity.centerPoint?.latitude ?? prev.latitude ?? 35.6892,
                longitude: selectedCity.centerPoint?.longitude ?? prev.longitude ?? 51.3890,
            }));
            if (!cityName) {
                setCityName(selectedCity.name);
            }
        }
    }, [editAdId, selectedCity, formData.cityId, cityName]);

    // Resolve city name and coordinates dynamically from geoHierarchy API
    useEffect(() => {
        if (!geoHierarchy || geoHierarchy.length === 0) return;

        if (formData.cityId) {
            let matchedCity: { id: string; name: string; centerPoint?: { latitude: number; longitude: number } } | null = null;
            for (const province of geoHierarchy) {
                const found = province.cities.find((c) => c.id === formData.cityId);
                if (found) {
                    matchedCity = found;
                    break;
                }
            }

            if (matchedCity) {
                if (!cityName) {
                    setCityName(matchedCity.name);
                }
                if (
                    matchedCity.centerPoint?.latitude &&
                    matchedCity.centerPoint?.longitude &&
                    (!formData.latitude ||
                        (formData.latitude === 35.6892 &&
                            formData.longitude === 51.3890 &&
                            matchedCity.name !== "تهران"))
                ) {
                    setFormData((prev) => ({
                        ...prev,
                        latitude: matchedCity!.centerPoint!.latitude,
                        longitude: matchedCity!.centerPoint!.longitude,
                    }));
                }
            } else {
                // formData.cityId is NOT in geoHierarchy (stale localStorage or invalid ID)
                // Attempt to heal by matching cityName or selectedCity.name
                const targetName = cityName || selectedCity?.name || "تهران";
                let fallbackCity: { id: string; name: string; centerPoint?: { latitude: number; longitude: number } } | null = null;
                for (const province of geoHierarchy) {
                    const found = province.cities.find((c) => c.name === targetName);
                    if (found) {
                        fallbackCity = found;
                        break;
                    }
                }

                if (fallbackCity) {
                    setFormData((prev) => ({
                        ...prev,
                        cityId: fallbackCity!.id,
                        latitude: fallbackCity!.centerPoint?.latitude ?? prev.latitude ?? 35.6892,
                        longitude: fallbackCity!.centerPoint?.longitude ?? prev.longitude ?? 51.3890,
                    }));
                    setCityName(fallbackCity.name);
                } else {
                    setFormData((prev) => ({ ...prev, cityId: undefined }));
                    setCityName("");
                }
            }
        }
    }, [formData.cityId, cityName, geoHierarchy, formData.latitude, formData.longitude, selectedCity?.name]);

    // Dynamically retrieve city center coordinates from geoHierarchy API response
    const cityCoordinates = useMemo<[number, number]>(() => {
        if (formData.cityId && geoHierarchy) {
            for (const province of geoHierarchy) {
                const found = province.cities.find((c) => c.id === formData.cityId);
                if (found?.centerPoint?.latitude && found?.centerPoint?.longitude) {
                    return [found.centerPoint.latitude, found.centerPoint.longitude];
                }
            }
        }
        if (cityName && geoHierarchy) {
            for (const province of geoHierarchy) {
                const found = province.cities.find((c) => c.name === cityName);
                if (found?.centerPoint?.latitude && found?.centerPoint?.longitude) {
                    return [found.centerPoint.latitude, found.centerPoint.longitude];
                }
            }
        }
        if (selectedCity?.centerPoint?.latitude && selectedCity?.centerPoint?.longitude) {
            return [selectedCity.centerPoint.latitude, selectedCity.centerPoint.longitude];
        }
        return [35.6892, 51.3890];
    }, [formData.cityId, geoHierarchy, cityName, selectedCity]);

    const submitMutation = useMutation({
        mutationFn: async ({ shouldPublish }: { shouldPublish: boolean }) => {
            if (adminMode) {
                const payload: AdminCreateAdRequest = {
                    isPlatform: adminOwnership.isPlatform,
                    phoneNumber: adminOwnership.isPlatform ? undefined : adminOwnership.phoneNumber.trim(),
                    firstName: adminOwnership.isPlatform ? undefined : adminOwnership.firstName.trim(),
                    lastName: adminOwnership.isPlatform ? undefined : adminOwnership.lastName.trim(),
                    targetOwnerId: adminOwnership.targetOwnerId,
                    cityId: formData.cityId!,
                    categoryPath: {
                        categoryKey: formData.categoryPath!.categoryKey,
                        subcategoryKey: formData.categoryPath!.subcategoryKey,
                        businessModelKey: formData.categoryPath!.businessModelKey,
                        attributeSchemaVersion: formData.categoryPath!.attributeSchemaVersion || 1,
                    },
                    title: formData.title!,
                    description: formData.description!,
                    rawPricing: (formData.rawPricing as Record<string, number>) || {},
                    attributes: formData.attributes || {},
                    latitude: formData.latitude || 35.6892,
                    longitude: formData.longitude || 51.389,
                    mediaIds: formData.mediaIds || [],
                };
                const created = await adminService.createAd(payload);
                return { adId: created?.id || "", shouldPublish: true };
            }

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
                const payload: CreateAdDraftRequest = {
                    cityId: formData.cityId!,
                    categoryPath: {
                        categoryKey: formData.categoryPath!.categoryKey,
                        subcategoryKey: formData.categoryPath!.subcategoryKey,
                        businessModelKey: formData.categoryPath!.businessModelKey,
                        attributeSchemaVersion: formData.categoryPath!.attributeSchemaVersion || 1,
                    },
                    title: formData.title!,
                    description: formData.description!,
                    rawPricing: (formData.rawPricing as Record<string, number>) || {},
                    attributes: formData.attributes || {},
                    latitude: formData.latitude || 35.6892,
                    longitude: formData.longitude || 51.389,
                    mediaIds: formData.mediaIds || [],
                };
                const created = await adsService.createDraft(payload);
                adId = created.adId;
            }

            // If user requested approval review, submit it
            if (shouldPublish && adId) {
                await adsService.submitForReview(adId);
            }

            return { adId, shouldPublish };
        },
        onSuccess: ({ shouldPublish }) => {
            if (adminMode) {
                toast.success("آگهی با موفقیت توسط ادمین ثبت گردید");
                router.push("/admin/ads");
                return;
            }
            if (shouldPublish) {
                toast.success("آگهی با موفقیت ثبت و جهت بررسی و انتشار به ادمین ارسال شد");
            } else {
                toast.success("آگهی با موفقیت به عنوان پیش‌نویس ذخیره شد");
            }
            router.push("/profile/ads");
        },
        onError: (err: Error) => {
            const msg = normalizeApiError(err, "خطا در ذخیره‌سازی آگهی");
            toast.error(msg);
        },
    });

    const currentStepIndex = STEPS_CONFIG.findIndex((s) => s.id === step);

    const validateDetailsStep = (): boolean => {
        let isValid = true;
        const pErrors: Record<string, string> = {};
        const aErrors: Record<string, string> = {};

        // Validate required pricing fields
        if (activePriceModel) {
            for (const field of activePriceModel.pricingFields) {
                const val = formData.rawPricing?.[field.key];
                if (field.required && (val === undefined || val === null || isNaN(Number(val)) || String(val).trim() === "")) {
                    pErrors[field.key] = `فیلد ${field.label} الزامی است`;
                    isValid = false;
                }
            }
        }

        // Validate required attributes
        if (subcatConfig?.attributeDefinitions) {
            for (const attr of subcatConfig.attributeDefinitions) {
                const val = formData.attributes?.[attr.key];
                if (attr.required && (val === undefined || val === null || val === "")) {
                    aErrors[attr.key] = `تکمیل مشخصه ${attr.label} الزامی است`;
                    isValid = false;
                }
            }
        }

        setPricingErrors(pErrors);
        setAttributeErrors(aErrors);

        if (!isValid) {
            toast.error("لطفاً فیلدهای الزامی مشخص شده را تکمیل فرمایید");
        }

        return isValid;
    };

    const handleNext = () => {
        // Validation per step
        if (step === "CATEGORY") {
            if (adminMode && !adminOwnership.isPlatform) {
                const phone = adminOwnership.phoneNumber?.trim() || "";
                if (!phone) {
                    toast.error("لطفاً شماره تماس مالک آگهی را وارد فرمایید");
                    return;
                }
                if (!/^09\d{9}$/.test(phone)) {
                    toast.error("شماره تماس مالک باید با ۰۹ شروع شده و ۱۱ رقم باشد");
                    return;
                }
                if (adminOwnership.isUserFound === false) {
                    if (!adminOwnership.firstName?.trim() || !adminOwnership.lastName?.trim()) {
                        toast.error("لطفاً نام و نام خانوادگی مالک جدید را جهت ایجاد حساب کاربری وارد فرمایید");
                        return;
                    }
                }
            }

            if (!formData.cityId) {
                toast.error("لطفاً شهر ملک را مشخص فرمایید");
                setIsCitySelectorOpen(true);
                return;
            }

            if (geoHierarchy && geoHierarchy.length > 0) {
                const isCityValid = geoHierarchy.some((p) => p.cities.some((c) => c.id === formData.cityId));
                if (!isCityValid) {
                    toast.error("شهر انتخاب شده در سامانه معتبر نیست. لطفاً مجدداً شهر را انتخاب فرمایید");
                    setIsCitySelectorOpen(true);
                    return;
                }
            }

            if (!formData.categoryPath?.categoryKey) {
                toast.error("لطفاً دسته‌بندی اصلی ملک را انتخاب فرمایید");
                return;
            }
            if (!formData.categoryPath?.subcategoryKey) {
                toast.error("لطفاً زیردسته ملک را انتخاب فرمایید");
                return;
            }
            if (!formData.categoryPath?.businessModelKey && activePriceModel) {
                setFormData((prev) => ({
                    ...prev,
                    categoryPath: {
                        categoryKey: prev.categoryPath?.categoryKey || "",
                        subcategoryKey: prev.categoryPath?.subcategoryKey || "",
                        attributeSchemaVersion: prev.categoryPath?.attributeSchemaVersion || 1,
                        businessModelKey: activePriceModel.key,
                    },
                }));
            } else if (!formData.categoryPath?.businessModelKey && !activePriceModel) {
                toast.error("لطفاً نوع معامله ملک را انتخاب فرمایید");
                return;
            }
        }

        if (step === "BASIC_INFO") {
            let hasBasicError = false;
            const trimmedTitle = formData.title?.trim() || "";
            const trimmedDesc = formData.description?.trim() || "";

            if (!trimmedTitle) {
                setTitleError("عنوان آگهی الزامی است");
                hasBasicError = true;
            } else if (trimmedTitle.length < 5) {
                setTitleError("عنوان آگهی باید حداقل ۵ کاراکتر باشد");
                hasBasicError = true;
            } else if (trimmedTitle.length > 120) {
                setTitleError("عنوان آگهی حداکثر می‌تواند ۱۲۰ کاراکتر باشد");
                hasBasicError = true;
            } else {
                setTitleError("");
            }

            if (!trimmedDesc) {
                setDescriptionError("توضیحات آگهی الزامی است");
                hasBasicError = true;
            } else if (trimmedDesc.length < 20) {
                setDescriptionError(`توضیحات آگهی باید حداقل ۲۰ کاراکتر باشد (تعداد فعلی: ${toPersianDigits(trimmedDesc.length)} کاراکتر)`);
                hasBasicError = true;
            } else if (trimmedDesc.length > 4000) {
                setDescriptionError("توضیحات آگهی حداکثر می‌تواند ۴۰۰۰ کاراکتر باشد");
                hasBasicError = true;
            } else {
                setDescriptionError("");
            }

            if (hasBasicError) {
                toast.error("لطفاً خطاهای مشخص شده در عنوان و توضیحات را برطرف فرمایید");
                return;
            }
        }

        if (step === "DETAILS") {
            if (!validateDetailsStep()) {
                return;
            }
        }

        if (step === "LOCATION") {
            if (
                formData.latitude === undefined ||
                formData.longitude === undefined ||
                isNaN(Number(formData.latitude)) ||
                isNaN(Number(formData.longitude))
            ) {
                toast.error("تعیین موقعیت مکانی ملک روی نقشه الزامی است");
                return;
            }
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

    const currentSubcategory = useMemo(() => {
        if (!categories || !formData.categoryPath?.categoryKey) return null;
        const cat = categories.find((c) => c.key === formData.categoryPath?.categoryKey);
        return cat?.subcategories?.find((s) => s.key === formData.categoryPath?.subcategoryKey);
    }, [categories, formData.categoryPath?.categoryKey, formData.categoryPath?.subcategoryKey]);

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
                <header className="mb-6 flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-black text-brand">
                            {adminMode
                                ? "ثبت آگهی ملک (پنل مدیریت)"
                                : editAdId
                                    ? "ویرایش آگهی ملک"
                                    : "ثبت آگهی ملک"}
                        </h1>
                        <p className="text-xs text-text-light mt-1">
                            {adminMode
                                ? "ثبت مستقیم آگهی به عنوان آگهی سازمانی یا از طرف کاربر با امکان ثبت‌نام هوشمند مالک"
                                : "اطلاعات ملک خود را تکمیل نمایید تا در سریع‌ترین زمان متقاضیان واقعی با شما تماس بگیرند."}
                        </p>
                    </div>
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
                                {adminMode && (
                                    <AdminOwnershipSelector
                                        value={adminOwnership}
                                        onChange={setAdminOwnership}
                                        themeColor="blue"
                                    />
                                )}

                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-black text-brand">انتخاب شهر و دسته‌بندی ملک</h2>
                                </div>

                                <div className="grid grid-cols-1 gap-5">
                                    <div>
                                        <label className="block text-xs font-bold text-brand mb-2">
                                            شهر ملک <span className="text-red-500">*</span>
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => setIsCitySelectorOpen(true)}
                                            className="w-full flex items-center justify-between p-3.5 sm:p-4 bg-soft-bg hover:bg-soft-bg/80 border border-soft-border hover:border-primary/50 rounded-2xl transition-all group text-right focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-10 h-10 rounded-xl bg-white border border-soft-border flex items-center justify-center group-hover:border-primary/30 group-hover:text-primary transition-colors text-brand shrink-0">
                                                    <MapPin className="w-5 h-5 text-primary" />
                                                </div>
                                                <div className="min-w-0 text-right">
                                                    <span className={cn("text-sm font-black block truncate", cityName ? "text-brand" : "text-secondary/60")}>
                                                        {cityName || "انتخاب شهر ملک..."}
                                                    </span>
                                                    <span className="text-[11px] text-secondary font-medium">
                                                        {cityName ? "برای تغییر شهر کلیک کنید" : "شهر مورد نظر خود را انتخاب کنید"}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-xl group-hover:bg-primary group-hover:text-white transition-all shrink-0">
                                                <span>تغییر شهر</span>
                                                <ChevronLeft className="w-4 h-4" />
                                            </div>
                                        </button>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-brand mb-2">
                                            دسته‌بندی اصلی <span className="text-red-500">*</span>
                                        </label>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                            {categories?.map((cat) => {
                                                const isSelected = formData.categoryPath?.categoryKey === cat.key;
                                                return (
                                                    <button
                                                        type="button"
                                                        key={cat.id || cat.key}
                                                        onClick={() => {
                                                            const firstSub = cat.subcategories?.[0];
                                                            setFormData((prev) => ({
                                                                ...prev,
                                                                categoryPath: {
                                                                    categoryKey: cat.key,
                                                                    subcategoryKey: firstSub?.key || "",
                                                                    businessModelKey: "",
                                                                    attributeSchemaVersion: 1,
                                                                },
                                                                rawPricing: {},
                                                                attributes: {},
                                                            }));
                                                        }}
                                                        className={cn(
                                                            "p-4 border rounded-2xl text-right transition-all flex flex-col justify-between min-h-[70px]",
                                                            isSelected
                                                                ? "border-primary bg-primary/10 text-brand font-bold shadow-xs"
                                                                : "border-gray-200 hover:border-primary/40 text-text-light bg-white"
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-2.5">
                                                            {cat.icon && (
                                                                <img
                                                                    src={getMediaUrl(cat.icon)}
                                                                    alt=""
                                                                    className="w-7 h-7 object-contain rounded-lg p-0.5 bg-gray-50 border border-gray-100 shrink-0"
                                                                />
                                                            )}
                                                            <span className="block text-sm font-black">{cat.displayName}</span>
                                                        </div>
                                                        {cat.description && (
                                                            <span className="block text-[11px] text-text-light mt-1 line-clamp-1">
                                                                {cat.description}
                                                            </span>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {formData.categoryPath?.categoryKey && (
                                        <div className="space-y-4">
                                            <div>
                                                <Select
                                                    label="زیردسته ملک *"
                                                    value={formData.categoryPath?.subcategoryKey || ""}
                                                    onChange={(val) => {
                                                        setFormData((prev) => ({
                                                            ...prev,
                                                            categoryPath: {
                                                                categoryKey: prev.categoryPath?.categoryKey || "",
                                                                subcategoryKey: val,
                                                                businessModelKey: "",
                                                                attributeSchemaVersion: 1,
                                                            },
                                                            rawPricing: {},
                                                            attributes: {},
                                                        }));
                                                    }}
                                                    options={
                                                        categories
                                                            ?.find((c) => c.key === formData.categoryPath?.categoryKey)
                                                            ?.subcategories?.map((sub) => ({
                                                                value: sub.key,
                                                                label: sub.displayName,
                                                                icon: sub.icon ? (
                                                                    <img
                                                                        src={getMediaUrl(sub.icon)}
                                                                        alt=""
                                                                        className="w-4 h-4 object-contain rounded shrink-0"
                                                                    />
                                                                ) : undefined,
                                                            })) || []
                                                    }
                                                    placeholder="انتخاب زیردسته..."
                                                />
                                            </div>

                                            {/* Transaction Type Selection within Step 1 */}
                                            {formData.categoryPath?.subcategoryKey && subcatConfig?.allowedPriceModels && (
                                                <div>
                                                    {subcatConfig.allowedPriceModels.length > 1 ? (
                                                        <div>
                                                            <label className="block text-xs font-bold text-brand mb-2">
                                                                نوع معامله <span className="text-red-500">*</span>
                                                            </label>
                                                            <div className="flex flex-wrap gap-2.5">
                                                                {subcatConfig.allowedPriceModels.map((pm) => {
                                                                    const isSelected =
                                                                        (formData.categoryPath?.businessModelKey || activePriceModel?.key) === pm.key;
                                                                    return (
                                                                        <button
                                                                            key={pm.key}
                                                                            type="button"
                                                                            onClick={() => {
                                                                                setFormData((prev) => ({
                                                                                    ...prev,
                                                                                    categoryPath: {
                                                                                        categoryKey: prev.categoryPath?.categoryKey || "",
                                                                                        subcategoryKey: prev.categoryPath?.subcategoryKey || "",
                                                                                        attributeSchemaVersion: prev.categoryPath?.attributeSchemaVersion || 1,
                                                                                        businessModelKey: pm.key,
                                                                                    },
                                                                                    rawPricing: {},
                                                                                }));
                                                                                setPricingErrors({});
                                                                            }}
                                                                            className={cn(
                                                                                "px-4 py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-2",
                                                                                isSelected
                                                                                    ? "border-primary bg-primary text-white shadow-xs"
                                                                                    : "border-gray-200 bg-white text-text-light hover:border-primary/40 hover:text-brand"
                                                                            )}
                                                                        >
                                                                            {isSelected && <Check className="w-3.5 h-3.5" />}
                                                                            <span>{pm.displayName}</span>
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    ) : subcatConfig.allowedPriceModels.length === 1 ? (
                                                        <div className="p-3.5 bg-primary/5 border border-primary/20 rounded-2xl flex items-center justify-between">
                                                            <span className="text-xs text-text-light font-medium">نوع معامله تعیین‌شده:</span>
                                                            <span className="text-xs font-black text-primary flex items-center gap-1.5">
                                                                <Check className="w-4 h-4" />
                                                                {subcatConfig.allowedPriceModels[0].displayName}
                                                            </span>
                                                        </div>
                                                    ) : null}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* 2. BASIC_INFO */}
                        {step === "BASIC_INFO" && (
                            <div className="space-y-6">
                                <h2 className="text-lg font-black text-brand">عنوان و توضیحات آگهی</h2>
                                <div className="space-y-5">
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="block text-xs font-bold text-brand">
                                                عنوان آگهی <span className="text-red-500">*</span>
                                            </label>
                                            <span className="text-[11px] text-text-light font-medium">
                                                {toPersianDigits(formData.title?.length || 0)} / ۱۲۰ کاراکتر (حداقل ۵)
                                            </span>
                                        </div>
                                        <input
                                            type="text"
                                            className={cn(
                                                "w-full p-3.5 border rounded-xl text-sm focus:bg-white focus:ring-2 outline-hidden transition-all",
                                                titleError
                                                    ? "border-red-500 bg-red-50/40 focus:ring-red-400 text-red-900"
                                                    : "border-gray-200 bg-gray-50 focus:ring-primary focus:border-primary"
                                            )}
                                            placeholder="مثلاً: آپارتمان ۱۱۰ متری دو خوابه فول امکانات در ونک"
                                            value={formData.title || ""}
                                            onChange={(e) => {
                                                setFormData({ ...formData, title: e.target.value });
                                                if (titleError) setTitleError("");
                                            }}
                                        />
                                        {titleError && (
                                            <p className="text-xs text-red-500 font-bold mt-1.5 flex items-center gap-1">
                                                <span>⚠️</span>
                                                <span>{titleError}</span>
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="block text-xs font-bold text-brand">
                                                توضیحات تکمیلی <span className="text-red-500">*</span>
                                            </label>
                                            <span className="text-[11px] text-text-light font-medium">
                                                {toPersianDigits(formData.description?.length || 0)} / ۴۰۰۰ کاراکتر (حداقل ۲۰)
                                            </span>
                                        </div>
                                        <textarea
                                            rows={6}
                                            className={cn(
                                                "w-full p-3.5 border rounded-xl text-sm focus:bg-white focus:ring-2 outline-hidden leading-relaxed transition-all",
                                                descriptionError
                                                    ? "border-red-500 bg-red-50/40 focus:ring-red-400 text-red-900"
                                                    : "border-gray-200 bg-gray-50 focus:ring-primary focus:border-primary"
                                            )}
                                            placeholder="امکانات، موقعیت دسترسی، شرایط بازدید و ویژگی‌های شاخص ملک را شرح دهید (حداقل ۲۰ کاراکتر)..."
                                            value={formData.description || ""}
                                            onChange={(e) => {
                                                setFormData({ ...formData, description: e.target.value });
                                                if (descriptionError) setDescriptionError("");
                                            }}
                                        />
                                        {descriptionError && (
                                            <p className="text-xs text-red-500 font-bold mt-1.5 flex items-center gap-1">
                                                <span>⚠️</span>
                                                <span>{descriptionError}</span>
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 3. DETAILS (DYNAMIC PRICE MODEL & DYNAMIC ATTRIBUTES) */}
                        {step === "DETAILS" && (
                            <div className="space-y-8">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-black text-brand">شرایط معامله و مشخصات ملک</h2>
                                    {isLoadingConfig && (
                                        <div className="flex items-center gap-1.5 text-xs text-primary font-bold">
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            <span>در حال بارگذاری فرم تخصصی...</span>
                                        </div>
                                    )}
                                </div>

                                {/* Locked Active Price Model Display */}
                                {activePriceModel && (
                                    <div className="flex items-center justify-between p-4 bg-gray-50/80 border border-gray-200/80 rounded-2xl">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                                <Wallet className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <span className="text-[11px] text-text-light font-medium block">
                                                    نوع معامله:
                                                </span>
                                                <span className="text-sm font-black text-brand">
                                                    {activePriceModel.displayName}
                                                </span>
                                            </div>
                                        </div>
                                        <span className="text-[11px] text-text-light bg-white border border-gray-200 px-3 py-1 rounded-xl">
                                            تعیین‌شده در مرحله دسته‌بندی
                                        </span>
                                    </div>
                                )}

                                {/* Dynamic Pricing Fields based on selected PriceModel */}
                                {activePriceModel && (
                                    <div className="p-5 bg-gray-50/60 border border-gray-200/80 rounded-2xl">
                                        <DynamicPricingFields
                                            priceModel={activePriceModel}
                                            values={formData.rawPricing || {}}
                                            onChange={(key, value) => {
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    rawPricing: {
                                                        ...prev.rawPricing,
                                                        [key]: value,
                                                    },
                                                }));
                                                if (pricingErrors[key]) {
                                                    setPricingErrors((prev) => {
                                                        const copy = { ...prev };
                                                        delete copy[key];
                                                        return copy;
                                                    });
                                                }
                                            }}
                                            errors={pricingErrors}
                                        />
                                    </div>
                                )}

                                {/* Dynamic Attributes Renderer based on Subcategory Attribute Definitions */}
                                {subcatConfig?.attributeDefinitions && subcatConfig.attributeDefinitions.length > 0 && (
                                    <div className="pt-2">
                                        <h3 className="text-sm font-bold text-brand mb-4 pb-2 border-b border-gray-100">
                                            مشخصات فنی و امکانات {subcatConfig.subcategory?.displayName || "ملک"}
                                        </h3>
                                        <DynamicAttributeRenderer
                                            definitions={subcatConfig.attributeDefinitions}
                                            values={formData.attributes || {}}
                                            onChange={(key, value) => {
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    attributes: {
                                                        ...prev.attributes,
                                                        [key]: value,
                                                    },
                                                }));
                                                if (attributeErrors[key]) {
                                                    setAttributeErrors((prev) => {
                                                        const copy = { ...prev };
                                                        delete copy[key];
                                                        return copy;
                                                    });
                                                }
                                            }}
                                            errors={attributeErrors}
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 4. LOCATION */}
                        {step === "LOCATION" && (
                            <div className="space-y-4">
                                <div>
                                    <h2 className="text-lg font-black text-brand">تعیین موقعیت روی نقشه</h2>
                                    <p className="text-xs text-text-light mt-1">
                                        نقشه به صورت خودکار روی شهر انتخابی شما ({cityName || "شهر انتخاب‌شده"}) تنظیم شده است. با کلیک روی نقشه، جابجایی نشانگر یا استفاده از دکمه «موقعیت فعلی من»، محل دقیق ملک را مشخص نمایید.
                                    </p>
                                </div>
                                <div>
                                    <DynamicMapPicker
                                        cityCenter={cityCoordinates}
                                        cityName={cityName}
                                        initialCenter={cityCoordinates}
                                        value={
                                            formData.latitude && formData.longitude
                                                ? [formData.latitude, formData.longitude]
                                                : cityCoordinates
                                        }
                                        zoom={13}
                                        onChange={(lat, lng) =>
                                            setFormData((prev) => ({ ...prev, latitude: lat, longitude: lng }))
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
                                    آگهی‌های دارای تصویر واقعی تا ۵ برابر بیشتر بازدید دریافت می‌کنند.
                                </p>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                    {formData.mediaIds?.map((id: string) => (
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
                                <h2 className="text-lg font-black text-brand">بازبینی و تایید آگهی</h2>
                                <div className="bg-gray-50/80 rounded-2xl p-6 space-y-4 border border-gray-100 text-sm">
                                    {adminMode && (
                                        <div className="flex justify-between pb-2 border-b border-gray-200/50">
                                            <span className="text-text-light">نوع مالکیت آگهی:</span>
                                            <span className="font-bold text-brand">
                                                {adminOwnership.isPlatform
                                                    ? "سازمانی (متعلق به سامانه)"
                                                    : `به نام کاربر: ${adminOwnership.foundUserName || `${adminOwnership.firstName} ${adminOwnership.lastName}`} (${adminOwnership.phoneNumber})`}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex justify-between pb-2 border-b border-gray-200/50">
                                        <span className="text-text-light">عنوان آگهی:</span>
                                        <span className="font-bold text-brand text-left">{formData.title}</span>
                                    </div>
                                    <div className="flex justify-between pb-2 border-b border-gray-200/50">
                                        <span className="text-text-light">شهر و منطقه:</span>
                                        <span className="font-bold text-brand">{cityName}</span>
                                    </div>
                                    <div className="flex justify-between pb-2 border-b border-gray-200/50">
                                        <span className="text-text-light">دسته‌بندی:</span>
                                        <span className="font-bold text-brand">
                                            {subcatConfig?.subcategory?.categoryDisplayName || formData.categoryPath?.categoryKey} / {subcatConfig?.subcategory?.displayName || formData.categoryPath?.subcategoryKey}
                                        </span>
                                    </div>
                                    <div className="flex justify-between pb-2 border-b border-gray-200/50">
                                        <span className="text-text-light">مدل معامله:</span>
                                        <span className="font-bold text-primary">
                                            {activePriceModel?.displayName || formData.categoryPath?.businessModelKey}
                                        </span>
                                    </div>

                                    {/* Pricing breakdown */}
                                    {activePriceModel && (
                                        <div className="py-2 space-y-2">
                                            <p className="text-xs font-bold text-text-light">شرایط مالی:</p>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {activePriceModel.pricingFields.map((f) => {
                                                    const val = formData.rawPricing?.[f.key];
                                                    if (val === undefined || val === null || val === "") return null;
                                                    return (
                                                        <div key={f.key} className="flex justify-between p-2.5 bg-white rounded-xl border border-gray-200/60 text-xs">
                                                            <span className="text-text-light">{f.label}:</span>
                                                            <span className="font-bold text-brand">
                                                                {f.fieldType === "NUMBER" ? formatPrice(Number(val)) : String(val)} {f.unit || ""}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    <div className="border-t border-gray-200/60 pt-3">
                                        <p className="text-text-light text-xs mb-1">توضیحات آگهی:</p>
                                        <p className="text-xs text-text-main line-clamp-3 leading-relaxed">
                                            {formData.description}
                                        </p>
                                    </div>
                                </div>

                                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 text-xs text-amber-800 leading-relaxed flex items-start gap-2.5">
                                    <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                    <span>
                                        {adminMode
                                            ? "با کلیک روی ثبت نهایی، آگهی به صورت مستقیم در وضعیت فعال در سامانه ثبت و منتشر می‌شود."
                                            : "می‌توانید آگهی را هم‌اکنون به صورت پیش‌نویس ذخیره کرده و بعداً ویرایش فرمایید، یا مستقیماً جهت بررسی و تایید کارشناسان ثبت نهایی کنید."}
                                    </span>
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
                            adminMode ? (
                                <button
                                    type="button"
                                    onClick={() => submitMutation.mutate({ shouldPublish: true })}
                                    disabled={submitMutation.isPending}
                                    className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-black text-xs hover:bg-blue-700 shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all"
                                >
                                    {submitMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                                    <span>ثبت نهایی آگهی در پنل مدیریت</span>
                                </button>
                            ) : (
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
                            )
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

            {/* City Selector Modal */}
            <CitySelector
                isOpen={isCitySelectorOpen}
                onClose={() => setIsCitySelectorOpen(false)}
                currentCityId={formData.cityId}
                onSelect={(city) => {
                    setFormData((prev) => ({
                        ...prev,
                        cityId: city.id,
                        latitude: city.centerPoint?.latitude ?? prev.latitude ?? 35.6892,
                        longitude: city.centerPoint?.longitude ?? prev.longitude ?? 51.3890,
                    }));
                    setCityName(city.name);
                }}
            />
        </div>
    );
}
