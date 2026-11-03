// Pure helpers shared by server and client components.

/** Shown for products that have no photos yet (never a random stock image). Replace by uploading real images in the admin. */
export const PLACEHOLDER_IMAGE = { src: "/placeholders/detail.svg", alt: "Product image coming soon" };

export function stockState(product) {
  if (!product || product.stock <= 0) return "out";
  if (product.stock <= (product.lowStockThreshold ?? 5)) return "low";
  return "in";
}

export function hasDiscount(product) {
  return product.compareAtPaise > product.pricePaise;
}

/** All images, or a single placeholder when the product has none. */
export function productImages(product) {
  return product.images?.length ? product.images : [PLACEHOLDER_IMAGE];
}

export function primaryImage(product) {
  return product.images?.[0] ?? { ...PLACEHOLDER_IMAGE, alt: product.title ? `${product.title}: image coming soon` : PLACEHOLDER_IMAGE.alt };
}

/** Case-insensitive match of every word against name, short description, description, category and features. */
export function matchesWords(product, words) {
  const haystack = [product.title, product.tagline, product.description, product.category?.name, ...(product.features ?? [])].join(" ").toLowerCase();
  return words.every((w) => haystack.includes(w));
}
