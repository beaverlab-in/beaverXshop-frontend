import JsonLd from "@/components/site/JsonLd";
import { Breadcrumbs, Container } from "@/components/ui/Layout";
import { ChevronDownIcon } from "@/components/ui/Icons";
import { generalFaqs } from "@/content/faq";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "FAQ",
  description: "Answers to common questions about ordering, payment, tracking and invoices.",
  path: "/faq",
});

const crumbs = [{ label: "Home", href: "/" }, { label: "FAQ", href: "/faq" }];

export default function FaqPage() {
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: generalFaqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
  return (
    <Container className="max-w-3xl pt-8 pb-8">
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <JsonLd data={faqLd} />
      <Breadcrumbs items={crumbs} />
      <h1 className="mt-6 text-4xl font-extrabold text-brand md:text-5xl">Frequently asked questions</h1>
      <p className="mt-4 text-lg text-muted">Can&apos;t find what you need? Send us a message from the contact page.</p>
      <div className="mt-10 divide-y divide-line rounded-card border border-line bg-surface">
        {generalFaqs.map((f) => (
          <details key={f.q} className="group px-6 py-4">
            <summary className="flex min-h-11 list-none items-center justify-between gap-4 text-lg font-semibold [&::-webkit-details-marker]:hidden">
              {f.q}
              <ChevronDownIcon className="size-5 shrink-0 transition-transform group-open:rotate-180" />
            </summary>
            <p className="mt-2 leading-relaxed text-muted">{f.a}</p>
          </details>
        ))}
      </div>
    </Container>
  );
}
