import { Suspense } from "react";
import ProductCard from "@/components/product/ProductCard";
import { Breadcrumbs, Container } from "@/components/ui/Layout";
import { EmptyState, Skeleton } from "@/components/ui/States";
import { SearchIcon } from "@/components/ui/Icons";
import { getProducts } from "@/lib/data/catalog";
import { matchesWords } from "@/lib/product";
import { noIndexMetadata } from "@/lib/seo";

export const metadata = noIndexMetadata("Search");

async function Results({ searchParams }) {
  const { q = "", category = "" } = await searchParams;
  const term = String(Array.isArray(q) ? q[0] : q).trim().slice(0, 80);
  const words = term.toLowerCase().split(/\s+/).filter(Boolean);
  const slug = String(Array.isArray(category) ? category[0] : category);
  const products = (await getProducts()).filter((p) => !slug || p.categorySlug === slug);
  const scope = products.find((p) => p.categorySlug === slug)?.category?.name;
  const found = words.length ? products.filter((p) => matchesWords(p, words)) : [];

  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{term ? `Results for “${term}”` : "Search"}</h1>
      {!term ? (
        <p className="mt-2 text-muted">Type what you&apos;re looking for in the search bar at the top of the page.</p>
      ) : found.length === 0 ? (
        <div className="mt-8">
          <EmptyState icon={<SearchIcon className="size-7" />} title="No products match your search" description="Check the spelling, try a shorter word, or browse everything." action={{ href: "/products", label: "Browse all products" }} />
        </div>
      ) : (
        <>
          <p className="mt-2 text-muted" role="status">
            {found.length} {found.length === 1 ? "product" : "products"} found{scope ? ` in ${scope}` : ""}
          </p>
          <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {found.map((p) => (
              <li key={p.slug}>
                <ProductCard product={p} />
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}

export default function SearchPage({ searchParams }) {
  return (
    <Container className="pt-8 pb-8">
      <Breadcrumbs items={[{ label: "Products", href: "/products" }, { label: "Search" }]} />
      <div className="mt-6">
        <Suspense fallback={<Skeleton className="h-64" />}>
          <Results searchParams={searchParams} />
        </Suspense>
      </div>
    </Container>
  );
}
