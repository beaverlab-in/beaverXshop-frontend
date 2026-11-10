"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Layout";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/States";
import { PackageIcon, ArrowRightIcon } from "@/components/ui/Icons";
import ProductImage from "@/components/product/ProductImage";
import { PaymentBadge, StatusBadge, formatDay } from "@/components/account/OrderBits";
import useAsync from "@/hooks/useAsync";
import { listOrders } from "@/lib/client/accountApi";
import { formatINR } from "@/lib/money";

export default function OrdersView() {
  const { data, error, loading, reload } = useAsync(listOrders, []);

  if (loading && !data) {
    return (
      <div className="space-y-4" aria-busy="true">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-36" />
        <Skeleton className="h-36" />
      </div>
    );
  }
  if (error) return <ErrorState description={error.message} onRetry={reload} />;

  const orders = data ?? [];
  return (
    <div>
      <h1 className="text-3xl font-bold">My orders</h1>
      {orders.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={<PackageIcon className="size-7" />}
            title="No orders yet"
            description="When you place an order, you can track it here."
            action={{ href: "/products", label: "Explore products" }}
          />
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {orders.map((o) => (
            <li key={o.orderNumber}>
              <Card className="card-hover p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="eyebrow">Order</p>
                    <h2 className="text-lg font-bold tabular-nums">{o.orderNumber}</h2>
                    <p className="text-sm text-muted">Placed on {formatDay(o.createdAt)}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge status={o.status} />
                    <PaymentBadge status={o.paymentStatus} />
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between gap-4 border-t border-line pt-4">
                  <ul className="flex -space-x-2">
                    {o.items.slice(0, 4).map((item) => (
                      <li key={item.slug} className="relative size-12 overflow-hidden rounded-md border-2 border-surface bg-subtle">
                        {item.image && <ProductImage image={{ ...item.image, alt: item.title }} sizes="48px" />}
                      </li>
                    ))}
                  </ul>
                  <p className="font-bold tabular-nums">{formatINR(o.totals.grandPaise)}</p>
                  <Link
                    href={`/account/orders/${o.orderNumber}`}
                    className="inline-flex items-center gap-1.5 font-semibold text-brand underline-offset-4 hover:underline"
                  >
                    View details <ArrowRightIcon className="size-4" />
                  </Link>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
