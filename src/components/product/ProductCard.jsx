import Link from "next/link";
import ProductImage from "@/components/product/ProductImage";
import { Price, StockBadge } from "@/components/product/ProductBits";
import { ArrowRightIcon } from "@/components/ui/Icons";
import { primaryImage } from "@/lib/product";
import { IS_DEMO } from "@/lib/env";

/** Image-first card. The whole card is one link target (title link stretched with ::after). */
export default function ProductCard({ product, priority = false }) {
  return (
    <article className="card-hover group relative flex h-full flex-col rounded-card border border-line bg-surface p-3 shadow-card">
      <div className="relative aspect-[4/3] overflow-hidden rounded-[0.9rem] bg-tint">
        <div className="media-zoom absolute inset-0">
          <ProductImage image={primaryImage(product)} priority={priority} />
        </div>
        {IS_DEMO && product.isPlaceholder && (
          <span className="absolute top-3 left-3 rounded-full bg-night/80 px-2.5 py-1 text-[0.7rem] font-semibold tracking-wide text-white uppercase">
            Sample product
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col px-3 pt-5 pb-3">
        {product.category && <p className="eyebrow">{product.category.name}</p>}
        <h3 className="mt-1.5 text-xl font-bold">
          <Link
            href={`/products/${product.slug}`}
            className="after:absolute after:inset-0 after:rounded-card focus-visible:outline-offset-4"
          >
            {product.title}
          </Link>
        </h3>
        <p className="mt-1.5 text-muted">{product.tagline}</p>
        <div className="mt-4 flex items-center justify-between gap-3">
          <Price product={product} />
          <StockBadge product={product} />
        </div>
        <p className="mt-auto flex items-center gap-1.5 pt-5 font-semibold text-brand">
          Explore product
          <ArrowRightIcon className="size-4 transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transition-none" />
        </p>
      </div>
    </article>
  );
}
