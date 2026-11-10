"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import QuantityStepper from "@/components/ui/QuantityStepper";
import { CartIcon } from "@/components/ui/Icons";
import { useCart } from "@/providers/CartProvider";
import { useToast } from "@/providers/ToastProvider";
import { MAX_QTY_PER_LINE } from "@/lib/constants";
import { formatINR } from "@/lib/money";

export default function AddToCart({ slug, title, pricePaise, stock }) {
  const router = useRouter();
  const cart = useCart();
  const toast = useToast();
  const max = Math.max(1, Math.min(MAX_QTY_PER_LINE, stock));
  const [qty, setQty] = useState(1);
  const [barVisible, setBarVisible] = useState(false);
  const boxRef = useRef(null);
  const soldOut = stock <= 0;

  // Show the sticky mobile bar only once the main buy box has scrolled out of view.
  useEffect(() => {
    const el = boxRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setBarVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  function addToCart() {
    cart.add(slug, qty, max);
    toast.success(`${title} added to your cart.`, {
      action: (
        <Link href="/cart" className="mt-1 inline-block font-semibold text-brand underline underline-offset-4">
          View cart
        </Link>
      ),
    });
  }

  function buyNow() {
    cart.add(slug, qty, max);
    router.push("/checkout");
  }

  if (soldOut) {
    return (
      <div ref={boxRef}>
        <Button size="lg" block disabled>
          Out of stock
        </Button>
        <p className="mt-3 text-sm text-muted">This product is currently unavailable. Check back soon.</p>
      </div>
    );
  }

  return (
    <>
      <div ref={boxRef} className="space-y-4">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">Quantity</span>
          <QuantityStepper value={qty} onChange={setQty} max={max} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Button size="lg" variant="secondary" onClick={addToCart}>
            <CartIcon className="size-5" /> Add to Cart
          </Button>
          <Button size="lg" onClick={buyNow}>
            Buy Now
          </Button>
        </div>
      </div>

      <div
        className={`fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur transition-transform duration-300 lg:hidden ${
          barVisible ? "translate-y-0" : "translate-y-full"
        }`}
        aria-hidden={!barVisible}
        inert={!barVisible}
      >
        <div className="mx-auto flex max-w-xl items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{title}</p>
            <p className="font-bold tabular-nums">{formatINR(pricePaise)}</p>
          </div>
          <Button onClick={addToCart}>Add to Cart</Button>
        </div>
      </div>
    </>
  );
}
