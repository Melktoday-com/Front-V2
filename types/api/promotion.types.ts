export type PromotionType = 'PIN' | 'LADDER' | 'URGENT_TAG' | 'BANNER';

export interface PromotionPricingRule {
    pricingId: string;
    promotionType: PromotionType;
    pricePerDayRials: string;
    minimumDays: number;
    maximumDays: number;
    version: number;
    isActive: boolean;
}

export interface PromotionPricingResponse {
    rules: PromotionPricingRule[];
}

export interface RequestPromotionRequest {
    listingId: string;
    promotionType: PromotionType;
    durationDays: number;
}

export interface RequestPromotionResponse {
    promotionId: string;
    status: string;
}
