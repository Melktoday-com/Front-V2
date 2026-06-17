export interface UserProfile {
    userId: string;
    mobileNumber: string;
    firstName?: string;
    lastName?: string;
    kycStatus: "Pending" | "Verified" | "Rejected";
    active: boolean;
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
    status: "Verified" | "Rejected" | "Failed";
    similarityPercentage: number;
    reason?: string;
}
