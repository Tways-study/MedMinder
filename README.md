<h1 align="center">MedMinder</h1>

---

<p align="center"><em>"Track. Manage. Never Run Out."</em></p>

<p align="center">
  A personal medicine inventory tracker for pharmacists and clinics — track stock levels, expiry dates, and reorder points across your entire shelf, with a weekly digest so nothing slips through.
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

- **Dashboard** — expiry alerts (expired / critical / warning / watch tiers), low-stock warnings, and running totals for on-hand vs. actual units
- **Medicine inventory** — add, edit, and delete medicines with name, generic name, SKU, form, strength, category, expiry date, reorder point, and dual-quantity tracking (on-hand and physical count)
- **Quick stock adjustment** — tap −/+ steppers or the quantity itself to type an exact value directly on the dashboard or medicine card
- **Expiry calendar** — monthly view of upcoming expiry dates
- **Weekly digest email** — configurable day, hour, and timezone; lists all expiring and low-stock medicines so you can act before the week starts
- **Per-account settings** — digest schedule, alert tier cutoffs (days until expiry), and notification email

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

This starts both the Next.js dev server and Convex's local backend via `concurrently`. Open [http://localhost:3000](http://localhost:3000).

## Environment variables

| Variable | Where set | Purpose |
|---|---|---|
| `CONVEX_DEPLOYMENT` | Auto-set by `convex dev` | Dev deployment URL |
| `NEXT_PUBLIC_CONVEX_URL` | Auto-injected by `convex deploy` in production | Convex backend URL for the client |
| `CONVEX_DEPLOY_KEY` | Vercel env vars | Allows Vercel to deploy Convex functions atomically |
| `AUTH_*` | Convex dashboard → Environment Variables | Convex Auth secrets |
| `RESEND_API_KEY` | Convex dashboard → Environment Variables | Email delivery for the weekly digest |
| `SITE_URL` | Convex dashboard → Environment Variables | Base URL used in digest email links |

## Deploying

The build command is configured in `vercel.json`:

```
npx convex deploy --prod --cmd 'npm run build'
```

This deploys Convex functions to production first, then builds and deploys the Next.js frontend — both in a single atomic step. `NEXT_PUBLIC_CONVEX_URL` is injected automatically by the Convex CLI.

## Security

A full codebase security audit was conducted on 2026-09-17. No exploitable vulnerabilities were found.

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
    page.tsx              # Dashboard
    medicines/
      page.tsx            # Paginated medicine list with search
      new/page.tsx        # Add medicine form
      [id]/page.tsx       # Medicine detail / edit
    calendar/page.tsx     # Expiry calendar
    settings/page.tsx     # Digest and alert settings
convex/
  schema.ts               # Database schema and indexes
  medicines.ts            # CRUD + paginated list query
  dashboard.ts            # Expiry alerts, low-stock, totals (streaming, no cap)
  digest.ts               # Weekly digest content query
  sendDigest.ts           # Node action: renders and sends the digest email
  crons.ts                # Hourly cron that checks digest schedules
  settings.ts             # Settings read/write
  auth.ts / auth.config.ts
  lib/
    inventory.ts          # Expiry tier logic shared by dashboard and digest
    digestEmail.ts        # HTML/text email templates
    digest.ts             # isDigestDue schedule logic
```
