# Mobile End-to-End (E2E) Test Plan

**Document:** `docs/android/E2E_TEST_PLAN.md`  
**Application ID:** `com.melktoday.app`  
**Target:** Melktoday Production Android Application

---

## 1. Test Objectives

Validate that the Melktoday Next.js SSR application operates reliably inside the Android runtime, supporting native device features, authentication persistence, and error recovery.

---

## 2. Test Scenarios Matrix

### Suite 1: Installation & Application Lifecycle
- **TC-01: Clean Installation:** Install `app-release.apk` on a clean Android device (API 26+).
- **TC-02: Cold Launch:** Launch app from launcher icon (`com.melktoday.app/.MainActivity`).
- **TC-03: Background / Foreground Transition:** Move app to background and restore to foreground.
- **TC-04: Process Kill & Session Recovery:** Kill process and restart to verify persistent session.

### Suite 2: SSR & Web Navigation
- **TC-05: Root SSR Rendering:** Home page (`/`) loads with pre-rendered SSR HTML, Persian fonts, and layout.
- **TC-06: Dynamic Listing Detail:** Navigate to dynamic SSR route (`/ads/[id]` or `/temporary-rent/[id]`).
- **TC-07: External Link Isolation:** Click external link (e.g. Enamad); verify it opens in external browser.

### Suite 3: Authentication & Security
- **TC-08: Fresh OTP Login:** Request OTP and submit verification code. Verify JWT cookies stored in CookieManager.
- **TC-09: Token Silent Refresh:** Simulate 401 response and verify Axios interceptor refreshes token.
- **TC-10: Explicit Logout:** Terminate session; verify cookies cleared and user routed to `/auth`.

### Suite 4: Native Capabilities
- **TC-11: Geolocation / GPS:** Tap "موقعیت فعلی من" on `MapPicker.tsx`; verify native location permission prompt and GPS lock.
- **TC-12: Camera Capture:** Capture property image via `@capacitor/camera` and verify binary upload.
- **TC-13: Push Registration:** Verify FCM token registration listener and installation ID generation.
- **TC-14: Notification Tap Routing:** Tap notification with `targetUrl`; verify navigation to internal route.

### Suite 5: Android UX & Hardware
- **TC-15: Hardware Back Button (Modal):** Press back with modal open; verify modal closes without navigating away.
- **TC-16: Hardware Back Button (Deep Route):** Press back inside dynamic route; verify return to previous page.
- **TC-17: Hardware Back Button (Root Exit):** Press back at `/`; verify 2-second double-tap exit prompt.
- **TC-18: Soft Keyboard Viewport:** Open keyboard on input; verify viewport resizes without obscured fields.
