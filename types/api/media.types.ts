/** Request payload for generating a pre-signed S3 upload URL */
export interface RequestUploadUrlRequest {
    mediaType: "IMAGE" | "VIDEO" | "DOCUMENT";
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    visibility?: "PUBLIC" | "PRIVATE";
}

/** Response from POST /media/upload-url */
export interface UploadUrlResponse {
    mediaId: string;
    uploadUrl: string;
    expiresAt: string | number;
    method?: string;
    headers?: Record<string, string>;
    publicUrl?: string;
}

/** Response from POST /media/upload or POST /media/:id/confirm */
export interface MediaDetails {
    id?: string;
    mediaId: string;
    ownerId?: string;
    originalFileName?: string;
    fileName?: string;
    mimeType?: string;
    fileSize?: number;
    sizeBytes?: number;
    mediaType?: string;
    visibility?: string;
    status: "PENDING" | "READY" | "DELETED";
    /** URL returned by direct upload or get-details */
    url?: string | null;
    /** Legacy alias */
    publicUrl?: string | null;
    createdAt?: string;
    updatedAt?: string;
    width?: number;
    height?: number;
    durationSeconds?: number;
}

export interface MediaListResponse {
    items: MediaDetails[];
    total: number;
    page?: number;
    limit?: number;
}
