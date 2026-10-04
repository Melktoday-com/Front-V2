import apiClient from "@/lib/api/client";
import type {
    MediaDetails,
    MediaListResponse,
    RequestUploadUrlRequest,
    UploadUrlResponse,
} from "@/types/api/media.types";

export const mediaService = {
    /**
     * Direct S3 Presigned Upload Flow:
     * 1. Provisions presigned PUT URL via /media/upload-session
     * 2. Streams binary directly to SeaweedFS (zero Node.js memory footprint)
     * 3. Finalizes via /media/:id/finalize (S3 HEAD verification + RabbitMQ job dispatch)
     * 4. Polls /media/:id/status until READY
     */
    async uploadDirect(
        file: File,
        visibility: "PUBLIC" | "PRIVATE" = "PUBLIC",
        mediaType?: "IMAGE" | "VIDEO" | "DOCUMENT",
    ): Promise<MediaDetails> {
        const detectedType: "IMAGE" | "VIDEO" | "DOCUMENT" =
            mediaType ||
            (file.type.startsWith("video/") || /\.(mp4|mov|webm|m4v)$/i.test(file.name)
                ? "VIDEO"
                : file.type.startsWith("image/") || /\.(svg|png|jpg|jpeg|webp|gif)$/i.test(file.name)
                  ? "IMAGE"
                  : "DOCUMENT");

        // Step 1: Negotiate direct presigned upload session
        const sessionRes = await apiClient.post<{
            mediaId: string;
            uploadUrl: string;
            objectKey: string;
            method: string;
            headers?: Record<string, string>;
        }>("/media/upload-session", {
            mediaType: detectedType,
            filename: file.name,
            mimeType: file.type || (detectedType === "VIDEO" ? "video/mp4" : "image/jpeg"),
            sizeBytes: file.size,
            visibility,
        });

        const { mediaId, uploadUrl, headers } = sessionRes.data;

        // Step 2: Upload binary payload directly to SeaweedFS / S3 via PUT
        await this.uploadToS3(uploadUrl, file, headers);

        // Step 3: Finalize upload session (triggers S3 HEAD verification and async RabbitMQ processing)
        await apiClient.post(`/media/${mediaId}/finalize`);

        // Step 4: Poll status until READY or FAILED (max 60 seconds)
        const pollInterval = 1000;
        const maxAttempts = 60;
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            await new Promise((resolve) => setTimeout(resolve, pollInterval));
            try {
                const statusRes = await apiClient.get<{
                    mediaId: string;
                    status: string;
                    isReady: boolean;
                    isFailed: boolean;
                    failureReason?: string;
                    url?: string;
                    posterUrl?: string;
                }>(`/media/${mediaId}/status`);

                if (statusRes.data.isReady) {
                    return this.getDetails(mediaId);
                }
                if (statusRes.data.isFailed) {
                    throw new Error(statusRes.data.failureReason || "Media processing failed");
                }
            } catch (err) {
                if (err instanceof Error && err.message.includes("failed")) {
                    throw err;
                }
            }
        }

        return this.getDetails(mediaId);
    },

    /**
     * Upload media file.
     * Uses direct S3 presigned streaming for videos to prevent memory buffering,
     * and direct multipart/form-data for lightweight assets.
     */
    async upload(
        file: File,
        visibility: "PUBLIC" | "PRIVATE" = "PUBLIC",
        mediaType?: "IMAGE" | "VIDEO" | "DOCUMENT",
    ): Promise<MediaDetails> {
        const isVideo =
            mediaType === "VIDEO" ||
            file.type.startsWith("video/") ||
            /\.(mp4|mov|webm|m4v)$/i.test(file.name);

        if (isVideo) {
            try {
                return await this.uploadDirect(file, visibility, "VIDEO");
            } catch (err) {
                console.warn("Direct upload session failed, falling back to multipart:", err);
            }
        }

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
