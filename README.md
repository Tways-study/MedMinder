<h1 align="center">MedMinder</h1>

---

<p align="center"><em>"Track. Manage. Never Run Out."</em></p>

<p align="center">
  A medicine inventory tracker for pharmacists and clinics — track stock levels, expiry dates, and reorder points across your entire shelf, with a weekly digest so nothing slips through.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15-000000?style=flat-square&logo=next.js&logoColor=white" alt="Next.js 15" />
  <img src="https://img.shields.io/badge/React-19-149ECA?style=flat-square&logo=react&logoColor=white" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript 5" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-v3-38BDF8?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind CSS v3" />
  <img src="https://img.shields.io/badge/Convex-1-EE342F?style=flat-square&logo=convex&logoColor=white" alt="Convex 1" />
  <img src="https://img.shields.io/badge/License-None-lightgrey?style=flat-square" alt="License: None" />
</p>

<p align="center">
  <img src="https://skillicons.dev/icons?i=nextjs,react,ts,tailwind" alt="Next.js, React, TypeScript, Tailwind CSS" />
</p>

## Features

- **One Inventory workspace** — every medicine in a dense, sortable table with status tabs (All, Expired, Critical, Soon, Watch, Low stock), each showing a live count. A filter box searches by name and understands status words, so `critical amox` narrows to critical medicines matching "amox"
- **Side panel** — select a row to view, edit, add, or delete a medicine without leaving the list. On desktop the table stays usable beside it; on a phone it becomes a full-width sheet
- **Linkable state** — the URL carries the view, so `/?view=expired`, `/?m=<id>`, and `/?add=1` can be bookmarked or shared, and survive a reload
- **Command palette** — press `Ctrl K` (`⌘K` on Mac) anywhere to search medicines, jump to a page, add a medicine, or show a status view
- **Quick stock adjustment** — tap the −/+ steppers or the number itself to type an exact count, right in the table row or the side panel
- **Dual-quantity tracking** — on-hand (the book count) and actual (the last physical count), with the variance between them surfaced as surplus, deficit, or balanced
- **Expiry tiers** — expired, critical, soon, and watch, with cutoffs you set per account. Status is always an icon, a word, and a colour, never colour alone
- **Expiry calendar** — monthly view of upcoming expiry dates
- **Weekly digest email** — configurable day, hour, timezone, and recipients; lists every expiring and low-stock medicine so you can act before the week starts
- **Multi-tenant** — open sign-up, and every account's inventory is fully isolated from every other
- **Responsive shell** — a sidebar that collapses to an icon rail on desktop, and a bottom tab bar on a phone. Light theme, built to WCAG AA contrast

## Data model

Every table is scoped to the signed-in account (`ownerId`) and read through a Convex index — tenants are fully isolated and queries stay O(your rows), not O(all rows).

```
medicines  →  by_owner_name (ownerId, name)
settings   →  by_owner      (ownerId)
```

Stock lives directly on the medicine (no per-lot tracking). Two quantities are tracked independently:
- **On-hand** — the actively maintained book count; used for reorder and alert decisions
- **Actual** — the last physical count; compared to on-hand to surface drift

## Getting started

```bash
npm install
npm run dev
```

This starts both the Next.js dev server and Convex's local backend via `npm-run-all`. Open [http://localhost:3000](http://localhost:3000), create an account on the sign-in page, and add a medicine.

