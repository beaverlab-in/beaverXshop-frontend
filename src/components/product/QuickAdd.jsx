"use client";

import Link from "next/link";
import Button from "@/components/ui/Button";
import { CartIcon } from "@/components/ui/Icons";
import { useCart } from "@/providers/CartProvider";
import { useToast } from "@/providers/ToastProvider";
import { MAX_QTY_PER_LINE } from "@/lib/constants";

/** One-tap "Add to Cart" for product cards (quantity 1). Sits above the card's click area. */
export default function QuickAdd({ slug, title, stock, size = "sm", variant = "primary", className = "" }) {
  const cart = useCart();
  const toast = useToast();
  const soldOut = stock <= 0;

  if (soldOut) {
    return (
      <Button size={size} variant="secondary" disabled className={`relative z-10 ${className}`}>
        Sold out
      </Button>
    );
  }
  return (
    <Button
      size={size}
      variant={variant}
      className={`relative z-10 ${className}`}
      aria-label={`Add to cart: ${title}`}
      onClick={() => {
        cart.add(slug, 1, Math.min(MAX_QTY_PER_LINE, stock));
        toast.success(`${title} added to your cart.`, {
          action: (
            <Link href="/cart" className="mt-1 inline-block font-semibold text-brand underline underline-offset-4">
              View cart
            </Link>
          ),
        });
      }}
    >
      <CartIcon className="size-4" /> Add to Cart
    </Button>
  );
}
