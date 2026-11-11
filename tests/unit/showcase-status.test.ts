import { describe, it, expect, vi, beforeEach } from "vitest";
import apiClient from "@/lib/api/client";
import { agencyService } from "@/services/agency.service";
import { showcaseService } from "@/services/showcase.service";

vi.mock("@/lib/api/client", () => ({
    default: {
        patch: vi.fn(),
        get: vi.fn(),
        put: vi.fn(),
        post: vi.fn(),
        delete: vi.fn(),
    },
}));

describe("Showcase Status Services", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("agencyService.updateMyShowcaseStatus", () => {
        it("should send PATCH /agencies/my-showcase/status with isActive: false", async () => {
            const mockResponse = { data: { id: "agency-1", isActive: false } };
            vi.mocked(apiClient.patch).mockResolvedValue(mockResponse);

            const result = await agencyService.updateMyShowcaseStatus(false);

            expect(apiClient.patch).toHaveBeenCalledWith(
                "/agencies/my-showcase/status",
                { isActive: false },
            );
            expect(result).toEqual({ id: "agency-1", isActive: false });
        });

        it("should send PATCH /agencies/my-showcase/status with isActive: true", async () => {
            const mockResponse = { data: { id: "agency-1", isActive: true } };
            vi.mocked(apiClient.patch).mockResolvedValue(mockResponse);

            const result = await agencyService.updateMyShowcaseStatus(true);

            expect(apiClient.patch).toHaveBeenCalledWith(
                "/agencies/my-showcase/status",
                { isActive: true },
            );
            expect(result).toEqual({ id: "agency-1", isActive: true });
        });
    });

    describe("showcaseService.updateMyHostStatus", () => {
        it("should send PATCH /hosts/my-profile/status with isActive: false", async () => {
            const mockResponse = { data: { id: "host-1", isActive: false } };
            vi.mocked(apiClient.patch).mockResolvedValue(mockResponse);

            const result = await showcaseService.updateMyHostStatus(false);

            expect(apiClient.patch).toHaveBeenCalledWith(
                "/hosts/my-profile/status",
                { isActive: false },
            );
            expect(result).toEqual({ id: "host-1", isActive: false });
        });

        it("should send PATCH /hosts/my-profile/status with isActive: true", async () => {
            const mockResponse = { data: { id: "host-1", isActive: true } };
            vi.mocked(apiClient.patch).mockResolvedValue(mockResponse);

            const result = await showcaseService.updateMyHostStatus(true);

            expect(apiClient.patch).toHaveBeenCalledWith(
                "/hosts/my-profile/status",
                { isActive: true },
            );
            expect(result).toEqual({ id: "host-1", isActive: true });
        });
    });
});
