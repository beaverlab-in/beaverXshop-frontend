"use client";

import Link from "next/link";
import { useState } from "react";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import QuantityStepper from "@/components/ui/QuantityStepper";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/States";
import { Card } from "@/components/ui/Layout";
import { CartIcon, TrashIcon, AlertIcon } from "@/components/ui/Icons";
import ProductImage from "@/components/product/ProductImage";
import OrderTotals from "@/components/cart/OrderTotals";
import useQuote from "@/hooks/useQuote";
import { useCart } from "@/providers/CartProvider";
import { formatINR } from "@/lib/money";
import { MAX_QTY_PER_LINE } from "@/lib/constants";

function LoadingCart() {
  return (
    <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]" aria-busy="true" aria-label="Loading your cart">
      <div className="space-y-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
      <Skeleton className="h-72" />
    </div>
  );
}

export default function CartView() {
  const cart = useCart();
  const { quote, loading, error, refresh } = useQuote({ items: cart.items, couponCode: cart.couponCode, enabled: cart.ready });
  const [code, setCode] = useState("");

  if (!cart.ready) return <LoadingCart />;
  if (cart.items.length === 0) {
    return (
      <EmptyState
        icon={<CartIcon className="size-7" />}
        title="Your cart is empty"
        description="Pick a kit to get started. Your cart is saved on this device until you check out."
        action={{ href: "/products", label: "Explore products" }}
      />
    );
  }
  if (!quote && error) return <ErrorState description={error} onRetry={refresh} />;
  if (!quote) return <LoadingCart />;

  const lines = quote.lines;
  const toFree = quote.freeShippingThresholdPaise - (quote.subtotalPaise - quote.discountPaise);
  const showFreeShippingHint = quote.shippingPaise > 0 && quote.freeShippingThresholdPaise > 0 && toFree > 0;
  const progress = Math.min(100, Math.round(((quote.subtotalPaise - quote.discountPaise) / quote.freeShippingThresholdPaise) * 100));

  function applyCoupon(e) {
    e.preventDefault();
    if (code.trim()) cart.setCouponCode(code.trim().toUpperCase());
  }

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[1.6fr_1fr]">
      <section aria-label="Cart items" className={loading ? "opacity-70 transition-opacity" : "transition-opacity"}>
        {quote.issues.length > 0 && (
          <div role="alert" className="mb-4 flex gap-3 rounded-md border border-accent/60 bg-accent/15 p-4 text-sm">
            <AlertIcon className="mt-0.5 size-5 shrink-0 text-[#7a4d05]" />
            <ul className="space-y-1">
              {quote.issues.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
          </div>
        )}
        <ul className="space-y-4">
          {lines.map((line) => (
            <li key={line.slug}>
              <Card className="flex gap-4 p-4 sm:gap-6 sm:p-5">
                <div className="relative aspect-[4/3] w-24 shrink-0 self-start overflow-hidden rounded-md bg-tint sm:w-36">
                  {line.image && <ProductImage image={{ ...line.image, alt: "" }} sizes="144px" />}
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-lg font-bold">
                      <Link href={`/products/${line.slug}`} className="hover:text-brand hover:underline">
                        {line.title ?? line.slug}
                      </Link>
                    </h2>
                    <p className="font-bold tabular-nums">{line.available ? formatINR(line.linePaise) : ""}</p>
                  </div>
                  {line.available && <p className="text-sm text-muted tabular-nums">{formatINR(line.unitPricePaise)} each</p>}
                  {line.issue && <p className="mt-1 text-sm font-medium text-danger">{line.issue}</p>}
                  <div className="mt-auto flex items-center justify-between gap-3 pt-4">
                    {line.available ? (
                      <QuantityStepper
                        size="sm"
                        value={line.qty}
                        max={MAX_QTY_PER_LINE}
                        onChange={(q) => cart.setQty(line.slug, q)}
                        label={`Quantity for ${line.title}`}
                      />
                    ) : (
                      <span />
                    )}
                    <button
                      type="button"
                      onClick={() => cart.remove(line.slug)}
                      className="inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-muted hover:bg-danger/10 hover:text-danger"
                      aria-label={`Remove ${line.title ?? line.slug} from cart`}
                    >
                      <TrashIcon className="size-4" /> Remove
                    </button>
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      <aside aria-label="Order summary" className="lg:sticky lg:top-28">
        <Card className="p-6">
          <h2 className="mb-5 text-xl font-bold">Order summary</h2>

          <form onSubmit={applyCoupon} className="mb-5 flex items-end gap-2">
            <Field
              label="Coupon code"
              optional
              className="flex-1"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter code"
              autoComplete="off"
              spellCheck={false}
            />
            <Button type="submit" variant="secondary" className="mb-0.5">
              Apply
            </Button>
          </form>
          {quote.coupon && (
            <p className={`-mt-2 mb-5 flex items-center justify-between text-sm font-medium ${quote.coupon.ok ? "text-success" : "text-danger"}`} role="status">
              <span>{quote.coupon.message}</span>
              <button type="button" className="underline underline-offset-4" onClick={() => { cart.setCouponCode(""); setCode(""); }}>
                Remove
              </button>
            </p>
          )}

          <OrderTotals totals={quote} />

          {showFreeShippingHint && (
            <div className="mt-5 rounded-md bg-tint/60 p-3 text-sm">
              <p>
                Add <strong>{formatINR(toFree)}</strong> more for free shipping.
              </p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Progress to free shipping">
                <div className="h-full rounded-full bg-brand transition-[width] duration-500" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          {quote.canCheckout ? (
            <Button href="/checkout" size="lg" block className="mt-6">
              Proceed to checkout
            </Button>
          ) : (
            <Button size="lg" block className="mt-6" disabled>
              Proceed to checkout
            </Button>
          )}
          {!quote.canCheckout && <p className="mt-2 text-sm text-danger">Remove unavailable items to continue.</p>}
          <p className="mt-3 text-center text-sm text-muted">Final amount is confirmed at checkout.</p>
        </Card>
      </aside>
    </div>
  );
}
