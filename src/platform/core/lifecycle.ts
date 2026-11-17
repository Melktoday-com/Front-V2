import { App, AppState } from "@capacitor/app";
import { isNativePlatform } from "./index";

export type BackButtonHandler = (event: { canGoBack: boolean }) => void;
export type AppStateChangeListener = (state: AppState) => void;

let isLifecycleInitialized = false;
let activeBackHandler: BackButtonHandler | null = null;
let activeAppStateListener: AppStateChangeListener | null = null;

/**
 * Registers an Android hardware back button handler.
 * Replaces any previously registered handler to avoid duplicate callbacks.
 * Returns an unregister function.
 */
export function onBackButton(handler: BackButtonHandler): () => void {
  if (!isNativePlatform() || typeof window === "undefined") {
    return () => {};
  }

  activeBackHandler = handler;

  if (!isLifecycleInitialized) {
    initLifecycleListeners();
  }

  return () => {
    if (activeBackHandler === handler) {
      activeBackHandler = null;
    }
  };
}

/**
 * Registers a listener for native app pause/resume/background transitions.
 */
export function onAppStateChange(listener: AppStateChangeListener): () => void {
  if (!isNativePlatform() || typeof window === "undefined") {
    return () => {};
  }

  activeAppStateListener = listener;

  if (!isLifecycleInitialized) {
    initLifecycleListeners();
  }

  return () => {
    if (activeAppStateListener === listener) {
      activeAppStateListener = null;
    }
  };
}

/**
 * Internal single-point initialization for Capacitor App event listeners.
 * Guaranteed idempotent across React re-renders and Next.js route transitions.
 */
function initLifecycleListeners() {
  if (isLifecycleInitialized || !isNativePlatform() || typeof window === "undefined") {
    return;
  }
  isLifecycleInitialized = true;

  try {
    App.addListener("backButton", (event) => {
      if (activeBackHandler) {
        activeBackHandler(event);
      } else {
        if (event.canGoBack) {
          window.history.back();
        } else {
          App.exitApp();
        }
      }
    });

    App.addListener("appStateChange", (state) => {
      if (activeAppStateListener) {
        activeAppStateListener(state);
      }
    });
  } catch (error) {
    console.warn("[Platform Lifecycle] Failed to attach native listeners:", error);
  }
}
