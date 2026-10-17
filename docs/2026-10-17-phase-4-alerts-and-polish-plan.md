# Phase 4 plan — Alerts, stats strip, and page polish

Date: 2026-10-17
Status: Planned (not started)
Part of: the staged UI overhaul (Phase 1 design system, Phase 2 shell, Phase 3 Inventory workspace, **Phase 4 this**, Phase 5 accessibility and responsive pass)

## Prerequisite

Branch from `main` **after PR #9 is merged**. Do not stack this phase on another branch: #8 was stacked on the Phase 2 branch and merged there after #7 had already reached `main`, which stranded Phase 3 and needed #9 to recover it.

## Context

Phase 3 merged the Today and Medicines pages into one Inventory workspace and dropped Today's alert groups and "Shelf report" stats. The status tabs cover filtering, but two things are missing:

- a view that answers "what needs action this week?" in urgency order, and
- a few headline numbers (total stock, needing attention, running low, count drift).

Calendar, Settings and sign-in also still carry the old pharmacy-label styling (perforated dividers, staggered list reveals) that Phases 1–3 retired from everyday surfaces.

**Goal:** add an Alerts view and a stats strip, and bring Calendar, Settings and sign-in in line with the design system, without touching the backend schema.

## Decisions carried over (do not reopen)

- Light theme only. Dark mode was removed on purpose in `a1d8039`.
- Violet means "act here". Status is always icon + word + colour, never colour alone.
- Chips are rectangular, not pills. Minimum text size is 12px.
- `StampBadge` stays rare: the sign-in sample shelf only.
- No animation on high-frequency actions (sorting, filtering, day selection, keyboard-triggered).
- Native scrolling. Elevation is a hairline border plus `shadow-xs`.

## Decisions to confirm before building

1. **Alerts as its own route (recommended) or a tab on Inventory.** A route `/alerts` gets a sidebar item with a live count badge and a grouped layout that tabs can't give. The cost is a fourth nav item (the phone tab bar goes from 3 to 4).
2. **Add a "Count drift" tab.** Drift (actual ≠ on-hand) is an auditing signal staff care about, and the stats strip would link to it. Recommended: add `drift` to `INVENTORY_VIEWS` as a real tab with a count.
3. **Retire `convex/dashboard.ts`.** Nothing in the client calls `api.dashboard.summary` since Today was removed (the digest uses `convex/lib/inventory.ts`, not this file). Recommended: delete it and compute the stats client-side from `medicines.list`, which Inventory already subscribes to, so there is no second subscription and no chance of the strip disagreeing with the tabs.

## Scope

### A. Alerts view (`app/(app)/alerts/page.tsx`)

The same table, pre-filtered to anything needing action and **grouped by urgency**:

1. Expired
2. Critical
3. Soon
4. Watch
5. Running low (stock, not expiry; a medicine can appear here and in an expiry group)

Each group has a heading row (status icon + word + count) inside one table, so columns stay aligned. Empty groups are hidden. When nothing needs action, show the existing `EmptyState` with a "Everything is in date and stocked" message, not a blank table.

- Reuse `InventoryTable` rows and `MedicineDrawer`. Add an optional `groups` prop to the table that renders heading rows; the stacked phone layout gets the same headings.
- Extract the URL-state logic from `app/(app)/page.tsx` (`?m=`, `?edit=`, `?add=`, the `update()` and `hrefFor()` helpers) into `lib/use-workspace-params.ts` so Inventory and Alerts share it instead of duplicating it. Keep behaviour identical.
- Row order inside a group: soonest expiry first (running low: lowest stock first), matching the digest's "most urgent first".

### B. Stats strip

