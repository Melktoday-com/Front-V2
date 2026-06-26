import { JsonObject } from "../common";
import { AdSummary } from "./ads.types";

export interface SearchListingsQuery {
    text?: string;
    categoryKey?: string;
    subcategoryKey?: string;
    cityId?: string;
    neighborhoodId?: string;
    minPrice?: number;
    maxPrice?: number;
    attributes?: JsonObject;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
}

export interface SearchResponse {
    items: AdSummary[];
    total: number;
    facets?: JsonObject;
}
