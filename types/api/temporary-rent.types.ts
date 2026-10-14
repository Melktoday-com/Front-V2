import { JsonValue } from "../common";
import type { MediaReference } from "./media.types";
import type { AdPublisher } from "./ads.types";

export interface TemporaryRentCategoryPath {
    categoryKey: string;
    subcategoryKey: string;
    attributeSchemaVersion: number;
}

export interface TemporaryRentAvailabilityWindow {
    availableFrom: string;
    availableTo: string;
}

export interface TemporaryRentDailyRentStandardValues {
    nightlyPrice: number;
    extraGuestNightlyPrice?: number;
    securityDeposit?: number;
}

export interface TemporaryRentWeeklyMonthlyRentValues {
    nightlyPrice: number;
    weeklyDiscountPercent?: number;
    monthlyPrice: number;
    securityDeposit?: number;
}

export interface TemporaryRentWeekendPeakRentValues {
    midweekNightlyPrice: number;
    weekendNightlyPrice: number;
    peakHolidayNightlyPrice?: number;
    minStayNightsWeekend?: number;
}

export interface TemporaryRentEventVenueRentValues {
    eventBasePrice: number;
    maxEventGuests: number;
    extraPersonFee?: number;
    cleaningAndDamageDeposit: number;
    musicAndSoundLimitHours?: string;
}

export type TemporaryRentPricingReadModel =
    | {
        priceModelKey: 'DAILY_RENT_STANDARD';
        pricing: TemporaryRentDailyRentStandardValues;
        legacyNightlyPrice?: never;
    }
    | {
        priceModelKey: 'WEEKLY_MONTHLY_RENT';
        pricing: TemporaryRentWeeklyMonthlyRentValues;
        legacyNightlyPrice?: never;
    }
    | {
        priceModelKey: 'WEEKEND_PEAK_RENT';
        pricing: TemporaryRentWeekendPeakRentValues;
        legacyNightlyPrice?: never;
    }
    | {
        priceModelKey: 'EVENT_VENUE_RENT';
        pricing: TemporaryRentEventVenueRentValues;
        legacyNightlyPrice?: never;
    }
    | {
        priceModelKey: null;
        pricing: null;
        legacyNightlyPrice: number;
    };

export interface TemporaryRentAd {
    id: string;
    ownerId: string;
    cityId: string;
    status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'PENDING_APPROVAL';
    title: string;
    description: string;
    pricing: TemporaryRentPricingReadModel;
    maxGuests: number;
    guestCapacity?: number;
    mediaIds: MediaReference[];
    latitude: number;
    longitude: number;
    address?: string;
    availabilityWindow: TemporaryRentAvailabilityWindow;
    attributes: Record<string, JsonValue>;
    createdAt: string;
    updatedAt: string;
    isSaved?: boolean;
    isFeatured?: boolean;
    isUrgent?: boolean;
    owner?: {
        id?: string;
        fullName?: string;
        avatarUrl?: string;
        slug?: string;
    };
    cityName?: string;
    publisher?: AdPublisher;
}

export type TemporaryRentPricingPayload =
    | TemporaryRentDailyRentStandardValues
    | TemporaryRentWeeklyMonthlyRentValues
    | TemporaryRentWeekendPeakRentValues
    | TemporaryRentEventVenueRentValues
    | Record<string, JsonValue>;

export interface CreateTemporaryRentDraftRequest {
    cityId: string;
    categoryPath: TemporaryRentCategoryPath;
    title: string;
    description: string;
    priceModelKey: string;
    pricing: TemporaryRentPricingPayload;
    nightlyPrice?: number;
    maxGuests: number;
    availabilityWindow: TemporaryRentAvailabilityWindow;
    latitude: number;
    longitude: number;
    attributes?: Record<string, JsonValue>;
    mediaIds?: MediaReference[];
}

export interface PublishTemporaryRentRequest {
    ownerId: string;
}

export interface TemporaryRentMutationResponse {
    adId: string;
    ownerId: string;
    cityId: string;
    status: string;
    updatedAt: string;
}

export interface TemporaryRentListResponse {
    items: TemporaryRentAd[];
    total: number;
    page: number;
    limit: number;
}

export interface TemporaryRentContactInfo {
    phoneNumber: string;
    ownerName?: string;
}

export interface TemporaryRentSubcategory {
    id: string;
    key: string;
    displayName: string;
    description?: string;
    icon?: string;
    banner?: string;
    displayOrder?: number;
    isActive?: boolean;
    isArchived?: boolean;
    priceModels?: TemporaryRentPriceModel[];
    allowedPriceModelIds?: string[];
}

export interface TemporaryRentCategory {
    id: string;
    key: string;
    displayName: string;
    description?: string;
    icon?: string;
    banner?: string;
    displayOrder?: number;
    isActive?: boolean;
    isArchived?: boolean;
    subcategories: TemporaryRentSubcategory[];
}

export interface TemporaryRentPriceModel {
    id: string;
    key: string;
    name: string;
    displayName: string;
    description?: string;
    currency?: string;
    displayOrder?: number;
    isActive: boolean;
    isDefault?: boolean;
    pricingFields: Array<{
        key: string;
        label: string;
        fieldType: 'NUMBER' | 'BOOLEAN' | 'STRING';
        required: boolean;
        placeholder?: string;
        unit?: string;
        helpText?: string;
    }>;
}

export interface TemporaryRentAttributeDefinition {
    id: string;
    subcategoryId: string;
    key: string;
    label: string;
    description?: string;
    type: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'SELECT';
    required: boolean;
    displayOrder: number;
    isActive: boolean;
    options?: Array<{ key: string; label: string; displayOrder?: number }> | null;
    constraints?: {
        min?: number;
        max?: number;
        minLength?: number;
        maxLength?: number;
    };
}

export interface TemporaryRentSubcategoryConfigResponse {
    subcategory: {
        id: string;
        key: string;
        displayName: string;
        description?: string;
        icon?: string;
        banner?: string;
        displayOrder?: number;
        categoryId: string;
        categoryKey: string;
        categoryDisplayName: string;
    };
    allowedPriceModels: TemporaryRentPriceModel[];
    attributeDefinitions: TemporaryRentAttributeDefinition[];
}
