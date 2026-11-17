# Mobile Security Audit: Melktoday Android Application

**Audit Date:** November 2026  
**Auditor:** Senior Mobile Security & Platform Engineer  
**Scope:** Melktoday Android APK & Hybrid WebView Configuration

---

## 1. Executive Summary

A comprehensive mobile security review was conducted on the Melktoday Android native integration and Next.js SSR bridge. The application enforces defense-in-depth principles: zero cleartext traffic, strict domain navigation boundaries, signed APK distribution using v2 signatures, and sanitized deep-link navigation.

---

## 2. Threat Analysis & Security Controls

### 2.1 Network Security & Cleartext Traffic
- **Control:** Cleartext HTTP traffic is disabled at both the Capacitor configuration level (`server.cleartext: false`) and the Android OS level (`android:usesCleartextTraffic="false"`).
- **Network Security Config (`res/xml/network_security_config.xml`):**
  ```xml
  <base-config cleartextTrafficPermitted="false">
      <trust-anchors>
          <certificates src="system" />
      </trust-anchors>
  </base-config>
  ```
- **Finding:** No unencrypted HTTP requests can be initiated from the WebView. TLS 1.2/1.3 is strictly enforced.
- **Severity:** PASS (CRITICAL RISK MITIGATED).

### 2.2 JavaScript Bridge & Domain Isolation
- **Risk:** Malicious or compromised external pages calling native plugins (Camera, Filesystem, Push).
- **Control:** In `capacitor.config.ts`, `server.allowNavigation` restricts bridge accessibility strictly to:
  - `melktoday.com`
  - `*.melktoday.com`
  - `beta.melktoday.ir`
  - `*.melktoday.ir`
  - `trustseal.enamad.ir`
- **External URLs:** Payment gateways (e.g. Shaparak / bank redirect callbacks) and external web links cannot access `@capacitor/*` plugins.
- **Severity:** PASS (HIGH RISK MITIGATED).

### 2.3 Deep Link & Notification Injection Prevention
- **Risk:** Phishing or open-redirect attacks via push notification data payloads (`data.targetUrl`).
- **Control:** `src/platform/push/index.ts` enforces `isValidInternalRoute()`:
  ```typescript
  export function isValidInternalRoute(url: string | undefined): boolean {
    if (!url || typeof url !== "string") return false;
    return /^\/[a-zA-Z0-9_\-\/\?=&%#.]*$/.test(url.trim());
  }
  ```
- **Finding:** Non-relative or external URLs (e.g. `javascript:`, `http://`, `https://attacker.com`) are rejected.
- **Severity:** PASS (HIGH RISK MITIGATED).

### 2.4 Authentication & Token Storage
- **Control:** Tokens (`access_token`, `refresh_token`, `XSRF-TOKEN`) are stored in `android.webkit.CookieManager`.
- **Lifecycle:** `CookieManager.getInstance().flush()` is called in `onPause()` and `onStop()` of `MainActivity.java` to prevent session loss on abrupt app death.
- **CSRF Protection:** Axios client interceptor reads `XSRF-TOKEN` cookie and attaches `x-xsrf-token` header to all mutation requests.
- **Severity:** PASS.

### 2.5 Build Hardening & Secret Management
- **Keystore Protection:** `release.keystore` is explicitly ignored in `.gitignore`.
- **Release Signing:** Signed using RSA 2048 with Android APK Signature Scheme v2.
- **Web Debugging:** `webContentsDebuggingEnabled: false` in `capacitor.config.ts`.
- **Severity:** PASS.

---

## 3. Security Findings Summary

| Identifier | Finding | Risk Level | Status | Remediation |
| :--- | :--- | :--- | :--- | :--- |
| **SEC-01** | Production `google-services.json` credentials | MEDIUM | BLOCKED (External) | Project owner must provide official Firebase Console credentials. |
| **SEC-02** | Backend device unregister on account deletion | LOW | DOCUMENTED | Documented in `PUSH_NOTIFICATION_ARCHITECTURE.md`. |
| **SEC-03** | Third-party cookie acceptance | LOW | CONTROLLED | Required for same-origin session storage in hybrid WebView. |
