import { KYCStatus, UserStatus } from "./enums";

export interface UserProfile {
    userId: string;
    mobileNumber: string;
    firstName?: string;
    lastName?: string;
    kycStatus: KYCStatus;
    status: UserStatus;
    createdAt: string;
}

export interface UpdateUserProfileRequest {
    firstName?: string;
    lastName?: string;
}

export interface RegisterUserRequest {
    mobileNumber: string;
    firstName?: string;
    lastName?: string;
}

export interface VerifyKycRequest {
    nationalCode: string;
    birthDate: string; // YYYYMMDD
    firstName?: string;
    lastName?: string;
}

export interface VerifyKycResponse {
    userId: string;
    status: "verified" | "rejected" | "failed";
    similarityPercentage: number;
    reason?: string;
}
