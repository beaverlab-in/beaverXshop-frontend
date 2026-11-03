# Frontend Architecture, Design System & Implementation Plan

Status: **PLAN – awaiting approval. No application code written yet.**
Stack: Next.js (App Router) · React · Tailwind CSS · **JavaScript only** (`.js`/`.jsx`, `jsconfig.json` for the `@/` alias, JSDoc where helpful; `create-next-app --js`; no `.ts/.tsx` anywhere – enforced by a CI grep).
Versions: use the latest stable Next.js/React/Tailwind at scaffold time (verified with `npm view`), pinned exactly in `package.json`.

---

## 1. Design direction (current: consumer-electronics store)

The first design (cream and forest green) read as a school site, so the whole frontend was redesigned as a **modern, premium consumer-electronics store**: white and cool grey surfaces, one electric-blue interactive colour, real hardware photography, quiet product cards, and a SaaS-style admin. Nothing is copied from another brand.

### Tokens (the only source of colour, type, radius, shadow and motion: `@theme` in `src/app/globals.css`; Tailwind turns them into utilities such as `bg-subtle`, `text-muted`, `border-line`, `rounded-card`)

| Group | Tokens |
|---|---|
| Colour | `canvas/surface #FFFFFF` (page, cards) · `subtle #F4F6F8` (secondary background: bands, image wells, hovers) · `ink #111827` (text) · `muted #64748B` (secondary text) · `brand #2563EB` (all interactive elements) · `brand-dark #1D4ED8` (hover) · `brand-soft #EFF6FF` (selected / info tint) · `line #E5E7EB` (borders) · `dark #111827` (footer, showcase, admin sidebar) · `success #16A34A` · `warning #F59E0B` (small highlights only) · `danger #DC2626`. Status colours have an `-ink` twin (`success-ink`, `warning-ink`, `danger-ink`) for text on tinted backgrounds, because the bright versions miss 4.5:1. The admin shell darkens `--color-muted` locally for the same reason (its background is `subtle`). |
| Type | One family: **Inter** (`next/font`, variable `--font-inter`). Headings 600-700 with slight negative tracking; page titles `text-2xl/3xl`, section titles `text-2xl/3xl`; the homepage showcase is the only `text-5xl`. Prices are bold with tabular numerals. |
| Radius | `sm 8` · `md 12` (buttons, inputs) · `card 16` (cards) · `3xl` for large panels. |
| Shadow | `card` (1px hairline) · `lift` (hover elevation). |
| Motion | 200-500 ms, `cubic-bezier(.2,.7,.2,1)`; card hover = 2px lift + image zoom 1.04; the dropdown fades in; all of it respects `prefers-reduced-motion`. |
| Layout | Container max 80rem (1280px), gutters 16 / 24 / 32px; Tailwind default breakpoints. |

Buttons (`components/ui/Button.jsx`): **primary** (blue, white text), **secondary** (white, grey border), **ghost**, **danger**, **inverse** (white, for dark surfaces); sizes `sm/md/lg`; `loading`, `disabled` and focus-visible states are built in. Amber is never a button colour.

### Imagery
Real stock photographs of generic electronics hardware stand in for product photos (`public/images/placeholders/*.jpg`, 12 files, credited in [IMAGE-CREDITS.md](./IMAGE-CREDITS.md)). They are **placeholders, not the products being sold**: the sample data points at them, demo mode labels them "Demo image" quietly, and alt text says "Stock photo: …". Product cards use a 4:3 well on `subtle`; a photo can set `fit: "contain"` (very wide or tall shots) so nothing is cropped. A product with no photos shows a neutral `no-photo.svg`. Real photographs uploaded through the admin replace them with no code change.

Components live in `src/components/ui` (token-driven): `Button`, `Card`, `Badge`, `Field`, `OtpInput`, `QuantityStepper`, `Breadcrumbs`, `Modal`, toasts, skeletons, empty and error states; product pieces in `components/product` (`ProductCard`, `ProductImage`, `Price`, `StockBadge`, `QuickAdd`, `Gallery`).

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

**Header** (modelled on how electronics shops such as Adafruit and SparkFun, and large marketplaces, lay it out): three tiers. (1) A thin dark **utility bar**: the staff announcement when switched on (Settings > Storefront), otherwise the free-shipping offer from Settings, plus Track order, Help & FAQ, Contact and the support phone when set. (2) The **main row**: logo, one wide **search bar** with a category picker and live product suggestions (Enter goes to `/search?q=…&category=…`), account and cart with a live item count. (3) A **category bar**: a blue "All Categories" button that opens a mega menu (every category plus popular products with photo and price; opens on hover and on keyboard focus), the categories as links, and Learning Resources, About Us and Contact on the right. On phones the search bar sits under the logo row and the menu drawer holds categories, account, order tracking and help. The skip link is the first tab stop.

