import { adminService } from "@/services/admin.service";
import { useQuery } from "@tanstack/react-query";

export function useAdminUsers(params: { page?: number; limit?: number }) {
    return useQuery({
        queryKey: ["admin", "users", params],
        queryFn: () => adminService.listUsers(params),
    });
}

export function useModerationHistory(userId: string) {
    return useQuery({
        queryKey: ["admin", "users", userId, "history"],
        queryFn: () => adminService.getModerationHistory(userId),
        enabled: !!userId,
    });
}

export function useGeoZones(zoneType: string) {
    return useQuery({
        queryKey: ["admin", "geo", zoneType],
        queryFn: () => adminService.listGeoZones(zoneType),
    });
}