| Script | What it does |
|---|---|
| `npm run dev` | Next.js (Turbopack) and the Convex backend together |
| `npm run dev:frontend` / `dev:backend` | Either one on its own |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run test` | Vitest, once (`npm run test:watch` to watch) |

The tests cover the Convex functions and the pure logic in `convex/lib/` (expiry tiers, digest scheduling, search ranking, filters, dates). CI runs typecheck, lint, and tests on every pull request.

## Environment variables

| Variable | Where set | Purpose |
|---|---|---|
| `CONVEX_DEPLOYMENT` | Auto-set by `convex dev` | Dev deployment |
| `NEXT_PUBLIC_CONVEX_URL` | Auto-set by `convex dev`; injected by `convex deploy` in production | Convex backend URL for the client |
| `CONVEX_DEPLOY_KEY` | Vercel env vars | Allows Vercel to deploy Convex functions atomically |
| `AUTH_*` | Convex dashboard → Environment Variables | Convex Auth secrets |
| `GMAIL_USER` | Convex dashboard → Environment Variables | Gmail address the weekly digest is sent from |
| `GMAIL_APP_PASSWORD` | Convex dashboard → Environment Variables | Gmail App Password for SMTP (digests cannot send without it) |
| `SITE_URL` | Convex dashboard → Environment Variables | Base URL used in digest email links |

## Deploying

The build command is configured in `vercel.json`:

```
if [ "$VERCEL_ENV" = "production" ]; then npx convex deploy --cmd 'npm run build'; else npm run build; fi
```

Production builds (`main`) deploy Convex functions first, then build and deploy the Next.js frontend, in a single atomic step. Preview builds skip the Convex deploy and reuse the existing `NEXT_PUBLIC_CONVEX_URL` — this avoids pushing a preview branch's schema/functions to the live production deployment, which a production-scoped `CONVEX_DEPLOY_KEY` cannot do anyway. `NEXT_PUBLIC_CONVEX_URL` is injected automatically by the Convex CLI on production builds.

## Security

A full codebase security audit was conducted on 2026-09-17. No exploitable vulnerabilities were found. It predates the UI overhaul below, which changed only the frontend (no auth, schema, or Convex function changes).

Key controls verified:

- **Tenant isolation** — every query and mutation is scoped to the authenticated `ownerId`; no cross-tenant data access is possible
- **Ownership checks** — every document fetch verifies `medicine.ownerId === ownerId` before returning or mutating data
- **No injection surface** — Convex's typed ORM has no raw query interpolation; no shell calls or file system operations exist
- **No hardcoded secrets** — all credentials are read from environment variables
- **Auth delegated to library** — password hashing and session management are handled entirely by `@convex-dev/auth`
- **No XSS vectors** — no `dangerouslySetInnerHTML` or `eval` anywhere in the React codebase

## Project structure

```
app/
  (app)/
    page.tsx              # Inventory workspace: status tabs, table, side panel (state in the URL)
    medicines/            # Redirects only: /medicines, /medicines/[id], /medicines/new → Inventory
    calendar/page.tsx     # Expiry calendar
    settings/page.tsx     # Digest and alert settings
    layout.tsx            # Auth gate around the app shell
  signin/page.tsx         # Branded sign-in / sign-up
convex/
  schema.ts               # Database schema and indexes
  medicines.ts            # CRUD, paginated list, ranked name search, stock updates
  dashboard.ts            # Expiry alerts, low-stock, totals (streaming, no cap)
  digest.ts               # Weekly digest content query
  sendDigest.ts           # Node action: renders and sends the digest email (Gmail SMTP)
  crons.ts                # Hourly cron that checks digest schedules
  settings.ts             # Settings read/write
  users.ts                # Viewer query
  http.ts                 # HTTP endpoints
  auth.ts / auth.config.ts
  seed.ts / devReset.ts   # Development fixtures and cleanup (internal only)
  lib/
    inventory.ts          # Expiry tier logic shared by the UI and the digest
    search.ts             # Medicine name search/ranking and status-word parsing
    medicineFilters.ts    # Status filtering and sorting
    dates.ts              # Date/timezone helpers
    digestEmail.ts        # HTML/text email templates
    digest.ts             # isDigestDue schedule logic
    guards.ts             # Auth guard helpers
components/
  app-shell.tsx           # Frame: top bar, search trigger, page area
  app-nav.tsx             # Collapsible sidebar and mobile tab bar
  command-palette.tsx     # Ctrl/⌘ K palette
  shell-state.tsx         # Sidebar and palette state
  inventory-table.tsx     # Desktop table and stacked mobile rows
  medicine-drawer.tsx     # Side panel: view, edit, add, delete
  medicine-form.tsx       # The medicine form
  quantity-stepper.tsx    # −/+ and type-to-set stock control
  status-chip.tsx         # Expiry and low-stock chip (icon + word + colour)
  stamp-badge.tsx         # Rubber-stamp mark used on the sign-in sample shelf
  page-shell.tsx          # Page, PageHeader, EmptyState, skeletons
  motion.tsx              # GSAP motion primitives
  ui/                     # shadcn/ui primitives, plus the side-panel sheet
