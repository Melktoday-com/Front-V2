import apiClient from "@/lib/api/client";

export type SubjectType = 'SUPPORT' | 'PROPERTY' | 'RENTAL' | 'AGENCY';

export type MessageType = 'TEXT' | 'SYSTEM' | 'AUTO_REPLY' | 'IMAGE' | 'LISTING' | 'POLL';

export interface CreateConversationDto {
    subjectType: SubjectType;
    subjectId: string;
    firstMessageContent?: string;
    firstMessageMediaIds?: string[];
}

export interface CreateConversationResponse {
    id: string;
    isNew: boolean;
}

export interface PollOptionMetadata {
    id: string;
    text: string;
    sortOrder?: number;
}

export interface PollMetadata {
    pollId: string;
    question: string;
    options: PollOptionMetadata[];
    status?: 'OPEN' | 'CLOSED';
    expiresAt?: string | null;
}

export interface ListingPriceMetadata {
    totalPrice?: number | string | null;
    depositPrice?: number | string | null;
    rentPrice?: number | string | null;
    weekdayPrice?: number | string | null;
    weekendPrice?: number | string | null;
}

export interface ListingMetadata {
    subjectId?: string;
    subjectType?: SubjectType | string;
    title?: string | null;
    price?: number | string | ListingPriceMetadata | null;
    mediaIds?: string[];
    image?: string;
    location?: string;
}

export type ChatMessageMetadata = PollMetadata | ListingMetadata | Record<string, unknown>;

export interface ChatMessage {
    id: string;
    conversationId: string;
    senderId: string;
    content: string | null;
    mediaIds: string[] | null;
    metadata?: ChatMessageMetadata | null;
    type: MessageType;
    createdAt: string;
}

export interface ChatConversation {
    id: string;
    subjectType: SubjectType;
    subjectId: string;
    participants: string[];
    lastMessageId: string | null;
    lastMessageAt: string | null;
    unreadCount?: number;
    otherParticipant?: {
        id: string;
        name?: string;
        avatar?: string | null;
        type?: string;
    } | null;
}

export interface SendMessageDto {
    content?: string;
    mediaIds?: string[];
    type?: MessageType;
    metadata?: Record<string, any>;
}

export interface CreatePollDto {
    question: string;
    options: string[];
    expiresAt?: string;
}

export interface PollResultOption {
    id: string;
    text: string;
    sortOrder: number;
    voteCount: number;
    percentage: number;
}

export interface PollData {
    id: string;
    messageId: string | null;
    conversationId: string;
    creatorId: string;
    question: string;
    status: 'OPEN' | 'CLOSED';
    expiresAt: string | null;
    totalVotes: number;
    options: PollResultOption[];
    userVotedOptionId: string | null;
    createdAt: string;
}

export interface CreatePollResponse {
    pollId: string;
    messageId: string;
}

export const chatService = {
    async createConversation(dto: CreateConversationDto): Promise<CreateConversationResponse> {
        const response = await apiClient.post<CreateConversationResponse>("/conversations", dto);
        return response.data;
    },

    async listConversations(params: { limit?: number; offset?: number; type?: string } = {}): Promise<ChatConversation[]> {
        const response = await apiClient.get<ChatConversation[]>("/conversations", { params });
        return response.data;
    },

    async getMessages(conversationId: string, params: { limit?: number; lastMessageId?: string } = {}): Promise<ChatMessage[]> {
        const response = await apiClient.get<ChatMessage[]>(`/conversations/${conversationId}/messages`, { params });
        return response.data;
    },

    async sendMessage(conversationId: string, dto: SendMessageDto): Promise<ChatMessage> {
        const response = await apiClient.post<ChatMessage>(`/conversations/${conversationId}/messages`, dto);
        return response.data;
    },

    async createPoll(conversationId: string, dto: CreatePollDto): Promise<CreatePollResponse> {
        const response = await apiClient.post<CreatePollResponse>(`/conversations/${conversationId}/polls`, dto);
        return response.data;
    },

    async votePoll(pollId: string, optionId: string): Promise<PollData> {
        const response = await apiClient.post<PollData>(`/conversations/polls/${pollId}/vote`, { optionId });
        return response.data;
    },

    async getPoll(pollId: string): Promise<PollData> {
        const response = await apiClient.get<PollData>(`/conversations/polls/${pollId}`);
        return response.data;
    },

    async markAsRead(conversationId: string, lastMessageId: string): Promise<void> {
        await apiClient.post(`/conversations/${conversationId}/read`, { lastMessageId });
    },

    async getUnreadCounts(): Promise<{ total: number; bySubject: Record<string, number> }> {
        const response = await apiClient.get("/conversations/unread");
        return response.data;
    }
};