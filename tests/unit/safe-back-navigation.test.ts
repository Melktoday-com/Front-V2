import { describe, it, expect, vi, beforeEach } from "vitest";
import { hasInAppHistory } from "@/hooks/useSafeBack";
import {
    MELK_HISTORY_STACK_KEY,
    MELK_NAV_COUNT_KEY,
    getInAppHistoryStack,
    isStandalonePwa,
} from "@/components/providers/NavigationHistoryTracker";

describe("Navigation & Safe Back System", () => {
    let mockStorage: Record<string, string> = {};

    beforeEach(() => {
        vi.clearAllMocks();
        mockStorage = {};

        const sessionStorageMock = {
            getItem: (key: string) => mockStorage[key] || null,
            setItem: (key: string, value: string) => {
                mockStorage[key] = value;
            },
            removeItem: (key: string) => {
                delete mockStorage[key];
            },
            clear: () => {
                mockStorage = {};
            },
        };

        // Mock window and document on globalThis
        (globalThis as any).window = {
            history: { length: 1, back: vi.fn() },
            location: { origin: "https://melktoday.com", href: "https://melktoday.com/ads/123" },
            sessionStorage: sessionStorageMock,
            matchMedia: vi.fn().mockImplementation((query: string) => ({
                matches: false,
                media: query,
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
            })),
            navigator: { standalone: false },
        };

        (globalThis as any).sessionStorage = sessionStorageMock;

        (globalThis as any).document = {
            referrer: "",
        };
    });

    describe("getInAppHistoryStack", () => {
        it("returns empty array when nothing is stored", () => {
            expect(getInAppHistoryStack()).toEqual([]);
        });

        it("parses valid JSON array from sessionStorage", () => {
            mockStorage[MELK_HISTORY_STACK_KEY] = JSON.stringify(["/", "/ads/123"]);
            expect(getInAppHistoryStack()).toEqual(["/", "/ads/123"]);
        });

        it("handles corrupted storage gracefully", () => {
            mockStorage[MELK_HISTORY_STACK_KEY] = "invalid-json";
            expect(getInAppHistoryStack()).toEqual([]);
        });
    });

    describe("isStandalonePwa", () => {
        it("detects standalone display-mode via matchMedia", () => {
            (globalThis as any).window.matchMedia = vi.fn().mockImplementation((query: string) => ({
                matches: query === "(display-mode: standalone)",
                media: query,
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
            }));
            expect(isStandalonePwa()).toBe(true);
        });

        it("detects iOS standalone mode via navigator.standalone", () => {
            (globalThis as any).window.navigator.standalone = true;
            expect(isStandalonePwa()).toBe(true);
        });

        it("returns false for regular browser mode", () => {
            expect(isStandalonePwa()).toBe(false);
        });
    });

    describe("hasInAppHistory", () => {
        it("returns false when window.history.length <= 1", () => {
            (globalThis as any).window.history.length = 1;
            mockStorage[MELK_HISTORY_STACK_KEY] = JSON.stringify(["/", "/ads/123"]);
            expect(hasInAppHistory()).toBe(false);
        });

        it("returns false when user directly landed on ad page (stack length is 1)", () => {
            (globalThis as any).window.history.length = 2; // e.g. new tab in mobile Chrome
            mockStorage[MELK_HISTORY_STACK_KEY] = JSON.stringify(["/ads/123"]);
            expect(hasInAppHistory()).toBe(false);
        });

        it("returns false in PWA standalone mode when stack length is <= 1", () => {
            (globalThis as any).window.history.length = 2;
            mockStorage[MELK_HISTORY_STACK_KEY] = JSON.stringify(["/ads/123"]);

            (globalThis as any).window.matchMedia = vi.fn().mockImplementation((query: string) => ({
                matches: query === "(display-mode: standalone)",
                media: query,
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
            }));

            expect(isStandalonePwa()).toBe(true);
            expect(hasInAppHistory()).toBe(false);
        });

        it("returns true when user navigated within the app (stack length > 1)", () => {
            (globalThis as any).window.history.length = 2;
            mockStorage[MELK_HISTORY_STACK_KEY] = JSON.stringify(["/", "/ads/123"]);
            expect(hasInAppHistory()).toBe(true);
        });

        it("falls back to navCount when stack is absent and referrer is external", () => {
            (globalThis as any).window.history.length = 2;
            mockStorage[MELK_NAV_COUNT_KEY] = "1";
            (globalThis as any).document.referrer = "https://google.com";
            expect(hasInAppHistory()).toBe(false);
        });
    });
});
