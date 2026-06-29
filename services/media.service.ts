import apiClient from "@/lib/api/client";
import {
    MediaDetails,
    MediaListResponse,
    RequestUploadUrlRequest,
    UploadUrlResponse
} from "@/types/api/media.types";
import axios from "axios";

export const mediaService = {
    async requestUploadUrl(data: RequestUploadUrlRequest): Promise<UploadUrlResponse> {
        const response = await apiClient.post<UploadUrlResponse>("/media/upload-url", data);
        return response.data;
    },

    async uploadToS3(url: string, file: File): Promise<void> {
        // Use raw axios for S3 upload to avoid interceptors that might be configured on apiClient
        await axios.put(url, file, {
            headers: {
                "Content-Type": file.type,
            },
        });
    },

    async confirmUpload(mediaId: string): Promise<MediaDetails> {
        const response = await apiClient.post<MediaDetails>(`/media/${mediaId}/confirm`);
        return response.data;
    },

    async getDetails(mediaId: string): Promise<MediaDetails> {
        const response = await apiClient.get<MediaDetails>(`/media/${mediaId}`);
        return response.data;
    },

    async delete(mediaId: string): Promise<void> {
        await apiClient.delete(`/media/${mediaId}`);
    },

    async listMyMedia(query: { page?: number; limit?: number } = {}): Promise<MediaListResponse> {
        const response = await apiClient.get<MediaListResponse>("/media", {
            params: query,
        });
        return response.data;
    }
};
