import { mediaService } from "@/services/media.service";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

function getMimeTypeFromFile(file: File): string {
    if (file.type) return file.type;
    const ext = file.name.split(".").pop()?.toLowerCase();
    switch (ext) {
        case "svg":
            return "image/svg+xml";
        case "png":
            return "image/png";
        case "jpg":
        case "jpeg":
            return "image/jpeg";
        case "webp":
            return "image/webp";
        case "gif":
            return "image/gif";
        default:
            return "application/octet-stream";
    }
}

export function useUploadMedia(options?: { visibility?: "PUBLIC" | "PRIVATE" }) {
    const [progress, setProgress] = useState(0);

    const mutation = useMutation({
        mutationFn: async (file: File) => {
            const mimeType = getMimeTypeFromFile(file);

            // 1. Request upload URL
            const uploadInfo = await mediaService.requestUploadUrl({
                mediaType: "IMAGE",
                fileName: file.name,
                mimeType,
                sizeBytes: file.size,
                visibility: options?.visibility || "PUBLIC",
            });

            // 2. Upload to S3
            await mediaService.uploadToS3(uploadInfo.uploadUrl, file, uploadInfo.headers);

            // 3. Confirm upload
            return await mediaService.confirmUpload(uploadInfo.mediaId);
        }
    });

    return {
        ...mutation,
        progress
    };
}
