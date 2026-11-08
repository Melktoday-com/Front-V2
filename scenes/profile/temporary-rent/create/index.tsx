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
import { useGeoHierarchy } from "@/hooks/useGeoHierarchy";
import { useSafeBack } from "@/hooks/useSafeBack";
import { useTemporaryRentAdDetail } from "@/hooks/useTemporaryRent";
import { useUserStatus } from "@/hooks/useUserStatus";
import { normalizeApiError } from "@/lib/api/error-handler";
import { cn, formatPrice, formatPriceWords, getMediaUrl, toPersianDigits } from "@/lib/utils";
import { adminService } from "@/services/admin.service";
import { geoService } from "@/services/geo.service";
import { temporaryRentService } from "@/services/temporary-rent.service";
import { AdminCreateTemporaryRentRequest } from "@/types/api/admin.types";
import type { MediaReference } from "@/types/api/media.types";
import {
    CreateTemporaryRentDraftRequest,
    TemporaryRentAttributeDefinition,
    TemporaryRentCategory,
    TemporaryRentSubcategoryConfigResponse,
} from "@/types/api/temporary-rent.types";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
    Check,
    ChevronLeft,
    ChevronRight,
    FileText,
    Home,
    Image as ImageIcon,
    Loader2,
    LucideIcon,
    MapPin,
    Pencil,
    Send,
    ShieldAlert,
    Tag,
    Video,
    Wallet,
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

interface ReviewRowProps {
    label: string;
    value?: React.ReactNode;
    highlight?: boolean;
    isLong?: boolean;
    className?: string;
    valueClassName?: string;
}

function ReviewRow({
    label,
    value,
    highlight = false,
    isLong: explicitIsLong,
    className,
    valueClassName,
}: ReviewRowProps) {
    if (value === undefined || value === null || value === "") return null;

    const isLong = explicitIsLong !== undefined
        ? explicitIsLong
        : (typeof value === "string" && (value.length > 25 || value.includes("\n")));

    return (
        <div
            className={cn(
                "pb-2.5 border-b border-border-subtle/50 text-xs sm:text-sm transition-colors",
                isLong
                    ? "flex flex-col gap-1 items-start"
                    : "flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1",
                className
            )}
        >
            <span className="text-text-light shrink-0 text-xs font-medium">{label}:</span>
            <span
                className={cn(
                    "font-bold break-words min-w-0 [overflow-wrap:anywhere]",
                    isLong ? "text-brand text-right leading-relaxed w-full" : "text-brand text-left",
                    highlight && "text-primary",
                    valueClassName
                )}
            >
                {value}
            </span>
        </div>
    );
}

function formatPricingFieldValue(
    field: { key: string; label: string; fieldType: string; unit?: string },
    value: unknown
): string {
    if (value === undefined || value === null || value === "") return "—";

    if (field.fieldType === "BOOLEAN" || typeof value === "boolean") {
        const isTrue = value === true || value === "true" || value === 1 || value === "1";
        const isQuestion = field.label.includes("آیا") || field.label.includes("؟");
        return isQuestion ? (isTrue ? "بله" : "خیر") : (isTrue ? "دارد" : "ندارد");
    }

    if (field.fieldType === "NUMBER" || typeof value === "number") {
        const num = Number(value);
        if (isNaN(num)) return String(value);

        const unit = field.unit?.trim();
        if (!unit || unit === "تومان") {
            const formatted = formatPrice(num);
            if (num >= 1_000_000) {
                const words = formatPriceWords(num);
                if (words) {
                    return `${formatted} (${words})`;
                }
            }
            return formatted;
        }
        if (unit === "%" || unit === "درصد") {
            return `${toPersianDigits(num)} درصد`;
        }
        if (unit === "نفر") {
            return `${toPersianDigits(num)} نفر`;
        }
        return `${toPersianDigits(num)} ${unit}`;
    }

    return `${String(value)}${field.unit ? ` ${field.unit}` : ""}`;
}

function formatAttributeValue(
    attr: TemporaryRentAttributeDefinition,
    value: unknown
): string {
    if (value === undefined || value === null || value === "") return "—";

    if (attr.type === "SELECT") {
        const option = attr.options?.find((o) => o.key === String(value));
        return option?.label || String(value);
    }

    if (attr.type === "BOOLEAN" || typeof value === "boolean") {
        const isTrue = value === true || value === "true" || value === 1 || value === "1";
        return isTrue ? "دارد" : "ندارد";
    }

    if (attr.type === "NUMBER" || typeof value === "number") {
        const num = Number(value);
        if (isNaN(num)) return String(value);

        const label = attr.label || "";
        let suffix = "";
        if (label.includes("متراژ") || label.includes("مساحت") || label.includes("زیربنا")) {
            suffix = " متر مربع";
        } else if (label.includes("ظرفیت") || label.includes("نفرات") || label.includes("میهمان")) {
            suffix = " نفر";
        } else if (label.includes("اتاق") || label.includes("خواب")) {
            suffix = " خواب";
        } else if (label.includes("تخت")) {
            suffix = " تخت";
        } else if (label.includes("طبقه")) {
            suffix = " طبقه";
        } else if (label.includes("سرویس") || label.includes("حمام")) {
            suffix = " عدد";
        }

        return `${toPersianDigits(num)}${suffix}`;
    }

    return String(value);
}

interface CreateTemporaryRentSceneProps {
    adminMode?: boolean;
}

