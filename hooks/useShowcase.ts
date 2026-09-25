import { UseQueryResult, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { showcaseService, PaginationParams } from "@/services/showcase.service";
import {
  AgencyAbout,
  CreatePostRequest,
  ExploreParams,
  HostAbout,
  HostApplicationRequest,
  PlatformAbout,
  ShowcaseAbout,
  ShowcaseResponse,
  UpdateHostProfileRequest,
  UpdatePlatformProfileRequest,
} from "@/types/api/showcase.types";
import { toast } from "sonner";

function getErrorMessage(err: Error, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string } | undefined;
    return data?.message || fallback;
  }
  return err.message || fallback;
}

export const SHOWCASE_KEYS = {
  showcase: (type: string, idOrSlug: string) => ['showcase', type, idOrSlug] as const,
  posts: (type: string, idOrSlug: string, params?: PaginationParams) =>
    ['showcase', type, idOrSlug, 'posts', params] as const,
  listings: (type: string, idOrSlug: string, params?: PaginationParams) =>
    ['showcase', type, idOrSlug, 'listings', params] as const,
  explore: (params?: ExploreParams) => ['posts', 'explore', params] as const,
  hostProfile: () => ['hosts', 'my-profile'] as const,
  hostApplication: () => ['hosts', 'my-application'] as const,
  platformProfile: () => ['platform', 'profile'] as const,
};

export function useShowcase(type: 'agency', idOrSlug: string): UseQueryResult<ShowcaseResponse<AgencyAbout>, Error>;
export function useShowcase(type: 'host', idOrSlug: string): UseQueryResult<ShowcaseResponse<HostAbout>, Error>;
export function useShowcase(type: 'platform', idOrSlug: string): UseQueryResult<ShowcaseResponse<PlatformAbout>, Error>;
export function useShowcase<TAbout = ShowcaseAbout>(type: 'agency' | 'host' | 'platform', idOrSlug: string): UseQueryResult<ShowcaseResponse<TAbout>, Error>;
export function useShowcase<TAbout = ShowcaseAbout>(type: 'agency' | 'host' | 'platform', idOrSlug: string) {
  return useQuery({
    queryKey: SHOWCASE_KEYS.showcase(type, idOrSlug),
    queryFn: () => showcaseService.getShowcase<TAbout>(type, idOrSlug),
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
    mutationFn: (data: CreatePostRequest) => showcaseService.createPost(data),
    onSuccess: () => {
      toast.success("پست با موفقیت منتشر شد");
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['showcase'] });
    },
    onError: (err: Error) => {
      toast.error(getErrorMessage(err, "خطا در انتشار پست"));
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
    mutationFn: (data: UpdateHostProfileRequest) => showcaseService.updateMyHostProfile(data),
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
    mutationFn: (data: UpdatePlatformProfileRequest) => showcaseService.updatePlatformProfile(data),
    onSuccess: () => {
      toast.success("تنظیمات پلتفرم با موفقیت ذخیره شد");
      queryClient.invalidateQueries({ queryKey: SHOWCASE_KEYS.platformProfile() });
    },
    onError: () => {
      toast.error("خطا در ذخیره تنظیمات پلتفرم");
    },
  });
}

export function useMyHostApplication() {
  return useQuery({
    queryKey: SHOWCASE_KEYS.hostApplication(),
    queryFn: () => showcaseService.getMyHostApplication(),
  });
}

export function useApplyHost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: HostApplicationRequest) => showcaseService.applyForHost(data),
    onSuccess: () => {
      toast.success("درخواست میزبانی شما با موفقیت ثبت شد");
      queryClient.invalidateQueries({ queryKey: SHOWCASE_KEYS.hostApplication() });
    },
    onError: (err: Error) => {
      toast.error(getErrorMessage(err, "خطا در ثبت درخواست میزبانی"));
    },
  });
}

