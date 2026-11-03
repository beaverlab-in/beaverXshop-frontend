// Central place for public configuration. Server and client safe (NEXT_PUBLIC_* only).

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
export const BRAND_NAME = process.env.NEXT_PUBLIC_BRAND_NAME || "BeaverLab X Shop";
export const LOGO_URL = process.env.NEXT_PUBLIC_LOGO_URL || "";
export const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1").replace(/\/$/, "");
export const DATA_SOURCE = process.env.NEXT_PUBLIC_DATA_SOURCE === "api" ? "api" : "placeholder";
export const IS_DEMO = DATA_SOURCE === "placeholder";
export const RAZORPAY_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "";

export function absoluteUrl(path = "/") {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
