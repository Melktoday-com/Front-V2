export interface FileDownloadOptions {
  url: string;
  filename: string;
}

export interface FileDownloadResult {
  success: boolean;
  uri?: string;
  message?: string;
}

export class PlatformFileError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "PlatformFileError";
    this.code = code;
  }
}
