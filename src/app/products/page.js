import ProductCollection from "@/components/product/ProductCollection";
import { Breadcrumbs, Container } from "@/components/ui/Layout";
import { EmptyState } from "@/components/ui/States";
import { PackageIcon } from "@/components/ui/Icons";
import { getCategories, getProducts } from "@/lib/data/catalog";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "All Products",
  description: "Tools and kits designed to make electronics, robotics and IoT learning practical and fun.",
  path: "/products",
});

/** The complete catalog: category tabs, search, sorting and the full grid. The homepage (/) is the editorial storefront. */
export default async function ProductsPage() {
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);

  return (
    <Container className="pt-8 pb-16 md:pt-10">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Products" }]} />
      <header className="mt-6 mb-6 max-w-2xl">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Explore Our Products</h1>
        <p className="mt-2 text-lg text-muted">Tools and kits designed to make electronics, robotics and IoT learning practical and fun.</p>
      </header>
      {products.length === 0 ? (
        <EmptyState icon={<PackageIcon className="size-7" />} title="Products are coming soon" description="We are getting the store ready. Please check back shortly." action={{ href: "/contact", label: "Contact us" }} />
      ) : (
        <ProductCollection products={products} categories={categories} />
      )}
    </Container>
  );
}
