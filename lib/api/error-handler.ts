import axios from "axios";

/**
 * Structured API Error detail returned by Melktoday Backend V2
 */
export interface ApiErrorDetail {
    readonly code: string;
    readonly message: string;
    readonly field?: string;
    readonly meta?: Readonly<Record<string, unknown>>;
}

/**
 * Standard unified API Error response contract
 * Backend is the single source of truth for error codes, metadata, and Persian user-facing messages.
 */
export interface ApiErrorResponse {
    readonly success?: boolean;
    readonly statusCode?: number;
    readonly error?: {
        readonly code?: string;
        readonly category?: string;
        readonly message?: string;
        readonly details?: readonly ApiErrorDetail[];
    } | string;
    readonly message?: string | string[];
    readonly meta?: {
        readonly requestId?: string;
        readonly correlationId?: string;
        readonly timestamp?: string;
        readonly path?: string;
    };
}

/**
 * Normalizes an API error into a clean Persian user-facing string.
 * Strictly consumes backend-provided messages without frontend translation maps.
 */
export function normalizeApiError(
    error: unknown,
    fallbackMessage = "خطا در برقراری ارتباط یا پردازش درخواست",
): string {
    if (!error) return fallbackMessage;

    if (axios.isAxiosError(error)) {
        // Transport / Network errors (no response from server)
        if (!error.response) {
            if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
                return "مهلت زمان برقراری ارتباط با سرور به پایان رسید. لطفاً مجدداً تلاش نمایید.";
            }
            return "خطا در برقراری ارتباط با سرور. لطفاً اتصال اینترنت خود را بررسی نمایید.";
        }

        const data = error.response.data;

        // Structured JSON API error contract
        if (data && typeof data === "object") {
            const apiData = data as ApiErrorResponse;

            // 1. Nested backend error model: { error: { message, details } }
            if (apiData.error && typeof apiData.error === "object") {
                // First field-level validation message if present
                if (apiData.error.details && apiData.error.details.length > 0) {
                    const firstDetail = apiData.error.details[0];
                    if (firstDetail?.message) {
                        return firstDetail.message;
                    }
                }

                // General error message from backend catalog
                if (apiData.error.message) {
                    return apiData.error.message;
                }
            } else if (typeof apiData.error === "string" && apiData.error) {
                return apiData.error;
            }

            // 2. Legacy / Standard message fields
            if (apiData.message) {
                if (Array.isArray(apiData.message) && apiData.message.length > 0) {
                    return String(apiData.message[0]);
                }
                if (typeof apiData.message === "string") {
                    return apiData.message;
                }
            }
        }

        // Status code fallbacks when body contains no structured message
        const status = error.response.status;
        if (status === 401) {
            return "نشست کاربری شما معتبر نیست. لطفاً مجدداً وارد حساب کاربری خود شوید.";
        }
        if (status === 403) {
            return "شما دسترسی لازم برای انجام این عملیات را ندارید.";
        }
        if (status === 404) {
            return "موجودیت یا منبع درخواستی در سامانه یافت نشد.";
        }
        if (status === 429) {
            return "تعداد درخواست‌های ارسالی بیش از حد مجاز است. لطفاً کمی صبر کرده و سپس مجدداً تلاش کنید.";
        }
        if (status >= 500) {
            return "خطایی در سرور رخ داده است. لطفاً کمی بعد مجدداً تلاش فرمایید.";
        }
    }

    if (error instanceof Error && error.message) {
        // Only return if it's already a Persian message (e.g. from local validation)
        if (/[\u0600-\u06FF]/.test(error.message)) {
            return error.message;
        }
    }

    return fallbackMessage;
}

/**
 * Backward compatible alias
 */
export const translateApiErrorMessage = (msg: string): string => msg;
