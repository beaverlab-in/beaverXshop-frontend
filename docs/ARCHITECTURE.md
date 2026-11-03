# Frontend Architecture, Design System & Implementation Plan

Status: **PLAN – awaiting approval. No application code written yet.**
Stack: Next.js (App Router) · React · Tailwind CSS · **JavaScript only** (`.js`/`.jsx`, `jsconfig.json` for the `@/` alias, JSDoc where helpful; `create-next-app --js`; no `.ts/.tsx` anywhere – enforced by a CI grep).
Versions: use the latest stable Next.js/React/Tailwind at scaffold time (verified with `npm view`), pinned exactly in `package.json`.

---

## 1. Design direction (from the reference screenshot)

Sampled from the reference: page background `#FFF8F0` (warm off-white), nav/cards `#FFFFFF`, primary CTA / headline ink deep forest green `#1E4335`, illustration panel tint `#E3ECE1`, thin slate top rule `#313C4C`, large (~20 px) card radius with a hairline border, uppercase tracked micro-label above each product name, 3-column card grid with image-first cards, "Explore product →" text link, near-black product photography panels.

We take the **visual language**, not the content: no BeaverLab logo, photos, product names or copy are reused. Brand name is a setting (`NEXT_PUBLIC_BRAND_NAME`, default "BeaverLab" – see open question 1).

### Tokens (CSS variables in `src/styles/tokens.css`, exposed through the Tailwind theme)

| Group | Tokens |
|---|---|
| Colour | `--bg #FFF8F0` · `--surface #FFFFFF` · `--surface-tint #E3ECE1` · `--ink #14231C` · `--ink-muted #4D5B54` · `--brand #1E4335` (hover `#17352A`) · `--brand-ink #FFFFFF` · `--accent #E9A23B` (warm amber, sparing, Von Restorff highlights) · `--line #EADFD2` · `--rule #313C4C` · `--success #1F7A4D` · `--warning #B7791F` · `--danger #B42318` · `--focus #2563EB`. All text pairs checked ≥ 4.5:1 (AA). |
| Type | Headings: a geometric/humanist sans via `next/font` (candidate: *Plus Jakarta Sans* or *Manrope*, final pick during build), body: *Inter*-class sans. Scale (rem): 0.75 · 0.875 · 1 · 1.125 · 1.25 · 1.5 · 2 · 2.75 · 3.75 (fluid `clamp()` for display sizes). Micro-label: 0.75rem, 600, `tracking-[0.12em]`, uppercase. |
| Spacing | 4-pt base: 4 8 12 16 24 32 48 64 96 128; section padding `py-20 md:py-28`. |
| Radius | `sm 8` · `md 12` · `lg 20` (cards) · `pill 999` (buttons). |
| Shadow | `card: 0 1px 0 rgba(20,35,28,.04)` · `lift: 0 12px 32px -12px rgba(20,35,28,.18)` · `focus ring 3px`. |
| Motion | 150 / 250 / 400 ms, `cubic-bezier(.2,.7,.2,1)`; card hover = 2 px lift + image scale 1.03; everything wrapped in `@media (prefers-reduced-motion: no-preference)`. |
| Layout | Container max 1200 px, gutters 24 px (16 on mobile); breakpoints Tailwind defaults (sm 640 / md 768 / lg 1024 / xl 1280). |

Components (all in `src/components/ui`, token-driven, documented in a `/design` dev-only route): `Button` (primary/secondary/ghost/link, sizes, loading), `Card`, `Badge`, `Eyebrow`, `Input`/`Select`/`Textarea`/`Field` (label+hint+error), `OtpInput`, `QuantityStepper`, `Tabs`, `Accordion`, `Breadcrumbs`, `Tooltip`, `Modal/ConfirmDialog`, `Toast`, `Skeleton`, `EmptyState`, `ErrorState`, `Pagination`, `Table` (admin), `StatCard`, `Chart` wrappers (admin), `Price`, `StockBadge`, `ProductCard`, `Section`, `Container`.

