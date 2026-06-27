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
    audience: {
        roles?: string[];
        cities?: string[];
        lastActiveDays?: number;
    };
}

export interface AdminActionResponse {
    success: boolean;
    message?: string;
    transactionId?: string;
}

export interface GeoZone {
    id: string;
    name: string;
    zoneType: 'PROVINCE' | 'CITY' | 'DISTRICT' | 'NEIGHBORHOOD';
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
    status: string;
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
    status: 'DRAFT' | 'PENDING_APPROVAL' | 'PUBLISHED' | 'ARCHIVED' | 'REJECTED';
    price: number;
    ownerName: string;
    createdAt: string;
    thumbnail?: string;
}

export interface AdminReport {
    id: string;
    reportedBy: string;
    targetType: string;
    targetId: string;
    reason: string;
    status: 'PENDING' | 'RESOLVED' | 'DISMISSED';
    note?: string;
    createdAt: string;
}
