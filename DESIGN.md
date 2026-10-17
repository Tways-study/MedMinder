---
name: MedMinder
description: A calm, precise, modern clinical tool for pharmacy shelf stock and expiry, in neutral zinc with one violet accent.
colors:
  primary: "#6D4AA8"
  on-primary: "#FFFFFF"
  background: "#FAFAFA"
  card: "#FFFFFF"
  foreground: "#18181B"
  muted: "#F4F4F5"
  muted-foreground: "#696971"
  accent-tint: "#F3EFFA"
  accent-foreground: "#4C2F80"
  border: "#E4E4E7"
  input-border: "#D4D4D8"
  destructive: "#DC2626"
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
    fontSize: "0.75rem"
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
  status-chip-ok:
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

A well-kept ledger on a clean counter: neutral zinc surfaces, hairline borders, numbers that line up, and one violet that means "act here". Personality comes from restraint and correctness, not decoration. The theme is light only (dark mode was removed deliberately in `a1d8039`), and every text pairing is measured to WCAG AA; the ratios live in the comment block at the top of `app/globals.css`.

The accent is gentian violet, the pharmacy antiseptic dye. It appears only on primary actions, focus rings, the active mobile tab, and links, so it stays rare enough to carry meaning. Everything else is zinc.

**Key Characteristics:**
- Neutral zinc canvas, a single violet accent, a five-step traffic-light ramp for expiry only.
- Border plus a barely-there shadow for elevation.
- Geist for text, Geist Mono with tabular figures for anything compared down a column.
- Status is always icon + word + colour.
- Touch-first sizing (44px) that compacts to 36px from `sm` up.
- Restrained motion, 150 to 200ms, honouring reduced-motion.

## Colors

Tokens are HSL channels in `app/globals.css` (`:root`), exposed through Tailwind as `hsl(var(--token))` so alpha utilities such as `bg-primary/90` work. Components use semantic Tailwind names only. Frontmatter hex values are normative.

