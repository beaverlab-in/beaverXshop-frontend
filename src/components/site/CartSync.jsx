"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { useCart } from "@/providers/CartProvider";
import { fetchServerCart, mergeServerCart, saveServerCart } from "@/lib/client/accountApi";
import { IS_DEMO } from "@/lib/env";

/**
 * Keeps the browser cart and the saved (server) cart in step for logged-in customers (API mode only).
 *  - on login: the guest cart is merged into the saved cart (quantities add up, capped per line)
 *  - afterwards: every change is saved after a short pause
 *  - on logout: the browser cart is cleared so the next person on this device never inherits it
 * The server stores only {slug, qty} and the coupon code; prices are always recomputed by /checkout/quote.
 */
export default function CartSync() {
  const { status } = useAuth();
  const cart = useCart();
  const syncedFor = useRef(null); // JSON of what the server is known to hold
  const wasAuthed = useRef(false);
  const live = useRef(cart);
  // Keep the ref pointing at the latest cart (effects run in order, so this one runs first).
  useEffect(() => {
    live.current = cart;
  });

  // Login: merge once per sign-in.
  useEffect(() => {
    if (IS_DEMO || status !== "authed" || !cart.ready || wasAuthed.current) return;
    wasAuthed.current = true;
    let alive = true;
    (async () => {
      try {
        const local = live.current.items;
        const server = local.length ? await mergeServerCart(local) : await fetchServerCart();
        if (!alive) return;
        const coupon = live.current.couponCode || server.couponCode || "";
        syncedFor.current = JSON.stringify({ items: server.items, couponCode: coupon });
        live.current.replace(server.items, coupon);
        if (coupon !== server.couponCode) saveServerCart(server.items, coupon).catch(() => {});
      } catch {
        wasAuthed.current = false; // try again on the next render cycle / reload
      }
    })();
    return () => {
      alive = false;
    };
  }, [status, cart.ready]);

  // Logout: forget the cart on this device.
  useEffect(() => {
    if (IS_DEMO) return;
    if (status === "guest" && wasAuthed.current) {
      wasAuthed.current = false;
      syncedFor.current = null;
      live.current.replace([], "");
    }
  }, [status]);

  // After the first sync, persist changes (debounced).
  useEffect(() => {
    if (IS_DEMO || status !== "authed" || syncedFor.current === null) return;
    const snapshot = JSON.stringify({ items: cart.items, couponCode: cart.couponCode });
    if (snapshot === syncedFor.current) return;
    const t = setTimeout(() => {
      saveServerCart(cart.items, cart.couponCode)
        .then(() => {
          syncedFor.current = snapshot;
        })
        .catch(() => {});
    }, 600);
    return () => clearTimeout(t);
  }, [cart.items, cart.couponCode, status]);

  return null;
}
