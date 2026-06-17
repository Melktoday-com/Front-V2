import apiClient from "@/lib/api/client";
import {
    RequestOtpRequest,
    RequestOtpResponse,
    SwitchActiveRoleRequest,
    SwitchActiveRoleResponse,
    TerminateSessionRequest,
    TerminateSessionResponse,
    VerifyOtpRequest,
    VerifyOtpResponse,
} from "@/types/api/auth.types";

export const authService = {
    async requestOtp(data: RequestOtpRequest): Promise<RequestOtpResponse> {
        const response = await apiClient.post<RequestOtpResponse>("/auth/otp/request", data);
        return response.data;
    },

    async verifyOtp(data: VerifyOtpRequest): Promise<VerifyOtpResponse> {
        const response = await apiClient.post<VerifyOtpResponse>("/auth/otp/verify", data);
        return response.data;
    },

    async terminateSession(data: TerminateSessionRequest): Promise<TerminateSessionResponse> {
        const response = await apiClient.post<TerminateSessionResponse>("/auth/sessions/terminate", data);
        return response.data;
    },

    async switchRole(data: SwitchActiveRoleRequest): Promise<SwitchActiveRoleResponse> {
        const response = await apiClient.post<SwitchActiveRoleResponse>("/auth/sessions/switch-role", data);
        return response.data;
    },
};