A row of four figures above the Alerts table (and optionally above Inventory's tabs; see risks):

| Figure | Definition |
|---|---|
| Units on hand | sum of `onHandQuantity` |
| Needs attention | expired + critical + soon (watch is informational) |
| Running low | `onHandQuantity <= reorderPoint` |
| Count drift | medicines where `actualQuantity !== onHandQuantity` |

- Flat tiles on a shared hairline border (no cards inside cards). Figures in `.font-data`, labels in `.label-caps`.
- "Needs attention", "Running low" and "Count drift" are links to `/alerts`, `/?view=low` and `/?view=drift`. Units on hand is not interactive.
- Figures update instantly with the data and do **not** animate (the old `RollingNumber` was removed in Phase 3 and should not return).
- Put the pure calculation in `convex/lib/inventoryStats.ts` with tests, following the existing `convex/lib/*.test.ts` pattern (`groupByUrgency`, `inventoryStats`). Both the UI and any future digest reuse can import it.

### C. Calendar polish (`app/(app)/calendar/page.tsx`)

- Remove the perforated divider in the selected-day panel (`:334`); use a plain `border-t`.
- Remove the `Stagger` reveal on the selected-day list (`:340`). Day selection is high-frequency; the list should swap instantly.
- Selected-day rows link to `/?m=<id>` (already done in Phase 3); confirm they open the panel.
- Make the month grid keyboard-navigable (arrow keys move between days; Enter selects). Day buttons already carry labels and `aria-pressed`.
- Keep the month-change slide and the tier-tinted day cells.

### D. Settings polish (`app/(app)/settings/page.tsx`)

- Replace the two perforated dividers (`:145`, `:234`) with a plain `border-t`.
- Confirm control heights follow DESIGN.md (44px on phones, 36px from `sm`) and that the save and unsaved-change feedback is clear. Read the page's current save flow first; do not assume it.
- No data or behaviour changes: digest day, hour, timezone, recipients and tier cutoffs stay as they are.

### E. Sign-in audit (`app/signin/page.tsx`)

Sign-in was redesigned twice in October and moved to the 12px floor in Phase 1. This item is **audit-only**: check the sample shelf, the error state, and the flow swap on a phone and a desktop, and fix only what the audit finds. Do not redesign it.

### F. Cleanup

- After C and D, check whether `.perforation` in `app/globals.css` is still used anywhere. If not, delete it. Keep `.card-divider` (used by `EmptyState` and the sign-in sample card).
- Remove `[data-stamp-card]` handling from `useStampIn` if nothing sets that attribute any more (the Rx label that did is gone).
- Delete `convex/dashboard.ts` per decision 3, and drop it from the README's project structure and `CLAUDE.md`'s backend table.

### G. Navigation and palette

- `lib/nav.ts`: add `{ href: "/alerts", label: "Alerts", icon: Bell }` after Inventory. The sidebar and tab bar read this list, so both pick it up.
- Sidebar and tab bar show a count badge on Alerts (needs-attention count). Badges are numbers with the word in the accessible name ("Alerts, 3 need attention"), not colour alone.
- Command palette: "Go to Alerts" arrives free from `NAV_ITEMS`; add "Show Count drift" to the Show group if decision 2 is accepted.

## Files

**Create**
- `app/(app)/alerts/page.tsx`
- `components/stats-strip.tsx`
- `convex/lib/inventoryStats.ts` and `convex/lib/inventoryStats.test.ts`
- `lib/use-workspace-params.ts`

**Modify**
- `components/inventory-table.tsx` (optional `groups`, heading rows)
- `app/(app)/page.tsx` (use the shared params hook; add the `drift` tab)
- `lib/nav.ts` (Alerts item, `drift` view)
- `components/app-nav.tsx` (Alerts badge)
- `components/command-palette.tsx` (Show Count drift)
- `app/(app)/calendar/page.tsx`, `app/(app)/settings/page.tsx`
- `app/globals.css` (remove `.perforation` if unused)
- `components/motion.tsx` (drop `[data-stamp-card]` if unused)
- `DESIGN.md`, `README.md` (structure and a new Unreleased entry in the version history), `CLAUDE.md`

**Delete**
- `convex/dashboard.ts` (decision 3)

## Task order

Each task ends green on `tsc`, `npm run lint` and `npm run test` before the next starts.

1. **Stats logic with tests.** `convex/lib/inventoryStats.ts` (`groupByUrgency`, `inventoryStats`) and its tests: tier boundaries, a medicine in both an expiry group and running low, no-expiry medicines, empty shelf.
2. **Shared URL-state hook.** Extract `lib/use-workspace-params.ts` from the Inventory page. No behaviour change; verify Inventory still works.
3. **Table groups.** Add the `groups` prop to `InventoryTable` (desktop heading rows and phone headings).
4. **Alerts page and stats strip.** Build `/alerts` and `components/stats-strip.tsx`.
5. **Nav, badge and palette.** Alerts item, count badge, "Show Count drift", and the `drift` tab if accepted.
6. **Calendar and Settings polish.** Items C and D.
7. **Sign-in audit.** Item E; fix only real findings.
8. **Cleanup and docs.** Item F, then `DESIGN.md`, `README.md`, `CLAUDE.md`.

## Verification

- `npx tsc --noEmit`, `npm run lint`, `npm run test`, `npm run build` (no warnings).
- Browser, on a **production build** (`npm run build` then `npx next start`; dev mode lagged badly in Phase 3 and misled the motion check), with the local Convex backend running (`npm run dev:backend`) and the seeded medicines:
  - `/alerts` groups match the Inventory tab counts exactly, and the stats strip figures match the data.
  - Opening a row on `/alerts` opens the same side panel; the URL carries `?m=`.
  - Editing a stock count in the panel moves the medicine between groups and updates the strip without a reload.
  - Empty states: no alerts, and an empty shelf.
  - Calendar: day selection is instant, arrow keys move between days, rows open the panel.
  - Settings: values load and save as before.
  - Layout at 1440, 768 and 390px, no horizontal scroll, tab bar fits four items.
  - `prefers-reduced-motion`: no movement, content still correct.
- Keyboard-only pass over Alerts: tab order, focus ring on every control, Escape closes the panel.
- Touch device: the Phase 3 test that is still unchecked (panel sheet, steppers, palette input without iOS zoom), plus the new tab bar.

## Risks and notes

- **Duplicate counts.** A medicine can be both expiring and low on stock, so summing the group counts overcounts. The strip's "Needs attention" counts expiry tiers only; "Running low" is separate. Say so in the UI copy if the numbers could be added up by mistake.
- **Whole shelf in memory.** Inventory and Alerts both load `medicines.list` in full, a deliberate choice since Phase 3 (the old 2000-item cap was removed on purpose). If shelves reach several thousand medicines, plan virtualisation or paging in Phase 5 rather than reintroducing a cap.
- **Stats on Inventory too?** The strip is specified for Alerts. Adding it above Inventory's tabs would push the table down on short screens; decide after seeing it on a 1440×900 viewport.
- **Local data.** Verification uses the throwaway account and seeded medicines in the local Convex deployment. They are local only and can be deleted.
- **Environment.** In the last session the C: drive was full and stalled npm and the dev server. Check free space before starting, or point `TMP`, `TEMP` and `npm_config_cache` at D:.

## Out of scope

- Backend schema, auth, or digest changes.
- A dark theme.
- Per-lot tracking (the data model is one record per medicine).
- The full accessibility and responsive pass (Phase 5): table keyboard navigation, drawer focus management audit, and large-list performance.
- Bulk actions and CSV import or export.
