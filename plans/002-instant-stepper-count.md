# 002 — Quantity stepper updates instantly

- **Status**: DONE
- **Commit**: 1690b07
- **Severity**: HIGH
- **Category**: motion
- **Estimated scope**: 1 file

## Problem

Staff tap + or − many times in a row while counting stock. Each tap triggers a `RollingNumber` tween: a 10px slide, fade from 0.2 alpha, and a count tween over `DUR.base` (0.28s). The next tap interrupts the previous one, so the number visibly lags and flickers instead of confirming the tap.

```tsx
/* components/medicine-card.tsx:351 — current */
<RollingNumber value={value} format={formatQuantity} />
```

```tsx
/* components/motion.tsx:261-266 — the cause */
gsap.fromTo(
  inner,
  { y: dir * 10, autoAlpha: 0.2 },
  { y: 0, autoAlpha: 1, duration: DUR.base, ease: EASE.out },
);
```

## Target

The stepper shows the new value in the same frame as the tap. `RollingNumber` itself is unchanged, because the dashboard metrics still use it once on load (`dashboard-metrics.tsx:58`).

```tsx
/* target — components/medicine-card.tsx:351 */
{formatQuantity(value)}
```

## Repo conventions to follow

- Quantities render in `.font-data` (already on the parent button, `medicine-card.tsx:349`).

## Steps

1. `components/medicine-card.tsx:351`: replace `<RollingNumber value={value} format={formatQuantity} />` with `{formatQuantity(value)}`.
2. Remove `RollingNumber,` from the `@/components/motion` import (line ~17) if it is no longer used in this file.

## Boundaries

- Do NOT edit `components/motion.tsx` or `dashboard-metrics.tsx`.
- Do NOT change the optimistic update, `nudge`, or the typing mode.
- If a step doesn't match the code you find, STOP and report.

## Verification

- **Mechanical**: `npm run lint`, `npm run build`.
- **Feel check**: on a medicine card, tap + ten times fast.
  - The number advances on every tap with no slide, fade or lag.
  - Tap-to-type still opens the input and commits.
  - The dashboard metrics still count up on first load.
- **Done when**: `RollingNumber` is used only in `dashboard-metrics.tsx`.
