import { searchService } from "@/services/search.service";
import {
  DomainSearchResult,
  GlobalSearchQueryDto,
  ListingSearchDocument,
  SearchListingsQueryDto,
  SearchPostsQueryDto,
  SearchProfilesQueryDto,
  SearchTemporaryRentalsQueryDto,
  TemporaryRentalSearchDocument,
} from "@/types/api/search.types";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

export function useSearchSuggestions(query: string) {
  return useQuery({
    queryKey: ["search-suggestions", query],
    queryFn: () => searchService.getSuggestions(query),
    enabled: query.trim().length >= 2,
    staleTime: 60000, // 1 minute
  });
}

export function useGlobalSearch(query: string, limitPerIndex: number = 5, enabled: boolean = true) {
  return useQuery({
    queryKey: ["search-global", query, limitPerIndex],
    queryFn: () => searchService.globalSearch({ query, limitPerIndex }),
    enabled: enabled && query.trim().length >= 2,
    staleTime: 30000,
  });
}

export function useSearchListings(params: SearchListingsQueryDto, enabled: boolean = true) {
  return useQuery({
    queryKey: ["search-listings", params],
    queryFn: () => searchService.searchListings(params),
    enabled,
    staleTime: 30000,
  });
}

export function useSearchTemporaryRentals(params: SearchTemporaryRentalsQueryDto, enabled: boolean = true) {
  return useQuery({
    queryKey: ["search-temporary-rentals", params],
    queryFn: () => searchService.searchTemporaryRentals(params),
    enabled,
    staleTime: 30000,
  });
}

export function useSearchProfiles(params: SearchProfilesQueryDto, enabled: boolean = true) {
  return useQuery({
    queryKey: ["search-profiles", params],
    queryFn: () => searchService.searchProfiles(params),
    enabled,
    staleTime: 30000,
  });
}

export function useSearchPosts(params: SearchPostsQueryDto, enabled: boolean = true) {
  return useQuery({
    queryKey: ["search-posts", params],
    queryFn: () => searchService.searchPosts(params),
    enabled,
    staleTime: 30000,
  });
}

export function useCities() {
  return useQuery({
    queryKey: ["geo-cities"],
    queryFn: () => searchService.getCities(),
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

export function useNeighborhoods(city?: string) {
  return useQuery({
    queryKey: ["geo-neighborhoods", city],
    queryFn: () => searchService.getNeighborhoods(city!),
    enabled: !!city,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

export function useInfiniteSearchListings(
  query: SearchListingsQueryDto,
  options: { startPage?: number; maxPages?: number; enabled?: boolean } = {}
) {
  const startPage = options.startPage ?? 1;
  const maxPages = options.maxPages ?? 7;

  return useInfiniteQuery({
    queryKey: ["search-listings-infinite", query, startPage],
    queryFn: async ({ pageParam = startPage }) => {
      return await searchService.searchListings({
        ...query,
        page: pageParam as number,
        limit: query.limit ?? 20,
      });
    },
    initialPageParam: startPage,
    getNextPageParam: (lastPage: DomainSearchResult<ListingSearchDocument>, allPages) => {
      if (allPages.length >= maxPages) {
        return undefined;
      }
      const totalPages = Math.ceil(lastPage.total / lastPage.limit);
      if (lastPage.page < totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    enabled: options.enabled ?? true,
    staleTime: 30000,
  });
}

export function useInfiniteSearchTemporaryRentals(
  query: SearchTemporaryRentalsQueryDto,
  options: { startPage?: number; maxPages?: number; enabled?: boolean } = {}
) {
  const startPage = options.startPage ?? 1;
  const maxPages = options.maxPages ?? 7;

  return useInfiniteQuery({
    queryKey: ["search-temporary-rentals-infinite", query, startPage],
    queryFn: async ({ pageParam = startPage }) => {
      return await searchService.searchTemporaryRentals({
        ...query,
        page: pageParam as number,
        limit: query.limit ?? 20,
      });
    },
    initialPageParam: startPage,
    getNextPageParam: (lastPage: DomainSearchResult<TemporaryRentalSearchDocument>, allPages) => {
      if (allPages.length >= maxPages) {
        return undefined;
      }
      const totalPages = Math.ceil(lastPage.total / lastPage.limit);
      if (lastPage.page < totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    enabled: options.enabled ?? true,
    staleTime: 30000,
  });
}

