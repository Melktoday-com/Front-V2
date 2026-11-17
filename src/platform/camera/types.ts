export type PhotoSource = "CAMERA" | "PHOTOS" | "PROMPT";

export interface CapturePhotoOptions {
  source?: PhotoSource;
  quality?: number; // 0 to 100, default 90
  allowEditing?: boolean;
}

export interface CapturedPhotoResult {
  file: File;
  webPath: string;
  format: string;
}

export type CameraErrorCode =
  | "PERMISSION_DENIED"
  | "CANCELLED"
  | "UNAVAILABLE"
  | "UNKNOWN";

export class PlatformCameraError extends Error {
  code: CameraErrorCode;

  constructor(code: CameraErrorCode, message: string) {
    super(message);
    this.name = "PlatformCameraError";
    this.code = code;
  }
}
