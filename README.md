# MedMinder

A personal medicine inventory tracker for pharmacists and clinics. Track stock levels, expiry dates, and reorder points across your entire shelf — with a weekly email digest so nothing slips through.

Built with [Convex](https://convex.dev/), [Next.js](https://nextjs.org/), [Convex Auth](https://labs.convex.dev/auth), [Tailwind CSS](https://tailwindcss.com/), and [shadcn/ui](https://ui.shadcn.com/).

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

Vercel build command (set in Vercel project settings):

```
npx convex deploy --cmd 'npm run build'
```

This deploys Convex functions to production first, then builds and deploys the Next.js frontend — both in a single atomic step. `NEXT_PUBLIC_CONVEX_URL` is injected automatically by the Convex CLI.

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
