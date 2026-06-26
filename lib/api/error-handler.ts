
import axios, { AxiosError } from "axios";

export interface ApiErrorResponse {
    message: string | string[];
    error: string;
    statusCode: number;
}

export function normalizeApiError(error: Error | AxiosError | null): string {
    if (axios.isAxiosError(error)) {
        const data = error.response?.data as ApiErrorResponse;
        if (data?.message) {
            if (Array.isArray(data.message)) {
                return data.message[0];
            }
            return data.message;
        }
    }

    if (error instanceof Error) {
        return error.message;
    }

    return "An unexpected error occurred. Please try again.";
}
