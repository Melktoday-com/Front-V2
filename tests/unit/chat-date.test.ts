import { describe, it, expect } from "vitest";
import {
    formatConversationDate,
    formatFullDateTime,
    formatMessageDate,
    formatMessageTime,
    isSameMessageDay,
    shouldShowDateSeparator,
} from "@/components/chat/chat-date.utils";

describe("Chat Date Utilities", () => {
    const now = new Date();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
    const twoYearsAgo = new Date(Date.now() - 750 * 24 * 60 * 60 * 1000);

    describe("formatMessageDate", () => {
        it("returns 'امروز' for today's date", () => {
            expect(formatMessageDate(now.toISOString())).toBe("امروز");
        });

        it("returns 'دیروز' for yesterday's date", () => {
            expect(formatMessageDate(yesterday.toISOString())).toBe("دیروز");
        });

        it("returns Persian formatted date for past dates", () => {
            const res = formatMessageDate(tenDaysAgo.toISOString());
            expect(res).not.toBe("امروز");
            expect(res).not.toBe("دیروز");
            expect(res.length).toBeGreaterThan(3);
        });

        it("returns empty string for null, undefined, or invalid dates", () => {
            expect(formatMessageDate(null)).toBe("");
            expect(formatMessageDate(undefined)).toBe("");
            expect(formatMessageDate("invalid-date-string")).toBe("");
        });
    });

    describe("shouldShowDateSeparator", () => {
        it("returns true for the very first message with a valid date", () => {
            expect(shouldShowDateSeparator(now.toISOString(), null)).toBe(true);
            expect(shouldShowDateSeparator(now.toISOString(), undefined)).toBe(true);
        });

        it("returns false for messages on the same day", () => {
            const earlierToday = new Date(now.getTime() - 5000);
            expect(shouldShowDateSeparator(now.toISOString(), earlierToday.toISOString())).toBe(false);
        });

        it("returns true when day changes", () => {
            expect(shouldShowDateSeparator(now.toISOString(), yesterday.toISOString())).toBe(true);
            expect(shouldShowDateSeparator(yesterday.toISOString(), tenDaysAgo.toISOString())).toBe(true);
        });

        it("returns false if current message date is invalid", () => {
            expect(shouldShowDateSeparator("invalid", now.toISOString())).toBe(false);
            expect(shouldShowDateSeparator(null, now.toISOString())).toBe(false);
        });

        it("returns true if previous message date was invalid but current is valid", () => {
            expect(shouldShowDateSeparator(now.toISOString(), "invalid")).toBe(true);
        });
    });

    describe("isSameMessageDay", () => {
        it("returns true for dates on same day", () => {
            const d1 = now.toISOString();
            const d2 = new Date(now.getTime() - 10000).toISOString();
            expect(isSameMessageDay(d1, d2)).toBe(true);
        });

        it("returns false for different days", () => {
            expect(isSameMessageDay(now.toISOString(), yesterday.toISOString())).toBe(false);
        });

        it("returns false if any date is missing or invalid", () => {
            expect(isSameMessageDay(null, now.toISOString())).toBe(false);
            expect(isSameMessageDay(now.toISOString(), null)).toBe(false);
            expect(isSameMessageDay("invalid", now.toISOString())).toBe(false);
        });
    });

    describe("formatMessageTime", () => {
        it("returns time in Persian digits format", () => {
            const time = formatMessageTime(now.toISOString());
            expect(time).toMatch(/[:\u06F0-\u06F90-9]/);
        });

        it("handles invalid inputs gracefully", () => {
            expect(formatMessageTime(null)).toBe("");
            expect(formatMessageTime("invalid")).toBe("");
        });
    });

    describe("formatFullDateTime", () => {
        it("returns detailed Persian date and time string", () => {
            const full = formatFullDateTime(now.toISOString());
            expect(full.length).toBeGreaterThan(5);
        });

        it("handles invalid inputs gracefully", () => {
            expect(formatFullDateTime(null)).toBe("");
            expect(formatFullDateTime("invalid")).toBe("");
        });
    });

    describe("formatConversationDate", () => {
        it("returns time for today", () => {
            const res = formatConversationDate(now.toISOString());
            expect(res).toMatch(/[:\u06F0-\u06F90-9]/);
        });

        it("returns 'دیروز' for yesterday", () => {
            expect(formatConversationDate(yesterday.toISOString())).toBe("دیروز");
        });

        it("returns formatted date for older dates", () => {
            const res = formatConversationDate(twoYearsAgo.toISOString());
            expect(res.length).toBeGreaterThan(3);
        });

        it("handles invalid inputs gracefully", () => {
            expect(formatConversationDate(null)).toBe("");
            expect(formatConversationDate("invalid")).toBe("");
        });
    });
});
