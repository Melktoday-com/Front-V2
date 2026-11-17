# Android Native Project Setup & Build Guide

**Document:** `docs/android/ANDROID_SETUP.md`  
**Application ID:** `com.melktoday.app`  
**Application Name:** `ملک تودی` (Melktoday)  
**Target Platform:** Android (API 26 to API 35)  
**Framework:** Capacitor 8.6.2 & Native Android (Gradle)

---

## 1. System Requirements & Environment

- **Node.js:** `v24.18.0` (npm 11.x)
- **Java Development Kit (JDK):** JDK 21 (Temurin 21.0.7+6 LTS) or JDK 17
- **Android SDK:** Installed at `/home/sorenammd/Android/Sdk`
  - Compile SDK: `35` (Android 15)
  - Target SDK: `35` (Android 15)
  - Minimum SDK: `26` (Android 8.0 Oreo)
  - Build Tools: `34.0.0`
- **Gradle Version:** `8.11.1` (managed via `./gradlew`)
- **Android Gradle Plugin (AGP):** `8.7.3`

---

## 2. Capacitor Packages & Versions

All Capacitor packages are pinned to major version `8`:

```json
{
  "dependencies": {
    "@capacitor/android": "^8.6.2",
    "@capacitor/app": "^8.1.2",
    "@capacitor/camera": "^8.2.6",
    "@capacitor/core": "^8.6.2",
    "@capacitor/filesystem": "^8.1.5",
    "@capacitor/geolocation": "^8.2.4",
    "@capacitor/haptics": "^8.0.2",
    "@capacitor/keyboard": "^8.0.6",
    "@capacitor/network": "^8.0.1",
    "@capacitor/push-notifications": "^8.1.3",
    "@capacitor/splash-screen": "^8.0.2",
    "@capacitor/status-bar": "^8.0.4"
  },
  "devDependencies": {
    "@capacitor/cli": "^8.6.2"
  }
}
```

---

## 3. Configuration Files

### 3.1 `capacitor.config.ts`
Points to the production SSR URL (`https://melktoday.com`) with strict HTTPS enforcement and navigation allowlist:
```typescript
import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.melktoday.app",
  appName: "ملک تودی",
  webDir: "public",
  bundledWebRuntime: false,
  server: {
    url: "https://melktoday.com",
    cleartext: false,
    allowNavigation: [
      "melktoday.com",
      "*.melktoday.com",
      "beta.melktoday.ir",
      "*.melktoday.ir",
      "trustseal.enamad.ir",
    ],
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    backgroundColor: "#ffffff",
  },
};
export default config;
```

### 3.2 Network Security (`android/app/src/main/res/xml/network_security_config.xml`)
Prohibits cleartext HTTP traffic across the entire application and pins system CA trust.

### 3.3 Permissions (`android/app/src/main/AndroidManifest.xml`)
- `INTERNET` & `ACCESS_NETWORK_STATE`: Remote SSR loading and API requests.
- `ACCESS_FINE_LOCATION` & `ACCESS_COARSE_LOCATION`: Map location picker.
- `CAMERA`, `READ_MEDIA_IMAGES`, `READ_MEDIA_VIDEO`: Property media uploads.
- `POST_NOTIFICATIONS`: Android 13+ push notifications.

---

## 4. Building the Application

### 4.1 Debug APK
```bash
export JAVA_HOME=/home/sorenammd/.gradle/jdks/eclipse_adoptium-21-amd64-linux.2
export ANDROID_HOME=/home/sorenammd/Android/Sdk
export PATH=$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$PATH

cd android
./gradlew assembleDebug
```
Output path: `android/app/build/outputs/apk/debug/app-debug.apk`

### 4.2 Release APK
```bash
cd android
./gradlew assembleRelease
```
Output path: `android/app/build/outputs/apk/release/app-release-unsigned.apk` (or signed per `RELEASE_GUIDE.md`).

---

## 5. Branded Assets Generation
To re-generate launcher icons and splash screens from source vectors/PNGs:
```bash
python3 scripts/generate-android-assets.py
```
This populates:
- `android/app/src/main/res/mipmap-*` (48px to 192px)
- `android/app/src/main/res/drawable*` (portrait and landscape splashes)