lib/
  nav.ts                  # Destinations and Inventory status views
  gsap.ts / motion.ts     # GSAP setup and shared durations/easing
plans/                    # Design plans from the design-loop passes
```

See `PRODUCT.md` and `DESIGN.md` for the product brief and design system (palette, type scale, components, layout, accessibility rules).

## Version history

MedMinder has no tagged releases yet (`package.json` is at `0.1.0`), so this history is grouped into dated milestones taken from the git log, newest first.

### Unreleased — UI overhaul (in review)

A staged redesign aimed at pharmacy and clinic staff working at a desktop. Each phase is its own pull request; none of it touches the backend.

- **Phase 3 · Inventory workspace** ([#8](https://github.com/Tways-study/MedMinder/pull/8)) — the Today and Medicines pages become one Inventory page with status tabs and live counts, a dense table with inline steppers, and a side panel for view, edit, add, and delete. State lives in the URL; the old `/medicines` routes redirect. Removes the dashboard stat strip, grouped list, and Rx-label card (a stats strip is planned to return)
- **Phase 2 · App shell** ([#7](https://github.com/Tways-study/MedMinder/pull/7)) — sidebar that collapses to an icon rail, a top bar with search and *Add medicine*, and a `Ctrl K` / `⌘K` command palette
- **Phase 1 · Design system** — native scrolling (smooth scroll removed), one `StatusChip` replacing the tier and low-stock badges, a 12px minimum text size, instant stepper counts, and `DESIGN.md` brought back in line with the code

### 2026-10-17 — Sign-in polish

- Sign-in page centred, with motion where state changes used to snap ([#6](https://github.com/Tways-study/MedMinder/pull/6))
- An error now shows when sign-in resolves without signing in ([#5](https://github.com/Tways-study/MedMinder/pull/5))

### 2026-10-13 to 2026-10-16 — Apothecary UI

- Pharmacy-label personality across the app: record cards, perforated dividers, rubber-stamp status marks, and GSAP motion ([#3](https://github.com/Tways-study/MedMinder/pull/3))
- Dark mode added, then removed again the same day — the app ships light only
- Garamond display type, calmer labels, and flat list chips ([#4](https://github.com/Tways-study/MedMinder/pull/4))
- New favicon from the Lucide Pill icon, and a branded split-layout sign-in

### 2026-09-10 to 2026-09-21 — Search, settings, and a restyle

- Server-side medicine search that matches partial text as you type, ranks results, and understands status words (`critical`, `low stock`)
- Weekly digest to multiple recipients, with a timezone combobox and an email chip input on the Settings page
- Duplicate-medicine warning when adding a name that already exists
- App pages gated on Convex auth, with loading and signed-out states
- Apple-style restyle on the apothecary palette ([#1](https://github.com/Tways-study/MedMinder/pull/1), [#2](https://github.com/Tways-study/MedMinder/pull/2))
- Deploy fixes: Convex deploys on production builds only, previews skip it
- Security audit completed on 2026-09-17, with no exploitable findings

### 2026-07-19 to 2026-07-23 — Multi-tenant and simpler stock

- Open sign-up with an isolated inventory per account
- Digest emails switched from Resend to Gmail SMTP
- Deliveries and stock Counts removed: stock is tracked directly on the medicine with on-hand and actual quantities
- SKU field, per-medicine variance, and a paginated medicines list (no more silent 2000-item cap)
- CI added: typecheck, lint, and tests on pull requests and pushes to `main`

### 2026-07-16 to 2026-07-17 — Foundation

- Scaffolded from the Convex Next.js auth template, with a tested schema and core inventory and digest logic
- Password sign-in, with every route protected by default
- Purple "apothecary" design system, expiry dashboard, weekly digest, and settings
- Medicines, batches, deliveries, and count sessions (later simplified, see above)
- Branded sign-in screen, wordmark, logo mark, and favicon
