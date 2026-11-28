import { describe, expect, it } from "vitest";
import { sanitizePricingPayload } from "@/lib/utils";

describe("sanitizePricingPayload", () => {
    it("drops empty strings, null, undefined, and NaN while preserving 0 and false", () => {
        const result = sanitizePricingPayload({
            monthlyRent: 20000000,
            prepaidMonths: "",
            extraGuestNightlyPrice: "   ",
            securityDeposit: 0,
            isConvertible: false,
            badNum: Number.NaN,
            missing: undefined,
            nullable: null,
        });

        expect(result).toEqual({
            monthlyRent: 20000000,
            securityDeposit: 0,
            isConvertible: false,
        });
    });

    it("strips stale pricing keys belonging to previously selected models", () => {
        const result = sanitizePricingPayload(
            {
                monthlyRent: 15000000,
                depositPrice: 500000000,
                isConvertible: false,
                conversionRate: 3,
                minDeposit: 250000000,
            },
            ["monthlyRent", "prepaidMonths"],
        );

        expect(result).toEqual({
            monthlyRent: 15000000,
        });
    });
});
