"use client";

import { useAuth } from "@/hooks/useAuth";
import { useMeProfile } from "@/hooks/useUser";
import { Permission, RoleName, tryRoleNameFrom } from "@/types/access";
import React from "react";

interface RoleGuardProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
    roles?: RoleName[];
    permissions?: Permission[];
    requireActiveRole?: boolean;
}

/**
 * RoleGuard Component
 * 
 * Conditionally renders children based on the user's active role, assigned roles, or permissions.
 * 
 * Usage:
 * <RoleGuard roles={[RoleName.Admin]}>
 *   <AdminDashboard />
 * </RoleGuard>
 */
export const RoleGuard: React.FC<RoleGuardProps> = ({
    children,
    fallback = null,
    roles,
    permissions,
    requireActiveRole = false,
}) => {
    const { isLoggedIn, activeRole, hasPermission, isLoading } = useAuth();
    const { data: profile } = useMeProfile();

    if (isLoading) {
        return null; // Or a skeleton/loading spinner
    }

    if (!isLoggedIn) {
        return <>{fallback}</>;
    }

    // Check permissions if provided
    if (permissions && permissions.length > 0) {
        const hasAllPermissions = permissions.every(p => hasPermission(p));
        if (!hasAllPermissions) {
            return <>{fallback}</>;
        }
    }

    // Check roles if provided
    if (roles && roles.length > 0) {
        const hasActiveRole = activeRole && roles.includes(activeRole);
        const hasAssignedRole = !requireActiveRole && profile?.roles?.some((r) => {
            const parsed = tryRoleNameFrom(r);
            return parsed && roles.includes(parsed);
        });

        if (!hasActiveRole && !hasAssignedRole) {
            return <>{fallback}</>;
        }
    }

    return <>{children}</>;
};