### Primary
- **Gentian Violet** (#6D4AA8): `primary` and `ring`. Primary buttons, focus rings, links, the active bottom-tab indicator and label. White text on it is 6.57:1.
- **Violet Wash** (#F3EFFA) with **Deep Violet** text (#4C2F80): `accent`. The selected sidebar item only. 9.15:1.

### Neutral
- **Canvas** (#FAFAFA / #09090B): `background`, the page. Never tinted.
- **Card** (#FFFFFF / #111113): `card` and `popover`, every raised surface and input fill.
- **Muted** (#F4F4F5 / #18181B): `muted` and `secondary`, table header, hover fill, icon wells.
- **Ink** (#18181B / #FAFAFA): `foreground`. 16.97:1 and 19.06:1 on canvas.
- **Muted Ink** (#696971): secondary text. Deliberately darker than zinc-500 (#71717A) because that measured 4.34:1 on the muted fill; this one is 4.95:1 there.
- **Hairline** (#E4E4E7 / #27272A): `border`, the default for every edge (applied globally via `* { border-color }`).
- **Field Edge** (#D4D4D8 / #3F3F46): `input` border.
- **Alarm Red** (#DC2626 / #F87171): `destructive` fills and error text.

### Expiry Tier Ramp
Each tier has foreground, background, and border tokens (`tier-{name}`, `-bg`, `-border`). Used only by `StatusChip` and tier-coloured data.

| Tier | Word | Icon | Fg / bg |
|---|---|---|---|
| expired | Expired | XCircle | #B91C1C / #FEF2F2 |
| critical | Critical | AlertTriangle | #C2410C / #FFF7ED |
| warning | Soon | Clock | #B45309 / #FFFBEB |
| watch | Watch | Eye | #0369A1 / #F0F9FF |
| ok | In date | CheckCircle2 | #047857 / #ECFDF5 |

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
- **Record / group name** (Garamond 500, 1.125-1.5rem): drawer title, medicine names in mobile rows, empty-state titles, wordmark.
- **Card title** (600, 1rem): `CardTitle` on settings cards.
- **Body** (400, 0.875rem): default UI text, table cells, descriptions in muted ink.
- **Input text** (1rem on mobile, 0.875rem from `sm`): 16px on mobile prevents iOS focus zoom.
- **Label** (500, 0.75rem): badges and small captions.
- **Field label** (`.label-caps`, Geist 600, 0.75rem, uppercase, 0.06em): the label inside a record card ("On hand", "Expires"). Never above a title and never for units.
- **Tab label** (500, 0.75rem, `text-xs`): bottom tab bar only.
- **Data** (`.font-data` = Geist Mono + tabular-nums): quantities, dates, KPIs, anything compared down a column.

### Named Rules
**The Mono Is For Data Rule.** Numbers that get compared (counts, dates, KPIs) use `.font-data`. Prose, labels, expiry phrases and units never do.

**The Units Keep Their Case Rule.** `mg`, `mL`, `mcg` are never uppercased or capitalised; a pharmacy reads the case. Capitalise only the dosage form word, with `formatForm()`.

**The One Glyph Rule.** Icons are Lucide only; the brand mark is the pill tile.

**The Stamp Is Rare Rule.** `StampBadge` (rotated, double-bordered) appears only in the sign-in sample shelf. Everything else, including the table, the drawer and the palette, uses the flat rectangular `StatusChip`, so a screen of rows stays calm.

## Layout

Shell: from `md` up, a fixed sidebar (card fill, right border) holds logo, three nav items (Inventory, Calendar, Settings), a collapse control and the account menu at the bottom. It is `w-60` expanded and a 56px icon rail collapsed; the choice persists in `localStorage` and the content column follows it. Above the content sits a sticky 56px top bar with a search field that opens the command palette (Cmd/Ctrl+K) and the primary "Add medicine" action. Below `md`, the top bar carries brand, a search button and the account, and a bottom tab bar (`min-h-14` items, safe-area padding, blurred `background/95`) with a 2px violet indicator on the active tab, bottom-anchored for one-handed use at the shelf.

Command palette: Cmd/Ctrl+K from anywhere. Searches medicines by name (server-ranked, `medicines.searchByName`), and lists "Add medicine", the status views ("Show Expired", "Show Low stock"…) and the destinations from `lib/nav.ts`. Choosing a medicine opens its panel on Inventory. Keyboard-initiated, so it opens with no entrance animation.

Content: `Page` is a centred column, `max-w-6xl`, `gap-6`, padding `px-4 sm:px-6 lg:px-8`, `py-6 lg:py-8`. `PageHeader` puts title and description left and actions right, wrapping on narrow screens.

Inventory (`/`): one workspace replaces the old Today and Medicines pages. A row of status tabs (All, Expired, Critical, Soon, Watch, Low stock), each with a live count, sits above a filter box and the list. At `md` and up the list is a dense table (sticky muted header, inline +/- stepper on the On hand column, sortable Name / On hand / Expiry headers); below `md` the same records are stacked rows with a sort select. Same data, two densities, no horizontal scroll on a phone.

Detail panel: selecting a row opens a 448px panel on the right (`MedicineDrawer`) holding view, edit, add and delete. On desktop it is a non-modal companion below the top bar: the table stays clickable, clicking another row swaps the content, Esc or the close button dismisses it, and from `xl` the content column makes room for it. Below `md` it is a full-width modal sheet. The URL carries the state, so every view is linkable and survives a reload: `?view=expired` (tab), `?m=<id>` (open medicine), `?m=<id>&edit=1` (editing), `?add=1` (new medicine). `/medicines`, `/medicines/[id]` and `/medicines/new` redirect to these.

Spacing runs on Tailwind's 4px scale; card padding is 24px, list rows 16px, nav gaps 4px.

## Elevation & Depth

Hybrid, border-first. Resting surfaces (cards, tables, skeletons) are `border` plus `shadow-xs` (`0 1px 2px 0 rgb(0 0 0 / 0.04)`). Floating layers (dialog, dropdown, popover, select, tooltip, toast) use `shadow-lg` plus a border so they separate from content.

### Named Rules
**The Border Carries It Rule.** Depth at rest comes from the 1px border; the shadow is a whisper.

## Shapes

One radius token, `--radius` 10px, derived into three steps: `lg` 10px (cards, dialogs, popovers, menus, tables, empty states), `md` 8px (buttons, inputs, nav items, tooltips), `sm` 6px (small inner elements). Pills (`rounded-full`) are for status badges and the 2px tab indicator only; the empty-state icon well is the one circular container. Borders are 1px hairlines; dashed borders mark empty states.

## Components

### Buttons
- **Shape:** 8px radius. Heights `h-11` (44px) on mobile, `h-9` (36px) from `sm`; `sm` size 36/32px; `icon` 44/36px. Text-sm medium, 16px icons.
- **Primary:** violet fill, white text, hover `primary/90`.
- **Outline:** card fill, input border, hover muted. **Secondary:** muted fill. **Ghost:** hover muted. **Link:** violet text, underline on hover. **Destructive:** red fill.
- **Interaction:** 150ms ease-out on colour; `active:scale-[0.98]` press only (removed under reduced motion); focus is a 2px violet ring with a 2px background offset; disabled is 50% opacity.

### Inputs / Fields
- 44px mobile, 36px from `sm`, 8px radius, `input` border, card fill, muted placeholder. Focus is a 2px violet ring, not a border change. Checkbox, select, toggle, combobox, and chip input share these tokens.

### Cards / Containers
- 10px radius, 1px border, card fill, `shadow-xs`, 24px header and content padding. Card-sized links add `.focus-card` for an inset 2px ring.

### Tier Badge
- Pill, 1px tier border, tier background and foreground, `text-xs` medium, 14px lucide icon (1.75 stroke), then the word or expiry phrase. Legible in greyscale by design.

### Navigation
- Sidebar items 36px tall, 8px radius, muted text; active is Violet Wash with a highlight that slides between items. Mobile tabs: 20px icon over a 12px label, active in violet with a sliding 2px top indicator. Both set `aria-current="page"`.

### Feedback and Motion
- Toasts via sonner (`top-center`, rich colours, close button), styled as popover surfaces.
- GSAP (`lib/gsap.ts`, primitives in `components/motion.tsx`), with every effect gated by `prefers-reduced-motion`. Native scrolling: there is no smooth-scroll layer. Entries fade and rise a few px; hover feedback is background or colour only; the quantity stepper updates instantly. The detail panel slides in over 150ms (none under reduced motion) and the table never animates on filter or sort. The stamp thunk is reserved for the sign-in sample.
- Loading uses skeletons shaped like the content; empty states always carry the next action.

### Icons
- lucide-react only, 1.75 stroke, `aria-hidden` when paired with text, sized 14 to 20px.

## Do's and Don'ts

### Do:
- **Do** use semantic tokens (`bg-card`, `text-muted-foreground`, `border-input`, `text-tier-ok`) so a future theme is a token change.
- **Do** pair every tier with its icon and word, via `StatusChip`.
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
- **Don't** add shadows to resting surfaces beyond `shadow-xs`.
- **Don't** spend violet on anything but action, focus, selection, and links.
