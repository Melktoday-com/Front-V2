import apiClient from "@/lib/api/client";
import {
    ListNotificationsParams,
    ListUserNotificationsResponse,
} from "@/types/api/notification.types";

export const notificationService = {
    /**
     * Get paginated in-app notifications for the authenticated user
     */
    async list(params?: ListNotificationsParams): Promise<ListUserNotificationsResponse> {
        const queryParams: Record<string, string | number> = {};
        if (params?.onlyUnread !== undefined) {
            queryParams.onlyUnread = params.onlyUnread ? "true" : "false";
        }
        if (params?.page !== undefined) {
            queryParams.page = params.page;
        }
        if (params?.limit !== undefined) {
            queryParams.limit = params.limit;
        }

        const response = await apiClient.get<ListUserNotificationsResponse>("/notifications", {
            params: queryParams,
        });
        return response.data;
    },

    /**
     * Mark a single notification as read (idempotent, 204 No Content)
     */
    async markAsRead(id: string): Promise<void> {
        await apiClient.patch(`/notifications/${id}/read`);
    },
};
