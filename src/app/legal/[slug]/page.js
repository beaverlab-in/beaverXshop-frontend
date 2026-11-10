import { notFound, permanentRedirect } from "next/navigation";
import LegalDocument, { LegalBody, NotPublished } from "@/components/site/LegalDocument";
import { LEGAL_PAGES, legalHref } from "@/lib/constants";
import { getLegalPage } from "@/lib/data/settings";
import { buildMetadata } from "@/lib/seo";

export function generateStaticParams() {
  return LEGAL_PAGES.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const page = await getLegalPage(slug);
  if (!page) return { title: "Page not found", robots: { index: false } };
  return buildMetadata({
    title: page.title,
    description: `${page.title}: how we handle your orders, data and rights.`,
    path: legalHref(slug),
    noindex: !page.content, // unpublished placeholder pages must not be indexed
  });
}

export default async function LegalPage({ params }) {
  const { slug } = await params;
  // The privacy policy, terms and cookie policy live at their own top-level addresses (old links keep working).
  if (legalHref(slug) !== `/legal/${slug}`) permanentRedirect(legalHref(slug));
  const page = await getLegalPage(slug);
  if (!page) notFound();
  return (
    <LegalDocument title={page.title} href={`/legal/${slug}`} updatedAt={page.updatedAt}>
      {page.content ? <LegalBody content={page.content} /> : <NotPublished />}
    </LegalDocument>
  );
}
