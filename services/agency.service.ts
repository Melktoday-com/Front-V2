import apiClient from "@/lib/api/client";
import {
    AgencyFull,
    AgencyStats,
    CreateAgencyProfileRequest,
    ListAgenciesResponse,
    RequestConsultationRequest,
    RequestConsultationResponse,
    UpdateAgencyProfileRequest
} from "@/types/api/agency.types";

export const agencyService = {
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

    async requestConsultation(agencyId: string, data: RequestConsultationRequest): Promise<RequestConsultationResponse> {
        const response = await apiClient.post<RequestConsultationResponse>(`/agencies/${agencyId}/consultations`, data);
        return response.data;
    },
};
