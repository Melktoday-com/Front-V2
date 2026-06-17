import { useAuth } from "@/hooks/useAuth";
import { walletService } from "@/services/wallet.service";
import { ChargeWalletRequest } from "@/types/api/wallet.types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useWallet() {
    const queryClient = useQueryClient();
    const { isLoggedIn } = useAuth();

    const balanceQuery = useQuery({
        queryKey: ["wallet-balance"],
        queryFn: walletService.getBalance,
        enabled: isLoggedIn,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    const transactionsQuery = (page = 1, limit = 10) => useQuery({
        queryKey: ["wallet-transactions", page, limit],
        queryFn: () => walletService.getTransactions(page, limit),
        enabled: isLoggedIn,
    });

    const chargeMutation = useMutation({
        mutationFn: (payload: ChargeWalletRequest) => walletService.chargeWallet(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["wallet-balance"] });
            queryClient.invalidateQueries({ queryKey: ["wallet-transactions"] });
        },
    });

    return {
        balance: balanceQuery.data,
        isLoadingBalance: balanceQuery.isLoading,
        balanceError: balanceQuery.error,

        getTransactions: transactionsQuery,

        chargeWallet: chargeMutation.mutate,
        isCharging: chargeMutation.isPending,
        chargeError: chargeMutation.error,
        chargeSuccess: chargeMutation.isSuccess,
    };
}
