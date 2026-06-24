"use client";

import { Permission, RoleName } from "@/types/access";
import { useAuth } from "./useAuth";

/**
 * usePermission custom hook
 * 
 * Provides a simple way to check for permissions or roles in components.
 */
export function usePermission() {
    const { hasPermission, hasRole, activeRole, isLoggedIn } = useAuth();

    return {
        can: (permission: Permission) => hasPermission(permission),
        is: (role: RoleName) => hasRole(role),
        activeRole,
        isLoggedIn
    };
}
