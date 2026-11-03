"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ConfirmDialog, ErrorBanner, Modal, PageHeader, Panel, formatDateTime } from "@/components/admin/ui";
import { AddressText } from "@/components/account/AddressBits";
import { OrderProgress, PaymentBadge, StatusBadge, Timeline } from "@/components/account/OrderBits";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import { Badge } from "@/components/ui/Layout";
import { Skeleton } from "@/components/ui/States";
import { DownloadIcon, ExternalIcon } from "@/components/ui/Icons";
import useAdminList from "@/hooks/useAdminList";
import { admin, downloadAdminFile } from "@/lib/client/adminApi";
import { ORDER_STATUS } from "@/lib/constants";
import { formatINR, formatRate } from "@/lib/money";
import { useAuth } from "@/providers/AuthProvider";
import { useToast } from "@/providers/ToastProvider";

export default function OrderDetail({ id }) {
  const router = useRouter();
  const toast = useToast();
  const { user, signOut } = useAuth();
  const { data: order, error, loading, reload } = useAdminList(`/orders/${id}`);
  const can = (p) => user.permissions.includes(p);

  const [busy, setBusy] = useState(false);
  const [dialog, setDialog] = useState(null); // status | shipment | cancel | refund
  const [form, setForm] = useState({});
  const [formError, setFormError] = useState("");
  const [needsReauth, setNeedsReauth] = useState(false);

  if (!order) return error ? <ErrorBanner error={error} onRetry={reload} /> : <Skeleton className="h-96" />;

  const open = (name, initial = {}) => {
    setForm(initial);
    setFormError("");
    setNeedsReauth(false);
    setDialog(name);
  };
  const close = () => setDialog(null);

  async function run(fn, success) {
    setBusy(true);
    setFormError("");
    try {
      await fn();
      if (success) toast.success(success);
      close();
      reload();
    } catch (e) {
      if (e.code === "REAUTH_REQUIRED") setNeedsReauth(true);
      setFormError(e.fields ? Object.values(e.fields).join(" ") : e.message);
    } finally {
      setBusy(false);
    }
  }

  const t = order.totals;
  const shipped = Boolean(order.shipment);

  return (
    <>
      <PageHeader
        title={<span className="tabular-nums">{order.orderNumber}</span>}
        description={`Placed ${formatDateTime(order.createdAt)} by ${order.customer?.name || "a customer"} (${order.customer?.mobile ?? ""})`}
        actions={
          <>
            <StatusBadge status={order.status} />
            <PaymentBadge status={order.paymentStatus} />
            <Badge tone="neutral">{order.paymentMethod === "cod" ? "Cash on delivery" : "Online payment"}</Badge>
          </>
        }
      />
      <ErrorBanner error={error} onRetry={reload} />
      {order.flags.includes("late_payment") && <p className="mb-4 rounded-md border border-warning/40 bg-warning/10 p-3 text-sm" role="note"><strong>Late payment.</strong> Money arrived after this order was cancelled; an automatic refund was attempted. Check the payment section.</p>}
      {order.flags.includes("invoice_pending") && !order.invoice && <p className="mb-4 rounded-md border border-warning/40 bg-warning/10 p-3 text-sm" role="note"><strong>Invoice pending.</strong> It couldn&apos;t be issued, usually because GSTIN or business details are missing in Settings. Fix that, then use &ldquo;Issue invoice&rdquo;.</p>}

      <Panel className="mb-6">
        <OrderProgress status={order.status} />
        <div className="mt-5 flex flex-wrap gap-2">
          {can("orders:update") && order.nextStatuses.map((s) => (
            <Button key={s} size="sm" onClick={() => (s === "shipped" && !shipped ? open("shipment", { courierName: "", trackingNumber: "", trackingUrl: "", status: "", then: "shipped" }) : open("status", { status: s, note: "" }))}>
              Mark {ORDER_STATUS[s]?.label.toLowerCase() ?? s}
            </Button>
          ))}
          {can("orders:update") && !["pending_payment", "cancelled", "refunded"].includes(order.status) && (
            <Button size="sm" variant="secondary" onClick={() => open("shipment", { courierName: order.shipment?.courierName ?? "", trackingNumber: order.shipment?.trackingNumber ?? "", trackingUrl: order.shipment?.trackingUrl ?? "", status: order.shipment?.status ?? "" })}>
              {shipped ? "Edit shipment" : "Add shipment"}
            </Button>
          )}
          {can("payments:update") && order.paymentMethod === "cod" && order.paymentStatus === "cod_pending" && ["shipped", "out_for_delivery", "delivered"].includes(order.status) && (
            <Button size="sm" variant="secondary" onClick={() => run(() => admin.post(`/orders/${id}/cod-collected`), "Cash marked as collected.")} loading={busy}>
              Mark cash collected
            </Button>
          )}
          {can("orders:cancel") && order.canCancel && (
            <Button size="sm" variant="ghost" className="text-danger hover:bg-danger/10" onClick={() => open("cancel", { reason: "" })}>
              Cancel order
            </Button>
          )}
          {can("payments:refund") && order.payment && ["captured", "partially_refunded"].includes(order.payment.status) && (
            <Button size="sm" variant="ghost" className="text-danger hover:bg-danger/10" onClick={() => open("refund", { amount: "", reason: "" })}>
              Refund…
            </Button>
          )}
        </div>
        {order.nextStatuses.length === 0 && !order.canCancel && <p className="mt-3 text-sm text-muted">No further steps for this order.</p>}
      </Panel>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <Panel title="Items and tax" padded={false}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[44rem] text-left text-sm">
                <thead>
                  <tr className="border-b border-line text-xs font-semibold tracking-wide text-muted uppercase">
                    <th className="px-4 py-3">Item</th><th className="px-4 py-3">HSN</th><th className="px-4 py-3 text-right">Qty</th><th className="px-4 py-3 text-right">Rate</th><th className="px-4 py-3 text-right">Taxable</th><th className="px-4 py-3 text-right">GST</th><th className="px-4 py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((i) => (
                    <tr key={i.sku} className="border-b border-line/60">
                      <td className="px-4 py-3"><span className="font-medium">{i.title}</span><br /><span className="text-xs text-muted">{i.sku}</span></td>
                      <td className="px-4 py-3">{i.hsnCode}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{i.qty}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{formatINR(i.unitPricePaise)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{formatINR(i.taxableValuePaise)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{formatINR(i.cgstPaise + i.sgstPaise + i.igstPaise)}<br /><span className="text-xs text-muted">{formatRate(i.gstRateBp)}</span></td>
                      <td className="px-4 py-3 text-right font-medium tabular-nums">{formatINR(i.linePaise)}</td>
                    </tr>
                  ))}
                  {order.charges.map((c) => (
                    <tr key={c.kind} className="border-b border-line/60">
                      <td className="px-4 py-3">{c.description}</td><td className="px-4 py-3">{c.sacCode || "—"}</td><td className="px-4 py-3 text-right">1</td><td className="px-4 py-3 text-right">—</td>
                      <td className="px-4 py-3 text-right tabular-nums">{formatINR(c.taxableValuePaise)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{formatINR(c.cgstPaise + c.sgstPaise + c.igstPaise)}<br /><span className="text-xs text-muted">{formatRate(c.gstRateBp)}</span></td>
                      <td className="px-4 py-3 text-right font-medium tabular-nums">{formatINR(c.totalPaise)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <dl className="ml-auto max-w-sm space-y-2 p-5 text-sm">
              <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd className="tabular-nums">{formatINR(t.subtotalPaise)}</dd></div>
              {t.discountPaise > 0 && <div className="flex justify-between"><dt className="text-muted">Discount{order.coupon ? ` (${order.coupon.code})` : ""}</dt><dd className="tabular-nums">−{formatINR(t.discountPaise)}</dd></div>}
              <div className="flex justify-between"><dt className="text-muted">Shipping</dt><dd className="tabular-nums">{formatINR(t.shippingPaise)}</dd></div>
              {t.codFeePaise > 0 && <div className="flex justify-between"><dt className="text-muted">COD fee</dt><dd className="tabular-nums">{formatINR(t.codFeePaise)}</dd></div>}
              {order.supplyType === "intra" ? (
                <>
                  <div className="flex justify-between"><dt className="text-muted">CGST</dt><dd className="tabular-nums">{formatINR(t.cgstPaise)}</dd></div>
                  <div className="flex justify-between"><dt className="text-muted">SGST</dt><dd className="tabular-nums">{formatINR(t.sgstPaise)}</dd></div>
                </>
              ) : (
                <div className="flex justify-between"><dt className="text-muted">IGST</dt><dd className="tabular-nums">{formatINR(t.igstPaise)}</dd></div>
              )}
              <div className="flex justify-between border-t border-line pt-2 text-base font-bold"><dt>Total</dt><dd className="tabular-nums">{formatINR(t.grandPaise)}</dd></div>
              <p className="text-xs text-muted">Prices {t.pricesIncludeGst ? "include" : "exclude"} GST · Place of supply: {order.placeOfSupplyState}</p>
            </dl>
          </Panel>

          <Panel title="Timeline">
            <Timeline events={order.timeline} />
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Delivery address"><AddressText address={order.shippingAddress} /></Panel>
          <Panel title="Shipment">
            {order.shipment ? (
              <div className="space-y-1 text-sm">
                <p><span className="text-muted">Courier:</span> <strong>{order.shipment.courierName}</strong></p>
                <p><span className="text-muted">Tracking:</span> <strong className="tabular-nums">{order.shipment.trackingNumber}</strong></p>
                {order.shipment.status && <p><span className="text-muted">Status:</span> {order.shipment.status}</p>}
                {order.shipment.trackingUrl && <a href={order.shipment.trackingUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-semibold text-brand underline underline-offset-4">Open tracking <ExternalIcon className="size-4" /></a>}
              </div>
            ) : <p className="text-sm text-muted">No shipment details yet. Add the courier and tracking number before marking the order as shipped.</p>}
          </Panel>
          <Panel title="Payment">
            {order.payment ? (
              <dl className="space-y-1.5 text-sm">
                <div className="flex justify-between gap-3"><dt className="text-muted">Provider</dt><dd>{order.payment.provider}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-muted">Status</dt><dd>{order.payment.status.replaceAll("_", " ")}</dd></div>
                {order.payment.method && <div className="flex justify-between gap-3"><dt className="text-muted">Method</dt><dd>{order.payment.method}</dd></div>}
                {order.payment.providerPaymentId && <div className="flex justify-between gap-3"><dt className="text-muted">Payment id</dt><dd className="break-all font-mono text-xs">{order.payment.providerPaymentId}</dd></div>}
                {order.payment.failureReason && <div className="flex justify-between gap-3"><dt className="text-muted">Note</dt><dd>{order.payment.failureReason}</dd></div>}
                {order.payment.refunds.length > 0 && (
                  <div className="border-t border-line pt-2">
                    <p className="font-semibold">Refunds</p>
                    {order.payment.refunds.map((r) => <p key={r.providerRefundId} className="text-xs text-muted">{formatINR(r.amountPaise)} · {r.status} · {r.reason}</p>)}
                  </div>
                )}
              </dl>
            ) : <p className="text-sm text-muted">No payment record.</p>}
          </Panel>
          <Panel title="Invoice">
            {order.invoice ? (
              <div className="space-y-3 text-sm">
                <p><strong className="tabular-nums">{order.invoice.invoiceNumber}</strong><br /><span className="text-muted">Issued {formatDateTime(order.invoice.issuedAt)}</span></p>
                <Button size="sm" variant="secondary" onClick={() => downloadAdminFile(`/orders/${id}/invoice`, `invoice-${order.orderNumber}.pdf`, { open: true }).catch((e) => toast.error(e.message))}>
                  <DownloadIcon className="size-4" /> Open PDF (print)
                </Button>
              </div>
            ) : (
              <div className="space-y-3 text-sm">
                <p className="text-muted">No invoice has been issued.</p>
                {can("orders:update") && !["pending_payment", "cancelled"].includes(order.status) && (
                  <Button size="sm" onClick={() => run(() => admin.post(`/orders/${id}/invoice`), "Invoice issued.")} loading={busy}>Issue invoice</Button>
                )}
              </div>
            )}
          </Panel>
          <Panel title="Customer">
            <p className="text-sm">{order.customer?.name || "—"}<br /><span className="text-muted">{order.customer?.mobile} {order.customer?.email && `· ${order.customer.email}`}</span></p>
            {can("customers:read") && <Link href={`/admin/customers/${order.userId}`} className="mt-2 inline-block text-sm font-semibold text-brand underline underline-offset-4">View customer</Link>}
          </Panel>
        </div>
      </div>

      {/* ---- dialogs ---- */}
      <Modal open={dialog === "status"} onClose={close} title={`Mark as ${ORDER_STATUS[form.status]?.label ?? ""}`}
        footer={<><Button variant="ghost" onClick={close} disabled={busy}>Cancel</Button><Button loading={busy} onClick={() => run(() => admin.post(`/orders/${id}/status`, { status: form.status, note: form.note ?? "" }), "Order updated.")}>Update status</Button></>}>
        <Field as="textarea" label="Note for the timeline" optional value={form.note ?? ""} onChange={(e) => setForm({ ...form, note: e.target.value })} className="!min-h-20" />
        {formError && <p role="alert" className="mt-3 text-sm font-medium text-danger">{formError}</p>}
      </Modal>

      <Modal open={dialog === "shipment"} onClose={close} title={shipped ? "Edit shipment" : "Add shipment"}
        footer={<><Button variant="ghost" onClick={close} disabled={busy}>Cancel</Button>
          <Button loading={busy} onClick={() => run(async () => {
            await admin.put(`/orders/${id}/shipment`, { courierName: form.courierName, trackingNumber: form.trackingNumber, trackingUrl: form.trackingUrl ?? "", status: form.status ?? "" });
            if (form.then === "shipped") await admin.post(`/orders/${id}/status`, { status: "shipped", note: `Shipped with ${form.courierName}` });
          }, form.then === "shipped" ? "Marked as shipped." : "Shipment saved.")}>{form.then === "shipped" ? "Save and mark shipped" : "Save shipment"}</Button></>}>
        <div className="space-y-4">
          <Field label="Courier name" value={form.courierName ?? ""} onChange={(e) => setForm({ ...form, courierName: e.target.value })} />
          <Field label="Tracking number" value={form.trackingNumber ?? ""} onChange={(e) => setForm({ ...form, trackingNumber: e.target.value })} />
          <Field label="Tracking link" optional type="url" placeholder="https://…" value={form.trackingUrl ?? ""} onChange={(e) => setForm({ ...form, trackingUrl: e.target.value })} />
          <Field label="Shipment status text" optional hint="Shown to the customer, e.g. “Picked up”." value={form.status ?? ""} onChange={(e) => setForm({ ...form, status: e.target.value })} />
        </div>
        {formError && <p role="alert" className="mt-3 text-sm font-medium text-danger">{formError}</p>}
      </Modal>

      <ConfirmDialog open={dialog === "cancel"} title="Cancel this order?" danger confirmLabel="Cancel order" busy={busy} onCancel={close}
        message="Stock goes back to inventory and the customer's coupon use is released. If the customer already paid online, a full refund is started automatically."
        onConfirm={() => run(() => admin.post(`/orders/${id}/cancel`, { reason: form.reason ?? "" }), "Order cancelled.")}>
        <Field as="textarea" label="Reason (kept in the order history)" value={form.reason ?? ""} onChange={(e) => setForm({ ...form, reason: e.target.value })} className="mt-4 !min-h-20" />
        {formError && <p role="alert" className="mt-3 text-sm font-medium text-danger">{formError}</p>}
      </ConfirmDialog>

      <ConfirmDialog open={dialog === "refund"} title="Refund payment" danger confirmLabel="Issue refund" busy={busy} onCancel={close}
        message="Refunds move money. Leave the amount blank for a full refund of what is still refundable."
        onConfirm={() => run(() => admin.post(`/orders/${id}/refund`, { ...(form.amount ? { amountPaise: Math.round(Number(form.amount) * 100) } : {}), reason: form.reason ?? "" }), "Refund requested.")}>
        <div className="mt-4 space-y-4">
          <Field label="Amount in ₹" optional inputMode="decimal" placeholder="Full refund" value={form.amount ?? ""} onChange={(e) => setForm({ ...form, amount: e.target.value.replace(/[^\d.]/g, "") })} />
          <Field as="textarea" label="Reason" value={form.reason ?? ""} onChange={(e) => setForm({ ...form, reason: e.target.value })} className="!min-h-20" />
        </div>
        {formError && <p role="alert" className="mt-3 text-sm font-medium text-danger">{formError}</p>}
        {needsReauth && (
          <div className="mt-3 rounded-md bg-warning/10 p-3 text-sm">
            For your security, refunds need a fresh sign-in. <button type="button" className="font-semibold text-brand underline underline-offset-4" onClick={async () => { await signOut(); router.replace(`/login?next=/admin/orders/${id}`); }}>Sign in again</button>
          </div>
        )}
      </ConfirmDialog>
    </>
  );
}
