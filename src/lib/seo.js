import { BRAND_NAME, SITE_URL, absoluteUrl } from "@/lib/env";

const DEFAULT_DESCRIPTION =
  "Educational electronics, robotics and IoT kits that make learning hands-on. Build, explore, learn and create.";

/** Page metadata with canonical, Open Graph and Twitter cards. Titles get the brand suffix from the root template. */
export function buildMetadata({ title, description = DEFAULT_DESCRIPTION, path = "/", image, noindex = false }) {
  const url = absoluteUrl(path);
  const imageUrl = image ? (image.startsWith("http") ? image : absoluteUrl(image)) : absoluteUrl("/og-default.svg");
  return {
    ...(title ? { title } : {}),
    description,
    alternates: { canonical: url },
    openGraph: { title: title || BRAND_NAME, description, url, siteName: BRAND_NAME, type: "website", locale: "en_IN", images: [{ url: imageUrl }] },
    twitter: { card: "summary_large_image", title: title || BRAND_NAME, description, images: [imageUrl] },
    ...(noindex ? { robots: { index: false, follow: false } } : {}),
  };
}

export const noIndexMetadata = (title) => ({ title, robots: { index: false, follow: false } });

export function organizationJsonLd(company = {}) {
  const sameAs = Object.values(company.social ?? {}).filter(Boolean);
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: company.tradeName || BRAND_NAME,
    ...(company.legalName ? { legalName: company.legalName } : {}),
    url: SITE_URL,
    logo: absoluteUrl("/favicon.svg"),
    ...(company.supportEmail ? { email: company.supportEmail } : {}),
    ...(company.supportPhone ? { telephone: company.supportPhone } : {}),
    ...(sameAs.length ? { sameAs } : {}),
  };
}

/** Real price / availability only. No ratings or reviews are ever emitted. */
export function productJsonLd(product) {
  const image = product.images?.map((i) => (i.src.startsWith("http") ? i.src : absoluteUrl(i.src)));
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description,
    sku: product.sku,
    ...(image?.length ? { image } : {}),
    ...(product.category ? { category: product.category.name } : {}),
    brand: { "@type": "Brand", name: BRAND_NAME },
    offers: {
      "@type": "Offer",
      url: absoluteUrl(`/products/${product.slug}`),
      priceCurrency: "INR",
      price: (product.pricePaise / 100).toFixed(2),
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  };
}

export function breadcrumbJsonLd(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.label,
      item: absoluteUrl(item.href ?? "/"),
    })),
  };
}
