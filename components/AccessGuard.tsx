"use client";

import { useAuth } from "@/hooks/useAuth";
import { Permission, RoleName } from "@/types/access";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

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
    const { isLoggedIn, activeRole, hasPermission, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        // Wait for auth to finish loading
        if (isLoading) return;

        // If not logged in, go to auth page
        if (!isLoggedIn) {
            router.push("/auth");
            return;
        }

        // Check if user has required roles
        if (roles && roles.length > 0) {
            if (!activeRole || !roles.includes(activeRole)) {
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
    }, [isLoggedIn, activeRole, hasPermission, isLoading, router, roles, permissions, redirectTo]);

    // Show nothing (or a loader) while checking or redirecting
    if (isLoading) {
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
