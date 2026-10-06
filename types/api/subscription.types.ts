export type SubscriptionTargetRole = 'landlord' | 'agent';

export type EntitlementTypeName =
    | 'LISTING_PUBLICATION'
    | 'TEMPORARY_RENTAL_PUBLICATION'
    | 'URGENT_PROMOTION'
    | 'LADDER_PROMOTION'
    | 'BADGE';

export interface SubscriptionBadgeMetadata {
    color?: string;
    bgColor?: string;
    borderColor?: string;
    tooltip?: string;
    [key: string]: string | number | boolean | null | undefined;
}

export interface SubscriptionPlan {
    id: string;
    name: string;
    description: string;
    targetRole: SubscriptionTargetRole;
    priceIrr: string;
    durationDays: number;
    publicationQuota: number;
    tempRentQuota: number;
    urgentQuota: number;
    ladderQuota: number;
    badgeName: string | null;
    badgeIcon: string | null;
    badgeIconType: string | null;
    badgeMetadata: SubscriptionBadgeMetadata | null;
    isActive: boolean;
    sortOrder: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface SubscriptionEntitlement {
    id: string;
    userSubscriptionId: string;
    entitlementType: EntitlementTypeName;
    totalQuota: number;
    usedQuota: number;
    remainingQuota: number;
    expiresAt: string;
}

export interface ActiveBadgeInfo {
    badgeName: string;
    badgeIcon: string;
    badgeIconType: string;
    badgeMetadata: SubscriptionBadgeMetadata | null;
    expiresAt: string;
}

export interface PurchasePlanRequest {
    planId: string;
    autoRenew?: boolean;
    idempotencyKey?: string;
}

export interface PurchasePlanResponse {
    subscriptionId: string;
    planId: string;
    planName: string;
    targetRole: string;
    pricePaidIrr: string;
    startedAt: string;
    expiresAt: string;
    transactionId: string;
    entitlements: {
        type: EntitlementTypeName;
        quota: number;
    }[];
}

export interface ClaimWelcomePackageRequest {
    targetRole?: string;
}

export interface ClaimWelcomePackageResponse {
    claimed: boolean;
    message: string;
    type: 'wallet_bonus' | 'subscription';
    details: {
        bonusAmountIrr?: string;
        subscriptionId?: string;
        entitlements?: {
            type: EntitlementTypeName;
            quota: number;
        }[];
    };
}
