import { formatINR } from "@/lib/money";
import { hasDiscount, stockState } from "@/lib/product";

/** Current price first and biggest; the original price appears (struck through) only when there is a real discount. */
export function Price({ product, size = "md", className = "" }) {
  const big = size === "lg";
  return (
    <p className={`flex flex-wrap items-baseline gap-x-2 ${className}`}>
      <span className={`${big ? "text-3xl" : "text-xl"} font-bold tracking-tight text-ink tabular-nums`}>{formatINR(product.pricePaise)}</span>
      {hasDiscount(product) && (
        <span className={`${big ? "text-base" : "text-sm"} text-muted line-through tabular-nums`}>
          <span className="sr-only">Original price </span>
          {formatINR(product.compareAtPaise)}
        </span>
      )}
    </p>
  );
}

/** Availability as a small dot + word, not a coloured pill (keeps cards calm). `onDark` for dark surfaces. */
export function StockBadge({ product, onDark = false }) {
  const state = stockState(product);
  const [text, dot, ink] =
    state === "out"
      ? ["Out of stock", "bg-danger", onDark ? "text-red-300" : "text-danger"]
      : state === "low"
        ? [`Only ${product.stock} left`, "bg-warning", onDark ? "text-amber-300" : "text-warning-ink"]
        : ["In stock", "bg-success", onDark ? "text-green-300" : "text-success-ink"];
  return (
    <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${ink}`}>
      <span className={`size-2 rounded-full ${dot}`} aria-hidden="true" />
      {text}
    </span>
  );
}

/** Subtle label for stand-in photos (demo mode only): the image is a stock photo, not the exact product. */
export function DemoImageLabel({ className = "" }) {
  return (
    <span className={`rounded-md bg-white/90 px-2 py-0.5 text-[0.68rem] font-medium text-muted shadow-card ring-1 ring-line backdrop-blur ${className}`}>
      Demo image
    </span>
  );
}
