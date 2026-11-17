# Authentication Compatibility: Web vs. Android WebView

**Document:** `docs/android/AUTHENTICATION_COMPATIBILITY.md`  
**Target:** Melktoday Android Application

---

## 1. Authentication Mechanism Overview

Melktoday implements an SMS-based One-Time Password (OTP) authentication flow:
1. User requests OTP via `POST /auth/otp/request` (`{ mobileNumber: string }`).
2. User submits OTP via `POST /auth/otp/verify` (`{ mobileNumber: string, otp: string }`).
3. Backend issues:
   - `accessToken`: JWT with user UUID (`sub`), `sessionId`, `activeRoleName`, and 15-minute expiration (`exp`).
   - `refreshToken`: 30-day token for silent session renewal.
   - `XSRF-TOKEN`: Anti-CSRF token.

Tokens are stored via `cookies-next` in the browser / WebView cookies:
```typescript
setCookie("access_token", accessToken, { maxAge: accessMaxAge, path: "/", sameSite: "lax", secure: isHttps });
setCookie("refresh_token", refreshToken, { maxAge: 30 * 24 * 60 * 60, path: "/", sameSite: "lax", secure: isHttps });
```

---

## 2. Web vs. Android WebView Differences & Mitigations

| Behavior | Mobile Browser (Chrome) | Standard Android WebView | Melktoday Native Hardened WebView |
| :--- | :--- | :--- | :--- |
| **Cookie Persistence on Process Kill** | Automatic in Chrome SQLite storage | May be lost if `CookieManager` is not explicitly flushed before app kill | `CookieManager.getInstance().flush()` called on `onPause()` and `onStop()` |
| **Third-Party / Cross-Origin Cookies** | Partitioned or blocked by default | Disabled by default in WebView (`setAcceptThirdPartyCookies(false)`) | Explicitly enabled: `CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true)` |
| **Silent Refresh Lifecycle** | Fires in background or on window focus | WebView background throttling may suspend timers | Axios response interceptor intercepts 401 and calls `refreshAuthTokens()` on demand |
| **Session Restoration after Reboot** | Session restored on tab reload | Tokens persist in WebView CookieManager | Verified persistent session on cold launch |
| **OAuth Redirects** | Redirects via browser address bar | Not applicable (No OAuth providers used) | N/A |
| **CSRF Handling** | Browser passes cookie header | `x-xsrf-token` header added by Axios interceptor | Identical behavior verified |

---

## 3. Authentication Verification Matrix

| Scenario | Web Behavior | Android WebView Expected | Verification Status |
| :--- | :--- | :--- | :--- |
| **1. Fresh Login** | Enters phone, enters OTP, redirected to `/` | Identical; cookies stored in CookieManager | READY FOR E2E |
| **2. Existing Session** | Auto-detected from `access_token` cookie | Read on page load by Next.js and client | READY FOR E2E |
| **3. Session Refresh** | Proactive timer + 401 Axios retry | Interceptor refreshes token via `/auth/refresh` | READY FOR E2E |
| **4. App Restart** | Retains session | Retained via flushed persistent cookies | READY FOR E2E |
| **5. Explicit Logout** | `POST /auth/sessions/terminate`, cookies deleted | Cookies deleted, user routed to `/auth` | READY FOR E2E |
| **6. Expired Session** | Redirects to `/auth` if refresh fails | Redirects to `/auth` gracefully | READY FOR E2E |
| **7. Multi-Role Switch** | `POST /auth/sessions/switch-role` updates tokens | Identical | READY FOR E2E |
