import { getCategories, getProducts } from "@/lib/data/catalog";
import { BRAND_NAME, absoluteUrl } from "@/lib/env";

// Informational summary for language-model crawlers. It does not guarantee any AI search visibility.
export async function GET() {
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);
  const lines = [
    `# ${BRAND_NAME}`,
    "",
    "> Educational electronics, robotics and IoT products that help students learn by building.",
    "",
    "## Key pages",
    `- [Products](${absoluteUrl("/products")}): the full product range`,
    `- [About](${absoluteUrl("/about")}): who we are`,
    `- [FAQ](${absoluteUrl("/faq")}): ordering, payment, tracking and invoices`,
    `- [Contact](${absoluteUrl("/contact")}): ask us a question`,
    "",
    "## Products",
    ...categories.flatMap((c) => [
      `### ${c.name}`,
      ...products.filter((p) => p.categorySlug === c.slug).map((p) => `- [${p.title}](${absoluteUrl(`/products/${p.slug}`)}): ${p.tagline}`),
    ]),
    "",
  ];
  return new Response(lines.join("\n"), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
