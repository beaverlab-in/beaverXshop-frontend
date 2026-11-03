// Pure helpers shared by server and client components.

export function stockState(product) {
  if (!product || product.stock <= 0) return "out";
  if (product.stock <= (product.lowStockThreshold ?? 5)) return "low";
  return "in";
}

export function hasDiscount(product) {
  return product.compareAtPaise > product.pricePaise;
}

export function primaryImage(product) {
  return product.images?.[0] ?? { src: "/placeholders/kit.svg", alt: product.title };
}
