"use client";

import { AdminOwnershipData, AdminOwnershipSelector } from "@/components/admin/AdminOwnershipSelector";
import { DynamicAttributeRenderer, validateAttributeValue } from "@/components/dynamic-form/DynamicAttributeRenderer";
import { DynamicPricingFields } from "@/components/dynamic-form/DynamicPricingFields";
import MediaGalleryUpload from "@/components/MediaGalleryUpload";
import { useCity } from "@/components/providers/CityProvider";
import { AccountStatusBanner } from "@/components/ui/AccountStatusBanner";
import {
    ResponsiveSelectDrawer,
    SelectDrawerOption,
    SelectDrawerTag,
} from "@/components/ui/ResponsiveSelectDrawer";
import { AdPublicationFeeModal } from "@/components/wallet/AdPublicationFeeModal";
import { useAd, useCategories } from "@/hooks/useAds";
import { useGeoHierarchy } from "@/hooks/useGeoHierarchy";
import { useSafeBack } from "@/hooks/useSafeBack";
import { useEntitlements } from "@/hooks/useSubscription";
import { useUserStatus } from "@/hooks/useUserStatus";
import { isInsufficientBalanceError, normalizeApiError } from "@/lib/api/error-handler";
import { cn, formatPrice, getMediaUrl, toPersianDigits } from "@/lib/utils";
import { adminService } from "@/services/admin.service";
import { adsService } from "@/services/ads.service";
import { AdminCreateAdRequest } from "@/types/api/admin.types";
import { CreateAdDraftRequest, PriceModel, SubcategoryConfigResponse } from "@/types/api/ads.types";
import { AdStatus } from "@/types/api/enums";
import type { MediaReference } from "@/types/api/media.types";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
    ChevronLeft,
    ChevronRight,
    Flame,
    FolderTree,
    Info,
    Loader2,
    LucideIcon,
    MapPin,
    Send,
    ShieldAlert,
    Sparkles,
    Tag,
    Wallet
} from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

// Leaflet is client-side only
const DynamicMapPicker = dynamic(() => import("@/components/ui/MapPicker"), { ssr: false });

type Step = "BASIC_INFO" | "DETAILS" | "LOCATION" | "REVIEW";

const STEPS_CONFIG: { id: Step; label: string; icon: LucideIcon }[] = [
    { id: "BASIC_INFO", icon: Tag, label: "اطلاعات پایه" },
    { id: "DETAILS", icon: Wallet, label: "قیمت و مشخصات" },
    { id: "LOCATION", icon: MapPin, label: "موقعیت" },
    { id: "REVIEW", icon: Send, label: "بازبینی و ثبت" },
];

interface SubmitAdSceneProps {
    adminMode?: boolean;
}

