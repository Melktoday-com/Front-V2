import { useQuery } from "@tanstack/react-query";
import { adminService } from "@/services/admin.service";
import { useAuth } from "./useAuth";
import { RoleName, isRoleAdmin, isRoleSuperAdmin } from "@/types/access";

/**
 * useAdminPermissions Hook
 *
 * Single Source of Truth on frontend for administrative permissions.
 * Fetches authoritative permissions directly from PostgreSQL via /admin/me/permissions.
 */
export function useAdminPermissions() {
    const { user, activeRole, isLoggedIn } = useAuth();

    const {
        data: permissionsData,
        isLoading,
        refetch,
    } = useQuery({
        queryKey: ["admin-my-permissions", user?.userId],
        queryFn: () => adminService.getMyPermissions(),
        enabled: isLoggedIn,
        staleTime: 30 * 1000,
        retry: false,
    });

    const isSuperAdmin =
        isRoleSuperAdmin(activeRole) ||
        permissionsData?.isSuperAdmin === true ||
        permissionsData?.role === RoleName.SuperAdmin;

    const isAdminOrSuper =
        isRoleAdmin(activeRole) ||
        isSuperAdmin ||
        permissionsData?.role === RoleName.Admin;

    const permissions = permissionsData?.permissions || [];

    const hasPermission = (perm: string): boolean => {
        if (!isLoggedIn) return false;
        if (isSuperAdmin) return true;
        if (permissions.includes("*")) return true;
        return permissions.includes(perm);
    };

    const hasAnyPermission = (perms: string[]): boolean => {
        if (!isLoggedIn) return false;
        if (isSuperAdmin) return true;
        if (permissions.includes("*")) return true;
        return perms.some((p) => permissions.includes(p));
    };

    return {
        isSuperAdmin,
        isAdminOrSuper,
        permissions,
        isLoading,
        hasPermission,
        hasAnyPermission,
        refetchPermissions: refetch,
    };
}
