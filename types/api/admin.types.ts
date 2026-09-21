import { AdStatus, PromotionStatus, ReportStatus, ReportTargetType, UserStatus } from "./enums";
import { PricingFieldDefinition } from "./ads.types";

export interface ModerationHistory {
    id: string;
    targetUserId: string;
    adminId: string;
    actionType: string;
    reasonCode?: string;
    reasonDetail?: string;
    note?: string;
    createdAt: string;
}

export interface BanUserRequest {
    reasonCode: string;
    reasonDetail?: string;
    note?: string;
}

export interface SuspendUserRequest {
    reasonCode: string;
    reasonDetail?: string;
    durationDays: number;
    note?: string;
}

export interface ApproveListingRequest {
    note?: string;
}

export interface RejectListingRequest {
    reason: string;
    note?: string;
}

export interface GiftCreditRequest {
    targetUserId: string;
    amountRials: number | string;
    note?: string;
}

export interface AdjustWalletRequest {
    targetUserId: string;
    type: 'CREDIT' | 'DEBIT';
    amountRials: number | string;
    note?: string;
}

export interface BroadcastNotificationRequest {
    title: string;
    body: string;
    audience: 'ALL' | 'BUYERS' | 'SELLERS' | 'AGENTS' | 'TENANTS' | 'LANDLORDS';
}

export interface AdminActionResponse {
    success: boolean;
    message?: string;
    transactionId?: string;
}

export interface PromotionSummary {
    promotionId: string;
    requestedBy: string;
    listingId: string;
    promotionType: string;
    durationDays: number;
    pricePaidRials: string | number;
    status: PromotionStatus;
    requestedAt: string;
    reviewedBy?: string;
    reviewedAt?: string;
    rejectionReason?: string;
}

export interface ListPendingPromotionsResponse {
    items: PromotionSummary[];
    total: number;
}

export interface CampaignSummary {
    campaignId: string;
    title: string;
    sponsorId: string;
    status: string;
    createdAt: string;
}

export interface ListPendingCampaignsResponse {
    items: CampaignSummary[];
    total: number;
}

export interface PlanLimits {
    maxActiveListings: number | null;
    hasAnalytics: boolean;
    hasPriorityRanking: boolean;
    hasProBadge: boolean;
    hasUnlimitedMessaging: boolean;
    canBoost: boolean;
}

export interface UpdatePlanLimitsRequest {
    plan: 'FREE' | 'PRO';
    limits: PlanLimits;
}

export interface GeoZone {
    id: string;
    externalId?: number;
    name: string;
    zoneType: 'PROVINCE' | 'CITY' | 'DISTRICT' | 'NEIGHBORHOOD' | 'MAP_ZONE';
    status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
    centerLatitude?: number;
    centerLongitude?: number;
    parentZoneId?: string;
    isConfirmed: boolean;
}

export interface CreateGeoZoneRequest {
    name: string;
    zoneType: string;
    centerLatitude?: number;
    centerLongitude?: number;
    parentZoneId?: string;
}

export interface UpdateGeoZoneRequest {
    name?: string;
    centerLatitude?: number;
    centerLongitude?: number;
    parentZoneId?: string | null;
}

export interface AdminUser {
    id: string;
    mobileNumber: string;
    firstName?: string;
    lastName?: string;
    status: UserStatus;
    roles: string[];
    createdAt: string;
}

export interface ListUsersResponse {
    items: AdminUser[];
    total: number;
}

export interface AdminAd {
    id: string;
    title: string;
    status: AdStatus;
    price: number;
    ownerName: string;
    createdAt: string;
    thumbnail?: string;
}

export interface AdminReport {
    id: string;
    reportedBy: string;
    targetType: ReportTargetType;
    targetId: string;
    reason: string;
    status: ReportStatus;
    note?: string;
    createdAt: string;
}

// ─────────────────────────────────────────────────────────────────
// Category & PriceModel Administration Types
// ─────────────────────────────────────────────────────────────────

export interface CreateAdminCategoryRequest {
    key: string;
    displayName: string;
    description?: string;
    icon?: string;
    banner?: string;
    displayOrder?: number;
}

export interface UpdateAdminCategoryRequest {
    displayName?: string;
    description?: string;
    icon?: string;
    banner?: string;
    displayOrder?: number;
    isActive?: boolean;
}

export interface CreateAdminSubcategoryRequest {
    key: string;
    displayName: string;
    description?: string;
    icon?: string;
    banner?: string;
    displayOrder?: number;
    allowedPriceModelIds?: string[];
    attributes?: CreateAdminAttributeRequest[];
}

export interface UpdateAdminSubcategoryRequest {
    displayName?: string;
    description?: string;
    icon?: string;
    banner?: string;
    displayOrder?: number;
    isActive?: boolean;
    allowedPriceModelIds?: string[];
    attributes?: CreateAdminAttributeRequest[];
}

export interface CreateAdminPriceModelRequest {
    key: string;
    name: string;
    displayName: string;
    description?: string;
    currency?: string;
    displayOrder?: number;
    isActive?: boolean;
    pricingFields: PricingFieldDefinition[];
}

export interface UpdateAdminPriceModelRequest {
    name?: string;
    displayName?: string;
    description?: string;
    currency?: string;
    displayOrder?: number;
    isActive?: boolean;
    pricingFields?: PricingFieldDefinition[];
}

export interface CreateAdminAttributeRequest {
    key: string;
    label: string;
    description?: string;
    type: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'SELECT';
    required?: boolean;
    displayOrder?: number;
    options?: Array<{ key: string; label: string; displayOrder?: number }>;
    constraints?: {
        min?: number;
        max?: number;
        minLength?: number;
        maxLength?: number;
    };
}

export interface UpdateAdminAttributeRequest {
    label?: string;
    description?: string;
    type?: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'SELECT';
    required?: boolean;
    displayOrder?: number;
    isActive?: boolean;
    options?: Array<{ key: string; label: string; displayOrder?: number }>;
    constraints?: {
        min?: number;
        max?: number;
        minLength?: number;
        maxLength?: number;
    };
}

export interface UserLookupResponse {
    found: boolean;
    user?: {
        userId: string;
        mobile: string;
        firstName?: string;
        lastName?: string;
        displayName?: string;
        status?: string;
    };
}

export interface AdminCreateAdRequest {
    isPlatform?: boolean;
    phoneNumber?: string;
    firstName?: string;
    lastName?: string;
    targetOwnerId?: string;
    cityId: string;
    categoryPath: {
        categoryKey: string;
        subcategoryKey: string;
        businessModelKey?: string;
        attributeSchemaVersion?: number;
    };
    title: string;
    description: string;
    rawPricing?: Record<string, number>;
    attributes?: Record<string, unknown>;
    latitude: number;
    longitude: number;
    mediaIds?: string[];
}

export interface AdminCreateTemporaryRentRequest {
    isPlatform?: boolean;
    phoneNumber?: string;
    firstName?: string;
    lastName?: string;
    targetOwnerId?: string;
    cityId: string;
    categoryPath: {
        categoryKey: string;
        subcategoryKey: string;
        attributeSchemaVersion?: number;
    };
    title: string;
    description: string;
    nightlyPrice: number;
    maxGuests: number;
    availabilityWindow: {
        availableFrom: string;
        availableTo: string;
    };
    latitude: number;
    longitude: number;
    attributes?: Record<string, unknown>;
    mediaIds?: string[];
}

