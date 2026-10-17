# 003 — Consolidate TierBadge and LowStockBadge into StatusChip

- **Status**: DONE
- **Commit**: 1690b07
- **Severity**: MEDIUM
- **Category**: tokens
- **Estimated scope**: 1 new file, ~8 files edited, 1 deleted

## Problem

The most-seen element in the app exists twice with identical markup, and its style data is exported through three different helpers that callers consume ad hoc.

```tsx
/* components/tier-badge.tsx:87-96 and :133-141 — same classes twice */
"inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 text-xs font-medium"
```

Callers of the helpers: `app/(app)/calendar/page.tsx:10,254,262,359`, `components/medicine-card.tsx:7,170,171,201`, `app/(app)/medicines/page.tsx:9,290,524,573,576,684,685`, `components/dashboard-metrics.tsx:5,102,111,122`, `components/stamp-badge.tsx:4`, `app/(app)/page.tsx:13,406`, `app/signin/page.tsx:4`.

`medicines/page.tsx:673` already defines a local function named `StatusChip` (the filter chip) — it must be renamed first.

## Target

One file, `components/status-chip.tsx`, replacing `components/tier-badge.tsx` (same tier data, same icons, same colours, same words):

- `statusStyle(kind)`: `kind` is `ExpiryTier | "low"`. Returns `{ label, icon, fg, bg, border, className }`. `"low"` reuses the critical-tier colours with the `PackageMinus` icon and label `"Low stock"`.
- `<StatusChip kind={...} variant="chip" | "dot" className children />`:
  - `chip` (default): `inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 text-xs font-medium` + the style's `className`, a 14px icon (`size-3.5`, `strokeWidth={1.75}`, `aria-hidden`), then `children ?? label`.
  - `dot`: `inline-flex items-center gap-1.5 text-xs font-medium` + the style's `fg`, a `size-1.5 rounded-full bg-current` dot with `aria-hidden`, then `children ?? label`. Still icon-free, but the word always renders, so status is never colour alone.
- `tierLabel(tier)` kept as a named export.

## Repo conventions to follow

- Class names are written out literally so Tailwind's JIT sees them (see the comment at `tier-badge.tsx:18`).
- `ExpiryTier` is imported from `@/convex/lib/inventory`.
- DESIGN.md: status chips are rectangular (`rounded-sm`), never pills.

## Steps

1. Rename the local `StatusChip` in `app/(app)/medicines/page.tsx` (`:673` and every usage) to `StatusFilterChip`.
2. Create `components/status-chip.tsx` per Target, copying the `TIERS` table from `tier-badge.tsx:20-72` verbatim and adding the `low` entry from `LOW_STOCK_STYLE` (`:120-127`).
3. Replace usages:
   - `<TierBadge tier={x} …>` → `<StatusChip kind={x} …>`
   - `<LowStockBadge className=…>` → `<StatusChip kind="low" className=…>`
   - `tierClasses(t)` → `statusStyle(t)` (returns a superset; use `.fg`/`.bg`/`.border`)
   - `tierStyle(t)` → `statusStyle(t)`
   - `LOW_STOCK_STYLE` → `statusStyle("low")`
   - `tierLabel` import path → `@/components/status-chip`
4. `components/stamp-badge.tsx`: import `statusStyle` instead of `LOW_STOCK_STYLE, tierStyle`; `const style = statusStyle(tier)`. The stamp keeps its look and rare use (DESIGN.md "The Stamp Is Rare Rule").
5. Delete `components/tier-badge.tsx`.

## Boundaries

- Do NOT change tier colours, words, icons or tokens.
- Do NOT touch `stamp-badge.tsx` visuals or `useStampIn`.
- Do NOT make the chip a pill.
- Do NOT add dependencies.
- If a call site doesn't match, STOP and report.

## Verification

- **Mechanical**: `npm run lint`, `npm run test`, `npm run build`. `grep -rn "tier-badge\|TierBadge\|LowStockBadge\|tierClasses\|tierStyle\|LOW_STOCK_STYLE" app components` returns nothing.
- **Feel check**: open Today, Medicines, a medicine detail, Calendar and Sign-in.
  - Every chip looks identical to before (icon, word, colours, shape).
  - Medicines filter chips still toggle and match the list.
  - Calendar day cells keep their tier tint.
- **Done when**: one chip component, one style helper, no references to the old names.
