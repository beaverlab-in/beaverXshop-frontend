import { notFound } from "next/navigation";
import Link from "next/link";
import Gallery from "@/components/product/Gallery";
import AddToCart from "@/components/product/AddToCart";
import ProductCard from "@/components/product/ProductCard";
import { Price, StockBadge } from "@/components/product/ProductBits";
import JsonLd from "@/components/site/JsonLd";
import { Breadcrumbs, Card, Container } from "@/components/ui/Layout";
import { CheckIcon, ChevronDownIcon, DownloadIcon, TruckIcon } from "@/components/ui/Icons";
import { getProduct, getProducts, getRelatedProducts } from "@/lib/data/catalog";
import { getPublicSettings } from "@/lib/data/settings";
import { breadcrumbJsonLd, buildMetadata, productJsonLd } from "@/lib/seo";
import { IS_DEMO } from "@/lib/env";
import { productImages } from "@/lib/product";
import { formatINR } from "@/lib/money";

export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: "Product not found", robots: { index: false } };
  return buildMetadata({
    title: product.seo?.title || product.title,
    description: product.seo?.description || product.tagline || product.description?.slice(0, 155),
    path: `/products/${product.slug}`,
    image: product.images?.[0]?.src,
  });
}

function BulletList({ items }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item} className="flex gap-3">
          <CheckIcon className="mt-1 size-5 shrink-0 text-success" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function InfoCard({ id, title, children }) {
  return (
    <Card as="section" id={id} aria-labelledby={`${id}-h`} className="scroll-mt-36 p-6 md:p-8">
      <h2 id={`${id}-h`} className="mb-5 text-xl font-semibold">
        {title}
      </h2>
      {children}
    </Card>
  );
}

