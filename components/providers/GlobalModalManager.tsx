"use client";

import { useEffect } from "react";

/**
 * GlobalModalManager:
 * Automatically freezes background document body, traps/directs focus,
 * and handles mobile/browser hardware back button (popstate) to dismiss modals
 * instead of navigating away.
 */
export function GlobalModalManager() {
    useEffect(() => {
        if (typeof window === "undefined" || typeof document === "undefined") return;

        const activeModals = new Set<HTMLElement>();
        const historyPushedModals = new Set<HTMLElement>();
        let isHandlingPopState = false;
        let previousActiveElement: HTMLElement | null = null;
        let originalBodyOverflow = "";
        let originalHtmlOverflow = "";
        let originalBodyPaddingRight = "";

        const isModalOverlay = (element: Element | null): boolean => {
            if (!element || !(element instanceof HTMLElement)) return false;

            // Never treat document body, html, or full-page chat as a modal
            if (element.tagName === "BODY" || element.tagName === "HTML") return false;
            if (
                element.classList.contains("chat-page-content") ||
                element.closest(".chat-page-content")
            ) {
                return false;
            }

            // Explicit semantic modal markers
            const role = element.getAttribute("role");
            if (role === "dialog" || role === "alertdialog") {
                if (element.getAttribute("aria-hidden") === "true") return false;
                return true;
            }
            if (element.getAttribute("aria-modal") === "true") {
                if (element.getAttribute("aria-hidden") === "true") return false;
                return true;
            }
            if (element.hasAttribute("data-modal")) return true;

            // HTML5 native dialog element
            if (
                element.tagName.toLowerCase() === "dialog" &&
                (element as HTMLDialogElement).open
            ) {
                return true;
            }

            // Inactive overlay check
            const classList = element.classList;
            if (classList.contains("hidden")) return false;
            if (
                classList.contains("pointer-events-none") &&
                classList.contains("opacity-0")
            ) {
                return false;
            }
            if (element.getAttribute("aria-hidden") === "true") return false;

            // Tailwind fixed backdrop overlay with high z-index signature
            const isFixed = classList.contains("fixed");
            const isInset0 = classList.contains("inset-0");

            if (isFixed && isInset0) {
                // Must have high positive z-index (z-30, z-40, z-50, z-60, z-10000, etc.) and not z-[-1]
                const hasHighZ = Array.from(classList).some(
                    (cls) =>
                        cls.startsWith("z-") &&
                        cls !== "z-0" &&
                        cls !== "z-10" &&
                        cls !== "z-20" &&
                        !cls.includes("-[-1]")
                );
                if (hasHighZ) return true;

                const computedZ = parseInt(window.getComputedStyle(element).zIndex, 10);
                if (!isNaN(computedZ) && computedZ >= 30) return true;
            }

            return false;
        };

        const lockBody = () => {
            if (activeModals.size === 1) {
                originalBodyOverflow = document.body.style.overflow;
                originalHtmlOverflow = document.documentElement.style.overflow;
                originalBodyPaddingRight = document.body.style.paddingRight;

                // Prevent layout shift from scrollbar disappearing on desktop
                const scrollbarWidth =
                    window.innerWidth - document.documentElement.clientWidth;
                if (scrollbarWidth > 0) {
                    document.body.style.paddingRight = `${scrollbarWidth}px`;
                }

                document.body.style.overflow = "hidden";
                document.documentElement.style.overflow = "hidden";
                document.body.classList.add("modal-open");
                document.documentElement.classList.add("modal-open");

                // Explicitly hide mobile bottom navigation bar when modal opens
                const bottomNavs = document.querySelectorAll(
                    'nav[aria-label="منوی موبایل"], .mobile-bottom-nav'
                );
                bottomNavs.forEach((nav) => {
                    (nav as HTMLElement).style.setProperty("display", "none", "important");
                });
            }
        };

        const unlockBody = () => {
            if (activeModals.size === 0) {
                document.body.style.overflow = originalBodyOverflow;
                document.documentElement.style.overflow = originalHtmlOverflow;
                document.body.style.paddingRight = originalBodyPaddingRight;
                document.body.classList.remove("modal-open");
                document.documentElement.classList.remove("modal-open");

                // Restore mobile bottom navigation bar when all modals close
                const bottomNavs = document.querySelectorAll(
                    'nav[aria-label="منوی موبایل"], .mobile-bottom-nav'
                );
                bottomNavs.forEach((nav) => {
                    (nav as HTMLElement).style.removeProperty("display");
                });
            }
        };

        const focusModal = (modalEl: HTMLElement) => {
            if (!modalEl || !document.body.contains(modalEl)) return;
            if (modalEl.contains(document.activeElement)) return;

            const FOCUSABLE_SELECTOR = [
                'input:not([disabled]):not([type="hidden"])',
                'textarea:not([disabled])',
                'select:not([disabled])',
                'button:not([disabled])',
                'a[href]',
                '[tabindex]:not([tabindex="-1"])',
            ].join(", ");

            const focusables = Array.from(
                modalEl.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
            ).filter(
                (el) =>
                    el.offsetParent !== null &&
                    window.getComputedStyle(el).visibility !== "hidden"
            );

            // Prioritize input or textarea (search inputs, form inputs)
            const primaryInput = focusables.find(
                (el) => el.tagName === "INPUT" || el.tagName === "TEXTAREA"
            );

            const targetToFocus = primaryInput || focusables[0];

            if (targetToFocus) {
                try {
                    targetToFocus.focus({ preventScroll: true });
                } catch {}
            } else {
                if (!modalEl.hasAttribute("tabindex")) {
                    modalEl.setAttribute("tabindex", "-1");
                }
                try {
                    modalEl.focus({ preventScroll: true });
                } catch {}
            }
        };

        const triggerModalClose = (modalEl: HTMLElement): boolean => {
            if (!modalEl || !document.body.contains(modalEl)) return false;

            // 1. Look for explicit close trigger
            const explicitClose = modalEl.querySelector<HTMLElement>("[data-modal-close]");
            if (explicitClose) {
                explicitClose.click();
                return true;
            }

            // 2. Look for button containing standard X icon
            const xIcon = modalEl.querySelector("svg.lucide-x, svg[data-icon='x']");
            if (xIcon) {
                const closeBtn = xIcon.closest("button");
                if (closeBtn) {
                    closeBtn.click();
                    return true;
                }
            }

            // 3. Look for button with aria-label or title containing close
            const labelledCloseBtn = modalEl.querySelector<HTMLElement>(
                'button[aria-label*="بستن"], button[aria-label*="close"], button[aria-label*="Close"], button[title*="بستن"], button[title*="close"]'
            );
            if (labelledCloseBtn) {
                labelledCloseBtn.click();
                return true;
            }

            // 4. Look for cancel button in Persian
            const buttons = Array.from(modalEl.querySelectorAll<HTMLButtonElement>("button"));
            const cancelBtn = buttons.find((btn) => {
                const txt = btn.textContent?.trim();
                return txt === "انصراف" || txt === "لغو" || txt === "بازگشت";
            });
            if (cancelBtn) {
                cancelBtn.click();
                return true;
            }

            // 5. Look for backdrop overlay with click listener
            const backdrop = modalEl.querySelector<HTMLElement>(
                '.backdrop-blur-sm, .backdrop-blur-xs, [class*="bg-black/"], [class*="bg-slate-900/"], [class*="bg-brand/"]'
            );
            if (backdrop) {
                backdrop.click();
                return true;
            }

            // 6. Click outer container
            modalEl.click();

            // 7. Dispatch Escape key event
            modalEl.dispatchEvent(
                new KeyboardEvent("keydown", {
                    key: "Escape",
                    code: "Escape",
                    keyCode: 27,
                    which: 27,
                    bubbles: true,
                    cancelable: true,
                })
            );

            return true;
        };

        const registerModal = (modalEl: HTMLElement) => {
            if (activeModals.has(modalEl)) return;

            if (activeModals.size === 0) {
                previousActiveElement = document.activeElement as HTMLElement | null;
            }

            activeModals.add(modalEl);
            lockBody();

            // Manage history push for mobile back button interception
            // Do not double-push if the modal itself already pushed its own state (e.g. melktodayTicketOpen)
            if (
                typeof window !== "undefined" &&
                !window.history.state?.melktodayTicketOpen &&
                !modalEl.hasAttribute("data-history-handled")
            ) {
                try {
                    window.history.pushState(
                        { melktodayModal: true, timestamp: Date.now() },
                        ""
                    );
                    historyPushedModals.add(modalEl);
                } catch {}
            }

            // Focus in next animation frame
            setTimeout(() => {
                if (activeModals.has(modalEl)) {
                    focusModal(modalEl);
                }
            }, 50);
        };

        const unregisterModal = (modalEl: HTMLElement) => {
            if (!activeModals.has(modalEl)) return;

            activeModals.delete(modalEl);

            // If history state was pushed for this modal and this unregister was NOT initiated by popstate,
            // clean up the pushed history entry to prevent ghost states in the browser stack
            if (historyPushedModals.has(modalEl)) {
                historyPushedModals.delete(modalEl);
                if (!isHandlingPopState) {
                    if (
                        typeof window !== "undefined" &&
                        window.history.state?.melktodayModal
                    ) {
                        try {
                            window.history.back();
                        } catch {}
                    }
                }
            }

            unlockBody();

            if (activeModals.size === 0) {
                if (
                    previousActiveElement &&
                    document.body.contains(previousActiveElement)
                ) {
                    try {
                        previousActiveElement.focus({ preventScroll: true });
                    } catch {}
                }
                previousActiveElement = null;
            } else {
                // Focus previous top modal
                const remaining = Array.from(activeModals);
                const topModal = remaining[remaining.length - 1];
                if (topModal) {
                    focusModal(topModal);
                }
            }
        };

        // Handle mobile phone / browser back button
        const handlePopState = () => {
            if (activeModals.size > 0) {
                isHandlingPopState = true;
                const remaining = Array.from(activeModals);
                const topModal = remaining[remaining.length - 1];

                if (topModal) {
                    historyPushedModals.delete(topModal);
                    triggerModalClose(topModal);
                }

                // Guarantee body unfreeze if all modals closed
                setTimeout(() => {
                    isHandlingPopState = false;
                    if (activeModals.size === 0) {
                        unlockBody();
                    }
                }, 100);
            }
        };

        // Keyboard focus trap & Escape key
        const handleKeydown = (e: KeyboardEvent) => {
            if (activeModals.size === 0) return;

            const currentModal = Array.from(activeModals)[activeModals.size - 1];
            if (!currentModal || !document.body.contains(currentModal)) return;

            if (e.key === "Tab") {
                const FOCUSABLE_SELECTOR = [
                    'input:not([disabled]):not([type="hidden"])',
                    'textarea:not([disabled])',
                    'select:not([disabled])',
                    'button:not([disabled])',
                    'a[href]',
                    '[tabindex]:not([tabindex="-1"])',
                ].join(", ");

                const focusables = Array.from(
                    currentModal.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
                ).filter(
                    (el) =>
                        el.offsetParent !== null &&
                        window.getComputedStyle(el).visibility !== "hidden"
                );

                if (focusables.length === 0) {
                    e.preventDefault();
                    return;
                }

                const first = focusables[0];
                const last = focusables[focusables.length - 1];

                if (e.shiftKey) {
                    if (
                        document.activeElement === first ||
                        !currentModal.contains(document.activeElement)
                    ) {
                        e.preventDefault();
                        last.focus();
                    }
                } else {
                    if (
                        document.activeElement === last ||
                        !currentModal.contains(document.activeElement)
                    ) {
                        e.preventDefault();
                        first.focus();
                    }
                }
            } else if (e.key === "Escape") {
                triggerModalClose(currentModal);
            }
        };

        // Initial scan for modals on mount
        const scan = () => {
            const elements = document.querySelectorAll(
                '[role="dialog"], [role="alertdialog"], [aria-modal="true"], [data-modal], .fixed.inset-0'
            );
            elements.forEach((el) => {
                if (isModalOverlay(el)) {
                    registerModal(el as HTMLElement);
                }
            });
        };

        scan();

        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === "childList") {
                    mutation.addedNodes.forEach((node) => {
                        if (node instanceof HTMLElement) {
                            if (isModalOverlay(node)) {
                                registerModal(node);
                            } else {
                                const nested = node.querySelectorAll?.(
                                    '[role="dialog"], [role="alertdialog"], [aria-modal="true"], [data-modal], .fixed.inset-0'
                                );
                                nested?.forEach((child) => {
                                    if (isModalOverlay(child))
                                        registerModal(child as HTMLElement);
                                });
                            }
                        }
                    });

                    mutation.removedNodes.forEach((node) => {
                        if (node instanceof HTMLElement) {
                            if (activeModals.has(node)) {
                                unregisterModal(node);
                            } else {
                                // Check if any registered modal was inside the removed tree
                                activeModals.forEach((modalEl) => {
                                    if (!document.body.contains(modalEl)) {
                                        unregisterModal(modalEl);
                                    }
                                });
                            }
                        }
                    });
                } else if (mutation.type === "attributes") {
                    const target = mutation.target as HTMLElement;
                    if (target instanceof HTMLElement) {
                        if (isModalOverlay(target)) {
                            registerModal(target);
                        } else if (activeModals.has(target)) {
                            unregisterModal(target);
                        }
                    }
                }
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ["class", "style", "aria-hidden", "hidden", "open"],
        });

        window.addEventListener("popstate", handlePopState);
        window.addEventListener("keydown", handleKeydown, true);

        return () => {
            observer.disconnect();
            window.removeEventListener("popstate", handlePopState);
            window.removeEventListener("keydown", handleKeydown, true);
            activeModals.clear();
            historyPushedModals.clear();
            unlockBody();
        };
    }, []);

    return null;
}
