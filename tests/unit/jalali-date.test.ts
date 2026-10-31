import { describe, it, expect } from "vitest";
import { calculateJalaliAge, getCurrentJalaliYear, JALALI_MONTHS } from "@/scenes/profile";

describe("Jalali Date Utilities", () => {
    it("should return the 12 Jalali months correctly", () => {
        expect(JALALI_MONTHS).toHaveLength(12);
        expect(JALALI_MONTHS[0].name).toBe("فروردین");
        expect(JALALI_MONTHS[0].days).toBe(31);
        expect(JALALI_MONTHS[6].name).toBe("مهر");
        expect(JALALI_MONTHS[6].days).toBe(30);
        expect(JALALI_MONTHS[11].name).toBe("اسفند");
        expect(JALALI_MONTHS[11].days).toBe(29);
    });

    it("should return a plausible current Jalali year (>= 1403)", () => {
        const year = getCurrentJalaliYear();
        expect(year).toBeGreaterThanOrEqual(1403);
    });

    it("should return null if any part of date is missing", () => {
        expect(calculateJalaliAge(null, 1, 1)).toBeNull();
        expect(calculateJalaliAge(1370, null, 1)).toBeNull();
        expect(calculateJalaliAge(1370, 1, null)).toBeNull();
    });

    it("should calculate age correctly", () => {
        const currentYear = getCurrentJalaliYear();
        const age = calculateJalaliAge(currentYear - 20, 1, 1);
        expect(age).toBeGreaterThanOrEqual(19);
        expect(age).toBeLessThanOrEqual(21);
    });
});
