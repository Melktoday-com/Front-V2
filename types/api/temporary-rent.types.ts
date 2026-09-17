import { JsonValue } from "../common";

export interface TemporaryRentCategoryPath {
    categoryKey: string;
    subcategoryKey: string;
    attributeSchemaVersion: number;
}

export interface TemporaryRentAvailabilityWindow {
    availableFrom: string;
    availableTo: string;
}

export interface TemporaryRentAd {
    id: string;
    ownerId: string;
    cityId: string;
    status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'PENDING_APPROVAL';
    title: string;
    description: string;
    pricing: {
        nightlyPrice: number;
    };
    maxGuests: number;
    guestCapacity?: number;
    mediaIds: string[];
    latitude: number;
    longitude: number;
    address?: string;
    availabilityWindow: TemporaryRentAvailabilityWindow;
    attributes: Record<string, JsonValue>;
    createdAt: string;
    updatedAt: string;
    owner?: {
        fullName?: string;
        avatarUrl?: string;
    };
    cityName?: string;
}

export interface CreateTemporaryRentDraftRequest {
    cityId: string;
    categoryPath: TemporaryRentCategoryPath;
    title: string;
    description: string;
    nightlyPrice: number;
    maxGuests: number;
    availabilityWindow: TemporaryRentAvailabilityWindow;
    latitude: number;
    longitude: number;
    attributes?: Record<string, JsonValue>;
    mediaIds?: string[];
    priceModelKey?: string;
    pricing?: Record<string, number | string | boolean>;
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
