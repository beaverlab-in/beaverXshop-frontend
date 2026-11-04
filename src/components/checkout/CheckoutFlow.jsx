"use client";

import CollectionNotice from "@/components/account/privacy/CollectionNotice";
import Link from "next/link";
import { useState } from "react";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import { Card } from "@/components/ui/Layout";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/States";
import { AlertIcon, CartIcon, CheckIcon, LockIcon } from "@/components/ui/Icons";
import ProductImage from "@/components/product/ProductImage";
import OrderTotals from "@/components/cart/OrderTotals";
import AddressForm from "@/components/account/AddressForm";
import { AddressBadges, AddressText } from "@/components/account/AddressBits";
import useAsync from "@/hooks/useAsync";
import useQuote from "@/hooks/useQuote";
import { useAuth } from "@/providers/AuthProvider";
import { useCart } from "@/providers/CartProvider";
import { useToast } from "@/providers/ToastProvider";
import { listAddresses, placeOrder } from "@/lib/client/accountApi";
import { openRazorpay, verifyPayment } from "@/lib/client/razorpay";
import { BRAND_NAME, IS_DEMO, RAZORPAY_KEY_ID } from "@/lib/env";
import { formatINR } from "@/lib/money";
import { formatMobile, isValidEmail } from "@/lib/validation";

const STEPS = ["Your details", "Delivery address", "Review order", "Payment"];

