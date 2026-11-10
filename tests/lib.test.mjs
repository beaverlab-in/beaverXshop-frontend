// Run with: npm test   (Node's built-in test runner, no extra dependencies)
import test from "node:test";
import assert from "node:assert/strict";
import { divRound, formatINR, taxFromExclusive, taxFromInclusive } from "../src/lib/money.js";
import { isValidPincode, normalizeMobile, validateAddress } from "../src/lib/validation.js";

test("divRound rounds half up with integers", () => {
  assert.equal(divRound(5, 2), 3);
  assert.equal(divRound(4, 2), 2);
  assert.equal(divRound(1, 3), 0);
  assert.equal(divRound(2, 3), 1);
});

test("GST inclusive: 18% of a 1,180.00 price is 180.00", () => {
  assert.equal(taxFromInclusive(118000, 1800), 18000);
});

test("GST inclusive: rounds to whole paise and taxable + tax equals the price", () => {
  const price = 149900;
  const tax = taxFromInclusive(price, 1800);
  assert.equal(tax, 22866); // 149900 - round(149900/1.18 = 127033.9) = 149900 - 127034
  assert.equal(price - tax, 127034);
});

test("GST exclusive: 5% on 999.00", () => {
  assert.equal(taxFromExclusive(99900, 500), 4995);
});

test("GST at 0% is zero", () => {
  assert.equal(taxFromInclusive(10000, 0), 0);
  assert.equal(taxFromExclusive(10000, 0), 0);
});

test("formatINR shows whole rupees without decimals and paise when present", () => {
  assert.match(formatINR(149900), /^₹1,499$/);
  assert.match(formatINR(149950), /^₹1,499\.50$/);
});

test("normalizeMobile accepts common Indian formats and rejects bad ones", () => {
  assert.equal(normalizeMobile("98765 43210"), "9876543210");
  assert.equal(normalizeMobile("+91 98765-43210"), "9876543210");
  assert.equal(normalizeMobile("09876543210"), "9876543210");
  assert.equal(normalizeMobile("1234567890"), ""); // must start 6-9
  assert.equal(normalizeMobile("98765"), "");
  assert.equal(normalizeMobile(""), "");
});

test("PIN code validation", () => {
  assert.equal(isValidPincode("560001"), true);
  assert.equal(isValidPincode("060001"), false); // cannot start with 0
  assert.equal(isValidPincode("56001"), false);
  assert.equal(isValidPincode("56000A"), false);
});

test("validateAddress reports every missing field and normalises valid input", () => {
  const bad = validateAddress({});
  for (const key of ["fullName", "mobile", "pincode", "state", "city", "house", "street"]) {
    assert.ok(bad.errors[key], `expected an error for ${key}`);
  }
  const ok = validateAddress({
    fullName: "  Asha Rao ",
    mobile: "+91 98765 43210",
    pincode: "560001",
    state: "Karnataka",
    city: "Bengaluru",
    house: "12",
    street: "MG Road",
    type: "work",
  });
  assert.deepEqual(ok.errors, {});
  assert.equal(ok.values.fullName, "Asha Rao");
  assert.equal(ok.values.mobile, "9876543210");
  assert.equal(ok.values.type, "work");
});
