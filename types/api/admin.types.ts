import { AdStatus, PromotionStatus, ReportStatus, ReportTargetType, UserStatus } from "./enums";

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
