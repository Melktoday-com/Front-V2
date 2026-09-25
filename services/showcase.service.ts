import apiClient from "@/lib/api/client";
import axios from "axios";
import {
  AgencyAbout,
  CreatePostRequest,
  HostAbout,
  HostApplicationRequest,
  HostApplicationResponse,
  PlatformAbout,
  ShowcaseAbout,
  ShowcaseListingItem,
  ShowcaseListingsResponse,
  ShowcaseResponse,
  UnifiedPost,
  UpdateHostProfileRequest,
  UpdatePlatformProfileRequest,
  UpdatePostRequest,
} from "@/types/api/showcase.types";

export interface PaginationParams {
  page?: number;
  limit?: number;
}

async function getShowcase(type: 'agency', idOrSlug: string): Promise<ShowcaseResponse<AgencyAbout>>;
async function getShowcase(type: 'host', idOrSlug: string): Promise<ShowcaseResponse<HostAbout>>;
async function getShowcase(type: 'platform', idOrSlug: string): Promise<ShowcaseResponse<PlatformAbout>>;
async function getShowcase<TAbout = ShowcaseAbout>(type: 'agency' | 'host' | 'platform', idOrSlug: string): Promise<ShowcaseResponse<TAbout>>;
async function getShowcase<TAbout = ShowcaseAbout>(type: 'agency' | 'host' | 'platform', idOrSlug: string): Promise<ShowcaseResponse<TAbout>> {
  const response = await apiClient.get<ShowcaseResponse<TAbout>>(`/showcase/${type}/${idOrSlug}`);
  return response.data;
}

export const showcaseService = {
  getShowcase,

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
  async getShowcaseListings(type: string, idOrSlug: string, params: PaginationParams = {}): Promise<ShowcaseListingsResponse> {
    const response = await apiClient.get<ShowcaseListingsResponse>(`/showcase/${type}/${idOrSlug}/listings`, { params });
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
  async createPost(data: CreatePostRequest): Promise<UnifiedPost> {
    const response = await apiClient.post<UnifiedPost>('/posts', data);
    return response.data;
  },

  /**
   * Update post
   */
  async updatePost(id: string, data: UpdatePostRequest): Promise<UnifiedPost> {
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
   * Host (Landlord) application & own profile management (Zero social media)
   */
  async applyForHost(data: HostApplicationRequest): Promise<HostApplicationResponse> {
    const response = await apiClient.post<HostApplicationResponse>('/hosts/apply', data);
    return response.data;
  },

  async getMyHostApplication(): Promise<HostApplicationResponse | null> {
    try {
      const response = await apiClient.get<HostApplicationResponse>('/hosts/my-application');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  async getMyHostProfile() {
    const response = await apiClient.get('/hosts/my-profile');
    return response.data;
  },

  async updateMyHostProfile(data: UpdateHostProfileRequest) {
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

  async updatePlatformProfile(data: UpdatePlatformProfileRequest) {
    const response = await apiClient.put('/platform/admin/profile', data);
    return response.data;
  },
};
