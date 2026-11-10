import Link from "next/link";
import ProductImage from "@/components/product/ProductImage";
import QuickAdd from "@/components/product/QuickAdd";
import { DemoImageLabel, Price, StockBadge } from "@/components/product/ProductBits";
import { buttonClasses } from "@/components/ui/Button";
import { hasDiscount, primaryImage } from "@/lib/product";
import { IS_DEMO } from "@/lib/env";

/**
 * Store product card: photo well, category, name, short description, price, availability, View Details and Add to Cart.
 * `horizontal` lays the photo beside the details on wider screens (used when a row has only one or two products).
 * "View Details" stretches over the whole card (::after) so the card is one big target; Add to Cart sits above it.
 */
export default function ProductCard({ product, priority = false, horizontal = false }) {
  return (
    <article className={`card-hover group relative flex h-full flex-col overflow-hidden rounded-card border border-line bg-surface shadow-card ${horizontal ? "sm:flex-row" : ""}`}>
      <div className={`relative aspect-[4/3] overflow-hidden bg-subtle ${horizontal ? "sm:aspect-auto sm:min-h-60 sm:w-[42%] sm:shrink-0" : ""}`}>
        <div className="media-zoom absolute inset-0">
          <ProductImage image={primaryImage(product)} priority={priority} />
        </div>
        {IS_DEMO && product.isPlaceholder && <DemoImageLabel className="absolute top-3 left-3" />}
        {hasDiscount(product) && (
          <span className="absolute top-3 right-3 rounded-md bg-danger px-2 py-0.5 text-xs font-semibold text-white">
            <span className="sr-only">Save </span>-{Math.round((1 - product.pricePaise / product.compareAtPaise) * 100)}%
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        {product.category && <p className="text-xs font-semibold tracking-wide text-muted uppercase">{product.category.name}</p>}
        <h3 className="mt-1.5 text-lg leading-snug font-semibold">{product.title}</h3>
        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted">{product.tagline}</p>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <Price product={product} />
          <StockBadge product={product} />
        </div>
        <div className="mt-auto grid grid-cols-2 gap-2.5 pt-5">
          <Link
            href={`/products/${product.slug}`}
            aria-label={`View details: ${product.title}`}
            className={`${buttonClasses({ variant: "secondary", size: "sm" })} after:absolute after:inset-0`}
          >
            View Details
          </Link>
          <QuickAdd slug={product.slug} title={product.title} stock={product.stock} />
        </div>
      </div>
    </article>
  );
}