function Stepper({ step }) {
  const pct = Math.round((Math.min(step, STEPS.length) / STEPS.length) * 100);
  return (
    <div className="mb-8">
      <div className="h-1.5 overflow-hidden rounded-full bg-subtle" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label="Checkout progress">
        <div className="h-full rounded-full bg-brand transition-[width] duration-500 ease-[var(--ease-brand)]" style={{ width: `${pct}%` }} />
      </div>
      <ol className="mt-4 grid grid-cols-4 gap-2 text-center text-xs font-medium sm:text-sm">
        {STEPS.map((label, i) => {
          const n = i + 1;
          const done = n < step;
          const current = n === step;
          return (
            <li key={label} aria-current={current ? "step" : undefined} className={current ? "text-brand" : done ? "text-ink" : "text-muted"}>
              <span className={`mx-auto mb-1 grid size-7 place-items-center rounded-full text-xs font-bold ${done ? "bg-brand text-white" : current ? "border-2 border-brand text-brand" : "bg-subtle text-muted"}`}>
                {done ? <CheckIcon className="size-4" /> : n}
              </span>
              {label}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function Summary({ quote, children }) {
  return (
    <Card className="p-6 lg:sticky lg:top-28">
      <h2 className="mb-4 text-xl font-bold">Order summary</h2>
      <ul className="mb-5 space-y-3">
        {quote.lines.filter((l) => l.available).map((l) => (
          <li key={l.slug} className="flex items-center gap-3">
            <div className="relative aspect-[4/3] w-14 shrink-0 overflow-hidden rounded-md bg-subtle">
              <ProductImage image={{ ...l.image, alt: "" }} sizes="56px" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{l.title}</p>
              <p className="text-xs text-muted">Qty {l.qty}</p>
            </div>
            <p className="text-sm font-semibold tabular-nums">{formatINR(l.linePaise)}</p>
          </li>
        ))}
      </ul>
      <OrderTotals totals={quote} />
      {children}
    </Card>
  );
}

export default function CheckoutFlow() {
  const { user, updateProfile } = useAuth();
  const cart = useCart();
  const toast = useToast();

  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("online");
  const [addressId, setAddressId] = useState("");
  const [addingAddress, setAddingAddress] = useState(false);
  // Only what the shopper has typed is kept in state; everything else follows the signed-in user. (Pages stay mounted
  // while hidden, so copying `user` into state at mount time would freeze a stale value, e.g. an empty name.)
  const [edits, setEdits] = useState({});
  const details = { name: edits.name ?? user?.name ?? "", email: edits.email ?? user?.email ?? "" };
  const setDetails = (next) => setEdits({ name: next.name, email: next.email });
  const [detailErrors, setDetailErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [payError, setPayError] = useState("");
  const [pending, setPending] = useState(null); // online order created but not yet paid (retry without creating a new order)
  const [confirmed, setConfirmed] = useState(null);

  const addresses = useAsync(listAddresses, []);
  const { quote, loading: quoting, error: quoteError, refresh } = useQuote({
    items: cart.items,
    couponCode: cart.couponCode,
    paymentMethod,
    enabled: cart.ready && !confirmed,
  });

  // Derived selections (no effects): default address preselected; COD falls back to online if it stops being offered.
  const addressList = addresses.data ?? [];
  const selectedId = addressList.some((a) => a.id === addressId)
    ? addressId
    : (addressList.find((a) => a.isDefault) ?? addressList[0])?.id ?? "";
  const showAddressForm = addingAddress || (addresses.data !== null && addressList.length === 0);
  const method = quote && paymentMethod === "cod" && !quote.payment.codEnabled ? "online" : paymentMethod;

  if (confirmed) return <Confirmation order={confirmed} />;

  if (!cart.ready) return <Skeleton className="h-96" />;
  if (cart.items.length === 0) {
    return (
      <EmptyState
        icon={<CartIcon className="size-7" />}
        title="Your cart is empty"
        description="Add something to your cart before checking out."
        action={{ href: "/products", label: "Explore products" }}
      />
    );
  }
  if (!quote && quoteError) return <ErrorState description={quoteError} onRetry={refresh} />;
  if (!quote) return <Skeleton className="h-96" />;

  const selectedAddress = addressList.find((a) => a.id === selectedId);

  async function continueFromDetails(e) {
    e.preventDefault();
    const errors = {};
    if (details.name.trim().length < 2) errors.name = "Please enter your name.";
    if (details.email && !isValidEmail(details.email)) errors.email = "Enter a valid email address or leave it blank.";
    setDetailErrors(errors);
    if (Object.keys(errors).length) return;
    if (details.name !== user?.name || details.email !== user?.email) {
      setBusy(true);
      try {
        await updateProfile(details);
      } catch (err) {
        toast.error(err.message);
        setBusy(false);
        return;
      }
      setBusy(false);
    }
    setStep(2);
  }

  async function finish(order) {
    cart.clear();
    cart.setCouponCode("");
    setConfirmed(order);
  }

  async function onPlaceOrder() {
    if (busy) return;
    setBusy(true);
    setPayError("");
    try {
      let created = pending;
      if (!created) {
        created = await placeOrder({
          items: cart.items,
          addressId: selectedId,
          paymentMethod: method,
          couponCode: cart.couponCode,
          quote,
        });
      }
      // Online payment in API mode: the backend returns the Razorpay order to open.
      if (created.razorpay) {
        setPending(created);
        const response = await openRazorpay({
          keyId: created.razorpay.keyId || RAZORPAY_KEY_ID,
          orderId: created.razorpay.orderId,
          amountPaise: created.razorpay.amountPaise,
          brandName: BRAND_NAME,
          prefill: { name: user?.name, email: user?.email, contact: user?.mobile },
        });
        const verified = await verifyPayment(response);
        await finish(verified.order ?? created.order);
      } else {
        await finish(created.order);
      }
    } catch (e) {
      if (e?.code === "CANCELLED") setPayError("Payment was cancelled. Nothing was charged. You can try again.");
      else if (e?.code === "FAILED") setPayError(`${e.message} You can try again or choose another method.`);
      else setPayError(e?.message || "We couldn't place your order. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const cannotProceed = !quote.canCheckout;

  return (
    <div>
      <Stepper step={step} />
      {IS_DEMO && (
        <p className="mb-6 rounded-md border border-warning/40 bg-warning/10 p-3 text-sm" role="note">
          <strong>Demo checkout.</strong> No payment is taken and no order is shipped.
        </p>
      )}
      {quote.issues.length > 0 && (
        <div role="alert" className="mb-6 flex gap-3 rounded-md border border-warning/40 bg-warning/10 p-4 text-sm">
          <AlertIcon className="mt-0.5 size-5 shrink-0 text-warning-ink" />
          <div>
            <ul className="space-y-1">{quote.issues.map((i) => <li key={i}>{i}</li>)}</ul>
            <Link href="/cart" className="mt-2 inline-block font-semibold text-brand underline underline-offset-4">Update your cart</Link>
          </div>
        </div>
      )}

      <div className="grid items-start gap-8 lg:grid-cols-[1.5fr_1fr]">
        <div className={quoting ? "opacity-80 transition-opacity" : "transition-opacity"}>
          {step === 1 && (
            <Card className="p-6 sm:p-8">
              <h2 className="text-2xl font-bold">Your details</h2>
              <form onSubmit={continueFromDetails} noValidate className="mt-6 space-y-4">
                <Field label="Mobile number" value={formatMobile(user?.mobile)} readOnly disabled hint="Verified with a one-time code." />
                <Field label="Full name" autoComplete="name" value={details.name} onChange={(e) => setDetails({ ...details, name: e.target.value })} error={detailErrors.name} />
                <Field label="Email" optional type="email" autoComplete="email" value={details.email} onChange={(e) => setDetails({ ...details, email: e.target.value })} error={detailErrors.email} hint="We'll send your receipt here." />
                <CollectionNotice context="checkout" />
                <Button type="submit" size="lg" loading={busy}>Continue to address</Button>
              </form>
            </Card>
          )}

          {step === 2 && (
            <Card className="p-6 sm:p-8">
              <h2 className="text-2xl font-bold">Delivery address</h2>
              {addresses.loading && !addresses.data ? (
                <Skeleton className="mt-6 h-40" />
              ) : addresses.error ? (
                <div className="mt-6"><ErrorState description={addresses.error.message} onRetry={addresses.reload} /></div>
              ) : showAddressForm ? (
                <div className="mt-6">
                  <AddressForm
                    defaultName={user?.name}
                    defaultMobile={user?.mobile}
                    submitLabel="Save and deliver here"
                    onSaved={(result) => {
                      // Demo storage returns the full list; the API returns the saved address.
                      const before = new Set(addressList.map((a) => a.id));
                      const added = Array.isArray(result) ? result.find((a) => !before.has(a.id)) : result;
                      if (added?.id) setAddressId(added.id);
                      setAddingAddress(false);
                      addresses.reload();
                    }}
                    onCancel={addressList.length ? () => setAddingAddress(false) : undefined}
                  />
                </div>
              ) : (
                <fieldset className="mt-6">
                  <legend className="sr-only">Choose a delivery address</legend>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {addressList.map((a) => (
                      <label key={a.id} className={`cursor-pointer rounded-card border p-4 transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-focus ${selectedId === a.id ? "border-brand bg-subtle" : "border-line hover:border-brand/40"}`}>
                        <input type="radio" name="address" value={a.id} checked={selectedId === a.id} onChange={() => setAddressId(a.id)} className="sr-only" />
                        <div className="mb-2 flex items-center justify-between"><AddressBadges address={a} />{selectedId === a.id && <CheckIcon className="size-5 text-brand" />}</div>
                        <AddressText address={a} />
                      </label>
                    ))}
                  </div>
                  <Button variant="secondary" className="mt-4" onClick={() => setAddingAddress(true)}>Add a new address</Button>
                </fieldset>
              )}
              <div className="mt-8 flex flex-wrap gap-3">
                <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
                <Button size="lg" onClick={() => setStep(3)} disabled={!selectedAddress || showAddressForm}>Continue to review</Button>
              </div>
            </Card>
          )}

          {step === 3 && (
            <Card className="p-6 sm:p-8">
              <h2 className="text-2xl font-bold">Review your order</h2>
              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                <div>
                  <h3 className="mb-2 text-sm font-semibold tracking-wide text-muted uppercase">Deliver to</h3>
                  {selectedAddress && <AddressText address={selectedAddress} />}
                  <button type="button" onClick={() => setStep(2)} className="mt-2 text-sm font-semibold text-brand underline underline-offset-4">Change</button>
                </div>
                <div>
                  <h3 className="mb-2 text-sm font-semibold tracking-wide text-muted uppercase">Contact</h3>
                  <p className="text-[0.95rem]">{user?.name}<br /><span className="text-muted">{formatMobile(user?.mobile)}</span></p>
                  <button type="button" onClick={() => setStep(1)} className="mt-2 text-sm font-semibold text-brand underline underline-offset-4">Change</button>
                </div>
              </div>
              <p className="mt-6 text-sm text-muted">
                Items are listed in the summary. Need to change something? <Link href="/cart" className="font-semibold text-brand underline underline-offset-4">Edit your cart</Link>.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button variant="ghost" onClick={() => setStep(2)}>Back</Button>
                <Button size="lg" onClick={() => setStep(4)} disabled={cannotProceed}>Continue to payment</Button>
              </div>
            </Card>
          )}

          {step === 4 && (
            <Card className="p-6 sm:p-8">
              <h2 className="text-2xl font-bold">Payment</h2>
              <fieldset className="mt-6">
                <legend className="sr-only">Payment method</legend>
                <div className="grid gap-3">
                  {[
                    { id: "online", title: "Pay online", text: "UPI, cards, netbanking and wallets, securely via Razorpay.", enabled: quote.payment.onlineEnabled },
                    {
                      id: "cod",
                      title: "Cash on delivery",
                      text: quote.payment.codFeePaise > 0 ? `Pay when your order arrives. A ${formatINR(quote.payment.codFeePaise)} handling fee applies.` : "Pay when your order arrives.",
                      enabled: quote.payment.codEnabled,
                    },
                  ].filter((m) => m.enabled).map((m) => (
                    <label key={m.id} className={`flex cursor-pointer gap-4 rounded-card border p-4 transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-focus ${method === m.id ? "border-brand bg-subtle" : "border-line hover:border-brand/40"}`}>
                      <input type="radio" name="payment" value={m.id} checked={method === m.id} onChange={() => { setPaymentMethod(m.id); setPayError(""); }} className="mt-1 size-4 accent-[var(--color-brand)]" disabled={Boolean(pending)} />
                      <span><span className="block font-semibold">{m.title}</span><span className="block text-sm text-muted">{m.text}</span></span>
                    </label>
                  ))}
                </div>
              </fieldset>
              {payError && <p role="alert" className="mt-4 rounded-md bg-danger/10 p-3 text-sm font-medium text-danger-ink">{payError}</p>}
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button variant="ghost" onClick={() => setStep(3)} disabled={busy}>Back</Button>
                <Button size="lg" onClick={onPlaceOrder} loading={busy} disabled={cannotProceed || quoting}>
                  <LockIcon className="size-4" />
                  {method === "cod" ? "Place order" : `Pay ${formatINR(quote.grandPaise)}`}
                </Button>
              </div>
              <p className="mt-4 text-xs text-muted">We never see or store your card details. Online payments are processed by Razorpay.</p>
            </Card>
          )}
        </div>

        <Summary quote={quote} />
      </div>
    </div>
  );
}

function Confirmation({ order }) {
  const isCod = order.paymentMethod === "cod";
  return (
    <div className="mx-auto max-w-2xl text-center">
      <span className="mx-auto grid size-20 place-items-center rounded-full bg-success text-white shadow-lift">
        <CheckIcon className="size-10" />
      </span>
      <h1 className="mt-6 text-3xl font-bold tracking-tight">Thank you, your order is in!</h1>
      <p className="mt-3 text-lg text-muted">
        Order <strong className="text-ink tabular-nums">{order.orderNumber}</strong> {isCod ? "has been placed. You'll pay when it arrives." : "is confirmed."}
      </p>
      {order.demo && <p className="mt-4 rounded-md border border-warning/40 bg-warning/10 p-3 text-sm">Demo mode: no payment was taken and nothing will be shipped.</p>}

      <Card className="mt-8 p-6 text-left">
        <h2 className="mb-3 text-lg font-bold">What happens next</h2>
        <ol className="space-y-3 text-[0.95rem]">
          <li className="flex gap-3"><span className="font-bold text-brand">1.</span> We pack your order and update its status.</li>
          <li className="flex gap-3"><span className="font-bold text-brand">2.</span> Tracking details appear on your order page once it ships.</li>
          <li className="flex gap-3"><span className="font-bold text-brand">3.</span> Your GST invoice is available to download from the order page.</li>
        </ol>
        <div className="mt-5 border-t border-line pt-5">
          <p className="text-sm text-muted">Delivering to</p>
          <AddressText address={order.shippingAddress} />
        </div>
      </Card>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button href={`/account/orders/${order.orderNumber}`} size="lg">Track your order</Button>
        <Button href="/products" variant="secondary" size="lg">Keep exploring</Button>
      </div>
    </div>
  );
}
