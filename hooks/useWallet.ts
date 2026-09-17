import { walletService } from "@/services/wallet.service";
import { ChargeWalletRequest } from "@/types/api/wallet.types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useWalletBalance() {
    return useQuery({
        queryKey: ["wallet", "balance"],
        queryFn: () => walletService.getBalance(),
    });
}

export function useWalletTransactions(page = 1, limit = 10) {
    return useQuery({
        queryKey: ["wallet", "transactions", page, limit],
        queryFn: () => walletService.getTransactions(page, limit),
    });
}

export function useChargeWallet() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: ChargeWalletRequest) => walletService.chargeWallet(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["wallet"] });
        },
    });
}

// Composite hook used by scenes/profile/index.tsx
export function useWallet() {
    const balanceQuery = useWalletBalance();
    return {
        balance: balanceQuery.data,
        isLoadingBalance: balanceQuery.isLoading,
        isErrorBalance: balanceQuery.isError,
        refetchBalance: balanceQuery.refetch,
    };
}
