"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export const MELK_NAV_COUNT_KEY = "melk_nav_count";
export const MELK_HISTORY_STACK_KEY = "melk_history_stack";

/**
 * Retrieves the tracked in-app route stack from sessionStorage.
 */
export function getInAppHistoryStack(): string[] {
    if (typeof window === "undefined") return [];
    try {
        const raw = sessionStorage.getItem(MELK_HISTORY_STACK_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

/**
 * Checks whether the app is currently running in PWA standalone display mode.
 */
export function isStandalonePwa(): boolean {
    if (typeof window === "undefined") return false;
    return (
        window.matchMedia?.("(display-mode: standalone)").matches ||
        (window.navigator as unknown as { standalone?: boolean })?.standalone === true
    );
}

/**
 * Tracks route navigation depth and route stack across the user's session in this tab/window.
 * Helps determine whether there is valid in-app history before going back.
 */
export function NavigationHistoryTracker() {
    const pathname = usePathname();
    const isInitialMount = useRef(true);

    useEffect(() => {
        if (typeof window === "undefined") return;

        try {
            const currentStack = getInAppHistoryStack();
            const isExternalReferrer =
                !document.referrer || !document.referrer.startsWith(window.location.origin);

            if (isInitialMount.current) {
                isInitialMount.current = false;

                // If user entered from outside (external link, typed URL, PWA standalone launch),
                // or if there is no stack in storage yet, start fresh with just the current pathname.
                if (isExternalReferrer || currentStack.length === 0 || isStandalonePwa()) {
                    // If refreshing an existing page where current pathname is already at top of stack, preserve it
                    if (currentStack.length > 0 && currentStack[currentStack.length - 1] === pathname) {
                        // Preserved stack on reload
                    } else {
                        const newStack = [pathname];
                        sessionStorage.setItem(MELK_HISTORY_STACK_KEY, JSON.stringify(newStack));
                        sessionStorage.setItem(MELK_NAV_COUNT_KEY, "1");
                        return;
                    }
                }
            } else {
                // Route changed within the application (client-side navigation)
                if (currentStack.length > 1 && currentStack[currentStack.length - 2] === pathname) {
                    // User navigated back to previous in-app page
                    currentStack.pop();
                } else if (currentStack[currentStack.length - 1] !== pathname) {
                    // User navigated forward to a new page
                    currentStack.push(pathname);
                    if (currentStack.length > 50) {
                        currentStack.shift();
                    }
                }

                sessionStorage.setItem(MELK_HISTORY_STACK_KEY, JSON.stringify(currentStack));
                sessionStorage.setItem(MELK_NAV_COUNT_KEY, String(currentStack.length));
            }
        } catch {
            // In case sessionStorage is restricted (e.g. strict private mode)
        }
    }, [pathname]);

    // Handle PWA installation event
    useEffect(() => {
        if (typeof window === "undefined") return;

        const handleAppInstalled = () => {
            try {
                // Reset history stack for the installed app instance
                sessionStorage.setItem(MELK_HISTORY_STACK_KEY, JSON.stringify(["/"]));
                sessionStorage.setItem(MELK_NAV_COUNT_KEY, "1");
            } catch {}
        };

        window.addEventListener("appinstalled", handleAppInstalled);
        return () => {
            window.removeEventListener("appinstalled", handleAppInstalled);
        };
    }, []);

    return null;
}
