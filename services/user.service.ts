import api from "@/lib/api/client";
import {
    UpdateUserProfileRequest,
    UserProfile,
    VerifyKycRequest,
    VerifyKycResponse
} from "@/types/api/user.types";

/**
 * User Service - Handles identity management and KYC
 * Corresponds to @modules/user in backend
 */
export const userService = {
    /**
     * Update user profile information
     * PUT /users/:userId/profile
     */
    updateProfile: async (userId: string, data: UpdateUserProfileRequest) => {
        const response = await api.put(`/users/${userId}/profile`, data);
        return response.data;
    },

    /**
     * Verify KYC verification
     * POST /users/:userId/kyc/verify
     */
    verifyKyc: async (userId: string, data: VerifyKycRequest): Promise<VerifyKycResponse> => {
        const response = await api.post(`/users/${userId}/kyc/verify`, data);
        return response.data;
    },

    /**
     * Get available roles
     * GET /users/roles
     */
    getRoles: async () => {
        const response = await api.get("/users/roles");
        return response.data;
    },

    /**
     * FIXME: Backend is missing a GET /users/me or GET /users/:userId endpoint.
     * For now, this is a placeholder.
     */
    getProfile: async (userId: string): Promise<UserProfile> => {
        // This endpoint doesn't exist yet in the backend!
        // const response = await api.get(`/users/${userId}`);
        // return response.data;
        throw new Error("Endpoint GET /users/:userId not implemented in backend");
    }
};
