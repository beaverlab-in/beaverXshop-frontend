"use client";

import { CookieSettingsLink } from "@/components/site/CookieConsent";
import Button from "@/components/ui/Button";
import { usePrivacy } from "@/providers/PrivacyProvider";

const groups = [
  ["essential", "Essential"],
  ["analytics", "Analytics"],
  ["marketing", "Marketing and advertising"],
];

/** Every cookie, storage item and third-party script the site uses, grouped by purpose, plus the live preference button. */
export default function CookieTable({ registry }) {
  const p = usePrivacy();
  return (
    <div className="space-y-8">
      <div className="rounded-card border border-line bg-surface p-5">
        <p className="font-semibold">Your choices</p>
        <p className="mt-1 text-sm text-muted">
          {p.config?.optionalTracking
            ? `Analytics: ${p.analytics ? "allowed" : "off"}. Marketing: ${p.marketing ? "allowed" : "off"}.`
            : "No optional (analytics or marketing) cookies are in use, so there is nothing to opt in or out of today."}
        </p>
        <Button variant="secondary" size="sm" className="mt-3" onClick={p.openCookieSettings}>
          Open cookie settings
        </Button>
      </div>
      {groups.map(([key, title]) => (
        <section key={key} aria-labelledby={`ck-${key}`}>
          <h2 id={`ck-${key}`} className="mb-3 text-xl font-semibold">{title}</h2>
          <div className="overflow-x-auto rounded-md border border-line">
            <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
              <thead className="bg-subtle">
                <tr>
                  <th scope="col" className="px-3 py-2 font-semibold">Name</th>
                  <th scope="col" className="px-3 py-2 font-semibold">Type</th>
                  <th scope="col" className="px-3 py-2 font-semibold">Who sets it</th>
                  <th scope="col" className="px-3 py-2 font-semibold">What it does</th>
                  <th scope="col" className="px-3 py-2 font-semibold">How long</th>
                </tr>
              </thead>
              <tbody>
                {registry.filter((c) => c.category === key).map((c) => (
                  <tr key={c.name} className="border-t border-line align-top">
                    <td className="px-3 py-2 font-medium">{c.name}</td>
                    <td className="px-3 py-2">{c.type}</td>
                    <td className="px-3 py-2">{c.provider}</td>
                    <td className="px-3 py-2">{c.purpose}</td>
                    <td className="px-3 py-2">{c.duration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
      <p className="text-sm text-muted">
        You can also reopen these choices any time with the <CookieSettingsLink className="font-medium text-brand underline underline-offset-4" /> link in the footer.
      </p>
    </div>
  );
}