export default async function ProductPage({ params }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const [related, settings] = await Promise.all([getRelatedProducts(product), getPublicSettings()]);
  const crumbs = [
    { label: "Products", href: "/products" },
    ...(product.category ? [{ label: product.category.name, href: `/products?category=${product.category.slug}` }] : []),
    { label: product.title, href: `/products/${product.slug}` },
  ];

  const sections = [
    product.features?.length && { id: "features", label: "Features" },
    product.whatYouCanBuild?.length && { id: "build", label: "What you can build" },
    product.learningOutcomes?.length && { id: "learn", label: "What you'll learn" },
    product.boxContents?.length && { id: "box", label: "In the box" },
    product.specifications?.length && { id: "specs", label: "Specifications" },
    (product.compatibility || product.resources?.length) && { id: "compat", label: "Compatibility & resources" },
    product.warranty && { id: "warranty", label: "Warranty" },
    product.faqs?.length && { id: "faq", label: "FAQ" },
  ].filter(Boolean);

  const faqJsonLd = product.faqs?.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: product.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
      }
    : null;

  return (
    <Container className="pt-8 pb-8">
      <JsonLd data={productJsonLd(product)} />
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      {faqJsonLd && <JsonLd data={faqJsonLd} />}
      <Breadcrumbs items={crumbs} />

      <div className="mt-6 grid gap-10 lg:grid-cols-[1.25fr_1fr] lg:gap-14">
        <Gallery images={productImages(product)} title={product.title} demoImage={IS_DEMO && product.isPlaceholder} />

        <div className="min-w-0 lg:sticky lg:top-24 lg:self-start">
          {product.category && <p className="text-xs font-semibold tracking-wide text-muted uppercase">{product.category.name}</p>}
          <h1 className="mt-2 text-3xl leading-tight font-bold tracking-tight md:text-4xl">{product.title}</h1>
          <p className="mt-3 text-lg text-muted">{product.tagline}</p>
          {IS_DEMO && product.isPlaceholder && (
            <p className="mt-3 text-sm text-muted">Demo product: the photos are stock images, and the name, price and details are placeholders.</p>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Price product={product} size="lg" />
            <StockBadge product={product} />
          </div>
          <p className="mt-1 text-sm text-muted">
            {settings.commerce.pricesIncludeGst ? "Inclusive of GST." : "GST extra, calculated at checkout."} Shipping calculated at checkout.
          </p>

          <p className="mt-6 leading-relaxed">{product.description}</p>

          <div className="mt-8">
            <AddToCart slug={product.slug} title={product.title} pricePaise={product.pricePaise} stock={product.stock} />
          </div>

          <section aria-labelledby="delivery-h" className="mt-8 rounded-card border border-line bg-surface p-4 sm:p-5">
            <h2 id="delivery-h" className="flex items-center gap-2 text-sm font-semibold">
              <TruckIcon className="size-5 text-brand" /> Delivery information
            </h2>
            <ul className="mt-3 space-y-1.5 text-sm text-muted">
              {settings.commerce.shipping?.flatPaise > 0 && (
                <li>
                  Shipping: {formatINR(settings.commerce.shipping.flatPaise)}
                  {settings.commerce.shipping.freeAbovePaise > 0 && <>, free on orders above {formatINR(settings.commerce.shipping.freeAbovePaise)}</>}
                </li>
              )}
              {settings.commerce.cod?.enabled && <li>Cash on delivery is available.</li>}
              <li>The exact charge and delivery estimate for your PIN code are shown at checkout.</li>
            </ul>
            <p className="mt-3 text-sm">
              <Link href="/legal/shipping-and-delivery-policy" className="font-semibold text-brand underline-offset-4 hover:underline">
                Shipping and delivery policy
              </Link>
            </p>
          </section>
        </div>
      </div>

      {sections.length > 0 && (
        <nav
          aria-label="Product sections"
          className="sticky top-16 z-30 -mx-4 mt-16 overflow-x-auto border-y border-line bg-canvas/95 px-4 backdrop-blur sm:-mx-6 sm:px-6"
        >
          <ul className="flex min-w-max gap-1 py-2">
            {sections.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="inline-flex min-h-10 items-center rounded-md px-4 text-sm font-medium text-muted hover:bg-subtle hover:text-ink">
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        {product.features?.length > 0 && (
          <InfoCard id="features" title="Features">
            <BulletList items={product.features} />
          </InfoCard>
        )}
        {product.whatYouCanBuild?.length > 0 && (
          <InfoCard id="build" title="What you can build">
            <BulletList items={product.whatYouCanBuild} />
          </InfoCard>
        )}
        {product.learningOutcomes?.length > 0 && (
          <InfoCard id="learn" title="What you'll learn">
            <BulletList items={product.learningOutcomes} />
          </InfoCard>
        )}
        {product.boxContents?.length > 0 && (
          <InfoCard id="box" title="What's inside the box">
            <BulletList items={product.boxContents} />
          </InfoCard>
        )}
        {product.specifications?.length > 0 && (
          <InfoCard id="specs" title="Specifications">
            <dl className="divide-y divide-line">
              {product.specifications.map((s) => (
                <div key={s.label} className="grid gap-1 py-3 sm:grid-cols-[1fr_1.5fr]">
                  <dt className="font-medium text-muted">{s.label}</dt>
                  <dd className="font-medium">{s.value}</dd>
                </div>
              ))}
            </dl>
          </InfoCard>
        )}
        {(product.compatibility || product.resources?.length > 0) && (
          <InfoCard id="compat" title="Compatibility & resources">
            {product.compatibility && <p className="leading-relaxed">{product.compatibility}</p>}
            {product.resources?.length > 0 && (
              <ul className="mt-5 space-y-2">
                {product.resources.map((r) => (
                  <li key={r.url}>
                    <a href={r.url} className="inline-flex items-center gap-2 font-semibold text-brand underline-offset-4 hover:underline" rel="noopener">
                      <DownloadIcon className="size-4" /> {r.label}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </InfoCard>
        )}
        {product.warranty && (
          <InfoCard id="warranty" title="Warranty">
            <p className="leading-relaxed">{product.warranty}</p>
            <p className="mt-3 text-sm">
              <Link href="/legal/warranty-policy" className="font-semibold text-brand underline underline-offset-4">
                Read the warranty policy
              </Link>
            </p>
          </InfoCard>
        )}
      </div>

      {product.faqs?.length > 0 && (
        <section id="faq" aria-labelledby="faq-h" className="mt-12 scroll-mt-36">
          <h2 id="faq-h" className="mb-5 text-xl font-semibold">
            Frequently asked questions
          </h2>
          <div className="divide-y divide-line rounded-card border border-line bg-surface">
            {product.faqs.map((f) => (
              <details key={f.q} className="group px-6 py-4">
                <summary className="flex min-h-11 list-none items-center justify-between gap-4 font-semibold [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <ChevronDownIcon className="size-5 shrink-0 transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-2 leading-relaxed text-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section aria-labelledby="related-h" className="mt-16">
          <h2 id="related-h" className="mb-6 text-2xl font-bold tracking-tight">
            You might also like
          </h2>
          <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {related.map((p) => (
              <li key={p.slug}>
                <ProductCard product={p} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </Container>
  );
}
