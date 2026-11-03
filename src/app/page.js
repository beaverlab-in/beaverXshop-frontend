import { CategoryShowcase, FeaturedSpotlight, Hero, LearningThroughHardware, ProductRow } from "@/components/home/HomeSections";
import { getCategories, getHomeSections, getProducts } from "@/lib/data/catalog";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  description: "Electronics, IoT and robotics kits that students assemble, program and understand, one real project at a time.",
  path: "/",
});

/**
 * The storefront homepage: hero, featured product, category discovery, best sellers, learning, recently added.
 * The full catalog (filters, search, sorting) lives at /products.
 */
export default async function HomePage() {
  const [{ featured, bestSellers, curated, recent }, categories, products] = await Promise.all([getHomeSections(), getCategories(), getProducts()]);

  // Hero set: prefer products other than the spotlight below it, so the two sections do not repeat the same photo.
  const showcase = [...bestSellers, ...recent, featured].filter((p, i, all) => p && all.findIndex((x) => x?.slug === p.slug) === i).slice(0, 3);
  const kits = categories.find((c) => /kit/i.test(c.slug));

  return (
    <>
      <Hero showcase={showcase} kitsHref={kits ? `/products?category=${kits.slug}` : "/products"} />
      <FeaturedSpotlight product={featured} />
      <CategoryShowcase categories={categories} products={products} />
      <ProductRow id="best-h" eyebrow={curated ? "Most loved" : "Good places to begin"} title={curated ? "Best Sellers" : "Start Here"} products={bestSellers} />
      <LearningThroughHardware />
      <ProductRow id="recent-h" eyebrow="Just in" title="Recently Added" products={recent} viewAll={false} />
    </>
  );
}
