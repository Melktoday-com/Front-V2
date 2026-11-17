import { Geolocation } from "@capacitor/geolocation";
import { isNativePlatform } from "../core";
import {
  GeoLocationOptions,
  GeoLocationResult,
  PlatformLocationError,
} from "./types";

export * from "./types";

/**
 * Retrieves current device coordinates with native and web fallbacks.
 */
export async function getCurrentPosition(
  options: GeoLocationOptions = { enableHighAccuracy: true, timeout: 12000, maximumAge: 10000 }
): Promise<GeoLocationResult> {
  if (isNativePlatform()) {
    try {
      const permission = await Geolocation.checkPermissions();
      if (permission.location !== "granted") {
        const requested = await Geolocation.requestPermissions({ permissions: ["location"] });
        if (requested.location !== "granted") {
          throw new PlatformLocationError(
            "PERMISSION_DENIED",
            "دسترسی به موقعیت مکانی از سوی کاربر رد شد."
          );
        }
      }

      const pos = await Geolocation.getCurrentPosition({
        enableHighAccuracy: options.enableHighAccuracy ?? true,
        timeout: options.timeout ?? 12000,
        maximumAge: options.maximumAge ?? 10000,
      });

      return {
        coords: {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          altitude: pos.coords.altitude,
          speed: pos.coords.speed,
          heading: pos.coords.heading,
        },
        timestamp: pos.timestamp,
      };
    } catch (err: unknown) {
      if (err instanceof PlatformLocationError) throw err;
      const errorMsg = err instanceof Error ? err.message : String(err);
      if (errorMsg.includes("denied")) {
        throw new PlatformLocationError("PERMISSION_DENIED", "دسترسی به موقعیت مکانی رد شد.");
      }
      if (errorMsg.includes("disabled") || errorMsg.includes("location unavailable")) {
        throw new PlatformLocationError(
          "POSITION_UNAVAILABLE",
          "موقعیت مکانی در دسترس نیست. لطفاً GPS دستگاه را روشن کنید."
        );
      }
      throw new PlatformLocationError("UNKNOWN", errorMsg || "خطا در دریافت موقعیت مکانی.");
    }
  }

  // Web / PWA Fallback
  if (typeof window === "undefined" || !navigator.geolocation) {
    throw new PlatformLocationError(
      "NOT_SUPPORTED",
      "مرورگر یا دستگاه شما از موقعیت مکانی پشتیبانی نمی‌کند."
    );
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          coords: {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            altitude: pos.coords.altitude,
            speed: pos.coords.speed,
            heading: pos.coords.heading,
          },
          timestamp: pos.timestamp,
        });
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject(new PlatformLocationError("PERMISSION_DENIED", "دسترسی به موقعیت مکانی رد شد."));
            break;
          case error.POSITION_UNAVAILABLE:
            reject(
              new PlatformLocationError(
                "POSITION_UNAVAILABLE",
                "اطلاعات موقعیت مکانی در دسترس نیست. لطفاً GPS را فعال کنید."
              )
            );
            break;
          case error.TIMEOUT:
            reject(new PlatformLocationError("TIMEOUT", "زمان دریافت موقعیت مکانی به پایان رسید."));
            break;
          default:
            reject(new PlatformLocationError("UNKNOWN", error.message || "خطای ناشناخته در GPS."));
        }
      },
      {
        enableHighAccuracy: options.enableHighAccuracy ?? true,
        timeout: options.timeout ?? 12000,
        maximumAge: options.maximumAge ?? 10000,
      }
    );
  });
}
