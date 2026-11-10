"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/providers/CartProvider";
import { useAuth } from "@/providers/AuthProvider";
import { CartIcon, ChevronDownIcon, ChevronRightIcon, CloseIcon, MenuIcon, SearchIcon, UserIcon } from "@/components/ui/Icons";
import { formatINR } from "@/lib/money";
import { matchesWords } from "@/lib/product";

/* ---------- Search: one wide bar with a category picker and live product suggestions ---------- */

export function HeaderSearch({ categories, products }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => boxRef.current && !boxRef.current.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  const suggestions = words.length ? products.filter((p) => (!cat || p.categorySlug === cat) && matchesWords(p, words)).slice(0, 5) : [];

  function submit(e) {
    e.preventDefault();
    const term = q.trim();
    if (!term) return;
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(term)}${cat ? `&category=${encodeURIComponent(cat)}` : ""}`);
  }

  return (
    <div ref={boxRef} className="relative min-w-0 flex-1">
      <form role="search" onSubmit={submit} className="flex h-11 items-stretch overflow-hidden rounded-md border border-slate-300 bg-surface focus-within:border-brand focus-within:ring-3 focus-within:ring-focus/20">
        {categories.length > 0 && (
          <select
            aria-label="Search category"
            value={cat}
            onChange={(e) => setCat(e.target.value)}
            className="hidden max-w-44 shrink-0 cursor-pointer truncate border-0 border-r border-line bg-subtle pr-7 pl-3 text-sm text-ink focus:outline-none lg:block"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        )}
        <input
          type="search"
          aria-label="Search products"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search kits, boards, sensors, robots…"
          autoComplete="off"
          className="min-w-0 flex-1 border-0 bg-transparent px-3.5 text-[0.95rem] text-ink placeholder:text-muted focus:outline-none"
        />
        <button type="submit" className="grid w-12 shrink-0 place-items-center bg-brand text-white transition-colors hover:bg-brand-dark" aria-label="Search">
          <SearchIcon className="size-5" />
        </button>
      </form>
      {open && words.length > 0 && (
        <div className="absolute inset-x-0 top-full z-50 mt-1.5 overflow-hidden rounded-card border border-line bg-surface shadow-lift">
          {suggestions.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted">No suggestions. Press Enter to search the whole store.</p>
          ) : (
            <ul>
              {suggestions.map((p) => (
                <li key={p.slug}>
                  <Link href={`/products/${p.slug}`} onClick={() => setOpen(false)} className="flex items-center gap-3 px-3 py-2.5 hover:bg-subtle">
                    <span className="relative size-11 shrink-0 overflow-hidden rounded-md bg-subtle">
                      {p.image && <Image src={p.image} alt="" fill sizes="44px" className="object-cover" unoptimized={p.image.endsWith(".svg")} />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{p.title}</span>
                      <span className="block truncate text-xs text-muted">{p.categoryName}</span>
                    </span>
                    <span className="text-sm font-semibold tabular-nums">{formatINR(p.pricePaise)}</span>
                  </Link>
                </li>
              ))}
              <li className="border-t border-line">
                <button type="button" onClick={submit} className="flex w-full items-center justify-between px-4 py-2.5 text-sm font-semibold text-brand hover:bg-subtle">
                  See all results for “{q.trim()}” <ChevronRightIcon className="size-4" />
                </button>
              </li>
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- Account and cart ---------- */

export function HeaderActions() {
  const { count, ready } = useCart();
  const { status } = useAuth();
  const authed = status === "authed";
  const btn = "relative inline-flex h-11 items-center gap-2 rounded-md px-2.5 text-ink transition-colors hover:bg-subtle";
  return (
    <div className="flex items-center gap-0.5">
      <Link href={authed ? "/account" : "/login"} className={btn} aria-label={authed ? "My account" : "Log in"}>
        <UserIcon className="size-6" />
        <span className="hidden text-sm font-semibold lg:block" aria-hidden="true">
          {authed ? "My account" : "Log in"}
        </span>
      </Link>
      <Link href="/cart" className={btn} aria-label={ready && count > 0 ? `Cart, ${count} item${count === 1 ? "" : "s"}` : "Cart"}>
        <span className="relative">
          <CartIcon className="size-6" />
          {ready && count > 0 && (
            <span className="absolute -top-2 -right-2.5 grid min-w-5 place-items-center rounded-full bg-brand px-1 text-[0.7rem] leading-5 font-bold text-white tabular-nums ring-2 ring-surface">
              {count}
            </span>
          )}
        </span>
        <span className="hidden text-sm font-semibold lg:block" aria-hidden="true">
          Cart
        </span>
      </Link>
    </div>
  );
}

/* ---------- Category bar with a mega menu (desktop) ---------- */

const barLink = "inline-flex h-11 items-center rounded-md px-3 text-sm font-medium transition-colors hover:bg-subtle hover:text-ink";

export function CategoryBar({ categories, menuProducts, links }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className="hidden border-t border-line lg:block">
      <div className="container-page flex items-center justify-between gap-6">
        <ul className="flex items-center gap-1">
          <li className="group relative">
            <Link href="/products" className="inline-flex h-11 items-center gap-2 rounded-md bg-brand px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-dark">
              <MenuIcon className="size-5" /> All Categories
              <ChevronDownIcon className="size-4 transition-transform group-focus-within:rotate-180 group-hover:rotate-180" />
            </Link>
            {/* Pure CSS: opens on hover and on keyboard focus; hidden links are removed from the accessibility tree. */}
            <div className="invisible absolute top-full left-0 z-50 pt-1 opacity-0 transition duration-150 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
              <div className="grid w-[46rem] grid-cols-[14rem_1fr] overflow-hidden rounded-card border border-line bg-surface shadow-lift">
                <ul className="border-r border-line bg-subtle p-2">
                  <li>
                    <Link href="/products" className="block rounded-md px-3 py-2 text-sm font-semibold hover:bg-surface">
                      All products
                    </Link>
                  </li>
                  {categories.map((c) => (
                    <li key={c.slug}>
                      <Link href={`/products?category=${c.slug}`} className="flex items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-surface">
                        {c.name} <ChevronRightIcon className="size-3.5 text-muted" />
                      </Link>
                    </li>
                  ))}
                </ul>
                {menuProducts.length > 0 && (
                  <div className="p-4">
                    <p className="mb-3 text-xs font-semibold tracking-wide text-muted uppercase">Popular products</p>
                    <ul className="grid grid-cols-2 gap-3">
                      {menuProducts.map((p) => (
                        <li key={p.slug}>
                          <Link href={`/products/${p.slug}`} className="flex items-center gap-3 rounded-md p-1.5 hover:bg-subtle">
                            <span className="relative size-14 shrink-0 overflow-hidden rounded-md bg-subtle">
                              {p.image && <Image src={p.image} alt="" fill sizes="56px" className="object-cover" unoptimized={p.image.endsWith(".svg")} />}
                            </span>
                            <span className="min-w-0">
                              <span className="line-clamp-2 text-sm leading-snug font-medium">{p.title}</span>
                              <span className="text-sm font-semibold tabular-nums">{formatINR(p.pricePaise)}</span>
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </li>
          {categories.map((c) => (
            <li key={c.slug}>
              <Link href={`/products?category=${c.slug}`} className={`${barLink} text-muted`}>
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
        <ul className="flex items-center gap-1">
          {links.map((l) => {
            const active = !l.href.includes("#") && (pathname === l.href || pathname.startsWith(`${l.href}/`));
            return (
              <li key={l.href}>
                <Link href={l.href} aria-current={active ? "page" : undefined} className={`${barLink} ${active ? "bg-subtle text-ink" : "text-muted"}`}>
                  {l.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}

/* ---------- Mobile menu ---------- */

export function MobileMenu({ links, categories = [] }) {
  // The menu is "open for" a specific path, so navigating anywhere closes it without an effect.
  const pathname = usePathname();
  const { status } = useAuth();
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

  const rowCls = "flex min-h-12 items-center rounded-md px-3 text-base font-semibold text-ink hover:bg-subtle";
  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="grid size-11 place-items-center rounded-md hover:bg-subtle"
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? "Close menu" : "Open menu"}
      >
        {open ? <CloseIcon className="size-6" /> : <MenuIcon className="size-6" />}
      </button>
      {open && (
        <div id="mobile-menu" className="absolute inset-x-0 top-full z-40 max-h-[calc(100dvh-8rem)] overflow-y-auto border-t border-line bg-surface px-4 py-4 shadow-lift">
          <div className="mx-auto max-w-md">
            <ul>
              {links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={rowCls}>
                    {link.label}
                  </Link>
                  {link.href === "/products" && categories.length > 0 && (
                    <ul className="mb-2 ml-3 border-l border-line pl-2">
                      {categories.map((c) => (
                        <li key={c.slug}>
                          <Link href={`/products?category=${c.slug}`} className="flex min-h-11 items-center rounded-md px-3 text-[0.95rem] text-muted hover:bg-subtle hover:text-ink">
                            {c.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
            <ul className="mt-3 border-t border-line pt-3">
              <li>
                <Link href={status === "authed" ? "/account" : "/login"} className={rowCls}>
                  {status === "authed" ? "My account" : "Log in or sign up"}
                </Link>
              </li>
              <li>
                <Link href="/account/orders" className={rowCls}>
                  Track an order
                </Link>
              </li>
              <li>
                <Link href="/faq" className={rowCls}>
                  Help and FAQ
                </Link>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
