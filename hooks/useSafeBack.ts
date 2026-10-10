"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";
import { MELK_NAV_COUNT_KEY } from "@/components/providers/NavigationHistoryTracker";

/**
 * Checks whether the current tab session has navigable in-app history.
 */
export function hasInAppHistory(): boolean {
    if (typeof window === "undefined") return false;

    // A fresh tab or window with a direct URL always has history.length <= 1
    if (window.history.length <= 1) {
        return false;
    }

    try {
        const navCount = parseInt(sessionStorage.getItem(MELK_NAV_COUNT_KEY) || "0", 10);
        const isSameOriginReferrer =
            typeof document !== "undefined" &&
            !!document.referrer &&
            document.referrer.startsWith(window.location.origin);

        // If the session navigation count is <= 1 (meaning this was the landing/entry page in this tab)
        // and the referrer is not from the same origin, the user landed here directly from outside.
        if (navCount <= 1 && !isSameOriginReferrer) {
            return false;
        }
    } catch {
        // Fallback gracefully if storage is restricted
    }

    return true;
}

/**
 * Hook to provide a reliable "back" navigation handler.
 *
 * If the browser has no history (direct link, fresh tab, external referrer)
 * or if calling `router.back()` results in a no-op (nothing happens),
 * it automatically falls back to navigating to the landing page (`/`)
 * or the specified fallback URL.
 *
 * @param defaultFallbackUrl Fallback URL if no history exists (defaults to "/")
 * @returns A click/navigation handler function that can be used directly with onClick
 */
export function useSafeBack(defaultFallbackUrl: string = "/") {
    const router = useRouter();
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Clean up any pending timer on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    const handleBack = useCallback(
        (customFallback?: string | React.MouseEvent | unknown) => {
            const fallback = typeof customFallback === "string" ? customFallback : defaultFallbackUrl;

            if (typeof window === "undefined") {
                router.push(fallback);
                return;
            }

            // Clear any previous timer
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }

            // 1. If we know for sure there is no in-app history, immediately navigate to the fallback (landing page)
            if (!hasInAppHistory()) {
                router.push(fallback);
                return;
            }

            // 2. Otherwise, attempt browser/router back while setting a safety net
            // to ensure the button is NEVER a no-op if history traversal fails.
            const initialUrl = window.location.href;
            let didNavigate = false;

            const onPopState = () => {
                didNavigate = true;
            };

            window.addEventListener("popstate", onPopState, { once: true });

            try {
                router.back();
            } catch {
                window.removeEventListener("popstate", onPopState);
                router.push(fallback);
                return;
            }

            // 3. Safety net: If no popstate was fired and URL hasn't changed within 150ms,
            // router.back() was a no-op (e.g. browser is at the start of history stack).
            timeoutRef.current = setTimeout(() => {
                window.removeEventListener("popstate", onPopState);
                if (!didNavigate && window.location.href === initialUrl) {
                    router.push(fallback);
                }
            }, 150);
        },
        [router, defaultFallbackUrl]
    );

    return handleBack;
}
