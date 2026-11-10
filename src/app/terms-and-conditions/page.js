import LegalDocument, { LegalBody, NotPublished } from "@/components/site/LegalDocument";
import { getLegalPage } from "@/lib/data/settings";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata() {
  const page = await getLegalPage("terms-and-conditions");
  return buildMetadata({ title: "Terms and Conditions", description: "The terms that apply when you use the store and place orders.", path: "/terms-and-conditions", noindex: !page?.content });
}

/** Written and published by staff in Settings > Legal pages; nothing is invented here. */
export default async function TermsPage() {
  const page = await getLegalPage("terms-and-conditions");
  return (
    <LegalDocument title="Terms and Conditions" href="/terms-and-conditions" updatedAt={page?.updatedAt}>
      {page?.content ? <LegalBody content={page.content} /> : <NotPublished />}
    </LegalDocument>
  );
}
