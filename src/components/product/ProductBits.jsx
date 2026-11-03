import { formatINR } from "@/lib/money";
import { hasDiscount, stockState } from "@/lib/product";
import { Badge } from "@/components/ui/Layout";

export function Price({ product, size = "md" }) {
  const big = size === "lg";
  return (
    <p className="flex flex-wrap items-baseline gap-x-2">
      <span className={`${big ? "text-3xl" : "text-lg"} font-bold text-ink tabular-nums`}>{formatINR(product.pricePaise)}</span>
      {hasDiscount(product) && (
        <span className={`${big ? "text-base" : "text-sm"} text-muted line-through tabular-nums`}>
          <span className="sr-only">Original price </span>
          {formatINR(product.compareAtPaise)}
        </span>
      )}
    </p>
  );
}

export function StockBadge({ product }) {
  const state = stockState(product);
  if (state === "out") return <Badge tone="danger">Out of stock</Badge>;
  if (state === "low") return <Badge tone="warning">Only {product.stock} left</Badge>;
  return <Badge tone="success">In stock</Badge>;
}
