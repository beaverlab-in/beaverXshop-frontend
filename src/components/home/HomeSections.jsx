import Link from "next/link";
import ProductCard from "@/components/product/ProductCard";
import ProductImage from "@/components/product/ProductImage";
import HeroCarousel from "@/components/home/HeroCarousel";
import { ArrowRightIcon, ChipIcon, CodeIcon, GlobeIcon, WrenchIcon } from "@/components/ui/Icons";
import { formatINR } from "@/lib/money";
import { primaryImage } from "@/lib/product";
import { BRAND_NAME } from "@/lib/env";

function SectionHead({ id, eyebrow, title, href, linkLabel = "View all products" }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3 md:mb-8">
      <div>
        {eyebrow && <p className="eyebrow mb-1.5">{eyebrow}</p>}
        <h2 id={id} className="text-2xl font-bold tracking-tight md:text-3xl">
          {title}
        </h2>
      </div>
      {href && (
        <Link href={href} className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:text-brand-dark">
          {linkLabel} <ArrowRightIcon className="size-4" />
        </Link>
      )}
    </div>
  );
}

/* ---------- Hero: main banner (slider) plus two promo tiles, the usual store layout ---------- */

function PromoTile({ product, label }) {
  return (
    <Link href={`/products/${product.slug}`} className="card-hover group relative flex min-h-40 overflow-hidden rounded-3xl border border-line bg-subtle lg:min-h-0 lg:flex-1">
      <span className="flex min-w-0 flex-1 flex-col justify-center gap-1 p-5">
        <span className="text-xs font-semibold tracking-wide text-brand uppercase">{label}</span>
        <span className="line-clamp-2 text-lg leading-snug font-semibold">{product.title}</span>
        <span className="text-sm font-semibold tabular-nums">
          {product.compareAtPaise > product.pricePaise ? (
            <>
              {formatINR(product.pricePaise)} <span className="font-normal text-muted line-through">{formatINR(product.compareAtPaise)}</span>
            </>
          ) : (
            <>From {formatINR(product.pricePaise)}</>
          )}
        </span>
        <span className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-brand">
          Shop now <ArrowRightIcon className="size-4 transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transition-none" />
        </span>
      </span>
      <span className="relative w-2/5 shrink-0 overflow-hidden">
        <span className="media-zoom absolute inset-0">
          <ProductImage image={primaryImage(product)} fit="cover" sizes="(min-width: 1024px) 10vw, 40vw" />
        </span>
      </span>
    </Link>
  );
}

