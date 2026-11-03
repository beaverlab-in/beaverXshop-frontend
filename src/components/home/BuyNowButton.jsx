"use client";

import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { useCart } from "@/providers/CartProvider";
import { MAX_QTY_PER_LINE } from "@/lib/constants";

/** Adds one unit to the cart and goes straight to checkout (login + OTP is still required there). */
export default function BuyNowButton({ slug, title, stock, variant = "primary", size = "lg", className = "" }) {
  const router = useRouter();
  const cart = useCart();

  if (stock <= 0) {
    return (
      <Button size={size} variant="secondary" disabled className={className}>
        Out of stock
      </Button>
    );
  }
  return (
    <Button
      size={size}
      variant={variant}
      className={className}
      aria-label={`Buy now: ${title}`}
      onClick={() => {
        cart.add(slug, 1, Math.min(MAX_QTY_PER_LINE, stock));
        router.push("/checkout");
      }}
    >
      Buy Now
    </Button>
  );
}
