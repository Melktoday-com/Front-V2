export interface WalletBalance {
    userId: string;
    walletId: string;
    balance: number;
    currency: string;
}

import { JsonObject } from "../common";

export interface ChargeWalletRequest {
    amount: number;
    currency: string;
    idempotencyKey: string;
    reason: string;
    metadata?: JsonObject;
}

export interface ChargeWalletResponse {
    success: boolean;
    walletId: string;
    transactionId: string;
    newBalance: number;
    currency: string;
}

import { TransactionStatus, TransactionType } from "./enums";

export interface WalletTransaction {
    id: string;
    amount: number;
    type: TransactionType;
    status: TransactionStatus;
    reason: string;
    createdAt: string;
    currency: string;
}

export interface PaginatedTransactionsResponse {
    items: WalletTransaction[];
    total: number;
    page: number;
    limit: number;
}
