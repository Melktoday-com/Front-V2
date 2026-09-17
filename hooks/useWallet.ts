import { walletService } from "@/services/wallet.service";
import { ChargeWalletRequest } from "@/types/api/wallet.types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./useAuth";

export function useWalletBalance() {
    const { isLoggedIn } = useAuth();

    return useQuery({
        queryKey: ["wallet", "balance"],
        queryFn: () => walletService.getBalance(),
        enabled: isLoggedIn,
    });
}

export function useWalletTransactions(page = 1, limit = 10) {
    const { isLoggedIn } = useAuth();

    return useQuery({
        queryKey: ["wallet", "transactions", page, limit],
        queryFn: () => walletService.getTransactions(page, limit),
        enabled: isLoggedIn,
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
