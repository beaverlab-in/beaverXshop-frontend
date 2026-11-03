// Server-side cart quote. Mirrors the backend contract POST /checkout/quote.
// The browser sends only { slug, qty } pairs and a coupon code; every price, stock level,
// shipping charge and tax amount below is decided on the server.
import "server-only";
import { API_URL, DATA_SOURCE } from "@/lib/env";
import { getProduct } from "@/lib/data/catalog";
import { getPublicSettings } from "@/lib/data/settings";
import { divRound, taxFromExclusive, taxFromInclusive } from "@/lib/money";
import { MAX_QTY_PER_LINE } from "@/lib/constants";
import { primaryImage } from "@/lib/product";

export async function quoteCart({ items, couponCode = "", paymentMethod = "online", cookieHeader = "" }) {
  if (DATA_SOURCE === "api") {
    const res = await fetch(`${API_URL}/checkout/quote`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookieHeader },
      body: JSON.stringify({ items, couponCode, paymentMethod }),
      cache: "no-store",
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.error?.message || "Could not calculate your cart.");
    return json.data;
  }
  return quoteFromSample({ items, couponCode, paymentMethod });
}

// Sample-data implementation: same output shape as the real API.
async function quoteFromSample({ items, couponCode, paymentMethod }) {
  const settings = await getPublicSettings();
  const { pricesIncludeGst, shipping, cod } = settings.commerce;

  const lines = [];
  for (const item of items.slice(0, 50)) {
    const product = await getProduct(String(item.slug));
    if (!product) {
      lines.push({ slug: String(item.slug), available: false, issue: "This product is no longer available.", qty: 0 });
      continue;
    }
    const requested = Math.max(1, Math.min(MAX_QTY_PER_LINE, Math.floor(Number(item.qty) || 1)));
    const qty = Math.min(requested, Math.max(0, product.stock));
    let issue = "";
    if (product.stock <= 0) issue = "Out of stock.";
    else if (qty < requested) issue = `Only ${product.stock} left in stock.`;
    lines.push({
      slug: product.slug,
      title: product.title,
      image: primaryImage(product),
      unitPricePaise: product.pricePaise,
      gstRateBp: product.gstRateBp,
      qty,
      requestedQty: requested,
      linePaise: product.pricePaise * qty,
      available: qty > 0,
      issue,
    });
  }

  const live = lines.filter((l) => l.available);
  const subtotalPaise = live.reduce((sum, l) => sum + l.linePaise, 0);

  // Coupon (demo coupon only in sample mode)
  let discountPaise = 0;
  let coupon = null;
  const code = String(couponCode || "").trim().toUpperCase();
  if (code) {
    if (code === settings.coupons?.demoCode && subtotalPaise > 0) {
      discountPaise = divRound(subtotalPaise * 10, 100);
      coupon = { code, ok: true, message: "Demo coupon applied: 10% off." };
    } else {
      coupon = { code, ok: false, message: "This coupon code is not valid." };
    }
  }

  // Spread the discount across lines so tax is computed on the discounted value.
  let remaining = discountPaise;
  let taxPaise = 0;
  live.forEach((line, i) => {
    const share = i === live.length - 1 ? remaining : divRound(discountPaise * line.linePaise, subtotalPaise || 1);
    remaining -= share;
    const net = line.linePaise - share;
    taxPaise += pricesIncludeGst ? taxFromInclusive(net, line.gstRateBp) : taxFromExclusive(net, line.gstRateBp);
  });

  const afterDiscount = subtotalPaise - discountPaise;
  const shippingPaise =
    live.length === 0 || afterDiscount >= shipping.freeAbovePaise ? 0 : shipping.flatPaise;

  const codAllowed =
    cod.enabled && (!cod.maxOrderPaise || afterDiscount + shippingPaise <= cod.maxOrderPaise);
  const codFeePaise = paymentMethod === "cod" && codAllowed ? cod.feePaise : 0;

  // Sample mode adds shipping/COD fee without extra GST; the real backend applies configured treatment.
  const gstAdded = pricesIncludeGst ? 0 : taxPaise;
  const grandPaise = afterDiscount + gstAdded + shippingPaise + codFeePaise;

  const issues = lines.filter((l) => l.issue).map((l) => `${l.title ?? l.slug}: ${l.issue}`);
  return {
    lines,
    subtotalPaise,
    discountPaise,
    shippingPaise,
    codFeePaise,
    taxPaise,
    pricesIncludeGst,
    grandPaise,
    coupon,
    freeShippingThresholdPaise: shipping.freeAbovePaise,
    payment: { onlineEnabled: true, codEnabled: codAllowed, codFeePaise: cod.feePaise },
    issues,
    canCheckout: live.length > 0 && !lines.some((l) => !l.available),
  };
}
