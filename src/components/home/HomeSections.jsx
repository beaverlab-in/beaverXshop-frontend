import Link from "next/link";
import Button from "@/components/ui/Button";
import ProductCard from "@/components/product/ProductCard";
import ProductImage from "@/components/product/ProductImage";
import BuyNowButton from "@/components/home/BuyNowButton";
import { ArrowRightIcon, CheckIcon, ChipIcon, CodeIcon, GlobeIcon, WrenchIcon } from "@/components/ui/Icons";
import { formatINR } from "@/lib/money";
import { hasDiscount, primaryImage, stockState, PLACEHOLDER_IMAGE } from "@/lib/product";

/* ---------- 2. Compact hero: headline on the left, a studio composition of real products on the right ---------- */

function Tile({ product, className, priority = false, delay = 0 }) {
  const frame = "rise absolute overflow-hidden rounded-3xl border-4 border-white bg-tint shadow-lift transition-transform duration-300 ease-[var(--ease-brand)] hover:z-10 hover:scale-[1.03] motion-reduce:transition-none";
  const inner = <ProductImage image={product ? primaryImage(product) : PLACEHOLDER_IMAGE} priority={priority} sizes="(min-width: 1024px) 34vw, 80vw" />;
  if (!product) {
    return (
      <div className={`${frame} ${className}`} style={{ "--d": `${delay}ms` }}>
        <div className="absolute inset-0">{inner}</div>
      </div>
    );
  }
  return (
    <Link href={`/products/${product.slug}`} aria-label={`View ${product.title}`} className={`${frame} ${className}`} style={{ "--d": `${delay}ms` }}>
      <span className="absolute inset-0">{inner}</span>
    </Link>
  );
}

export function Hero({ showcase, kitsHref }) {
  const [main, second, third] = showcase;
  return (
    <section aria-labelledby="hero-h" className="pt-8 pb-10 md:pt-12 md:pb-14">
      <div className="container-page grid items-center gap-8 lg:grid-cols-[1fr_1.05fr] lg:gap-12">
        <div>
          <p className="eyebrow rise flex items-center gap-2" style={{ "--d": "0ms" }}>
            <span className="size-2 rounded-full bg-accent" aria-hidden="true" />
            Learn by building
          </p>
          <h1 id="hero-h" className="rise mt-4 text-[2.5rem] leading-[1.05] font-extrabold text-brand sm:text-5xl lg:text-6xl" style={{ "--d": "80ms" }}>
            Turn Curiosity Into Creation.
          </h1>
          <p className="rise mt-5 max-w-lg text-lg leading-relaxed text-muted" style={{ "--d": "160ms" }}>
            Electronics, IoT and robotics kits that students assemble, program and understand, one real project at a time.
          </p>
          <div className="rise mt-7 flex flex-wrap gap-3" style={{ "--d": "240ms" }}>
            <Button href="/products" size="lg">
              Explore Products <ArrowRightIcon className="size-5" />
            </Button>
            <Button href={kitsHref} size="lg" variant="secondary">
              Discover Our Kits
            </Button>
          </div>
        </div>

        {/* Studio set: warm backdrop, soft light, floor shadow, three overlapping product frames. Max ~28rem tall. */}
        <div
          className="relative mx-auto aspect-[5/4] w-full max-w-xl overflow-hidden rounded-[2rem] border border-line lg:max-w-none"
          style={{ background: "radial-gradient(120% 90% at 30% 20%, #fffdf8 0%, #f6ecdb 55%, #ecdfc8 100%)" }}
        >
          <div className="absolute inset-x-[8%] bottom-[7%] h-[9%] rounded-[50%] bg-night/15 blur-xl" aria-hidden="true" />
          <Tile product={main} priority delay={120} className="top-[9%] left-[6%] h-[68%] w-[56%] -rotate-2" />
          {second !== undefined && <Tile product={second} delay={260} className="right-[6%] bottom-[10%] h-[44%] w-[40%] rotate-3" />}
          {third !== undefined && <Tile product={third} delay={380} className="top-[8%] right-[9%] h-[30%] w-[27%] rotate-6 max-sm:hidden" />}
        </div>
      </div>
    </section>
  );
}

/* ---------- 3. Featured product: a different layout from the cards (dark panel, big image, buy actions) ---------- */

/** Availability pill with its own solid background, so it keeps its contrast on the dark panel. */
function SpotlightStock({ product }) {
  const state = stockState(product);
  const [text, color] = state === "out" ? ["Out of stock", "text-danger"] : state === "low" ? [`Only ${product.stock} left`, "text-[#7a4d05]"] : ["In stock", "text-[#14573a]"];
  return <span className={`inline-flex rounded-full bg-white px-2.5 py-1 text-xs font-semibold ${color}`}>{text}</span>;
}

