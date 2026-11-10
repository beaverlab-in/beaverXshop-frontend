# Privacy features in the storefront and admin

The full programme, audit, data inventory, checklist and runbooks live in the backend repo: `beaverXshop-backend/docs/privacy/`. This page maps the frontend parts.

## What was added

| Area | Where |
| --- | --- |
| Standalone collection notice (login, checkout, address form, contact form) | `src/components/account/privacy/CollectionNotice.jsx` (fetched from `/privacy/notices/collection`; demo copy in `src/content/privacy-demo.js`) |
| Optional, unticked marketing opt-in at sign-up | `LoginFlow.jsx` (API mode only; consent stored with the notice version shown) |
| Cookie and tracking preferences | `src/providers/PrivacyProvider.jsx`, `src/components/site/CookieConsent.jsx`; footer link **Cookie settings** |
| Policy pages | `/privacy-policy` (published in admin, always read fresh), `/terms-and-conditions`, `/cookie-policy` (table generated from the backend's cookie registry); old `/legal/...` addresses redirect |
| Customer privacy area | `/account/privacy`, `/requests`, `/consents`, `/grievances` (`src/components/account/privacy`) |
| Admin Privacy & Compliance | `/admin/privacy` and 11 sub-pages (`src/components/admin/privacy`) |
| Contact form | now sends from the browser so a signed-in person's messages are linked to their account |

## Rules the code follows

- Nothing optional is ticked by default; withdrawing is one tap and needs no login code.
- Everything that reveals or changes personal data (access summary, correction, erasure, nomination) needs a fresh login code; the UI sends the person to `/login?reauth=1&next=...`.
- The cookie banner appears only when staff declare an analytics or marketing tool installed (Privacy settings). Any such tool must be wrapped in `<ConsentGate category="analytics">`. Accept and Reject are the same size and style.
- Demo mode has no backend, so the privacy area, consents and requests say so instead of pretending. The cookie preference centre and the notices work in demo mode.
- No legal text is invented: the policy and terms are staff-authored and say "not published yet" until then.

See also [ARCHITECTURE.md](./ARCHITECTURE.md) and [TESTING.md](./TESTING.md).
