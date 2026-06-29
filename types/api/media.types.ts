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
    expiresAt: string;
}

export interface MediaDetails {
    mediaId: string;
    ownerId: string;
    fileName: string;
    mimeType: string;
    fileSize: number;
    status: "PENDING" | "READY" | "DELETED";
    publicUrl?: string;
    createdAt: string;
    updatedAt: string;
}

export interface MediaListResponse {
    items: MediaDetails[];
    total: number;
}
