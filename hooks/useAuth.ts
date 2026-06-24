import { authService } from "@/services/auth.service";
import { Permission, ROLE_PERMISSIONS, RoleName } from "@/types/access";
import { JwtPayload } from "@/types/api/auth.types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteCookie, getCookie, setCookie } from "cookies-next";
import { jwtDecode } from "jwt-decode";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export function useRequestOtp() {
    return useMutation({
        mutationFn: authService.requestOtp,
    });
}

export function useVerifyOtp() {
    const router = useRouter();

    return useMutation({
        mutationFn: authService.verifyOtp,
        onSuccess: (data) => {
            // Store tokens in cookies
            setCookie("access_token", data.accessToken, { maxAge: data.expiresIn });
            setCookie("refresh_token", data.refreshToken, { maxAge: 30 * 24 * 60 * 60 }); // 30 days

            // Redirect to home or profile
            router.push("/");
        },
    });
}

export function useLogout() {
    const router = useRouter();

    const logout = () => {
        deleteCookie("access_token");
        deleteCookie("refresh_token");
        router.push("/auth");
    };

    return { logout };
}

export function useSwitchRole() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: authService.switchRole,
        onSuccess: (data) => {
            // Switching role usually requires a new token from the backend or 
            // the backend returns a new token pair. 
            // Based on SwitchActiveRoleResponse, it doesn't return tokens.
            // This suggests the backend might expect the client to refresh 
            // or the switchRole endpoint should return new tokens.
            // Let's assume for now we need to refetch or the backend handles it.
            // Actually, the backend SwitchActiveRoleUseCase returns sessionId and activeRoleId.
            // In a real scenario, it should return new tokens.
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
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const checkAuth = useCallback(() => {
        const token = getCookie("access_token");
        if (token && typeof token === "string") {
            try {
                const decoded = jwtDecode<JwtPayload>(token);
                setUser({
                    userId: decoded.sub,
                    sessionId: decoded.sessionId,
                    activeRole: decoded.activeRoleName as RoleName | null
                });
            } catch (e) {
                console.error("Failed to decode token", e);
                setUser(null);
            }
        } else {
            setUser(null);
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    const hasPermission = (permission: Permission): boolean => {
        if (!user?.activeRole) return false;
        const permissions = ROLE_PERMISSIONS[user.activeRole] || [];
        return permissions.includes(permission);
    };

    const hasRole = (role: RoleName): boolean => {
        return user?.activeRole === role;
    };

    return {
        user,
        activeRole: user?.activeRole,
        isLoggedIn: !!user,
        isLoading,
        hasPermission,
        hasRole,
        refresh: checkAuth
    };
}

