"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from "react";
import { readJSON, writeJSON } from "@/lib/client/storage";
import { MAX_QTY_PER_LINE } from "@/lib/constants";

// The cart stores only { slug, qty } (+ the coupon code the shopper typed).
// Prices, stock and totals always come from the server quote.
const KEY = "bls_cart_v1";
const COUPON_KEY = "bls_coupon";
const CartContext = createContext(null);

function readStored() {
  const stored = readJSON(KEY, []);
  const items = Array.isArray(stored)
    ? stored.filter((i) => i && typeof i.slug === "string" && Number.isInteger(i.qty) && i.qty > 0)
    : [];
  const coupon = readJSON(COUPON_KEY, "");
  return { items, couponCode: typeof coupon === "string" ? coupon : "" };
}

function reducer(state, action) {
  switch (action.type) {
    case "hydrate":
      return { items: action.items, couponCode: action.couponCode, ready: true };
    case "add": {
      const max = Math.min(MAX_QTY_PER_LINE, action.max ?? MAX_QTY_PER_LINE);
      const existing = state.items.find((i) => i.slug === action.slug);
      const items = existing
        ? state.items.map((i) => (i.slug === action.slug ? { ...i, qty: Math.min(max, i.qty + action.qty) } : i))
        : [...state.items, { slug: action.slug, qty: Math.min(max, action.qty) }];
      return { ...state, items };
    }
    case "set":
      return {
        ...state,
        items: state.items.map((i) =>
          i.slug === action.slug ? { ...i, qty: Math.max(1, Math.min(MAX_QTY_PER_LINE, action.qty)) } : i,
        ),
      };
    case "remove":
      return { ...state, items: state.items.filter((i) => i.slug !== action.slug) };
    case "coupon":
      return { ...state, couponCode: action.code };
    case "clear":
      return { ...state, items: [] };
    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, { items: [], couponCode: "", ready: false });
  const skipPersist = useRef(true);

  useEffect(() => {
    dispatch({ type: "hydrate", ...readStored() });
  }, []);

  useEffect(() => {
    if (!state.ready) return;
    if (skipPersist.current) {
      skipPersist.current = false; // don't write back what we just read
      return;
    }
    writeJSON(KEY, state.items);
    writeJSON(COUPON_KEY, state.couponCode);
  }, [state.items, state.couponCode, state.ready]);

  // Keep several open tabs in sync.
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === KEY || e.key === COUPON_KEY) {
        skipPersist.current = true;
        dispatch({ type: "hydrate", ...readStored() });
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const add = useCallback((slug, qty = 1, max) => dispatch({ type: "add", slug, qty, max }), []);
  const setQty = useCallback((slug, qty) => dispatch({ type: "set", slug, qty }), []);
  const remove = useCallback((slug) => dispatch({ type: "remove", slug }), []);
  const clear = useCallback(() => dispatch({ type: "clear" }), []);
  const setCouponCode = useCallback((code) => dispatch({ type: "coupon", code }), []);
  const replace = useCallback((items, couponCode) => dispatch({ type: "hydrate", items, couponCode }), []);

  const value = useMemo(
    () => ({
      items: state.items,
      ready: state.ready,
      count: state.items.reduce((n, i) => n + i.qty, 0),
      couponCode: state.couponCode,
      setCouponCode,
      replace,
      add,
      setQty,
      remove,
      clear,
    }),
    [state.items, state.ready, state.couponCode, setCouponCode, replace, add, setQty, remove, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
