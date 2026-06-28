export enum UserStatus {
    ACTIVE = 'Active',
    INACTIVE = 'Inactive',
    BLOCKED = 'Blocked',
    DELETED = 'Deleted',
}

export enum KYCStatus {
    PENDING = 'pending',
    IN_PROGRESS = 'in_progress',
    VERIFIED = 'verified',
    REJECTED = 'rejected',
}

export enum AdStatus {
    DRAFT = 'DRAFT',
    PENDING_APPROVAL = 'PENDING_APPROVAL',
    PUBLISHED = 'PUBLISHED',
    ARCHIVED = 'ARCHIVED',
    REJECTED = 'REJECTED',
    DELETED = 'DELETED',
}

export enum PromotionStatus {
    DRAFT = 'DRAFT',
    PENDING_REVIEW = 'PENDING_REVIEW',
    APPROVED = 'APPROVED',
    ACTIVE = 'ACTIVE',
    PAUSED = 'PAUSED',
    EXPIRED = 'EXPIRED',
    REJECTED = 'REJECTED',
    CANCELLED = 'CANCELLED',
}

export enum PromotionType {
    PIN = 'PIN',
    LADDER = 'LADDER',
    URGENT_TAG = 'URGENT_TAG',
    BANNER = 'BANNER',
}

export enum ReportStatus {
    PENDING = 'PENDING',
    RESOLVED = 'RESOLVED',
    DISMISSED = 'DISMISSED',
}

export enum ReportTargetType {
    LISTING = 'listing',
    USER = 'user',
    REVIEW = 'review',
    MESSAGE = 'message',
}

export enum TransactionStatus {
    PENDING = 'pending',
    COMPLETED = 'completed',
    FAILED = 'failed',
    CANCELLED = 'cancelled',
}

export enum TransactionType {
    CREDIT = 'credit',
    DEBIT = 'debit',
    TRANSFER = 'transfer',
    REFUND = 'refund',
}
