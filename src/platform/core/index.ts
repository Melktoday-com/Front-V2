import { Capacitor } from "@capacitor/core";

export type PlatformType = "android" | "ios" | "web";

/**
 * Returns true if the application is running inside a native mobile container (Android / iOS).
 */
export function isNativePlatform(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

/**
 * Returns the active platform identifier.
 */
export function getPlatform(): PlatformType {
  if (typeof window === "undefined") return "web";
  try {
    const platform = Capacitor.getPlatform();
    if (platform === "android" || platform === "ios") {
      return platform;
    }
    return "web";
  } catch {
    return "web";
  }
}

export function isAndroid(): boolean {
  return getPlatform() === "android";
}

export function isIOS(): boolean {
  return getPlatform() === "ios";
}

export function isWeb(): boolean {
  return getPlatform() === "web";
}