export default function CreateTemporaryRentScene({ adminMode = false }: CreateTemporaryRentSceneProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const editAdId = searchParams.get("edit");
    const handlePageBack = useSafeBack(adminMode ? "/admin/temporary-rent" : editAdId ? "/profile/temporary-rent" : "/");

    const [activeAdId, setActiveAdId] = useState<string | null>(editAdId || null);
    const activeAdIdRef = useRef<string | null>(editAdId || null);

    useEffect(() => {
        if (editAdId) {
            setActiveAdId(editAdId);
            activeAdIdRef.current = editAdId;
        }
    }, [editAdId]);

    const { selectedCity } = useCity();
    const { isRestricted, restrictionMessage } = useUserStatus();

    const [step, setStep] = useState<Step>("BASIC_INFO");
    const [cityName, setCityName] = useState(selectedCity?.name || "");
    const [pricingErrors, setPricingErrors] = useState<Record<string, string>>({});
    const [attributeErrors, setAttributeErrors] = useState<Record<string, string>>({});
    const [titleError, setTitleError] = useState<string>("");
    const [descriptionError, setDescriptionError] = useState<string>("");

    const [adminOwnership, setAdminOwnership] = useState<AdminOwnershipData>({
        isPlatform: true,
        phoneNumber: "",
        firstName: "",
        lastName: "",
    });

    const initialCoords = (selectedCity?.centerPoint?.latitude && selectedCity?.centerPoint?.longitude)
        ? { latitude: selectedCity.centerPoint.latitude, longitude: selectedCity.centerPoint.longitude }
        : { latitude: 35.6892, longitude: 51.3890 };

    const [formData, setFormData] = useState<Partial<CreateTemporaryRentDraftRequest> & { address?: string }>({
        cityId: selectedCity?.id || undefined,
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
        latitude: initialCoords.latitude,
        longitude: initialCoords.longitude,
        mediaIds: [] as MediaReference[],
        attributes: {},
        pricing: {} as any,
        priceModelKey: "DAILY_RENT_STANDARD",
    });

    const [pricingValues, setPricingValues] = useState<Record<string, number | string | boolean>>({});

    const { data: geoHierarchy } = useGeoHierarchy();

    // Fetch existing ad if editing
    const { data: existingAd, isLoading: isLoadingExisting } = useTemporaryRentAdDetail(editAdId || "");

    // Reverse-geocode selected point to detect neighborhood with PostGIS
    const { data: detectedZone, isLoading: isLoadingNeighborhood } = useQuery({
        queryKey: ["detected-neighborhood-temp-rent", formData.latitude, formData.longitude],
        queryFn: async () => {
            if (
                formData.latitude === undefined ||
                formData.longitude === undefined ||
                isNaN(Number(formData.latitude)) ||
                isNaN(Number(formData.longitude))
            ) {
                return null;
            }
            return geoService.findZoneByPoint({
                latitude: Number(formData.latitude),
                longitude: Number(formData.longitude),
                type: "NEIGHBORHOOD",
            });
        },
        enabled: Boolean(
            formData.latitude !== undefined &&
            formData.longitude !== undefined &&
            !isNaN(Number(formData.latitude)) &&
            !isNaN(Number(formData.longitude))
        ),
        staleTime: 1000 * 60 * 5,
    });

    // Fetch Categories
    const { data: categories } = useQuery<TemporaryRentCategory[]>({
        queryKey: ["temporary-rent-categories"],
        queryFn: () => temporaryRentService.listCategories(),
        staleTime: 1000 * 60 * 5,
    });

    // Auto-select first category and subcategory when categories load
    useEffect(() => {
        if (!editAdId && categories && categories.length > 0 && !formData.categoryPath?.categoryKey) {
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
    }, [editAdId, categories, formData.categoryPath?.categoryKey]);

    // Fetch Subcategory Config
    const selectedSubcategoryKey = formData.categoryPath?.subcategoryKey;
    const selectedCategoryKey = formData.categoryPath?.categoryKey;

    const { data: subcatConfig, isLoading: isLoadingConfig } = useQuery<TemporaryRentSubcategoryConfigResponse>({
        queryKey: ["temporary-rent-subcat-config", selectedSubcategoryKey, selectedCategoryKey],
        queryFn: () => temporaryRentService.getSubcategoryConfig(selectedSubcategoryKey!, selectedCategoryKey),
        enabled: Boolean(selectedSubcategoryKey),
        staleTime: 0,
        refetchOnMount: "always",
    });

    // Resolve active PriceModel
    const activePriceModel = useMemo(() => {
        if (!subcatConfig?.allowedPriceModels?.length) return undefined;
        const currentKey = formData.priceModelKey;
        if (currentKey) {
            const found = subcatConfig.allowedPriceModels.find(
                (m) => m.key === currentKey || m.id === currentKey
            );
            if (found) return found;
        }
        return subcatConfig.allowedPriceModels.find((m) => m.isDefault) || subcatConfig.allowedPriceModels[0];
    }, [subcatConfig, formData.priceModelKey]);

    useEffect(() => {
        if (activePriceModel && activePriceModel.key !== formData.priceModelKey) {
            setFormData((prev) => ({
                ...prev,
                priceModelKey: activePriceModel.key,
            }));
        }
    }, [activePriceModel, formData.priceModelKey]);

    // Pre-fill form in edit mode
    const hydratedEditAdIdRef = useRef<string | null>(null);
    useEffect(() => {
        if (existingAd) {
            const adIdentifier = existingAd.id;
            if (hydratedEditAdIdRef.current !== adIdentifier) {
                hydratedEditAdIdRef.current = adIdentifier;

                const rawMedia = (existingAd.mediaIds && existingAd.mediaIds.length > 0)
                    ? existingAd.mediaIds
                    : (existingAd as any).images || [];

                const normalizedMedia: MediaReference[] = rawMedia.map((m: any) => {
                    if (typeof m === "string") return { id: m, type: "IMAGE" };
                    return { id: m.id || m.mediaId || m.url || "", type: m.type || "IMAGE" };
                }).filter((m: MediaReference) => Boolean(m.id));

                const rawPricing = ((existingAd.pricing as any)?.pricing || {}) as Record<string, any>;
                const initialPricing = (rawPricing as Record<string, number | string | boolean>) || {};

                setFormData({
                    cityId: existingAd.cityId,
                    categoryPath: {
                        categoryKey: existingAd.categoryPath?.categoryKey || "",
                        subcategoryKey: existingAd.categoryPath?.subcategoryKey || "",
                        attributeSchemaVersion: existingAd.categoryPath?.attributeSchemaVersion || 1,
                    },
                    title: existingAd.title,
                    description: existingAd.description,
                    nightlyPrice: rawPricing.nightlyPrice || 0,
                    maxGuests: existingAd.maxGuests || 2,
                    availabilityWindow: existingAd.availabilityWindow || {
                        availableFrom: new Date().toISOString(),
                        availableTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                    },
                    latitude: existingAd.location?.coordinates?.latitude ?? existingAd.latitude ?? 35.6892,
                    longitude: existingAd.location?.coordinates?.longitude ?? existingAd.longitude ?? 51.389,
                    mediaIds: normalizedMedia,
                    attributes: existingAd.attributes || {},
                    pricing: rawPricing as any,
                    priceModelKey: existingAd.pricing?.priceModelKey || "DAILY_RENT_STANDARD",
                    address: existingAd.address || "",
                });

                setPricingValues(initialPricing);

                if (existingAd.cityName) {
                    setCityName(existingAd.cityName);
                }
            }
        }
    }, [existingAd]);

    // Automatically scroll to top whenever step changes
    useEffect(() => {
        if (typeof window !== "undefined") {
            window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
            setTimeout(() => {
                window.scrollTo({ top: 0, behavior: "smooth" });
            }, 40);
        }
    }, [step]);

    // Options for Responsive Select Drawer: City
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
        const popularNames = ["تهران", "مشهد", "رامسر", "اصفهان", "شیراز", "کیش", "نوشهر", "چالوس"];
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

    // Options for Responsive Select Drawer: Category
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
                attributeSchemaVersion: 1,
            },
            pricing: {} as any,
            attributes: {},
        }));
        setPricingValues({});
        setPricingErrors({});
        setAttributeErrors({});
    };

    // Options for Responsive Select Drawer: Subcategory
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
                attributeSchemaVersion: 1,
            },
            pricing: {} as any,
            attributes: {},
        }));
        setPricingValues({});
        setPricingErrors({});
        setAttributeErrors({});
    };

    // City coordinates for Map
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

    // Submit Mutation
    const submitMutation = useMutation({
        mutationFn: async () => {
            if (!formData.mediaIds || formData.mediaIds.length === 0) {
                toast.error("بارگذاری حداقل یک تصویر برای ثبت اقامتگاه الزامی است");
                throw new Error("بارگذاری حداقل یک تصویر برای ثبت اقامتگاه الزامی است");
            }

            const resolvedNightlyPrice = pricingValues.nightlyPrice
                ? Number(pricingValues.nightlyPrice)
                : formData.nightlyPrice || 1000000;
            const resolvedMaxGuests = formData.attributes?.max_guests
                ? Number(formData.attributes.max_guests)
                : formData.maxGuests || 2;

            if (adminMode) {
                const payload: AdminCreateTemporaryRentRequest = {
                    isPlatform: adminOwnership.isPlatform,
                    phoneNumber: adminOwnership.isPlatform ? undefined : adminOwnership.phoneNumber.trim(),
                    firstName: adminOwnership.isPlatform ? undefined : adminOwnership.firstName.trim(),
                    lastName: adminOwnership.isPlatform ? undefined : adminOwnership.lastName.trim(),
                    targetOwnerId: adminOwnership.targetOwnerId,
                    cityId: formData.cityId!,
                    categoryPath: {
                        categoryKey: formData.categoryPath!.categoryKey,
                        subcategoryKey: formData.categoryPath!.subcategoryKey,
                        attributeSchemaVersion: formData.categoryPath!.attributeSchemaVersion || 1,
                    },
                    title: formData.title!,
                    description: formData.description!,
                    nightlyPrice: resolvedNightlyPrice,
                    maxGuests: resolvedMaxGuests,
                    availabilityWindow: formData.availabilityWindow!,
                    priceModelKey: formData.priceModelKey || "DAILY_RENT_STANDARD",
                    pricing: pricingValues as any,
                    attributes: formData.attributes as any,
                    latitude: formData.latitude || 35.6892,
                    longitude: formData.longitude || 51.389,
                    mediaIds: formData.mediaIds || [],
                };
                const created = await adminService.createTemporaryRent(payload);
                return { adId: created?.id || created?.adId || "", isUpdate: false };
            }

            const targetAdId = activeAdIdRef.current || activeAdId || editAdId;

            if (targetAdId) {
                // Update existing temporary rental
                await temporaryRentService.update(targetAdId, {
                    title: formData.title,
                    description: formData.description,
                    priceModelKey: formData.priceModelKey,
                    pricing: pricingValues as any,
                    attributes: formData.attributes,
                    mediaIds: formData.mediaIds,
                    maxGuests: resolvedMaxGuests,
                    nightlyPrice: resolvedNightlyPrice,
                });
                return { adId: targetAdId, isUpdate: true };
            }

            // Create new temporary rental draft and publish directly for authenticated host/agent
            const payload: CreateTemporaryRentDraftRequest = {
                cityId: formData.cityId!,
                categoryPath: {
                    categoryKey: formData.categoryPath!.categoryKey,
                    subcategoryKey: formData.categoryPath!.subcategoryKey,
                    attributeSchemaVersion: formData.categoryPath!.attributeSchemaVersion || 1,
                },
                title: formData.title!,
                description: formData.description!,
                nightlyPrice: resolvedNightlyPrice,
                maxGuests: resolvedMaxGuests,
                availabilityWindow: formData.availabilityWindow!,
                priceModelKey: formData.priceModelKey || "DAILY_RENT_STANDARD",
                pricing: pricingValues as any,
                attributes: formData.attributes,
                latitude: formData.latitude || 35.6892,
                longitude: formData.longitude || 51.389,
                mediaIds: formData.mediaIds || [],
            };

            const created = await temporaryRentService.createDraft(payload);
            const createdId = created.adId;

            // Direct publish for authenticated host/agent (Task 18)
            try {
                await temporaryRentService.publish(createdId);
            } catch (pubErr) {
                console.warn("Direct publish fallback to submitForReview:", pubErr);
                try {
                    await temporaryRentService.submitForReview(createdId);
                } catch {
                    // Ignore review submission error if already handled
                }
            }

            return { adId: createdId, isUpdate: false };
        },
        onSuccess: ({ isUpdate }: { adId: string; isUpdate: boolean }) => {
            if (adminMode) {
                toast.success("اقامتگاه با موفقیت توسط ادمین ثبت گردید");
                router.push("/admin/temporary-rent");
                return;
            }
            if (isUpdate) {
                toast.success("اطلاعات اقامتگاه با موفقیت به‌روزرسانی شد");
            } else {
                toast.success("اقامتگاه با موفقیت ثبت و منتشر گردید");
            }
            router.push("/profile/temporary-rent");
        },
        onError: (err: Error) => {
            const msg = normalizeApiError(err, "خطا در ثبت اقامتگاه");
            toast.error(msg);
        },
    });

    const provinceAndCityName = useMemo(() => {
        if (!cityName) return "مشخص نشده";
        if (geoHierarchy && formData.cityId) {
            for (const prov of geoHierarchy) {
                const found = prov.cities.find((c) => c.id === formData.cityId);
                if (found) {
                    return `استان ${prov.name}، شهر ${found.name}`;
                }
            }
        }
        return cityName;
    }, [geoHierarchy, formData.cityId, cityName]);

    const filledPricingFields = useMemo(() => {
        if (!activePriceModel?.pricingFields) return [];
        return activePriceModel.pricingFields.filter((field) => {
            const val = pricingValues[field.key];
            return val !== undefined && val !== null && String(val).trim() !== "";
        });
    }, [activePriceModel?.pricingFields, pricingValues]);

    const extraPricingFields = useMemo(() => {
        const definedKeys = new Set(activePriceModel?.pricingFields?.map((f) => f.key) || []);
        const extras: { key: string; label: string; displayValue: string }[] = [];
        for (const [key, val] of Object.entries(pricingValues)) {
            if (definedKeys.has(key)) continue;
            if (val === undefined || val === null || String(val).trim() === "") continue;
            extras.push({
                key,
                label: key === "nightlyPrice" ? "نرخ اجاره هر شب" : key,
                displayValue: typeof val === "number" ? formatPrice(val) : String(val),
            });
        }
        return extras;
    }, [pricingValues, activePriceModel?.pricingFields]);

    const filledNonBooleanAttrs = useMemo(() => {
        if (!subcatConfig?.attributeDefinitions) return [];
        return subcatConfig.attributeDefinitions.filter((attr) => {
            if (attr.type === "BOOLEAN") return false;
            const val = formData.attributes?.[attr.key];
            return val !== undefined && val !== null && String(val).trim() !== "";
        });
    }, [subcatConfig?.attributeDefinitions, formData.attributes]);

    const activeBooleanFeatures = useMemo(() => {
        if (!subcatConfig?.attributeDefinitions) return [];
        return subcatConfig.attributeDefinitions.filter((attr) => {
            if (attr.type !== "BOOLEAN") return false;
            return Boolean(formData.attributes?.[attr.key]);
        });
    }, [subcatConfig?.attributeDefinitions, formData.attributes]);

    const extraAttributes = useMemo(() => {
        if (!formData.attributes) return [];
        const definedKeys = new Set(subcatConfig?.attributeDefinitions?.map((a) => a.key) || []);
        const extras: { key: string; label: string; displayValue: string }[] = [];
        for (const [key, val] of Object.entries(formData.attributes)) {
            if (definedKeys.has(key)) continue;
            if (val === undefined || val === null || String(val).trim() === "") continue;
            if (typeof val === "boolean") {
                if (val) {
                    extras.push({ key, label: key, displayValue: "دارد" });
                }
            } else {
                extras.push({
                    key,
                    label: key,
                    displayValue: typeof val === "number" ? toPersianDigits(val) : String(val),
                });
            }
        }
        return extras;
    }, [formData.attributes, subcatConfig?.attributeDefinitions]);

    const currentStepIndex = STEPS_CONFIG.findIndex((s) => s.id === step);

    const validateDetailsStep = (): boolean => {
        let isValid = true;
        const pErrors: Record<string, string> = {};
        const aErrors: Record<string, string> = {};

        // Validate pricing fields
        if (activePriceModel) {
            for (const field of activePriceModel.pricingFields) {
                const val = pricingValues?.[field.key];
                const isUnset = val === undefined || val === null || String(val).trim() === "";

                if (field.required && isUnset) {
                    pErrors[field.key] = `فیلد «${field.label}» الزامی است`;
                    isValid = false;
                } else if (!isUnset && field.fieldType === "NUMBER") {
                    const num = Number(val);
                    if (isNaN(num) || num < 0) {
                        pErrors[field.key] = `فیلد «${field.label}» باید عدد معتبر باشد`;
                        isValid = false;
                    }
                }
            }
        }

        // Validate attributes with constraints
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
            toast.error("لطفاً فیلدهای الزامی و خطاهای مشخص‌شده در قیمت و مشخصات را تکمیل نمایید");
        }

        return isValid;
    };

    const handleNext = () => {
        if (step === "BASIC_INFO") {
            if (adminMode && !adminOwnership.isPlatform) {
                if (!adminOwnership.phoneNumber?.trim()) {
                    toast.error("لطفاً شماره تماس مالک اقامتگاه را وارد فرمایید");
                    return;
                }
                if (adminOwnership.isUserFound === false) {
                    if (!adminOwnership.firstName?.trim() || !adminOwnership.lastName?.trim()) {
                        toast.error("لطفاً نام و نام خانوادگی مالک جدید را وارد فرمایید");
                        return;
                    }
                }
            }

            if (!formData.cityId) {
                toast.error("لطفاً شهر اقامتگاه را مشخص نمایید");
                return;
            }

            if (!formData.categoryPath?.categoryKey || !formData.categoryPath?.subcategoryKey) {
                toast.error("لطفاً نوع و زیردسته اقامتگاه را مشخص فرمایید");
                return;
            }

            let hasBasicError = false;
            const trimmedTitle = formData.title?.trim() || "";
            const trimmedDesc = formData.description?.trim() || "";

            if (!trimmedTitle) {
                setTitleError("عنوان اقامتگاه الزامی است");
                hasBasicError = true;
            } else if (trimmedTitle.length < 5) {
                setTitleError("عنوان اقامتگاه باید حداقل ۵ کاراکتر باشد");
                hasBasicError = true;
            } else if (trimmedTitle.length > 120) {
                setTitleError("عنوان اقامتگاه حداکثر می‌تواند ۱۲۰ کاراکتر باشد");
                hasBasicError = true;
            } else {
                setTitleError("");
            }

            if (!trimmedDesc) {
                setDescriptionError("توضیحات اقامتگاه الزامی است");
                hasBasicError = true;
            } else if (trimmedDesc.length < 20) {
                setDescriptionError(`توضیحات اقامتگاه باید حداقل ۲۰ کاراکتر باشد (تعداد فعلی: ${toPersianDigits(trimmedDesc.length)} کاراکتر)`);
                hasBasicError = true;
            } else if (trimmedDesc.length > 4000) {
                setDescriptionError("توضیحات اقامتگاه حداکثر می‌تواند ۴۰۰۰ کاراکتر باشد");
                hasBasicError = true;
            } else {
                setDescriptionError("");
            }

            if (!formData.mediaIds || formData.mediaIds.length === 0) {
                toast.error("بارگذاری حداقل یک تصویر یا ویدئو برای اقامتگاه الزامی است");
                hasBasicError = true;
            }

            if (hasBasicError) {
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
                toast.error("تعیین موقعیت مکانی اقامتگاه روی نقشه الزامی است");
                return;
            }
        }

        if (currentStepIndex === STEPS_CONFIG.length - 1) {
            submitMutation.mutate();
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
                <div className="max-w-md w-full bg-surface rounded-3xl p-6 sm:p-8 border border-border-subtle shadow-md text-center space-y-5">
                    <div className="w-16 h-16 bg-error-subtle text-error rounded-2xl flex items-center justify-center mx-auto">
                        <ShieldAlert className="w-8 h-8" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-xl font-black text-brand">دسترسی ثبت اقامتگاه مسدود است</h2>
                        <p className="text-xs text-text-light leading-relaxed">
                            {restrictionMessage || "حساب کاربری شما در وضعیت تعلیق یا مسدودی قرار دارد و امکان ثبت یا ویرایش اقامتگاه برای شما غیرفعال است."}
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
                            className="py-3 px-4 rounded-xl bg-surface-secondary text-foreground text-xs font-bold hover:bg-border/30 transition-colors flex items-center justify-center gap-1.5"
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
                <p className="text-text-light font-bold text-sm">در حال دریافت اطلاعات اقامتگاه...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface-secondary/50 py-3 sm:py-8 px-2.5 sm:px-6 lg:px-8 pb-35 sm:pb-32 lg:pb-12">
            <div className="max-w-3xl mx-auto">
                {/* Standard Header with Back button and centered title */}
                <header className="relative mb-3 sm:mb-6 flex items-center justify-center min-h-[40px]">
                    <button
                        type="button"
                        onClick={() => handlePageBack()}
                        className="absolute right-0 top-1/2 -translate-y-1/2 p-2 -mr-2 text-foreground-muted hover:text-brand transition-colors shrink-0 cursor-pointer"
                        aria-label="بازگشت"
                        title="بازگشت"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>

                    <h1 className="text-lg sm:text-2xl font-black text-brand text-center px-16 sm:px-24">
                        {adminMode
                            ? "ثبت اقامتگاه جدید (پنل مدیریت)"
                            : editAdId
                                ? "ویرایش اطلاعات اقامتگاه"
                                : "ثبت اقامتگاه جدید"}
                    </h1>
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
                        {/* STEP 1: BASIC INFO */}
                        {step === "BASIC_INFO" && (
                            <div className="space-y-6">
                                {adminMode && (
                                    <AdminOwnershipSelector
                                        value={adminOwnership}
                                        onChange={setAdminOwnership}
                                    />
                                )}

                                {/* City Selection using ResponsiveSelectDrawer */}
                                <div>
                                    <ResponsiveSelectDrawer
                                        label="شهر اقامتگاه"
                                        required
                                        value={formData.cityId}
                                        onChange={handleCityChange}
                                        options={cityOptions}
                                        placeholder="انتخاب شهر..."
                                        drawerTitle="انتخاب شهر اقامتگاه"
                                        searchable
                                        searchPlaceholder="جستجوی نام شهر..."
                                        tags={popularCityTags}
                                        tagsLabel="شهرهای پرطرفدار گردشگری:"
                                        icon={<MapPin className="w-4 h-4" />}
                                    />
                                </div>

                                {/* Category & Subcategory Selection using ResponsiveSelectDrawer */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <ResponsiveSelectDrawer
                                        label="نوع اقامتگاه (دسته‌بندی اصلی)"
                                        required
                                        value={formData.categoryPath?.categoryKey}
                                        onChange={handleCategoryChange}
                                        options={categoryOptions}
                                        placeholder="انتخاب نوع اقامتگاه..."
                                        drawerTitle="انتخاب نوع اقامتگاه"
                                        icon={<Tag className="w-4 h-4" />}
                                    />

                                    <ResponsiveSelectDrawer
                                        label="زیردسته اقامتگاه"
                                        required
                                        value={formData.categoryPath?.subcategoryKey}
                                        onChange={handleSubcategoryChange}
                                        options={subcategoryOptions}
                                        placeholder={formData.categoryPath?.categoryKey ? "انتخاب زیردسته..." : "ابتدا نوع اقامتگاه را مشخص کنید"}
                                        drawerTitle="انتخاب زیردسته اقامتگاه"
                                        disabled={!formData.categoryPath?.categoryKey}
                                        icon={<Tag className="w-4 h-4" />}
                                    />
                                </div>

                                {/* Price Model Selection Chips */}
                                {subcatConfig?.allowedPriceModels && subcatConfig.allowedPriceModels.length > 0 && (
                                    <div>
                                        <label className="block text-xs font-bold text-brand mb-2">
                                            مدل قیمت‌گذاری <span className="text-error">*</span>
                                        </label>
                                        <div className="flex flex-wrap gap-2.5">
                                            {subcatConfig.allowedPriceModels.map((pm) => {
                                                const isSelected = (formData.priceModelKey || activePriceModel?.key) === pm.key;
                                                return (
                                                    <button
                                                        key={pm.key}
                                                        type="button"
                                                        onClick={() => {
                                                            setFormData((prev) => ({ ...prev, priceModelKey: pm.key }));
                                                            setPricingValues({});
                                                            setPricingErrors({});
                                                        }}
                                                        className={cn(
                                                            "px-4 py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-2 cursor-pointer",
                                                            isSelected
                                                                ? "bg-primary text-white border-primary shadow-xs"
                                                                : "bg-surface hover:bg-surface-secondary text-text-light border-border-subtle"
                                                        )}
                                                    >
                                                        <span>{pm.displayName}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Title with Counter & Validation */}
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="text-xs font-bold text-brand">
                                            عنوان اقامتگاه <span className="text-error">*</span>
                                        </label>
                                        <span className="text-[11px] text-text-light font-mono" dir="ltr">
                                            {toPersianDigits(formData.title?.length || 0)} / ۱۲۰
                                        </span>
                                    </div>
                                    <input
                                        type="text"
                                        value={formData.title || ""}
                                        onChange={(e) => {
                                            setFormData((prev) => ({ ...prev, title: e.target.value }));
                                            if (titleError) setTitleError("");
                                        }}
                                        placeholder="مثال: ویلای دوبلکس استخردار در رامسر با چشم‌انداز جنگل"
                                        maxLength={120}
                                        className={cn(
                                            "w-full px-3.5 py-3 rounded-xl border text-xs sm:text-sm font-medium transition-all focus:outline-hidden",
                                            titleError
                                                ? "border-error focus:border-error bg-error-subtle/20"
                                                : "border-border-subtle focus:border-primary bg-surface"
                                        )}
                                    />
                                    {titleError && (
                                        <p className="text-[11px] font-bold text-error mt-1">{titleError}</p>
                                    )}
                                </div>

                                {/* Description with Counter & Validation */}
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="text-xs font-bold text-brand">
                                            توضیحات اقامتگاه <span className="text-error">*</span>
                                        </label>
                                        <span className="text-[11px] text-text-light font-mono" dir="ltr">
                                            {toPersianDigits(formData.description?.length || 0)} / ۴۰۰۰
                                        </span>
                                    </div>
                                    <textarea
                                        rows={4}
                                        value={formData.description || ""}
                                        onChange={(e) => {
                                            setFormData((prev) => ({ ...prev, description: e.target.value }));
                                            if (descriptionError) setDescriptionError("");
                                        }}
                                        placeholder="امکانات، فاصله تا جاذبه‌های گردشگری، قوانین پذیرش و آرامش محیط را با دقت بنویسید (حداقل ۲۰ کاراکتر)..."
                                        maxLength={4000}
                                        className={cn(
                                            "w-full px-3.5 py-3 rounded-xl border text-xs sm:text-sm font-medium transition-all focus:outline-hidden resize-y",
                                            descriptionError
                                                ? "border-error focus:border-error bg-error-subtle/20"
                                                : "border-border-subtle focus:border-primary bg-surface"
                                        )}
                                    />
                                    {descriptionError && (
                                        <p className="text-[11px] font-bold text-error mt-1">{descriptionError}</p>
                                    )}
                                </div>

                                {/* Media Gallery Upload (Integrated in Step 1) */}
                                <div className="space-y-3 pt-2 border-t border-border-subtle/70">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold text-brand">
                                            تصاویر و ویدئوهای اقامتگاه <span className="text-error">*</span>
                                        </label>
                                        <span className="text-[11px] text-text-light">حداکثر ۱۵ فایل</span>
                                    </div>

                                    <MediaGalleryUpload
                                        value={formData.mediaIds}
                                        onChange={(media) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                mediaIds: media,
                                            }))
                                        }
                                        label=""
                                        helperText="بارگذاری حداقل یک تصویر برای ثبت اقامتگاه الزامی است. اقامتگاه‌های دارای تصاویر باکیفیت و ویدئو تا ۵ برابر بیشتر رزرو دریافت می‌کنند."
                                        maxFiles={15}
                                        allowVideos={true}
                                    />
                                </div>
                            </div>
                        )}

                        {/* STEP 2: DETAILS */}
                        {step === "DETAILS" && (
                            <div className="space-y-6">
                                {/* Dynamic Pricing Fields */}
                                {activePriceModel && activePriceModel.pricingFields && activePriceModel.pricingFields.length > 0 && (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
                                            <h3 className="text-sm sm:text-base font-black text-brand flex items-center gap-2">
                                                <Wallet className="w-4 h-4 text-primary" />
                                                نرخ و قیمت‌گذاری اقامتگاه ({activePriceModel.displayName})
                                            </h3>
                                        </div>
                                        <DynamicPricingFields
                                            priceModel={activePriceModel as any}
                                            values={pricingValues}
                                            onChange={(key, val) => {
                                                setPricingValues((prev) => ({ ...prev, [key]: val }));
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

                                {/* Dynamic Attributes */}
                                {subcatConfig?.attributeDefinitions && subcatConfig.attributeDefinitions.length > 0 && (
                                    <div className="space-y-4 pt-4 border-t border-border-subtle">
                                        <h3 className="text-sm sm:text-base font-black text-brand flex items-center gap-2 pb-2 border-b border-border-subtle">
                                            <Tag className="w-4 h-4 text-primary" />
                                            مشخصات و امکانات اقامتگاه
                                        </h3>
                                        <DynamicAttributeRenderer
                                            definitions={subcatConfig.attributeDefinitions}
                                            values={formData.attributes || {}}
                                            onChange={(key, val) => {
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    attributes: { ...prev.attributes, [key]: val },
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

                        {/* STEP 3: LOCATION */}
                        {step === "LOCATION" && (
                            <div className="space-y-4">
                                <div>
                                    <h2 className="text-base sm:text-lg font-black text-brand">تعیین موقعیت مکانی روی نقشه</h2>
                                    <p className="text-xs text-text-light mt-1">
                                        نقشه به صورت خودکار روی شهر انتخابی شما ({cityName || "شهر انتخاب‌شده"}) تنظیم شده است. با کلیک روی نقشه یا جابجایی نشانگر، محدوده اقامتگاه را مشخص نمایید.
                                    </p>
                                </div>

                                <div className="rounded-2xl overflow-hidden border border-border-subtle">
                                    <DynamicMapPicker
                                        cityCenter={cityCoordinates}
                                        cityName={cityName}
                                        initialCenter={cityCoordinates}
                                        value={[formData.latitude ?? 35.6892, formData.longitude ?? 51.3890]}
                                        zoom={13}
                                        onChange={(lat, lng) =>
                                            setFormData((prev) => ({ ...prev, latitude: lat, longitude: lng }))
                                        }
                                    />
                                </div>

                                {/* Detected Neighborhood Feedback */}
                                <div className="flex items-center gap-2 p-3 bg-surface-secondary/70 rounded-xl border border-border-subtle text-xs">
                                    <MapPin className="w-4 h-4 text-primary shrink-0" />
                                    <span className="text-text-light font-medium">محله تشخیص داده‌شده:</span>
                                    {isLoadingNeighborhood ? (
                                        <span className="text-text-light animate-pulse">در حال بررسی نقشه...</span>
                                    ) : detectedZone?.name ? (
                                        <span className="font-black text-brand bg-primary/10 text-primary px-2.5 py-0.5 rounded-lg border border-primary/20">
                                            {detectedZone.name}
                                        </span>
                                    ) : (
                                        <span className="text-text-light">
                                            محدوده عمومی شهر (مختصات نقشه با موفقیت ثبت شد)
                                        </span>
                                    )}
                                </div>

                                {/* Optional Address Field */}
                                <div>
                                    <label className="block text-xs font-bold text-brand mb-1.5">
                                        آدرس یا راهنمای دسترسی (اختیاری)
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.address || ""}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                                        placeholder="مثال: کیلومتر ۵ جاده ساحلی، کوچه صنوبر ۴"
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-border-subtle text-xs sm:text-sm bg-surface focus:border-primary focus:outline-hidden"
                                    />
                                    <p className="text-[10px] text-text-light mt-1">
                                        این متن جهت سهولت در آدرس‌دهی پس از ثبت درخواست به میهمان نمایش داده خواهد شد.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* STEP 4: REVIEW */}
                        {step === "REVIEW" && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-lg font-black text-brand">بازبینی و ثبت نهایی اقامتگاه</h2>
                                    <p className="text-xs text-text-light mt-1">
                                        اطلاعات ثبت‌شده را به دقت بررسی فرمایید. در صورت نیاز به ویرایش هر بخش، می‌توانید با کلیک روی دکمه ویرایش به مرحله مربوطه بازگردید.
                                    </p>
                                </div>

                                {/* Section 1: Basic Information & Location */}
                                <div className="bg-surface-secondary/70 rounded-2xl p-4 sm:p-5 border border-border-subtle space-y-3">
                                    <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
                                        <h3 className="text-xs sm:text-sm font-black text-brand flex items-center gap-2">
                                            <Tag className="w-4 h-4 text-primary" />
                                            اطلاعات پایه و دسته‌بندی
                                        </h3>
                                        <button
                                            type="button"
                                            onClick={() => setStep("BASIC_INFO")}
                                            className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                                        >
                                            <Pencil className="w-3 h-3" />
                                            ویرایش
                                        </button>
                                    </div>

                                    {adminMode && (
                                        <ReviewRow
                                            label="نوع ثبت در پنل مدیریت"
                                            value={
                                                adminOwnership.isPlatform
                                                    ? "سازمانی (سامانه ملک تودی)"
                                                    : `به نام میزبان: ${adminOwnership.foundUserName || `${adminOwnership.firstName} ${adminOwnership.lastName}`} (${toPersianDigits(adminOwnership.phoneNumber)})`
                                            }
                                            isLong
                                        />
                                    )}

                                    <ReviewRow
                                        label="عنوان اقامتگاه"
                                        value={formData.title}
                                        isLong
                                    />

                                    <ReviewRow
                                        label="نوع و زیردسته اقامتگاه"
                                        value={`${subcatConfig?.subcategory?.categoryDisplayName || "اقامتگاه"} / ${subcatConfig?.subcategory?.displayName || "اجاره روزانه"}`}
                                    />

                                    <ReviewRow
                                        label="شهر و استان"
                                        value={provinceAndCityName}
                                    />

                                    <ReviewRow
                                        label="محله روی نقشه"
                                        value={detectedZone?.name || "محدوده عمومی شهر (مختصات نقشه ثبت گردید)"}
                                        highlight={Boolean(detectedZone?.name)}
                                    />

                                    {formData.address && (
                                        <ReviewRow
                                            label="آدرس یا راهنمای دسترسی"
                                            value={formData.address}
                                            isLong
                                        />
                                    )}

                                    <ReviewRow
                                        label="مدل قیمت‌گذاری"
                                        value={activePriceModel?.displayName}
                                        highlight
                                    />
                                </div>

                                {/* Section 2: Pricing Breakdown */}
                                <div className="bg-surface-secondary/70 rounded-2xl p-4 sm:p-5 border border-border-subtle space-y-3">
                                    <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
                                        <h3 className="text-xs sm:text-sm font-black text-brand flex items-center gap-2">
                                            <Wallet className="w-4 h-4 text-primary" />
                                            شرایط مالی و نرخ‌گذاری ({activePriceModel?.displayName || "اقامتگاه"})
                                        </h3>
                                        <button
                                            type="button"
                                            onClick={() => setStep("DETAILS")}
                                            className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                                        >
                                            <Pencil className="w-3 h-3" />
                                            ویرایش
                                        </button>
                                    </div>

                                    {(filledPricingFields.length > 0 || extraPricingFields.length > 0) ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                                            {filledPricingFields.map((field) => {
                                                const val = pricingValues[field.key];
                                                const displayVal = formatPricingFieldValue(field, val);
                                                const isValLong = typeof displayVal === "string" && displayVal.length > 22;
                                                return (
                                                    <div
                                                        key={field.key}
                                                        className={cn(
                                                            "p-3 bg-surface rounded-xl border border-border-subtle/70 text-xs",
                                                            isValLong
                                                                ? "flex flex-col gap-1 items-start"
                                                                : "flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1"
                                                        )}
                                                    >
                                                        <span className="text-text-light font-medium shrink-0">{field.label}:</span>
                                                        <span className={cn(
                                                            "font-black text-brand break-words min-w-0 [overflow-wrap:anywhere]",
                                                            isValLong ? "text-right w-full" : "text-left"
                                                        )}>
                                                            {displayVal}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                            {extraPricingFields.map((field) => {
                                                const isValLong = typeof field.displayValue === "string" && field.displayValue.length > 22;
                                                return (
                                                    <div
                                                        key={field.key}
                                                        className={cn(
                                                            "p-3 bg-surface rounded-xl border border-border-subtle/70 text-xs",
                                                            isValLong
                                                                ? "flex flex-col gap-1 items-start"
                                                                : "flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1"
                                                        )}
                                                    >
                                                        <span className="text-text-light font-medium shrink-0">{field.label}:</span>
                                                        <span className={cn(
                                                            "font-black text-brand break-words min-w-0 [overflow-wrap:anywhere]",
                                                            isValLong ? "text-right w-full" : "text-left"
                                                        )}>
                                                            {field.displayValue}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="py-2 text-xs text-text-light">
                                            <span>نرخ مشخصی تعیین نشده است. نرخ پایه پیش‌فرض: </span>
                                            <span className="font-bold text-brand">{formatPrice(Number(formData.nightlyPrice || 0))}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Section 3: Attributes and Technical Specs */}
                                {(filledNonBooleanAttrs.length > 0 || activeBooleanFeatures.length > 0 || extraAttributes.length > 0) && (
                                    <div className="bg-surface-secondary/70 rounded-2xl p-4 sm:p-5 border border-border-subtle space-y-3">
                                        <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
                                            <h3 className="text-xs sm:text-sm font-black text-brand flex items-center gap-2">
                                                <Home className="w-4 h-4 text-primary" />
                                                مشخصات فنی و امکانات اقامتگاه
                                            </h3>
                                            <button
                                                type="button"
                                                onClick={() => setStep("DETAILS")}
                                                className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                                            >
                                                <Pencil className="w-3 h-3" />
                                                ویرایش
                                            </button>
                                        </div>

                                        {/* Non-boolean attributes */}
                                        {(filledNonBooleanAttrs.length > 0 || extraAttributes.length > 0) && (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
                                                {filledNonBooleanAttrs.map((attr) => {
                                                    const val = formData.attributes?.[attr.key];
                                                    const displayVal = formatAttributeValue(attr, val);
                                                    const isValLong = typeof displayVal === "string" && displayVal.length > 22;
                                                    return (
                                                        <div
                                                            key={attr.key}
                                                            className={cn(
                                                                "p-3 bg-surface rounded-xl border border-border-subtle/70 text-xs",
                                                                isValLong
                                                                    ? "flex flex-col gap-1 items-start"
                                                                    : "flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1"
                                                            )}
                                                        >
                                                            <span className="text-text-light font-medium shrink-0">{attr.label}:</span>
                                                            <span className={cn(
                                                                "font-bold text-brand break-words min-w-0 [overflow-wrap:anywhere]",
                                                                isValLong ? "text-right w-full" : "text-left"
                                                            )}>
                                                                {displayVal}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                                {extraAttributes.map((attr) => {
                                                    const isValLong = typeof attr.displayValue === "string" && attr.displayValue.length > 22;
                                                    return (
                                                        <div
                                                            key={attr.key}
                                                            className={cn(
                                                                "p-3 bg-surface rounded-xl border border-border-subtle/70 text-xs",
                                                                isValLong
                                                                    ? "flex flex-col gap-1 items-start"
                                                                    : "flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1"
                                                            )}
                                                        >
                                                            <span className="text-text-light font-medium shrink-0">{attr.label}:</span>
                                                            <span className={cn(
                                                                "font-bold text-brand break-words min-w-0 [overflow-wrap:anywhere]",
                                                                isValLong ? "text-right w-full" : "text-left"
                                                            )}>
                                                                {attr.displayValue}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {/* Boolean amenities */}
                                        {activeBooleanFeatures.length > 0 && (
                                            <div className="pt-2 border-t border-border-subtle/60 space-y-2">
                                                <span className="text-xs font-bold text-text-light block">ویژگی‌ها و امکانات رفاهی:</span>
                                                <div className="flex flex-wrap gap-2">
                                                    {activeBooleanFeatures.map((feat) => (
                                                        <span
                                                            key={feat.key}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface border border-border-subtle text-xs font-bold text-brand shadow-2xs"
                                                        >
                                                            <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                                                            <span>{feat.label}</span>
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Section 4: Media Gallery Preview */}
                                <div className="bg-surface-secondary/70 rounded-2xl p-4 sm:p-5 border border-border-subtle space-y-3">
                                    <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
                                        <h3 className="text-xs sm:text-sm font-black text-brand flex items-center gap-2">
                                            <ImageIcon className="w-4 h-4 text-primary" />
                                            تصاویر و رسانه‌های اقامتگاه ({toPersianDigits(formData.mediaIds?.length || 0)} فایل)
                                        </h3>
                                        <button
                                            type="button"
                                            onClick={() => setStep("BASIC_INFO")}
                                            className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                                        >
                                            <Pencil className="w-3 h-3" />
                                            ویرایش
                                        </button>
                                    </div>

                                    {formData.mediaIds && formData.mediaIds.length > 0 ? (
                                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-1">
                                            {formData.mediaIds.map((m, idx) => (
                                                <div
                                                    key={m.id || idx}
                                                    className="relative aspect-4/3 rounded-xl overflow-hidden border border-border-subtle bg-surface-secondary group"
                                                >
                                                    <img
                                                        src={getMediaUrl(m.id)}
                                                        alt={`رسانه ${toPersianDigits(idx + 1)}`}
                                                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                    />
                                                    {m.type === "VIDEO" && (
                                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                            <Video className="w-4 h-4 text-white" />
                                                        </div>
                                                    )}
                                                    {idx === 0 && (
                                                        <span className="absolute bottom-1 right-1 text-[9px] font-bold bg-primary text-white px-1.5 py-0.5 rounded shadow-xs">
                                                            تصویر اصلی
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-error font-medium">تصویری بارگذاری نشده است.</p>
                                    )}
                                </div>

                                {/* Section 5: Description */}
                                <div className="bg-surface-secondary/70 rounded-2xl p-4 sm:p-5 border border-border-subtle space-y-2">
                                    <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
                                        <h3 className="text-xs sm:text-sm font-black text-brand flex items-center gap-2">
                                            <FileText className="w-4 h-4 text-primary" />
                                            توضیحات اقامتگاه
                                        </h3>
                                        <button
                                            type="button"
                                            onClick={() => setStep("BASIC_INFO")}
                                            className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                                        >
                                            <Pencil className="w-3 h-3" />
                                            ویرایش
                                        </button>
                                    </div>
                                    <p className="text-xs sm:text-sm text-text-main whitespace-pre-line leading-relaxed pt-1">
                                        {formData.description || "توضیحاتی ثبت نشده است."}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Navigation Buttons */}
                    <div className="mt-8 flex items-center justify-between border-t border-border-subtle pt-6">
                        <button
                            type="button"
                            onClick={handleBack}
                            disabled={currentStepIndex === 0}
                            className="flex items-center text-text-light hover:text-brand disabled:opacity-30 font-bold text-xs cursor-pointer transition-colors"
                        >
                            <ChevronRight className="h-4 w-4 ml-1" />
                            <span>مرحله قبل</span>
                        </button>

                        {currentStepIndex === STEPS_CONFIG.length - 1 ? (
                            <button
                                type="button"
                                onClick={handleNext}
                                disabled={submitMutation.isPending}
                                className={cn(
                                    "px-7 py-3 rounded-xl text-white font-black text-xs shadow-md flex items-center gap-1.5 transition-all cursor-pointer active:scale-95",
                                    adminMode
                                        ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
                                        : "bg-primary hover:bg-primary/90 shadow-primary/20"
                                )}
                            >
                                {submitMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                                <span>{adminMode ? "ثبت نهایی اقامتگاه در پنل مدیریت" : editAdId ? "به‌روزرسانی اقامتگاه" : "ثبت و انتشار اقامتگاه"}</span>
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleNext}
                                className="bg-primary text-white px-7 py-3 rounded-xl font-black text-xs hover:bg-primary/90 transition-all flex items-center shadow-md shadow-primary/20 cursor-pointer active:scale-95"
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