## 2. Rendering strategy
- **Server Components by default** for Home, Products, PDP, About, FAQ, legal pages; data fetched server-side from the backend with `fetch(..., { next: { revalidate: 300, tags: ['products'] } })`. Backend calls `POST /api/revalidate` (secret header) after product/stock/settings change.
- **Client Components only for**: cart drawer & page interactions, quantity stepper, gallery, tabs/accordion, OTP/login forms, checkout steps, Razorpay launcher, account address forms, all admin interactive tables/forms/charts, toast provider.
- Auth-dependent pages (`/account/*`, `/checkout`, `/admin/*`) are dynamic, `noindex`. Session check in `middleware.js` (cookie presence → redirect only; **real authorization stays on the backend**).
- Images: `next/image` with a custom loader/`remotePatterns` for the R2 CDN domain; `sizes` set per layout; `placeholder.svg` set per category used when `images[]` is empty (clearly "image coming soon", never stock photos).

## 3. Folder structure
```
beaverxshop-frontend/
├─ docs/ARCHITECTURE.md, API-CONTRACT.md (mirrors backend docs/API.md)
├─ public/  favicon.svg, og-default.svg, placeholders/*.svg, llms.txt (generated, see SEO)
├─ src/
│  ├─ app/
│  │  ├─ (site)/                layout: header + footer
│  │  │  ├─ page.js             Home
│  │  │  ├─ products/page.js, products/[slug]/page.js
│  │  │  ├─ about/ contact/ faq/ cart/
│  │  │  ├─ checkout/ (steps as one client flow)
│  │  │  ├─ login/            (single mobile+OTP flow: signup is implicit on first verify)
│  │  │  ├─ account/ page.js, orders/page.js, orders/[orderNumber]/page.js, addresses/page.js, settings/page.js
│  │  │  └─ legal/[slug]/page.js   (privacy-policy, terms-and-conditions, shipping-and-delivery-policy, return-and-refund-policy, cancellation-policy, cookie-policy, warranty-policy, disclaimer)
│  │  ├─ (admin)/admin/         separate layout: sidebar/topbar/breadcrumbs
│  │  │  ├─ login/ · page.js (dashboard) · products/ · inventory/ · orders/ · customers/ · coupons/ · reports/ · notifications/ · settings/ · team/ · audit-log/
│  │  ├─ api/revalidate/route.js
│  │  ├─ sitemap.js · robots.js · not-found.js · error.js · global-error.js · opengraph-image.svg
│  ├─ components/ ui/ · site/ · product/ · cart/ · checkout/ · account/ · admin/
│  ├─ lib/ api.js (fetch wrapper: base URL, credentials, CSRF header, error normalisation), format.js (₹ from paise), seo.js (metadata + JSON-LD builders), auth.js, constants.js
│  ├─ hooks/ useCart · useToast · useAuth · useDebounce
│  ├─ providers/ AuthProvider · CartProvider · ToastProvider
│  ├─ content/ placeholder-data.js   (dev fallback only; flagged and removed from prod path)
│  └─ styles/ globals.css · tokens.css
├─ jsconfig.json  ({"paths": {"@/*": ["./src/*"]}})
├─ tailwind.config.js · postcss.config.js · next.config.js
└─ .env.example   NEXT_PUBLIC_API_URL, NEXT_PUBLIC_SITE_URL, NEXT_PUBLIC_BRAND_NAME, NEXT_PUBLIC_RAZORPAY_KEY_ID, REVALIDATE_SECRET, NEXT_PUBLIC_MEDIA_HOST
```

## 4. Page plans (high level)

**Nav**: logo · Home · Products · Learning · About · Contact · account icon · cart icon (count). *"Learning" has no page in the agreed essential list, so it links to the homepage `#learning` section until a page exists – no dead links.* Mobile: full-screen menu. Sticky header with hairline border on scroll.

**Home** (Server): Hero ("Build. Explore. Learn. Create." + two CTAs, product composition built from SVG/placeholder or real photo when provided) → Categories (only categories with products) → Featured products (3–6 cards, max) → Why choose us (5 items, icon + one line) → Learning experience (3-step: Build → Code → Understand, with real product references) → Final CTA → Footer (company info from settings, nav, support, legal links, social, contact).

**Products**: category filter as pill tabs (single control; no sort/filter overload), simple grid of `ProductCard`s grouped by category, paginated server-side.

**PDP**: gallery (thumbs + zoom, keyboard accessible) · title, intro, price (+compare-at if set), stock badge, qty stepper, Add to Cart, Buy Now · sticky mobile buy bar · tabbed/anchored sections: Overview/Features, What you can build, Learning outcomes, What's in the box, Specifications, Compatibility, Resources (only if present), Warranty (only if configured), FAQ accordion · Related products · JSON-LD Product + Breadcrumb. Sections with no data are omitted, not stubbed.

