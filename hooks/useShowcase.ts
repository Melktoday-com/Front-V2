import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { showcaseService, PaginationParams } from "@/services/showcase.service";
import { toast } from "sonner";

export const SHOWCASE_KEYS = {
  showcase: (type: string, idOrSlug: string) => ['showcase', type, idOrSlug] as const,
  posts: (type: string, idOrSlug: string, params?: PaginationParams) =>
    ['showcase', type, idOrSlug, 'posts', params] as const,
  listings: (type: string, idOrSlug: string, params?: PaginationParams) =>
    ['showcase', type, idOrSlug, 'listings', params] as const,
  explore: (params?: any) => ['posts', 'explore', params] as const,
  hostProfile: () => ['hosts', 'my-profile'] as const,
  platformProfile: () => ['platform', 'profile'] as const,
};

export function useShowcase(type: 'agency' | 'host' | 'platform', idOrSlug: string) {
  return useQuery({
    queryKey: SHOWCASE_KEYS.showcase(type, idOrSlug),
    queryFn: () => showcaseService.getShowcase(type, idOrSlug),
    enabled: !!idOrSlug,
  });
}

export function useShowcasePosts(type: string, idOrSlug: string, params: PaginationParams = {}) {
  return useQuery({
    queryKey: SHOWCASE_KEYS.posts(type, idOrSlug, params),
    queryFn: () => showcaseService.getShowcasePosts(type, idOrSlug, params),
    enabled: !!idOrSlug,
  });
}

export function useShowcaseListings(type: string, idOrSlug: string, params: PaginationParams = {}) {
  return useQuery({
    queryKey: SHOWCASE_KEYS.listings(type, idOrSlug, params),
    queryFn: () => showcaseService.getShowcaseListings(type, idOrSlug, params),
    enabled: !!idOrSlug,
  });
}

export function useExploreFeed(params: { page?: number; limit?: number; category?: string; search?: string } = {}) {
  return useQuery({
    queryKey: SHOWCASE_KEYS.explore(params),
    queryFn: () => showcaseService.getExplorePosts(params),
  });
}

export function useToggleFollow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ targetType, targetId }: { targetType: string; targetId: string }) =>
      showcaseService.toggleFollow(targetType, targetId),
    onSuccess: (data, vars) => {
      toast.success(data.isFollowing ? "با موفقیت دنبال شد" : "از دنبال‌شوندگان حذف شد");
      queryClient.invalidateQueries({ queryKey: ['showcase', vars.targetType.toLowerCase()] });
    },
    onError: () => {
      toast.error("خطا در تغییر وضعیت دنبال‌کردن");
    },
  });
}

export function useToggleLikePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: string) => showcaseService.toggleLikePost(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['showcase'] });
    },
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => showcaseService.createPost(data),
    onSuccess: () => {
      toast.success("پست با موفقیت منتشر شد");
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['showcase'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "خطا در انتشار پست");
    },
  });
}

export function useHostProfile() {
  return useQuery({
    queryKey: SHOWCASE_KEYS.hostProfile(),
    queryFn: () => showcaseService.getMyHostProfile(),
  });
}

export function useUpdateHostProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => showcaseService.updateMyHostProfile(data),
    onSuccess: () => {
      toast.success("پروفایل میزبان با موفقیت به‌روزرسانی شد");
      queryClient.invalidateQueries({ queryKey: SHOWCASE_KEYS.hostProfile() });
    },
    onError: () => {
      toast.error("خطا در به‌روزرسانی پروفایل میزبان");
    },
  });
}

export function usePlatformProfile() {
  return useQuery({
    queryKey: SHOWCASE_KEYS.platformProfile(),
    queryFn: () => showcaseService.getPlatformProfile(),
  });
}

export function useUpdatePlatformProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => showcaseService.updatePlatformProfile(data),
    onSuccess: () => {
      toast.success("تنظیمات پلتفرم با موفقیت ذخیره شد");
      queryClient.invalidateQueries({ queryKey: SHOWCASE_KEYS.platformProfile() });
    },
    onError: () => {
      toast.error("خطا در ذخیره تنظیمات پلتفرم");
    },
  });
}
