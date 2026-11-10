// Catalog data access. The ONLY place that knows whether data comes from the sample set or the API.
// Everything is cached with tags so the backend can invalidate via POST /api/revalidate.
import { cacheLife, cacheTag } from "next/cache";
import { API_URL, DATA_SOURCE } from "@/lib/env";
import { placeholderCategories, placeholderProducts } from "@/content/placeholder-data";

async function apiGet(path) {
  const res = await fetch(`${API_URL}${path}`, { headers: { Accept: "application/json" } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Catalog API ${res.status} for ${path}`);
  const json = await res.json();
  return json.data;
}

function attachCategory(product, categories) {
  const category = categories.find((c) => c.slug === product.categorySlug);
  return { ...product, category: category ? { slug: category.slug, name: category.name } : null };
}

async function loadAll() {
  if (DATA_SOURCE === "api") {
    const [categories, products] = await Promise.all([
      apiGet("/catalog/categories"),
      apiGet("/catalog/products?limit=100"),
    ]);
    return { categories: categories ?? [], products: products?.items ?? products ?? [] };
  }
  return { categories: placeholderCategories, products: placeholderProducts };
}

/** All published products, newest catalog order first. */
export async function getProducts() {
  "use cache";
  cacheLife("minutes");
  cacheTag("products");
  const { categories, products } = await loadAll();
  return products.map((p) => attachCategory(p, categories));
}

/** Only categories that actually contain products. */
export async function getCategories() {
  "use cache";
  cacheLife("minutes");
  cacheTag("products", "categories");
  const { categories, products } = await loadAll();
  return categories
    .filter((c) => products.some((p) => p.categorySlug === c.slug))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function getProduct(slug) {
  "use cache";
  cacheLife("minutes");
  cacheTag("products", `product:${slug}`);
  if (DATA_SOURCE === "api") {
    const product = await apiGet(`/catalog/products/${encodeURIComponent(slug)}`);
    return product ?? null;
  }
  const product = placeholderProducts.find((p) => p.slug === slug);
  return product ? attachCategory(product, placeholderCategories) : null;
}

export async function getRelatedProducts(product, limit = 3) {
  "use cache";
  cacheLife("minutes");
  cacheTag("products");
  const { categories, products } = await loadAll();
  const byRelated = (product.relatedSlugs ?? [])
    .map((slug) => products.find((p) => p.slug === slug))
    .filter(Boolean);
  const sameCategory = products.filter((p) => p.categorySlug === product.categorySlug && p.slug !== product.slug);
  const merged = [...byRelated, ...sameCategory].filter((p, i, arr) => arr.findIndex((x) => x.slug === p.slug) === i);
  return merged.slice(0, limit).map((p) => attachCategory(p, categories));
}

const RECENT_DAYS = 60;

/**
 * What the homepage shows beyond the plain catalog, all from real product data:
 *  - featured: the admin-flagged spotlight (first in-stock flagged one), else the first in-stock product in store order
 *  - bestSellers: admin-flagged "best seller" products (up to 4); `curated` is false when nothing is flagged and we fall back to the first in-stock products
 *  - recent: published within the last 60 days, newest first, not already shown above (empty means the section is hidden)
 */
export async function getHomeSections() {
  "use cache";
  cacheLife("minutes");
  cacheTag("products", "categories");
  const { categories, products } = await loadAll();
  const all = products.map((p) => attachCategory(p, categories));
  const inStock = all.filter((p) => p.stock > 0);

  const featured = inStock.find((p) => p.isFeatured) ?? all.find((p) => p.isFeatured) ?? inStock[0] ?? all[0] ?? null;
  const others = all.filter((p) => p.slug !== featured?.slug);

  let bestSellers = others.filter((p) => p.isBestSeller).slice(0, 4);
  const curated = bestSellers.length > 0;
  if (!curated) bestSellers = others.filter((p) => p.stock > 0).slice(0, 4);

  const shown = new Set([featured?.slug, ...bestSellers.map((p) => p.slug)]);
  const cutoff = Date.now() - RECENT_DAYS * 86_400_000;
  const recent = all
    .filter((p) => !shown.has(p.slug) && p.createdAt && new Date(p.createdAt).getTime() >= cutoff)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 4);

  return { featured, bestSellers, curated, recent };
}
