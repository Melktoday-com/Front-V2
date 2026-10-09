import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tariffService, TariffDetail } from "@/services/tariff.service";

export const tariffQueryKeys = {
    all: ["tariffs"] as const,
    adminAll: ["tariffs", "admin"] as const,
};

export function useTariffs() {
    return useQuery<TariffDetail[]>({
        queryKey: tariffQueryKeys.all,
        queryFn: () => tariffService.getAll(),
        staleTime: 60 * 1000,
    });
}

export function useAdminTariffs() {
    return useQuery<TariffDetail[]>({
        queryKey: tariffQueryKeys.adminAll,
        queryFn: () => tariffService.getAdminAll(),
        staleTime: 30 * 1000,
    });
}

export function useUpdateTariff() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            key,
            amountIrr,
            isEnabled,
        }: {
            key: string;
            amountIrr: string;
            isEnabled?: boolean;
        }) => tariffService.updateTariff(key, amountIrr, isEnabled),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: tariffQueryKeys.all });
            queryClient.invalidateQueries({ queryKey: tariffQueryKeys.adminAll });
        },
    });
}

export function useUpdateAllTariffs() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (
            tariffs: Array<{ key: string; amountIrr: string; isEnabled?: boolean }>,
        ) => tariffService.updateAll(tariffs),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: tariffQueryKeys.all });
            queryClient.invalidateQueries({ queryKey: tariffQueryKeys.adminAll });
        },
    });
}