export function FeaturedSpotlight({ product }) {
  if (!product) return null;
  const features = (product.features ?? []).slice(0, 4);
  return (
    <section aria-labelledby="featured-h" className="pb-14 md:pb-20">
      <div className="container-page">
        <div className="grid overflow-hidden rounded-[2rem] bg-brand text-white lg:grid-cols-2">
          <Link href={`/products/${product.slug}`} aria-label={`View ${product.title}`} className="group relative block min-h-72 bg-tint sm:min-h-96 lg:min-h-[30rem]">
            <span className="absolute inset-0 transition-transform duration-500 ease-[var(--ease-brand)] group-hover:scale-[1.04] motion-reduce:transition-none">
              <ProductImage image={primaryImage(product)} sizes="(min-width: 1024px) 50vw, 100vw" />
            </span>
          </Link>
          <div className="flex flex-col justify-center gap-5 p-7 sm:p-10 lg:p-12">
            <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.12em] text-accent uppercase">
              <span className="size-2 rounded-full bg-accent" aria-hidden="true" /> Featured
              {product.category && <span className="text-white/70">· {product.category.name}</span>}
            </p>
            <h2 id="featured-h" className="text-3xl leading-tight font-extrabold md:text-4xl">
              {product.title}
            </h2>
            <p className="max-w-lg text-lg leading-relaxed text-white/85">{product.tagline}</p>
            {features.length > 0 && (
              <ul className="space-y-2.5">
                {features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-[0.95rem] text-white/90">
                    <CheckIcon className="mt-0.5 size-5 shrink-0 text-accent" />
                    {f}
                  </li>
                ))}
              </ul>
            )}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <p className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold tabular-nums">{formatINR(product.pricePaise)}</span>
                {hasDiscount(product) && (
                  <span className="text-white/70 line-through tabular-nums">
                    <span className="sr-only">Original price </span>
                    {formatINR(product.compareAtPaise)}
                  </span>
                )}
              </p>
              <SpotlightStock product={product} />
            </div>
            <div className="flex flex-wrap gap-3 pt-1">
              <Button href={`/products/${product.slug}`} variant="accent" size="lg" aria-label={`Explore product: ${product.title}`}>
                Explore Product <ArrowRightIcon className="size-5" />
              </Button>
              <BuyNowButton slug={product.slug} title={product.title} stock={product.stock} variant="secondary" className="!border-white !bg-white !text-brand hover:!bg-tint" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- 4. Product ecosystem: category cards with different compositions ---------- */

const TONES = [
  { bg: "bg-tint", text: "text-ink", sub: "text-ink/75", pill: "bg-white text-brand" },
  { bg: "bg-night", text: "text-white", sub: "text-white/80", pill: "bg-accent text-ink" },
  { bg: "bg-[#fbe9c8]", text: "text-ink", sub: "text-ink/75", pill: "bg-white text-brand" },
  { bg: "bg-surface border border-line", text: "text-ink", sub: "text-muted", pill: "bg-tint text-brand" },
];

function CategoryCard({ category, image, count, index, layout }) {
  const tone = TONES[index % TONES.length];
  const base = `group relative flex overflow-hidden rounded-card ${tone.bg} ${tone.text} transition-shadow duration-300 hover:shadow-lift`;
  const frame = "relative overflow-hidden rounded-[1.1rem] bg-tint/80";
  const zoom = "absolute inset-0 transition-transform duration-500 ease-[var(--ease-brand)] group-hover:scale-105 motion-reduce:transition-none";
  const text = (
    <div className="flex flex-col gap-1.5">
      <h3 className="text-xl font-bold md:text-2xl">{category.name}</h3>
      {category.tagline && <p className={`${tone.sub} text-[0.95rem]`}>{category.tagline}</p>}
      <p className="mt-2 flex items-center gap-2 text-sm font-semibold">
        <span className={`rounded-full px-3 py-1 ${tone.pill}`}>
          {count} {count === 1 ? "product" : "products"}
        </span>
        <ArrowRightIcon className="size-4 transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transition-none" />
      </p>
    </div>
  );
  const picture = (
    <div className={`${frame} ${layout === "tall" ? "min-h-52 flex-1" : layout === "wide" ? "w-2/5 shrink-0 max-sm:hidden" : "aspect-[16/9]"}`}>
      <div className={zoom}>
        <ProductImage image={image} sizes="(min-width: 1024px) 40vw, 90vw" />
      </div>
    </div>
  );
  const dir = layout === "wide" ? "flex-row items-stretch justify-between gap-5" : "flex-col justify-between gap-5";
  return (
    <Link href={`/products?category=${category.slug}`} className={`${base} ${dir} p-4 sm:p-5`}>
      {layout === "wide" ? (
        <>
          <div className="flex flex-col justify-end py-2 pl-2">{text}</div>
          {picture}
        </>
      ) : (
        <>
          {picture}
          <div className="px-1 pb-1">{text}</div>
        </>
      )}
    </Link>
  );
}

