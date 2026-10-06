import api from "@/lib/api/client";
import {
    ChargeWalletRequest,
    ChargeWalletResponse,
    InitiateTopUpRequest,
    InitiateTopUpResponse,
    PaginatedTransactionsResponse,
    PaymentStatusResponse,
    WalletBalance
} from "@/types/api/wallet.types";

export const walletService = {
    getBalance: async (): Promise<WalletBalance> => {
        const { data } = await api.get<WalletBalance>("/wallet/balance");
        return data;
    },

    getTransactions: async (page = 1, limit = 10): Promise<PaginatedTransactionsResponse> => {
        const { data } = await api.get<PaginatedTransactionsResponse>("/wallet/transactions", {
            params: { page, limit }
        });
        return data;
    },

    initiateTopUp: async (payload: InitiateTopUpRequest): Promise<InitiateTopUpResponse> => {
        const { data } = await api.post<InitiateTopUpResponse>("/wallet/top-up/initiate", payload);
        return data;
    },

    getPaymentStatus: async (purchaseId: string): Promise<PaymentStatusResponse> => {
        const { data } = await api.get<PaymentStatusResponse>("/wallet/payments/status", {
            params: { purchaseId },
        });
        return data;
    },

    chargeWallet: async (payload: ChargeWalletRequest): Promise<ChargeWalletResponse> => {
        const { data } = await api.post<ChargeWalletResponse>("/wallet/charge", payload);
        return data;
    }
};
