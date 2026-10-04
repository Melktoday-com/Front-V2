import type { MediaReference } from './media.types';

export type PublisherType = 'AGENCY' | 'HOST' | 'PLATFORM';

export interface PostPublisher {
  id: string;
  name: string;
  slug?: string;
  logoUrl?: string;
  isVerified: boolean;
}

export interface UnifiedPost {
  id: string;
  authorUserId: string;
  publisherType: PublisherType;
  publisherId: string;
  title: string;
  slug?: string;
  summary?: string;
  content: string;
  category?: string;
  mediaUrls: string[];
  mediaIds?: MediaReference[];
  isPublished: boolean;
  isFeatured: boolean;
  viewCount: number;
  likeCount: number;
  createdAt: string;
  updatedAt: string;
  hasLiked?: boolean;
  publisher?: PostPublisher;
}

export interface ExploreParams {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  publisherType?: string;
}

export interface CreatePostRequest {
  publisherType: PublisherType;
  publisherId: string;
  title: string;
  slug?: string;
  summary?: string;
  content: string;
  category?: string;
  mediaUrls?: string[];
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
  mediaUrls?: string[];
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
