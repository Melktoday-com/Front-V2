export interface AgencySummary {
    id: string;
    name: string;
    logoUrl?: string;
    isVerified: boolean;
    rating: number;
}

export interface ListAgenciesResponse {
    agencies: AgencySummary[];
    total: number;
    page: number;
    limit: number;
}
