import type { MediaDetails, ExistingMediaType } from "@/types/api/media.types";
import { mediaService } from "@/services/media.service";
import { useMutation } from "@tanstack/react-query";

export interface UseUploadMediaOptions {
    visibility?: "PUBLIC" | "PRIVATE";
    mediaType?: ExistingMediaType;
}

export type UploadMediaArgs =
    | File
    | {
          file: File;
          visibility?: "PUBLIC" | "PRIVATE";
          mediaType?: ExistingMediaType;
      };

/**
 * React hook for uploading a single media file.
 *
 * Uses the direct FormData upload endpoint (POST /media/upload).
 * Returns a `mutateAsync` function that accepts a File or UploadMediaArgs and resolves
 * to the ready MediaDetails object including `mediaId`.
 */
export function useUploadMedia(options?: UseUploadMediaOptions) {
    const mutation = useMutation({
        mutationFn: (args: UploadMediaArgs): Promise<MediaDetails> => {
            if (args instanceof File) {
                return mediaService.upload(
                    args,
                    options?.visibility ?? "PUBLIC",
                    options?.mediaType,
                );
            }
            return mediaService.upload(
                args.file,
                args.visibility ?? options?.visibility ?? "PUBLIC",
                args.mediaType ?? options?.mediaType,
            );
        },
    });

    return mutation;
}