**Home `/`** (Server), in the usual shop order: **hero** = a slider banner (featured product plus up to two more, each on a different palette surface, previous/next arrows and dots, no autoplay) beside **two promo tiles** (a new arrival, a discounted product, else other products; never one already in the banner) → **Shop by category** (photo cards linking to the filtered catalog) → **Best Sellers** → **Deals** and **New Arrivals** side by side (Deals only lists products with a real compare-at price; New Arrivals only products published in the last 60 days; one or two products are shown as wide cards so a short row never looks empty) → "Made for hands-on learning" use cases (anchor `#learning`). The page's H1 is for screen readers. Data comes from `getHomeSections()` in `lib/data/catalog.js` and admin flags, never invented numbers: featured = first in-stock product flagged `isFeatured`; best sellers = products flagged `isBestSeller` (none flagged: the row is titled "Start Here").

**Catalog `/products`**: discovery only. Category tabs, an in-page search box, a sort menu (Featured, price low to high / high to low, name) and the full grid. All three controls live in the URL (`/products?category=robotics&sort=price-asc&q=kit`) so views are linkable and product breadcrumbs can return to them. The server HTML always contains every product; the controls only hide cards once the page is interactive. **Search**: the header icon opens a dialog and goes to `/search?q=…` (server-side word match over name, description, category, features).

**PDP**: gallery (thumbnail column on desktop, strip on phones; hover zoom toward the pointer) · category, name, tagline, price (+ original price only when discounted), stock, GST note, description, quantity, Add to Cart, Buy Now · a Delivery information card built from real settings (shipping charge, free-shipping threshold, COD) · a sticky section bar · cards for Features, What you can build, What you'll learn, What's inside the box, Specifications, Compatibility, Warranty · FAQ accordion · related products · JSON-LD Product, Breadcrumb and FAQ. Sections with no data are omitted. No ratings are shown because there is no review system.

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
3. Font preference? *Answered: one family, Inter (premium electronics direction).*

---

## 9. Decisions after approval & as-built notes (Phase 2)

**Owner decisions:** brand name is **BeaverLab X Shop** (`NEXT_PUBLIC_BRAND_NAME`); GST inclusive/exclusive, shipping charges and **Cash on Delivery** are all **admin-manageable store settings** (the storefront renders whatever the server quote returns); **login + phone OTP is mandatory to place an order** (no guest checkout, guests may browse and build a cart); SVG placeholders and a replaceable logo (`NEXT_PUBLIC_LOGO_URL`).

**Deviations from §1–§8:**
- This Next.js version (16.4) renames `middleware` to **`proxy`** and ships with **Cache Components**. Data access uses `"use cache"` + `cacheLife`/`cacheTag`; the plan's `fetch(..., {next:{revalidate}})` is superseded. Tags: `products`, `categories`, `settings`, `legal`, `product:<slug>`, `legal:<slug>`. A `proxy.js` auth redirect is **not** added yet: pages are gated by a client `AuthGate` (UX only) and the real check is the backend. It will be added with the API integration.
- Tailwind v4: tokens live in `@theme` inside `globals.css` (no `tailwind.config.js`).
- Fonts: Inter only (one family, via `next/font/google`, self-hosted at build time).
- `/login` is a single mobile + OTP flow; sign-up is implicit and a first-time user is asked for a name.
- The catalog has no pagination (limited catalog by design); add it, and move filtering and sorting server-side, when the catalog grows.
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


## Footer (current)
A **service band** above the footer (free shipping above the configured amount, cash on delivery or secure online payments, GST invoice with every order, support contact; each shown only when Settings support it), then a dark footer: brand and company identity (legal name and GSTIN when set) with social links, **Shop** (every category), **Customer service** (track order, shipping, returns and refunds, cancellation, warranty, FAQ), **Company** (About, Learning Resources, Contact), **Get in touch** (email, phone, hours, address when set). The bottom bar has the copyright with "prices in INR, inclusive of GST" (from Settings), the accepted payment methods as plain text chips (Cash on delivery when enabled; UPI, Cards and Net banking in API mode, since Razorpay checkout provides them), the main legal links and Back to top. There is deliberately no newsletter box: there is no backend to receive it.
