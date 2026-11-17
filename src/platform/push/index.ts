import { PushNotifications } from "@capacitor/push-notifications";
import { isNativePlatform } from "../core";
import {
  NotificationActionCallback,
  PushNotificationCallback,
  PushTokenData,
} from "./types";

export * from "./types";

const INSTALLATION_ID_KEY = "melk_device_installation_id";
let isPushInitialized = false;

/**
 * Returns a stable UUID for this app installation, persisting across restarts.
 */
export function getOrCreateInstallationId(): string {
  if (typeof window === "undefined") return "server-context";
  let id = localStorage.getItem(INSTALLATION_ID_KEY);
  if (!id) {
    id = "inst_" + Math.random().toString(36).substring(2, 15) + "_" + Date.now().toString(36);
    localStorage.setItem(INSTALLATION_ID_KEY, id);
  }
  return id;
}

/**
 * Validates that an incoming notification URL is a safe internal application route.
 * Rejects external protocols, javascript schemes, or open redirects.
 */
export function isValidInternalRoute(url: string | undefined): boolean {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  // Must start with '/' and contain only valid URL path characters
  return /^\/[a-zA-Z0-9_\-\/\?=&%#.]*$/.test(trimmed);
}

/**
 * Initializes native push notification registration and registers event listeners idempotently.
 */
export async function initPushNotifications(options?: {
  onNotificationReceived?: PushNotificationCallback;
  onNotificationTapped?: NotificationActionCallback;
  onTokenSynchronized?: (data: PushTokenData) => void;
}): Promise<PushTokenData | null> {
  if (!isNativePlatform() || typeof window === "undefined") {
    return null;
  }

  if (isPushInitialized) {
    return null;
  }
  isPushInitialized = true;

  try {
    // 1. Check or request POST_NOTIFICATIONS permission
    let permStatus = await PushNotifications.checkPermissions();
    if (permStatus.receive !== "granted") {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== "granted") {
      console.warn("[Push] Permission not granted:", permStatus.receive);
      return null;
    }

    // 2. Attach listeners before calling register()
    await PushNotifications.addListener("registration", (token) => {
      const installationId = getOrCreateInstallationId();
      const tokenData: PushTokenData = {
        token: token.value,
        installationId,
        platform: "ANDROID",
      };

      console.info("[Push] FCM Registration Success, token:", token.value);
      if (options?.onTokenSynchronized) {
        options.onTokenSynchronized(tokenData);
      }
    });

    await PushNotifications.addListener("registrationError", (err) => {
      console.error("[Push] Registration Error:", err.error);
    });

    await PushNotifications.addListener("pushNotificationReceived", (notification) => {
      console.info("[Push] Foreground notification received:", notification);
      if (options?.onNotificationReceived) {
        options.onNotificationReceived(notification);
      }
    });

    await PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
      console.info("[Push] Notification tapped by user:", action);
      const targetUrl = action.notification?.data?.targetUrl;

      if (isValidInternalRoute(targetUrl)) {
        window.location.href = targetUrl;
      }

      if (options?.onNotificationTapped) {
        options.onNotificationTapped(action);
      }
    });

    // 3. Register with Apple APNS / Google FCM
    await PushNotifications.register();

    return {
      token: "pending-event",
      installationId: getOrCreateInstallationId(),
      platform: "ANDROID",
    };
  } catch (error) {
    console.error("[Push] Initialization exception:", error);
    return null;
  }
}
