
export interface ApiErrorResponse {
    message: string | string[];
    error: string;
    statusCode: number;
}

export function normalizeApiError(error: unknown): string {
    if (error instanceof axios.AxiosError) {
        const data = error.response?.data as ApiErrorResponse;
        if (data?.message) {
            if (Array.isArray(data.message)) {
                return data.message[0];
            }
            return data.message;
        }
    }
    return "An unexpected error occurred. Please try again.";
}

import axios from "axios";
