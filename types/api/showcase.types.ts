import {
  PublisherType,
  UnifiedPost,
  ExploreParams,
  CreatePostRequest,
  UpdatePostRequest,
  PostPublisher,
  PostsListResponse,
  ToggleLikeResponse,
} from './post.types';
import type { MediaReference } from './media.types';
import type { JsonValue } from '../common';
import type { AdSummary, AdPricingReadModel } from './ads.types';
import type { TemporaryRentAd, TemporaryRentPricingReadModel } from './temporary-rent.types';

export type {
  PublisherType,
  UnifiedPost,
  ExploreParams,
  CreatePostRequest,
  UpdatePostRequest,
  PostPublisher,
  PostsListResponse,
  ToggleLikeResponse,
};
export type TargetType = 'AGENCY' | 'HOST' | 'PLATFORM';

export interface ShowcaseHeader {
  id: string;
  type: TargetType;
  title: string;
  slug?: string;
  avatarUrl?: string;
  coverUrl?: string;
  rating?: number;
  cityId?: string;
  cityName?: string;
  isVerified: boolean;
  followersCount: number;
  isFollowing?: boolean;
  postsCount: number;
  listingsCount: number;
  userId?: string;
}

export interface HostAbout {
  bio: string;
  address?: string;
  phone?: string;
  mobile?: string;
  rating?: number;
}

export interface HostProfile {
  id: string;
  userId: string;
  hostName: string;
  title?: string;
  slug?: string;
  bio?: string;
  cityId?: string;
  avatarUrl?: string;
  coverUrl?: string;
  rating?: number;
  address?: string;
  phone?: string;
  mobile?: string;
  verificationStatus?: 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED';
  isVerified?: boolean;
  isActive?: boolean;
  status?: 'ACTIVE' | 'SUSPENDED' | 'BLOCKED';
  header?: ShowcaseHeader;
}

export interface PlatformAbout {
  title: string;
  subtitle: string;
  description: string;
  phone?: string;
  email?: string;
  address?: string;
  socialMedia: {
    website?: string;
    instagram?: string;
    telegram?: string;
    whatsapp?: string;
    youtube?: string;
    aparat?: string;
  };
}

export interface AgencyAbout {
  bio: string;
  licenseNumber?: string;
  guildCode?: string;
  address?: string;
  workingHours?: string;
  phone?: string;
  mobile?: string;
  rating?: number;
  socialMedia: {
    website?: string;
    instagram?: string;
    telegram?: string;
    whatsapp?: string;
  };
}

export type ShowcaseAbout = AgencyAbout | HostAbout | PlatformAbout;

export interface ShowcaseResponse<TAbout = ShowcaseAbout> {
  header: ShowcaseHeader;
  about: TAbout;
}

/**
 * Standard Showcase Ad listing item (AGENCY and PLATFORM).
 * Inherits directly from the canonical `AdSummary` interface from `ads.types`.
 */
export type ShowcaseAdListingItem = AdSummary & {
  /** Standard ID alias: id is identical to adId */
  id: string;
};

/**
 * Standard Showcase Temporary Rent listing item (HOST).
 * Inherits directly from canonical `TemporaryRentAd` interface from `temporary-rent.types`.
 */
export type ShowcaseTemporaryRentListingItem = TemporaryRentAd & {
  /** Optional compatibility alias for components expecting adId */
  adId?: string;
};

/**
 * Discriminated or composite listing item for showcase responses.
 */
export type ShowcaseListingItem =
  | ShowcaseAdListingItem
  | ShowcaseTemporaryRentListingItem;

export interface ShowcaseListingsResponse<T = ShowcaseListingItem> {
  listingsType: 'REAL_ESTATE' | 'TEMPORARY_RENT' | 'FEATURED' | string;
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UpdateHostProfileRequest {
  hostName?: string;
  slug?: string;
  bio?: string;
  cityId?: string;
  avatarUrl?: string;
  coverUrl?: string;
  address?: string;
  phone?: string;
  mobile?: string;
}

export interface UpdatePlatformProfileRequest {
  title?: string;
  subtitle?: string;
  description?: string;
  logoUrl?: string;
  avatarUrl?: string;
  coverUrl?: string;
  phone?: string;
  email?: string;
  address?: string;
  website?: string;
  instagram?: string;
  telegram?: string;
  whatsapp?: string;
  youtube?: string;
  aparat?: string;
}

export type HostApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface HostApplicationRequest {
  fullName: string;
  nationalCode: string;
  hostName: string;
  cityId: string;
  mobileNumber: string;
  phone?: string;
  address?: string;
  propertyCount?: number;
  description?: string;
}

export interface HostApplicationResponse {
  id: string;
  userId: string;
  fullName: string;
  nationalCode: string;
  hostName: string;
  cityId?: string;
  mobileNumber: string;
  phone?: string;
  address?: string;
  propertyCount: number;
  description?: string;
  status: HostApplicationStatus;
  kycStatus: 'NOT_CHECKED' | 'VERIFIED' | 'FAILED' | 'PENDING';
  rejectionReason?: string;
  adminNote?: string;
  reviewedAt?: string;
  createdAt: string;
}
