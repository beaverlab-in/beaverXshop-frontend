import { formatINR } from "@/lib/money";

function Row({ label, children, strong = false, tone }) {
  return (
    <div className={`flex items-baseline justify-between gap-4 ${strong ? "text-lg font-bold" : "text-[0.95rem]"}`}>
      <dt className={strong ? "" : "text-muted"}>{label}</dt>
      <dd className={`tabular-nums ${tone === "success" ? "font-semibold text-success" : ""}`}>{children}</dd>
    </div>
  );
}

/** Pure presentation of a server quote / order totals. Never computes money itself. */
export default function OrderTotals({ totals }) {
  const { subtotalPaise, discountPaise, shippingPaise, codFeePaise, taxPaise, pricesIncludeGst, grandPaise } = totals;
  return (
    <dl className="space-y-3">
      <Row label="Subtotal">{formatINR(subtotalPaise)}</Row>
      {discountPaise > 0 && <Row label="Discount" tone="success">−{formatINR(discountPaise)}</Row>}
      <Row label="Shipping">{shippingPaise === 0 ? "Free" : formatINR(shippingPaise)}</Row>
      {codFeePaise > 0 && <Row label="Cash on delivery fee">{formatINR(codFeePaise)}</Row>}
      {!pricesIncludeGst && taxPaise > 0 && <Row label="GST">{formatINR(taxPaise)}</Row>}
      <div className="border-t border-line pt-3">
        <Row label="Total" strong>
          {formatINR(grandPaise)}
        </Row>
        {pricesIncludeGst && taxPaise > 0 && (
          <p className="mt-1 text-right text-sm text-muted">Includes {formatINR(taxPaise)} GST</p>
        )}
      </div>
    </dl>
  );
}
