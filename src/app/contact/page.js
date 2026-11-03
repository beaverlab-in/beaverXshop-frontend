import ContactForm from "@/components/site/ContactForm";
import JsonLd from "@/components/site/JsonLd";
import { Breadcrumbs, Card, Container } from "@/components/ui/Layout";
import { getPublicSettings } from "@/lib/data/settings";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Contact us",
  description: "Questions about a product or an order? Send us a message and we'll help.",
  path: "/contact",
});

const crumbs = [{ label: "Home", href: "/" }, { label: "Contact us", href: "/contact" }];

export default async function ContactPage() {
  const { company } = await getPublicSettings();
  const hasDetails = company.supportEmail || company.supportPhone || company.supportHours || company.address;
  return (
    <Container className="pt-8 pb-8">
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <Breadcrumbs items={crumbs} />
      <h1 className="mt-6 text-4xl font-extrabold text-brand md:text-5xl">Contact us</h1>
      <p className="mt-4 max-w-2xl text-lg text-muted">Questions about a product, an order or choosing the right kit? Send us a message.</p>
      <div className="mt-10 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <Card className="p-6 sm:p-8">
          <ContactForm />
        </Card>
        {hasDetails && (
          <Card className="h-fit p-6 sm:p-8">
            <h2 className="mb-4 text-xl font-bold">Other ways to reach us</h2>
            <dl className="space-y-4 text-[0.95rem]">
              {company.supportEmail && (
                <div><dt className="text-muted">Email</dt><dd><a className="font-semibold text-brand underline underline-offset-4" href={`mailto:${company.supportEmail}`}>{company.supportEmail}</a></dd></div>
              )}
              {company.supportPhone && (
                <div><dt className="text-muted">Phone</dt><dd><a className="font-semibold text-brand underline underline-offset-4" href={`tel:${company.supportPhone.replace(/\s/g, "")}`}>{company.supportPhone}</a></dd></div>
              )}
              {company.supportHours && <div><dt className="text-muted">Support hours</dt><dd className="font-semibold">{company.supportHours}</dd></div>}
              {company.address && <div><dt className="text-muted">Address</dt><dd className="font-semibold whitespace-pre-line">{company.address}</dd></div>}
            </dl>
          </Card>
        )}
      </div>
    </Container>
  );
}
