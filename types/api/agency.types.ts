import { JsonObject } from "../common";
import type { MediaReference } from "./media.types";

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
    fullName: string;
    cityId: string;
    phone?: string;
    address?: string;
    experienceYears?: number;
    description?: string;
}

export interface CorporationLocation {
    id?: string;
    title?: string;
    code?: string;
}

export interface CorporationOrganization {
    id?: string;
    title?: string;
    nationalCode?: string;
    province?: CorporationLocation;
    city?: CorporationLocation;
}

export interface CorporationVehicle {
    vehicleOwnershipType?: string;
    fuelTypes?: string[];
    vehicleType?: string;
    vin?: string;
    chassisNumber?: string;
    motorNumber?: string;
    productionYear?: string;
    plaqueNumber?: string;
}

export interface CorporationSenf {
    title?: string;
    senfCode?: string;
    phoneNumber?: string;
    faxNumber?: string;
    email?: string;
    postalCode?: string;
    address?: string;
    website?: string;
    province?: CorporationLocation;
    city?: CorporationLocation;
    plaque?: string;
    bluePlaque?: string;
    fuelTypes?: string[];
    vehicle?: CorporationVehicle;
}

export interface CorporationBusinessInfo {
    isic?: string;
    isicName?: string;
    isicTitle?: string;
    type?: string;
    jobType?: string;
}

export interface CorporationCompanyInfo {
    title?: string;
    nationalCode?: string;
    registrationNumber?: string;
}

export interface CorporationLicense {
    id?: string;
    status?: string;
    title?: string;
    issueDate?: string;
    expirationDate?: string;
    duration?: string;
    holderType?: string;
    licenseType?: string;
    requestType?: string;
    licenseDescription?: string;
    organizationInfo?: CorporationOrganization;
    organization?: CorporationOrganization;
    senf?: CorporationSenf;
    businessInfo?: CorporationBusinessInfo;
    companyInfo?: CorporationCompanyInfo;
    expiredNotifiedDate?: string;
}

export interface CorporationUserInfo {
    id?: string;
    firstName?: string;
    lastName?: string;
    fatherName?: string;
    nationalCode?: string;
    birthDate?: string;
    identificationNumber?: string;
    mobileNumber?: string;
    gender?: string;
    religion?: string;
    militaryServiceStatus?: string;
    education?: string;
    married?: boolean;
    foreigner?: boolean;
    houseHold?: boolean;
    avatar?: string;
    hasTobaccoLicense?: boolean;
}

export interface CorporationIdentityInfo {
    code?: string;
    senfCode?: string;
    userInfo?: CorporationUserInfo;
    licenses?: CorporationLicense[];
    licIssueDate?: string;
    licExpireDate?: string;
    licType?: string;
    licTime?: string;
    address?: string;
    bluePlaque?: string;
    registeredPlaque?: string;
    postalCode?: string;
    area?: number;
    unionName?: string;
    unionId?: number;
    guildId?: number;
    conventId?: number;
    conventName?: string;
    cityId?: number;
    boardTitle?: string;
    corporateIdentity?: string;
    licState?: string;
    tel?: string;
    isic?: string;
    companyNationalCode?: string;
    isicName?: string;
    hcLicenseRequestTypeName?: string;
    hasExpireLetter?: string;
    expireLetterDate?: string;
    firstName?: string;
    lastName?: string;
    fatherName?: string;
    nationalCode?: string;
    isMale?: string;
    mobile?: string;
    typeName?: string;
    typeCode?: string;
    birthDate?: string;
    identityNo?: string;
    identificationNumber?: string;
    country?: string;
    religion?: string;
    militaryState?: string;
    educationLevel?: string;
    providerTrackerId?: string;
}

export interface BaseAgentKycDetails {
    verified?: boolean;
    provider?: string;
    matched?: boolean;
    guildCode?: string;
    senfCode?: string;
    identityNo?: string;
    nationalCode?: string;
    nationalCodeMatched?: boolean;
    ownerName?: string;
    boardTitle?: string;
    unionName?: string;
    conventName?: string;
    isic?: string;
    isicName?: string;
    licState?: string;
    licType?: string;
    licTime?: string;
    licIssueDate?: string;
    licExpireDate?: string;
    address?: string;
    postalCode?: string;
    tel?: string;
    area?: number;
    mobileNumber?: string;
    info?: CorporationIdentityInfo;
    corporation?: CorporationIdentityInfo;
    checkedAt?: string;
    reason?: string;
    error?: string;
    fallback?: string;
    message?: string;
}

export type AgentGuildKycDetails = BaseAgentKycDetails & {
    provider?: "JIBIT_GUILD" | string;
};

export type AgentShahkarKycDetails = BaseAgentKycDetails & {
    provider?: "JIBIT_SHAHKAR" | string;
};

export type AgentKycDetails = BaseAgentKycDetails;

export interface AgentApplicationResponse {
    id: string;
    userId: string;
    agentType: AgentApplicationType;
    status: AgentApplicationStatus;
    fullName: string;
    nationalCode: string;
    guildCode?: string;
    licenseNumber?: string;
    agencyName?: string;
    cityId: string;
    phone?: string;
    address?: string;
    experienceYears?: number;
    description?: string;
    rejectionReason?: string;
    adminNote?: string;
    reviewedBy?: string;
    reviewedAt?: string;
    jibitVerificationData?: AgentKycDetails | JsonObject;
    kycDetails?: AgentKycDetails | JsonObject;
    createdAt: string;
    updatedAt: string;
}

// ── Agency Posts ─────────────────────────────────────────────────────────────

export interface AgencyPost {
    id: string;
    agencyId?: string;
    authorUserId?: string;
    publisherType?: string;
    publisherId?: string;
    title: string;
    slug?: string | null;
    content: string;
    summary?: string | null;
    category?: string | null;
    mediaIds: MediaReference[];
    isPublished: boolean;
    viewCount: number;
    likeCount: number;
    hasLiked?: boolean;
    createdAt: string;
    updatedAt: string;
    agency?: {
        id: string;
        name: string;
        slug?: string;
        logoUrl?: string;
        avatarUrl?: string;
        isVerified?: boolean;
    } | null;
    publisher?: {
        id: string;
        name: string;
        slug?: string;
        logoUrl?: string;
        avatarUrl?: string;
        isVerified?: boolean;
    } | null;
}

export interface AgencyPostsListResponse {
    items: AgencyPost[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface CreateAgencyPostRequest {
    title: string;
    slug?: string;
    content: string;
    summary?: string;
    mediaIds?: MediaReference[];
    isPublished?: boolean;
}

export interface UpdateAgencyPostRequest {
    title?: string;
    slug?: string;
    content?: string;
    summary?: string;
    mediaIds?: MediaReference[];
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
