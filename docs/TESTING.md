# Testing

Everything below runs on a normal developer machine: no Docker, no real MongoDB or Redis, no browser download (Playwright drives the Chrome that is already installed).

| Layer | Command | What it covers |
|---|---|---|
| Frontend unit | `npm test` (this repo) | money and GST rounding, mobile/PIN/address validation |
| Backend (165 tests) | `npm test` (backend repo) | auth and OTP limits, CSRF, RBAC on every admin route, catalog, addresses, cart, quote, orders, stock races, Razorpay verify and webhooks, refunds, GST engine, invoices and PDF, admin operations, reports and CSV, notifications, shipping adapters |
| Browser, demo mode (24) | `npm run e2e:demo` | storefront without a backend: layout at 375/768/1280 px, mobile menu, skip link, cart, coupon, a full demo checkout, 404, contact form, **axe accessibility with colour contrast on 10 pages** |
| Browser, full stack (22) | `npm run e2e:api` | storefront + **admin panel** against the real backend: shopper blocked from admin, admin login by OTP, creating a category and product in the forms, guest-cart merge on login, COD checkout, order lifecycle with GST/invoice/tracking, shopper sees tracking and downloads the invoice, notifications, CSV download, staff roles, inventory, phone layout, **axe on 11 admin pages** |

## Running the full-stack browser suite

1. In the **backend** repo: `npm run e2e:harness` and leave it running. It starts the real API on `:4000` with throwaway in-memory databases, seeded with a super admin (`9000000001`), the sample catalog and test store settings, plus a **test-only** side channel on `:4001` (`/otp/<mobile>` returns the last login code; `/reset` wipes and re-seeds).
2. In the **frontend** repo: `npm run e2e:api`. It builds the API-mode storefront into `.next-api`, starts it on `:3400`, runs the tests, and stops it. The suite resets the harness first, so it is repeatable.
3. Demo mode needs no harness: `npm run e2e:demo` (builds into `.next-demo`, serves on `:3300`).

Screenshots from the runs are written to `e2e/.output/screenshots/` (git-ignored). Use `npx playwright test --headed` to watch.

The login-code side channel is the only reason the harness is not the real server. The production server never returns or logs a login code, and refuses `OTP_PROVIDER=mock`.

## Known environment quirks

- Backend `npm test` runs each test file in its own process and retries a file (up to 3 times) **only** when Vitest reports the intermittent native Node crash `exit code 3221226505` seen on this Windows machine. A genuine failing assertion is never retried.
- The first backend test run downloads a MongoDB binary into `node_modules/.cache`.
- `npm audit` reports moderate advisories only in dev-time lint tooling (`eslint` and its plugins). Runtime dependencies have **0** known vulnerabilities in both repos.

## What is not covered by automated tests

- **Real Razorpay** (keys, hosted checkout, real webhooks): the signature code and flows are tested with the real HMAC logic and a faked network. Run once in Razorpay test mode before launch.
- **Real WhatsApp, Ekart, Cloudflare R2, a real Redis and a MongoDB Atlas deployment.**
- Cross-browser (only Chrome), screen-reader use, and load testing.
- Visual design review by a person.
