import Link from "next/link";
import { cacheLife } from "next/cache";
import Logo from "@/components/site/Logo";
import { LEGAL_PAGES } from "@/lib/constants";
import { getCategories } from "@/lib/data/catalog";
import { getPublicSettings } from "@/lib/data/settings";
import { BRAND_NAME, IS_DEMO } from "@/lib/env";
import { formatINR } from "@/lib/money";
import { LockIcon, MessageIcon, ReceiptIcon, TruckIcon } from "@/components/ui/Icons";

const SOCIAL_LABELS = { instagram: "Instagram", youtube: "YouTube", linkedin: "LinkedIn", x: "X", facebook: "Facebook" };

const linkCls = "rounded transition-colors hover:text-white hover:underline underline-offset-4";

function FooterList({ title, children }) {
  return (
    <div>
      <h2 className="text-sm font-semibold tracking-wide text-white uppercase">{title}</h2>
      <ul className="mt-4 space-y-2.5 text-[0.95rem] text-slate-300">{children}</ul>
    </div>
  );
}

// Time-dependent values must be cached explicitly with Cache Components.
async function CurrentYear() {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}

/** Service highlights above the footer, like most stores: only facts the store's own settings support. */
function ServiceBand({ settings }) {
  const { commerce, company } = settings;
  const items = [];
  if (commerce.shipping?.freeAbovePaise > 0) items.push({ Icon: TruckIcon, title: `Free shipping above ${formatINR(commerce.shipping.freeAbovePaise)}`, line: "Delivered to your door" });
  if (commerce.cod?.enabled) items.push({ Icon: LockIcon, title: "Cash on delivery", line: "Or pay online at checkout" });
  else if (!IS_DEMO) items.push({ Icon: LockIcon, title: "Secure online payments", line: "UPI, cards and net banking" });
  items.push({ Icon: ReceiptIcon, title: "GST invoice with every order", line: "Download it from your account" });
  items.push({ Icon: MessageIcon, title: "Need help?", line: company.supportEmail || company.supportPhone || "Send us a message", href: "/contact" });
  return (
    <section aria-label="Shopping with us" className="mt-16 border-y border-line bg-subtle">
      <ul className="container-page grid gap-y-5 py-7 sm:grid-cols-2 lg:grid-cols-4">
        {items.slice(0, 4).map(({ Icon, title, line, href }) => {
          const body = (
            <>
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-surface text-brand ring-1 ring-line">
                <Icon className="size-5" />
              </span>
              <span>
                <span className="block text-sm font-semibold">{title}</span>
                <span className="block text-sm text-slate-600">{line}</span>
              </span>
            </>
          );
          return (
            <li key={title}>
              {href ? (
                <Link href={href} className="flex items-center gap-3.5 rounded-md hover:opacity-80">
                  {body}
                </Link>
              ) : (
                <div className="flex items-center gap-3.5">{body}</div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default async function Footer() {
  const [settings, categories] = await Promise.all([getPublicSettings(), getCategories()]);
  const { company, commerce } = settings;
  const socials = Object.entries(company.social ?? {}).filter(([, url]) => url);
  const hasContact = company.supportEmail || company.supportPhone || company.address || company.supportHours;
  const payments = [commerce.cod?.enabled && "Cash on delivery", !IS_DEMO && "UPI", !IS_DEMO && "Cards", !IS_DEMO && "Net banking"].filter(Boolean);

  return (
    <footer>
      <ServiceBand settings={settings} />
      <div className="bg-dark text-white">
        <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1.3fr]">
          <div className="sm:col-span-2 lg:col-span-1">
            <Logo inverted />
            <p className="mt-4 max-w-xs text-[0.95rem] leading-relaxed text-slate-300">Electronics, IoT and robotics kits for students, teachers and makers.</p>
            {company.legalName && <p className="mt-4 text-sm text-slate-400">{company.legalName}</p>}
            {company.gstin && <p className="text-sm text-slate-400">GSTIN: {company.gstin}</p>}
            {socials.length > 0 && (
              <ul className="mt-5 flex flex-wrap gap-2">
                {socials.map(([key, url]) => (
                  <li key={key}>
                    <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center rounded-md border border-white/15 px-3 text-sm text-slate-200 transition-colors hover:border-white/40 hover:text-white">
                      {SOCIAL_LABELS[key] ?? key}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <FooterList title="Shop">
            <li>
              <Link href="/products" className={linkCls}>
                All products
              </Link>
            </li>
            {categories.map((c) => (
              <li key={c.slug}>
                <Link href={`/products?category=${c.slug}`} className={linkCls}>
                  {c.name}
                </Link>
              </li>
            ))}
          </FooterList>

          <FooterList title="Customer service">
            <li>
              <Link href="/account/orders" className={linkCls}>
                Track an order
              </Link>
            </li>
            <li>
              <Link href="/legal/shipping-and-delivery-policy" className={linkCls}>
                Shipping and delivery
              </Link>
            </li>
            <li>
              <Link href="/legal/return-and-refund-policy" className={linkCls}>
                Returns and refunds
              </Link>
            </li>
            <li>
              <Link href="/legal/cancellation-policy" className={linkCls}>
                Cancellation
              </Link>
            </li>
            <li>
              <Link href="/legal/warranty-policy" className={linkCls}>
                Warranty
              </Link>
            </li>
            <li>
              <Link href="/faq" className={linkCls}>
                FAQ
              </Link>
            </li>
          </FooterList>

          <FooterList title="Company">
            <li>
              <Link href="/about" className={linkCls}>
                About Us
              </Link>
            </li>
            <li>
              <Link href="/#learning" className={linkCls}>
                Learning Resources
              </Link>
            </li>
            <li>
              <Link href="/contact" className={linkCls}>
                Contact
              </Link>
            </li>
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
          <div className="container-page flex flex-col gap-4 py-6 text-sm text-slate-400 lg:flex-row lg:items-center lg:justify-between">
            <p>
              &copy; <CurrentYear /> {company.tradeName || BRAND_NAME}. All rights reserved. Prices in INR{commerce.pricesIncludeGst ? ", inclusive of GST" : ""}.
            </p>
            {payments.length > 0 && (
              <p className="flex flex-wrap items-center gap-2">
                <span>We accept</span>
                {payments.map((p) => (
                  <span key={p} className="rounded-md border border-white/15 px-2.5 py-1 text-xs font-medium text-slate-200">
                    {p}
                  </span>
                ))}
              </p>
            )}
            <ul className="flex flex-wrap gap-x-5 gap-y-1">
              {LEGAL_PAGES.filter((p) => ["privacy-policy", "terms-and-conditions", "cookie-policy"].includes(p.slug)).map((p) => (
                <li key={p.slug}>
                  <Link href={`/legal/${p.slug}`} className={linkCls}>
                    {p.title}
                  </Link>
                </li>
              ))}
              <li>
                <a href="#main" className={linkCls}>
                  Back to top
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
