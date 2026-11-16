import { describe, it, expect, vi, beforeEach } from "vitest";

// Mocks
const mockReplace = vi.fn();
const mockPush = vi.fn();
const mockToastInfo = vi.fn();

let mockCapturedEffects: (() => void | (() => void))[] = [];

vi.mock("react", async (importOriginal) => {
    const actual = await importOriginal<typeof import("react")>();
    return {
        ...actual,
        useState: (initial: unknown) => [initial, vi.fn()],
        useEffect: (effect: () => void | (() => void)) => {
            mockCapturedEffects.push(effect);
        },
    };
});

vi.mock("next/navigation", () => ({
    useRouter: () => ({
        replace: mockReplace,
        push: mockPush,
    }),
    usePathname: () => "/profile",
}));

vi.mock("sonner", () => ({
    toast: {
        info: (...args: unknown[]) => mockToastInfo(...args),
        error: vi.fn(),
        success: vi.fn(),
    },
}));

let mockAuthState = {
    user: null as null | { sessionId: string },
    isLoggedIn: false,
    activeRole: null as null | string,
    hasPermission: () => false,
    isLoading: false,
};

vi.mock("@/hooks/useAuth", () => ({
    useAuth: () => mockAuthState,
}));

import { AccessGuard } from "@/components/AccessGuard";

describe("AccessGuard Redirect Behavior", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockCapturedEffects = [];
        mockAuthState = {
            user: null,
            isLoggedIn: false,
            activeRole: null,
            hasPermission: () => false,
            isLoading: false,
        };
    });

    it("should export AccessGuard component", () => {
        expect(AccessGuard).toBeDefined();
        expect(typeof AccessGuard).toBe("function");
    });

    it("verifies AccessGuard uses router.replace to avoid redirect loop for unauthenticated users", () => {
        AccessGuard({ children: "Protected Content" });

        // Run captured effect
        for (const effect of mockCapturedEffects) {
            effect();
        }

        expect(mockReplace).toHaveBeenCalledWith("/auth?redirect=%2Fprofile");
        expect(mockPush).not.toHaveBeenCalled();
        expect(mockToastInfo).toHaveBeenCalledWith("برای دسترسی به این بخش، لطفاً ابتدا وارد حساب کاربری خود شوید.");
    });

    it("does not redirect when user is logged in", () => {
        mockAuthState = {
            user: { sessionId: "sess-1" },
            isLoggedIn: true,
            activeRole: "user",
            hasPermission: () => true,
            isLoading: false,
        };

        AccessGuard({ children: "Protected Content" });

        for (const effect of mockCapturedEffects) {
            effect();
        }

        expect(mockReplace).not.toHaveBeenCalled();
        expect(mockPush).not.toHaveBeenCalled();
    });
});
