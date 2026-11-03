import { notFound } from "next/navigation";
import Link from "next/link";
import JsonLd from "@/components/site/JsonLd";
import { Breadcrumbs, Container } from "@/components/ui/Layout";
import { LEGAL_PAGES } from "@/lib/constants";
import { getLegalPage } from "@/lib/data/settings";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";

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
    path: `/legal/${slug}`,
    noindex: !page.content, // unpublished placeholder pages must not be indexed
  });
}

/** Minimal, safe renderer for admin-authored text: "## Heading" lines and blank-line separated paragraphs. React escapes everything. */
function LegalBody({ content }) {
  const blocks = content.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  return (
    <div className="space-y-5 leading-relaxed">
      {blocks.map((block, i) =>
        block.startsWith("## ") ? (
          <h2 key={i} className="pt-4 text-2xl font-bold">{block.slice(3)}</h2>
        ) : (
          <p key={i} className="whitespace-pre-line">{block}</p>
        ),
      )}
    </div>
  );
}

export default async function LegalPage({ params }) {
  const { slug } = await params;
  const page = await getLegalPage(slug);
  if (!page) notFound();
  const crumbs = [{ label: "Home", href: "/" }, { label: page.title, href: `/legal/${slug}` }];

  return (
    <Container className="max-w-3xl pt-8 pb-8">
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <Breadcrumbs items={crumbs} />
      <h1 className="mt-6 text-4xl font-extrabold text-brand">{page.title}</h1>
      {page.updatedAt && <p className="mt-2 text-sm text-muted">Last updated {new Date(page.updatedAt).toISOString().slice(0, 10)}</p>}
      <div className="mt-8">
        {page.content ? (
          <LegalBody content={page.content} />
        ) : (
          <div className="rounded-card border border-dashed border-line bg-surface p-8">
            <p className="text-lg font-semibold">This page hasn&apos;t been published yet.</p>
            <p className="mt-2 text-muted">
              The store team is still preparing this policy. If you have a question in the meantime, please{" "}
              <Link href="/contact" className="font-semibold text-brand underline underline-offset-4">contact us</Link>.
            </p>
          </div>
        )}
      </div>
    </Container>
  );
}
