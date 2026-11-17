# Native Platform Abstraction & Features Guide

**Document:** `docs/android/NATIVE_FEATURES.md`  
**Location:** `src/platform/`  
**Target:** Melktoday Next.js & Android Runtime

---

## 1. Overview & Architecture

The Native Platform Abstraction layer provides an isomorphic, type-safe API for accessing device hardware and platform capabilities across both Android Native Runtime and standard Web / PWA environments.

### Core Principles:
- **No Direct Plugin Leaks:** Feature components in `components/` and `scenes/` import from `@/src/platform`, never directly from `@capacitor/*`.
- **Automatic Fallback:** If running on Web / PWA, each API gracefully falls back to browser standards (`navigator.geolocation`, `<input type="file">`, standard downloads).
- **Idempotency:** Initialization routines ensure that event listeners are registered only once, surviving React component remounts and route navigation.

---

## 2. Module Specifications

### 2.1 Core & Lifecycle (`src/platform/core`)
- `isNativePlatform(): boolean`
- `getPlatform(): 'android' | 'ios' | 'web'`
- `onBackButton(handler: ({ canGoBack }) => void): () => void`
  - Binds the Android physical back button to Next.js route navigation and `useSafeBack`.
- `onAppStateChange(listener: (state) => void): () => void`
  - Detects app background, pause, and resume events.

### 2.2 Geolocation & GPS (`src/platform/location`)
- `getCurrentPosition(options?: GeoLocationOptions): Promise<GeoLocationResult>`
  - Android: Prompts runtime `ACCESS_FINE_LOCATION` and queries device GPS hardware via `@capacitor/geolocation`.
  - Web: Calls HTML5 `navigator.geolocation.getCurrentPosition`.
  - Errors: Mapped to `PlatformLocationError` with Persian user feedback (`PERMISSION_DENIED`, `POSITION_UNAVAILABLE`, `TIMEOUT`).

### 2.3 Camera & Media Gallery (`src/platform/camera`)
- `capturePhoto(options?: CapturePhotoOptions): Promise<CapturedPhotoResult>`
  - Supports `source: 'CAMERA' | 'PHOTOS' | 'PROMPT'`.
  - Android: Uses `@capacitor/camera` and converts local file URIs directly into a standard Web `File` object using `fetch() -> blob()`.
  - Zero Base64 overhead: Compatible with `mediaService.uploadDirect()` and S3 direct presigned uploads.
  - Web: Spawns hidden file input with `accept="image/*"`.

### 2.4 Filesystem & Downloads (`src/platform/files`)
- `downloadFile(options: { url: string; filename: string }): Promise<FileDownloadResult>`
  - Android: Uses `@capacitor/filesystem` to store the asset in the device `Documents` folder.
  - Web: Creates a temporary `<a download>` anchor element.

### 2.5 Firebase Push Notifications (`src/platform/push`)
- `initPushNotifications(options): Promise<PushTokenData | null>`
  - Android 13+ `POST_NOTIFICATIONS` runtime permission request.
  - Generates and persists a stable `installationId` in `localStorage`.
  - Attaches listeners for `registration`, `registrationError`, `pushNotificationReceived`, and `pushNotificationActionPerformed`.
  - Validates `targetUrl` via `isValidInternalRoute()` to reject external URL injection attacks.
