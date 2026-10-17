# 004 — 12px text floor and sans filter chips

- **Status**: DONE
- **Commit**: 1690b07
- **Severity**: MEDIUM
- **Category**: typography
- **Estimated scope**: 6 files, ~9 lines

## Problem

An 11px size (`text-2xs`) is used for labels read under pharmacy lighting, and the filter chip sets words in tracked uppercase mono, which DESIGN.md reserves for data.

```ts
/* tailwind.config.ts:80-82 — current */
fontSize: {
  "2xs": ["0.6875rem", { lineHeight: "1rem" }],
},
```

```tsx
/* app/(app)/medicines/page.tsx:87 — current */
"inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 font-mono text-2xs font-medium uppercase tracking-[0.1em] transition-colors";
```

Other `text-2xs` uses: `components/app-nav.tsx:192`, `components/stamp-badge.tsx:67`, `app/(app)/calendar/page.tsx:301`, `app/(app)/medicines/[id]/page.tsx:271,287,300`.

## Target

- No size below 12px. `text-2xs` is deleted; every use becomes `text-xs` (0.75rem / 16px line height from the Tailwind default).
- Filter chip face: `inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition-colors` (sans, normal case, default tracking).

## Repo conventions to follow

- DESIGN.md "The Mono Is For Data Rule": prose, labels and units never use `.font-data`/mono.
- The stamp is the one deliberate exception for uppercase mono (`stamp-badge.tsx:66`); only its size changes.

## Steps

1. `tailwind.config.ts`: delete the `fontSize: { "2xs": … }` block (lines 80-82).
2. Replace `text-2xs` with `text-xs` at each location above.
3. `medicines/page.tsx:87`: remove `font-mono`, `uppercase` and `tracking-[0.1em]`.
4. `DESIGN.md`: change "Tab label (500, 0.6875rem, `text-2xs`)" to "Tab label (500, 0.75rem, `text-xs`)" and the matching frontmatter `tab-label` entry to `fontSize: "0.75rem"`, `lineHeight: 1rem`.

## Boundaries

- Do NOT change `.label-caps` (already 12px, `globals.css:94`).
- Do NOT touch the stamp's tracking, rotation or border.
- Do NOT change colour tokens.
- If the mobile tab bar wraps or clips at 12px, STOP and report rather than shrinking text.

## Verification

- **Mechanical**: `npm run lint`, `npm run build`. `grep -rn "text-2xs" app components` returns nothing.
- **Feel check**: view the mobile tab bar at 390px width and the Medicines filter row at 1440px.
  - Tab labels fit on one line in all four tabs.
  - Filter chips read as normal-case words and still align at `h-8`.
  - Detail-page helper text under values is legible and doesn't push layout.
- **Done when**: nothing in the UI renders below 12px.
