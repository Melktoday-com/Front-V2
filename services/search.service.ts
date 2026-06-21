import apiClient from "@/lib/api/client";
import { SearchListingsQuery, SearchResponse } from "@/types/api/search.types";

export interface SearchSuggestion {
    text: string;
    type: string;
}

export const searchService = {
    async search(query: SearchListingsQuery): Promise<SearchResponse> {
        const response = await apiClient.get<SearchResponse>("/search", {
            params: query,
        });
        return response.data;
    },

    async getSuggestions(q: string): Promise<SearchSuggestion[]> {
        if (!q || q.length < 2) return [];
        const response = await apiClient.get<{ suggestions: SearchSuggestion[] }>("/search/suggestions", {
            params: { q },
        });
        return response.data.suggestions;
    },

    async getCities(): Promise<string[]> {
        const response = await apiClient.get<{ cities: string[] }>("/search/cities");
        return response.data.cities;
    },

    async getNeighborhoods(city: string): Promise<string[]> {
        const response = await apiClient.get<{ neighborhoods: string[] }>("/search/neighborhoods", {
            params: { city },
        });
        return response.data.neighborhoods;
    }
};
