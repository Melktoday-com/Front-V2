"use client";

import { CitySelector } from "@/components/CitySelector";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { DynamicPricingFields } from "@/components/dynamic-form/DynamicPricingFields";
import { DynamicAttributeRenderer } from "@/components/dynamic-form/DynamicAttributeRenderer";
import { useUploadMedia } from "@/hooks/useMedia";
import { useCreateTemporaryRentDraft } from "@/hooks/useTemporaryRent";
import { temporaryRentService } from "@/services/temporary-rent.service";
import {
    CreateTemporaryRentDraftRequest,
    TemporaryRentCategory,
    TemporaryRentSubcategoryConfigResponse,
} from "@/types/api/temporary-rent.types";
import { normalizeApiError } from "@/lib/api/error-handler";
import { useQuery } from "@tanstack/react-query";
import {
    Calendar,
    Check,
    ChevronLeft,
    ChevronRight,
    Image as ImageIcon,
    Loader2,
    LucideIcon,
    MapPin,
    Plus,
    Tag,
    Trash2,
    Upload,
    Wallet,
    X,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { cn, formatPrice, toPersianDigits, getMediaUrl } from "@/lib/utils";
import { AdminOwnershipSelector, AdminOwnershipData } from "@/components/admin/AdminOwnershipSelector";
import { adminService } from "@/services/admin.service";
import { AdminCreateTemporaryRentRequest } from "@/types/api/admin.types";
import { useGeoHierarchy } from "@/hooks/useGeoHierarchy";

// Leaflet is client-side only
const DynamicMapPicker = dynamic(() => import("@/components/ui/MapPicker"), { ssr: false });

type Step = "CATEGORY" | "DETAILS" | "LOCATION" | "MEDIA" | "REVIEW";

const STEPS_CONFIG: { id: Step; label: string; icon: LucideIcon }[] = [
    { id: "CATEGORY", icon: Tag, label: "دسته‌بندی و شهر" },
    { id: "DETAILS", icon: Wallet, label: "قیمت و مشخصات" },
    { id: "LOCATION", icon: MapPin, label: "موقعیت" },
    { id: "MEDIA", icon: ImageIcon, label: "تصاویر" },
    { id: "REVIEW", icon: Check, label: "بازبینی و ثبت" },
];

interface CreateTemporaryRentSceneProps {
    adminMode?: boolean;
}

export default function CreateTemporaryRentScene({ adminMode = false }: CreateTemporaryRentSceneProps) {
    const router = useRouter();
    const [step, setStep] = useState<Step>("CATEGORY");
    const [isCitySelectorOpen, setIsCitySelectorOpen] = useState(false);
    const [cityName, setCityName] = useState("");
    const [pricingErrors, setPricingErrors] = useState<Record<string, string>>({});
    const [attributeErrors, setAttributeErrors] = useState<Record<string, string>>({});
    const [isSubmittingAdmin, setIsSubmittingAdmin] = useState(false);

    const [adminOwnership, setAdminOwnership] = useState<AdminOwnershipData>({
        isPlatform: true,
        phoneNumber: "",
        firstName: "",
        lastName: "",
    });

    const [formData, setFormData] = useState<CreateTemporaryRentDraftRequest>({
        cityId: "",
        categoryPath: {
            categoryKey: "",
            subcategoryKey: "",
            attributeSchemaVersion: 1,
        },
        title: "",
        description: "",
        nightlyPrice: 0,
        maxGuests: 2,
        availabilityWindow: {
            availableFrom: new Date().toISOString(),
            availableTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
        latitude: 35.6892,
        longitude: 51.389,
        mediaIds: [],
        attributes: {},
    });

    const { data: geoHierarchy } = useGeoHierarchy();

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
        return [formData.latitude || 35.6892, formData.longitude || 51.3890];
    }, [formData.cityId, cityName, geoHierarchy, formData.latitude, formData.longitude]);

    const [rawPricing, setRawPricing] = useState<Record<string, number | string | boolean>>({});
    const [priceModelKey, setPriceModelKey] = useState<string>("DAILY_RENT_STANDARD");

    const { mutateAsync: uploadMedia, isPending: isUploading } = useUploadMedia();
    const createDraftMutation = useCreateTemporaryRentDraft();

    // Fetch Temporary Rent Categories
    const { data: categories, isLoading: isLoadingCategories } = useQuery<TemporaryRentCategory[]>({
        queryKey: ["temporary-rent-categories"],
        queryFn: () => temporaryRentService.listCategories(),
        staleTime: 1000 * 60 * 5,
    });

    // Auto-select first category and subcategory when categories load
    useEffect(() => {
        if (categories && categories.length > 0 && !formData.categoryPath.categoryKey) {
            const firstCat = categories[0];
            const firstSub = firstCat.subcategories?.[0];
            setFormData((prev) => ({
                ...prev,
                categoryPath: {
                    categoryKey: firstCat.key,
                    subcategoryKey: firstSub?.key || "",
                    attributeSchemaVersion: 1,
                },
            }));
        }
    }, [categories, formData.categoryPath.categoryKey]);

    // Fetch Subcategory Config (allowed PriceModels & dynamic Attributes)
    const selectedSubcategoryKey = formData.categoryPath.subcategoryKey;
    const selectedCategoryKey = formData.categoryPath.categoryKey;

    const { data: subcatConfig, isLoading: isLoadingConfig } = useQuery<TemporaryRentSubcategoryConfigResponse>({
        queryKey: ["temporary-rent-subcat-config", selectedSubcategoryKey, selectedCategoryKey],
        queryFn: () => temporaryRentService.getSubcategoryConfig(selectedSubcategoryKey, selectedCategoryKey),
        enabled: Boolean(selectedSubcategoryKey),
        staleTime: 1000 * 60 * 5,
    });

    // Resolve active PriceModel
    const activePriceModel = useMemo(() => {
        if (!subcatConfig?.allowedPriceModels?.length) return undefined;
        if (priceModelKey) {
            const found = subcatConfig.allowedPriceModels.find(
                (m) => m.key === priceModelKey || m.id === priceModelKey
            );
            if (found) return found;
        }
        return subcatConfig.allowedPriceModels.find((m) => m.isDefault) || subcatConfig.allowedPriceModels[0];
    }, [subcatConfig, priceModelKey]);

    useEffect(() => {
        if (activePriceModel && activePriceModel.key !== priceModelKey) {
            setPriceModelKey(activePriceModel.key);
        }
    }, [activePriceModel, priceModelKey]);

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
            mediaIds: prev.mediaIds?.filter((m) => m !== id),
        }));
    };

    const currentStepIndex = STEPS_CONFIG.findIndex((s) => s.id === step);

    const validateDetailsStep = (): boolean => {
        let isValid = true;
        const pErrors: Record<string, string> = {};
        const aErrors: Record<string, string> = {};

        if (!formData.title?.trim()) {
            toast.error("عنوان اقامتگاه الزامی است");
            return false;
        }

        if (!formData.description?.trim()) {
            toast.error("توضیحات اقامتگاه الزامی است");
            return false;
        }

        // Validate pricing
        if (activePriceModel) {
            for (const field of activePriceModel.pricingFields) {
                const val = rawPricing[field.key];
                if (field.required && (val === undefined || val === null || val === "" || Number(val) <= 0)) {
                    pErrors[field.key] = `فیلد ${field.label} الزامی است`;
                    isValid = false;
                }
            }
        } else if (!formData.nightlyPrice || formData.nightlyPrice <= 0) {
            toast.error("مبلغ اجاره هر شب باید بزرگتر از صفر باشد");
            return false;
        }

        // Validate attributes
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
            toast.error("لطفاً فیلدهای الزامی مشخص شده را تکمیل نمایید");
        }

        return isValid;
    };

    const handleNext = () => {
        if (step === "CATEGORY") {
            if (adminMode && !adminOwnership.isPlatform) {
                if (!adminOwnership.phoneNumber?.trim()) {
                    toast.error("لطفاً شماره تماس مالک اقامتگاه را وارد فرمایید");
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
                toast.error("لطفاً شهر اقامتگاه را انتخاب نمایید");
                return;
            }
            if (!formData.categoryPath.categoryKey || !formData.categoryPath.subcategoryKey) {
                toast.error("لطفاً نوع اقامتگاه را انتخاب نمایید");
                return;
            }
            setStep("DETAILS");
        } else if (step === "DETAILS") {
            if (!validateDetailsStep()) return;
            setStep("LOCATION");
        } else if (step === "LOCATION") {
            setStep("MEDIA");
        } else if (step === "MEDIA") {
            setStep("REVIEW");
        } else if (step === "REVIEW") {
            handleSubmit();
        }
    };

    const handleBack = () => {
        if (currentStepIndex > 0) {
            setStep(STEPS_CONFIG[currentStepIndex - 1].id);
        }
    };

    const handleSubmit = async () => {
        try {
            const resolvedNightlyPrice = rawPricing.nightlyPrice
                ? Number(rawPricing.nightlyPrice)
                : formData.nightlyPrice || 1000000;
            const resolvedMaxGuests = formData.attributes?.max_guests
                ? Number(formData.attributes.max_guests)
                : formData.maxGuests || 2;

            if (adminMode) {
                setIsSubmittingAdmin(true);
                const payload: AdminCreateTemporaryRentRequest = {
                    isPlatform: adminOwnership.isPlatform,
                    phoneNumber: adminOwnership.isPlatform ? undefined : adminOwnership.phoneNumber.trim(),
                    firstName: adminOwnership.isPlatform ? undefined : adminOwnership.firstName.trim(),
                    lastName: adminOwnership.isPlatform ? undefined : adminOwnership.lastName.trim(),
                    targetOwnerId: adminOwnership.targetOwnerId,
                    cityId: formData.cityId,
                    categoryPath: {
                        categoryKey: formData.categoryPath.categoryKey,
                        subcategoryKey: formData.categoryPath.subcategoryKey,
                        attributeSchemaVersion: formData.categoryPath.attributeSchemaVersion || 1,
                    },
                    title: formData.title,
                    description: formData.description,
                    nightlyPrice: resolvedNightlyPrice,
                    maxGuests: resolvedMaxGuests,
                    availabilityWindow: {
                        availableFrom: formData.availabilityWindow?.availableFrom || new Date().toISOString(),
                        availableTo: formData.availabilityWindow?.availableTo || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                    },
                    latitude: formData.latitude,
                    longitude: formData.longitude,
                    mediaIds: formData.mediaIds || [],
                    attributes: {
                        ...formData.attributes,
                        ...rawPricing,
                    },
                };
                await adminService.createTemporaryRent(payload);
                toast.success("اقامتگاه با موفقیت توسط ادمین ثبت گردید");
                router.push("/admin/temporary-rent");
                return;
            }

            const payload: CreateTemporaryRentDraftRequest = {
                ...formData,
                nightlyPrice: resolvedNightlyPrice,
                maxGuests: resolvedMaxGuests,
                priceModelKey,
                pricing: rawPricing,
                attributes: {
                    ...formData.attributes,
                    ...rawPricing,
                },
            };

            await createDraftMutation.mutateAsync(payload);
            toast.success("اقامتگاه با موفقیت به عنوان پیش‌نویس ثبت شد");
            router.push("/profile/temporary-rent");
        } catch (err) {
            const msg = normalizeApiError(err instanceof Error ? err : undefined, "خطا در ثبت اقامتگاه");
            toast.error(msg);
        } finally {
            setIsSubmittingAdmin(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50/50 py-8 px-4 sm:px-6 lg:px-8 pb-32">
            <div className="max-w-3xl mx-auto">
                <header className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black text-brand">
                            {adminMode ? "ثبت اقامتگاه جدید (پنل مدیریت)" : "ثبت اقامتگاه جدید (اجاره موقت و روزانه)"}
                        </h1>
                        <p className="text-xs text-text-light mt-1">
                            {adminMode
                                ? "ثبت مستقیم اقامتگاه به صورت سازمانی یا به نیابت از میزبانان با قابلیت ایجاد خودکار کاربر"
                                : "مشخصات ویلا، سوئیت یا اقامتگاه بوم‌گردی خود را برای میهمانان سراسر کشور ثبت نمایید."}
                        </p>
                    </div>
                </header>

                {/* Mobile Stepper */}
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
                        {/* 1. CATEGORY & CITY */}
                        {step === "CATEGORY" && (
                            <div className="space-y-6">
                                {adminMode && (
                                    <AdminOwnershipSelector
                                        value={adminOwnership}
                                        onChange={setAdminOwnership}
                                        themeColor="emerald"
                                    />
                                )}
                                <h2 className="text-lg font-black text-brand">شهر و نوع اقامتگاه</h2>

                                <div className="grid grid-cols-1 gap-5">
                                    <div>
                                        <label className="block text-xs font-bold text-brand mb-2">
                                            شهر اقامتگاه <span className="text-red-500">*</span>
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
                                                        {cityName || "انتخاب شهر اقامتگاه..."}
                                                    </span>
                                                    <span className="text-[11px] text-secondary font-medium">
                                                        {cityName ? "برای تغییر شهر کلیک کنید" : "شهر مورد نظر را مشخص نمایید"}
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
                                            نوع اقامتگاه <span className="text-red-500">*</span>
                                        </label>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                            {categories?.map((cat) => {
                                                const isSelected = formData.categoryPath.categoryKey === cat.key;
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
                                                                    attributeSchemaVersion: 1,
                                                                },
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

                                    {formData.categoryPath.categoryKey && (
                                        <div className="space-y-4">
                                            <div>
                                                <Select
                                                    label="زیردسته اقامتگاه *"
                                                    value={formData.categoryPath.subcategoryKey || ""}
                                                    onChange={(val) => {
                                                        setFormData((prev) => ({
                                                            ...prev,
                                                            categoryPath: {
                                                                ...prev.categoryPath,
                                                                subcategoryKey: val,
                                                            },
                                                        }));
                                                        setRawPricing({});
                                                    }}
                                                    options={
                                                        categories
                                                            ?.find((c) => c.key === formData.categoryPath.categoryKey)
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

                                            {/* Price Model selection within Step 1 */}
                                            {formData.categoryPath.subcategoryKey && subcatConfig?.allowedPriceModels && (
                                                <div>
                                                    {subcatConfig.allowedPriceModels.length > 1 ? (
                                                        <div>
                                                            <label className="block text-xs font-bold text-brand mb-2">
                                                                مدل قیمت‌گذاری <span className="text-red-500">*</span>
                                                            </label>
                                                            <div className="flex flex-wrap gap-2.5">
                                                                {subcatConfig.allowedPriceModels.map((pm) => {
                                                                    const isSelected =
                                                                        (priceModelKey || activePriceModel?.key) === pm.key;
                                                                    return (
                                                                        <button
                                                                            key={pm.key}
                                                                            type="button"
                                                                            onClick={() => {
                                                                                setPriceModelKey(pm.key);
                                                                                setRawPricing({});
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
                                                            <span className="text-xs text-text-light font-medium">مدل قیمت‌گذاری:</span>
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

                        {/* 2. DETAILS (PRICE MODEL & ATTRIBUTES) */}
                        {step === "DETAILS" && (
                            <div className="space-y-8">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-black text-brand">عنوان، قیمت و ویژگی‌های اقامتگاه</h2>
                                    {isLoadingConfig && (
                                        <div className="flex items-center gap-1.5 text-xs text-primary font-bold">
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            <span>در حال دریافت مشخصات...</span>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-brand mb-2">
                                            عنوان اقامتگاه <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-sm focus:bg-white focus:ring-2 focus:ring-primary outline-hidden"
                                            placeholder="مثلاً: ویلای استخردار دو خوابه با چشم‌انداز جنگل در رامسر"
                                            value={formData.title}
                                            onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-brand mb-2">
                                            توضیحات و قوانین اقامتگاه <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            rows={5}
                                            className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-sm focus:bg-white focus:ring-2 focus:ring-primary outline-hidden leading-relaxed"
                                            placeholder="توضیحات درباره محیط، امکانات رفاهی، دسترسی به مراکز تفریحی و ساعت ورود/خروج..."
                                            value={formData.description}
                                            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                                        />
                                    </div>
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
                                                    مدل محاسبه قیمت:
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

                                {/* Dynamic Pricing Fields */}
                                {activePriceModel && (
                                    <div className="p-5 bg-gray-50/60 border border-gray-200/80 rounded-2xl">
                                        <DynamicPricingFields
                                            priceModel={activePriceModel}
                                            values={rawPricing}
                                            onChange={(k, v) => {
                                                setRawPricing((prev) => ({ ...prev, [k]: v }));
                                                if (k === "nightlyPrice") {
                                                    setFormData((prev) => ({ ...prev, nightlyPrice: Number(v) }));
                                                }
                                                if (pricingErrors[k]) {
                                                    setPricingErrors((prev) => {
                                                        const copy = { ...prev };
                                                        delete copy[k];
                                                        return copy;
                                                    });
                                                }
                                            }}
                                            errors={pricingErrors}
                                        />
                                    </div>
                                )}

                                {/* Dynamic Attributes for Temporary Rental */}
                                {subcatConfig?.attributeDefinitions && subcatConfig.attributeDefinitions.length > 0 && (
                                    <div className="pt-2">
                                        <h3 className="text-sm font-bold text-brand mb-4 pb-2 border-b border-gray-100">
                                            امکانات و ظرفیت اقامتگاه
                                        </h3>
                                        <DynamicAttributeRenderer
                                            definitions={subcatConfig.attributeDefinitions}
                                            values={formData.attributes || {}}
                                            onChange={(k, v) => {
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    attributes: { ...prev.attributes, [k]: v },
                                                }));
                                                if (attributeErrors[k]) {
                                                    setAttributeErrors((prev) => {
                                                        const copy = { ...prev };
                                                        delete copy[k];
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

                        {/* 3. LOCATION */}
                        {step === "LOCATION" && (
                            <div className="space-y-4">
                                <div>
                                    <h2 className="text-lg font-black text-brand">تعیین موقعیت روی نقشه</h2>
                                    <p className="text-xs text-text-light mt-1">
                                        نقشه به صورت خودکار روی شهر انتخابی شما ({cityName || "شهر انتخاب‌شده"}) تنظیم شده است. با کلیک روی نقشه، جابجایی نشانگر یا استفاده از دکمه «موقعیت فعلی من»، محل دقیق اقامتگاه را مشخص نمایید.
                                    </p>
                                </div>
                                <div>
                                    <DynamicMapPicker
                                        cityCenter={cityCoordinates}
                                        cityName={cityName}
                                        initialCenter={cityCoordinates}
                                        value={[formData.latitude, formData.longitude]}
                                        zoom={13}
                                        onChange={(lat, lng) =>
                                            setFormData((prev) => ({ ...prev, latitude: lat, longitude: lng }))
                                        }
                                    />
                                </div>
                            </div>
                        )}

                        {/* 4. MEDIA */}
                        {step === "MEDIA" && (
                            <div className="space-y-6">
                                <h2 className="text-lg font-black text-brand">تصاویر اقامتگاه</h2>
                                <p className="text-xs text-text-light">
                                    تصاویر با کیفیت از فضای داخلی، اتاق‌ها و محوطه اقامتگاه بازدهی رزرواسیون را چند برابر می‌کند.
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
                                                alt="تصویر اقامتگاه"
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

                        {/* 5. REVIEW */}
                        {step === "REVIEW" && (
                            <div className="space-y-6">
                                <h2 className="text-lg font-black text-brand">بازبینی و ثبت نهایی اقامتگاه</h2>
                                <div className="bg-gray-50/80 rounded-2xl p-6 space-y-4 border border-gray-100 text-sm">
                                    {adminMode && (
                                        <div className="flex justify-between pb-2 border-b border-gray-200/50">
                                            <span className="text-text-light">نوع مالکیت:</span>
                                            <span className="font-bold text-brand">
                                                {adminOwnership.isPlatform
                                                    ? "سازمانی (متعلق به سامانه)"
                                                    : `به نام میزبان: ${adminOwnership.foundUserName || `${adminOwnership.firstName} ${adminOwnership.lastName}`} (${adminOwnership.phoneNumber})`}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex justify-between pb-2 border-b border-gray-200/50">
                                        <span className="text-text-light">عنوان اقامتگاه:</span>
                                        <span className="font-bold text-brand">{formData.title}</span>
                                    </div>
                                    <div className="flex justify-between pb-2 border-b border-gray-200/50">
                                        <span className="text-text-light">شهر:</span>
                                        <span className="font-bold text-brand">{cityName}</span>
                                    </div>
                                    <div className="flex justify-between pb-2 border-b border-gray-200/50">
                                        <span className="text-text-light">نوع اقامتگاه:</span>
                                        <span className="font-bold text-brand">
                                            {subcatConfig?.subcategory?.categoryDisplayName} / {subcatConfig?.subcategory?.displayName}
                                        </span>
                                    </div>
                                    <div className="flex justify-between pb-2 border-b border-gray-200/50">
                                        <span className="text-text-light">مدل قیمت‌گذاری:</span>
                                        <span className="font-bold text-primary">
                                            {activePriceModel?.displayName}
                                        </span>
                                    </div>
                                    <div className="flex justify-between pb-2 border-b border-gray-200/50">
                                        <span className="text-text-light">اجاره هر شب:</span>
                                        <span className="font-bold text-emerald-700">
                                            {formatPrice(rawPricing.nightlyPrice ? Number(rawPricing.nightlyPrice) : formData.nightlyPrice)} تومان
                                        </span>
                                    </div>
                                    <div className="border-t border-gray-200/60 pt-3">
                                        <p className="text-text-light text-xs mb-1">توضیحات:</p>
                                        <p className="text-xs text-text-main line-clamp-3 leading-relaxed">
                                            {formData.description}
                                        </p>
                                    </div>
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
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={createDraftMutation.isPending || isSubmittingAdmin}
                                className={cn(
                                    "px-7 py-2.5 rounded-xl text-white font-black text-xs shadow-md flex items-center gap-1.5 transition-all",
                                    adminMode
                                        ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
                                        : "bg-primary hover:bg-primary/90 shadow-primary/20"
                                )}
                            >
                                {(createDraftMutation.isPending || isSubmittingAdmin) && <Loader2 className="h-4 w-4 animate-spin" />}
                                <span>{adminMode ? "ثبت نهایی اقامتگاه در پنل مدیریت" : "ثبت اقامتگاه"}</span>
                            </button>
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
