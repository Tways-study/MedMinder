# Design plans

| # | Title | Severity | Status |
|---|---|---|---|
| 001 | Remove Lenis smooth scroll | HIGH | DONE |
| 002 | Instant stepper count | HIGH | DONE |
| 004 | 12px text floor and sans filter chips | MEDIUM | DONE |
| 003 | Consolidate into StatusChip | MEDIUM | DONE |

## Execution order

001 → 002 → 004 → 003. 004 and 003 both edit `app/(app)/medicines/page.tsx`; do 004 first (a one-line chip change), then 003 (which renames the local `StatusChip` in that file).

## Not doing

- **Dark mode**: removed on purpose in `a1d8039`; confirmed out of scope for this overhaul.
- **Flip/stagger on the medicines table**: the page is rebuilt in Phase 3, so it is deferred there rather than patched.
- **Removing StampBadge**: kept as a rare mark on the detail page and sign-in sample, per DESIGN.md.
- **DESIGN.md drift** (Framer Motion, dark mode, `.dark` values): synced at close in DESIGN.md and PRODUCT.md, not as a plan.
