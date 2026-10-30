import { CitizenType, ForeignIdType, KYCStatus, UserStatus } from "./enums";

export interface UserProfile {
    userId: string;
    mobileNumber: string;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string | null;
    kycStatus: KYCStatus;
    status: UserStatus;
    roles?: string[];
    createdAt: string;
}

export interface UpdateUserProfileRequest {
    firstName?: string;
    lastName?: string;
    avatarUrl?: string | null;
}

export interface RegisterUserRequest {
    mobileNumber: string;
    firstName?: string;
    lastName?: string;
}

export interface VerifyKycRequest {
    citizenType?: CitizenType;
    nationalCode?: string;
    foreignIdType?: ForeignIdType;
    foreignId?: string;
    documentUrl?: string;
    birthDate?: string; // YYYYMMDD
    firstName?: string;
    lastName?: string;
}

export interface VerifyKycResponse {
    userId: string;
    status: KYCStatus;
    similarityPercentage: number;
    reason?: string;
}
