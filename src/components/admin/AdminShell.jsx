"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Logo from "@/components/site/Logo";
import { ADMIN_NAV, CRUMBS } from "@/components/admin/nav";
import { BellIcon, ChevronRightIcon, CloseIcon, LogoutIcon, MenuIcon, SearchIcon, StoreIcon } from "@/components/ui/Icons";
import { useAuth } from "@/providers/AuthProvider";
import { useToast } from "@/providers/ToastProvider";
import { admin } from "@/lib/client/adminApi";
import { formatMobile } from "@/lib/validation";
import { BRAND_NAME } from "@/lib/env";

function Breadcrumbs({ pathname }) {
  const parts = pathname.split("/").filter(Boolean); // ["admin", "orders", "64b..."]
  const crumbs = parts.map((p, i) => ({
    href: `/${parts.slice(0, i + 1).join("/")}`,
    label: CRUMBS[p] ?? (/^[a-f\d]{24}$/i.test(p) ? "Details" : p),
  }));
  return (
    <nav aria-label="Breadcrumb" className="hidden min-w-0 text-sm text-muted md:block">
      <ol className="flex items-center gap-1.5">
        {crumbs.map((c, i) => (
          <li key={c.href} className="flex items-center gap-1.5">
            {i === crumbs.length - 1 ? (
              <span aria-current="page" className="font-semibold text-ink">
                {c.label}
              </span>
            ) : (
              <Link href={c.href} className="hover:text-brand hover:underline">
                {c.label}
              </Link>
            )}
            {i < crumbs.length - 1 && <ChevronRightIcon className="size-3.5" />}
          </li>
        ))}
      </ol>
    </nav>
  );
}

