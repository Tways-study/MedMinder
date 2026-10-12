# Product

## Register

product

## Users

Pharmacists and clinic staff managing a physical medicine shelf — checking stock, expiry, and reorder points, often standing at the shelf itself (one-handed, on a phone, under pharmacy lighting) rather than at a desk. The job to be done on any given screen is narrow and task-focused: is this in date, is this low, what needs action this week.

## Product Purpose

MedMinder tracks medicine inventory and expiry for a pharmacy or clinic: stock levels, expiry dates, and reorder points, with a weekly digest so nothing slips through. It exists to replace manual shelf-checking with a system that surfaces what needs attention before it becomes a problem (an expired batch, an empty shelf).

## Brand Personality

Calm, precise, trustworthy: a modern clinical tool. The voice of a well-run dispensary, not a startup dashboard; confidence through restraint and correctness, not enthusiasm. Gentian violet (the palette's anchor) is a real pharmacy antiseptic dye, chosen because the purple comes from the subject matter, not from decoration. It is kept as the one accent, and it means "act here".

## Anti-references

Not a generic SaaS dashboard: no identical rounded-card grids, no decorative gradient washes, no tinted or themed canvases, no interchangeable-with-any-other-tool look. Elevation is a hairline border plus a barely-there shadow (none in dark), controls are rectangular rather than pill-shaped, and violet is the single accent. New work extends that discipline rather than drifting toward SaaS-template defaults.

## Design Principles

- **Calm and precise over expressive.** Neutral surfaces, one accent, tight alignment; personality comes from correctness and from the domain (the ribbon/cross/pill mark, gentian violet), not UI flourish.
- **Violet means "act here".** The single accent is reserved for actions, focus, and selection, never for status or decoration.
- **Light and dark are both measured.** Light, dark, and system themes each meet WCAG AA, with every pairing's ratio documented in the CSS as a first-class constraint, not an afterthought.
- **Status is never colour-only.** Expiry tiers always carry an icon and a word alongside colour.
- **Data reads in mono tabular figures.** Quantities, dates, and KPIs are set so they compare cleanly down a column.
- **Built for the shelf.** Large touch targets on a phone, compact on desktop, short task-focused visits.

## Accessibility & Inclusion

WCAG AA contrast is a hard floor in both light and dark themes, verified per color pairing (documented inline in `app/globals.css` with actual ratios). Status/tier information never relies on color alone: always paired with an icon and a word. Theme follows the user's choice (light, dark, or system). Respect `prefers-reduced-motion` (handled globally via Framer Motion's `reducedMotion="user"` and `motion-reduce` utilities).
