import Link from "next/link";
import JsonLd from "@/components/site/JsonLd";
import { Breadcrumbs, Container } from "@/components/ui/Layout";
import { breadcrumbJsonLd } from "@/lib/seo";

/** Minimal, safe renderer for admin-authored text: "## Heading" lines and blank-line separated paragraphs. React escapes everything. */
export function LegalBody({ content }) {
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

export function NotPublished() {
  return (
    <div className="rounded-card border border-dashed border-line bg-surface p-8">
      <p className="text-lg font-semibold">This page hasn&apos;t been published yet.</p>
      <p className="mt-2 text-muted">
        The store team is still preparing this document. If you have a question in the meantime, please{" "}
        <Link href="/contact" className="font-semibold text-brand underline underline-offset-4">contact us</Link>.
      </p>
    </div>
  );
}

/** Page frame shared by the legal documents: breadcrumb, title, last-updated date, then the body. */
export default function LegalDocument({ title, href, updatedAt, version, children }) {
  const crumbs = [{ label: "Home", href: "/" }, { label: title, href }];
  return (
    <Container className="max-w-3xl pt-8 pb-8">
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <Breadcrumbs items={crumbs} />
      <h1 className="mt-6 text-3xl font-bold tracking-tight">{title}</h1>
      {(updatedAt || version) && (
        <p className="mt-2 text-sm text-muted">
          {version ? `Version ${version}` : ""}
          {version && updatedAt ? " · " : ""}
          {updatedAt ? `Last updated ${new Date(updatedAt).toISOString().slice(0, 10)}` : ""}
        </p>
      )}
      <div className="mt-8">{children}</div>
    </Container>
  );
}
