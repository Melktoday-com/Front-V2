export interface RequestUploadUrlRequest {
    mediaType: "IMAGE" | "VIDEO" | "DOCUMENT";
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    visibility?: "PUBLIC" | "PRIVATE";
}

export interface UploadUrlResponse {
    mediaId: string;
    uploadUrl: string;
    expiresAt: string | number;
    method?: string;
    headers?: Record<string, string>;
    publicUrl?: string;
}

export interface MediaDetails {
    id?: string;
    mediaId: string;
    ownerId?: string;
    fileName?: string;
    mimeType?: string;
    fileSize?: number;
    sizeBytes?: number;
    status: "PENDING" | "READY" | "DELETED";
    url?: string | null;
    publicUrl?: string | null;
    createdAt?: string;
    updatedAt?: string;
}

export interface MediaListResponse {
    items: MediaDetails[];
    total: number;
}