**Cart**: line list, stepper, remove, coupon field, server-quoted totals (subtotal, discount, shipping, GST, payable). Guests use localStorage cart; merge on login.

**Checkout** (client flow, goal-gradient progress bar): 1 Contact (prefilled from account) → 2 Address (choose saved/add new, PIN validation) → 3 Review → 4 Pay (Razorpay) → 5 Confirmation. Every price shown comes from `/checkout/quote`; UI never computes totals. Handles payment cancelled/failed with retry and preserves cart.

**Auth**: one screen: mobile → OTP (6-box input, resend countdown, expiry message, attempt errors). Dev banner shows "Mock OTP mode – check backend console" only when the API reports `otpMode: "mock"` in non-production.

**Account**: profile, saved addresses (CRUD/default), orders list, order detail with timeline + tracking + invoice download, settings, logout.

**Admin**: dedicated layout; collapsible sidebar (drawer on mobile), top bar (search, notifications, profile), breadcrumbs, filterable/paginated tables, confirm dialogs, toasts, skeletons/empty/error states; nav items rendered from the permissions returned by `/admin/auth/me` (UX only – backend enforces). Dashboard uses real API data with date presets (today, 7d, 30d, month, custom) and shows an explicit empty state when there's no data, never dummy stats.

## 5. SEO
Per-page `generateMetadata` (title ≤60, description ≤155, canonical, OG, Twitter) · exactly one `<h1>` per page · JSON-LD: `Organization` (from settings), `Product` (real price/availability/INR; **no ratings/reviews**), `BreadcrumbList`; `LocalBusiness` only if the admin supplies a real address · `sitemap.js` (home, products, legal, about, etc.) · `robots.js` (disallow `/admin`, `/account`, `/checkout`, `/cart`, `/api`) · `llms.txt` route summarising site & product pages (informational only) · SVG OG image · favicon.svg · custom 404/error pages.

## 6. Accessibility & UX rules baked into components
Visible focus rings; all controls ≥ 44 px touch target; labels bound to inputs; error text linked via `aria-describedby`; modals trap focus; toasts `role="status"`; skeletons for any fetch > 100 ms (Doherty); one primary CTA per view (Hick/Occam); related items grouped via cards/regions (common region/proximity); consistent button & card styles (similarity); accent colour reserved for single highlights (Von Restorff); checkout progress (goal-gradient); order-confirmation page designed as the peak/end moment with next steps (Peak-End); lenient input (Postel: spaces/+91 accepted in mobile, normalised); `prefers-reduced-motion` honoured.

## 7. Phase 2 deliverables & acceptance
Design tokens + UI kit, header/footer, Home, Products, PDP, Cart, Checkout UI, Login, Account pages — wired to a thin `lib/api.js` and **placeholder data behind a single adapter** so the swap to the live API is one file. Acceptance: `npm run build` clean, ESLint clean, no `.ts/.tsx`, responsive check at 375 / 768 / 1280 via the browser, Lighthouse a11y ≥ 95, keyboard-only walkthrough of PDP→cart→checkout.

## 8. Open questions
1. Is **BeaverLab** your own brand name/logo (use as default), or should the storefront use "beaverXshop"/another name? (Repo names say beaverXshop; the brief says BeaverLab.)
2. Real product photos/logo available now? *Default: SVG placeholders + replaceable logo asset.*
3. Font preference? *Default: Plus Jakarta Sans/Manrope + Inter (self-hosted via `next/font`).*

---

## 9. Decisions after approval & as-built notes (Phase 2)

**Owner decisions:** brand name is **BeaverLab X Shop** (`NEXT_PUBLIC_BRAND_NAME`); GST inclusive/exclusive, shipping charges and **Cash on Delivery** are all **admin-manageable store settings** (the storefront renders whatever the server quote returns); **login + phone OTP is mandatory to place an order** (no guest checkout, guests may browse and build a cart); SVG placeholders and a replaceable logo (`NEXT_PUBLIC_LOGO_URL`).

