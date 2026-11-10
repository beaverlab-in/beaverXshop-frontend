"use server";

import { headers } from "next/headers";
import { quoteCart } from "@/lib/data/quote";

function cleanItems(items) {
  if (!Array.isArray(items)) return [];
  return items
    .filter((i) => i && typeof i.slug === "string" && Number.isFinite(Number(i.qty)))
    .map((i) => ({ slug: i.slug.slice(0, 120), qty: Number(i.qty) }));
}

/**
 * Server Action: price a cart. Never trusts client-side amounts — only slugs and quantities are read.
 * Returns { ok: true, quote } or { ok: false, message }.
 */
export async function getQuoteAction({ items, couponCode = "", paymentMethod = "online" } = {}) {
  try {
    const cookieHeader = (await headers()).get("cookie") ?? "";
    const quote = await quoteCart({
      items: cleanItems(items),
      couponCode: String(couponCode).slice(0, 40),
      paymentMethod: paymentMethod === "cod" ? "cod" : "online",
      cookieHeader,
    });
    return { ok: true, quote };
  } catch (error) {
    console.error("[quote] failed:", error?.message);
    return { ok: false, message: "We couldn't update your cart right now. Please try again." };
  }
}
