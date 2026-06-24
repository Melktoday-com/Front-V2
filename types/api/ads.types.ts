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
    status: string;
    title: string;
    categoryPath: CategoryPath;
    pricing: Record<string, number>;
    isFeatured: boolean;
    mediaIds?: string[];
    createdAt: string;
}

export interface ListAdsQuery {
    status?: string;
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

export interface CategoryListItem {
    id: string;
    key: string;
    displayName: string;
    icon?: string;
    slug?: string;
    subcategories: Array<{
        key: string;
        displayName: string;
    }>;
}
