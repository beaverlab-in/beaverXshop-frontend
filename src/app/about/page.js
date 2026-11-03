import Button from "@/components/ui/Button";
import JsonLd from "@/components/site/JsonLd";
import { Breadcrumbs, Container, Section, SectionHeading } from "@/components/ui/Layout";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { BRAND_NAME } from "@/lib/env";

export const metadata = buildMetadata({
  title: "About us",
  description: "We design and make educational electronics, robotics and IoT products that help students learn by building.",
  path: "/about",
});

const crumbs = [{ label: "Home", href: "/" }, { label: "About us", href: "/about" }];

const principles = [
  { title: "Learn by doing", text: "Concepts stick when students build something that works. Every product is designed around a project." },
  { title: "Start simple, go far", text: "Products are approachable on day one and leave room to grow into real programming and engineering." },
  { title: "Made to be understood", text: "We explain what each product does, what's inside and what you'll learn, before you buy." },
];

export default function AboutPage() {
  return (
    <>
      <Container className="pt-8">
        <JsonLd data={breadcrumbJsonLd(crumbs)} />
        <Breadcrumbs items={crumbs} />
        <header className="mt-6 max-w-3xl">
          <h1 className="text-4xl font-extrabold text-brand md:text-5xl">About {BRAND_NAME}</h1>
          <p className="mt-5 text-xl leading-relaxed text-muted">
            We make our own educational electronics products, so students can learn electronics, robotics, IoT and programming through hands-on experiences.
          </p>
        </header>
      </Container>
      <Section>
        <SectionHeading eyebrow="What we believe" title="Practical engineering, made approachable" />
        <ul className="mt-10 grid gap-6 md:grid-cols-3">
          {principles.map((p) => (
            <li key={p.title} className="rounded-card border border-line bg-surface p-6 shadow-card">
              <h2 className="text-xl font-bold">{p.title}</h2>
              <p className="mt-2 leading-relaxed text-muted">{p.text}</p>
            </li>
          ))}
        </ul>
        <div className="mt-12 flex flex-wrap gap-3">
          <Button href="/products" size="lg">Explore products</Button>
          <Button href="/contact" variant="secondary" size="lg">Get in touch</Button>
        </div>
      </Section>
    </>
  );
}
