"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ProductCard from "@/components/product/ProductCard";
import Button from "@/components/ui/Button";
import { SearchIcon } from "@/components/ui/Icons";
import { matchesWords } from "@/lib/product";

// Category, sort and search live in the URL (/products?category=robotics&sort=price-asc&q=kit) so a view can be linked to,
// bookmarked and reached from a product's breadcrumb. The server-rendered shell contains EVERY product (the fallback below),
// so crawlers and first paint see the whole catalog; filtering only hides cards once the page is interactive.

const SORTS = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "name", label: "Name: A to Z" },
];

const SORT_FNS = {
  featured: null,
  "price-asc": (a, b) => a.pricePaise - b.pricePaise,
  "price-desc": (a, b) => b.pricePaise - a.pricePaise,
  name: (a, b) => a.title.localeCompare(b.title),
};

function hrefFor({ category, sort, q }) {
  const p = new URLSearchParams();
  if (category && category !== "all") p.set("category", category);
  if (sort && sort !== "featured") p.set("sort", sort);
  if (q) p.set("q", q);
  const s = p.toString();
  return s ? `/products?${s}` : "/products";
}

function View({ products, categories, state, onChange }) {
  const { category, sort, q } = state;
  const [draft, setDraft] = useState(q);
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  let visible = products.filter((p) => (category === "all" || p.categorySlug === category) && (!words.length || matchesWords(p, words)));
  if (SORT_FNS[sort]) visible = [...visible].sort(SORT_FNS[sort]);
  const tabs = [{ slug: "all", name: "All Products" }, ...categories];
  const filtered = category !== "all" || words.length > 0;
  const tabCls = (on) =>
    `inline-flex min-h-11 items-center rounded-full border px-5 text-[0.95rem] font-semibold whitespace-nowrap transition-colors ${
      on ? "border-brand bg-brand text-white" : "border-line bg-surface text-ink/80 hover:border-brand/50 hover:text-brand"
    }`;
  const control = "min-h-11 rounded-full border border-line bg-surface px-4 text-[0.95rem] text-ink focus-visible:border-brand";

  return (
    <>
      {categories.length > 0 && (
        <nav aria-label="Product categories" className="-mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
          <ul className="flex gap-2 sm:flex-wrap">
            {tabs.map((t) => (
              <li key={t.slug} className="shrink-0">
                <button type="button" aria-pressed={category === t.slug} onClick={() => onChange({ ...state, category: t.slug })} className={tabCls(category === t.slug)}>
                  {t.name}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1 basis-56 sm:max-w-sm">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted" />
          <input
            type="search"
            aria-label="Search these products"
            placeholder="Search products"
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              onChange({ ...state, q: e.target.value.trim().slice(0, 80) });
            }}
            className={`${control} w-full pl-10`}
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-muted">
          Sort by
          <select value={sort} onChange={(e) => onChange({ ...state, sort: e.target.value })} className={`${control} text-ink`}>
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <p className="text-sm text-muted sm:ml-auto" role="status">
          {visible.length} {visible.length === 1 ? "product" : "products"}
        </p>
      </div>

      {visible.length === 0 ? (
        <div className="mt-8 rounded-card border border-line bg-surface px-6 py-12 text-center">
          <h2 className="text-xl font-bold">No products match</h2>
          <p className="mt-2 text-muted">Try a different word or category.</p>
          {filtered && (
            <Button
              variant="secondary"
              className="mt-5"
              onClick={() => {
                setDraft("");
                onChange({ category: "all", sort, q: "" });
              }}
            >
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <ul className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((p, i) => (
            <li key={p.slug}>
              <ProductCard product={p} priority={i < 3} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function Live({ products, categories }) {
  const router = useRouter();
  const params = useSearchParams();
  const wantedCategory = params.get("category");
  const wantedSort = params.get("sort");
  const state = {
    category: categories.some((c) => c.slug === wantedCategory) ? wantedCategory : "all",
    sort: SORTS.some((s) => s.value === wantedSort) ? wantedSort : "featured",
    q: (params.get("q") ?? "").slice(0, 80),
  };
  return <View products={products} categories={categories} state={state} onChange={(next) => router.replace(hrefFor(next), { scroll: false })} />;
}

export default function ProductCollection({ products, categories }) {
  return (
    <Suspense fallback={<View products={products} categories={categories} state={{ category: "all", sort: "featured", q: "" }} onChange={() => {}} />}>
      <Live products={products} categories={categories} />
    </Suspense>
  );
}
