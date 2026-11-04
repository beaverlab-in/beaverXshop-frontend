import Link from "next/link";
import { Suspense } from "react";
import LegalDocument, { NotPublished } from "@/components/site/LegalDocument";
import PolicyBody from "@/components/site/PolicyBody";
import { Skeleton } from "@/components/ui/States";
import { getPublishedPolicy } from "@/lib/data/privacy";
import { DATA_SOURCE } from "@/lib/env";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Privacy Policy",
  description: "What personal data we collect, why, who we share it with, how long we keep it, and your rights.",
  path: "/privacy-policy",
});

/**
 * The policy text is authored and versioned in the admin panel (Privacy & Compliance > Privacy policy). It is published only after the
 * business identity and privacy contact exist, and it states facts taken from the system's own registries (processors, retention).
 * It is read fresh on every request, never from a cache, so a newly published version is what visitors see immediately.
 */
async function PolicyContent() {
  const policy = await getPublishedPolicy();
  if (!policy) {
    return (
      <>
        <NotPublished />
        {DATA_SOURCE !== "api" && <p className="mt-4 text-sm text-muted">Demo mode: the privacy policy is written and published by store staff in the admin panel, so there is nothing to show here yet.</p>}
      </>
    );
  }
  return (
    <>
      <p className="-mt-6 mb-8 text-sm text-muted">
        Version {policy.version} · Published {new Date(policy.publishedAt).toISOString().slice(0, 10)}
      </p>
      <nav aria-label="On this page" className="mb-8 rounded-card border border-line bg-subtle p-4 text-sm">
        <p className="font-semibold">On this page</p>
        <ol className="mt-2 columns-1 gap-6 sm:columns-2">
          {policy.sections.map((s) => (
            <li key={s.key} className="py-0.5">
              <a href={`#${s.key}`} className="text-brand underline-offset-4 hover:underline">{s.title}</a>
            </li>
          ))}
        </ol>
      </nav>
      <div className="space-y-10">
        {policy.sections.map((s) => (
          <section key={s.key} id={s.key} aria-labelledby={`${s.key}-h`} className="scroll-mt-28">
            <h2 id={`${s.key}-h`} className="mb-3 text-xl font-semibold">{s.title}</h2>
            <PolicyBody text={s.body} />
          </section>
        ))}
      </div>
      <p className="mt-10 rounded-card border border-line bg-surface p-4 text-sm text-muted">
        To see or manage your data, go to <Link href="/account/privacy" className="font-medium text-brand underline underline-offset-4">Account &gt; Privacy</Link>.
      </p>
    </>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <LegalDocument title="Privacy Policy" href="/privacy-policy">
      <Suspense fallback={<Skeleton className="h-64" />}>
        <PolicyContent />
      </Suspense>
    </LegalDocument>
  );
}
