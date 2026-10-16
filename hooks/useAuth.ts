import { clearAuthTokens, refreshAuthTokens, storeAuthTokens } from "@/lib/api/token-manager";
import { authService } from "@/services/auth.service";
import { Permission, ROLE_PERMISSIONS, RoleName, tryRoleNameFrom } from "@/types/access";
import { JwtPayload } from "@/types/api/auth.types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getCookie } from "cookies-next";
import { jwtDecode } from "jwt-decode";
import { useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";

export function useRequestOtp() {
    return useMutation({
        mutationFn: authService.requestOtp,
    });
}

export function useVerifyOtp(redirectTarget?: string) {
    const router = useRouter();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: authService.verifyOtp,
        onSuccess: (data) => {
            // Store tokens in cookies
            storeAuthTokens({
                accessToken: data.accessToken,
                refreshToken: data.refreshToken,
                expiresIn: data.expiresIn,
            });

            try {
                const decoded = jwtDecode<JwtPayload>(data.accessToken);
                queryClient.setQueryData(["auth-session"], {
                    userId: decoded.sub,
                    sessionId: decoded.sessionId,
                    activeRole: tryRoleNameFrom(decoded.activeRoleName),
                });
            } catch (e) {
                console.error("Failed to decode token on verify", e);
            }

            // Invalidate auth session and user caches
            queryClient.invalidateQueries({ queryKey: ["auth-session"] });
            queryClient.invalidateQueries({ queryKey: ["user"] });
            queryClient.invalidateQueries({ queryKey: ["me"] });

            // Redirect to target or home
            router.replace(redirectTarget || "/");
        },
    });
}

export function useLogout() {
    const router = useRouter();
    const queryClient = useQueryClient();

    const logout = useCallback(async () => {
        try {
            const token = getCookie("access_token");
            if (token && typeof token === "string") {
                const decoded = jwtDecode<JwtPayload>(token);
                if (decoded?.sessionId) {
                    await authService.terminateSession({ sessionId: decoded.sessionId });
                }
            }
        } catch (e) {
            console.error("Session termination error:", e);
        }

        clearAuthTokens();

        // Immediately update auth-session cache so all components know the user is logged out
        queryClient.setQueryData(["auth-session"], null);

        // Cancel all active queries and clear query cache to avoid refetching user data
        queryClient.cancelQueries();
        queryClient.clear();

        router.push("/auth");
    }, [router, queryClient]);

    return { logout };
}

export function useSwitchRole() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: authService.switchRole,
        onSuccess: (data) => {
            if (data.accessToken) {
                storeAuthTokens({
                    accessToken: data.accessToken,
                    refreshToken: data.refreshToken,
                    expiresIn: data.expiresIn,
                });

                try {
                    const decoded = jwtDecode<JwtPayload>(data.accessToken);
                    queryClient.setQueryData(["auth-session"], {
                        userId: decoded.sub,
                        sessionId: decoded.sessionId,
                        activeRole: tryRoleNameFrom(decoded.activeRoleName),
                    });
                } catch (e) {
                    console.error("Failed to decode switched token", e);
                }
            }
            queryClient.cancelQueries();
            queryClient.invalidateQueries({ queryKey: ["auth-session"] });
            queryClient.invalidateQueries({ queryKey: ["user"] });
            queryClient.invalidateQueries({ queryKey: ["me"] });
            queryClient.invalidateQueries({ queryKey: ["my-agency"] });
            queryClient.invalidateQueries({ queryKey: ["hosts"] });
        },
    });
}

interface AuthUser {
    userId: string;
    sessionId: string;
    activeRole: RoleName | null;
}

export function useAuth() {
    const queryClient = useQueryClient();

    const { data: user, isLoading, refetch } = useQuery({
        queryKey: ["auth-session"],
        queryFn: async (): Promise<AuthUser | null> => {
            const rawToken = getCookie("access_token");
            const token = typeof rawToken === "string" ? rawToken : undefined;

            if (token) {
                try {
                    const decoded = jwtDecode<JwtPayload>(token);
                    // Check if access token is still valid for at least 15 more seconds
                    if (decoded.exp && decoded.exp * 1000 > Date.now() + 15_000) {
                        return {
                            userId: decoded.sub,
                            sessionId: decoded.sessionId,
                            activeRole: tryRoleNameFrom(decoded.activeRoleName),
                        };
                    }
                } catch (e) {
                    console.error("Failed to decode access token", e);
                }
            }

            // Access token missing or expired; attempt recovery via refresh token
            const rawRefreshToken = getCookie("refresh_token");
            const refreshToken = typeof rawRefreshToken === "string" ? rawRefreshToken : undefined;

            if (refreshToken) {
                try {
                    const newAccessToken = await refreshAuthTokens();
                    if (newAccessToken) {
                        const decoded = jwtDecode<JwtPayload>(newAccessToken);
                        return {
                            userId: decoded.sub,
                            sessionId: decoded.sessionId,
                            activeRole: tryRoleNameFrom(decoded.activeRoleName),
                        };
                    }
                } catch (e) {
                    console.error("Silent session recovery failed in useAuth", e);
                }
            }

            return null;
        },
        staleTime: 60 * 1000,
        refetchOnWindowFocus: true,
    });

    // Proactive background refresh timer and cross-window sync
    useEffect(() => {
        if (typeof window === "undefined") return;

        const handleTokenRefreshed = () => {
            queryClient.invalidateQueries({ queryKey: ["auth-session"] });
        };

        const handleSessionExpired = () => {
            queryClient.setQueryData(["auth-session"], null);
        };

        window.addEventListener("auth:token-refreshed", handleTokenRefreshed);
        window.addEventListener("auth:session-expired", handleSessionExpired);

        const rawToken = getCookie("access_token");
        const token = typeof rawToken === "string" ? rawToken : undefined;

        let timeoutId: ReturnType<typeof setTimeout> | undefined;

        if (token) {
            try {
                const decoded = jwtDecode<JwtPayload>(token);
                if (decoded.exp) {
                    const msUntilExpiry = decoded.exp * 1000 - Date.now();
                    // Schedule refresh 60 seconds before expiration, minimum 5 seconds
                    const delay = Math.max(msUntilExpiry - 60_000, 5_000);

                    timeoutId = setTimeout(async () => {
                        const refreshed = await refreshAuthTokens();
                        if (refreshed) {
                            queryClient.invalidateQueries({ queryKey: ["auth-session"] });
                        }
                    }, delay);
                }
            } catch {}
        }

        return () => {
            window.removeEventListener("auth:token-refreshed", handleTokenRefreshed);
            window.removeEventListener("auth:session-expired", handleSessionExpired);
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [user, queryClient]);

    const hasPermission = (permission: Permission): boolean => {
        if (!user?.activeRole) return false;
        const permissions = ROLE_PERMISSIONS[user.activeRole] || [];
        return permissions.includes(permission);
    };

    const hasRole = (role: RoleName): boolean => {
        return user?.activeRole === role;
    };

    return {
        user: user ?? null,
        activeRole: user?.activeRole,
        isLoggedIn: !!user,
        isLoading,
        hasPermission,
        hasRole,
        refresh: refetch,
    };
}
