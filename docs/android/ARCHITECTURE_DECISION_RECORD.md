# Architecture Decision Record (ADR): Melktoday SSR Android Application

**Status:** APPROVED  
**Date:** November 2026  
**Deciders:** Senior Android Platform Engineer, Next.js Architect  
**Target:** Production Android Application (Direct APK Distribution)

---

## 1. Context & Business Problem

Melktoday Front-V2 is a Next.js 16 App Router application with active Server-Side Rendering (SSR) for dynamic listing detail pages (`/ads/[id]`, `/temporary-rent/[id]`), dynamic metadata generation (`generateMetadata`), and server-side data prefetching (`serverFetch`). It also includes Persian localization, Leaflet tile proxying, and role-based access control.

The goal is to deliver a production-grade, signed Android APK that:
1. Retains the existing Next.js SSR architecture (strictly no static export `output: 'export'`).
2. Preserves the existing backend API contracts and authentication system (JWT + OTP cookies).
3. Provides native mobile capabilities: Firebase Push Notifications (FCM), Camera, GPS / Geolocation, and Filesystem / Downloads.
4. Handles mobile-specific UX: hardware back button, system status bar, splash screen, soft keyboard adjustments, and offline error states.
5. Can be downloaded and installed directly as a signed release APK.

---

## 2. Evaluation of Architectural Alternatives

We investigated two primary alternatives and formulated a hardened third hybrid option:

### Alternative A: Standard Capacitor Remote URL Architecture
Configure standard Capacitor `server.url = 'https://melktoday.com'`.

- **Advantages:**
  - Standard Capacitor CLI tooling and official plugins can be used.
  - Zero code changes to SSR: Next.js pages render on the server and are served directly over HTTPS.
  - Cookie handling is same-origin; `access_token` and `refresh_token` work naturally.
- **Disadvantages & Risks:**
  - Capacitor official documentation specifically notes that `server.url` is designed for development and live reload, **not** out-of-the-box production.
  - If the device loses internet connection on startup or DNS resolution fails, standard Capacitor renders a raw Chromium error (`net::ERR_CONNECTION_REFUSED` or `net::ERR_INTERNET_DISCONNECTED`), causing a broken user experience.
  - External navigation (e.g. payment callbacks, external links) could navigate the main WebView away from the application origin if not strictly intercepted.

### Alternative B: Pure Custom Android Host (Kotlin WebView + Custom Bridge)
Build an Android application from scratch in Kotlin using `android.webkit.WebView`, `WebViewClient`, and `@JavascriptInterface`.

- **Advantages:**
  - 100% fine-grained native control over network error interceptors, SSL handling, cookie flushing, and intent filtering.
  - Zero third-party hybrid framework overhead.
- **Disadvantages & Risks:**
  - Must write and maintain custom Android Kotlin implementations and custom JavaScript bridges for Camera, Push Notifications, Geolocation, Filesystem, and Keyboard from scratch.
  - Loses the battle-tested reliability and cross-version compatibility of official Capacitor plugins.
  - Significantly higher maintenance burden and larger attack surface for custom bridge bugs.

---

### Alternative C (Selected): Hardened Capacitor 8 Remote Production Architecture

We combine the robust plugin ecosystem of **Capacitor 8** with **custom Android Native Runtime hardening** in Kotlin/Java.

```mermaid
graph TD
    subgraph Android Native Runtime (Capacitor 8 + Kotlin Hardening)
        MA[MainActivity / BridgeActivity]
        ERR[Native Offline & Network Error Interceptor]
        NAV[External Navigation & Custom Tabs Delegator]
        COOKIE[CookieManager Sync & Persistence]
        FCM[Firebase Messaging Service & Plugin]
        PLUGINS[Capacitor Native Plugins: Camera, GPS, Files]
    end

    subgraph Melktoday Cloud Infrastructure
        SSR[Next.js 16 SSR Server - melktoday.com]
        API[NestJS Backend API - melktoday.com/backend/api]
        S3[Media Storage / SeaweedFS]
    end

    MA -->|Loads via HTTPS| SSR
    MA -->|Native Bridge Injection| SSR
    MA -->|Intercepts Net Errors| ERR
    MA -->|Delegates Untrusted Domains| NAV
    MA -->|Flushes Tokens on Pause| COOKIE
    FCM -->|Push Token Registration| API
    SSR -->|Client-side API Calls| API
    SSR -->|Presigned Uploads| S3
```

---

## 3. Technical Comparison & Compatibility Matrix

