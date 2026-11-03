import Link from "next/link";
import { cacheLife } from "next/cache";
import Logo from "@/components/site/Logo";
import { LEGAL_PAGES, NAV_LINKS } from "@/lib/constants";
import { getPublicSettings } from "@/lib/data/settings";
import { BRAND_NAME } from "@/lib/env";

const SOCIAL_LABELS = { instagram: "Instagram", youtube: "YouTube", linkedin: "LinkedIn", x: "X", facebook: "Facebook" };

function FooterList({ title, children }) {
  return (
    <div>
      <h2 className="font-display text-sm font-semibold tracking-wide text-white/90 uppercase">{title}</h2>
      <ul className="mt-4 space-y-2.5 text-[0.95rem] text-white/70">{children}</ul>
    </div>
  );
}

const linkCls = "rounded transition-colors hover:text-white hover:underline underline-offset-4";

// Time-dependent values must be cached explicitly with Cache Components.
async function CurrentYear() {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}

export default async function Footer() {
  const { company } = await getPublicSettings();
  const socials = Object.entries(company.social ?? {}).filter(([, url]) => url);
  const hasContact = company.supportEmail || company.supportPhone || company.address || company.supportHours;

  return (
    <footer className="mt-24 bg-night text-white">
      <div className="container-page grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div>
          <Logo inverted />
          <p className="mt-4 max-w-xs leading-relaxed text-white/70">
            Educational electronics, robotics and IoT products that make learning hands-on.
          </p>
          {company.legalName && <p className="mt-4 text-sm text-white/60">{company.legalName}</p>}
          {company.gstin && <p className="text-sm text-white/60">GSTIN: {company.gstin}</p>}
          {socials.length > 0 && (
            <ul className="mt-5 flex flex-wrap gap-4 text-sm">
              {socials.map(([key, url]) => (
                <li key={key}>
                  <a href={url} target="_blank" rel="noopener noreferrer" className={`${linkCls} text-white/80`}>
                    {SOCIAL_LABELS[key] ?? key}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <FooterList title="Explore">
          {NAV_LINKS.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className={linkCls}>
                {l.label}
              </Link>
            </li>
          ))}
          <li>
            <Link href="/faq" className={linkCls}>
              FAQ
            </Link>
          </li>
        </FooterList>

        <FooterList title="Support">
          <li>
            <Link href="/account/orders" className={linkCls}>
              Track an order
            </Link>
          </li>
          <li>
            <Link href="/contact" className={linkCls}>
              Contact us
            </Link>
          </li>
          {LEGAL_PAGES.map((p) => (
            <li key={p.slug}>
              <Link href={`/legal/${p.slug}`} className={linkCls}>
                {p.title}
              </Link>
            </li>
          ))}
        </FooterList>

        <FooterList title="Get in touch">
          {company.supportEmail && (
            <li>
              <a href={`mailto:${company.supportEmail}`} className={linkCls}>
                {company.supportEmail}
              </a>
            </li>
          )}
          {company.supportPhone && (
            <li>
              <a href={`tel:${company.supportPhone.replace(/\s/g, "")}`} className={linkCls}>
                {company.supportPhone}
              </a>
            </li>
          )}
          {company.supportHours && <li>{company.supportHours}</li>}
          {company.address && <li className="whitespace-pre-line">{company.address}</li>}
          {!hasContact && (
            <li>
              <Link href="/contact" className={linkCls}>
                Send us a message
              </Link>
            </li>
          )}
        </FooterList>
      </div>
      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-2 py-6 text-sm text-white/60 sm:flex-row sm:justify-between">
          <p>
            &copy; <CurrentYear /> {company.tradeName || BRAND_NAME}. All rights reserved.
          </p>
          <p>Prices in INR.</p>
        </div>
      </div>
    </footer>
  );
}