export function HeroGrid({ slides, tiles }) {
  if (slides.length === 0) return null;
  return (
    <section aria-label="Featured" className="pt-4 pb-10 md:pt-6 md:pb-12">
      <div className="container-page">
        <h1 className="sr-only">{BRAND_NAME}: electronics, IoT and robotics kits</h1>
        <div className="grid gap-4 lg:grid-cols-[1fr_21rem] xl:grid-cols-[1fr_23rem]">
          <HeroCarousel slides={slides} />
          {tiles.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 lg:grid-rows-2">
              {tiles.map(({ product, label }) => (
                <PromoTile key={product.slug} product={product} label={label} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* ---------- Shop by category ---------- */

export function CategoryGrid({ categories, products }) {
  if (categories.length === 0) return null;
  const cols = categories.length >= 4 ? "lg:grid-cols-4" : categories.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-2";
  return (
    <section aria-labelledby="cat-h" className="pb-12 md:pb-16">
      <div className="container-page">
        <SectionHead id="cat-h" title="Shop by category" href="/products" />
        <ul className={`grid grid-cols-2 gap-3 sm:gap-5 ${cols}`}>
          {categories.map((c) => {
            const inCategory = products.filter((p) => p.categorySlug === c.slug);
            const image = c.image ? { src: c.image, alt: "" } : primaryImage(inCategory[0] ?? {});
            return (
              <li key={c.slug}>
                <Link href={`/products?category=${c.slug}`} className="card-hover group block h-full overflow-hidden rounded-card border border-line bg-surface shadow-card">
                  <span className="relative block aspect-[4/3] overflow-hidden bg-subtle">
                    <span className="media-zoom absolute inset-0">
                      <ProductImage image={image} sizes="(min-width: 1024px) 25vw, 50vw" />
                    </span>
                  </span>
                  <span className="block p-4">
                    <span className="block text-base font-semibold sm:text-lg">{c.name}</span>
                    <span className="mt-1 flex items-center justify-between text-sm text-muted">
                      {inCategory.length} {inCategory.length === 1 ? "product" : "products"}
                      <ArrowRightIcon className="size-4 text-brand transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transition-none" />
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

/* ---------- Product rows (Deals, Best Sellers, New Arrivals) ---------- */

/** Heading plus cards. One or two products are shown as wide side-by-side cards so a short row does not look empty. */
export function ProductBlock({ id, eyebrow, title, products, viewAll = true }) {
  if (products.length === 0) return null;
  const few = products.length <= 2;
  const cols = few ? "" : products.length === 4 ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-2 lg:grid-cols-3";
  return (
    <section aria-labelledby={id}>
      <SectionHead id={id} eyebrow={eyebrow} title={title} href={viewAll ? "/products" : undefined} />
      <ul className={`grid gap-5 ${cols}`}>
        {products.map((p) => (
          <li key={p.slug}>
            <ProductCard product={p} horizontal={few} />
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ProductRow(props) {
  if (props.products.length === 0) return null;
  return (
    <div className="pb-12 md:pb-16">
      <div className="container-page">
        <ProductBlock {...props} />
      </div>
    </div>
  );
}

/** Two short rows (for example Deals and New Arrivals) side by side on wide screens instead of two mostly empty rows. */
export function ProductRowPair({ left, right }) {
  const rows = [left, right].filter((r) => r.products.length > 0);
  if (rows.length === 0) return null;
  if (rows.length === 1) return <ProductRow {...rows[0]} />;
  return (
    <div className="pb-12 md:pb-16">
      <div className="container-page grid gap-x-8 gap-y-12 lg:grid-cols-2">
        {rows.map((r) => (
          <ProductBlock key={r.id} {...r} />
        ))}
      </div>
    </div>
  );
}

/* ---------- Educational use cases (kept short; each links to the matching category when there is one) ---------- */

const USE_CASES = [
  { title: "Classroom STEM lessons", line: "Hands-on circuits that make physics and electronics click.", Icon: ChipIcon, match: /kit/ },
  { title: "Coding with real hardware", line: "Write a program, watch a board respond.", Icon: CodeIcon, match: /board/ },
  { title: "Connected projects", line: "Sensors and Wi-Fi boards for first IoT builds.", Icon: GlobeIcon, match: /iot|board/ },
  { title: "Robotics clubs and workshops", line: "Build, tune and test robots as a team.", Icon: WrenchIcon, match: /robot/ },
];

export function UseCases({ categories }) {
  return (
    <section id="learning" aria-labelledby="learn-h" className="scroll-mt-24 pb-12 md:pb-16">
      <div className="container-page">
        <div className="rounded-3xl bg-subtle px-6 py-10 md:px-12 md:py-14">
          <SectionHead id="learn-h" eyebrow="Learn by building" title="Made for hands-on learning" />
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {USE_CASES.map(({ title, line, Icon, match }) => {
              const cat = categories.find((c) => match.test(c.slug));
              return (
                <li key={title}>
                  <Link
                    href={cat ? `/products?category=${cat.slug}` : "/products"}
                    className="card-hover group flex h-full flex-col gap-4 rounded-card border border-line bg-surface p-5 shadow-card"
                  >
                    <span className="grid size-11 place-items-center rounded-md bg-brand-soft text-brand">
                      <Icon className="size-6" />
                    </span>
                    <span>
                      <h3 className="text-base font-semibold">{title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-muted">{line}</p>
                    </span>
                    <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold text-brand">
                      Shop now <ArrowRightIcon className="size-4 transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transition-none" />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
