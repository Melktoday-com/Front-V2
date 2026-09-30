import { notificationService } from "@/services/notification.service";
import { ListNotificationsParams } from "@/types/api/notification.types";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./useAuth";

export function useNotifications(params?: ListNotificationsParams) {
    const { isLoggedIn } = useAuth();

    return useQuery({
        queryKey: ["notifications", params],
        queryFn: () => notificationService.list(params),
        enabled: isLoggedIn,
        refetchInterval: 15000,
    });
}

export function useInfiniteNotifications(params?: Omit<ListNotificationsParams, "page">) {
    const { isLoggedIn } = useAuth();
    const limit = params?.limit ?? 15;

    return useInfiniteQuery({
        queryKey: ["notifications", "infinite", params],
        queryFn: async ({ pageParam = 1 }) => {
            return notificationService.list({
                onlyUnread: params?.onlyUnread,
                page: pageParam as number,
                limit,
            });
        },
        initialPageParam: 1,
        getNextPageParam: (lastPage, allPages) => {
            const totalLoaded = allPages.flatMap((p) => p.items).length;
            if (totalLoaded < lastPage.total) {
                return allPages.length + 1;
            }
            return undefined;
        },
        enabled: isLoggedIn,
        refetchInterval: 15000,
    });
}

export function useUnreadNotificationsCount() {
    const { isLoggedIn } = useAuth();

    return useQuery({
        queryKey: ["notifications", "unread-count"],
        queryFn: async () => {
            const res = await notificationService.list({ onlyUnread: true, limit: 1 });
            return res.unreadCount;
        },
        enabled: isLoggedIn,
        refetchInterval: 15000,
    });
}

export function useMarkNotificationAsRead() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => notificationService.markAsRead(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
        },
    });
}

export function useMarkAllNotificationsAsRead() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => notificationService.markAllAsRead(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
        },
    });
}
