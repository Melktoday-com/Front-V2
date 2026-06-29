import { mediaService } from "@/services/media.service";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

export function useUploadMedia() {
    const [progress, setProgress] = useState(0);

    const mutation = useMutation({
        mutationFn: async (file: File) => {
            // 1. Request upload URL
            const { mediaId, uploadUrl } = await mediaService.requestUploadUrl({
                mediaType: "IMAGE",
                fileName: file.name,
                mimeType: file.type,
                sizeBytes: file.size,
                visibility: "PUBLIC"
            });

            // 2. Upload to S3
            await mediaService.uploadToS3(uploadUrl, file);

            // 3. Confirm upload
            return await mediaService.confirmUpload(mediaId);
        }
    });

    return {
        ...mutation,
        progress
    };
}
