import { STATE_NAMES } from "./india.js";

// Postel's law: accept messy input (spaces, +91, 0 prefix), normalise it, validate the result.

/** Returns the 10-digit Indian mobile number, or "" when the input is not a valid one. */
export function normalizeMobile(input) {
  let digits = String(input ?? "").replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  return /^[6-9]\d{9}$/.test(digits) ? digits : "";
}

export function formatMobile(tenDigits) {
  return tenDigits ? `+91 ${tenDigits.slice(0, 5)} ${tenDigits.slice(5)}` : "";
}

export function isValidPincode(value) {
  return /^[1-9]\d{5}$/.test(String(value ?? "").trim());
}

export function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(value ?? "").trim());
}

/** Validates an address form. Returns { values (normalised), errors } — errors is empty when valid. */
export function validateAddress(input) {
  const errors = {};
  const v = {
    fullName: String(input.fullName ?? "").trim(),
    mobile: normalizeMobile(input.mobile),
    pincode: String(input.pincode ?? "").trim(),
    state: String(input.state ?? "").trim(),
    city: String(input.city ?? "").trim(),
    house: String(input.house ?? "").trim(),
    street: String(input.street ?? "").trim(),
    landmark: String(input.landmark ?? "").trim(),
    type: ["home", "work", "other"].includes(input.type) ? input.type : "home",
    isDefault: Boolean(input.isDefault),
  };
  if (v.fullName.length < 2) errors.fullName = "Enter the recipient's full name.";
  if (!v.mobile) errors.mobile = "Enter a valid 10-digit Indian mobile number.";
  if (!isValidPincode(v.pincode)) errors.pincode = "Enter a valid 6-digit PIN code.";
  if (!STATE_NAMES.includes(v.state)) errors.state = "Select a state.";
  if (v.city.length < 2) errors.city = "Enter the city or town.";
  if (v.house.length < 1) errors.house = "Enter the house, flat or building.";
  if (v.street.length < 2) errors.street = "Enter the street or area.";
  return { values: v, errors };
}
