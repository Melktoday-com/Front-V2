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

export interface ShowcaseListingItem {
  id: string;
  title: string;
  price?: number;
  totalPrice?: number;
  basePricePerNight?: number;
  address?: string;
  mediaIds?: MediaReference[];
  createdAt?: string;
}

export interface ShowcaseListingsResponse {
  listingsType: string;
  items: ShowcaseListingItem[];
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
