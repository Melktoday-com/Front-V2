export interface WalletBalance {
    userId: string;
    walletId: string;
    balance: number;
    currency: string;
    heldAmount?: number;
    availableBalance?: number;
}

import { JsonObject } from "../common";

export interface InitiateTopUpRequest {
    amountIRR: number;
    callbackUrl: string;
    idempotencyKey: string;
}

export interface InitiateTopUpResponse {
    purchaseId: string;
    paymentUrl: string;
    walletId: string;
    amountIRR: number;
}

export interface PaymentStatusResponse {
    purchaseId: string;
    status: string;
    amountIRR: number;
    rrn?: string | null;
}

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
    transactions?: WalletTransaction[];
    items?: WalletTransaction[];
    total: number;
    page: number;
    limit: number;
    totalPages?: number;
}
