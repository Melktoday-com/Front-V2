"use client";

import { useAuth } from "@/hooks/useAuth";
import { Permission, RoleName } from "@/types/access";
import React from "react";

interface RoleGuardProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
    roles?: RoleName[];
    permissions?: Permission[];
}

/**
 * RoleGuard Component
 * 
 * Conditionally renders children based on the user's active role or permissions.
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
    permissions
}) => {
    const { isLoggedIn, activeRole, hasPermission, isLoading } = useAuth();

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
        if (!activeRole || !roles.includes(activeRole)) {
            return <>{fallback}</>;
        }
    }

    return <>{children}</>;
};
