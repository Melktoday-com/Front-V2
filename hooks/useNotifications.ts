import { notificationService } from "@/services/notification.service";
import { ListNotificationsParams } from "@/types/api/notification.types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
