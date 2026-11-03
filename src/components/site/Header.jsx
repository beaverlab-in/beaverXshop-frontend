import { Suspense } from "react";
import Logo from "@/components/site/Logo";
import { HeaderActions, MobileMenu, NavLinks } from "@/components/site/HeaderClient";
import { NAV_LINKS } from "@/lib/constants";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-t-4 border-t-rule border-b border-b-line bg-surface/95 backdrop-blur-[2px]">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-brand focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>
      <div className="container-page flex h-[4.25rem] items-center justify-between gap-4">
        <Logo />
        <Suspense fallback={<div className="hidden h-6 w-96 lg:block" />}>
          <NavLinks links={NAV_LINKS} />
        </Suspense>
        <div className="flex items-center gap-1">
          <HeaderActions />
          <Suspense fallback={<div className="size-11 lg:hidden" />}>
            <MobileMenu links={NAV_LINKS} />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
