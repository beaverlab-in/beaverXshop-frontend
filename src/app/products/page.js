import ProductCard from "@/components/product/ProductCard";
import JsonLd from "@/components/site/JsonLd";
import { Breadcrumbs, Container } from "@/components/ui/Layout";
import { EmptyState } from "@/components/ui/States";
import { PackageIcon } from "@/components/ui/Icons";
import { getCategories, getProducts } from "@/lib/data/catalog";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Products",
  description: "Electronics learning kits, IoT development boards, robotics and accessories designed for hands-on learning.",
  path: "/products",
});

const crumbs = [{ label: "Home", href: "/" }, { label: "Products", href: "/products" }];

export default async function ProductsPage() {
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);

  return (
    <Container className="pt-8 pb-8">
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <Breadcrumbs items={crumbs} />
      <header className="mt-6 max-w-2xl">
        <h1 className="text-4xl font-extrabold text-brand md:text-5xl">Products</h1>
        <p className="mt-4 text-lg text-muted">A focused range of kits and boards. Choose a place to start, then build from there.</p>
      </header>

      {products.length === 0 ? (
        <div className="mt-12">
          <EmptyState
            icon={<PackageIcon className="size-7" />}
            title="Products are coming soon"
            description="We're getting the catalog ready. Please check back shortly."
            action={{ href: "/contact", label: "Contact us" }}
          />
        </div>
      ) : (
        <>
          {categories.length > 1 && (
            <nav aria-label="Product categories" className="mt-8">
              <ul className="flex flex-wrap gap-2">
                {categories.map((c) => (
                  <li key={c.slug}>
                    <a
                      href={`#${c.slug}`}
                      className="inline-flex min-h-10 items-center rounded-full border border-line bg-surface px-4 text-sm font-semibold text-brand transition-colors hover:border-brand hover:bg-tint/50"
                    >
                      {c.name}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          {categories.map((c) => {
            const items = products.filter((p) => p.categorySlug === c.slug);
            return (
              <section key={c.slug} id={c.slug} aria-labelledby={`${c.slug}-h`} className="scroll-mt-28 pt-14">
                <div className="mb-6">
                  <h2 id={`${c.slug}-h`} className="text-2xl font-bold md:text-3xl">
                    {c.name}
                  </h2>
                  <p className="mt-1 text-muted">{c.tagline}</p>
                </div>
                <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {items.map((p) => (
                    <li key={p.slug}>
                      <ProductCard product={p} />
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </>
      )}
    </Container>
  );
}
