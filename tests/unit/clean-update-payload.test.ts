import { describe, it, expect } from "vitest";
import { cleanUpdatePayload } from "@/lib/utils";

describe("cleanUpdatePayload", () => {
    it("omits empty slug when both current and initial are empty", () => {
        const initial = {
            agencyName: "املاک پارس",
            slug: "",
            bio: "",
            phone: "02112345678",
        };
        const current = {
            agencyName: "املاک پارس",
            slug: "",
            bio: "توضیحات جدید",
            phone: "02112345678",
        };

        const result = cleanUpdatePayload(current, initial);

        expect(result).toEqual({
            agencyName: "املاک پارس",
            bio: "توضیحات جدید",
            phone: "02112345678",
        });
        expect(result.slug).toBeUndefined();
    });

    it("omits slug if current value is empty even if initial had a slug", () => {
        const initial = {
            agencyName: "املاک پارس",
            slug: "pars-agency",
        };
        const current = {
            agencyName: "املاک پارس",
            slug: "",
        };

        const result = cleanUpdatePayload(current, initial);

        expect(result).toEqual({
            agencyName: "املاک پارس",
        });
        expect(result.slug).toBeUndefined();
    });

    it("omits slug if current value is only whitespace", () => {
        const initial = {
            agencyName: "املاک پارس",
            slug: "",
        };
        const current = {
            agencyName: "املاک پارس",
            slug: "   ",
        };

        const result = cleanUpdatePayload(current, initial);

        expect(result).toEqual({
            agencyName: "املاک پارس",
        });
        expect(result.slug).toBeUndefined();
    });

    it("includes slug if non-empty and trims whitespace", () => {
        const initial = {
            agencyName: "املاک پارس",
            slug: "",
        };
        const current = {
            agencyName: "املاک پارس",
            slug: "  pars-agency  ",
        };

        const result = cleanUpdatePayload(current, initial);

        expect(result).toEqual({
            agencyName: "املاک پارس",
            slug: "pars-agency",
        });
    });

    it("omits empty fields that were also empty/null/undefined in initial values", () => {
        const initial = {
            hostName: "ویلا لوکس",
            slug: "",
            bio: "",
            website: undefined as string | undefined,
            address: "",
        };
        const current = {
            hostName: "ویلا لوکس اختصاصی",
            slug: "",
            bio: "",
            website: "",
            address: "",
        };

        const result = cleanUpdatePayload(current, initial);

        expect(result).toEqual({
            hostName: "ویلا لوکس اختصاصی",
        });
        expect(result).not.toHaveProperty("slug");
        expect(result).not.toHaveProperty("bio");
        expect(result).not.toHaveProperty("website");
        expect(result).not.toHaveProperty("address");
    });

    it("retains cleared empty string for a field that had a non-empty initial value", () => {
        const initial = {
            agencyName: "املاک پارس",
            bio: "توضیحات قدیمی",
            website: "https://example.com",
        };
        const current = {
            agencyName: "املاک پارس",
            bio: "",
            website: "   ",
        };

        const result = cleanUpdatePayload(current, initial);

        expect(result).toEqual({
            agencyName: "املاک پارس",
            bio: "",
            website: "",
        });
    });

    it("works correctly when initialValues is null or undefined", () => {
        const current = {
            hostName: "ویلا دریا",
            slug: "",
            bio: "  فضای آرامش‌بخش  ",
            phone: "",
        };

        const result = cleanUpdatePayload(current, null);

        expect(result).toEqual({
            hostName: "ویلا دریا",
            bio: "فضای آرامش‌بخش",
        });
        expect(result.slug).toBeUndefined();
        expect(result.phone).toBeUndefined();
    });
});
