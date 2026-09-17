export type NotificationType =
    | 'LISTING_APPROVED'
    | 'LISTING_REJECTED'
    | 'CAMPAIGN_APPROVED'
    | 'CAMPAIGN_REJECTED'
    | 'CAMPAIGN_ACTIVATED'
    | 'NEW_MESSAGE'
    | 'ROLE_APPROVED'
    | 'ROLE_REJECTED'
    | 'ADMIN_BROADCAST'
    | 'CREDIT_RECEIVED'
    | 'REPORT_RESOLVED';

export interface NotificationSummary {
    id: string;
    type: NotificationType;
    title: string;
    body: string;
    referenceId?: string;
    isRead: boolean;
    createdAt: string;
    readAt?: string;
}

export interface ListNotificationsParams {
    onlyUnread?: boolean;
    page?: number;
    limit?: number;
}

export interface ListUserNotificationsResponse {
    items: NotificationSummary[];
    total: number;
    unreadCount: number;
    page: number;
    limit: number;
}
