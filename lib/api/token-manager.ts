import axios, { AxiosError } from "axios";
import { deleteCookie, getCookie, setCookie } from "cookies-next";

export function getClientApiUrl(): string {
    let url = process.env.NEXT_PUBLIC_API_URL || "";
    if (!url && typeof window !== "undefined") {
        return `${window.location.origin}/backend/api`;
    }
    url = (url || "http://localhost:3000/api").trim().replace(/\/+$/, "");

    if (url.includes("109.122.254.238")) {
        url = url.replace(/https?:\/\/109\.122\.254\.238(:\d+)?/, "https://melktoday.com");
    }

    if (!url.endsWith("/api") && !url.includes("/api/")) {
        url = `${url}/backend/api`;
    }

    if (typeof window !== "undefined" && window.location.protocol === "https:" && url.startsWith("http:")) {
        url = url.replace(/^http:/, "https:");
    }

    return url;
}

export interface StoreTokensParams {
    accessToken: string;
    refreshToken?: string;
    expiresIn?: number;
}

/**
 * Stores authentication tokens into cookies with standard options.
 */
export function storeAuthTokens({ accessToken, refreshToken, expiresIn }: StoreTokensParams) {
    const isHttps = typeof window !== "undefined" && window.location.protocol === "https:";

    // Access token maxAge: at least 15 minutes or backend expiresIn
    const accessMaxAge = expiresIn && expiresIn > 0 ? expiresIn : 900;
    setCookie("access_token", accessToken, {
        maxAge: accessMaxAge,
        path: "/",
        sameSite: "lax",
        secure: isHttps,
    });

    // Refresh token lasts 30 days
    if (refreshToken) {
        setCookie("refresh_token", refreshToken, {
            maxAge: 30 * 24 * 60 * 60,
            path: "/",
            sameSite: "lax",
            secure: isHttps,
        });
    }
}

/**
 * Clears authentication tokens from cookies with explicit path.
 */
export function clearAuthTokens() {
    deleteCookie("access_token", { path: "/" });
    deleteCookie("refresh_token", { path: "/" });
}

let refreshPromise: Promise<string | null> | null = null;

/**
 * Refreshes auth tokens using refresh_token cookie.
 * Deduplicates concurrent requests using a singleton promise.
 * Only invalidates session if the server responds with 401 or 403.
 */
export async function refreshAuthTokens(): Promise<string | null> {
    if (refreshPromise) {
        return refreshPromise;
    }

    const rawRefreshToken = getCookie("refresh_token");
    const refreshToken = typeof rawRefreshToken === "string" ? rawRefreshToken : undefined;

    if (!refreshToken) {
        return null;
    }

    const apiUrl = getClientApiUrl();

    refreshPromise = (async () => {
        try {
            const response = await axios.post(
                `${apiUrl}/auth/refresh`,
                { refreshToken },
                {
                    timeout: 12000,
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );

            const body = response.data;
            const data = body && typeof body === "object" && "data" in body ? body.data : body;

            if (!data || typeof data !== "object" || !data.accessToken) {
                throw new Error("Invalid token refresh payload structure");
            }

            const accessToken = data.accessToken as string;
            const newRefreshToken = (data.refreshToken as string) || refreshToken;
            const expiresIn = typeof data.expiresIn === "number" ? data.expiresIn : 900;

            storeAuthTokens({
                accessToken,
                refreshToken: newRefreshToken,
                expiresIn,
            });

            if (typeof window !== "undefined") {
                window.dispatchEvent(
                    new CustomEvent("auth:token-refreshed", {
                        detail: { accessToken },
                    })
                );
            }

            return accessToken;
        } catch (error) {
            const axiosErr = error as AxiosError;
            const status = axiosErr?.response?.status;

            // ONLY clear cookies and redirect if the refresh token was explicitly rejected by the server
            if (status === 401 || status === 403) {
                clearAuthTokens();
                if (typeof window !== "undefined") {
                    window.dispatchEvent(new CustomEvent("auth:session-expired"));
                    if (!window.location.pathname.startsWith("/auth")) {
                        window.location.href = "/auth";
                    }
                }
            }
            // For network errors or 5xx server issues, keep the refresh token intact
            return null;
        } finally {
            refreshPromise = null;
        }
    })();

    return refreshPromise;
}
