"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Layout";
import Button from "@/components/ui/Button";
import { ErrorState, Skeleton } from "@/components/ui/States";
import { ArrowLeftIcon, DownloadIcon, ExternalIcon } from "@/components/ui/Icons";
import ProductImage from "@/components/product/ProductImage";
import OrderTotals from "@/components/cart/OrderTotals";
import { AddressText } from "@/components/account/AddressBits";
import { OrderProgress, PaymentBadge, StatusBadge, Timeline, formatDateTime } from "@/components/account/OrderBits";
import useAsync from "@/hooks/useAsync";
import { getOrder, invoiceUrl } from "@/lib/client/accountApi";
import { formatINR } from "@/lib/money";

export default function OrderDetail({ orderNumber }) {
  const { data: order, error, loading, reload } = useAsync(() => getOrder(orderNumber), [orderNumber]);

  if (loading && !order) return <Skeleton className="h-96" />;
  if (error) {
    return (
      <ErrorState
        title={error.status === 404 ? "Order not found" : "Couldn't load this order"}
        description={error.message}
        onRetry={error.status === 404 ? undefined : reload}
      />
    );
  }

  const invoice = order.invoiceAvailable ? invoiceUrl(order.orderNumber) : null;

  return (
    <div className="space-y-6">
      <Link href="/account/orders" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand underline-offset-4 hover:underline">
        <ArrowLeftIcon className="size-4" /> All orders
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Order</p>
          <h1 className="text-3xl font-extrabold text-brand tabular-nums">{order.orderNumber}</h1>
          <p className="text-muted">Placed on {formatDateTime(order.createdAt)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={order.status} />
          <PaymentBadge status={order.paymentStatus} />
        </div>
      </div>

      {order.demo && (
        <p className="rounded-md border border-accent/60 bg-accent/15 p-3 text-sm" role="note">
          <strong>Demo order.</strong> Created in demo mode. No payment was taken and nothing will be shipped.
        </p>
      )}

      <Card className="p-6">
        <OrderProgress status={order.status} />
        {order.shipment ? (
          <div className="mt-6 rounded-md bg-tint/50 p-4 text-sm">
            <p>
              <span className="text-muted">Courier:</span> <strong>{order.shipment.courierName}</strong>
            </p>
            <p>
              <span className="text-muted">Tracking number:</span> <strong className="tabular-nums">{order.shipment.trackingNumber}</strong>
            </p>
            {order.shipment.trackingUrl && (
              <a href={order.shipment.trackingUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1.5 font-semibold text-brand underline underline-offset-4">
                Track with courier <ExternalIcon className="size-4" />
              </a>
            )}
          </div>
        ) : (
          !["cancelled", "refunded", "returned"].includes(order.status) && (
            <p className="mt-6 text-sm text-muted">Tracking details will appear here once your order has shipped.</p>
          )
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card className="p-6">
          <h2 className="mb-4 text-xl font-bold">Items</h2>
          <ul className="divide-y divide-line">
            {order.items.map((item) => (
              <li key={item.slug} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                <div className="relative aspect-[4/3] w-20 shrink-0 overflow-hidden rounded-md bg-tint">
                  {item.image && <ProductImage image={{ ...item.image, alt: "" }} sizes="80px" />}
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{item.title}</p>
                  <p className="text-sm text-muted tabular-nums">
                    {item.qty} × {formatINR(item.unitPricePaise)}
                  </p>
                </div>
                <p className="font-semibold tabular-nums">{formatINR(item.linePaise)}</p>
              </li>
            ))}
          </ul>
          <div className="mt-6 border-t border-line pt-5">
            <OrderTotals totals={order.totals} />
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="mb-3 text-xl font-bold">Delivery address</h2>
            <AddressText address={order.shippingAddress} />
          </Card>
          <Card className="p-6">
            <h2 className="mb-3 text-xl font-bold">Invoice</h2>
            {invoice ? (
              <Button href={invoice} variant="secondary" target="_blank" rel="noopener">
                <DownloadIcon className="size-4" /> Download invoice (PDF)
              </Button>
            ) : (
              <p className="text-sm text-muted">Your GST invoice will be available here once it has been issued.</p>
            )}
          </Card>
          <Card className="p-6">
            <h2 className="mb-5 text-xl font-bold">Order timeline</h2>
            <Timeline events={order.timeline} />
          </Card>
        </div>
      </div>
    </div>
  );
}