| Evaluation Dimension | Alt A (Vanilla Capacitor Remote) | Alt B (Custom Kotlin Host) | Alt C (Hardened Capacitor 8 - Selected) |
| :--- | :--- | :--- | :--- |
| **SSR Compatibility** | High (Remote HTTPS loading) | High (Remote HTTPS loading) | **Full Compatibility:** SSR HTML and metadata stream directly into WebView. |
| **Server Actions / Dynamic Routes**| High | High | **Full Compatibility:** Same-origin fetches work seamlessly. |
| **Native Bridge Accessibility** | Injected by Capacitor on remote page | Custom `@JavascriptInterface` required | **High:** Injected on `server.allowNavigation` origins; wrapped in safe platform layer (`src/platform/`). |
| **Cookie & Session Persistence** | High (same-origin cookies) | High (CookieManager) | **Enterprise:** Native `CookieManager` configured with third-party cookie acceptance and lifecycle `flush()`. |
| **Offline & Error Handling** | Poor (Generic Chromium error screen) | Excellent (Custom Native View) | **Excellent:** Native `onReceivedError` override displays a branded Persian retry screen with reconnect logic. |
| **Domain Security & Isolation**| Moderate | High | **Strict:** Allowlist limits WebView to `melktoday.com` and `*.melktoday.ir`. External URLs open in Chrome Custom Tabs / System Browser. |
| **Native Feature Maintenance** | Low (Official plugins) | Very High (Custom Kotlin code) | **Minimal:** Official `@capacitor/*` plugins handle camera, GPS, files, and push. |
| **Direct APK Distribution** | Supported | Supported | **Fully Supported:** Built with Gradle, signed via release keystore, zero external store dependencies. |

---

## 4. Key Architectural Decisions & Safeguards

### 4.1 Domain Security & Navigation Isolation
- **Allowed Origins:** `melktoday.com`, `beta.melktoday.ir`, `*.melktoday.com`, `*.melktoday.ir`.
- **Navigation Policy:** Any navigation event outside the allowlist (such as bank gateways, social networks, or external informational links) is intercepted by `shouldOverrideUrlLoading` and opened in the Android System Browser or Chrome Custom Tabs.
- **Cleartext Traffic:** Disabled (`cleartext: false`). Strict TLS/HTTPS is enforced.

### 4.2 Error Handling & Offline Experience
- To resolve Capacitor's primary `server.url` drawback, the native Android host intercepts network error codes (`ERROR_HOST_LOOKUP`, `ERROR_CONNECT`, `ERROR_TIMEOUT`).
- When a failure occurs, the app renders a native Iranian Persian error screen ("خطا در برقراری ارتباط با سرور") with a retry button that re-polls the connection and reloads the root page.

### 4.3 Native Platform Abstraction Layer (`src/platform/`)
To guarantee that the existing PWA and desktop web apps continue working without disruption:
- No feature code in `components/` or `scenes/` may call `@capacitor/*` plugins directly.
- All native capabilities are accessed through a unified interface (`src/platform/`) that detects `Capacitor.isNativePlatform()`.
- On Web/PWA, it seamlessly falls back to standard HTML5 APIs (`navigator.geolocation`, `<input type="file">`, Web Push).
- On Android, it delegates to the corresponding Capacitor plugin with native permissions and error handling.

### 4.4 Authentication & Cookie Synchronization
- Melktoday uses cookie-based JWT storage (`access_token`, `refresh_token`, `XSRF-TOKEN`).
- In Android WebView, `android.webkit.CookieManager` is configured with:
  ```kotlin
  CookieManager.getInstance().setAcceptCookie(true)
  CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true)
  ```
- During `onPause()` of `MainActivity`, `CookieManager.getInstance().flush()` is called to guarantee that authentication cookies persist across app process kills and device reboots.

---

## 5. Known Limitations & Trade-Offs

1. **Internet Dependency:** Offline browsing of property listings is not supported because SSR and backend searches require live network connectivity. This is acceptable per project requirements.
2. **Backend Device Registration Dependency:** While the client-side FCM token generation and notification listeners are fully functional, live server-triggered push delivery requires the backend team to deploy device registration endpoints (`POST /devices`). Until deployed, push delivery remains `BLOCKED` on backend infrastructure.

---

## 6. Decision Rationale

Alternative C (Hardened Capacitor 8 Remote Production Architecture) is selected because it delivers:
1. Strict compliance with Next.js SSR and Server Components without artificial architectural refactoring.
2. Production reliability through native Android error recovery and domain isolation.
3. Access to official, robust Capacitor 8 plugins for Camera, GPS, Push, and Files.
4. Complete backward compatibility with the existing web and PWA applications.
