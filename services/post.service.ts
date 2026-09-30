import apiClient from "@/lib/api/client";
import {
  CreatePostRequest,
  ExploreParams,
  PostsListResponse,
  ToggleLikeResponse,
  UnifiedPost,
  UpdatePostRequest,
} from "@/types/api/post.types";

export type { PostsListResponse, ToggleLikeResponse };

export const postService = {
  /**
   * Get unified explore feed across all publishers (Platform, Host, Agency)
   */
  async getExplorePosts(params: ExploreParams = {}): Promise<PostsListResponse> {
    const response = await apiClient.get<PostsListResponse>('/posts', { params });
    return response.data;
  },

  /**
   * Get single post by UUID or slug with async view counting
   */
  async getPostByIdOrSlug(idOrSlug: string): Promise<UnifiedPost> {
    const response = await apiClient.get<UnifiedPost>(`/posts/${encodeURIComponent(idOrSlug)}`);
    return response.data;
  },

  /**
   * Get posts liked by the current authenticated user
   */
  async getLikedPosts(params: { page?: number; limit?: number; publisherType?: string } = {}): Promise<PostsListResponse> {
    const response = await apiClient.get<PostsListResponse>('/posts/liked', { params });
    return response.data;
  },

  /**
   * Toggle like on a post (atomic & idempotent)
   */
  async toggleLike(postId: string): Promise<ToggleLikeResponse> {
    const response = await apiClient.post<ToggleLikeResponse>(`/posts/${postId}/like`);
    return response.data;
  },

  /**
   * Create a new post for Platform, Host, or Agency
   */
  async createPost(data: CreatePostRequest): Promise<UnifiedPost> {
    const response = await apiClient.post<UnifiedPost>('/posts', data);
    return response.data;
  },

  /**
   * Update an existing post
   */
  async updatePost(id: string, data: UpdatePostRequest): Promise<UnifiedPost> {
    const response = await apiClient.put<UnifiedPost>(`/posts/${id}`, data);
    return response.data;
  },

  /**
   * Delete a post
   */
  async deletePost(id: string): Promise<{ success: boolean }> {
    const response = await apiClient.delete<{ success: boolean }>(`/posts/${id}`);
    return response.data;
  },
};
