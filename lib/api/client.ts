import { JsonValue } from "@/types/common";
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { deleteCookie, getCookie, setCookie } from "cookies-next";
    

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

interface FailedRequest {
    resolve: (token: string | null) => void;
    reject: (error: Error | AxiosError | null) => void;
}

interface StandardResponse<T = JsonValue> {
    success: boolean;
    data: T;
    message?: string;
}

export const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

let isRefreshing = false;
let failedQueue: FailedRequest[] = [];

const processQueue = (error: Error | AxiosError | null, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });

    failedQueue = [];
};

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

        if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise<string | null>(function (resolve, reject) {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        if (originalRequest.headers) {
                            originalRequest.headers["Authorization"] = "Bearer " + token;
                        }
                        return apiClient(originalRequest);
                    })
                    .catch((err) => {
                        return Promise.reject(err);
                    });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const refreshToken = getCookie("refresh_token");

            if (refreshToken) {
                try {
                    const response = await axios.post<StandardResponse<{
                        accessToken: string;
                        refreshToken: string;
                        expiresIn: number;
                    }>>(`${API_URL}/auth/refresh`, {
                        refreshToken,
                    });

                    const { accessToken, refreshToken: newRefreshToken, expiresIn } = response.data.data;

                    setCookie("access_token", accessToken, { maxAge: expiresIn });
                    setCookie("refresh_token", newRefreshToken, { maxAge: 30 * 24 * 60 * 60 });

                    apiClient.defaults.headers.common["Authorization"] = "Bearer " + accessToken;
                    if (originalRequest.headers) {
                        originalRequest.headers["Authorization"] = "Bearer " + accessToken;
                    }

                    processQueue(null, accessToken);
                    return apiClient(originalRequest);
                } catch (refreshError) {
                    const error = refreshError instanceof Error ? refreshError : new Error(String(refreshError));
                    processQueue(error, null);
                    deleteCookie("access_token");
                    deleteCookie("refresh_token");
                    if (typeof window !== "undefined") {
                        window.location.href = "/auth";
                    }
                    return Promise.reject(refreshError);
                } finally {
                    isRefreshing = false;
                }
            } else {
                deleteCookie("access_token");
                if (typeof window !== "undefined") {
                    window.location.href = "/auth";
                }
            }
        }

        return Promise.reject(error);
    }
);

export default apiClient;
