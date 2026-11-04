"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Button from "@/components/ui/Button";
import { CloseIcon } from "@/components/ui/Icons";
import { usePrivacy } from "@/providers/PrivacyProvider";

/** Accept and Reject are the same size and style on purpose: refusing must not be harder than agreeing. */
function Banner() {
  const p = usePrivacy();
  if (!p.showBanner) return null;
  return (
    <section aria-label="Cookie choices" className="fixed inset-x-3 bottom-3 z-[70] mx-auto max-w-3xl rounded-card border border-line bg-surface p-4 shadow-lift sm:inset-x-6 sm:bottom-6 sm:p-5">
      <h2 className="text-base font-semibold">Your cookie choices</h2>
      <p className="mt-1.5 text-sm leading-relaxed text-muted">
        We always use the cookies needed to keep you signed in and your cart working. Optional analytics and marketing cookies are off unless you allow them. You can change this any time from the footer.{" "}
        <Link href="/cookie-policy" className="font-medium text-brand underline underline-offset-4">
          Cookie policy
        </Link>
      </p>
      <div className="mt-4 flex flex-wrap gap-2.5">
        <Button variant="secondary" onClick={p.rejectOptional} className="w-full sm:w-44">
          Reject optional
        </Button>
        <Button variant="secondary" onClick={p.acceptOptional} className="w-full sm:w-44">
          Accept optional
        </Button>
        <Button variant="ghost" onClick={p.openCookieSettings} className="w-full sm:w-44" aria-haspopup="dialog">
          Customize
        </Button>
      </div>
    </section>
  );
}

function Switch({ id, label, description, checked, onChange, disabled = false }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-md border border-line p-4">
      <div>
        <label htmlFor={id} className="font-semibold">
          {label}
        </label>
        <p id={`${id}-d`} className="mt-1 text-sm text-muted">
          {description}
        </p>
      </div>
      <input
        id={id}
        type="checkbox"
        role="switch"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
        aria-describedby={`${id}-d`}
        className="mt-1 size-6 shrink-0 accent-brand disabled:opacity-60"
      />
    </div>
  );
}

function Dialog() {
  const p = usePrivacy();
  const ref = useRef(null);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (p.dialogOpen && !el.open) {
      setAnalytics(p.analytics);
      setMarketing(p.marketing);
      el.showModal();
    }
    if (!p.dialogOpen && el.open) el.close();
  }, [p.dialogOpen, p.analytics, p.marketing]);

  const optional = Boolean(p.config?.optionalTracking);
  return (
    <dialog
      ref={ref}
      onClose={p.closeCookieSettings}
      onClick={(e) => e.target === ref.current && p.closeCookieSettings()}
      aria-labelledby="cookie-dialog-title"
      className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-card border border-line bg-surface p-0 text-ink shadow-lift backdrop:bg-dark/50"
    >
      {p.dialogOpen && (
        <div className="flex max-h-[88dvh] flex-col">
          <div className="flex items-center justify-between gap-4 border-b border-line px-6 py-4">
            <h2 id="cookie-dialog-title" className="text-lg font-bold">
              Cookie settings
            </h2>
            <button type="button" onClick={p.closeCookieSettings} className="grid size-9 place-items-center rounded-full hover:bg-subtle" aria-label="Close cookie settings">
              <CloseIcon className="size-5" />
            </button>
          </div>
          <div className="space-y-3 overflow-y-auto px-6 py-5">
            <Switch id="ck-essential" label="Essential" description="Sign-in, security and your shopping cart. These are needed for the service you asked for, so they cannot be turned off." checked disabled />
            {optional ? (
              <>
                <Switch id="ck-analytics" label="Analytics" description="Helps us understand how the site is used so we can improve it. Off unless you allow it." checked={analytics} onChange={setAnalytics} />
                <Switch id="ck-marketing" label="Marketing" description="Lets us measure our own offers. We do not show targeted advertising. Off unless you allow it." checked={marketing} onChange={setMarketing} />
              </>
            ) : (
              <p className="rounded-md bg-subtle p-4 text-sm text-slate-700">
                Right now this site uses <strong>only essential cookies</strong>. No analytics or marketing tools are installed, so there is nothing optional to switch on. If that changes, they will stay off until you allow them here.
              </p>
            )}
            <p className="text-sm text-muted">
              See the exact list in the{" "}
              <Link href="/cookie-policy" onClick={p.closeCookieSettings} className="font-medium text-brand underline underline-offset-4">
                Cookie policy
              </Link>
              .
            </p>
          </div>
          <div className="flex flex-wrap justify-end gap-2.5 border-t border-line px-6 py-4">
            {optional ? (
              <>
                <Button variant="secondary" onClick={p.rejectOptional}>
                  Reject optional
                </Button>
                <Button variant="secondary" onClick={p.acceptOptional}>
                  Accept optional
                </Button>
                <Button onClick={() => p.savePreferences(analytics, marketing)}>Save preferences</Button>
              </>
            ) : (
              <Button onClick={p.closeCookieSettings}>Close</Button>
            )}
          </div>
        </div>
      )}
    </dialog>
  );
}

export default function CookieConsent() {
  return (
    <>
      <Banner />
      <Dialog />
    </>
  );
}

/** Footer link that reopens the preference centre at any time. */
export function CookieSettingsLink({ className = "" }) {
  const p = usePrivacy();
  return (
    <button type="button" onClick={p.openCookieSettings} className={className} aria-haspopup="dialog">
      Cookie settings
    </button>
  );
}
