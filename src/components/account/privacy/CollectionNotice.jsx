"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { getCollectionNotice } from "@/lib/client/privacyApi";
import { DEMO_COLLECTION_NOTICE } from "@/content/privacy-demo";

let cached = null; // one fetch per page load, shared by every notice on the page
const load = () => (cached ??= getCollectionNotice().catch(() => DEMO_COLLECTION_NOTICE));

/** The current collection notice (and its version, which consent records point at). `null` until loaded. */
export function useCollectionNotice() {
  const [notice, setNotice] = useState(null);
  useEffect(() => {
    let alive = true;
    load().then((n) => alive && setNotice(n));
    return () => {
      alive = false;
    };
  }, []);
  return notice;
}

/**
 * The standalone notice shown where data is collected: what is collected, why, and what it enables, plus how to withdraw consent,
 * use your rights and complain. It is separate from the privacy policy and asks for nothing: any consent is a separate, unticked choice.
 * `context` is one or more of: login, checkout, address, contact, marketing, children.
 */
export default function CollectionNotice({ context, className = "" }) {
  const notice = useCollectionNotice();
  const id = useId();
  const contexts = (Array.isArray(context) ? context : [context]).filter((c) => notice?.contexts?.[c]);
  if (!notice || contexts.length === 0) return <div className={`min-h-16 ${className}`} aria-hidden="true" />;
  const { rights, contact } = notice;
  return (
    <aside aria-labelledby={id} className={`rounded-md border border-line bg-subtle p-4 text-sm ${className}`} data-collection-notice>
      <h2 id={id} className="font-semibold">Why we ask for this</h2>
      {contexts.map((c) => (
        <div key={c} className="mt-2.5">
          {contexts.length > 1 && <p className="font-medium">{notice.contexts[c].title}</p>}
          <ul className="mt-1 space-y-1.5 text-slate-700">
            {notice.contexts[c].items.map((item) => (
              <li key={item.data}>
                <span className="font-medium text-ink">{item.data}</span>: {item.purpose}. <span className="text-slate-600">Enables: {item.service}.</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
      <details className="group mt-3">
        <summary className="cursor-pointer font-medium text-brand underline-offset-4 hover:underline">Your choices, rights and how to complain</summary>
        <div className="mt-2 space-y-2 text-slate-700">
          <p>{rights.withdraw}</p>
          <p>{rights.rights}</p>
          <p>
            {notice.grievanceResponseDays ? `We answer grievances within ${notice.grievanceResponseDays} days at most. ` : ""}
            {rights.complain}
            {notice.boardComplaintUrl ? (
              <>
                {" "}
                <a href={notice.boardComplaintUrl} rel="noopener noreferrer" className="font-medium text-brand underline underline-offset-4">Board complaint details</a>.
              </>
            ) : null}
          </p>
          <p>{rights.retention}</p>
          {(contact.name || contact.email) && (
            <p>
              Privacy contact: {[contact.name, contact.title].filter(Boolean).join(", ")}
              {contact.email ? <> · <a href={`mailto:${contact.email}`} className="font-medium text-brand underline underline-offset-4">{contact.email}</a></> : null}
              {contact.phone ? ` · ${contact.phone}` : ""}
            </p>
          )}
          <p>
            <Link href="/privacy-policy" className="font-medium text-brand underline underline-offset-4">Privacy policy</Link> ·{" "}
            <Link href="/account/privacy" className="font-medium text-brand underline underline-offset-4">Your privacy settings</Link>
          </p>
        </div>
      </details>
    </aside>
  );
}

/** An optional consent: never pre-ticked, never required, with its own plain explanation. */
export function ConsentCheckbox({ id, label, description, checked, onChange, disabled = false, className = "" }) {
  return (
    <div className={`flex items-start gap-3 rounded-md border border-line p-3 ${className}`}>
      <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} disabled={disabled} className="mt-1 size-5 shrink-0 accent-brand" />
      <label htmlFor={id} className="text-sm">
        <span className="font-medium">{label}</span> <span className="text-muted">(optional)</span>
        <span className="mt-0.5 block text-muted">{description}</span>
      </label>
    </div>
  );
}
