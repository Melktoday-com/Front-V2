import { describe, expect, it } from "vitest";

describe("Rental convertible pricing helper logic", () => {
  function prepareRentalPricingValues(
    rawPricing: Record<string, number | boolean | string>,
    priceModelKey: string,
    categoryKey?: string
  ) {
    const resolvedPricingValues = { ...rawPricing };
    const isRentalCategory =
      priceModelKey === "HYBRID_RENT_DEPOSIT" ||
      priceModelKey === "FULL_RENTAL_DEPOSIT" ||
      categoryKey?.includes("rental");

    if (isRentalCategory) {
      const isTicked = Boolean(
        resolvedPricingValues.isConvertible || resolvedPricingValues.convertible
      );
      if (isTicked) {
        resolvedPricingValues.isConvertible = true;
        const dep = Number(resolvedPricingValues.depositPrice) || 0;
        const rent = Number(resolvedPricingValues.monthlyRent) || 0;
        resolvedPricingValues.conversionRate = 3; // 3% monthly standard rate
        if (dep > 0) {
          resolvedPricingValues.minDeposit = Math.max(
            0,
            Math.round((dep * 0.5) / 1_000_000) * 1_000_000
          );
        } else if (rent > 0) {
          resolvedPricingValues.minDeposit = 0;
        }
      } else {
        resolvedPricingValues.isConvertible = false;
        delete resolvedPricingValues.conversionRate;
        delete resolvedPricingValues.minDeposit;
      }
    }

    return resolvedPricingValues;
  }

  it("handles ticking convertible for hybrid rent and calculates proportional backend values", () => {
    const input = {
      depositPrice: 200_000_000,
      monthlyRent: 6_000_000,
      isConvertible: true,
    };

    const result = prepareRentalPricingValues(input, "HYBRID_RENT_DEPOSIT", "residential_rental");

    expect(result.isConvertible).toBe(true);
    expect(result.conversionRate).toBe(3);
    expect(result.minDeposit).toBe(100_000_000);
  });

  it("handles unticking convertible and strips backend conversion fields", () => {
    const input = {
      depositPrice: 200_000_000,
      monthlyRent: 6_000_000,
      isConvertible: false,
    };

    const result = prepareRentalPricingValues(input, "HYBRID_RENT_DEPOSIT", "residential_rental");

    expect(result.isConvertible).toBe(false);
    expect(result.conversionRate).toBeUndefined();
    expect(result.minDeposit).toBeUndefined();
  });

  it("sets minDeposit to 0 when deposit is 0 but monthly rent exists", () => {
    const input = {
      depositPrice: 0,
      monthlyRent: 15_000_000,
      isConvertible: true,
    };

    const result = prepareRentalPricingValues(input, "HYBRID_RENT_DEPOSIT", "residential_rental");

    expect(result.isConvertible).toBe(true);
    expect(result.conversionRate).toBe(3);
    expect(result.minDeposit).toBe(0);
  });

  it("works with FULL_RENTAL_DEPOSIT as well", () => {
    const input = {
      depositPrice: 500_000_000,
      isConvertible: true,
    };

    const result = prepareRentalPricingValues(input, "FULL_RENTAL_DEPOSIT", "residential_rental");

    expect(result.isConvertible).toBe(true);
    expect(result.conversionRate).toBe(3);
    expect(result.minDeposit).toBe(250_000_000);
  });
});
