"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CloseIcon, SearchIcon } from "@/components/ui/Icons";

/** Search icon in the navbar. Opens a focused search box; submitting goes to /search?q=… */
export default function SearchButton({ className }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal(); // native dialog: focus moves in, Escape closes, page behind is inert
    if (!open && el.open) el.close();
  }, [open]);

  function submit(e) {
    e.preventDefault();
    const term = q.trim();
    if (!term) return;
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(term)}`);
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className} aria-label="Search products" aria-haspopup="dialog">
        <SearchIcon className="size-[22px]" />
      </button>
      <dialog
        ref={ref}
        onClose={() => setOpen(false)}
        onClick={(e) => e.target === ref.current && setOpen(false)}
        aria-label="Search products"
        className="mx-auto mt-[12vh] w-[calc(100%-2rem)] max-w-xl rounded-card border border-line bg-surface p-0 text-ink shadow-lift backdrop:bg-night/50"
      >
        {open && (
          <form role="search" onSubmit={submit} className="flex items-center gap-2 p-3">
            <label className="relative flex-1">
              <span className="sr-only">Search products</span>
              <SearchIcon className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted" />
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search kits, boards, robots…"
                autoComplete="off"
                className="h-12 w-full rounded-full border border-line bg-canvas pr-4 pl-12 text-base focus:border-brand focus:outline-none focus:ring-3 focus:ring-focus/25"
              />
            </label>
            <button type="submit" className="min-h-12 rounded-full bg-brand px-5 font-semibold text-white hover:bg-brand-dark">
              Search
            </button>
            <button type="button" onClick={() => setOpen(false)} className="grid size-12 place-items-center rounded-full hover:bg-tint/60" aria-label="Close search">
              <CloseIcon className="size-5" />
            </button>
          </form>
        )}
      </dialog>
    </>
  );
}
