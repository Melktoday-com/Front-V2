import apiClient from "@/lib/api/client";
import {
    AddTicketReplyPayload,
    ChangeTicketStatusPayload,
    CreateTicketPayload,
    CreateTicketTopicPayload,
    ListAdminTicketsParams,
    ListTicketsParams,
    Ticket,
    TicketListResponse,
    TicketMessage,
    TicketMessageListResponse,
    TicketTopic,
    UpdateTicketTopicPayload,
} from "@/types/api/ticketing.types";

export const ticketingService = {
    // ── User Endpoints ────────────────────────────────────────────────────────

    /**
     * List active ticket topics for topic selection
     */
    async listActiveTopics(): Promise<TicketTopic[]> {
        const response = await apiClient.get<TicketTopic[]>("/ticket-topics");
        return response.data;
    },

    /**
     * List tickets created by the authenticated user
     */
    async listMyTickets(params?: ListTicketsParams): Promise<TicketListResponse> {
        const queryParams: Record<string, number> = {};
        if (params?.limit !== undefined) queryParams.limit = params.limit;
        if (params?.offset !== undefined) queryParams.offset = params.offset;

        const response = await apiClient.get<TicketListResponse>("/tickets", {
            params: queryParams,
        });
        return response.data;
    },

    /**
     * Open a new support ticket
     */
    async createTicket(payload: CreateTicketPayload): Promise<Ticket> {
        const response = await apiClient.post<Ticket>("/tickets", payload);
        return response.data;
    },

    /**
     * Get ticket details (owner only)
     */
    async getTicket(id: string): Promise<Ticket> {
        const response = await apiClient.get<Ticket>(`/tickets/${id}`);
        return response.data;
    },

    /**
     * Get paginated messages for a ticket (owner only)
     */
    async getTicketMessages(
        id: string,
        params?: ListTicketsParams
    ): Promise<TicketMessageListResponse> {
        const queryParams: Record<string, number> = {};
        if (params?.limit !== undefined) queryParams.limit = params.limit;
        if (params?.offset !== undefined) queryParams.offset = params.offset;

        const response = await apiClient.get<TicketMessageListResponse>(
            `/tickets/${id}/messages`,
            { params: queryParams }
        );
        return response.data;
    },

    /**
     * Add a reply to an active ticket (owner only)
     */
    async addReply(id: string, payload: AddTicketReplyPayload): Promise<TicketMessage> {
        const response = await apiClient.post<TicketMessage>(
            `/tickets/${id}/replies`,
            payload
        );
        return response.data;
    },

    // ── Admin Endpoints ───────────────────────────────────────────────────────

    /**
     * List all tickets across the platform (requires tickets.view permission)
     */
    async listAdminTickets(params?: ListAdminTicketsParams): Promise<TicketListResponse> {
        const queryParams: Record<string, string | number> = {};
        if (params?.topicId) queryParams.topicId = params.topicId;
        if (params?.status) queryParams.status = params.status;
        if (params?.requesterId) queryParams.requesterId = params.requesterId;
        if (params?.limit !== undefined) queryParams.limit = params.limit;
        if (params?.offset !== undefined) queryParams.offset = params.offset;

        const response = await apiClient.get<TicketListResponse>("/admin/tickets", {
            params: queryParams,
        });
        return response.data;
    },

    /**
     * Get ticket detail (Admin view, requires tickets.view)
     */
    async getAdminTicket(id: string): Promise<Ticket> {
        const response = await apiClient.get<Ticket>(`/admin/tickets/${id}`);
        return response.data;
    },

    /**
     * Get ticket messages (Admin view, requires tickets.view)
     */
    async getAdminTicketMessages(
        id: string,
        params?: ListTicketsParams
    ): Promise<TicketMessageListResponse> {
        const queryParams: Record<string, number> = {};
        if (params?.limit !== undefined) queryParams.limit = params.limit;
        if (params?.offset !== undefined) queryParams.offset = params.offset;

        const response = await apiClient.get<TicketMessageListResponse>(
            `/admin/tickets/${id}/messages`,
            { params: queryParams }
        );
        return response.data;
    },

    /**
     * Post an Admin reply to a ticket (requires tickets.reply)
     */
    async adminReply(id: string, payload: AddTicketReplyPayload): Promise<TicketMessage> {
        const response = await apiClient.post<TicketMessage>(
            `/admin/tickets/${id}/replies`,
            payload
        );
        return response.data;
    },

    /**
     * Change ticket status (requires tickets.manage)
     */
    async changeTicketStatus(
        id: string,
        payload: ChangeTicketStatusPayload
    ): Promise<Ticket> {
        const response = await apiClient.patch<Ticket>(
            `/admin/tickets/${id}/status`,
            payload
        );
        return response.data;
    },

    // ── SuperAdmin Topic Management Endpoints ─────────────────────────────────

    /**
     * List all topics including inactive (SuperAdmin only)
     */
    async listAllTopics(): Promise<TicketTopic[]> {
        const response = await apiClient.get<TicketTopic[]>("/admin/ticket-topics");
        return response.data;
    },

    /**
     * Get a specific topic (SuperAdmin only)
     */
    async getTopic(id: string): Promise<TicketTopic> {
        const response = await apiClient.get<TicketTopic>(`/admin/ticket-topics/${id}`);
        return response.data;
    },

    /**
     * Create a ticket topic (SuperAdmin only)
     */
    async createTopic(payload: CreateTicketTopicPayload): Promise<TicketTopic> {
        const response = await apiClient.post<TicketTopic>(
            "/admin/ticket-topics",
            payload
        );
        return response.data;
    },

    /**
     * Update a ticket topic (SuperAdmin only)
     */
    async updateTopic(
        id: string,
        payload: UpdateTicketTopicPayload
    ): Promise<TicketTopic> {
        const response = await apiClient.put<TicketTopic>(
            `/admin/ticket-topics/${id}`,
            payload
        );
        return response.data;
    },

    /**
     * Deactivate a topic (safe operation, keeps historical references)
     */
    async deactivateTopic(id: string): Promise<TicketTopic> {
        const response = await apiClient.patch<TicketTopic>(
            `/admin/ticket-topics/${id}/deactivate`
        );
        return response.data;
    },

    /**
     * Activate a topic (SuperAdmin only)
     */
    async activateTopic(id: string): Promise<TicketTopic> {
        const response = await apiClient.patch<TicketTopic>(
            `/admin/ticket-topics/${id}/activate`
        );
        return response.data;
    },

    /**
     * Permanently delete an unreferenced topic (SuperAdmin only)
     */
    async deleteTopic(id: string): Promise<void> {
        await apiClient.delete(`/admin/ticket-topics/${id}`);
    },
};