**Deviations from §1–§8:**
- This Next.js version (16.4) renames `middleware` to **`proxy`** and ships with **Cache Components**. Data access uses `"use cache"` + `cacheLife`/`cacheTag`; the plan's `fetch(..., {next:{revalidate}})` is superseded. Tags: `products`, `categories`, `settings`, `legal`, `product:<slug>`, `legal:<slug>`. A `proxy.js` auth redirect is **not** added yet: pages are gated by a client `AuthGate` (UX only) and the real check is the backend. It will be added with the API integration.
- Tailwind v4: tokens live in `@theme` inside `globals.css` (no `tailwind.config.js`).
- Fonts: Plus Jakarta Sans (headings) + Inter (body) via `next/font/google`.
- `/login` is a single mobile + OTP flow; sign-up is implicit and a first-time user is asked for a name.
- Products page groups by category with anchor links and has no pagination or filters (limited catalog by design); add pagination when the catalog grows.
- Cart page and checkout price via a **Server Action** (`getQuoteAction`), mirroring backend `POST /checkout/quote`.
- Checkout steps: Your details → Delivery address → Review → Payment (online/COD per quote) → Confirmation.
- Razorpay launcher exists (`src/lib/client/razorpay.js`) but is **not exercised** until the backend exists. The browser callback is never treated as proof of payment; it is sent to `/payments/verify`.
- Admin UI is not started (Phase 5).

**Sample/demo mode:** `NEXT_PUBLIC_DATA_SOURCE=placeholder` serves a sample catalog and a localStorage demo account (OTP `123456`). Every demo surface is labelled. This is a development aid, not a production path.

**Known limitation:** unknown product/legal slugs show the 404 UI with `noindex` but return HTTP 200 (Partial Prefetching streams the shell first; `dynamicParams` is unavailable under Cache Components).

**Verification done:** `npm run lint` (0 problems), `npm run build` (all routes prerender/partial-prerender), `npm test` (9 unit tests: money/GST rounding, mobile/PIN/address validation), production server smoke test (status codes, single H1, canonical, JSON-LD, noindex on private/unpublished pages, sitemap, robots, llms.txt, security headers, `/api/revalidate` rejects missing secret). **Not yet verified in a browser:** cart → checkout → confirmation interaction, mobile layout (the browser tool disconnected mid-session).

## 10. Decision: admin uses the same login (Phase 5 impact)

Admins sign in through the normal `/login` (mobile + OTP); the same account can shop. After login `GET /auth/me` includes `role` and `permissions`; the admin area appears for accounts that have a role. No separate admin login page. The existing `AuthProvider` user object will carry `role` and `permissions` once API mode is connected (the demo mode has no staff role).

## 11. Phase 5 as-built (admin UI)

Routes under `/admin`: dashboard (date presets + custom range, KPIs, revenue chart, best sellers, recent orders and activity), orders (filters, search, detail with status actions, shipment, cancel, refund, COD collection, invoice), products (list, create/edit form covering every field in the brief, archive), categories, inventory (adjust + history), customers (list/detail/block), coupons, reports (7 types + CSV), settings (company, tax/shipping/COD, invoices, legal pages, SEO, integrations status), team (add staff, change/remove role), audit log, notifications (honest "WhatsApp not connected" page). Shell: sidebar filtered by permissions, top bar with search, notification bell, profile menu, breadcrumbs, mobile drawer. Primitives: tables with skeleton/empty/error states, pagination, native-`<dialog>` modals and confirmations, toasts, tabs, SVG bar chart.

How it works: the admin area **always uses the real API** (no demo mode; it shows a notice when `NEXT_PUBLIC_DATA_SOURCE=placeholder`). Access = a role on the normal mobile + OTP account; `AdminGate` is only a convenience and the backend enforces every permission. The storefront header/footer are hidden on `/admin` by a server-rendered style rule (a `usePathname` approach broke prerendering of dynamic routes). Sensitive actions (refunds, team changes) show a "sign in again" prompt when the backend asks for a fresh login.

Not built / known gaps: image **upload** to cloud storage (images are entered as a key or link); PDF reports; WhatsApp notification templates/history (Phase 6); the admin UI has been lint/build-verified and its API contract checked against the live backend, but **not clicked through in a browser** (browser tool unavailable).

## 12. Phase 6 as-built (admin notifications)

`/admin/notifications` is now a working screen: a mode banner (simulated / not connected / live), counters, **History** (filters, last error, retry, "send queued now") and **Templates** (provider template name, language, approval status, preview text, on/off). Settings > Integrations shows the real WhatsApp and shipping state. The customer side needed no change: courier, tracking number and the order timeline already come from the shipment record.
