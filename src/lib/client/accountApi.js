// Customer account adapter (browser side). One interface, two implementations:
//   IS_DEMO  -> localStorage-backed demo account, clearly labelled in the UI. No real OTP, no real payment.
//   otherwise -> beaverxshop-backend REST API.
// Pages never branch on the data source themselves; they only call these functions.
import { API_URL, IS_DEMO } from "@/lib/env";
import { apiFetch } from "@/lib/client/api";
import { readJSON, removeKey, writeJSON } from "@/lib/client/storage";
import { validateAddress } from "@/lib/validation";

export const DEMO_OTP = "123456";
const KEYS = { session: "bls_demo_session", addresses: "bls_demo_addresses", orders: "bls_demo_orders" };

const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
const fail = (message, fields) => Object.assign(new Error(message), { fields });

// ---------- Auth ----------
export async function requestOtp(mobile) {
  if (!IS_DEMO) return apiFetch("/auth/otp/request", { method: "POST", body: { mobile } });
  return { cooldownSeconds: 30, expiresInSeconds: 300, mode: "demo" };
}

export async function verifyOtp(mobile, otp) {
  if (!IS_DEMO) return apiFetch("/auth/otp/verify", { method: "POST", body: { mobile, otp } });
  if (otp !== DEMO_OTP) throw fail("That code is not correct. Please check and try again.");
  const existing = readJSON(KEYS.session, null);
  const user = existing?.mobile === mobile ? existing : { id: `demo-${mobile}`, mobile, name: "", email: "" };
  writeJSON(KEYS.session, user);
  return user;
}

export async function fetchSession() {
  if (!IS_DEMO) {
    try {
      return await apiFetch("/auth/me");
    } catch (e) {
      if (e.status === 401) return null;
      throw e;
    }
  }
  return readJSON(KEYS.session, null);
}

export async function logout() {
  if (!IS_DEMO) return apiFetch("/auth/logout", { method: "POST" });
  removeKey(KEYS.session);
  return null;
}

export async function updateProfile({ name, email }) {
  if (!IS_DEMO) return apiFetch("/me", { method: "PATCH", body: { name, email } });
  const user = { ...readJSON(KEYS.session, {}), name: name.trim(), email: email.trim() };
  writeJSON(KEYS.session, user);
  return user;
}

// ---------- Server cart (API mode only; the demo uses the browser cart alone) ----------
export const fetchServerCart = () => apiFetch("/cart");
export const mergeServerCart = (items) => apiFetch("/cart/merge", { method: "POST", body: { items } });
export const saveServerCart = (items, couponCode) => apiFetch("/cart", { method: "PUT", body: { items, couponCode } });

// ---------- Addresses ----------
export async function listAddresses() {
  if (!IS_DEMO) return apiFetch("/me/addresses");
  return readJSON(KEYS.addresses, []);
}

export async function saveAddress(input) {
  const { values, errors } = validateAddress(input);
  if (Object.keys(errors).length) throw fail("Please fix the highlighted fields.", errors);
  if (!IS_DEMO) {
    return input.id
      ? apiFetch(`/me/addresses/${input.id}`, { method: "PATCH", body: values })
      : apiFetch("/me/addresses", { method: "POST", body: values });
  }
  let list = readJSON(KEYS.addresses, []);
  const makeDefault = values.isDefault || list.length === 0;
  if (makeDefault) list = list.map((a) => ({ ...a, isDefault: false }));
  if (input.id) {
    list = list.map((a) => (a.id === input.id ? { ...a, ...values, isDefault: makeDefault || a.isDefault } : a));
  } else {
    list.push({ id: uid(), ...values, isDefault: makeDefault });
  }
  writeJSON(KEYS.addresses, list);
  return list;
}

export async function deleteAddress(id) {
  if (!IS_DEMO) return apiFetch(`/me/addresses/${id}`, { method: "DELETE" });
  let list = readJSON(KEYS.addresses, []).filter((a) => a.id !== id);
  if (list.length && !list.some((a) => a.isDefault)) list[0].isDefault = true;
  writeJSON(KEYS.addresses, list);
  return list;
}

export async function setDefaultAddress(id) {
  if (!IS_DEMO) return apiFetch(`/me/addresses/${id}/default`, { method: "POST" });
  const list = readJSON(KEYS.addresses, []).map((a) => ({ ...a, isDefault: a.id === id }));
  writeJSON(KEYS.addresses, list);
  return list;
}

// ---------- Orders ----------
export async function listOrders() {
  if (!IS_DEMO) return apiFetch("/me/orders");
  return readJSON(KEYS.orders, []);
}

export async function getOrder(orderNumber) {
  if (!IS_DEMO) return apiFetch(`/me/orders/${encodeURIComponent(orderNumber)}`);
  const order = readJSON(KEYS.orders, []).find((o) => o.orderNumber === orderNumber);
  if (!order) throw Object.assign(new Error("We couldn't find that order."), { status: 404 });
  return order;
}

function demoOrderNumber() {
  const d = new Date();
  const yymmdd = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const alphabet = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
  let tail = "";
  for (let i = 0; i < 4; i++) tail += alphabet[Math.floor(Math.random() * alphabet.length)];
  return `BL-${yymmdd}-${tail}`;
}

/**
 * Place an order. In api mode the backend re-prices everything and returns the order plus
 * (for online payment) the Razorpay order details. In demo mode a local order is stored and
 * NO payment is taken.
 */
export async function placeOrder({ items, addressId, paymentMethod, couponCode, quote }) {
  if (!IS_DEMO) {
    return apiFetch("/checkout/orders", {
      method: "POST",
      body: { items, addressId, paymentMethod, couponCode: couponCode || undefined, idempotencyKey: uid() },
    });
  }
  const address = readJSON(KEYS.addresses, []).find((a) => a.id === addressId);
  if (!address) throw fail("Please choose a delivery address.");
  const user = readJSON(KEYS.session, {});
  const now = new Date().toISOString();
  const isCod = paymentMethod === "cod";
  const order = {
    orderNumber: demoOrderNumber(),
    status: "confirmed",
    paymentStatus: isCod ? "cod_pending" : "paid",
    paymentMethod,
    demo: true,
    createdAt: now,
    customer: { name: user.name, mobile: user.mobile, email: user.email },
    items: quote.lines
      .filter((l) => l.available)
      .map((l) => ({
        slug: l.slug,
        title: l.title,
        image: l.image,
        qty: l.qty,
        unitPricePaise: l.unitPricePaise,
        linePaise: l.linePaise,
      })),
    totals: {
      subtotalPaise: quote.subtotalPaise,
      discountPaise: quote.discountPaise,
      shippingPaise: quote.shippingPaise,
      codFeePaise: quote.codFeePaise,
      taxPaise: quote.taxPaise,
      pricesIncludeGst: quote.pricesIncludeGst,
      grandPaise: quote.grandPaise,
    },
    shippingAddress: { ...address }, // snapshot: later edits to the saved address never change this
    shipment: null,
    invoiceAvailable: false,
    timeline: [{ status: "confirmed", note: "Order placed (demo mode, no payment taken).", at: now }],
  };
  const orders = readJSON(KEYS.orders, []);
  writeJSON(KEYS.orders, [order, ...orders]);
  return { order };
}

export function invoiceUrl(orderNumber) {
  return IS_DEMO ? null : `${API_URL}/me/orders/${encodeURIComponent(orderNumber)}/invoice`;
}
