"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getQuoteAction } from "@/app/actions/quote";

/**
 * Prices the cart on the server (Server Action). Keeps the previous quote on screen while a new one
 * loads so totals don't flicker. Late responses from older requests are ignored.
 */
export default function useQuote({ items, couponCode = "", paymentMethod = "online", enabled = true }) {
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const requestId = useRef(0);
  const key = JSON.stringify({ items, couponCode, paymentMethod });
  const isEmpty = items.length === 0;

  const run = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    const result = await getQuoteAction(JSON.parse(key));
    if (id !== requestId.current) return;
    if (result.ok) {
      setQuote(result.quote);
      setError("");
    } else {
      setError(result.message);
    }
    setLoading(false);
  }, [key]);

  useEffect(() => {
    if (!enabled || isEmpty) {
      requestId.current++; // drop any in-flight response
      return;
    }
    const t = setTimeout(run, 200);
    return () => clearTimeout(t);
  }, [enabled, isEmpty, run]);

  return { quote: isEmpty ? null : quote, loading: !isEmpty && loading, error, refresh: run };
}
