# Repository and Architecture Audit: Melktoday Next.js to Android

**Audit Date:** November 2026  
**Auditor:** Senior Android Platform Engineer & Next.js Architect  
**Project:** Melktoday Front-V2 (`https://melktoday.com`)  
**Target:** Production-Grade Android Application (Capacitor 8 / Android Native Runtime)

---

## 1. Executive Summary

This audit assesses the readiness of the existing **Melktoday Front-V2** Next.js application for transformation into a production-grade, signed Android APK. Melktoday is a real estate and short-term property rental platform engineered for the Iranian market with full Right-to-Left (RTL) support, Persian localization, interactive Leaflet map search, and role-based permissions.

The existing architecture leverages **Next.js 16 App Router** with active **Server-Side Rendering (SSR)** for SEO and dynamic page delivery. Preserving this architecture without resorting to static export (`output: 'export'`) is mandatory.

---

## 2. Next.js & Frontend Architecture

| Parameter | Observed Implementation | Verification Evidence |
| :--- | :--- | :--- |
| **Next.js Version** | `16.4.6` (Turbopack supported) | `package.json` line 30 |
| **React Version** | `19.3.1` (`react-dom: ^19.3.1`) | `package.json` line 31-32 |
| **Router Paradigm** | App Router (`app/` directory) | Directory tree audit (`app/layout.tsx`, `app/page.tsx`) |
| **Server Components** | Active on dynamic detail routes (`app/ads/[id]/[[...title]]/page.tsx`, `app/temporary-rent/[id]/...`, `app/agency/...`, `app/host/...`) | `serverFetch` calls and `generateMetadata` in page files |
| **Client Components** | Active in screen containers (`scenes/*`), layout navigation, modal managers, forms | `"use client"` directives present in scene entrypoints |
| **Server Actions** | None present in repository | Grep verification for `"use server"` returned zero occurrences |
| **API Route Handlers** | Single route handler: `app/api/tiles/[z]/[x]/[y]/route.ts` (OSM tile caching proxy) | Inspected `app/api/` structure |
| **SSR Fetch Mechanism** | `serverFetch<T>()` in `lib/api/server.ts` calling `https://melktoday.com/backend/api` | `lib/api/server.ts` implementation |
| **Middleware** | None (`middleware.ts` is absent) | Verified with file search |
| **Static Export** | Disabled (standard SSR build) | `next.config.ts` does not contain `output: 'export'` |
| **Font Loading** | Next.js localFont loading `IRANSansX` (.woff) | `app/layout.tsx` lines 15-65 |

### Next.js Build Status
- **Vitest Unit/Integration Tests:** 16 test files (93 tests) passed cleanly (`npm test`).
- **Production Build (`npm run build`):** Verified successful compilation with Next.js 16.4.6 and Turbopack. Dynamic SSR routes (`ƒ /ads`, `ƒ /ads/[id]/[[...title]]`, `ƒ /temporary-rent/[id]/[[...title]]`, `ƒ /api/tiles/...`) are compiled and served on-demand, while static routes are pre-rendered.

---

## 3. Authentication & Session Management

| Aspect | Implementation Details | Evidence |
| :--- | :--- | :--- |
| **Auth Type** | Mobile Phone OTP (One-Time Password) | `services/auth.service.ts` |
| **OAuth Providers** | None (No Google/Apple OAuth or external SSO) | Audited `auth.service.ts` and `app/auth/page.tsx` |
| **Session Model** | JWT Access Token (15 min) + Refresh Token (30 days) | `lib/api/token-manager.ts` lines 39-55 |
| **Token Storage** | `cookies-next` (stored in document cookies) | `storeAuthTokens` in `lib/api/token-manager.ts` |
| **Cookie Settings** | `path=/`, `SameSite=lax`, `Secure` enforced if HTTPS | `lib/api/token-manager.ts` lines 40-54 |
| **CSRF Protection** | `XSRF-TOKEN` cookie read and sent as `x-xsrf-token` header on mutation methods | `lib/api/client.ts` lines 54-66 |
| **Token Refresh** | Deduplicated singleton promise (`refreshAuthTokens`), triggers on 401 response or 60s before expiry | `lib/api/token-manager.ts`, `hooks/useAuth.ts` |
| **Cross-Window Sync**| Dispatches `auth:token-refreshed` and `auth:session-expired` custom events | `token-manager.ts`, `client.ts`, `useAuth.ts` |
| **Logout Behavior** | `POST /auth/sessions/terminate`, clears cookies, resets React Query cache | `hooks/useAuth.ts` lines 57-82 |

