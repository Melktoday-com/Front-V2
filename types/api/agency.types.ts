export interface AgencySummary {
    id: string;
    cityId: string;
    name: string;
    bio?: string;
    phone?: string | null;
    logoUrl?: string | null;
    isVerified: boolean;
    rating: number;
    createdAt: string;
}

export interface ListAgenciesResponse {
    agencies: AgencySummary[];
    total: number;
    page: number;
    limit: number;
}
