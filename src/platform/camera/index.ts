import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { isNativePlatform } from "../core";
import {
  CapturePhotoOptions,
  CapturedPhotoResult,
  PlatformCameraError,
} from "./types";

export * from "./types";

/**
 * Captures a photo using the device camera or selects from the gallery.
 * Always resolves to a standard Web File object compatible with S3 presigned uploads.
 */
export async function capturePhoto(
  options: CapturePhotoOptions = {}
): Promise<CapturedPhotoResult> {
  const { source = "PROMPT", quality = 90, allowEditing = false } = options;

  if (isNativePlatform()) {
    try {
      let capSource = CameraSource.Prompt;
      if (source === "CAMERA") capSource = CameraSource.Camera;
      if (source === "PHOTOS") capSource = CameraSource.Photos;

      const photo = await Camera.getPhoto({
        quality,
        allowEditing,
        resultType: CameraResultType.Uri,
        source: capSource,
      });

      if (!photo.webPath) {
        throw new PlatformCameraError("UNKNOWN", "تصویر دریافت نشد.");
      }

      // Convert local URI into a standard File object without memory-heavy Base64 conversion
      const response = await fetch(photo.webPath);
      const blob = await response.blob();
      const format = photo.format || "jpeg";
      const filename = `photo_${Date.now()}.${format}`;
      const file = new File([blob], filename, { type: blob.type || `image/${format}` });

      return {
        file,
        webPath: photo.webPath,
        format,
      };
    } catch (err: unknown) {
      if (err instanceof PlatformCameraError) throw err;
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("User cancelled") || msg.includes("cancelled")) {
        throw new PlatformCameraError("CANCELLED", "انتخاب تصویر لغو شد.");
      }
      if (msg.includes("Permission") || msg.includes("denied")) {
        throw new PlatformCameraError(
          "PERMISSION_DENIED",
          "دسترسی به دوربین یا گالری تصاویر رد شد."
        );
      }
      throw new PlatformCameraError("UNKNOWN", msg || "خطا در ثبت تصویر.");
    }
  }

  // Web / PWA Fallback using dynamically triggered file input
  return new Promise((resolve, reject) => {
    if (typeof document === "undefined") {
      reject(new PlatformCameraError("UNAVAILABLE", "محیط مرورگر در دسترس نیست."));
      return;
    }

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    if (source === "CAMERA") {
      input.capture = "environment";
    }

    input.onchange = () => {
      const selectedFile = input.files?.[0];
      if (!selectedFile) {
        reject(new PlatformCameraError("CANCELLED", "فایلی انتخاب نشد."));
        return;
      }

      const webPath = URL.createObjectURL(selectedFile);
      const extension = selectedFile.name.split(".").pop() || "jpeg";

      resolve({
        file: selectedFile,
        webPath,
        format: extension,
      });
    };

    input.click();
  });
}