export default function SubmitAdScene({ adminMode = false }: SubmitAdSceneProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const editAdId = searchParams.get("edit");
    const handlePageBack = useSafeBack(adminMode ? "/admin/ads" : editAdId ? "/profile/ads" : "/");
    const [activeAdId, setActiveAdId] = useState<string | null>(editAdId || null);
    const activeAdIdRef = useRef<string | null>(editAdId || null);

    useEffect(() => {
        if (editAdId) {
            setActiveAdId(editAdId);
            activeAdIdRef.current = editAdId;
        }
    }, [editAdId]);
    const { selectedCity } = useCity();
    const { isRestricted, restrictionTitle, restrictionMessage } = useUserStatus();
    const { data: entitlements = [] } = useEntitlements();

    const publicationEntitlement = useMemo(() => {
        if (!Array.isArray(entitlements)) return null;
        return entitlements.find((e) => e.entitlementType === "LISTING_PUBLICATION") || null;
    }, [entitlements]);
    const remainingQuota = publicationEntitlement?.remainingQuota ?? 0;

    const [adminOwnership, setAdminOwnership] = useState<AdminOwnershipData>({
        isPlatform: true,
        phoneNumber: "",
        firstName: "",
        lastName: "",
    });

    const [step, setStep] = useState<Step>("BASIC_INFO");
    const [submitForApproval, setSubmitForApproval] = useState(false);
    const [isFeeModalOpen, setIsFeeModalOpen] = useState(false);
    const [feeModalAdId, setFeeModalAdId] = useState<string | null>(null);
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
        pricingValues: {},
        latitude: initialCoords.latitude,
        longitude: initialCoords.longitude,
        mediaIds: [] as MediaReference[],
    });

    const { data: categories } = useCategories();
    const { data: geoHierarchy } = useGeoHierarchy();

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
        const currentKey = formData.categoryPath?.businessModelKey?.trim().toLowerCase();
        if (currentKey) {
            const found = subcatConfig.allowedPriceModels.find(
                (m) => m.key.toLowerCase() === currentKey || m.id.toLowerCase() === currentKey
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
        if (
            activePriceModel &&
            (!formData.categoryPath?.businessModelKey ||
                formData.categoryPath.businessModelKey.toLowerCase() !== activePriceModel.key.toLowerCase())
        ) {
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

    // Options and change handlers for Step 1 Responsive Select / Drawer
    const cityOptions = useMemo<SelectDrawerOption<string>[]>(() => {
        if (!geoHierarchy) {
            if (formData.cityId && cityName) {
                return [{ value: formData.cityId, label: cityName }];
            }
            return [];
        }
        const list: SelectDrawerOption<string>[] = [];
        let hasCurrentCity = false;
        for (const province of geoHierarchy) {
            for (const city of province.cities) {
                if (city.id === formData.cityId) hasCurrentCity = true;
                list.push({
                    value: city.id,
                    label: city.name,
                    description: `استان ${province.name}`,
                    badge: city.isCapital ? "مرکز استان" : undefined,
                });
            }
        }
        if (!hasCurrentCity && formData.cityId && cityName) {
            list.unshift({ value: formData.cityId, label: cityName });
        }
        return list;
    }, [geoHierarchy, formData.cityId, cityName]);

    const popularCityTags = useMemo<SelectDrawerTag<string>[]>(() => {
        if (!geoHierarchy) return [];
        const tags: SelectDrawerTag<string>[] = [];
        const popularNames = ["تهران", "مشهد", "اصفهان", "شیراز", "تبریز", "کیش"];
        for (const name of popularNames) {
            for (const p of geoHierarchy) {
                const found = p.cities.find((c) => c.name === name);
                if (found) {
                    tags.push({ label: found.name, value: found.id });
                    break;
                }
            }
        }
        return tags;
    }, [geoHierarchy]);

    const handleCityChange = (newCityId: string) => {
        let matched: { id: string; name: string; centerPoint?: { latitude: number; longitude: number } } | null = null;
        if (geoHierarchy) {
            for (const p of geoHierarchy) {
                const found = p.cities.find((c) => c.id === newCityId);
                if (found) {
                    matched = found;
                    break;
                }
            }
        }
        setFormData((prev) => ({
            ...prev,
            cityId: newCityId,
            latitude: matched?.centerPoint?.latitude ?? prev.latitude ?? 35.6892,
            longitude: matched?.centerPoint?.longitude ?? prev.longitude ?? 51.3890,
        }));
        setCityName(matched?.name || "");
    };

    const categoryOptions = useMemo<SelectDrawerOption<string>[]>(() => {
        if (!categories) return [];
        return categories.map((cat) => ({
            value: cat.key,
            label: cat.displayName,
            description: cat.description,
            icon: cat.icon ? (
                <img
                    src={getMediaUrl(cat.icon)}
                    alt=""
                    className="w-5 h-5 object-contain rounded p-0.5 bg-surface-secondary border border-border-subtle shrink-0"
                />
            ) : undefined,
        }));
    }, [categories]);

    const handleCategoryChange = (catKey: string) => {
        if (formData.categoryPath?.categoryKey === catKey) return;
        const cat = categories?.find((c) => c.key === catKey);
        const firstSub = cat?.subcategories?.[0];
        setFormData((prev) => ({
            ...prev,
            categoryPath: {
                categoryKey: catKey,
                subcategoryKey: firstSub?.key || "",
                businessModelKey: "",
                attributeSchemaVersion: 1,
            },
            pricingValues: {},
            attributes: {},
        }));
        setPricingErrors({});
        setAttributeErrors({});
    };

    const subcategoryOptions = useMemo<SelectDrawerOption<string>[]>(() => {
        if (!categories || !formData.categoryPath?.categoryKey) return [];
        const currentCat = categories.find((c) => c.key === formData.categoryPath?.categoryKey);
        if (!currentCat?.subcategories) return [];
        return currentCat.subcategories.map((sub) => ({
            value: sub.key,
            label: sub.displayName,
            icon: sub.icon ? (
                <img
                    src={getMediaUrl(sub.icon)}
                    alt=""
                    className="w-4 h-4 object-contain rounded shrink-0"
                />
            ) : undefined,
        }));
    }, [categories, formData.categoryPath?.categoryKey]);

    const handleSubcategoryChange = (subKey: string) => {
        if (formData.categoryPath?.subcategoryKey === subKey) return;
        setFormData((prev) => ({
            ...prev,
            categoryPath: {
                categoryKey: prev.categoryPath?.categoryKey || "",
                subcategoryKey: subKey,
                businessModelKey: "",
                attributeSchemaVersion: 1,
            },
            pricingValues: {},
            attributes: {},
        }));
        setPricingErrors({});
        setAttributeErrors({});
    };

    const dealTypeOptions = useMemo<SelectDrawerOption<string>[]>(() => {
        if (!subcatConfig?.allowedPriceModels) return [];
        return subcatConfig.allowedPriceModels.map((pm) => ({
            value: pm.key,
            label: pm.displayName,
        }));
    }, [subcatConfig?.allowedPriceModels]);

    const handleDealTypeChange = (pmKey: string) => {
        setFormData((prev) => ({
            ...prev,
            categoryPath: {
                categoryKey: prev.categoryPath?.categoryKey || "",
                subcategoryKey: prev.categoryPath?.subcategoryKey || "",
                attributeSchemaVersion: prev.categoryPath?.attributeSchemaVersion || 1,
                businessModelKey: pmKey,
            },
            pricingValues: {},
        }));
        setPricingErrors({});
    };

    const hydratedEditAdIdRef = useRef<string | null>(null);

    // Pre-fill form in edit mode
    useEffect(() => {
        if (existingAd) {
            if (existingAd.status === AdStatus.DELETED || existingAd.status === AdStatus.ARCHIVED) {
                toast.error('این آگهی حذف یا بایگانی شده است و امکان ویرایش آن وجود ندارد.');
                router.push('/profile/ads');
                return;
            }

            if (hydratedEditAdIdRef.current !== existingAd.adId) {
                hydratedEditAdIdRef.current = existingAd.adId;
                setFormData({
                    cityId: existingAd.cityId,
                    categoryPath: existingAd.categoryPath,
                    title: existingAd.title,
                    description: existingAd.description,
                    attributes: existingAd.attributes || {},
                    pricingValues: existingAd.pricing || {},
                    latitude: existingAd.location?.latitude ?? 35.6892,
                    longitude: existingAd.location?.longitude ?? 51.389,
                    mediaIds: existingAd.mediaIds || [],
                });
                if (existingAd.cityName) {
                    setCityName(existingAd.cityName);
                }
            }
        }
    }, [existingAd, router]);

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
            const resolvedPriceModelKey = activePriceModel?.key || formData.categoryPath?.businessModelKey;
            const resolvedPricingValues = (formData.pricingValues as Record<string, number | boolean | string>) || {};

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
                    priceModelKey: resolvedPriceModelKey,
                    pricingValues: resolvedPricingValues,
                    attributes: formData.attributes || {},
                    latitude: formData.latitude || 35.6892,
                    longitude: formData.longitude || 51.389,
                    mediaIds: formData.mediaIds || [],
                };
                const created = await adminService.createAd(payload);
                // backend اکنون آگهی را مستقیماً به وضعیت PUBLISHED منتقل می‌کند
                return { adId: created?.adId || "", shouldPublish: true };
            }

            const targetAdId = activeAdIdRef.current || activeAdId || editAdId;
            let adId = targetAdId;

            if (targetAdId) {
                // Update existing ad
                await adsService.update(targetAdId, {
                    title: formData.title,
                    description: formData.description,
                    priceModelKey: resolvedPriceModelKey,
                    pricingValues: resolvedPricingValues,
                    attributes: formData.attributes,
                    mediaIds: formData.mediaIds,
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
                    priceModelKey: resolvedPriceModelKey,
                    pricingValues: resolvedPricingValues,
                    attributes: formData.attributes || {},
                    latitude: formData.latitude || 35.6892,
                    longitude: formData.longitude || 51.389,
                    mediaIds: formData.mediaIds || [],
                };
                const created = await adsService.createDraft(payload);
                adId = created.adId;
                activeAdIdRef.current = created.adId;
                hydratedEditAdIdRef.current = created.adId;
                setActiveAdId(created.adId);

                // Update URL to edit mode so any refresh or re-submit targets this ad
                if (typeof window !== "undefined") {
                    const url = new URL(window.location.href);
                    url.searchParams.set("edit", created.adId);
                    window.history.replaceState(null, "", url.toString());
                }
            }

            // If user requested approval review, submit it
            if (shouldPublish && adId) {
                try {
                    await adsService.submitForReview(adId);
                } catch (e) {
                    const err = e instanceof Error ? e : new Error(String(e));
                    if (isInsufficientBalanceError(err)) {
                        toast.error("موجودی کیف پول شما برای پرداخت تعرفه ثبت آگهی کافی نیست.");
                        setFeeModalAdId(adId);
                        setIsFeeModalOpen(true);
                        return { adId, shouldPublish: false, paymentRequired: true, isUpdate: Boolean(targetAdId) };
                    }
                    console.error("Error during submitForReview:", err);
                    throw err;
                }
            }

            return { adId, shouldPublish, paymentRequired: false, isUpdate: Boolean(targetAdId) };
        },
        onSuccess: ({ shouldPublish, paymentRequired, isUpdate }: { shouldPublish: boolean; paymentRequired?: boolean; isUpdate?: boolean }) => {
            if (adminMode) {
                toast.success("آگهی با موفقیت توسط ادمین ثبت گردید");
                router.push("/admin/ads");
                return;
            }
            if (paymentRequired) {
                // User is prompted with AdPublicationFeeModal/Drawer to top up
                return;
            }
            if (shouldPublish) {
                toast.success("آگهی با موفقیت ثبت و جهت بررسی و انتشار به ادمین ارسال شد");
            } else {
                toast.success(isUpdate ? "پیش‌نویس آگهی با موفقیت به‌روزرسانی شد" : "آگهی با موفقیت به عنوان پیش‌نویس ذخیره شد");
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

        // Validate pricing fields
        if (activePriceModel) {
            for (const field of activePriceModel.pricingFields) {
                const val = formData.pricingValues?.[field.key];
                const isUnset = val === undefined || val === null || String(val).trim() === "";

                if (field.required && isUnset) {
                    pErrors[field.key] = `فیلد «${field.label}» الزامی است`;
                    isValid = false;
                } else if (!isUnset && field.fieldType === "NUMBER") {
                    const num = Number(val);
                    if (isNaN(num) || num < 0) {
                        pErrors[field.key] = `فیلد «${field.label}» باید عدد معتبر باشد`;
                        isValid = false;
                    } else if (field.constraints?.min !== undefined && num < field.constraints.min) {
                        pErrors[field.key] = `فیلد «${field.label}» نمی‌تواند کمتر از ${toPersianDigits(field.constraints.min)} باشد`;
                        isValid = false;
                    } else if (field.constraints?.max !== undefined && num > field.constraints.max) {
                        pErrors[field.key] = `فیلد «${field.label}» نمی‌تواند بیشتر از ${toPersianDigits(field.constraints.max)} باشد`;
                        isValid = false;
                    }
                }
            }
        }

        // Validate attributes with constraints & logical domain rules
        if (subcatConfig?.attributeDefinitions) {
            for (const attr of subcatConfig.attributeDefinitions) {
                const val = formData.attributes?.[attr.key];
                const err = validateAttributeValue(attr, val, formData.attributes);
                if (err) {
                    aErrors[attr.key] = err;
                    isValid = false;
                }
            }
        }

        setPricingErrors(pErrors);
        setAttributeErrors(aErrors);

        if (!isValid) {
            const hasConstraintErrors = Object.values(aErrors).some((e) => !e.includes("الزامی")) ||
                Object.values(pErrors).some((e) => !e.includes("الزامی"));
            if (hasConstraintErrors) {
                toast.error("لطفاً مقادیر وارد شده را بر اساس محدودیت‌ها و خطاهای مشخص‌شده اصلاح فرمایید");
            } else {
                toast.error("لطفاً فیلدهای الزامی مشخص شده را تکمیل فرمایید");
            }
        }

        return isValid;
    };

    const handleNext = () => {
        // Validation per step
        if (step === "BASIC_INFO") {
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
                return;
            }

            if (geoHierarchy && geoHierarchy.length > 0) {
                const isCityValid = geoHierarchy.some((p) => p.cities.some((c) => c.id === formData.cityId));
                if (!isCityValid) {
                    toast.error("شهر انتخاب شده در سامانه معتبر نیست. لطفاً مجدداً شهر را انتخاب فرمایید");
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

    if (!adminMode && isRestricted) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-surface rounded-3xl p-6 sm:p-8 border border-soft-border shadow-md text-center space-y-5">
                    <div className="w-16 h-16 bg-error-subtle text-error rounded-2xl flex items-center justify-center mx-auto">
                        <ShieldAlert className="w-8 h-8" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-xl font-black text-brand">دسترسی ثبت آگهی مسدود است</h2>
                        <p className="text-xs text-text-light leading-relaxed">
                            {restrictionMessage || "حساب کاربری شما در وضعیت تعلیق یا مسدودی قرار دارد و امکان ثبت یا ویرایش آگهی برای شما غیرفعال است."}
                        </p>
                    </div>

                    <AccountStatusBanner showNotificationLink={true} />

                    <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                        <Link
                            href="/profile"
                            className="flex-1 py-3 px-4 rounded-xl bg-brand text-white text-xs font-bold hover:bg-brand/90 transition-colors flex items-center justify-center gap-1.5"
                        >
                            <span>مشاهده و ویرایش پروفایل</span>
                        </Link>
                        <Link
                            href="/notifications"
                            className="py-3 px-4 rounded-xl bg-soft-bg text-secondary text-xs font-bold hover:bg-soft-border transition-colors flex items-center justify-center gap-1.5"
                        >
                            <span>مشاهده اعلان‌ها</span>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (editAdId && isLoadingExisting) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-text-light font-bold text-sm">در حال دریافت اطلاعات آگهی...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface-secondary/50 py-3 sm:py-8 px-2.5 sm:px-6 lg:px-8 pb-24 sm:pb-32 lg:pb-12">
            <div className="max-w-3xl mx-auto">
                <header className="mb-3 sm:mb-6 flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-lg sm:text-2xl font-black text-brand">
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

                    <button
                        type="button"
                        onClick={() => handlePageBack()}
                        className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl bg-surface hover:bg-surface-secondary active:scale-95 border border-border-subtle text-text-light hover:text-brand transition-all shrink-0 cursor-pointer shadow-2xs text-xs font-bold"
                        aria-label="بازگشت"
                        title="بازگشت"
                    >
                        <ChevronRight className="w-4 h-4" />
                        <span>بازگشت</span>
                    </button>
                </header>

                {/* Mobile Compact Step Indicator */}
                <div className="sm:hidden mb-3 bg-surface p-2.5 sm:p-4 rounded-xl border border-border-subtle shadow-xs">
                    <div className="flex justify-between items-center text-xs font-bold text-brand mb-2">
                        <span>
                            مرحله {toPersianDigits(currentStepIndex + 1)} از {toPersianDigits(STEPS_CONFIG.length)}:
                        </span>
                        <span className="text-primary">{STEPS_CONFIG[currentStepIndex].label}</span>
                    </div>
                    <div className="w-full bg-surface-secondary h-2 rounded-full overflow-hidden">
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
                                                        : "bg-gray-200 text-foreground-muted"
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
                <div className="bg-surface rounded-2xl sm:rounded-3xl shadow-sm border border-border-subtle p-3.5 sm:p-8 min-h-[480px] flex flex-col justify-between">
                    <div>
                        {/* 1. BASIC_INFO (City, Category, Subcategory, Deal Type, Media, Title, Description) */}
                        {step === "BASIC_INFO" && (
                            <div className="space-y-4 sm:space-y-6">
                                {adminMode && (
                                    <AdminOwnershipSelector
                                        value={adminOwnership}
                                        onChange={setAdminOwnership}
                                        themeColor="blue"
                                    />
                                )}

                                <div>
                                    <h2 className="text-base sm:text-lg font-black text-brand">اطلاعات پایه ملک</h2>
                                    <p className="text-xs text-text-light mt-0.5">
                                        شهر، دسته‌بندی، نوع معامله، تصاویر، عنوان و توضیحات ملک را وارد نمایید.
                                    </p>
                                </div>

                                {/* Section 1: Dropdown / Drawer Selectors (No background/border container) */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                    {/* 1. City */}
                                    <ResponsiveSelectDrawer
                                        label="شهر ملک"
                                        required
                                        value={formData.cityId}
                                        onChange={handleCityChange}
                                        options={cityOptions}
                                        placeholder="انتخاب شهر ملک..."
                                        drawerTitle="انتخاب شهر ملک"
                                        icon={<MapPin className="w-4 h-4 text-primary" />}
                                        searchable
                                        searchPlaceholder="جستجوی نام شهر یا استان..."
                                        tags={popularCityTags}
                                        tagsLabel="شهرهای پربازدید:"
                                        tagsIcon={<Flame className="w-3.5 h-3.5 text-amber-500" />}
                                        isLoading={!geoHierarchy}
                                        loadingText="در حال دریافت فهرست شهرها..."
                                    />

                                    {/* 2. Category */}
                                    <ResponsiveSelectDrawer
                                        label="دسته‌بندی اصلی"
                                        required
                                        value={formData.categoryPath?.categoryKey}
                                        onChange={handleCategoryChange}
                                        options={categoryOptions}
                                        placeholder="انتخاب دسته‌بندی..."
                                        drawerTitle="انتخاب دسته‌بندی اصلی"
                                        icon={<Tag className="w-4 h-4 text-primary" />}
                                    />

                                    {/* 3. Subcategory */}
                                    <ResponsiveSelectDrawer
                                        label="زیردسته ملک"
                                        required
                                        value={formData.categoryPath?.subcategoryKey}
                                        onChange={handleSubcategoryChange}
                                        options={subcategoryOptions}
                                        placeholder={
                                            formData.categoryPath?.categoryKey
                                                ? "انتخاب زیردسته..."
                                                : "ابتدا دسته‌بندی را انتخاب کنید"
                                        }
                                        drawerTitle="انتخاب زیردسته ملک"
                                        icon={<FolderTree className="w-4 h-4 text-primary" />}
                                        disabled={!formData.categoryPath?.categoryKey}
                                    />

                                    {/* 4. Deal Type (Transaction Type) */}
                                    <ResponsiveSelectDrawer
                                        label="نوع معامله"
                                        required
                                        value={formData.categoryPath?.businessModelKey || activePriceModel?.key}
                                        onChange={handleDealTypeChange}
                                        options={dealTypeOptions}
                                        placeholder={
                                            isLoadingConfig
                                                ? "در حال بارگذاری..."
                                                : !formData.categoryPath?.subcategoryKey
                                                    ? "ابتدا زیردسته را انتخاب کنید"
                                                    : "انتخاب نوع معامله..."
                                        }
                                        drawerTitle="انتخاب نوع معامله"
                                        icon={<Wallet className="w-4 h-4 text-primary" />}
                                        disabled={!formData.categoryPath?.subcategoryKey || isLoadingConfig}
                                        isLoading={isLoadingConfig}
                                        loadingText="در حال دریافت نوع معامله..."
                                    />
                                </div>

                                {/* Section 2: Media Upload (Above Title Section) */}
                                <div className="space-y-3 pt-1">
                                    <h3 className="text-sm font-black text-brand pb-1 border-b border-border-subtle">
                                        تصاویر و ویدئوهای ملک
                                    </h3>
                                    <MediaGalleryUpload
                                        value={formData.mediaIds}
                                        onChange={(media) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                mediaIds: media,
                                            }))
                                        }
                                        label="تصاویر و ویدئوهای ملک"
                                        helperText="آگهی‌های دارای تصویر و ویدئوی واقعی تا ۵ برابر بیشتر بازدید دریافت می‌کنند."
                                        maxFiles={15}
                                        allowVideos={true}
                                    />
                                </div>

                                {/* Section 3: Title and Description */}
                                <div className="space-y-4 pt-1">
                                    <h3 className="text-sm font-black text-brand pb-1 border-b border-border-subtle">
                                        عنوان و توضیحات آگهی
                                    </h3>

                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="block text-xs font-bold text-brand">
                                                عنوان آگهی <span className="text-error">*</span>
                                            </label>
                                            <span className="text-[11px] text-text-light font-medium">
                                                {toPersianDigits(formData.title?.length || 0)} / ۱۲۰ کاراکتر (حداقل ۵)
                                            </span>
                                        </div>
                                        <input
                                            type="text"
                                            className={cn(
                                                "w-full p-3.5 border rounded-xl text-sm focus:bg-surface focus:ring-2 outline-hidden transition-all",
                                                titleError
                                                    ? "border-red-500 bg-error-subtle/40 focus:ring-red-400 text-red-900"
                                                    : "border-border-subtle bg-surface-secondary focus:ring-primary focus:border-primary"
                                            )}
                                            placeholder="مثلاً: آپارتمان ۱۱۰ متری دو خوابه فول امکانات در ونک"
                                            value={formData.title || ""}
                                            onChange={(e) => {
                                                setFormData({ ...formData, title: e.target.value });
                                                if (titleError) setTitleError("");
                                            }}
                                        />
                                        {titleError && (
                                            <p className="text-xs text-error font-bold mt-1.5 flex items-center gap-1">
                                                <span>⚠️</span>
                                                <span>{titleError}</span>
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="block text-xs font-bold text-brand">
                                                توضیحات تکمیلی <span className="text-error">*</span>
                                            </label>
                                            <span className="text-[11px] text-text-light font-medium">
                                                {toPersianDigits(formData.description?.length || 0)} / ۴۰۰۰ کاراکتر (حداقل ۲۰)
                                            </span>
                                        </div>
                                        <textarea
                                            rows={5}
                                            className={cn(
                                                "w-full p-3.5 border rounded-xl text-sm focus:bg-surface focus:ring-2 outline-hidden leading-relaxed transition-all",
                                                descriptionError
                                                    ? "border-red-500 bg-error-subtle/40 focus:ring-red-400 text-red-900"
                                                    : "border-border-subtle bg-surface-secondary focus:ring-primary focus:border-primary"
                                            )}
                                            placeholder="امکانات، موقعیت دسترسی، شرایط بازدید و ویژگی‌های شاخص ملک را شرح دهید (حداقل ۲۰ کاراکتر)..."
                                            value={formData.description || ""}
                                            onChange={(e) => {
                                                setFormData({ ...formData, description: e.target.value });
                                                if (descriptionError) setDescriptionError("");
                                            }}
                                        />
                                        {descriptionError && (
                                            <p className="text-xs text-error font-bold mt-1.5 flex items-center gap-1">
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
                                    <div className="flex items-center justify-between p-4 bg-surface-secondary/80 border border-border-subtle/80 rounded-2xl">
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
                                    </div>
                                )}

                                {/* Dynamic Pricing Fields based on selected PriceModel */}
                                {activePriceModel && (
                                    <div className="p-5 bg-surface-secondary/60 border border-border-subtle/80 rounded-2xl">
                                        <DynamicPricingFields
                                            priceModel={activePriceModel}
                                            values={formData.pricingValues || {}}
                                            onChange={(key, value) => {
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    pricingValues: {
                                                        ...prev.pricingValues,
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
                                        <h3 className="text-sm font-bold text-brand mb-4 pb-2 border-b border-border-subtle">
                                            مشخصات فنی و امکانات {subcatConfig.subcategory?.displayName || "ملک"}
                                        </h3>
                                        <DynamicAttributeRenderer
                                            definitions={subcatConfig.attributeDefinitions}
                                            values={formData.attributes || {}}
                                            onChange={(key, value) => {
                                                const nextAttributes = {
                                                    ...(formData.attributes || {}),
                                                    [key]: value,
                                                };
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    attributes: nextAttributes,
                                                }));

                                                const def = subcatConfig.attributeDefinitions?.find((d) => d.key === key);
                                                if (def) {
                                                    const err = validateAttributeValue(def, value, nextAttributes);
                                                    setAttributeErrors((prev) => {
                                                        const copy = { ...prev };
                                                        if (err) {
                                                            copy[key] = err;
                                                        } else {
                                                            delete copy[key];
                                                        }

                                                        // If changing total_floors or floor_number, recheck relationship
                                                        if (key === "total_floors" && copy.floor_number) {
                                                            const floorDef = subcatConfig.attributeDefinitions?.find((d) => d.key === "floor_number");
                                                            if (floorDef) {
                                                                const floorErr = validateAttributeValue(floorDef, nextAttributes.floor_number, nextAttributes);
                                                                if (!floorErr) delete copy.floor_number;
                                                                else copy.floor_number = floorErr;
                                                            }
                                                        } else if (key === "floor_number" && copy.total_floors) {
                                                            const totalDef = subcatConfig.attributeDefinitions?.find((d) => d.key === "total_floors");
                                                            if (totalDef) {
                                                                const totalErr = validateAttributeValue(totalDef, nextAttributes.total_floors, nextAttributes);
                                                                if (!totalErr) delete copy.total_floors;
                                                                else copy.total_floors = totalErr;
                                                            }
                                                        }

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

                        {/* 4. REVIEW */}
                        {step === "REVIEW" && (
                            <div className="space-y-6">
                                <h2 className="text-lg font-black text-brand">بازبینی و تایید آگهی</h2>
                                <div className="bg-surface-secondary/80 rounded-2xl p-6 space-y-4 border border-border-subtle text-sm">
                                    {adminMode && (
                                        <div className="flex justify-between pb-2 border-b border-border-subtle/50">
                                            <span className="text-text-light">نوع مالکیت آگهی:</span>
                                            <span className="font-bold text-brand">
                                                {adminOwnership.isPlatform
                                                    ? "سازمانی (متعلق به سامانه)"
                                                    : `به نام کاربر: ${adminOwnership.foundUserName || `${adminOwnership.firstName} ${adminOwnership.lastName}`} (${adminOwnership.phoneNumber})`}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex justify-between pb-2 border-b border-border-subtle/50">
                                        <span className="text-text-light">عنوان آگهی:</span>
                                        <span className="font-bold text-brand text-left">{formData.title}</span>
                                    </div>
                                    <div className="flex justify-between pb-2 border-b border-border-subtle/50">
                                        <span className="text-text-light">شهر و منطقه:</span>
                                        <span className="font-bold text-brand">{cityName}</span>
                                    </div>
                                    <div className="flex justify-between pb-2 border-b border-border-subtle/50">
                                        <span className="text-text-light">دسته‌بندی:</span>
                                        <span className="font-bold text-brand">
                                            {subcatConfig?.subcategory?.categoryDisplayName || formData.categoryPath?.categoryKey} / {subcatConfig?.subcategory?.displayName || formData.categoryPath?.subcategoryKey}
                                        </span>
                                    </div>
                                    <div className="flex justify-between pb-2 border-b border-border-subtle/50">
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
                                                    const val = formData.pricingValues?.[f.key];
                                                    if (val === undefined || val === null || val === "") return null;

                                                    const isBool = f.fieldType === "BOOLEAN" || typeof val === "boolean" || val === "true" || val === "false";
                                                    let displayValue: string;

                                                    if (isBool) {
                                                        const isTrue = val === true || val === "true" || val === 1 || val === "1";
                                                        const isQuestion = f.label.includes("آیا") || f.label.includes("؟") || f.label.includes("?");
                                                        displayValue = isQuestion ? (isTrue ? "بله" : "خیر") : (isTrue ? "دارد" : "ندارد");
                                                    } else if (f.fieldType === "NUMBER") {
                                                        const unit = f.unit?.trim();
                                                        if (unit && unit !== "تومان") {
                                                            displayValue = `${formatPrice(Number(val), "")} ${unit}`;
                                                        } else {
                                                            displayValue = formatPrice(Number(val));
                                                        }
                                                    } else if (f.fieldType === "SELECT") {
                                                        const matchedOption = f.constraints?.options?.find((opt) => opt.key === String(val));
                                                        displayValue = matchedOption?.label || String(val);
                                                    } else {
                                                        displayValue = `${String(val)}${f.unit ? ` ${f.unit}` : ""}`;
                                                    }

                                                    return (
                                                        <div key={f.key} className="flex justify-between p-2.5 bg-surface rounded-xl border border-border-subtle/60 text-xs">
                                                            <span className="text-text-light">{f.label}:</span>
                                                            <span className="font-bold text-brand">
                                                                {displayValue}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    <div className="border-t border-border-subtle/60 pt-3">
                                        <p className="text-text-light text-xs mb-1">توضیحات آگهی:</p>
                                        <p className="text-xs text-text-main line-clamp-3 leading-relaxed">
                                            {formData.description}
                                        </p>
                                    </div>

                                    {formData.mediaIds && formData.mediaIds.length > 0 && (
                                        <div className="flex justify-between pt-2 border-t border-border-subtle/50">
                                            <span className="text-text-light">رسانه‌های ضمیمه:</span>
                                            <span className="font-bold text-brand">
                                                {toPersianDigits(formData.mediaIds.length)} تصویر/ویدئو
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Quota / Publication Fee Entitlement Status */}
                                {!adminMode && (
                                    remainingQuota > 0 ? (
                                        <div className="p-4 rounded-2xl bg-success-subtle border border-success/30/80 text-xs text-success leading-relaxed flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Sparkles className="w-4 h-4 text-success shrink-0" />
                                                <span className="font-bold">انتشار رایگان از سهمیه اشتراک</span>
                                            </div>
                                            <span className="px-2.5 py-1 rounded-lg bg-success-subtle text-emerald-900 font-black text-[11px]">
                                                سهمیه باقیمانده: {toPersianDigits(remainingQuota)} آگهی
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="p-4 rounded-2xl bg-warning-subtle border border-warning/30/80 text-xs text-amber-900 leading-relaxed flex items-start gap-2.5">
                                            <Wallet className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                                            <div>
                                                <span className="font-bold block mb-0.5">تعرفه انتشار آگهی</span>
                                                <p className="text-warning/90 text-[11px] leading-relaxed">
                                                    سهمیه اشتراک فعال موجود نیست. هزینه انتشار آگهی طبق تعرفه مصوب در لحظه ارسال از کیف پول رزرو شده و پس از بررسی و تایید کارشناسان نهایی می‌گردد. در صورت عدم تایید، مبلغ به کیف پول بازگردانده می‌شود.
                                                </p>
                                            </div>
                                        </div>
                                    )
                                )}

                                <div className="p-4 rounded-2xl bg-warning-subtle border border-warning/30 text-xs text-warning leading-relaxed flex items-start gap-2.5">
                                    <Info className="w-4 h-4 text-warning shrink-0 mt-0.5" />
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
                    <div className="mt-6 sm:mt-10 flex items-center justify-between border-t border-border-subtle pt-4 sm:pt-6">
                        {step === "BASIC_INFO" ? (
                            <button
                                type="button"
                                onClick={() => handlePageBack()}
                                className="flex items-center text-text-light hover:text-brand font-bold text-xs transition-colors"
                            >
                                <ChevronRight className="h-4 w-4 ml-1" />
                                <span>انصراف و بازگشت</span>
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleBack}
                                className="flex items-center text-text-light hover:text-brand font-bold text-xs transition-colors"
                            >
                                <ChevronRight className="h-4 w-4 ml-1" />
                                <span>مرحله قبل</span>
                            </button>
                        )}

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
                                        className="px-4 py-2.5 rounded-xl border border-border-subtle text-text-main font-bold text-xs hover:bg-surface-secondary transition-colors flex items-center gap-1.5"
                                    >
                                        {submitMutation.isPending && !submitForApproval ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                <span>در حال ذخیره...</span>
                                            </>
                                        ) : (
                                            <span>{activeAdId || editAdId ? "به‌روزرسانی پیش‌نویس" : "ذخیره پیش‌نویس"}</span>
                                        )}
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
                                        {submitMutation.isPending && submitForApproval && <Loader2 className="h-4 w-4 animate-spin" />}
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

            {isFeeModalOpen && (
                <AdPublicationFeeModal
                    isOpen={isFeeModalOpen}
                    onClose={() => setIsFeeModalOpen(false)}
                    adId={feeModalAdId || activeAdId || undefined}
                />
            )}
        </div>
    );
}
