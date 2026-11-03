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
