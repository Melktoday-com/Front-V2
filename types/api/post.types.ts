import type { MediaReference } from './media.types';

export enum PublisherType {
  AGENCY = 'AGENCY',
  HOST = 'HOST',
  PLATFORM = 'PLATFORM',
}

export const PUBLISHER_TYPES = {
  AGENCY: PublisherType.AGENCY,
  HOST: PublisherType.HOST,
  PLATFORM: PublisherType.PLATFORM,
} as const;

export interface PostPublisher {
  id: string;
  name: string;
  slug?: string;
  logoUrl?: string;
  avatarUrl?: string;
  isVerified?: boolean;
  type?: PublisherType;
}

export interface UnifiedPost {
  id: string;
  authorUserId: string;
  publisherType: PublisherType;
  publisherId: string;
  agencyId?: string;
  title: string;
  slug?: string;
  summary?: string;
  content: string;
  category?: string;
  mediaIds: MediaReference[];
  isPublished: boolean;
  isFeatured: boolean;
  viewCount: number;
  likeCount: number;
  createdAt: string;
  updatedAt: string;
  hasLiked?: boolean;
  agency?: PostPublisher | null;
  publisher?: PostPublisher | null;
}

export interface ExploreParams {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  publisherType?: PublisherType;
}

export interface CreatePostRequest {
  publisherType: PublisherType;
  publisherId: string;
  title: string;
  slug?: string;
  summary?: string;
  content: string;
  category?: string;
  mediaIds?: MediaReference[];
  isPublished?: boolean;
  isFeatured?: boolean;
}

export interface UpdatePostRequest {
  title?: string;
  slug?: string;
  summary?: string;
  content?: string;
  category?: string;
  mediaIds?: MediaReference[];
  isPublished?: boolean;
  isFeatured?: boolean;
}

export interface PostsListResponse {
  items: UnifiedPost[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ToggleLikeResponse {
  liked: boolean;
  likeCount: number;
}