export function CategoryShowcase({ categories, products }) {
  if (categories.length === 0) return null;
  const items = categories.map((c) => {
    const inCategory = products.filter((p) => p.categorySlug === c.slug);
    const image = c.image ? { src: c.image, alt: "" } : primaryImage(inCategory[0] ?? {});
    return { c, image, count: inCategory.length };
  });
  // Exactly four categories get the asymmetric bento: one tall, one wide, two small.
  const bento = items.length === 4;
  const layouts = bento ? ["tall", "wide", "small", "small"] : items.map(() => "small");
  const cells = bento ? ["md:col-span-2 md:row-span-2", "md:col-span-2", "", ""] : items.map(() => "");
  return (
    <section aria-labelledby="eco-h" className="pb-14 md:pb-20">
      <div className="container-page">
        <div className="mb-6 max-w-xl">
          <p className="eyebrow mb-2">Product ecosystem</p>
          <h2 id="eco-h" className="text-3xl font-bold md:text-4xl">
            Everything that fits together
          </h2>
        </div>
        <ul className={`grid gap-4 sm:grid-cols-2 ${bento ? "md:grid-cols-4" : "lg:grid-cols-3"}`}>
          {items.map(({ c, image, count }, i) => (
            <li key={c.slug} className={`${cells[i]} flex`}>
              <div className="flex w-full [&>a]:w-full">
                <CategoryCard category={c} image={image} count={count} index={i} layout={layouts[i]} />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ---------- 5 & 7. Product rows (Best Sellers, Recently Added) ---------- */

export function ProductRow({ id, eyebrow, title, products, viewAll = true }) {
  if (products.length === 0) return null;
  const cols = products.length === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3";
  return (
    <section aria-labelledby={id} className="pb-14 md:pb-20">
      <div className="container-page">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
            <h2 id={id} className="text-3xl font-bold md:text-4xl">
              {title}
            </h2>
          </div>
          {viewAll && (
            <Link href="/products" className="inline-flex items-center gap-1.5 font-semibold text-brand hover:underline underline-offset-4">
              View all products <ArrowRightIcon className="size-4" />
            </Link>
          )}
        </div>
        <ul className={`grid gap-6 sm:grid-cols-2 ${cols}`}>
          {products.map((p) => (
            <li key={p.slug}>
              <ProductCard product={p} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ---------- 6. Learning through hardware: four connected steps, icon first, one short line each ---------- */

const SUBJECTS = [
  { title: "Electronics", line: "Build real circuits and see them work.", Icon: ChipIcon },
  { title: "Programming", line: "Turn ideas into code that does something.", Icon: CodeIcon },
  { title: "IoT", line: "Connect projects to the world around them.", Icon: GlobeIcon },
  { title: "Robotics", line: "Make code move real mechanisms.", Icon: WrenchIcon },
];

export function LearningThroughHardware() {
  return (
    <section id="learning" aria-labelledby="learning-h" className="scroll-mt-24 pb-14 md:pb-20">
      <div className="container-page">
        <div className="rounded-[2rem] bg-tint/70 px-6 py-10 md:px-12 md:py-14">
          <div className="mb-10 max-w-xl">
            <p className="eyebrow mb-2">Learn by building</p>
            <h2 id="learning-h" className="text-3xl font-bold md:text-4xl">
              Learning through hardware
            </h2>
          </div>
          <ol className="relative grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <span className="absolute top-8 right-[12%] left-[12%] hidden border-t-2 border-dashed border-brand/25 lg:block" aria-hidden="true" />
            {SUBJECTS.map(({ title, line, Icon }) => (
              <li key={title} className="relative flex flex-col items-start gap-4">
                <span className="grid size-16 place-items-center rounded-full border-4 border-tint bg-accent text-ink shadow-card">
                  <Icon className="size-7" />
                </span>
                <div>
                  <h3 className="text-xl font-bold">{title}</h3>
                  <p className="mt-1 text-muted">{line}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
