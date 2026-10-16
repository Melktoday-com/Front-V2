import { JsonValue } from "@/types/common";
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { getCookie } from "cookies-next";
import { getClientApiUrl, refreshAuthTokens } from "./token-manager";

export { getClientApiUrl };

const API_URL = getClientApiUrl();

interface StandardResponse<T = JsonValue> {
    success: boolean;
    data: T;
    message?: string;
}

export const apiClient = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
    paramsSerializer: {
        indexes: null,
    },
});

// Synchronize default Authorization header with token manager events
if (typeof window !== "undefined") {
    window.addEventListener("auth:token-refreshed", (event: Event) => {
        const customEvent = event as CustomEvent<{ accessToken: string }>;
        const token = customEvent.detail?.accessToken;
        if (token) {
            apiClient.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        }
    });

    window.addEventListener("auth:session-expired", () => {
        delete apiClient.defaults.headers.common["Authorization"];
    });
}

// Request Interceptor: Add Authorization Header
apiClient.interceptors.request.use((config) => {
    const rawToken = getCookie("access_token");
    const token = typeof rawToken === "string" ? rawToken : undefined;
    if (token && config.headers) {
        if (typeof config.headers.set === "function") {
            config.headers.set("Authorization", `Bearer ${token}`);
        } else {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }

    // Add CSRF token for unsafe methods (POST, PUT, PATCH, DELETE)
    const unsafeMethods = ["post", "put", "patch", "delete"];
    if (config.method && unsafeMethods.includes(config.method.toLowerCase())) {
        const rawCsrf = getCookie("XSRF-TOKEN");
        const csrfToken = typeof rawCsrf === "string" ? rawCsrf : undefined;
        if (csrfToken && config.headers) {
            if (typeof config.headers.set === "function") {
                config.headers.set("x-xsrf-token", csrfToken);
            } else {
                config.headers["x-xsrf-token"] = csrfToken;
            }
        }
    }

    return config;
});

// Response Interceptor: Handle errors globally
apiClient.interceptors.response.use(
    (response) => {
        const data = response.data as StandardResponse;
        // If the response follows our standard envelope, unwrap the data
        if (data && data.success === true && "data" in data) {
            return {
                ...response,
                data: data.data,
            };
        }
        return response;
    },
    async (error: AxiosError) => {
        interface RetryableConfigRequest extends InternalAxiosRequestConfig {
            _retry?: boolean;
        }
        const originalRequest = error.config as RetryableConfigRequest;

        // Never attempt refresh or auto-redirect for auth endpoints (e.g., /auth/otp, /auth/verify, /auth/refresh)
        const isAuthEndpoint = originalRequest?.url?.includes("/auth/");

        if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthEndpoint) {
            originalRequest._retry = true;

            const newAccessToken = await refreshAuthTokens();

            if (newAccessToken) {
                apiClient.defaults.headers.common["Authorization"] = `Bearer ${newAccessToken}`;
                if (originalRequest.headers) {
                    if (typeof originalRequest.headers.set === "function") {
                        originalRequest.headers.set("Authorization", `Bearer ${newAccessToken}`);
                    } else {
                        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                    }
                }
                return apiClient(originalRequest);
            }

            return Promise.reject(error);
        }

        return Promise.reject(error);
    }
);

export default apiClient;
