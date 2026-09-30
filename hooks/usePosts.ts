import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { postService } from "@/services/post.service";
import {
  CreatePostRequest,
  ExploreParams,
  PostsListResponse,
  ToggleLikeResponse,
  UnifiedPost,
  UpdatePostRequest,
} from "@/types/api/post.types";

export const POSTS_QUERY_KEYS = {
  all: ['posts'] as const,
  explore: (params?: ExploreParams) => ['posts', 'explore', params] as const,
  exploreInfinite: (params?: ExploreParams, startPage?: number) => ['posts', 'explore-infinite', params, startPage] as const,
  single: (idOrSlug: string) => ['posts', 'single', idOrSlug] as const,
  liked: (params?: { page?: number; limit?: number; publisherType?: string }) => ['posts', 'liked', params] as const,
};

/**
 * Hook to fetch paginated explore posts feed across all publishers (Platform, Host, Agency)
 */
export const useExplorePosts = (params: ExploreParams = {}) => {
  return useQuery({
    queryKey: POSTS_QUERY_KEYS.explore(params),
    queryFn: () => postService.getExplorePosts(params),
  });
};

/**
 * Hook to fetch infinite scrolling explore posts feed
 */
export const useInfiniteExplorePosts = (
  params: ExploreParams = {},
  options: { startPage?: number; maxPages?: number } = {}
) => {
  const startPage = options.startPage ?? 1;
  const maxPages = options.maxPages ?? 7;

  return useInfiniteQuery({
    queryKey: POSTS_QUERY_KEYS.exploreInfinite(params, startPage),
    queryFn: async ({ pageParam = startPage }) => {
      return await postService.getExplorePosts({
        ...params,
        page: pageParam as number,
        limit: params.limit ?? 12,
      });
    },
    initialPageParam: startPage,
    getNextPageParam: (lastPage, allPages) => {
      if (allPages.length >= maxPages) {
        return undefined;
      }
      const totalPages = lastPage.totalPages || Math.ceil((lastPage.total || 0) / (lastPage.limit || 12));
      if (lastPage.page < totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
  });
};

/**
 * Hook to fetch single post by UUID or slug
 */
export const useSinglePost = (idOrSlug: string, enabled = true) => {
  return useQuery({
    queryKey: POSTS_QUERY_KEYS.single(idOrSlug),
    queryFn: () => postService.getPostByIdOrSlug(idOrSlug),
    enabled: !!idOrSlug && enabled,
  });
};

/**
 * Hook to fetch posts liked by current user
 */
export const useLikedPosts = (params: { page?: number; limit?: number; publisherType?: string } = {}) => {
  return useQuery({
    queryKey: POSTS_QUERY_KEYS.liked(params),
    queryFn: () => postService.getLikedPosts(params),
  });
};

/**
 * Hook to toggle like on a post with atomic cache updates
 */
export const useLikePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: string) => postService.toggleLike(postId),
    onSuccess: (res: ToggleLikeResponse, postId: string) => {
      // Invalidate all related post and favorites queries
      queryClient.invalidateQueries({ queryKey: POSTS_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['explore-posts'] });
      queryClient.invalidateQueries({ queryKey: ['explore-posts-infinite'] });
      queryClient.invalidateQueries({ queryKey: ['liked-posts'] });
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });
};

/**
 * Hook to create a new post for Platform, Host, or Agency
 */
export const useCreatePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePostRequest) => postService.createPost(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: POSTS_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['explore-posts'] });
      queryClient.invalidateQueries({ queryKey: ['explore-posts-infinite'] });
      queryClient.invalidateQueries({ queryKey: ['showcase'] });
    },
  });
};

/**
 * Hook to update an existing post
 */
export const useUpdatePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePostRequest }) =>
      postService.updatePost(id, data),
    onSuccess: (_res: UnifiedPost, variables: { id: string; data: UpdatePostRequest }) => {
      queryClient.invalidateQueries({ queryKey: POSTS_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: POSTS_QUERY_KEYS.single(variables.id) });
      queryClient.invalidateQueries({ queryKey: ['explore-posts'] });
      queryClient.invalidateQueries({ queryKey: ['explore-posts-infinite'] });
      queryClient.invalidateQueries({ queryKey: ['showcase'] });
    },
  });
};

/**
 * Hook to delete a post
 */
export const useDeletePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => postService.deletePost(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: POSTS_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['explore-posts'] });
      queryClient.invalidateQueries({ queryKey: ['explore-posts-infinite'] });
      queryClient.invalidateQueries({ queryKey: ['showcase'] });
    },
  });
};
