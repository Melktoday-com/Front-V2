"use client";

import { useAuth } from "@/hooks/useAuth";
import { Permission, RoleName } from "@/types/access";
import { authService } from "@/services/auth.service";
import { setCookie } from "cookies-next";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

interface AccessGuardProps {
    children: React.ReactNode;
    roles?: RoleName[];
    permissions?: Permission[];
    redirectTo?: string;
}

/**
 * AccessGuard Component
 * 
 * Handles page-level access control. 
 * If the user is not logged in, it redirects to the auth page.
 * If the user lacks the required roles or permissions, it redirects to the home page (or specified redirectTo).
 * 
 * Usage:
 * <AccessGuard roles={[RoleName.Admin]}>
 *   <AdminPanel />
 * </AccessGuard>
 */
export const AccessGuard: React.FC<AccessGuardProps> = ({
    children,
    roles,
    permissions,
    redirectTo = "/",
}) => {
    const { user, isLoggedIn, activeRole, hasPermission, isLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [isSwitchingRole, setIsSwitchingRole] = useState(false);

    useEffect(() => {
        // Wait for auth to finish loading or active switch operation
        if (isLoading || isSwitchingRole) return;

        // If not logged in, go to auth page with return redirect
        if (!isLoggedIn) {
            toast.info("برای دسترسی به این بخش، لطفاً ابتدا وارد حساب کاربری خود شوید.");
            const redirectUrl = pathname ? `/auth?redirect=${encodeURIComponent(pathname)}` : "/auth";
            router.push(redirectUrl);
            return;
        }

        // Check if user has required roles
        if (roles && roles.length > 0) {
            const hasRequiredRole = activeRole && roles.includes(activeRole);
            if (!hasRequiredRole) {
                // If the required roles include Admin or SuperAdmin and user is logged in,
                // try to switch role in case they were recently granted Admin access in DB.
                const requiresAdmin = roles.includes(RoleName.Admin) || roles.includes(RoleName.SuperAdmin);
                if (requiresAdmin && user?.sessionId) {
                    setIsSwitchingRole(true);
                    authService.switchRole({
                        sessionId: user.sessionId,
                        roleName: RoleName.Admin,
                    }).then((data) => {
                        if (data.accessToken) {
                            setCookie("access_token", data.accessToken, { maxAge: data.expiresIn });
                            if (data.refreshToken) {
                                setCookie("refresh_token", data.refreshToken, { maxAge: 30 * 24 * 60 * 60 });
                            }
                            window.location.reload();
                        } else {
                            router.push(redirectTo);
                        }
                    }).catch(() => {
                        router.push(redirectTo);
                    }).finally(() => {
                        setIsSwitchingRole(false);
                    });
                    return;
                }

                router.push(redirectTo);
                return;
            }
        }

        // Check if user has required permissions
        if (permissions && permissions.length > 0) {
            const hasAllPermissions = permissions.every(p => hasPermission(p));
            if (!hasAllPermissions) {
                router.push(redirectTo);
                return;
            }
        }
    }, [isLoggedIn, activeRole, hasPermission, isLoading, router, roles, permissions, redirectTo, isSwitchingRole, user?.sessionId, pathname]);

    // Show loading spinner while checking, redirecting, or switching roles
    if (isLoading || isSwitchingRole) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
        );
    }

    if (!isLoggedIn) {
        return null;
    }

    if (roles && roles.length > 0) {
        if (!activeRole || !roles.includes(activeRole)) {
            return null;
        }
    }

    if (permissions && permissions.length > 0) {
        const hasAllPermissions = permissions.every(p => hasPermission(p));
        if (!hasAllPermissions) {
            return null;
        }
    }

    return <>{children}</>;
};
