import { AdStatus } from "./enums";

export interface CategoryPath {
    categoryKey: string;
    subcategoryKey: string;
    businessModelKey: string;
    attributeSchemaVersion: number;
}

export interface AdSummary {
    adId: string;
    ownerId: string;
    cityId: string;
    status: AdStatus;
    title: string;
    categoryPath: CategoryPath;
    pricing: Record<string, number>;
    isFeatured: boolean;
    mediaIds?: string[];
    createdAt: string;
    location: {
        latitude: number;
        longitude: number;
    };
}

export interface ListAdsQuery {
    status?: AdStatus | string;
    cityId?: string;
    search?: string;
    page?: number;
    limit?: number;
    isFeatured?: boolean;
    categoryKey?: string;
    subcategoryKey?: string;
    businessModelKey?: string;
    ownerId?: string;
}

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
}

export type PaginatedAdsResponse = PaginatedResponse<AdSummary>;

import { JsonObject } from "../common";

export interface AdDetail extends AdSummary {
    description: string;
    attributes: JsonObject;
    updatedAt: string;
}

export interface CreateAdDraftRequest {
    cityId: string;
    categoryPath: CategoryPath;
    title: string;
    description: string;
    rawPricing: Record<string, number | string | boolean>;
    pricing?: Record<string, number | string | boolean>;
    attributes: JsonObject;
    latitude: number;
    longitude: number;
    mediaIds?: string[];
}

export interface EditAdRequest {
    title?: string;
    description?: string;
    rawPricing?: Record<string, number | string | boolean>;
    attributes?: JsonObject;
}

export interface AdMutationResponse {
    adId: string;
    ownerId: string;
    cityId: string;
    status: AdStatus;
    updatedAt: string;
}

export interface AdContactInfo {
    adId: string;
    ownerId: string;
    mobileNumber: string;
    email?: string;
}

export interface PricingFieldDefinition {
    key: string;
    label: string;
    fieldType: 'NUMBER' | 'BOOLEAN' | 'STRING' | 'TEXT' | 'SELECT';
    required: boolean;
    placeholder?: string;
    unit?: string;
    helpText?: string;
    defaultValue?: number | string | boolean;
    constraints?: {
        min?: number;
        max?: number;
        options?: Array<{ key: string; label: string }>;
    };
}

export interface PriceModel {
    id: string;
    key: string;
    name: string;
    displayName: string;
    description?: string;
    currency?: string;
    displayOrder?: number;
    isActive: boolean;
    isDefault?: boolean;
    pricingFields: PricingFieldDefinition[];
}

export type PricingField = PricingFieldDefinition;

export interface AttributeOptionItem {
    key: string;
    label: string;
    displayOrder?: number;
}

export type AttributeOption = AttributeOptionItem;

export type DynamicAttributeType = 'STRING' | 'NUMBER' | 'BOOLEAN' | 'SELECT';

export interface AttributeDefinition {
    id: string;
    subcategoryId: string;
    key: string;
    label: string;
    description?: string;
    type: DynamicAttributeType;
    required: boolean;
    displayOrder: number;
    isActive: boolean;
    options?: AttributeOptionItem[] | null;
    constraints?: {
        min?: number;
        max?: number;
        minLength?: number;
        maxLength?: number;
    };
}

export interface Subcategory {
    id: string;
    key: string;
    displayName: string;
    description?: string;
    icon?: string;
    banner?: string;
    displayOrder?: number;
    isActive?: boolean;
    isArchived?: boolean;
    priceModels?: PriceModel[];
    allowedPriceModelIds?: string[];
}

export interface CategoryListItem {
    id: string;
    key: string;
    displayName: string;
    description?: string;
    icon?: string;
    banner?: string;
    slug?: string;
    displayOrder?: number;
    isActive?: boolean;
    isArchived?: boolean;
    subcategories: Subcategory[];
}

export interface SubcategoryConfigResponse {
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
    allowedPriceModels: PriceModel[];
    attributeDefinitions: AttributeDefinition[];
}
