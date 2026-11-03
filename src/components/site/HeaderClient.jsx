"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "@/providers/CartProvider";
import { useAuth } from "@/providers/AuthProvider";
import SearchButton from "@/components/site/SearchButton";
import { CartIcon, CloseIcon, MenuIcon, UserIcon } from "@/components/ui/Icons";

function isActive(pathname, href) {
  if (href.includes("#")) return false;
  if (href === "/products") return pathname === href || pathname.startsWith(`${href}/`) || pathname === "/search";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function NavLinks({ links }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className="hidden lg:block">
      <ul className="flex items-center gap-1">
        {links.map((link) => {
          const active = isActive(pathname, link.href);
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-full px-4 py-2 text-[0.95rem] font-medium transition-colors hover:bg-tint/60 hover:text-brand ${
                  active ? "text-brand underline decoration-2 underline-offset-8" : "text-ink/80"
                }`}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function HeaderActions() {
  const { count, ready } = useCart();
  const { status } = useAuth();
  const iconBtn = "relative grid size-11 place-items-center rounded-full text-ink transition-colors hover:bg-tint/60 hover:text-brand";
  return (
    <div className="flex items-center gap-1">
      <SearchButton className={iconBtn} />
      <Link href={status === "authed" ? "/account" : "/login"} className={iconBtn} aria-label={status === "authed" ? "My account" : "Log in"}>
        <UserIcon className="size-[22px]" />
      </Link>
      <Link href="/cart" className={iconBtn} aria-label={ready && count > 0 ? `Cart, ${count} item${count === 1 ? "" : "s"}` : "Cart"}>
        <CartIcon className="size-[22px]" />
        {ready && count > 0 && (
          <span className="absolute top-1 right-0.5 grid min-w-5 place-items-center rounded-full bg-brand px-1 text-[0.7rem] leading-5 font-bold text-white tabular-nums">
            {count}
          </span>
        )}
      </Link>
    </div>
  );
}

export function MobileMenu({ links }) {
  // The menu is "open for" a specific path, so navigating anywhere closes it without an effect.
  const pathname = usePathname();
  const [openFor, setOpenFor] = useState(null);
  const open = openFor === pathname;
  const setOpen = (next) => setOpenFor(next ? pathname : null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpenFor(null);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="grid size-11 place-items-center rounded-full hover:bg-tint/60"
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? "Close menu" : "Open menu"}
      >
        {open ? <CloseIcon className="size-6" /> : <MenuIcon className="size-6" />}
      </button>
      {open && (
        <div id="mobile-menu" className="fixed inset-x-0 top-[calc(4.25rem+4px)] bottom-0 z-40 overflow-y-auto bg-canvas px-4 py-6">
          <ul className="mx-auto max-w-md divide-y divide-line">
            {links.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="flex min-h-14 items-center text-xl font-semibold text-ink">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
