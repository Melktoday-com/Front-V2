import apiClient from "@/lib/api/client";

export type SubjectType = 'SUPPORT' | 'PROPERTY' | 'RENTAL' | 'AGENCY';

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

export interface ChatMessage {
    id: string;
    conversationId: string;
    senderId: string;
    content: string | null;
    mediaIds: string[] | null;
    type: 'TEXT' | 'SYSTEM' | 'AUTO_REPLY';
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
        avatar?: string;
        type?: string;
    };
}

export interface SendMessageDto {
    content?: string;
    mediaIds?: string[];
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

    async markAsRead(conversationId: string, lastMessageId: string): Promise<void> {
        await apiClient.post(`/conversations/${conversationId}/read`, { lastMessageId });
    },

    async getUnreadCounts(): Promise<{ total: number; bySubject: Record<string, number> }> {
        const response = await apiClient.get("/conversations/unread");
        return response.data;
    }
};