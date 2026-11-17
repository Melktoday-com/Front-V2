"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import { isNativePlatform, onBackButton } from "@/src/platform";
import { initPushNotifications } from "@/src/platform/push";
import { StatusBar, Style } from "@capacitor/status-bar";
import { SplashScreen } from "@capacitor/splash-screen";
import { App } from "@capacitor/app";
import { hasInAppHistory } from "@/hooks/useSafeBack";

export function PlatformInitializer() {
  const router = useRouter();
  const pathname = usePathname();
  const lastBackPressTime = useRef<number>(0);

  useEffect(() => {
    if (!isNativePlatform() || typeof window === "undefined") {
      return;
    }

    // 1. Configure System Status Bar
    StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
    StatusBar.setBackgroundColor({ color: "#ffffff" }).catch(() => {});
    StatusBar.setOverlaysWebView({ overlay: false }).catch(() => {});

    // 2. Hide Splash Screen after initial hydration
    SplashScreen.hide().catch(() => {});

    // 3. Initialize Firebase Push Notifications
    initPushNotifications({
      onNotificationReceived: (notification) => {
        toast.info(notification.title || "اعلان جدید", {
          description: notification.body,
        });
      },
      onNotificationTapped: (action) => {
        const targetUrl = action.notification?.data?.targetUrl;
        if (typeof targetUrl === "string" && targetUrl.startsWith("/")) {
          router.push(targetUrl);
        }
      },
    }).catch((err) => {
      console.warn("[PlatformInitializer] Push init failed:", err);
    });

    // 4. Android Hardware Back Button Navigation Handler
    const unregisterBack = onBackButton(() => {
      // Check if any modal is currently visible in DOM
      const openModalCloseBtn = document.querySelector<HTMLButtonElement>(
        '[data-modal-open="true"] [data-modal-close="true"], .modal-overlay [data-close="true"]'
      );
      if (openModalCloseBtn) {
        openModalCloseBtn.click();
        return;
      }

      // If user has navigated within the app, go back safely
      if (hasInAppHistory() && pathname !== "/") {
        window.history.back();
        return;
      }

      // If at root page (/), handle double-press to exit
      const now = Date.now();
      if (now - lastBackPressTime.current < 2000) {
        App.exitApp();
      } else {
        lastBackPressTime.current = now;
        toast("برای خروج از برنامه دوباره لمس کنید", { duration: 2000 });
      }
    });

    return () => {
      unregisterBack();
    };
  }, [router, pathname]);

  return null;
}
