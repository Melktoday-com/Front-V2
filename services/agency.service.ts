import apiClient from "@/lib/api/client";
import { AgencySummary, ListAgenciesResponse } from "@/types/api/agency.types";

export const agencyService = {
    async listAgencies(query: { cityId?: string; search?: string; page?: number; limit?: number } = {}): Promise<ListAgenciesResponse> {
        const response = await apiClient.get<ListAgenciesResponse>("/agencies", {
            params: query,
        });
        return response.data;
    },

    async getAgency(agencyId: string): Promise<AgencySummary> {
        const response = await apiClient.get<AgencySummary>(`/agencies/${agencyId}`);
        return response.data;
    },
};