---

## 4. PWA & Service Worker Implementation

- **Manifest:** Generated dynamically via `app/manifest.ts` and declared statically in `public/manifest.json`.
- **Display Mode:** `standalone`, `orientation: portrait`.
- **Service Worker (`public/sw.js`):**
  - **Purpose:** Specifically caches map tiles (`/api/tiles/`) in `melktoday-map-tiles-v2` Cache Storage up to 1500 entries.
  - **Non-Interference:** Does **not** intercept HTML document requests, SSR routes, or backend API mutations. It will not conflict with an Android WebView remote loading flow.
- **Navigation Safety (`hooks/useSafeBack.ts`, `components/providers/NavigationHistoryTracker.tsx`):**
  - Tracks navigation stack depth in `sessionStorage` (`melk_history_stack`).
  - Distinguishes standalone PWA / fresh entry from deep in-app navigation to ensure the back button never gets stuck.

---

## 5. Backend Architecture & Notification Support

| Endpoint Group | Description | Status in OpenAPI / Swagger |
| :--- | :--- | :--- |
| **Backend Framework**| NestJS on Ubuntu Nginx reverse proxy (`https://melktoday.com/backend/api`) | Confirmed via `/backend/api/docs` |
| **In-App Notifications** | `GET /notifications`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all` | VERIFIED |
| **Admin Broadcasts** | `POST /admin/notifications/broadcast`, `GET /admin/notifications/broadcasts` | VERIFIED |
| **Device Registration** | `POST /devices` or `POST /notifications/devices` | **NOT IMPLEMENTED IN BACKEND (UNVERIFIED)** |
| **FCM Server Setup** | Firebase Cloud Messaging credentials & device token tables | **MISSING IN BACKEND (BLOCKER FOR LIVE FCM)** |

> [!WARNING]
> **Backend Device Registration Finding:**
> The current backend stores in-app notifications and broadcast logs, but does not yet expose device token registration endpoints (`POST /devices` or `/notifications/devices`) for mobile push dispatch. A strict contract has been designed and documented in `docs/android/PUSH_NOTIFICATION_ARCHITECTURE.md`.

---

## 6. Native Feature Touchpoints in Existing Code

1. **Camera & Photos:**
   - Media upload in `components/MediaGalleryUpload.tsx` uses `<input type="file" accept="image/*,video/*">`.
   - Backend upload pipeline: `mediaService.uploadDirect()` negotiates presigned S3/SeaweedFS PUT URL via `/media/upload-session`, uploads binary directly, and calls `/media/:id/finalize`.
   - Compatible with Capacitor Camera / File Chooser.
2. **GPS & Geolocation:**
   - Map location selection in `components/ui/MapPicker.tsx` uses standard HTML5 `navigator.geolocation.getCurrentPosition()`.
   - In Android WebView, this requires `WebChromeClient.onGeolocationPermissionsShowPrompt()` and Android `ACCESS_FINE_LOCATION` runtime permissions.
3. **Downloads & Filesystem:**
   - Standard browser anchor downloads and file attachments.
   - WebView requires download listener or native file writer.
4. **Android Navigation:**
   - Deep integration with `useSafeBack` and `NavigationHistoryTracker` is required to bind the hardware back button to client-side router navigation.

---

## 7. Android Build Environment Audit

- **Operating System:** Linux x86_64 (Ubuntu)
- **Node.js:** `v24.18.0`
- **npm:** `11.18.0`
- **JDK:** OpenJDK 17 (`Temurin-17.0.20.1+1` at `/home/sorenammd/.jdks/jdk-17.0.20.1+1/bin/java`)
- **Android SDK:** Installed at `/home/sorenammd/Android/Sdk`
  - Platforms: `android-34`, `android-35`, `android-36.1`, `android-37.0`
  - Build Tools: `34.0.0`, `36.0.0`
  - Platform Tools: `adb` verified
  - Emulator: `Pixel_10` AVD available
- **Capacitor Compatibility:** Capacitor 8.6+ fully supports SDK 34/35 and JDK 17.
