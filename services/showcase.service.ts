import apiClient from "@/lib/api/client";
import { ShowcaseResponse, UnifiedPost } from "@/types/api/showcase.types";

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export const showcaseService = {
  /**
   * Get composite showcase (header + about) for Agency, Host, or Platform
   */
  async getShowcase<TAbout = any>(type: 'agency' | 'host' | 'platform', idOrSlug: string): Promise<ShowcaseResponse<TAbout>> {
    const response = await apiClient.get<ShowcaseResponse<TAbout>>(`/showcase/${type}/${idOrSlug}`);
    return response.data;
  },

  /**
   * Get posts of a showcase publisher
   */
  async getShowcasePosts(type: string, idOrSlug: string, params: PaginationParams = {}) {
    const response = await apiClient.get<{
      items: UnifiedPost[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(`/showcase/${type}/${idOrSlug}/posts`, { params });
    return response.data;
  },

  /**
   * Get domain listings of a showcase publisher
   */
  async getShowcaseListings(type: string, idOrSlug: string, params: PaginationParams = {}) {
    const response = await apiClient.get<{
      listingsType: string;
      items: any[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(`/showcase/${type}/${idOrSlug}/listings`, { params });
    return response.data;
  },

  /**
   * Get unified explore feed across all publishers
   */
  async getExplorePosts(params: { page?: number; limit?: number; category?: string; search?: string } = {}) {
    const response = await apiClient.get<{
      items: UnifiedPost[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>('/posts', { params });
    return response.data;
  },

  /**
   * Toggle like on post (atomic & idempotent)
   */
  async toggleLikePost(postId: string) {
    const response = await apiClient.post<{ liked: boolean; likeCount: number }>(`/posts/${postId}/like`);
    return response.data;
  },

  /**
   * Toggle follow on target entity
   */
  async toggleFollow(targetType: string, targetId: string) {
    const response = await apiClient.post<{ isFollowing: boolean; followersCount: number }>(
      `/follows/${targetType}/${targetId}/toggle`
    );
    return response.data;
  },

  /**
   * Create post for any publisher
   */
  async createPost(data: {
    publisherType: 'AGENCY' | 'HOST' | 'PLATFORM';
    publisherId: string;
    title: string;
    slug?: string;
    summary?: string;
    content: string;
    category?: string;
    mediaUrls?: string[];
  }) {
    const response = await apiClient.post<UnifiedPost>('/posts', data);
    return response.data;
  },

  /**
   * Update post
   */
  async updatePost(id: string, data: any) {
    const response = await apiClient.put<UnifiedPost>(`/posts/${id}`, data);
    return response.data;
  },

  /**
   * Delete post
   */
  async deletePost(id: string) {
    const response = await apiClient.delete<{ success: boolean }>(`/posts/${id}`);
    return response.data;
  },

  /**
   * Host (Landlord) own profile management (Zero social media)
   */
  async getMyHostProfile() {
    const response = await apiClient.get('/hosts/my-profile');
    return response.data;
  },

  async updateMyHostProfile(data: {
    hostName?: string;
    slug?: string;
    bio?: string;
    cityId?: string;
    avatarUrl?: string;
    coverUrl?: string;
    address?: string;
    phone?: string;
    mobile?: string;
  }) {
    const response = await apiClient.put('/hosts/my-profile', data);
    return response.data;
  },

  /**
   * Platform profile & admin management
   */
  async getPlatformProfile() {
    const response = await apiClient.get('/platform/profile');
    return response.data;
  },

  async updatePlatformProfile(data: any) {
    const response = await apiClient.put('/platform/admin/profile', data);
    return response.data;
  },
};
