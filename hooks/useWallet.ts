import { walletService } from "@/services/wallet.service";
import {
    ChargeWalletRequest,
    InitiateTopUpRequest,
} from "@/types/api/wallet.types";
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

export function useInitiateTopUp() {
    return useMutation({
        mutationFn: (payload: InitiateTopUpRequest) => walletService.initiateTopUp(payload),
    });
}

export function usePaymentStatus(purchaseId?: string) {
    return useQuery({
        queryKey: ["wallet", "payment-status", purchaseId],
        queryFn: () => walletService.getPaymentStatus(purchaseId!),
        enabled: !!purchaseId,
        refetchInterval: (query) => {
            const status = query.state.data?.status;
            return status === "PENDING" ? 2000 : false;
        },
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
