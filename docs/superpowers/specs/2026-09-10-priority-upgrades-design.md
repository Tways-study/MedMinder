# MedMinder Priority Upgrades — Design Spec
_Date: 2026-09-10_

## Overview

Six coordinated upgrades across three dependency layers:

1. **Backend** — Convex search index on medicines; multi-recipient digest schema
2. **Component layer** — new shadcn primitives, TimezoneCombobox, EmailChipInput, Framer Motion
3. **Page layer** — Settings rewrite, medicines list upgrade, full audit pass, animation wrappers

---

## Layer 1: Data Model Changes

### Search index

Add to `schema.ts` on the `medicines` table:

```ts
.searchIndex("search_by_name", {
  searchField: "name",
  filterFields: ["ownerId"],
})
```

Add `medicines.searchByName` query using this index. The medicines list page switches to server-side search when `q` is non-empty, eliminating the current "auto-load all pages while searching" `useEffect`.

### Multi-recipient digest

**Backward-compatible field migration — no migration script required.**

- Schema: keep `digestEmail?: string` (optional, for existing rows) and add `digestEmails?: string[]`
- `settings.get` normalizes on read: `digestEmails ?? (digestEmail ? [digestEmail] : [])`
- `settings.update` writes only `digestEmails`, clears the old field with `undefined`
- `sendDigest` maps over the normalized array and sends to each address
- Existing rows with `digestEmail` work immediately with no data rewrite

---

## Layer 2: New Components

### shadcn primitives (install/scaffold)

| Component | File | Purpose |
|---|---|---|
| Select | `components/ui/select.tsx` | Day and Hour dropdowns in Settings |
| Command | `components/ui/command.tsx` | Combobox command palette |
| Popover | `components/ui/popover.tsx` | Combobox popover container |
| Checkbox | `components/ui/checkbox.tsx` | Digest enabled toggle in Settings |

### `components/timezone-combobox.tsx`

Controlled component. Props: `value: string`, `onChange: (tz: string) => void`.

- Data source: `Intl.supportedValuesOf('timeZone')`, sorted alphabetically (~600 entries)
- Renders as a Popover trigger button + Command input with filtered list
- Filtering is case-insensitive substring match on the timezone string
- Displays the selected value on the trigger button; placeholder "Select timezone…" when empty

### `components/email-chip-input.tsx`

Controlled component. Props: `value: string[]`, `onChange: (emails: string[]) => void`.

- Enter or comma adds a chip; validates basic email format before adding
- Invalid format shows an inline error message beneath the input; does not add the chip
- Backspace on empty draft removes the last chip
- Each chip renders with the email text and a `×` remove button
- Visual style matches shadcn Input (same height, border, background)

### Framer Motion primitives

Install `framer-motion` as a dependency.

**`<FadeSlideIn>`** — thin motion wrapper:
```
initial: { opacity: 0, y: 8 }
animate: { opacity: 1, y: 0 }
transition: { duration: 0.18, ease: 'easeOut' }
```

**`<ExpandCollapse>`** — wraps conditionally rendered panels:
- Uses `AnimatePresence` + `motion.div` with `height: 0 → 'auto'`
- `overflow: hidden` during animation
- Applied to "Add medicine" panel and inline edit panels on the dashboard

---

## Layer 3: Page Changes

### Settings page (`app/(app)/settings/page.tsx`)

Moves from `FormData` collection to **fully controlled state**:

```ts
const [digestEnabled, setDigestEnabled] = useState(settings.digestEnabled)
const [digestEmails, setDigestEmails]   = useState<string[]>(settings.digestEmails)
const [digestDay, setDigestDay]         = useState(settings.digestDay)
const [digestHour, setDigestHour]       = useState(settings.digestHour)
const [timezone, setTimezone]           = useState(settings.timezone)
const [alertTiers, setAlertTiers]       = useState(settings.alertTiers)
```

A `useEffect` syncs state **once** when `settings` first transitions from `undefined` to defined (initial load). Subsequent reactive Convex updates do not overwrite in-progress form edits — tracked via a `useRef` initialized flag.
`handleSubmit` reads from state directly instead of `FormData`.

Component replacements:

| Was | Becomes |
|---|---|
| `<input type="checkbox">` | shadcn `<Checkbox>` |
| `<Input name="digestEmail">` | `<EmailChipInput>` |
| `<select name="digestDay">` | shadcn `<Select>` |
| `<select name="digestHour">` | shadcn `<Select>` |
| `<select name="timezone">` | `<TimezoneCombobox>` |
| `<Input name="critical/warning/watch">` | stays `<Input>` (already shadcn, wired to alertTiers state) |

### Medicines list (`app/(app)/medicines/page.tsx`)

- `<Link>` rows become `<Card>` components (visual parity with dashboard cards)
- Search switches to `useQuery(api.medicines.searchByName, { q })` when `q` is non-empty
- `usePaginatedQuery` remains for the empty-search browse path
- The auto-load `useEffect` is removed (no longer needed)

### Dashboard (`app/(app)/page.tsx`)

- Add panel wrapper `<div className="rounded-lg border bg-card p-4">` → `<Card className="p-4">`
- `<FadeSlideIn>` wraps each `<MedicineCard>` in tier sections and low-stock section
- `<ExpandCollapse>` wraps the `{adding && …}` add panel and the `isEditing` edit panel inside `MedicineCard`

### Medicine detail (`app/(app)/medicines/[id]/page.tsx`)

Audit pass for any native form elements not already using shadcn. `MedicineForm` is already consistent; focus is on surrounding page chrome (buttons, layout wrappers).

### Calendar (`app/(app)/calendar/page.tsx`)

Month navigation `<button>` elements stay as-is — hand-rolled styling is intentional and correct. No shadcn equivalent maps cleanly.

- `<FadeSlideIn>` wraps each medicine link row in the day detail section.

### Animation scope boundary

No animation on page transitions or skeleton loaders. Skeletons already have pulse animations; stacking motion on top creates noise.

---

## Audit Scope Boundary

The audit touches:
- Native form elements → shadcn equivalents
- Plain `<div className="rounded-lg border bg-card …">` card wrappers → `<Card>`

It does **not**:
- Redesign any page layout
- Change any behavior
- Touch intentionally-styled non-form interactive elements (calendar nav buttons, stepper buttons)
