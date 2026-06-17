import api from "@/lib/api/client";
import {
    ChargeWalletRequest,
    ChargeWalletResponse,
    PaginatedTransactionsResponse,
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

    chargeWallet: async (payload: ChargeWalletRequest): Promise<ChargeWalletResponse> => {
        const { data } = await api.post<ChargeWalletResponse>("/wallet/charge", payload);
        return data;
    }
};
