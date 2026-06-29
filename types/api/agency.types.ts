export interface AgencySummary {
    id: string;
    cityId: string;
    name: string;
    bio?: string;
    phone?: string | null;
    logoUrl?: string | null;
    isVerified: boolean;
    rating: number;
    followerCount: number;
    isFollowing: boolean;
    createdAt: string;
}

export interface AgencyFull extends AgencySummary {
    ownerUserId: string;
    licenseNumber?: string;
    website?: string;
    verificationStatus: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";
}

export interface ListAgenciesResponse {
    agencies: AgencySummary[];
    total: number;
    page: number;
    limit: number;
}

export interface CreateAgencyProfileRequest {
    cityId: string;
    agencyName: string;
    bio: string;
    licenseNumber?: string;
    website?: string;
    phone?: string;
}

export interface UpdateAgencyProfileRequest {
    agencyName?: string;
    bio?: string;
    licenseNumber?: string;
    website?: string;
    phone?: string;
}

export interface AgencyStats {
    agencyId: string;
    agencyName: string;
    ownerUserId: string;
    verificationStatus: string;
    followerCount: number;
    consultationCount: number;
}

export interface RequestConsultationRequest {
    subject: string;
    message: string;
    preferredContactMethod: "phone" | "email" | "chat";
}

export interface RequestConsultationResponse {
    consultationId: string;
    agencyId: string;
    status: string;
}
