import { Directory, Filesystem } from "@capacitor/filesystem";
import { isNativePlatform } from "../core";
import {
  FileDownloadOptions,
  FileDownloadResult,
  PlatformFileError,
} from "./types";

export * from "./types";

/**
 * Downloads a file safely with native filesystem and web anchor fallbacks.
 */
export async function downloadFile(
  options: FileDownloadOptions
): Promise<FileDownloadResult> {
  const { url, filename } = options;

  if (isNativePlatform()) {
    try {
      const response = await Filesystem.downloadFile({
        url,
        path: filename,
        directory: Directory.Documents,
        recursive: true,
      });

      return {
        success: true,
        uri: response.path,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new PlatformFileError("DOWNLOAD_FAILED", msg || "خطا در دانلود فایل.");
    }
  }

  // Web / PWA Fallback
  if (typeof document === "undefined") {
    throw new PlatformFileError("UNAVAILABLE", "محیط مرورگر در دسترس نیست.");
  }

  try {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);

    return {
      success: true,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new PlatformFileError("WEB_DOWNLOAD_ERROR", msg || "خطا در دانلود فایل مرورگر.");
  }
}