function useOutsideClose(ref, onClose) {
  useEffect(() => {
    const onDown = (e) => ref.current && !ref.current.contains(e.target) && onClose();
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [ref, onClose]);
}

function Notifications({ canSee }) {
  const [open, setOpen] = useState(false);
  const [kpis, setKpis] = useState(null);
  const ref = useRef(null);
  useOutsideClose(ref, () => setOpen(false));

  useEffect(() => {
    if (!canSee) return;
    let alive = true;
    const load = () => admin.get("/dashboard", { preset: "today" }).then((d) => alive && setKpis(d.kpis)).catch(() => {});
    load();
    const t = setInterval(load, 120_000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [canSee]);

  const items = kpis
    ? [
        kpis.pendingOrders > 0 && { href: "/admin/orders?status=confirmed", text: `${kpis.pendingOrders} new order${kpis.pendingOrders === 1 ? "" : "s"} to process` },
        kpis.lowStockProducts > 0 && { href: "/admin/inventory?filter=low", text: `${kpis.lowStockProducts} product${kpis.lowStockProducts === 1 ? "" : "s"} low or out of stock` },
        kpis.codToCollectOrders > 0 && { href: "/admin/orders?method=cod&paymentStatus=cod_pending", text: `${kpis.codToCollectOrders} COD order${kpis.codToCollectOrders === 1 ? "" : "s"} awaiting cash` },
      ].filter(Boolean)
    : [];

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} className="relative grid size-10 place-items-center rounded-full hover:bg-tint/60" aria-label={`Notifications${items.length ? `, ${items.length} new` : ""}`} aria-expanded={open}>
        <BellIcon className="size-5" />
        {items.length > 0 && <span className="absolute top-1.5 right-1.5 size-2.5 rounded-full bg-danger ring-2 ring-surface" />}
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-72 rounded-card border border-line bg-surface p-2 shadow-lift">
          <p className="px-3 py-2 text-xs font-semibold tracking-wide text-muted uppercase">Needs attention</p>
          {items.length === 0 ? (
            <p className="px-3 pb-3 text-sm text-muted">You&apos;re all caught up.</p>
          ) : (
            <ul>
              {items.map((i) => (
                <li key={i.href}>
                  <Link href={i.href} onClick={() => setOpen(false)} className="block rounded-md px-3 py-2.5 text-sm hover:bg-tint/50">
                    {i.text}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function ProfileMenu() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useOutsideClose(ref, () => setOpen(false));
  const initial = (user?.name || user?.mobile || "?").trim().slice(0, 1).toUpperCase();
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 rounded-full p-1 pr-3 hover:bg-tint/60" aria-expanded={open} aria-haspopup="menu">
        <span aria-hidden="true" className="grid size-8 place-items-center rounded-full bg-brand text-sm font-bold text-white">{initial}</span>
        <span className="hidden text-sm font-semibold sm:block">{user?.name || formatMobile(user?.mobile)}</span>
        <span className="sr-only"> account menu</span>
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-64 rounded-card border border-line bg-surface p-2 shadow-lift">
          <div className="px-3 py-2">
            <p className="font-semibold">{user?.name || "Staff member"}</p>
            <p className="text-sm text-muted">{formatMobile(user?.mobile)}</p>
            <p className="mt-1 inline-block rounded-full bg-tint px-2 py-0.5 text-xs font-semibold text-brand">{user?.role?.label}</p>
          </div>
          <div className="my-1 border-t border-line" />
          <Link href="/" className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm hover:bg-tint/50">
            <StoreIcon className="size-4" /> View storefront
          </Link>
          <Link href="/account" className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm hover:bg-tint/50">
            My shopper account
          </Link>
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-sm text-danger hover:bg-danger/10"
            onClick={async () => {
              await signOut();
              toast.info("You've been logged out.");
              router.replace("/login");
            }}
          >
            <LogoutIcon className="size-4" /> Log out
          </button>
        </div>
      )}
    </div>
  );
}

function SidebarNav({ pathname, permissions, onNavigate }) {
  const items = ADMIN_NAV.filter((n) => permissions.includes(n.permission));
  return (
    <nav aria-label="Admin" className="flex-1 overflow-y-auto px-3 py-4">
      <ul className="space-y-1">
        {items.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href}>
              <Link
                href={href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-11 items-center gap-3 rounded-md px-3 text-[0.95rem] font-medium transition-colors ${active ? "bg-white/12 text-white" : "text-white/70 hover:bg-white/8 hover:text-white"}`}
              >
                <Icon className="size-5" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export default function AdminShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [drawerFor, setDrawerFor] = useState(null);
  const drawerOpen = drawerFor === pathname; // navigating closes the drawer without an effect
  const [q, setQ] = useState("");
  const permissions = user?.permissions ?? [];

  return (
    <div className="min-h-dvh bg-canvas lg:grid lg:grid-cols-[16rem_1fr]">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh flex-col bg-night lg:flex">
        <div className="flex h-16 items-center border-b border-white/10 px-5">
          <Logo inverted />
        </div>
        <SidebarNav pathname={pathname} permissions={permissions} />
        <p className="border-t border-white/10 px-5 py-4 text-xs text-white/50">{BRAND_NAME} admin</p>
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <button type="button" className="absolute inset-0 bg-night/60" aria-label="Close menu" onClick={() => setDrawerFor(null)} />
          <aside className="relative flex h-full w-72 max-w-[85%] flex-col bg-night">
            <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
              <Logo inverted />
              <button type="button" onClick={() => setDrawerFor(null)} className="grid size-10 place-items-center rounded-full text-white hover:bg-white/10" aria-label="Close menu">
                <CloseIcon className="size-5" />
              </button>
            </div>
            <SidebarNav pathname={pathname} permissions={permissions} onNavigate={() => setDrawerFor(null)} />
          </aside>
        </div>
      )}

      <div className="min-w-0">
        <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-line bg-surface/95 px-4 backdrop-blur sm:px-6">
          <button type="button" onClick={() => setDrawerFor(pathname)} className="grid size-10 place-items-center rounded-full hover:bg-tint/60 lg:hidden" aria-label="Open menu">
            <MenuIcon className="size-6" />
          </button>
          <Breadcrumbs pathname={pathname} />
          <form
            role="search"
            className="ml-auto hidden w-full max-w-xs sm:block"
            onSubmit={(e) => {
              e.preventDefault();
              if (q.trim()) router.push(`/admin/orders?q=${encodeURIComponent(q.trim())}`);
            }}
          >
            <label className="relative block">
              <span className="sr-only">Search orders by number, customer name or mobile</span>
              <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search orders, customers…" className="h-10 w-full rounded-full border border-line bg-canvas pr-3 pl-9 text-sm focus:border-brand focus:outline-none focus:ring-3 focus:ring-focus/25" />
            </label>
          </form>
          <div className="ml-auto flex items-center gap-1 sm:ml-0">
            <Notifications canSee={permissions.includes("dashboard:read")} />
            <ProfileMenu />
          </div>
        </header>
        <div id="admin-content" className="px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </div>
    </div>
  );
}
