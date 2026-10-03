import apiClient from "@/lib/api/client";
import {
  AnySearchDocument,
  DomainSearchResult,
  GlobalSearchQueryDto,
  ListingSearchDocument,
  MultiSearchResult,
  PostSearchDocument,
  ProfileSearchDocument,
  SearchListingsQueryDto,
  SearchPostsQueryDto,
  SearchProfilesQueryDto,
  SearchSuggestion,
  SearchTemporaryRentalsQueryDto,
  TemporaryRentalSearchDocument,
} from "@/types/api/search.types";

export const searchService = {
  /**
   * Search real-estate property listings / advertisements
   */
  async searchListings(query: SearchListingsQueryDto): Promise<DomainSearchResult<ListingSearchDocument>> {
    const response = await apiClient.get<DomainSearchResult<ListingSearchDocument>>("/search/listings", {
      params: query,
    });
    return response.data;
  },

  /**
   * Search short-term / temporary rental properties
   */
  async searchTemporaryRentals(
    query: SearchTemporaryRentalsQueryDto
  ): Promise<DomainSearchResult<TemporaryRentalSearchDocument>> {
    const response = await apiClient.get<DomainSearchResult<TemporaryRentalSearchDocument>>(
      "/search/temporary-rentals",
      {
        params: query,
      }
    );
    return response.data;
  },

  /**
   * Search host and agency profiles
   */
  async searchProfiles(query: SearchProfilesQueryDto): Promise<DomainSearchResult<ProfileSearchDocument>> {
    const response = await apiClient.get<DomainSearchResult<ProfileSearchDocument>>("/search/profiles", {
      params: query,
    });
    return response.data;
  },

  /**
   * Search explore posts (articles & short posts)
   */
  async searchPosts(query: SearchPostsQueryDto): Promise<DomainSearchResult<PostSearchDocument>> {
    const response = await apiClient.get<DomainSearchResult<PostSearchDocument>>("/search/posts", {
      params: query,
    });
    return response.data;
  },

  /**
   * Federated multi-index global search across listings, rentals, profiles, and posts
   */
  async globalSearch(query: GlobalSearchQueryDto): Promise<MultiSearchResult<AnySearchDocument>> {
    const response = await apiClient.get<MultiSearchResult<AnySearchDocument>>("/search/global", {
      params: query,
    });
    return response.data;
  },

  /**
   * Search suggestions / autocomplete
   */
  async getSuggestions(q: string): Promise<SearchSuggestion[]> {
    if (!q || q.trim().length < 2) return [];
    const response = await apiClient.get<SearchSuggestion[]>("/search/suggestions", {
      params: { q: q.trim() },
    });
    return Array.isArray(response.data) ? response.data : [];
  },

  /**
   * Indexed cities in search
   */
  async getCities(): Promise<string[]> {
    const response = await apiClient.get<string[]>("/search/cities");
    return Array.isArray(response.data) ? response.data : [];
  },

  /**
   * Neighborhoods in search for a city
   */
  async getNeighborhoods(city: string): Promise<string[]> {
    const response = await apiClient.get<string[]>("/search/neighborhoods", {
      params: { city },
    });
    return Array.isArray(response.data) ? response.data : [];
  },
};
