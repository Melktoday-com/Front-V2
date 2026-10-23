/**
 * Opt-in non-behavior-altering Map & PWA Diagnostic Suite
 * Gated strictly behind ?mapdebug=1 or localStorage.mapdebug=1
 */

export interface MapDebugLogEntry {
  timestamp: number;
  type: "info" | "tile" | "error" | "layout";
  message: string;
  data?: any;
}

declare global {
  interface Window {
    __mapDebugLogs?: MapDebugLogEntry[];
    __mapDebugActive?: boolean;
  }
}

export function isMapDebugActive(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (window.__mapDebugActive !== undefined) return window.__mapDebugActive;
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("mapdebug") === "1" || urlParams.has("mapdebug")) {
      window.__mapDebugActive = true;
      try {
        localStorage.setItem("mapdebug", "1");
      } catch {}
      return true;
    }
    if (window.localStorage && localStorage.getItem("mapdebug") === "1") {
      window.__mapDebugActive = true;
      return true;
    }
  } catch {}
  return false;
}

export function logMapDebug(type: MapDebugLogEntry["type"], message: string, data?: any) {
  if (!isMapDebugActive()) return;
  if (typeof window === "undefined") return;

  if (!window.__mapDebugLogs) {
    window.__mapDebugLogs = [];
  }

  const entry: MapDebugLogEntry = {
    timestamp: Date.now(),
    type,
    message,
    data,
  };
  window.__mapDebugLogs.push(entry);

  const prefix = `[MapDebug][${type.toUpperCase()}]`;
  if (data !== undefined) {
    console.log(prefix, message, data);
  } else {
    console.log(prefix, message);
  }
}

export async function captureMapSystemDiagnostics(mapElement?: HTMLElement | null, leafletMap?: any) {
  if (!isMapDebugActive() || typeof window === "undefined") return;

  const displayMode = window.matchMedia("(display-mode: standalone)").matches
    ? "standalone"
    : (window.navigator as any).standalone
    ? "standalone-ios"
    : "browser";

  const swState = {
    supported: "serviceWorker" in navigator,
    controller: navigator.serviceWorker?.controller?.scriptURL || null,
    controllerState: navigator.serviceWorker?.controller?.state || null,
  };

  let cacheKeys: string[] = [];
  if ("caches" in window) {
    try {
      cacheKeys = await caches.keys();
    } catch {}
  }

  let containerRect = null;
  let computedStyle = null;
  if (mapElement) {
    const rect = mapElement.getBoundingClientRect();
    const style = window.getComputedStyle(mapElement);
    containerRect = {
      width: rect.width,
      height: rect.height,
      top: rect.top,
      left: rect.left,
    };
    computedStyle = {
      height: style.height,
      width: style.width,
      display: style.display,
      visibility: style.visibility,
    };
  }

  let leafletSize = null;
  if (leafletMap && typeof leafletMap.getSize === "function") {
    try {
      const s = leafletMap.getSize();
      leafletSize = { x: s.x, y: s.y };
    } catch {}
  }

  const payload = {
    displayMode,
    onLine: navigator.onLine,
    userAgent: navigator.userAgent,
    serviceWorker: swState,
    cacheNames: cacheKeys,
    containerRect,
    computedStyle,
    leafletSize,
  };

  logMapDebug("info", "System and Map Container Snapshot", payload);
  return payload;
}
