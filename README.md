# BeaverLab X Shop: Frontend

Customer-facing storefront for BeaverLab X Shop (educational electronics, robotics and IoT).
Next.js (App Router, **Cache Components**) · React · Tailwind CSS v4 · **JavaScript only** (no TypeScript).

The matching API lives in the separate `beaverxshop-backend` repository.

## Quick start

```bash
npm install
cp .env.example .env.local      # then adjust
npm run dev                     # http://localhost:3000
```

Other scripts: `npm run build` · `npm start` · `npm run lint` · `npm test`.

## Data source: sample mode vs API mode

`NEXT_PUBLIC_DATA_SOURCE` controls where data comes from.

| Mode | What you get |
|---|---|
| `placeholder` (default) | Built-in **sample** catalog (`src/content/placeholder-data.js`) and a **demo** account/checkout stored in your browser's localStorage. Demo login code is `123456`. **No SMS/WhatsApp is sent, no payment is taken, nothing ships.** Every demo surface is labelled in the UI. |
| `api` | Talks to `beaverxshop-backend` (`NEXT_PUBLIC_API_URL`). Real sessions (HttpOnly cookies), server-side pricing, Razorpay, invoices. |

All switching happens in **three files only**: `src/lib/data/*` (catalog, settings, quote: server side) and `src/lib/client/accountApi.js` (account, addresses, orders: browser side). Pages never check the mode themselves.

## Where things live

```
src/app/                routes (home, products, cart, checkout, login, account/*, legal/[slug], about, contact, faq, sitemap, robots, llms.txt, api/revalidate)
src/app/actions/        Server Actions: price a cart (quote), contact form
src/components/ui/      design-system primitives (Button, Field, Layout, States, Icons, OtpInput, QuantityStepper)
src/components/{site,product,cart,checkout,account}/   feature components
src/lib/                money (integer paise), validation, India states, SEO helpers, env, data adapters
src/providers/          Toast, Auth, Cart (client state)
src/content/            sample data and general FAQ copy
src/app/globals.css     design tokens (@theme): colours, type, radius, shadow, motion
docs/ARCHITECTURE.md    architecture, design system and plan
```

## Key rules baked in

- **Money is integer paise.** The browser never calculates prices: the cart sends only `{slug, qty}` and a coupon code; a Server Action returns the priced quote (subtotal, discount, shipping, GST, total). The backend re-validates at order creation.
- **GST treatment (inclusive/exclusive), shipping charges and COD are store settings**, managed from the admin panel; the storefront only renders what the quote says.
- **Login with a mobile OTP is required to place an order.** Browsing and building a cart do not need an account.
- **An order keeps its own address snapshot**; editing a saved address never changes an existing order.
- **Next.js 16 Cache Components:** data functions use `"use cache"` with `cacheLife`/`cacheTag`; request-time reads sit inside `<Suspense>`. The backend calls `POST /api/revalidate` (header `x-revalidate-secret`) with `{ "tags": ["products", "product:<slug>"] }` after catalog or settings changes.
- No secrets in the frontend. Only `NEXT_PUBLIC_*` values are exposed; the Razorpay *key id* is public, the secret never is.

## Branding

Set `NEXT_PUBLIC_BRAND_NAME` and optionally `NEXT_PUBLIC_LOGO_URL` to replace the placeholder mark. Product imagery is SVG placeholders until real photographs are uploaded to Cloudflare R2 (`NEXT_PUBLIC_MEDIA_HOST`).

## Known limitations (current phase)

- Unknown product/legal URLs render the 404 UI with `noindex` but the HTTP status is 200: with Partial Prefetching the app shell streams before the slug is checked. (`dynamicParams = false` is unavailable with Cache Components and would also hide products created after the build.)
- `og-default.svg` is the requested SVG sharing image, but some social platforms only render raster Open Graph images; a PNG variant may be needed later.
- Admin panel UI is Phase 5. Real OTP, payment verification, invoices and shipping need the backend (Phases 3 to 6).
- `npm audit` currently reports moderate advisories in dev-only ESLint tooling; none are in runtime dependencies. Re-check before release.
