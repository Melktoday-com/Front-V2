import assert from "node:assert/strict";
import { toEnglishDigits, toOnlyDigits, toPersianDigits } from "../lib/utils.ts";

console.log("Running digit conversion tests...");

// 1. Basic Persian digits (۰-۹)
assert.equal(toEnglishDigits("۰۱۲۳۴۵۶۷۸۹"), "0123456789");
assert.equal(toEnglishDigits("۹"), "9", "۹ must convert to 9, not 57");
assert.equal(toEnglishDigits("۰"), "0", "۰ must convert to 0, not 48");

// 2. Arabic digits (٠-٩)
assert.equal(toEnglishDigits("٠١٢٣٤٥٦٧٨٩"), "0123456789");

// 3. Mixed digits
assert.equal(toEnglishDigits("۰1۲3۴5۶7۸9٠"), "01234567890");

// 4. Phone numbers with symbols
assert.equal(toEnglishDigits("+۹۸۹۱۲۳۴۵۶۷۸۹"), "+989123456789");
assert.equal(toEnglishDigits("۰۹۱۲-۳۴۵-۶۷۸۹"), "0912-345-6789");

// 5. toOnlyDigits (strips non-digits)
assert.equal(toOnlyDigits("+۹۸۹۱۲۳۴۵۶۷۸۹"), "989123456789");
assert.equal(toOnlyDigits("۰۹۱۲-۳۴۵-۶۷۸۹"), "09123456789");
assert.equal(toOnlyDigits("کد تایید: ۱۲۳۴۵۶"), "123456");
assert.equal(toOnlyDigits("۱۵۰,۰۰۰ تومان"), "150000");

// 6. Falsy and edge values
assert.equal(toEnglishDigits(null), "");
assert.equal(toEnglishDigits(undefined), "");
assert.equal(toEnglishDigits(""), "");
assert.equal(toEnglishDigits(987), "987");
assert.equal(toOnlyDigits(null), "");
assert.equal(toOnlyDigits(undefined), "");

// 7. Round trip with toPersianDigits
const testNum = "09123456789";
assert.equal(toEnglishDigits(toPersianDigits(testNum)), testNum);

console.log("✅ All tests passed successfully!");
