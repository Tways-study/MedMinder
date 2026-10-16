---
name: MedMinder
description: A calm, precise, modern clinical tool for pharmacy shelf stock and expiry, in neutral zinc with one violet accent.
colors:
  primary: "#6D4AA8"
  primary-dark: "#A78BDA"
  on-primary: "#FFFFFF"
  on-primary-dark: "#18181B"
  background: "#FAFAFA"
  background-dark: "#09090B"
  card: "#FFFFFF"
  card-dark: "#111113"
  foreground: "#18181B"
  foreground-dark: "#FAFAFA"
  muted: "#F4F4F5"
  muted-dark: "#18181B"
  muted-foreground: "#696971"
  muted-foreground-dark: "#A1A1AA"
  accent-tint: "#F3EFFA"
  accent-tint-dark: "#1E1A2B"
  accent-foreground: "#4C2F80"
  accent-foreground-dark: "#D6C8F0"
  border: "#E4E4E7"
  border-dark: "#27272A"
  input-border: "#D4D4D8"
  input-border-dark: "#3F3F46"
  destructive: "#DC2626"
  destructive-dark: "#F87171"
  tier-expired: "#B91C1C"
  tier-expired-bg: "#FEF2F2"
  tier-critical: "#C2410C"
  tier-critical-bg: "#FFF7ED"
  tier-warning: "#B45309"
  tier-warning-bg: "#FFFBEB"
  tier-watch: "#0369A1"
  tier-watch-bg: "#F0F9FF"
  tier-ok: "#047857"
  tier-ok-bg: "#ECFDF5"
typography:
  page-title:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.33
    letterSpacing: "-0.025em"
  card-title:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.43
  label:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.33
  tab-label:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 500
    lineHeight: 1rem
  data:
    fontFamily: "Geist Mono, ui-monospace, monospace"
    fontSize: "0.875rem"
    fontWeight: 400
    fontFeature: "tnum"
rounded:
  sm: "6px"
  md: "8px"
  lg: "10px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.md}"
    height: "44px"
    padding: "0 16px"
  button-primary-desktop:
    height: "36px"
  button-outline:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    height: "44px"
  input:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    height: "44px"
    padding: "8px 12px"
  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    padding: "24px"
  tier-badge-ok:
    backgroundColor: "{colors.tier-ok-bg}"
    textColor: "{colors.tier-ok}"
    rounded: "{rounded.pill}"
    padding: "2px 8px"
  nav-item-active:
    backgroundColor: "{colors.accent-tint}"
    textColor: "{colors.accent-foreground}"
    rounded: "{rounded.md}"
    height: "36px"
---

# Design System: MedMinder

## Overview

**Creative North Star: "The Dispensary Ledger"**

A well-kept ledger on a clean counter: neutral zinc surfaces, hairline borders, numbers that line up, and one violet that means "act here". Personality comes from restraint and correctness, not decoration. Light, dark, and system themes are all first-class (next-themes, class strategy), and every text pairing in both is measured to WCAG AA; the ratios live in the comment block at the top of `app/globals.css`.

The accent is gentian violet, the pharmacy antiseptic dye. It appears only on primary actions, focus rings, the active mobile tab, and links, so it stays rare enough to carry meaning. Everything else is zinc.

**Key Characteristics:**
- Neutral zinc canvas, a single violet accent, a five-step traffic-light ramp for expiry only.
- Border plus a barely-there shadow for elevation; no shadow at rest in dark.
- Geist for text, Geist Mono with tabular figures for anything compared down a column.
- Status is always icon + word + colour.
- Touch-first sizing (44px) that compacts to 36px from `sm` up.
- Restrained motion, 150 to 200ms, honouring reduced-motion.

## Colors

Tokens are HSL channels in `app/globals.css` (`:root` and `.dark`), exposed through Tailwind as `hsl(var(--token))` so alpha utilities such as `bg-primary/90` work. Components use semantic Tailwind names only. Frontmatter hex values are normative; `-dark` entries are the `.dark` values of the same token.

