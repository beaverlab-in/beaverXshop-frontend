import { CategoryGrid, HeroGrid, ProductRow, ProductRowPair, UseCases } from "@/components/home/HomeSections";
import { getCategories, getHomeSections, getProducts } from "@/lib/data/catalog";
import { buildMetadata } from "@/lib/seo";
import { IS_DEMO } from "@/lib/env";

export const metadata = buildMetadata({
  description: "Electronics, IoT and robotics kits that students assemble, program and understand, one real project at a time.",
  path: "/",
});

const unique = (list) => list.filter((p, i, all) => p && all.findIndex((x) => x?.slug === p.slug) === i);
const onSale = (p) => p.compareAtPaise > p.pricePaise;

/**
 * Store homepage, in the usual shop order: hero banner with promo tiles, shop by category, deals (only when something is
 * actually discounted), best sellers, new arrivals, use cases. Service highlights and payment info live in the footer.
 * The full catalog (filters, search, sorting) is /products.
 */
export default async function HomePage() {
  const [{ featured, bestSellers, curated, recent }, categories, products] = await Promise.all([getHomeSections(), getCategories(), getProducts()]);

  const labelFor = (p) => (p.slug === featured?.slug ? "Featured" : bestSellers.some((b) => b.slug === p.slug) ? "Best seller" : "New arrival");
  const slideProducts = unique([featured, ...bestSellers, ...recent]).slice(0, 3);
  const slides = slideProducts.map((p) => ({ product: p, label: labelFor(p), demo: IS_DEMO && Boolean(p.isPlaceholder) }));

  // Two promo tiles beside the banner: something new, something discounted, else other products; never one already in the banner.
  const inBanner = new Set(slideProducts.map((p) => p.slug));
  const deals = products.filter(onSale);
  const tiles = unique([
    ...recent.map((p) => ({ ...p, __label: "New arrival" })),
    ...deals.map((p) => ({ ...p, __label: "Deal" })),
    ...products.map((p) => ({ ...p, __label: p.category?.name ?? "Shop" })),
  ])
    .filter((p) => !inBanner.has(p.slug))
    .slice(0, 2)
    .map((p) => ({ product: p, label: p.__label }));

  return (
    <>
      <HeroGrid slides={slides} tiles={tiles} />
      <CategoryGrid categories={categories} products={products} />
      <ProductRow id="best-h" eyebrow={curated ? "Most loved" : "Good places to begin"} title={curated ? "Best Sellers" : "Start Here"} products={bestSellers} />
      <ProductRowPair
        left={{ id: "deals-h", eyebrow: "Limited-time prices", title: "Deals", products: deals.slice(0, 4), viewAll: false }}
        right={{ id: "recent-h", eyebrow: "Just in", title: "New Arrivals", products: recent, viewAll: false }}
      />
      <UseCases categories={categories} />
    </>
  );
}
