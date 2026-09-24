import apiClient from "@/lib/api/client";
import axios from "axios";
import {
    AgencyConsultationMessage,
    AgencyFull,
    AgencyPost,
    AgencyStats,
    AgentApplicationResponse,
    ApplyAgentRequest,
    CreateAgencyPostRequest,
    CreateAgencyProfileRequest,
    ListAgenciesResponse,
    ReplyAgencyConsultationRequest,
    RequestConsultationRequest,
    RequestConsultationResponse,
    UpdateAgencyPostRequest,
    UpdateAgencyProfileRequest,
} from "@/types/api/agency.types";

export const agencyService = {
    // ── Directory & Profiles ───────────────────────────────────────────────────

    async listAgencies(query: { cityId?: string; search?: string; page?: number; limit?: number } = {}): Promise<ListAgenciesResponse> {
        const response = await apiClient.get<ListAgenciesResponse>("/agencies", {
            params: query,
        });
        return response.data;
    },

    async getAgency(agencyId: string): Promise<AgencyFull> {
        const response = await apiClient.get<AgencyFull>(`/agencies/${agencyId}`);
        return response.data;
    },

    async createAgency(data: CreateAgencyProfileRequest): Promise<{ agencyId: string }> {
        const response = await apiClient.post<{ agencyId: string }>("/agencies", data);
        return response.data;
    },

    async updateAgency(agencyId: string, data: UpdateAgencyProfileRequest): Promise<void> {
        await apiClient.patch(`/agencies/${agencyId}`, data);
    },

    async getAgencyStats(agencyId: string): Promise<AgencyStats> {
        const response = await apiClient.get<AgencyStats>(`/agencies/${agencyId}/stats`);
        return response.data;
    },

    async followAgency(agencyId: string): Promise<void> {
        await apiClient.post(`/agencies/${agencyId}/follow`);
    },

    async unfollowAgency(agencyId: string): Promise<void> {
        await apiClient.delete(`/agencies/${agencyId}/follow`);
    },

    // ── Agent Applications (User -> Agent) ───────────────────────────────────

    async applyForAgent(data: ApplyAgentRequest): Promise<AgentApplicationResponse> {
        const response = await apiClient.post<AgentApplicationResponse>("/agencies/apply", data);
        return response.data;
    },

    async getMyApplication(): Promise<AgentApplicationResponse | null> {
        try {
            const response = await apiClient.get<AgentApplicationResponse>("/agencies/my-application");
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                return null;
            }
            throw error;
        }
    },

    // ── Dedicated Agency Showcase ─────────────────────────────────────────────

    async getMyShowcase(): Promise<AgencyFull> {
        const response = await apiClient.get<AgencyFull>("/agencies/my-showcase");
        return response.data;
    },

    async updateMyShowcase(data: UpdateAgencyProfileRequest): Promise<AgencyFull> {
        const response = await apiClient.put<AgencyFull>("/agencies/my-showcase", data);
        return response.data;
    },

    async getPublicShowcase(idOrSlug: string): Promise<AgencyFull> {
        const response = await apiClient.get<AgencyFull>(`/agencies/showcase/${encodeURIComponent(idOrSlug)}`);
        return response.data;
    },

    // ── Agency Posts ─────────────────────────────────────────────────────────

    async createMyPost(data: CreateAgencyPostRequest): Promise<AgencyPost> {
        const response = await apiClient.post<AgencyPost>("/agencies/my-showcase/posts", data);
        return response.data;
    },

    async updateMyPost(postId: string, data: UpdateAgencyPostRequest): Promise<AgencyPost> {
        const response = await apiClient.put<AgencyPost>(`/agencies/my-showcase/posts/${postId}`, data);
        return response.data;
    },

    async deleteMyPost(postId: string): Promise<{ success: boolean }> {
        const response = await apiClient.delete<{ success: boolean }>(`/agencies/my-showcase/posts/${postId}`);
        return response.data;
    },

    async listMyPosts(): Promise<AgencyPost[]> {
        const response = await apiClient.get<AgencyPost[]>("/agencies/my-showcase/posts");
        return response.data;
    },

    async getPublicPosts(
        idOrSlug: string,
        params: { page?: number; limit?: number } = {},
    ): Promise<{ items: AgencyPost[]; total: number; page: number; limit: number; totalPages: number }> {
        const response = await apiClient.get(`/agencies/showcase/${encodeURIComponent(idOrSlug)}/posts`, {
            params,
        });
        return response.data;
    },

    async getPublicPost(idOrSlug: string, postIdOrSlug: string): Promise<AgencyPost> {
        const response = await apiClient.get<AgencyPost>(
            `/agencies/showcase/${encodeURIComponent(idOrSlug)}/posts/${encodeURIComponent(postIdOrSlug)}`,
        );
        return response.data;
    },

    // ── Consultation Requests / Direct Messages to Showcase ──────────────────

    async sendMessageToAgency(
        agencyId: string,
        data: RequestConsultationRequest,
    ): Promise<AgencyConsultationMessage> {
        const response = await apiClient.post<AgencyConsultationMessage>(
            `/agencies/showcase/${agencyId}/messages`,
            data,
        );
        return response.data;
    },

    async listMyMessages(): Promise<AgencyConsultationMessage[]> {
        const response = await apiClient.get<AgencyConsultationMessage[]>("/agencies/my-showcase/messages");
        return response.data;
    },

    async requestConsultation(
        agencyId: string,
        data: RequestConsultationRequest,
    ): Promise<RequestConsultationResponse> {
        const res = await this.sendMessageToAgency(agencyId, data);
        return {
            consultationId: res.id,
            agencyId: res.agencyId,
            status: res.status,
        };
    },

    async replyToMessage(
        messageId: string,
        data: ReplyAgencyConsultationRequest,
    ): Promise<AgencyConsultationMessage> {
        const response = await apiClient.post<AgencyConsultationMessage>(
            `/agencies/my-showcase/messages/${messageId}/reply`,
            data,
        );
        return response.data;
    },
};
