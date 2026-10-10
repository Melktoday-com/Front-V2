"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export const MELK_NAV_COUNT_KEY = "melk_nav_count";

/**
 * Tracks route navigation depth across the user's session in this tab.
 * Helps determine whether there is valid in-app history before going back.
 */
export function NavigationHistoryTracker() {
    const pathname = usePathname();
    const isInitialMount = useRef(true);

    useEffect(() => {
        if (typeof window === "undefined") return;

        try {
            if (isInitialMount.current) {
                isInitialMount.current = false;
                // If there's already a count in this session (e.g. reload or existing tab history),
                // ensure it's at least 1. For a fresh tab, it starts at 1.
                const currentCount = parseInt(sessionStorage.getItem(MELK_NAV_COUNT_KEY) || "0", 10);
                if (currentCount === 0) {
                    sessionStorage.setItem(MELK_NAV_COUNT_KEY, "1");
                }
            } else {
                // Route changed within the application
                const currentCount = parseInt(sessionStorage.getItem(MELK_NAV_COUNT_KEY) || "0", 10);
                sessionStorage.setItem(MELK_NAV_COUNT_KEY, String(currentCount + 1));
            }
        } catch {
            // In case sessionStorage is restricted (e.g. strict private mode)
        }
    }, [pathname]);

    return null;
}
