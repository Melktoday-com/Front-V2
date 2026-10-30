import apiClient from "@/lib/api/client";
import {
  CreatePostRequest,
  ExploreParams,
  PUBLISHER_TYPES,
  type PublisherType,
  PostsListResponse,
  ToggleLikeResponse,
  UnifiedPost,
  UpdatePostRequest,
} from "@/types/api/post.types";

export { PUBLISHER_TYPES };
export type { PostsListResponse, ToggleLikeResponse, PublisherType };

/**
 * Post Port (Outbound Contract for UI and Hooks)
 *
 * In Frontend Clean/Hexagonal Architecture, components and hooks depend
 * on this contract rather than a concrete HTTP client implementation.
 */
export interface IPostPort {
  getExplorePosts(params?: ExploreParams): Promise<PostsListResponse>;
  getPublisherPosts(
    type: 'agency' | 'host' | 'platform' | 'AGENCY' | 'HOST' | 'PLATFORM',
    idOrSlug: string,
    params?: { page?: number; limit?: number },
  ): Promise<PostsListResponse>;
  getAgencyPosts(
    agencyIdOrSlug: string,
    params?: { page?: number; limit?: number },
  ): Promise<PostsListResponse>;
  getPostByIdOrSlug(idOrSlug: string): Promise<UnifiedPost>;
  getLikedPosts(params?: {
    page?: number;
    limit?: number;
    publisherType?: PublisherType;
  }): Promise<PostsListResponse>;
  toggleLike(postId: string): Promise<ToggleLikeResponse>;
  createPost(data: CreatePostRequest): Promise<UnifiedPost>;
  updatePost(id: string, data: UpdatePostRequest): Promise<UnifiedPost>;
  deletePost(id: string): Promise<{ success: boolean }>;
  listAdminPosts(params?: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
    publisherType?: PublisherType;
    publisherId?: string;
    isPublished?: boolean;
  }): Promise<PostsListResponse>;
}

/**
 * HTTP Adapter implementing IPostPort
 */
export class HttpPostAdapter implements IPostPort {
  /**
   * Get unified explore feed across all publishers (Platform, Host, Agency)
   */
  async getExplorePosts(params: ExploreParams = {}): Promise<PostsListResponse> {
    const response = await apiClient.get<PostsListResponse>('/posts', { params });
    return response.data;
  }

  /**
   * Get published posts of a specific publisher (Agency, Host, or Platform)
   */
  async getPublisherPosts(
    type: 'agency' | 'host' | 'platform' | 'AGENCY' | 'HOST' | 'PLATFORM',
    idOrSlug: string,
    params: { page?: number; limit?: number } = {},
  ): Promise<PostsListResponse> {
    const normalizedType = type.toLowerCase();
    const response = await apiClient.get<PostsListResponse>(
      `/showcase/${normalizedType}/${encodeURIComponent(idOrSlug)}/posts`,
      { params },
    );
    return response.data;
  }

  /**
   * Get posts of a specific agency showcase (compatible with /agencies/showcase/:id/posts)
   */
  async getAgencyPosts(
    agencyIdOrSlug: string,
    params: { page?: number; limit?: number } = {},
  ): Promise<PostsListResponse> {
    const response = await apiClient.get<PostsListResponse>(
      `/agencies/showcase/${encodeURIComponent(agencyIdOrSlug)}/posts`,
      { params },
    );
    return response.data;
  }

  /**
   * Admin list all posts across all publishers and statuses (published & drafts)
   * Requires posts.view permission
   */
  async listAdminPosts(
    params: {
      page?: number;
      limit?: number;
      category?: string;
      search?: string;
      publisherType?: PublisherType;
      publisherId?: string;
      isPublished?: boolean;
    } = {},
  ): Promise<PostsListResponse> {
    const response = await apiClient.get<PostsListResponse>('/posts/admin/all', {
      params,
    });
    return response.data;
  }

  /**
   * Get single post by UUID or slug with async view counting
   */
  async getPostByIdOrSlug(idOrSlug: string): Promise<UnifiedPost> {
    const response = await apiClient.get<UnifiedPost>(
      `/posts/${encodeURIComponent(idOrSlug)}`,
    );
    return response.data;
  }

  /**
   * Get posts liked by the current authenticated user
   */
  async getLikedPosts(
    params: { page?: number; limit?: number; publisherType?: PublisherType } = {},
  ): Promise<PostsListResponse> {
    const response = await apiClient.get<PostsListResponse>('/posts/liked', {
      params,
    });
    return response.data;
  }

  /**
   * Toggle like on a post (atomic & idempotent)
   */
  async toggleLike(postId: string): Promise<ToggleLikeResponse> {
    const response = await apiClient.post<ToggleLikeResponse>(
      `/posts/${postId}/like`,
    );
    return response.data;
  }

  /**
   * Create a new post for Platform, Host, or Agency
   */
  async createPost(data: CreatePostRequest): Promise<UnifiedPost> {
    const response = await apiClient.post<UnifiedPost>('/posts', data);
    return response.data;
  }

  /**
   * Update an existing post
   */
  async updatePost(id: string, data: UpdatePostRequest): Promise<UnifiedPost> {
    const response = await apiClient.put<UnifiedPost>(`/posts/${id}`, data);
    return response.data;
  }

  /**
   * Delete a post
   */
  async deletePost(id: string): Promise<{ success: boolean }> {
    const response = await apiClient.delete<{ success: boolean }>(`/posts/${id}`);
    return response.data;
  }
}

/**
 * Singleton instance of the Post port adapter
 */
export const postService: IPostPort = new HttpPostAdapter();
