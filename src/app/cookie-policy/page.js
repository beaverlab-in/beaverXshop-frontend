import CookieTable from "@/components/site/CookieTable";
import LegalDocument, { LegalBody } from "@/components/site/LegalDocument";
import { getCookieRegistry } from "@/lib/data/privacy";
import { getLegalPage } from "@/lib/data/settings";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({ title: "Cookie Policy", description: "The cookies and browser storage this site uses, and how to control the optional ones.", path: "/cookie-policy" });

/**
 * The table is generated from what the site really sets (the backend's cookie registry), so it cannot drift from the code.
 * Staff may add explanatory text in Settings > Legal pages (Cookie Policy); it is shown above the table.
 */
export default async function CookiePolicyPage() {
  const [registry, page] = await Promise.all([getCookieRegistry(), getLegalPage("cookie-policy")]);
  return (
    <LegalDocument title="Cookie Policy" href="/cookie-policy" updatedAt={page?.updatedAt}>
      {page?.content && (
        <div className="mb-8">
          <LegalBody content={page.content} />
        </div>
      )}
      <CookieTable registry={registry} />
    </LegalDocument>
  );
}
