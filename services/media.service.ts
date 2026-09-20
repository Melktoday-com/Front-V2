import apiClient from "@/lib/api/client";
import type {
    MediaDetails,
    MediaListResponse,
    RequestUploadUrlRequest,
    UploadUrlResponse,
} from "@/types/api/media.types";

export const mediaService = {
    /**
     * Direct single-step upload via multipart/form-data.
     * Sends file binary to POST /media/upload and gets back a ready MediaDetails.
     */
    async upload(
        file: File,
        visibility: "PUBLIC" | "PRIVATE" = "PUBLIC",
        mediaType?: "IMAGE" | "VIDEO" | "DOCUMENT",
    ): Promise<MediaDetails> {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("visibility", visibility);
        if (mediaType) {
            formData.append("mediaType", mediaType);
        }

        const response = await apiClient.post<MediaDetails>(
            "/media/upload",
            formData,
            // Let the browser set the correct Content-Type + boundary for multipart
            { headers: { "Content-Type": "multipart/form-data" } },
        );
        return response.data;
    },

    /**
     * Step 1 of the presigned-URL flow (kept for reference / advanced use).
     * Returns a pre-signed S3 URL and the headers the client must attach.
     */
    async requestUploadUrl(data: RequestUploadUrlRequest): Promise<UploadUrlResponse> {
        const response = await apiClient.post<UploadUrlResponse>("/media/upload-url", data);
        return response.data;
    },

    /**
     * Step 2 of the presigned-URL flow.
     * Puts the file binary directly to S3 using the signed URL.
     * Uses a plain fetch/XHR without any apiClient interceptors.
     */
    async uploadToS3(
        url: string,
        file: File,
        headers?: Record<string, string>,
    ): Promise<void> {
        const contentType =
            headers?.["Content-Type"] || file.type || "application/octet-stream";

        const response = await fetch(url, {
            method: "PUT",
            headers: { "Content-Type": contentType },
            body: file,
        });

        if (!response.ok) {
            throw new Error(
                `S3 upload failed: ${response.status} ${response.statusText}`,
            );
        }
    },

    /** Step 3 of the presigned-URL flow. Confirms upload completion on the backend. */
    async confirmUpload(mediaId: string): Promise<MediaDetails> {
        const response = await apiClient.post<MediaDetails>(`/media/${mediaId}/confirm`);
        return response.data;
    },

    async getDetails(mediaId: string): Promise<MediaDetails> {
        const response = await apiClient.get<MediaDetails>(`/media/${mediaId}/details`);
        return response.data;
    },

    async delete(mediaId: string): Promise<void> {
        await apiClient.delete(`/media/${mediaId}`);
    },

    async listMyMedia(
        query: { page?: number; limit?: number } = {},
    ): Promise<MediaListResponse> {
        const response = await apiClient.get<MediaListResponse>("/media", { params: query });
        return response.data;
    },
};
