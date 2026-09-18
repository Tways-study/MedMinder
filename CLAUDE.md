# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start Next.js (Turbopack) + Convex dev backend concurrently
npm run dev:frontend # Next.js only
npm run dev:backend  # Convex backend only
npm run build        # Next.js production build
npm run lint         # ESLint
npm run test         # Run all Vitest tests (once)
npm run test:watch   # Vitest in watch mode
```

Run a single test file:
```bash
npx vitest run convex/medicines.test.ts
```

## Architecture

**MedMinder** is a multi-tenant medicine inventory tracker. Stack: Next.js 15 (App Router) + Convex (backend-as-a-service) + Convex Auth + Tailwind CSS + shadcn/ui.

### Frontend (`app/`)

Route groups:
- `app/(app)/` — authenticated routes behind middleware; layout wraps all inventory pages
- `app/signin/` — unauthenticated entry point

`middleware.ts` uses `convexAuthNextjsMiddleware` to protect every non-sign-in route by default — adding a new route is protected automatically without explicit listing.

### Backend (`convex/`)

Convex functions are organized by domain. File-based routing: `convex/medicines.ts` → `api.medicines.*`.

| File | Responsibility |
|---|---|
| `schema.ts` | Table definitions (`medicines`, `settings`) + `medicineForm` union type |
| `medicines.ts` | CRUD + paginated list query + `searchByName` |
| `dashboard.ts` | Expiry alerts, low-stock warnings, running totals (streaming, no doc cap) |
| `settings.ts` | Per-account digest and alert tier settings |
| `digest.ts` | Digest content query (calls inventory logic) |
| `sendDigest.ts` | Node.js action (`"use node"`) — renders and sends email via Nodemailer/Resend |
| `crons.ts` | Hourly cron that calls `isDigestDue` and triggers `sendDigest` |
| `http.ts` | HTTP endpoints |
| `auth.ts` / `auth.config.ts` | Convex Auth setup |
| `lib/inventory.ts` | Pure functions: `expiryTier`, `formatExpiryDistance`, `isValidQuantity` — shared by dashboard and digest |
| `lib/digest.ts` | Pure functions: `isDigestDue`, `nextDigestRun` — timezone-aware schedule logic |
| `lib/digestEmail.ts` | HTML + plain-text email templates |
| `lib/guards.ts` | Auth guard helpers |

### Data model

All tables are scoped to `ownerId` — tenants are fully isolated. Queries use per-owner indexes so they stay O(your rows).

```
medicines → by_owner_name (ownerId, name)
settings  → by_owner (ownerId)
```

`medicines` tracks two quantities independently: `onHandQuantity` (book count, used for reorder/alert logic) and `actualQuantity` (last physical count, surfaced to show drift). No per-lot tracking.

### Shared components (`components/`)

- `ui/` — shadcn/ui primitives (Button, Card, Dialog, etc.)
- Feature components: `medicine-card.tsx`, `medicine-form.tsx`, `dashboard-metrics.tsx`, `tier-badge.tsx`, `timezone-combobox.tsx`, `email-chip-input.tsx`
- `ConvexClientProvider.tsx` — wraps the app with `ConvexAuthNextjsServerProvider`
- `motion.tsx` — re-exports Framer Motion primitives

### Testing

Tests live in `convex/` and test Convex functions using `convex-test` + `vitest` running in `edge-runtime`. See `convex/medicines.test.ts` and `convex/lib/*.test.ts` for patterns.

The `makeUser` helper in test files inserts a real user row and returns an identity bound to that `Id<"users">` — required because `@convex-dev/auth` resolves user IDs from the DB, not from arbitrary strings.

## Convex conventions

- All public queries/mutations include argument validators (`v.*`). Internal functions use `internalQuery` / `internalMutation` / `internalAction`.
- Never pass `userId` as a function argument for auth; always derive it server-side via `ctx.auth.getUserIdentity()`.
- `sendDigest.ts` requires `"use node"` because it uses Nodemailer. Do not mix queries or mutations into that file.
- The `.cursor/rules/convex_rules.mdc` file contains detailed Convex coding guidelines — follow them for any Convex work.

## Deploying

Vercel build command (defined in `vercel.json`, deploys Convex first then Next.js):
```
npx convex deploy --cmd 'npm run build'
```

Environment variables for Convex functions (set in Convex dashboard, not Vercel): `RESEND_API_KEY`, `SITE_URL`, `AUTH_*`.
