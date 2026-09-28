import { useQuery } from "@tanstack/react-query";
import { adminService } from "@/services/admin.service";
import { useAuth } from "./useAuth";
import { RoleName } from "@/types/access";

export function useAdminPermissions() {
    const { user, activeRole, isLoggedIn } = useAuth();
    const isAdminOrSuper =
        activeRole === RoleName.Admin ||
        activeRole === RoleName.SuperAdmin ||
        (activeRole as string) === 'super_admin';

    const {
        data: permissionsData,
        isLoading,
        refetch,
    } = useQuery({
        queryKey: ["admin-my-permissions", user?.userId, activeRole],
        queryFn: () => adminService.getMyPermissions(),
        enabled: isLoggedIn && isAdminOrSuper,
        staleTime: 60 * 1000,
    });

    const isSuperAdmin =
        activeRole === RoleName.SuperAdmin ||
        (activeRole as string) === 'super_admin' ||
        permissionsData?.isSuperAdmin === true;

    const permissions = permissionsData?.permissions || [];

    const hasPermission = (perm: string): boolean => {
        if (!isLoggedIn || !isAdminOrSuper) return false;
        if (isSuperAdmin) return true;
        if (permissions.includes("*")) return true;
        return permissions.includes(perm);
    };

    const hasAnyPermission = (perms: string[]): boolean => {
        if (!isLoggedIn || !isAdminOrSuper) return false;
        if (isSuperAdmin) return true;
        if (permissions.includes("*")) return true;
        return perms.some((p) => permissions.includes(p));
    };

    return {
        isSuperAdmin,
        permissions,
        isLoading,
        hasPermission,
        hasAnyPermission,
        refetchPermissions: refetch,
    };
}
