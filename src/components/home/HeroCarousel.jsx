"use client";

import Link from "next/link";
import { useState } from "react";
import ProductImage from "@/components/product/ProductImage";
import QuickAdd from "@/components/product/QuickAdd";
import { DemoImageLabel, StockBadge } from "@/components/product/ProductBits";
import { buttonClasses } from "@/components/ui/Button";
import { ArrowLeftIcon, ArrowRightIcon } from "@/components/ui/Icons";
import { formatINR } from "@/lib/money";
import { primaryImage } from "@/lib/product";

// Each slide gets a different surface from the palette (dark, blue, light) so the banner reads like a store promo.
const TONES = [
  { surface: "bg-dark text-white", sub: "text-slate-300", chip: "bg-white/10 text-blue-200", add: "primary", view: "inverse", onDark: true },
  { surface: "bg-brand text-white", sub: "text-blue-100", chip: "bg-white/15 text-white", add: "inverse", view: "outline", onDark: true },
  { surface: "bg-subtle text-ink", sub: "text-muted", chip: "bg-brand-soft text-brand-dark", add: "primary", view: "secondary", onDark: false },
];

/**
 * Main hero banner: up to three real products as promo slides with previous/next arrows and dots. No autoplay, so nothing moves
 * under the shopper's cursor; every slide is in the HTML (inactive ones are `hidden`).
 */
export default function HeroCarousel({ slides }) {
  const [index, setIndex] = useState(0);
  const n = slides.length;
  const go = (d) => setIndex((i) => (i + d + n) % n);

  return (
    <div role="region" aria-roledescription="carousel" aria-label="Featured products" className="relative overflow-hidden rounded-3xl">
      {slides.map(({ product, label, demo }, i) => {
        const t = TONES[i % TONES.length];
        const viewCls =
          t.view === "outline"
            ? `${buttonClasses({ variant: "ghost", size: "lg" })} border !border-white/60 !text-white hover:!bg-white/10`
            : buttonClasses({ variant: t.view, size: "lg" });
        return (
          <div
            key={product.slug}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${n}`}
            className={`${i === index ? "grid" : "hidden"} lg:min-h-[26rem] lg:grid-cols-[1.25fr_1fr] ${t.surface}`}
          >
            <div className="flex flex-col justify-center gap-4 p-6 pb-16 sm:p-9 sm:pb-16 lg:p-10 lg:pb-16">
              <p className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase ${t.chip}`}>
                {label}
                {product.category ? ` · ${product.category.name}` : ""}
              </p>
              <h2 className="text-3xl leading-[1.1] font-bold tracking-tight text-inherit sm:text-4xl">{product.title}</h2>
              <p className={`max-w-md text-base leading-relaxed sm:text-lg ${t.sub}`}>{product.tagline}</p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <p className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold tracking-tight tabular-nums">{formatINR(product.pricePaise)}</span>
                  {product.compareAtPaise > product.pricePaise && (
                    <span className={`line-through tabular-nums ${t.sub}`}>
                      <span className="sr-only">Original price </span>
                      {formatINR(product.compareAtPaise)}
                    </span>
                  )}
                </p>
                <StockBadge product={product} onDark={t.onDark} />
              </div>
              <div className="flex flex-wrap gap-3 pt-1">
                <QuickAdd slug={product.slug} title={product.title} stock={product.stock} size="lg" variant={t.add} />
                <Link href={`/products/${product.slug}`} aria-label={`View details: ${product.title}`} className={viewCls}>
                  View Details <ArrowRightIcon className="size-4" />
                </Link>
              </div>
            </div>
            <div className="relative order-first min-h-56 bg-subtle sm:min-h-72 lg:order-0">
              <Link href={`/products/${product.slug}`} aria-label={`View ${product.title}`} className="absolute inset-0 block">
                <ProductImage image={primaryImage(product)} fit="cover" priority={i === 0} sizes="(min-width: 1024px) 38vw, 100vw" />
              </Link>
              {demo && <DemoImageLabel className="absolute top-4 left-4" />}
            </div>
          </div>
        );
      })}

      {n > 1 && (
        <div className="absolute bottom-4 left-6 z-10 flex items-center gap-3 sm:left-9 lg:left-12">
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous slide"
            className="grid size-9 place-items-center rounded-full bg-white/90 text-ink shadow-card ring-1 ring-black/5 transition-colors hover:bg-white"
          >
            <ArrowLeftIcon className="size-4" />
          </button>
          <ul className="flex items-center gap-2">
            {slides.map(({ product }, i) => (
              <li key={product.slug}>
                <button
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  aria-current={i === index ? "true" : undefined}
                  className={`h-2.5 rounded-full ring-1 ring-black/10 transition-all ${i === index ? "w-7 bg-white" : "w-2.5 bg-white/60 hover:bg-white/90"}`}
                />
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next slide"
            className="grid size-9 place-items-center rounded-full bg-white/90 text-ink shadow-card ring-1 ring-black/5 transition-colors hover:bg-white"
          >
            <ArrowRightIcon className="size-4" />
          </button>
        </div>
      )}
    </div>
  );
}
