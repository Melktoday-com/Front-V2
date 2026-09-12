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
    mediaIds: string[];
    latitude: number;
    longitude: number;
    availabilityWindow: TemporaryRentAvailabilityWindow;
    attributes: Record<string, any>;
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
    attributes?: Record<string, any>;
    mediaIds?: string[];
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