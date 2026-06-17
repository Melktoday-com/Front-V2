import axios, { AxiosError } from "axios";
import { deleteCookie, getCookie } from "cookies-next";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

// Request Interceptor: Add Authorization Header
apiClient.interceptors.request.use((config) => {
    const token = getCookie("access_token");
    if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response Interceptor: Handle errors globally
apiClient.interceptors.response.use(
    (response) => {
        // If the response follows our standard envelope, unwrap the data
        if (response.data && response.data.success === true && "data" in response.data) {
            return {
                ...response,
                data: response.data.data,
            };
        }
        return response;
    },
    async (error: AxiosError) => {
        if (error.response?.status === 401) {
            // Handle unauthorized - clear token if needed
            deleteCookie("access_token");
            if (typeof window !== "undefined") {
                // Redirect to login or handled by Query client
            }
        }
        return Promise.reject(error);
    }
);

export default apiClient;
