// All money is integer paise. No floating-point arithmetic on amounts.

/** Round-half-up integer division. */
export function divRound(numerator, denominator) {
  return Math.floor((numerator * 2 + denominator) / (denominator * 2));
}

/** Tax contained in a GST-inclusive amount. rateBp: 1800 = 18%. */
export function taxFromInclusive(inclusivePaise, rateBp) {
  const taxable = divRound(inclusivePaise * 10000, 10000 + rateBp);
  return inclusivePaise - taxable;
}

/** Tax to add on a GST-exclusive amount. */
export function taxFromExclusive(taxablePaise, rateBp) {
  return divRound(taxablePaise * rateBp, 10000);
}

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });
const inrWhole = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

/** 149900 -> "₹1,499"; 149950 -> "₹1,499.50" */
export function formatINR(paise) {
  const value = (paise ?? 0) / 100;
  return paise % 100 === 0 ? inrWhole.format(value) : inr.format(value);
}

/** Percent from basis points: 1800 -> "18%" */
export function formatRate(rateBp) {
  return `${rateBp / 100}%`;
}

/** 149900 -> "1499.00" (for editable inputs). */
export function paiseToRupeesInput(paise) {
  if (paise === undefined || paise === null || paise === "") return "";
  return `${Math.floor(paise / 100)}.${String(paise % 100).padStart(2, "0")}`;
}

/** "1499.5" -> 149950. Returns null for anything that isn't a plain amount with at most 2 decimals. */
export function rupeesInputToPaise(input) {
  const s = String(input ?? "").trim();
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  const [whole, frac = ""] = s.split(".");
  return Number(whole) * 100 + Number(frac.padEnd(2, "0"));
}
