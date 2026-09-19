# Design

Generated from the existing codebase (`app/globals.css`, `tailwind.config.ts`, `components/ui/*`). This is the system already in use — extend it rather than replacing it.

## Theme

Light only, by design. No dark mode: single-purpose tool read under pharmacy shelf lighting.

## Color

HSL custom properties in `app/globals.css`, consumed through Tailwind's `hsl(var(--token))` pattern. Every pairing below is measured, not eyeballed — ratios are the actual verified contrast.

| Token | Hex | Role |
|---|---|---|
| `--paper` | `#F7F3F9` | Canvas / background |
| `--surface` | `#FDFBFE` | Grouped surfaces (cards, inputs) |
| `--lilac` | `#EDE6F3` | Secondary fills, selected rows |
| `--hairline` | `#E0D5EA` | Decorative borders only, no contrast floor |
| `--input-line` | `#9A7EB8` | Input borders — 3.37:1 on surface |
| `--orchid` (`--primary`) | `#6B4A9E` | The one accent — "act here". 6.18:1 on paper |
| `--amethyst` | `#7B5EA7` | Secondary accent — 4.78:1 on paper |
| `--ink` (`--foreground`) | `#2A2434` | Body text — 13.67:1 on paper |
| `--muted-ink` | `#6F6579` | Secondary text — 5.02:1 on paper |

Plus a 5-tier expiry ramp (`--tier-{expired,critical,warning,watch,ok}-{fg,bg}`), each pairing individually contrast-checked — color is never the only signal for tier, always paired with icon + word.

Palette is anchored on gentian violet, a real pharmacy antiseptic dye — the purple comes from the subject matter (a dispensary), not decoration.

## Typography

- **Sans / body**: system face — `-apple-system, BlinkMacSystemFont, "SF Pro Text", var(--font-inter), system-ui, sans-serif`. Inter loaded as a fallback only, via `next/font/google`, for devices without SF Pro.
- **Display**: same stack, SF Pro Display cut — `.font-display` utility.
- **Data**: system face with `font-variant-numeric: tabular-nums` (`.font-data`) — for expiry dates and quantities compared down a column.
- Type scale is named, not numbered (`caption` → `large-title`), each size with its own tracking (tighter as size grows) and leading (looser for body, tighter for titles) — never one tracking value applied uniformly.

| Name | Size | Tracking |
|---|---|---|
| caption | 12px | -0.01em |
| footnote | 13px | -0.006em |
| body-sm | 14px | -0.016em |
| body | 17px | -0.022em |
| subheading | 21px | -0.012em |
| title | 28px | -0.014em |
| large-title | 34px | -0.024em |

## Shape & elevation

Two shapes only: `--radius: 0.5rem` (8px) for surfaces, full pill (`rounded-full`) for anything pressed (buttons). No third radius.

No elevation/shadow on resting surfaces — hierarchy comes from grouped fills (`--surface` vs `--paper`), not drop shadows. The one exception is floating chrome (menus, popovers, dialogs) via `shadow-float`, which needs separation to read over content.

## Components (shadcn/ui, customized)

- **Button** (`components/ui/button.tsx`): pill-shaped, `active:scale-[0.97]` on pointer-down (not release) for a physical press feel, `motion-reduce` respected. Sizes start at 44px (`h-11`) — smallest reliable thumb target. Variants: default (orchid fill), outline/ghost/link (all read as `text-link`, i.e. orchid text), destructive, secondary.
- **Card** (`components/ui/card.tsx`): `rounded-lg bg-card`, no shadow, no border by default.
- **Input** (`components/ui/input.tsx`): `h-11 rounded-lg border-input bg-card`, focus ring not border-color change.
- **`.material`** (`app/globals.css`): translucent surface (72% opacity `--surface` + `backdrop-filter: saturate(180%) blur(20px)`) for floating chrome that content scrolls under — falls back to solid on `prefers-reduced-transparency`.
- **`LogoMark`** (`components/logo-mark.tsx`): the brand mark — ribbon/cross/pill icon on the orchid squircle tile, full-color raster (`images/medminder-icon.png`), used at `h-6 w-6` in the header and `h-12 w-12` on sign-in.

## Layout

- Content container centers with 1rem padding, caps at 1400px (`2xl` screen).
- Authenticated shell: `sm:pl-56` fixed sidebar nav, sticky translucent (`.material`) header.
- Sign-in: centered single-column card, `max-w-sm`.

## Motion

`framer-motion` available (`components/motion.tsx` re-exports primitives). Existing usage is restrained: `motion-safe:animate-in motion-safe:fade-in-0` entrance on sign-in, button press-scale. No orchestrated page-load sequences yet — an opportunity, not a gap to leave unfilled by default.

## What NOT to do here

No generic SaaS look: no identical rounded-card grids, no uniform soft-gray card shadow, no gradient washes as decoration. The system already rejects these (grouped surfaces instead of shadows, one accent, pill controls) — new work should extend that discipline, not reach for SaaS-template defaults.
