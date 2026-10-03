/**
 * Search API Types
 * Canonical contracts matching melktoday-backend-v2 search domain & HTTP DTOs.
 * Strict TypeScript: Zero any/unknown/Record<string, any>.
 */

export enum SearchIndex {
  LISTINGS = 'listings',
  TEMPORARY_RENTALS = 'temporary_rentals',
  PROFILES = 'profiles',
  POSTS = 'posts',
}

export type DynamicNumberMap = { [key: string]: number };
export type DynamicStringMap = { [key: string]: string };
export type DynamicBooleanMap = { [key: string]: boolean };

export interface SearchTaxonomy {
  categoryId: string;
  categoryName?: string;
  subcategoryId?: string;
  subcategoryName?: string;
  businessModelId?: string;
  pathIds: string[];
  publicPathNames: string[];
}

export interface SearchGeo {
  provinceId: number;
  countyId?: number | null;
  districtId?: number | null;
  ruralDistrictId?: number | null;
  cityId?: string | null;
  cityCode: number;
  cityName?: string | null;
  neighbourhoodName?: string | null;
  zoneIds?: string[];
}

export interface SearchGeoCoordinates {
  lat: number;
  lng: number;
}

export interface SearchDynamicAttributes {
  number: DynamicNumberMap;
  string: DynamicStringMap;
  selection: DynamicStringMap;
  boolean: DynamicBooleanMap;
}

export interface SearchDynamicPricing {
  modelId: string;
  currency: string;
  number: DynamicNumberMap;
  string: DynamicStringMap;
  selection: DynamicStringMap;
}

/**
 * Public Search Document for Real-Estate Listings / Advertisements
 */
export interface ListingSearchDocument {
  id: string;
  title: string;
  description: string;
  searchText: string;
  status: string;
  ownerId: string;
  isFeatured: boolean;
  isProSubscriber: boolean;
  proBoostScore: number;
  promotionBoostScore: number;
  taxonomy: SearchTaxonomy;
  geo: SearchGeo;
  _geo?: SearchGeoCoordinates;
  attributes: SearchDynamicAttributes;
  pricing: SearchDynamicPricing;
  mediaIds: string[];
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Public Search Document for Temporary Rental Properties
 */
export interface TemporaryRentalSearchDocument {
  id: string;
  title: string;
  description: string;
  searchText: string;
  status: string;
  ownerId: string;
  taxonomy: SearchTaxonomy;
  geo: SearchGeo;
  _geo?: SearchGeoCoordinates;
  attributes: SearchDynamicAttributes;
  pricing: SearchDynamicPricing;
  mediaIds: string[];
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
}

export type ProfileOwnerType = 'HOST' | 'AGENCY';

/**
 * Public Search Document for Host & Agency Profiles
 */
export interface ProfileSearchDocument {
  id: string;
  ownerType: ProfileOwnerType;
  ownerId: string;
  displayName: string;
  slug: string | null;
  bio: string;
  avatarUrl: string | null;
  coverUrl: string | null;
  rating: number;
  isVerified: boolean;
  isActive: boolean;
  cityId: string | null;
  cityName: string | null;
  searchText: string;
  agencyType: string | null;
  website: string | null;
  instagram: string | null;
  workingHours: string | null;
  createdAt: string;
  updatedAt: string;
}

export type PostOwnerType = 'HOST' | 'AGENCY' | 'PLATFORM';
export type PostContentType = 'SHORT' | 'ARTICLE';

/**
 * Public Search Document for Explore Posts
 */
export interface PostSearchDocument {
  id: string;
  ownerType: PostOwnerType;
  ownerId: string;
  authorUserId: string;
  postType: PostContentType;
  title: string;
  slug: string | null;
  summary: string | null;
  content: string;
  category: string | null;
  mediaUrls: string[];
  isFeatured: boolean;
  isPublished: boolean;
  isArchived: boolean;
  viewCount: number;
  likeCount: number;
  searchText: string;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
}

export type AnySearchDocument =
  | ListingSearchDocument
  | TemporaryRentalSearchDocument
  | ProfileSearchDocument
  | PostSearchDocument;

export interface FacetDistribution {
  [attributeName: string]: {
    [value: string]: number;
  };
}

export interface DomainSearchResult<T> {
  hits: T[];
  total: number;
  page: number;
  limit: number;
  processingTimeMs: number;
  facetDistribution?: FacetDistribution;
}

export interface MultiSearchResultItem<T = AnySearchDocument> {
  index: SearchIndex;
  hits: T[];
  total: number;
}

export interface MultiSearchResult<T = AnySearchDocument> {
  results: MultiSearchResultItem<T>[];
  totalProcessingTimeMs: number;
}

export type SearchSortOption = 'relevance' | 'price_asc' | 'price_desc' | 'newest';

export interface SearchListingsQueryDto {
  query?: string;
  categorySlug?: string;
  categoryKey?: string;
  subcategoryKey?: string;
  cityId?: string;
  cityName?: string;
  neighbourhoodName?: string;
  minPrice?: number;
  maxPrice?: number;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  sort?: SearchSortOption;
  page?: number;
  limit?: number;
}

export interface SearchTemporaryRentalsQueryDto {
  query?: string;
  categoryKey?: string;
  subcategoryKey?: string;
  cityId?: string;
  minPrice?: number;
  maxPrice?: number;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  sort?: SearchSortOption;
  page?: number;
  limit?: number;
}

export interface SearchProfilesQueryDto {
  query?: string;
  ownerType?: ProfileOwnerType;
  cityId?: string;
  isVerified?: boolean;
  page?: number;
  limit?: number;
}

export interface SearchPostsQueryDto {
  query?: string;
  ownerType?: PostOwnerType;
  postType?: PostContentType;
  category?: string;
  page?: number;
  limit?: number;
}

export interface GlobalSearchQueryDto {
  query: string;
  limitPerIndex?: number;
}

export interface SearchSuggestion {
  text: string;
  type: string;
}
