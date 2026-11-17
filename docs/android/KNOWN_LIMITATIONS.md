# Known Limitations & External Blockers

**Document:** `docs/android/KNOWN_LIMITATIONS.md`  
**Target:** Melktoday Android Application

---

## 1. External Dependencies & Blockers

| Item | Description | Status | Required Action |
| :--- | :--- | :--- | :--- |
| **Production Firebase Project (`google-services.json`)** | Real-device Firebase Cloud Messaging requires a registered Android app with package name matching `google-services.json`. | **BLOCKED (Requires External Action)** | Project Owner must register the Android package name in Firebase Console and provide `google-services.json`. |
| **Backend Device Registration API** | The backend currently lacks `POST /backend/api/notifications/devices` for saving client FCM tokens. | **BLOCKED (Requires Backend Action)** | Backend engineering team must implement device registration endpoint per `PUSH_NOTIFICATION_ARCHITECTURE.md`. |
| **Production Application ID Approval** | Permanent reverse-DNS ID is proposed as `com.melktoday.app`. | **PENDING CONFIRMATION** | Confirmed as `com.melktoday.app` (matching `melktoday.com`). |
| **Production Release Keystore** | Distribution requires a dedicated production keystore for signing. A release keystore generator script is provided. | **MANAGED** | Generated locally with documented signing credentials in `RELEASE_GUIDE.md`. |

---

## 2. Technical Limitations by Design

1. **Offline Property Browsing Not Supported:**
   - The application relies on SSR and live PostgreSQL / NestJS queries. When the device has no internet access, the native offline recovery screen allows the user to re-check connection rather than browsing cached ads.
2. **Capacitor Remote Bridge Security:**
   - Bridge injection is strictly limited to authorized Melktoday domains (`melktoday.com`, `beta.melktoday.ir`). Any untrusted external navigation is delegated outside the WebView to prevent bridge compromise.
3. **App Router Turbopack / Next Build Warnings:**
   - Pre-existing TypeScript type errors in rental contact modals must be fixed to allow `next build` to complete.
