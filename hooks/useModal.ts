"use client";

import { useEffect, useRef } from "react";

/**
 * useModalFreeze:
 * Programmatic hook to freeze/unfreeze body and trap focus for a specific modal ref.
 */
export function useModalFreeze(isOpen: boolean, modalRef?: React.RefObject<HTMLElement | null>) {
    const previousFocusRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        if (!isOpen) return;

        previousFocusRef.current = document.activeElement as HTMLElement | null;

        const originalOverflow = document.body.style.overflow;
        const originalHtmlOverflow = document.documentElement.style.overflow;

        document.body.style.overflow = "hidden";
        document.documentElement.style.overflow = "hidden";
        document.body.classList.add("modal-open");
        document.documentElement.classList.add("modal-open");

        // Focus modal or first input inside
        const timer = setTimeout(() => {
            if (modalRef?.current) {
                const input = modalRef.current.querySelector<HTMLElement>(
                    'input:not([disabled]):not([type="hidden"]), textarea:not([disabled])'
                );
                const firstFocusable = modalRef.current.querySelector<HTMLElement>(
                    'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                );
                const target = input || firstFocusable || modalRef.current;
                target.focus({ preventScroll: true });
            }
        }, 50);

        return () => {
            clearTimeout(timer);
            document.body.style.overflow = originalOverflow;
            document.documentElement.style.overflow = originalHtmlOverflow;
            document.body.classList.remove("modal-open");
            document.documentElement.classList.remove("modal-open");

            if (previousFocusRef.current && document.body.contains(previousFocusRef.current)) {
                previousFocusRef.current.focus({ preventScroll: true });
            }
        };
    }, [isOpen, modalRef]);
}