### Primary
- **Gentian Violet** (#6D4AA8 light, #A78BDA dark): `primary` and `ring`. Primary buttons, focus rings, links, the active bottom-tab indicator and label. White text on it is 6.57:1 in light; #18181B text on the dark value is 6.20:1.
- **Violet Wash** (#F3EFFA light, #1E1A2B dark) with **Deep Violet** text (#4C2F80 / #D6C8F0): `accent`. The selected sidebar item only. 9.15:1 light, 10.81:1 dark.

### Neutral
- **Canvas** (#FAFAFA / #09090B): `background`, the page. Never tinted.
- **Card** (#FFFFFF / #111113): `card` and `popover`, every raised surface and input fill.
- **Muted** (#F4F4F5 / #18181B): `muted` and `secondary`, table header, hover fill, icon wells.
- **Ink** (#18181B / #FAFAFA): `foreground`. 16.97:1 and 19.06:1 on canvas.
- **Muted Ink** (#696971 / #A1A1AA): secondary text. Light is deliberately darker than zinc-500 (#71717A) because that measured 4.34:1 on the muted fill; this one is 4.95:1 there.
- **Hairline** (#E4E4E7 / #27272A): `border`, the default for every edge (applied globally via `* { border-color }`).
- **Field Edge** (#D4D4D8 / #3F3F46): `input` border.
- **Alarm Red** (#DC2626 / #F87171): `destructive` fills and error text.

### Expiry Tier Ramp
Each tier has foreground, background, and border tokens (`tier-{name}`, `-bg`, `-border`), re-tuned for dark (foregrounds lighten, backgrounds become the hue at about 12% over the card). Used only by `TierBadge` and tier-coloured data.

| Tier | Word | Icon | Light fg / bg | Dark fg |
|---|---|---|---|---|
| expired | Expired | XCircle | #B91C1C / #FEF2F2 | #FCA5A5 |
| critical | Critical | AlertTriangle | #C2410C / #FFF7ED | #FDBA74 |
| warning | Soon | Clock | #B45309 / #FFFBEB | #FCD34D |
| watch | Watch | Eye | #0369A1 / #F0F9FF | #7DD3FC |
| ok | In date | CheckCircle2 | #047857 / #ECFDF5 | #6EE7B7 |

### Named Rules
**The One Voice Rule.** Violet means "act here". It is never used for status, decoration, or section colour.

**The Ramp Is Not A Palette Rule.** Red, orange, amber, sky, and emerald exist only to express expiry. Do not borrow them for categories, charts, or accents.

**The Measured Pair Rule.** A new foreground/background pairing is added to the contrast comment in `globals.css` with its ratio, in both themes, before it ships. Text needs 4.5:1.

## Typography

**Display:** EB Garamond (`--font-serif`, `font-serif`), for the page title, record names, and list/group titles. Normal tracking, weight 500; italic only for one emphasised phrase in the same face.
**Sans:** Geist (`--font-geist-sans`, then system-ui, sans-serif), via `next/font/google`.
**Mono:** Geist Mono (`--font-geist-mono`, then ui-monospace), for data.

**Character:** a dispensary label. A Garamond display voice for names and titles over a clean Geist UI, with mono kept for figures. Everything that is not a name or a number is Geist, regular or medium.

### Hierarchy
- **Page title** (Garamond 500, 2.25rem, 3rem from `sm`): one `h1` per page, in `PageHeader`. No kicker above it.
- **Record / group name** (Garamond 500, 1.125-1.5rem): `RxLabel` title, medicine names, `GroupedList` titles, empty-state titles, wordmark.
- **Card title** (600, 1rem): `CardTitle` on settings cards.
- **Body** (400, 0.875rem): default UI text, table cells, descriptions in muted ink.
- **Input text** (1rem on mobile, 0.875rem from `sm`): 16px on mobile prevents iOS focus zoom.
- **Label** (500, 0.75rem): badges and small captions.
- **Field label** (`.label-caps`, Geist 600, 0.75rem, uppercase, 0.06em): the label inside a record card ("On hand", "Expires"). Never above a title and never for units.
- **Tab label** (500, 0.6875rem, `text-2xs`): bottom tab bar only.
- **Data** (`.font-data` = Geist Mono + tabular-nums): quantities, dates, KPIs, anything compared down a column.

### Named Rules
**The Mono Is For Data Rule.** Numbers that get compared (counts, dates, KPIs) use `.font-data`. Prose, labels, expiry phrases and units never do.

**The Units Keep Their Case Rule.** `mg`, `mL`, `mcg` are never uppercased or capitalised; a pharmacy reads the case. Capitalise only the dosage form word, with `formatForm()`.

**The One Glyph Rule.** The only non-icon glyph is the brand `℞` in the `RxLabel` header. Everywhere else, Lucide.

**The Stamp Is Rare Rule.** `StampBadge` (rotated, double-bordered) is the signature for the medicine detail page and the sign-in sample. List and table rows use the flat rectangular `TierBadge` / `LowStockBadge`, so a screen of rows stays calm.

## Layout

Shell: from `md` up, a fixed sidebar (`w-60`, card fill, right border) holds logo, four nav items (Today, Calendar, Medicines, Settings), and the account menu at the bottom. Below `md`, a bottom tab bar (`min-h-14` items, safe-area padding, blurred `background/95`) with a 2px violet indicator on the active tab, bottom-anchored for one-handed use at the shelf.

Content: `Page` is a centred column, `max-w-6xl`, `gap-6`, padding `px-4 sm:px-6 lg:px-8`, `py-6 lg:py-8`. `PageHeader` puts title and description left and actions right, wrapping on narrow screens.

Medicines: at `md` and up a data table (sticky muted header, scrolls inside 70vh); below `md` the same records render as stacked rows. Same data, two densities, no horizontal scroll on a phone.

Spacing runs on Tailwind's 4px scale; card padding is 24px, list rows 16px, nav gaps 4px.

## Elevation & Depth

Hybrid, border-first. Resting surfaces (cards, tables, skeletons) are `border` plus `shadow-xs` (`0 1px 2px 0 rgb(0 0 0 / 0.04)`), and `dark:shadow-none` removes even that in dark, where the border alone separates. Floating layers (dialog, dropdown, popover, select, tooltip, toast) use `shadow-lg` plus a border so they separate from content in both themes.

### Named Rules
**The Border Carries It Rule.** Depth at rest comes from the 1px border; the shadow is a whisper and disappears in dark.

## Shapes

One radius token, `--radius` 10px, derived into three steps: `lg` 10px (cards, dialogs, popovers, menus, tables, empty states), `md` 8px (buttons, inputs, nav items, tooltips), `sm` 6px (small inner elements). Pills (`rounded-full`) are for status badges and the 2px tab indicator only; the empty-state icon well is the one circular container. Borders are 1px hairlines; dashed borders mark empty states.

## Components

### Buttons
- **Shape:** 8px radius. Heights `h-11` (44px) on mobile, `h-9` (36px) from `sm`; `sm` size 36/32px; `icon` 44/36px. Text-sm medium, 16px icons.
- **Primary:** violet fill, white text (dark ink in dark), hover `primary/90`.
- **Outline:** card fill, input border, hover muted. **Secondary:** muted fill. **Ghost:** hover muted. **Link:** violet text, underline on hover. **Destructive:** red fill.
- **Interaction:** 150ms ease-out on colour; `active:scale-[0.98]` press only (removed under reduced motion); focus is a 2px violet ring with a 2px background offset; disabled is 50% opacity.

### Inputs / Fields
- 44px mobile, 36px from `sm`, 8px radius, `input` border, card fill, muted placeholder. Focus is a 2px violet ring, not a border change. Checkbox, select, toggle, combobox, and chip input share these tokens.

### Cards / Containers
- 10px radius, 1px border, card fill, `shadow-xs` (none in dark), 24px header and content padding. Card-sized links add `.focus-card` for an inset 2px ring.

### Tier Badge
- Pill, 1px tier border, tier background and foreground, `text-xs` medium, 14px lucide icon (1.75 stroke), then the word or expiry phrase. Legible in greyscale by design.

### Navigation
- Sidebar items 36px tall, 8px radius, muted text; active is Violet Wash with a shared-layout highlight that slides between items (critically damped spring, 0.35s). Mobile tabs: 20px icon over an 11px label, active in violet with a sliding 2px top indicator. Both set `aria-current="page"`.

### Feedback and Motion
- Toasts via sonner (`top-center`, rich colours, close button), styled as popover surfaces.
- Framer Motion under `MotionConfig reducedMotion="user"`. Entries fade and rise 4px in 180ms; hover and press feedback is background or colour only; expand/collapse and rolling counts use the 0.35s critically damped spring. `HoverScale` is a retired passthrough.
- Loading uses skeletons shaped like the content; empty states always carry the next action.

### Icons
- lucide-react only, 1.75 stroke, `aria-hidden` when paired with text, sized 14 to 20px.

## Do's and Don'ts

### Do:
- **Do** use semantic tokens (`bg-card`, `text-muted-foreground`, `border-input`, `text-tier-ok`) so light and dark come free.
- **Do** pair every tier with its icon and word, via `TierBadge`.
- **Do** set quantities, dates, and KPIs in `.font-data`.
- **Do** keep touch targets at 44px on mobile and compact to 36px from `sm`.
- **Do** keep transitions between 150 and 200ms and respect reduced motion.
- **Do** add a measured contrast ratio to the `globals.css` comment for any new pairing, in both themes.

### Don't:
- **Don't** tint the canvas; `background` stays neutral zinc.
- **Don't** make pill buttons or pill chips; tier and stock chips are rectangular (`rounded-sm`).
- **Don't** put an eyebrow or kicker above a heading, or invent record meta ("No. 0001", version footers, taglines).
- **Don't** put raw hex, `rgb()`, or palette classes (`bg-violet-600`, `text-red-500`) in components; use tokens.
- **Don't** use decorative gradients or gradient washes.
- **Don't** convey status by colour alone.
- **Don't** scale elements on hover; hover changes fill or colour only.
- **Don't** use emoji or glyph icons; lucide only.
- **Don't** add shadows to resting surfaces beyond `shadow-xs`, and none in dark.
- **Don't** spend violet on anything but action, focus, selection, and links.
