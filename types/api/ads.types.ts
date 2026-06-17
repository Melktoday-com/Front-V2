export interface CategoryPath {
    categoryKey: string;
    subcategoryKey: string;
    businessModelKey: string;
    attributeSchemaVersion: number;
}

export interface AdSummary {
    adId: string;
    ownerId: string;
    status: string;
    title: string;
    categoryPath: CategoryPath;
    pricing: Record<string, number>;
    mediaIds: string[];
    createdAt: string;
}

export interface ListAdsQuery {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
}

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
}

export type PaginatedAdsResponse = PaginatedResponse<AdSummary>;

export interface AdDetail extends AdSummary {
    description: string;
    attributes: Record<string, any>;
    updatedAt: string;
}

export interface AdContactInfo {
    adId: string;
    ownerId: string;
    mobileNumber: string;
    email?: string;
}
