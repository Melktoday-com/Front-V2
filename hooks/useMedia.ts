import type { MediaDetails } from "@/types/api/media.types";
import { mediaService } from "@/services/media.service";
import { useMutation } from "@tanstack/react-query";

export interface UseUploadMediaOptions {
    visibility?: "PUBLIC" | "PRIVATE";
    mediaType?: "IMAGE" | "VIDEO" | "DOCUMENT";
}

/**
 * React hook for uploading a single media file.
 *
 * Uses the direct FormData upload endpoint (POST /media/upload).
 * Returns a `mutateAsync` function that accepts a File and resolves
 * to the ready MediaDetails object including `mediaId`.
 */
export function useUploadMedia(options?: UseUploadMediaOptions) {
    const mutation = useMutation({
        mutationFn: (file: File): Promise<MediaDetails> =>
            mediaService.upload(
                file,
                options?.visibility ?? "PUBLIC",
                options?.mediaType,
            ),
    });

    return mutation;
}
