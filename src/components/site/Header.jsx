import Link from "next/link";
import { Suspense } from "react";
import Logo from "@/components/site/Logo";
import { CategoryBar, HeaderActions, HeaderSearch, MobileMenu } from "@/components/site/HeaderClient";
import { NAV_LINKS } from "@/lib/constants";
import { getCategories, getHomeSections, getProducts } from "@/lib/data/catalog";
import { getPublicSettings } from "@/lib/data/settings";
import { formatINR } from "@/lib/money";
import { primaryImage } from "@/lib/product";
import { BRAND_NAME } from "@/lib/env";

/**
 * Thin strip above the header, like most stores have: a message on the left (the staff announcement when one is switched on,
 * otherwise the free-shipping offer from Settings) and help links on the right.
 */
function UtilityBar({ settings }) {
  const announcement = settings.storefront?.announcement;
  const freeAbove = settings.commerce?.shipping?.freeAbovePaise;
  const phone = settings.company?.supportPhone;
  const message = announcement?.text || (freeAbove > 0 ? `Free shipping on orders above ${formatINR(freeAbove)}` : `${BRAND_NAME}: electronics, IoT and robotics kits`);
  const href = announcement?.text ? announcement.href : "";
  const text = <span className="font-medium text-white">{message}</span>;
  const linkCls = "rounded transition-colors hover:text-white hover:underline underline-offset-4";
  return (
    <div className="bg-dark text-[0.8rem] text-slate-300" data-announcement>
      <div className="container-page flex min-h-9 items-center justify-center gap-6 py-1.5 sm:justify-between">
        <p className="text-center sm:text-left">
          {href ? (
            href.startsWith("/") ? (
              <Link href={href} className="underline-offset-4 hover:underline">
                {text}
              </Link>
            ) : (
              <a href={href} target="_blank" rel="noopener noreferrer" className="underline-offset-4 hover:underline">
                {text}
              </a>
            )
          ) : (
            text
          )}
        </p>
        <ul className="hidden items-center gap-5 sm:flex">
          <li>
            <Link href="/account/orders" className={linkCls}>
              Track order
            </Link>
          </li>
          <li>
            <Link href="/faq" className={linkCls}>
              Help &amp; FAQ
            </Link>
          </li>
          <li>
            <Link href="/contact" className={linkCls}>
              Contact
            </Link>
          </li>
          {phone && (
            <li>
              <a href={`tel:${phone.replace(/\s/g, "")}`} className={linkCls}>
                {phone}
              </a>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}

const slim = (p) => ({
  slug: p.slug,
  title: p.title,
  tagline: p.tagline,
  pricePaise: p.pricePaise,
  categorySlug: p.categorySlug,
  categoryName: p.category?.name ?? "",
  image: primaryImage(p).src,
});

export default async function Header() {
  const [categories, settings, products, home] = await Promise.all([getCategories(), getPublicSettings(), getProducts(), getHomeSections()]);
  const cats = categories.map((c) => ({ slug: c.slug, name: c.name }));
  const suggestions = products.slice(0, 200).map(slim); // small catalog by design; move to a search endpoint when it grows
  const popular = [home.featured, ...home.bestSellers, ...home.recent].filter((p, i, all) => p && all.findIndex((x) => x?.slug === p.slug) === i).slice(0, 4).map(slim);
  const secondary = NAV_LINKS.filter((l) => l.href !== "/products");

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[60] focus:rounded-md focus:bg-brand focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>
      <UtilityBar settings={settings} />
      <header className="sticky top-0 z-50 border-b border-line bg-surface">
        <div className="container-page flex flex-wrap items-center gap-x-3 gap-y-2.5 py-2.5 md:flex-nowrap md:gap-x-6 md:py-3">
          <Suspense fallback={<div className="size-11 lg:hidden" />}>
            <MobileMenu links={NAV_LINKS} categories={cats} />
          </Suspense>
          <Logo />
          <div className="order-last w-full md:order-none md:max-w-3xl md:flex-1 md:basis-0">
            <HeaderSearch categories={cats} products={suggestions} />
          </div>
          <div className="ml-auto">
            <HeaderActions />
          </div>
        </div>
        <Suspense fallback={<div className="hidden h-11 border-t border-line lg:block" />}>
          <CategoryBar categories={cats} menuProducts={popular} links={secondary} />
        </Suspense>
      </header>
    </>
  );
}
