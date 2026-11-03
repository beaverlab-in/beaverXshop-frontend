import { LEGAL_PAGES } from "@/lib/constants";
import { getLegalPage } from "@/lib/data/settings";
import { getProducts } from "@/lib/data/catalog";
import { absoluteUrl } from "@/lib/env";

export default async function sitemap() {
  const products = await getProducts();
  const legal = await Promise.all(LEGAL_PAGES.map((p) => getLegalPage(p.slug)));
  const staticPages = ["/", "/products", "/about", "/contact", "/faq"].map((path) => ({
    url: absoluteUrl(path),
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : 0.7,
  }));
  return [
    ...staticPages,
    ...products.map((p) => ({ url: absoluteUrl(`/products/${p.slug}`), changeFrequency: "weekly", priority: 0.8 })),
    // Only published legal pages are listed (unpublished ones are noindex).
    ...legal.filter((p) => p?.content).map((p) => ({ url: absoluteUrl(`/legal/${p.slug}`), changeFrequency: "yearly", priority: 0.3 })),
  ];
}
