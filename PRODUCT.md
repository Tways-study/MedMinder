# Product

## Register

product

## Users

Pharmacists and clinic staff managing a physical medicine shelf — checking stock, expiry, and reorder points, often standing at the shelf itself (one-handed, on a phone, under pharmacy lighting) rather than at a desk. The job to be done on any given screen is narrow and task-focused: is this in date, is this low, what needs action this week.

## Product Purpose

MedMinder tracks medicine inventory and expiry for a pharmacy or clinic: stock levels, expiry dates, and reorder points, with a weekly digest so nothing slips through. It exists to replace manual shelf-checking with a system that surfaces what needs attention before it becomes a problem (an expired batch, an empty shelf).

## Brand Personality

Calm, precise, trustworthy. The voice of a well-run dispensary, not a startup dashboard — confidence through restraint and correctness, not enthusiasm. Gentian violet (the palette's anchor) is a real pharmacy antiseptic dye, chosen because the purple comes from the subject matter, not from decoration.

## Anti-references

Not a generic SaaS dashboard: no identical rounded-card grids, no uniform soft-gray card shadows, no gradient washes as decoration, no interchangeable-with-any-other-tool look. The existing system already rejects this (grouped surfaces instead of shadows, pills for pressed elements, one accent color that means "act here") — new work should extend that discipline, not drift back toward SaaS-template defaults.

## Design Principles

- **Apple's restraint, apothecary's subject matter.** Borrow structural discipline (grouped surfaces, one accent, pill controls) from Apple; borrow palette and material cues from the pharmacy itself, not from generic tech branding.
- **Every color pairing is measured, not eyeballed.** Contrast ratios are documented in the CSS as a first-class design constraint, not an accessibility afterthought.
- **Single-purpose, light-only.** This is a tool read under pharmacy shelf lighting in short, task-focused visits — no dark mode, no decorative complexity that competes with the task.
- **The mark is the message.** Where personality shows up, it comes from the domain (the ribbon/cross/pill mark, gentian violet) rather than from generic UI flourish.

## Accessibility & Inclusion

WCAG AA contrast is a hard floor, verified per color pairing (documented inline in `app/globals.css` with actual ratios, e.g. "6.18:1 on paper"). Status/tier information never relies on color alone — always paired with an icon and a word. Theme is locked to light by design (no half-built dark mode). Respect `prefers-reduced-motion` and `prefers-reduced-transparency` (already handled for the `.material` translucent surface).
