export enum TicketStatus {
    OPEN = 'OPEN',
    IN_PROGRESS = 'IN_PROGRESS',
    WAITING_FOR_USER = 'WAITING_FOR_USER',
    WAITING_FOR_ADMIN = 'WAITING_FOR_ADMIN',
    RESOLVED = 'RESOLVED',
    CLOSED = 'CLOSED',
}

export enum TicketSenderRole {
    USER = 'USER',
    ADMIN = 'ADMIN',
}

export interface TicketTopic {
    id: string;
    key: string;
    label: string;
    isActive: boolean;
    sortOrder: number;
    createdAt: string;
    updatedAt: string;
}

export interface Ticket {
    id: string;
    topicId: string;
    topicLabel: string | null;
    requesterId: string;
    subject: string;
    status: TicketStatus;
    assigneeId: string | null;
    createdAt: string;
    updatedAt: string;
    resolvedAt: string | null;
    closedAt: string | null;
}

export interface TicketListResponse {
    tickets: Ticket[];
    total: number;
}

export interface TicketMessage {
    id: string;
    ticketId: string;
    senderId: string;
    senderRole: TicketSenderRole;
    body: string;
    createdAt: string;
}

export interface TicketMessageListResponse {
    messages: TicketMessage[];
    total: number;
}

export interface CreateTicketPayload {
    topicId: string;
    subject: string;
    initialMessage: string;
}

export interface AddTicketReplyPayload {
    body: string;
}

export interface ChangeTicketStatusPayload {
    status: TicketStatus;
}

export interface CreateTicketTopicPayload {
    key: string;
    label: string;
    sortOrder?: number;
}

export interface UpdateTicketTopicPayload {
    label?: string;
    sortOrder?: number;
}

export interface ListTicketsParams {
    limit?: number;
    offset?: number;
}

export interface ListAdminTicketsParams extends ListTicketsParams {
    topicId?: string;
    status?: TicketStatus;
    requesterId?: string;
}

export const TICKET_STATUS_CONFIG: Record<TicketStatus, {
    label: string;
    badgeBg: string;
    badgeText: string;
    borderColor: string;
}> = {
    [TicketStatus.OPEN]: {
        label: 'باز / جدید',
        badgeBg: 'bg-emerald-50',
        badgeText: 'text-emerald-700',
        borderColor: 'border-emerald-200',
    },
    [TicketStatus.IN_PROGRESS]: {
        label: 'در حال بررسی',
        badgeBg: 'bg-blue-50',
        badgeText: 'text-blue-700',
        borderColor: 'border-blue-200',
    },
    [TicketStatus.WAITING_FOR_USER]: {
        label: 'منتظر پاسخ کاربر',
        badgeBg: 'bg-amber-50',
        badgeText: 'text-amber-700',
        borderColor: 'border-amber-200',
    },
    [TicketStatus.WAITING_FOR_ADMIN]: {
        label: 'منتظر پاسخ پشتیبانی',
        badgeBg: 'bg-purple-50',
        badgeText: 'text-purple-700',
        borderColor: 'border-purple-200',
    },
    [TicketStatus.RESOLVED]: {
        label: 'حل شده',
        badgeBg: 'bg-teal-50',
        badgeText: 'text-teal-700',
        borderColor: 'border-teal-200',
    },
    [TicketStatus.CLOSED]: {
        label: 'بسته شده',
        badgeBg: 'bg-gray-100',
        badgeText: 'text-gray-700',
        borderColor: 'border-gray-300',
    },
};
