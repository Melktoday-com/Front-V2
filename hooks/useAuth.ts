import { authService } from "@/services/auth.service";
import { Permission, ROLE_PERMISSIONS, RoleName } from "@/types/access";
import { JwtPayload } from "@/types/api/auth.types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteCookie, getCookie, setCookie } from "cookies-next";
import { jwtDecode } from "jwt-decode";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

export function useRequestOtp() {
    return useMutation({
        mutationFn: authService.requestOtp,
    });
}

export function useVerifyOtp() {
    const router = useRouter();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: authService.verifyOtp,
        onSuccess: (data) => {
            // Store tokens in cookies
            setCookie("access_token", data.accessToken, { maxAge: data.expiresIn });
            setCookie("refresh_token", data.refreshToken, { maxAge: 30 * 24 * 60 * 60 }); // 30 days

            // Invalidate auth session to update all components
            queryClient.invalidateQueries({ queryKey: ["auth-session"] });

            // Redirect to home or profile
            router.push("/");
        },
    });
}

export function useLogout() {
    const router = useRouter();
    const queryClient = useQueryClient();

    const logout = useCallback(() => {
        deleteCookie("access_token");
        deleteCookie("refresh_token");

        // Invalidate auth session to update all components
        queryClient.invalidateQueries({ queryKey: ["auth-session"] });

        router.push("/auth");
    }, [router, queryClient]);

    return { logout };
}

export function useSwitchRole() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: authService.switchRole,
        onSuccess: (data) => {
            // ... existing comments
            queryClient.invalidateQueries({ queryKey: ["auth-session"] });
            queryClient.invalidateQueries({ queryKey: ["user"] });
        }
    });
}

interface AuthUser {
    userId: string;
    sessionId: string;
    activeRole: RoleName | null;
}

export function useAuth() {
    const { data: user, isLoading, refetch } = useQuery({
        queryKey: ["auth-session"],
        queryFn: (): AuthUser | null => {
            const token = getCookie("access_token");
            if (token && typeof token === "string") {
                try {
                    const decoded = jwtDecode<JwtPayload>(token);
                    return {
                        userId: decoded.sub,
                        sessionId: decoded.sessionId,
                        activeRole: decoded.activeRoleName as RoleName | null
                    };
                } catch (e) {
                    console.error("Failed to decode token", e);
                    return null;
                }
            }
            return null;
        },
        staleTime: Infinity,
    });

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
        refresh: refetch
    };
}

