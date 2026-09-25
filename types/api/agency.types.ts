import { JsonObject } from "../common";

export type AgentApplicationType = "AGENCY" | "CONSULTANT";
export type AgentApplicationStatus = "PENDING" | "APPROVED" | "REJECTED";
export type AgencyVerificationStatus = "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";

export interface AgencyContactResponse {
    phone: string | null;
    mobile: string | null;
}

export interface AgencySummary {
    id: string;
    cityId: string;
    name: string;
    agencyType?: AgentApplicationType;
    slug?: string;
    bio?: string;
    logoUrl?: string | null;
    coverUrl?: string | null;
    isVerified: boolean;
    rating?: number | null;
    followerCount?: number;
    isFollowing?: boolean;
    createdAt: string;
}

export interface AgencyFull extends AgencySummary {
    ownerUserId?: string;
    agencyName?: string;
    phone?: string | null;
    mobile?: string | null;
    licenseNumber?: string;
    guildCode?: string;
    nationalCode?: string;
    website?: string;
    whatsapp?: string;
    telegram?: string;
    instagram?: string;
    address?: string;
    postalCode?: string;
    workingHours?: string;
    latitude?: number;
    longitude?: number;
    isIndependent?: boolean;
    isActive: boolean;
    verificationStatus: AgencyVerificationStatus;
    followersCount?: number;
    consultationsCount?: number;
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
    slug?: string;
    licenseNumber?: string;
    guildCode?: string;
    nationalCode?: string;
    logoUrl?: string;
    coverUrl?: string;
    website?: string;
    phone?: string;
    mobile?: string;
    whatsapp?: string;
    telegram?: string;
    instagram?: string;
    address?: string;
    postalCode?: string;
    workingHours?: string;
    latitude?: number;
    longitude?: number;
    isIndependent?: boolean;
    parentAgencyId?: string;
}

export interface AgencyStats {
    agencyId: string;
    agencyName: string;
    ownerUserId: string;
    verificationStatus: string;
    followerCount: number;
    consultationCount: number;
}

// ── Agent Application (User -> Agent) ──────────────────────────────────────────

export interface ApplyAgentRequest {
    agentType: AgentApplicationType;
    nationalCode: string;
    guildCode?: string;
    licenseNumber?: string;
    agencyName?: string;
    applicantName: string;
    cityId: string;
    phone?: string;
    address?: string;
    experienceYears?: number;
    description?: string;
}

export interface AgentApplicationResponse {
    id: string;
    userId: string;
    agentType: AgentApplicationType;
    status: AgentApplicationStatus;
    applicantName: string;
    nationalCode: string;
    guildCode?: string;
    licenseNumber?: string;
    agencyName?: string;
    cityId: string;
    phone?: string;
    address?: string;
    experienceYears?: number;
    description?: string;
    adminNote?: string;
    reviewedBy?: string;
    reviewedAt?: string;
    jibitVerificationData?: JsonObject;
    createdAt: string;
    updatedAt: string;
}

// ── Agency Posts ─────────────────────────────────────────────────────────────

export interface AgencyPost {
    id: string;
    agencyId: string;
    title: string;
    slug: string;
    content: string;
    summary?: string;
    mediaUrls?: string[];
    isPublished: boolean;
    viewCount: number;
    likeCount: number;
    createdAt: string;
    updatedAt: string;
    agency?: {
        id: string;
        name: string;
        slug?: string;
        logoUrl?: string;
        isVerified?: boolean;
    } | null;
}

export interface CreateAgencyPostRequest {
    title: string;
    slug?: string;
    content: string;
    summary?: string;
    mediaUrls?: string[];
    isPublished?: boolean;
}

export interface UpdateAgencyPostRequest {
    title?: string;
    slug?: string;
    content?: string;
    summary?: string;
    mediaUrls?: string[];
    isPublished?: boolean;
}

// ── Agency Consultations & Messages ──────────────────────────────────────────

export interface RequestConsultationRequest {
    subject: string;
    message: string;
    senderName?: string;
    senderPhone?: string;
    preferredContactMethod?: "phone" | "email" | "chat";
}

export interface RequestConsultationResponse {
    consultationId: string;
    agencyId: string;
    status: string;
}

export interface AgencyConsultationMessage {
    id: string;
    agencyId: string;
    requesterUserId: string;
    subject: string;
    message: string;
    senderName?: string;
    senderPhone?: string;
    replyMessage?: string;
    status: "PENDING" | "REPLIED" | "ARCHIVED";
    respondedAt?: string;
    createdAt: string;
    updatedAt: string;
}

export interface ReplyAgencyConsultationRequest {
    replyMessage: string;
}
