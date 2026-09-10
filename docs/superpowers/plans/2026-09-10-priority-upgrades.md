# Priority Upgrades Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship six coordinated upgrades — server-side medicine search, multi-recipient digest, full IANA timezone combobox, email chip input, shadcn component polish, and Framer Motion animations — across the Convex backend and Next.js frontend.

**Architecture:** Backend schema changes land first (search index + digestEmails field), enabling correct TypeScript types for all UI work. New shadcn primitives and custom components (TimezoneCombobox, EmailChipInput, motion wrappers) are built in isolation before any page is rewritten. Pages are updated last, one at a time.

**Tech Stack:** Convex 1.42, Next.js 15, React 19, Tailwind CSS, shadcn/ui, Radix UI, Framer Motion, cmdk

## Global Constraints

- All Convex queries/mutations must call `requireAuth` and gate results by `ownerId`
- Convex validator return types must be declared explicitly (`returns:`) — do not omit them
- Touch targets are `h-11` throughout — do not use `h-9` or `h-10` for interactive elements
- Font classes: `font-display` for headings, `font-data` for numbers, `label-field` for field captions
- `digestEmail` on existing settings rows stays in the DB; normalize it in the query layer — never require a data migration script
- Run `npm test` after every backend task; run the dev server after every page task

---

## File Map

**Create:**
- `components/ui/select.tsx` — shadcn Select (Radix SelectPrimitive)
- `components/ui/command.tsx` — shadcn Command (cmdk)
- `components/ui/popover.tsx` — shadcn Popover (Radix PopoverPrimitive)
- `components/ui/checkbox.tsx` — shadcn Checkbox (Radix CheckboxPrimitive)
- `components/timezone-combobox.tsx` — Combobox for IANA timezone selection
- `components/email-chip-input.tsx` — Tag/chip input for multiple email addresses
- `components/motion.tsx` — FadeSlideIn + ExpandCollapse animation primitives
- `convex/medicines.test.ts` — Tests for searchByName

**Modify:**
- `convex/schema.ts` — search index on medicines; digestEmails on settings
- `convex/medicines.ts` — add searchByName query
- `convex/settings.ts` — settingsShape + get + update for digestEmails
- `convex/digest.ts` — DigestContents type + emails normalization
- `convex/sendDigest.ts` — map over emails array
- `app/(app)/settings/page.tsx` — controlled state rewrite + new components
- `app/(app)/medicines/page.tsx` — server-side search + Card rows
- `app/(app)/page.tsx` — Card on add panel + FadeSlideIn on medicine cards
- `components/medicine-card.tsx` — AnimatePresence on view/edit swap
- `app/(app)/calendar/page.tsx` — FadeSlideIn on day-detail rows
- `app/(app)/medicines/[id]/page.tsx` — Card on StatTile / VarianceTile

---

## Task 1: Schema — Search Index + digestEmails Field

**Files:**
- Modify: `convex/schema.ts`

**Interfaces:**
- Produces: `medicines` table gains `.searchIndex("search_by_name", ...)` usable in Task 2
- Produces: `settings` table gains `digestEmails?: string[]` and `digestEmail` becomes optional

- [ ] **Step 1: Add search index and update settings fields in `convex/schema.ts`**

Replace the two table definitions (keep all other content identical):

```ts
  medicines: defineTable({
    ownerId: v.id("users"),
    name: v.string(),
    sku: v.optional(v.string()),
    genericName: v.optional(v.string()),
    form: medicineForm,
    strength: v.optional(v.string()),
    category: v.optional(v.string()),
    reorderPoint: v.number(),
    notes: v.optional(v.string()),
    expiryDate: v.optional(v.number()),
    onHandQuantity: v.number(),
    actualQuantity: v.number(),
  })
    .index("by_owner_name", ["ownerId", "name"])
    .searchIndex("search_by_name", {
      searchField: "name",
      filterFields: ["ownerId"],
    }),

  settings: defineTable({
    ownerId: v.id("users"),
    digestEnabled: v.boolean(),
    digestEmail: v.optional(v.string()),   // kept for existing rows; read via digestEmails
    digestEmails: v.optional(v.array(v.string())),
    digestDay: v.number(),
    digestHour: v.number(),
    timezone: v.string(),
    alertTiers: v.object({
      critical: v.number(),
      warning: v.number(),
      watch: v.number(),
    }),
    lastDigestSentAt: v.optional(v.number()),
  }).index("by_owner", ["ownerId"]),
```

- [ ] **Step 2: Verify Convex accepts the schema**

```bash
npx convex dev --once
```

Expected: no schema validation errors, Convex prints the deployment URL.

- [ ] **Step 3: Commit**

```bash
git add convex/schema.ts
git commit -m "feat: add medicines search index; migrate settings to digestEmails"
```

---

## Task 2: Backend — searchByName Query + Settings/Digest Multi-Recipient

**Files:**
- Modify: `convex/medicines.ts` (add query)
- Modify: `convex/settings.ts` (settingsShape + get + update)
- Modify: `convex/digest.ts` (DigestContents type + emails normalization)
- Modify: `convex/sendDigest.ts` (map over emails)
- Create: `convex/medicines.test.ts`

**Interfaces:**
- Produces: `api.medicines.searchByName({ q: string })` → `MedicineDoc[]`
- Produces: `api.settings.get` now returns `{ digestEmails: string[], ... }` (no `digestEmail`)
- Produces: `api.settings.update` now takes `{ digestEmails: string[], ... }` (no `digestEmail`)
- Produces: `DigestContents.emails: string[]` replaces `DigestContents.email: string | null`

- [ ] **Step 1: Add `searchByName` to `convex/medicines.ts`**

Add after the `listPaged` export (before `get`):

```ts
export const searchByName = query({
  args: { q: v.string() },
  returns: v.array(medicineDoc),
  handler: async (ctx, { q }) => {
    const ownerId = await requireAuth(ctx);
    const results = await ctx.db
      .query("medicines")
      .withSearchIndex("search_by_name", (search) =>
        search.search("name", q).eq("ownerId", ownerId),
      )
      .collect();
    return results.map(({ ownerId: _ownerId, ...rest }) => rest);
  },
});
```

- [ ] **Step 2: Write the test file `convex/medicines.test.ts`**

```ts
import { convexTest } from "convex-test";
import { expect, test, beforeEach } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./_generated/api";

// convex-test runs mutations/queries in an isolated in-memory DB per test.
// requireAuth reads ctx.auth — set identity via t.withIdentity() before calls.

test("searchByName returns medicines whose name matches the query", async () => {
  const t = convexTest(schema, modules);

  // Create an authenticated user context
  const asUser = t.withIdentity({ name: "Pharmacist", tokenIdentifier: "test|user1" });

  // Seed two medicines
  await asUser.mutation(api.medicines.create, {
    name: "Amoxicillin",
    form: "capsule",
    reorderPoint: 10,
    onHandQuantity: 50,
    actualQuantity: 50,
  });
  await asUser.mutation(api.medicines.create, {
    name: "Ibuprofen",
    form: "tablet",
    reorderPoint: 5,
    onHandQuantity: 30,
    actualQuantity: 30,
  });

  const results = await asUser.query(api.medicines.searchByName, { q: "amox" });
  expect(results).toHaveLength(1);
  expect(results[0].name).toBe("Amoxicillin");
});

test("searchByName does not return another owner's medicines", async () => {
  const t = convexTest(schema, modules);

  const asUser1 = t.withIdentity({ name: "User1", tokenIdentifier: "test|user1" });
  const asUser2 = t.withIdentity({ name: "User2", tokenIdentifier: "test|user2" });

  await asUser1.mutation(api.medicines.create, {
    name: "Paracetamol",
    form: "tablet",
    reorderPoint: 5,
    onHandQuantity: 20,
    actualQuantity: 20,
  });

  const results = await asUser2.query(api.medicines.searchByName, { q: "Para" });
  expect(results).toHaveLength(0);
});
```

- [ ] **Step 3: Run the tests**

```bash
npm test
```

Expected: both searchByName tests pass.

- [ ] **Step 4: Update `settingsShape` in `convex/settings.ts`**

Replace the `settingsShape` const:

```ts
const settingsShape = v.object({
  digestEnabled: v.boolean(),
  digestEmails: v.array(v.string()),
  digestDay: v.number(),
  digestHour: v.number(),
  timezone: v.string(),
  alertTiers,
  lastDigestSentAt: v.optional(v.number()),
});
```

- [ ] **Step 5: Update the `get` handler in `convex/settings.ts`**

Replace the handler body:

```ts
  handler: async (ctx) => {
    const ownerId = await requireAuth(ctx);
    const settings = await ctx.db
      .query("settings")
      .withIndex("by_owner", (q) => q.eq("ownerId", ownerId))
      .first();
    if (settings === null) return null;

    const {
      _id,
      _creationTime,
      ownerId: _ownerId,
      digestEmail,
      digestEmails,
      ...rest
    } = settings;

    return {
      ...rest,
      digestEmails: digestEmails ?? (digestEmail ? [digestEmail] : []),
    };
  },
```

- [ ] **Step 6: Update the `update` mutation args and handler in `convex/settings.ts`**

Replace the `update` export entirely:

```ts
export const update = mutation({
  args: {
    digestEnabled: v.boolean(),
    digestEmails: v.array(v.string()),
    digestDay: v.number(),
    digestHour: v.number(),
    timezone: v.string(),
    alertTiers,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const ownerId = await requireAuth(ctx);

    for (const email of args.digestEmails) {
      const trimmed = email.trim();
      if (!trimmed || !trimmed.includes("@")) {
        throw new ConvexError(`"${email}" does not look like an email address.`);
      }
    }

    if (!Number.isInteger(args.digestDay) || args.digestDay < 0 || args.digestDay > 6) {
      throw new ConvexError("Pick a day of the week.");
    }
    if (!Number.isInteger(args.digestHour) || args.digestHour < 0 || args.digestHour > 23) {
      throw new ConvexError("Pick an hour between 0 and 23.");
    }

    try {
      new Intl.DateTimeFormat("en-US", { timeZone: args.timezone }).format(0);
    } catch {
      throw new ConvexError(`"${args.timezone}" is not a timezone I recognise.`);
    }

    const { critical, warning, watch } = args.alertTiers;
    for (const [name, value] of Object.entries(args.alertTiers)) {
      if (!Number.isInteger(value) || value <= 0 || value > 3650) {
        throw new ConvexError(`${name} must be a whole number of days above zero.`);
      }
    }
    if (!(critical < warning && warning < watch)) {
      throw new ConvexError(
        "Tiers must increase: critical sooner than soon, soon sooner than watch.",
      );
    }

    const existing = await ctx.db
      .query("settings")
      .withIndex("by_owner", (q) => q.eq("ownerId", ownerId))
      .first();

    // digestEmail is cleared on first save via this mutation.
    const patch = { ...args, digestEmail: undefined };

    if (existing === null) {
      await ctx.db.insert("settings", { ...patch, ownerId });
    } else {
      await ctx.db.patch(existing._id, patch);
    }
    return null;
  },
});
```

- [ ] **Step 7: Update `DigestContents` type in `convex/digest.ts`**

Replace lines 22-29:

```ts
export type DigestContents = {
  due: boolean;
  emails: string[];
  subject: string;
  html: string;
  text: string;
  alertCount: number;
};
```

- [ ] **Step 8: Update the `contents` query return validator and handler in `convex/digest.ts`**

In the `contents` query, replace `email: v.union(v.string(), v.null())` with `emails: v.array(v.string())` in the `returns` object.

Replace the return statement at the bottom of the handler:

```ts
    const rawEmails =
      settings?.digestEmails ??
      (settings?.digestEmail ? [settings.digestEmail] : []);

    return {
      due,
      emails: rawEmails,
      subject: digestSubject(alerts),
      html: digestHtml(alerts, lowStock, APP_URL),
      text: digestText(alerts, lowStock, APP_URL),
      alertCount: alerts.length,
    };
```

- [ ] **Step 9: Update `sendDigest.ts` to use `emails`**

Replace the three lines that reference `digest.email`:

```ts
      if (digest.emails.length === 0) continue;

      await transporter.sendMail({
        from: `"MedMinder" <${gmailUser}>`,
        to: digest.emails.join(", "),
        subject: digest.subject,
        html: digest.html,
        text: digest.text,
      });

      await ctx.runMutation(internal.digest.markSent, { ownerId, at: Date.now() });
      sent.push(`${digest.emails.join(", ")}: ${digest.subject}`);
```

- [ ] **Step 10: Run tests and verify Convex compiles**

```bash
npm test
npx convex dev --once
```

Expected: all tests pass, no TypeScript errors from Convex.

- [ ] **Step 11: Commit**

```bash
git add convex/medicines.ts convex/medicines.test.ts convex/settings.ts convex/digest.ts convex/sendDigest.ts
git commit -m "feat: server-side medicine search; multi-recipient digest email"
```

---

## Task 3: Install shadcn Primitives + Framer Motion

**Files:**
- Create: `components/ui/select.tsx`
- Create: `components/ui/command.tsx`
- Create: `components/ui/popover.tsx`
- Create: `components/ui/checkbox.tsx`
- Modify: `package.json` (framer-motion added as dependency)

**Interfaces:**
- Produces: `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue` from `@/components/ui/select`
- Produces: `Command`, `CommandEmpty`, `CommandGroup`, `CommandInput`, `CommandItem`, `CommandList` from `@/components/ui/command`
- Produces: `Popover`, `PopoverContent`, `PopoverTrigger` from `@/components/ui/popover`
- Produces: `Checkbox` from `@/components/ui/checkbox`
- Produces: `motion`, `AnimatePresence` from `framer-motion`

- [ ] **Step 1: Add shadcn components via CLI**

```bash
npx shadcn@latest add select command popover checkbox
```

Accept all prompts (the existing `components.json` drives the output path). Verify the four files exist:

```bash
ls components/ui/select.tsx components/ui/command.tsx components/ui/popover.tsx components/ui/checkbox.tsx
```

- [ ] **Step 2: Install framer-motion**

```bash
npm install framer-motion
```

- [ ] **Step 3: Verify build compiles**

```bash
npm run build 2>&1 | tail -20
```

Expected: exits 0, no TypeScript errors related to the new packages.

- [ ] **Step 4: Commit**

```bash
git add components/ui/select.tsx components/ui/command.tsx components/ui/popover.tsx components/ui/checkbox.tsx package.json package-lock.json
git commit -m "feat: add shadcn Select, Command, Popover, Checkbox; install framer-motion"
```

---

## Task 4: Component — TimezoneCombobox

**Files:**
- Create: `components/timezone-combobox.tsx`

**Interfaces:**
- Consumes: `Command`, `CommandEmpty`, `CommandGroup`, `CommandInput`, `CommandItem`, `CommandList` from `@/components/ui/command`
- Consumes: `Popover`, `PopoverContent`, `PopoverTrigger` from `@/components/ui/popover`
- Produces: `TimezoneCombobox({ value: string, onChange: (tz: string) => void })` — controlled, no internal open state leaks

- [ ] **Step 1: Create `components/timezone-combobox.tsx`**

```tsx
"use client";

import * as React from "react";
import { CheckIcon, ChevronDownIcon } from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

const TIMEZONES = Intl.supportedValuesOf("timeZone").sort();

export function TimezoneCombobox({
  value,
  onChange,
}: {
  value: string;
  onChange: (tz: string) => void;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="h-11 w-full justify-between font-normal"
        >
          <span className="truncate">{value || "Select timezone…"}</span>
          <ChevronDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
      >
        <Command>
          <CommandInput placeholder="Search timezones…" />
          <CommandEmpty>No timezone found.</CommandEmpty>
          <CommandList>
            <CommandGroup>
              {TIMEZONES.map((tz) => (
                <CommandItem
                  key={tz}
                  value={tz}
                  onSelect={(selected) => {
                    onChange(selected);
                    setOpen(false);
                  }}
                >
                  <CheckIcon
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === tz ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {tz}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
```

- [ ] **Step 2: Smoke-test in the running app**

```bash
npm run dev
```

Temporarily add `<TimezoneCombobox value="Asia/Manila" onChange={console.log} />` to any page and verify:
- Popover opens on click
- Typing filters the list
- Selecting a timezone calls onChange and closes the popover

Revert the temporary addition after verifying.

- [ ] **Step 3: Commit**

```bash
git add components/timezone-combobox.tsx
git commit -m "feat: add TimezoneCombobox with full IANA timezone list"
```

---

## Task 5: Component — EmailChipInput

**Files:**
- Create: `components/email-chip-input.tsx`

**Interfaces:**
- Produces: `EmailChipInput({ value: string[], onChange: (emails: string[]) => void })` — controlled

- [ ] **Step 1: Create `components/email-chip-input.tsx`**

```tsx
"use client";

import * as React from "react";
import { Cross2Icon } from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function EmailChipInput({
  value,
  onChange,
}: {
  value: string[];
  onChange: (emails: string[]) => void;
}) {
  const [draft, setDraft] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  function addEmail(raw: string) {
    const email = raw.trim();
    if (!email) return;
    if (!isValidEmail(email)) {
      setError("That doesn't look like an email address.");
      return;
    }
    if (value.includes(email)) {
      setError("Already added.");
      return;
    }
    setError(null);
    onChange([...value, email]);
    setDraft("");
  }

  function removeEmail(email: string) {
    onChange(value.filter((e) => e !== email));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addEmail(draft);
    } else if (e.key === "Backspace" && draft === "" && value.length > 0) {
      removeEmail(value[value.length - 1]);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div
        className={cn(
          "flex min-h-11 flex-wrap items-center gap-1.5 rounded-sm border border-input bg-background px-3 py-2 cursor-text",
          "focus-within:outline-none focus-within:ring-2 focus-within:ring-ring",
          error && "border-destructive",
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((email) => (
          <span
            key={email}
            className="flex items-center gap-1 rounded-sm bg-secondary px-2 py-0.5 text-sm font-medium text-secondary-foreground"
          >
            {email}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeEmail(email);
              }}
              aria-label={`Remove ${email}`}
              className="ml-0.5 rounded-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <Cross2Icon className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="email"
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            if (error) setError(null);
          }}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            if (draft) addEmail(draft);
          }}
          placeholder={value.length === 0 ? "Add email address…" : ""}
          className="min-w-[12rem] flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
```

- [ ] **Step 2: Verify behavior manually**

```bash
npm run dev
```

Temporarily add `<EmailChipInput value={[]} onChange={console.log} />` to any page. Verify:
- Typing an email and pressing Enter adds a chip
- Typing a comma adds a chip
- Invalid email shows error and does not add
- Backspace on empty draft removes the last chip
- × button removes individual chips
- Blurring with a valid draft email adds it

Revert the temporary addition.

- [ ] **Step 3: Commit**

```bash
git add components/email-chip-input.tsx
git commit -m "feat: add EmailChipInput tag component for multi-recipient emails"
```

---

## Task 6: Component — Motion Primitives

**Files:**
- Create: `components/motion.tsx`

**Interfaces:**
- Produces: `FadeSlideIn({ children, className? })` — wraps any content with fade+slide-up on mount
- Produces: `ExpandCollapse({ show: boolean, children })` — height-animates conditional content

- [ ] **Step 1: Create `components/motion.tsx`**

```tsx
"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";

export function FadeSlideIn({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function ExpandCollapse({
  show,
  children,
}: {
  show: boolean;
  children: ReactNode;
}) {
  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          style={{ overflow: "hidden" }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/motion.tsx
git commit -m "feat: add FadeSlideIn and ExpandCollapse motion primitives"
```

---

## Task 7: Page — Settings Full Rewrite

**Files:**
- Modify: `app/(app)/settings/page.tsx`

**Interfaces:**
- Consumes: `api.settings.get` (now returns `digestEmails: string[]`)
- Consumes: `api.settings.update` (now takes `digestEmails: string[]`)
- Consumes: `TimezoneCombobox`, `EmailChipInput`, `Checkbox`, `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue`

- [ ] **Step 1: Replace `app/(app)/settings/page.tsx` entirely**

```tsx
"use client";

import { Field } from "@/components/medicine-form";
import { CardSkeleton, Page, PageHeader } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmailChipInput } from "@/components/email-chip-input";
import { TimezoneCombobox } from "@/components/timezone-combobox";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { useEffect, useRef, useState } from "react";

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export default function SettingsPage() {
  const settings = useQuery(api.settings.get);
  const update = useMutation(api.settings.update);

  const [digestEnabled, setDigestEnabled] = useState(true);
  const [digestEmails, setDigestEmails] = useState<string[]>([]);
  const [digestDay, setDigestDay] = useState(1);
  const [digestHour, setDigestHour] = useState(8);
  const [timezone, setTimezone] = useState("Asia/Manila");
  const [alertTiers, setAlertTiers] = useState({
    critical: 30,
    warning: 90,
    watch: 180,
  });

  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  // Sync once when settings first load; ignore subsequent reactive updates
  // so in-progress edits are not overwritten.
  const initialized = useRef(false);
  useEffect(() => {
    if (settings && !initialized.current) {
      initialized.current = true;
      setDigestEnabled(settings.digestEnabled);
      setDigestEmails(settings.digestEmails);
      setDigestDay(settings.digestDay);
      setDigestHour(settings.digestHour);
      setTimezone(settings.timezone);
      setAlertTiers(settings.alertTiers);
    }
  }, [settings]);

  if (settings === undefined) {
    return (
      <Page>
        <PageHeader title="Settings" />
        <CardSkeleton count={2} />
      </Page>
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    setSaving(true);
    try {
      await update({
        digestEnabled,
        digestEmails,
        digestDay,
        digestHour,
        timezone,
        alertTiers,
      });
      setSaved(true);
    } catch (err) {
      setError(
        err instanceof ConvexError
          ? String(err.data)
          : "Could not save. Nothing was changed.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Page>
      <PageHeader
        title="Settings"
        subtitle="What counts as urgent, and when to be told."
      />

      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        <section className="flex flex-col gap-5">
          <div>
            <h2 className="font-display text-lg font-medium">Weekly email</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              A summary of what is expiring, so nothing depends on remembering
              to check.
            </p>
          </div>

          <label className="flex items-center gap-3 rounded-lg border bg-card p-4 cursor-pointer">
            <Checkbox
              checked={digestEnabled}
              onCheckedChange={(checked) => setDigestEnabled(!!checked)}
            />
            <span className="text-sm font-medium">Send the weekly summary</span>
          </label>

          <Field label="Send to">
            <EmailChipInput value={digestEmails} onChange={setDigestEmails} />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Day">
              <Select
                value={String(digestDay)}
                onValueChange={(v) => setDigestDay(Number(v))}
              >
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS.map((d, i) => (
                    <SelectItem key={d} value={String(i)}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Hour">
              <Select
                value={String(digestHour)}
                onValueChange={(v) => setDigestHour(Number(v))}
              >
                <SelectTrigger className="h-11 font-data">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 24 }).map((_, h) => (
                    <SelectItem key={h} value={String(h)} className="font-data">
                      {String(h).padStart(2, "0")}:00
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field label="Timezone" hint="The hour above is read in this timezone.">
            <TimezoneCombobox value={timezone} onChange={setTimezone} />
          </Field>
        </section>

        <section className="flex flex-col gap-5 border-t pt-6">
          <div>
            <h2 className="font-display text-lg font-medium">Expiry alerts</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              How many days ahead each warning starts. Each must be sooner than
              the one below it.
            </p>
          </div>

          <Field label="Critical" hint="Too late to return. Default 30 days.">
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              required
              value={alertTiers.critical}
              onChange={(e) =>
                setAlertTiers((t) => ({ ...t, critical: Number(e.target.value) }))
              }
              className="font-data h-11"
            />
          </Field>

          <Field label="Soon" hint="Still returnable to most suppliers. Default 90 days.">
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              required
              value={alertTiers.warning}
              onChange={(e) =>
                setAlertTiers((t) => ({ ...t, warning: Number(e.target.value) }))
              }
              className="font-data h-11"
            />
          </Field>

          <Field label="Watch" hint="Worth planning around. Default 180 days.">
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              required
              value={alertTiers.watch}
              onChange={(e) =>
                setAlertTiers((t) => ({ ...t, watch: Number(e.target.value) }))
              }
              className="font-data h-11"
            />
          </Field>
        </section>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        {saved && !error && (
          <p role="status" className="text-sm text-tier-ok">
            Settings saved.
          </p>
        )}

        <Button type="submit" disabled={saving} className="h-11">
          {saving ? "Saving…" : "Save settings"}
        </Button>
      </form>
    </Page>
  );
}
```

- [ ] **Step 2: Verify Settings page in the running app**

```bash
npm run dev
```

Navigate to `/settings`. Verify:
- All form fields load with saved values
- Day and Hour render as shadcn Select dropdowns
- Timezone field opens a searchable combobox with ~600 entries
- "Send to" renders an empty chip input; adding/removing emails works
- Digest enabled shows shadcn Checkbox
- Save button submits and shows "Settings saved."
- No console errors

- [ ] **Step 3: Commit**

```bash
git add "app/(app)/settings/page.tsx"
git commit -m "feat: rewrite Settings page with controlled state and shadcn components"
```

---

## Task 8: Page — Medicines List (Server-Side Search + Card Rows)

**Files:**
- Modify: `app/(app)/medicines/page.tsx`

**Interfaces:**
- Consumes: `api.medicines.searchByName({ q: string })` (Task 2)
- Consumes: `Card` from `@/components/ui/card`

- [ ] **Step 1: Replace `app/(app)/medicines/page.tsx` entirely**

```tsx
"use client";

import {
  CardSkeleton,
  EmptyState,
  Page,
  PageHeader,
} from "@/components/page-shell";
import { TierBadge } from "@/components/tier-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/convex/_generated/api";
import { DEFAULT_ALERT_TIERS, expiryTier } from "@/convex/lib/inventory";
import { formatQuantity } from "@/lib/format";
import { usePaginatedQuery, useQuery } from "convex/react";
import Link from "next/link";
import { useMemo, useState } from "react";

const PAGE_SIZE = 30;

export default function MedicinesPage() {
  const {
    results: browseResults,
    status,
    loadMore,
  } = usePaginatedQuery(api.medicines.listPaged, {}, { initialNumItems: PAGE_SIZE });

  const [search, setSearch] = useState("");
  const q = search.trim().toLowerCase();
  const now = Date.now();

  // Server-side search — skipped (returns undefined) when q is empty.
  const searchResults = useQuery(
    api.medicines.searchByName,
    q ? { q } : "skip",
  );

  const isSearching = q.length > 0;
  const displayedMedicines = isSearching ? (searchResults ?? []) : browseResults;
  const isLoadingSearch = isSearching && searchResults === undefined;
  const loadingFirstPage = !isSearching && status === "LoadingFirstPage";

  const hasAny = browseResults.length > 0 || (searchResults?.length ?? 0) > 0;

  return (
    <Page>
      <PageHeader
        title="Medicines"
        subtitle="Everything on the shelf, and what is running low."
        action={
          <Button asChild>
            <Link href="/medicines/new">Add</Link>
          </Button>
        }
      />

      {(browseResults.length > 0 || isSearching) && (
        <Input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or generic"
          aria-label="Search medicines"
          className="h-11"
        />
      )}

      {(loadingFirstPage || isLoadingSearch) && <CardSkeleton />}

      {!loadingFirstPage && !isSearching && browseResults.length === 0 && (
        <EmptyState
          title="No medicines yet"
          body="Add the medicines you stock, with their expiry date and quantity."
          action={
            <Button asChild className="mt-1">
              <Link href="/medicines/new">Add the first medicine</Link>
            </Button>
          }
        />
      )}

      {!isLoadingSearch && isSearching && searchResults?.length === 0 && (
        <EmptyState
          title="Nothing matches that"
          body={`No medicine matches "${search.trim()}". Check the spelling, or try the generic name.`}
        />
      )}

      {displayedMedicines.length > 0 && (
        <ul className="flex flex-col gap-3">
          {displayedMedicines.map((m) => {
            const low = m.onHandQuantity <= m.reorderPoint;
            const tier =
              m.expiryDate === undefined
                ? null
                : expiryTier(m.expiryDate, now, DEFAULT_ALERT_TIERS);

            return (
              <li key={m._id}>
                <Card className="overflow-hidden p-0 transition-colors hover:border-input">
                  <Link
                    href={`/medicines/${m._id}`}
                    className="focus-card flex items-start justify-between gap-4 p-4"
                  >
                    <div className="min-w-0">
                      <p className="font-display text-lg font-medium leading-snug">
                        {m.name}
                      </p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {[m.strength, m.form].filter(Boolean).join(" · ")}
                        {m.genericName ? ` · ${m.genericName}` : ""}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {tier && tier !== "ok" && <TierBadge tier={tier} />}
                        {low && (
                          <span className="rounded-sm bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">
                            Low stock
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="font-data text-xl font-medium leading-none">
                        {formatQuantity(m.onHandQuantity)}
                      </p>
                      <p className="label-field mt-1">On hand</p>
                    </div>
                  </Link>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      {!isSearching && status === "CanLoadMore" && (
        <Button
          variant="outline"
          className="mt-1 self-center"
          onClick={() => loadMore(PAGE_SIZE)}
        >
          Load more
        </Button>
      )}

      {!isSearching && status === "LoadingMore" && (
        <p className="mt-1 text-center text-sm text-muted-foreground">Loading…</p>
      )}
    </Page>
  );
}
```

- [ ] **Step 2: Verify medicines list in the running app**

```bash
npm run dev
```

Navigate to `/medicines`. Verify:
- List loads and rows look like cards (border, rounded, bg-card)
- Typing in the search box queries server-side (no "load more" needed while searching)
- Clearing search returns to paginated browse mode
- "Load more" button appears for large shelves in browse mode

- [ ] **Step 3: Commit**

```bash
git add "app/(app)/medicines/page.tsx"
git commit -m "feat: medicines list server-side search and Card rows"
```

---

## Task 9: Page — Dashboard Card Wrapper + FadeSlideIn on Medicine Cards

**Files:**
- Modify: `app/(app)/page.tsx`

**Interfaces:**
- Consumes: `Card` from `@/components/ui/card`
- Consumes: `FadeSlideIn`, `ExpandCollapse` from `@/components/motion`

- [ ] **Step 1: Add imports to `app/(app)/page.tsx`**

Add to the existing import block:

```tsx
import { Card } from "@/components/ui/card";
import { ExpandCollapse, FadeSlideIn } from "@/components/motion";
```

- [ ] **Step 2: Wrap the add panel in `ExpandCollapse` and use `Card`**

In `DashboardPage`, replace the `addPanel` variable:

```tsx
  const addPanel = (
    <div className="flex flex-col gap-3">
      <Button
        type="button"
        variant="outline"
        onClick={() => setAdding((v) => !v)}
        className="h-11"
      >
        {adding ? "Cancel" : "+ Add medicine"}
      </Button>
      <ExpandCollapse show={adding}>
        <Card className="p-4 mt-0">
          <MedicineForm
            submitLabel="Add medicine"
            onCancel={() => setAdding(false)}
            onSubmit={async (values) => {
              await create(values);
              setAdding(false);
            }}
          />
        </Card>
      </ExpandCollapse>
    </div>
  );
```

- [ ] **Step 3: Wrap each `MedicineCard` in `OnHandTab` with `FadeSlideIn`**

In the `OnHandTab` component, replace the `items.map` block:

```tsx
          {items.map((item) => {
            const medicine = medicineById.get(item.medicineId);
            if (!medicine) return null;
            return (
              <FadeSlideIn key={item.medicineId}>
                <MedicineCard
                  medicine={medicine}
                  activeKind="onHand"
                  tier={item.tier}
                  expiryDistance={formatExpiryDistance(item.expiryDate, now)}
                  isEditing={editingId === item.medicineId}
                  onToggleEdit={() => onToggleEdit(item.medicineId)}
                />
              </FadeSlideIn>
            );
          })}
```

And replace the `filteredLowStock.map` block:

```tsx
          {filteredLowStock.map((m) => {
            const medicine = medicineById.get(m.medicineId);
            if (!medicine) return null;
            return (
              <FadeSlideIn key={m.medicineId}>
                <MedicineCard
                  medicine={medicine}
                  activeKind="onHand"
                  tier={undefined}
                  expiryDistance={
                    medicine.expiryDate
                      ? formatExpiryDistance(medicine.expiryDate, now)
                      : undefined
                  }
                  isEditing={editingId === m.medicineId}
                  onToggleEdit={() => onToggleEdit(m.medicineId)}
                />
              </FadeSlideIn>
            );
          })}
```

- [ ] **Step 4: Wrap each `MedicineCard` in `ActualTab` with `FadeSlideIn`**

In `ActualTab`, replace the `sorted.map` block:

```tsx
      {sorted.map((m) => (
        <FadeSlideIn key={m._id}>
          <MedicineCard
            medicine={m}
            activeKind="actual"
            tier={tierByMedicine.get(m._id)}
            expiryDistance={
              m.expiryDate ? formatExpiryDistance(m.expiryDate, now) : undefined
            }
            isEditing={editingId === m._id}
            onToggleEdit={() => onToggleEdit(m._id)}
          />
        </FadeSlideIn>
      ))}
```

- [ ] **Step 5: Verify dashboard in the running app**

```bash
npm run dev
```

Navigate to `/`. Verify:
- Medicine cards fade+slide up on initial load
- Clicking "+ Add medicine" smoothly expands the add form
- Clicking "Cancel" smoothly collapses the form
- No layout shift or flicker

- [ ] **Step 6: Commit**

```bash
git add "app/(app)/page.tsx"
git commit -m "feat: dashboard Card add panel and FadeSlideIn on medicine cards"
```

---

## Task 10: MedicineCard Animation + Calendar + Medicine Detail Audit

**Files:**
- Modify: `components/medicine-card.tsx`
- Modify: `app/(app)/calendar/page.tsx`
- Modify: `app/(app)/medicines/[id]/page.tsx`

**Interfaces:**
- Consumes: `AnimatePresence`, `motion` from `framer-motion`
- Consumes: `Card` from `@/components/ui/card`

- [ ] **Step 1: Animate the view/edit swap in `components/medicine-card.tsx`**

Add imports:

```tsx
import { AnimatePresence, motion } from "framer-motion";
```

Wrap the edit-mode return and the view-mode return inside `AnimatePresence`. Replace the top of `MedicineCard` (the `if (isEditing)` block and the view `return`):

```tsx
  return (
    <AnimatePresence mode="wait" initial={false}>
      {isEditing ? (
        <motion.div
          key="edit"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className={cn("rounded-lg border bg-card p-4", className)}
        >
          <MedicineForm
            initial={medicine}
            submitLabel="Save changes"
            onCancel={onToggleEdit}
            onSubmit={async (values) => {
              setFormError(null);
              try {
                await update({ medicineId: medicine._id, ...values });
                onToggleEdit();
              } catch (err) {
                setFormError(
                  err instanceof ConvexError
                    ? String(err.data)
                    : "Could not save. Check the details and try again.",
                );
                throw err;
              }
            }}
          />
          {formError && (
            <p role="alert" className="mt-2 text-sm text-destructive">
              {formError}
            </p>
          )}
        </motion.div>
      ) : (
        <motion.article
          key="view"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className={cn("rounded-lg border bg-card p-4", className)}
        >
          {/* --- rest of the view JSX unchanged from here --- */}
          <div className="flex items-start justify-between gap-4">
            <Link href={`/medicines/${medicine._id}`} className="focus-card min-w-0 flex-1 rounded-sm">
              <h3 className="font-display text-lg font-medium leading-snug">{medicine.name}</h3>
              {(medicine.strength || medicine.form) && (
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {[medicine.strength, medicine.form].filter(Boolean).join(" · ")}
                </p>
              )}
            </Link>

            <button
              type="button"
              onClick={onToggleEdit}
              aria-label={`Edit ${medicine.name}`}
              className="focus-card flex h-11 w-11 shrink-0 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <Pencil1Icon className="h-4 w-4" />
            </button>
          </div>

          {tier && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <TierBadge tier={tier} />
              {expiryDistance && <span className="text-sm text-muted-foreground">{expiryDistance}</span>}
            </div>
          )}

          <div className="mt-3 flex items-center justify-between border-t pt-3">
            <QuantityStepper
              medicineId={medicine._id}
              kind={activeKind}
              value={activeQuantity}
            />
            <div className="text-right">
              <p className="label-field">{activeLabel}</p>
              {driftText && (
                <p
                  className={cn(
                    "mt-0.5 text-xs",
                    diff < 0 ? "text-tier-critical" : "text-tier-watch",
                  )}
                >
                  {driftText}
                </p>
              )}
            </div>
          </div>
        </motion.article>
      )}
    </AnimatePresence>
  );
```

Remove the old `if (isEditing) { return ... }` block and the standalone `return <article ...>` — they are now inside the `AnimatePresence` above.

- [ ] **Step 2: Add `FadeSlideIn` to calendar day-detail rows in `app/(app)/calendar/page.tsx`**

Add import:

```tsx
import { FadeSlideIn } from "@/components/motion";
```

In the selected-day section, replace `selectedSorted.map(...)` return:

```tsx
            selectedSorted.map((m) => (
              <FadeSlideIn key={m._id}>
                <Link
                  href={`/medicines/${m._id}`}
                  className="focus-card flex items-start justify-between gap-3 rounded-lg border bg-card p-4"
                >
                  <div className="min-w-0">
                    <p className="font-display text-base font-medium leading-snug">
                      {m.name}
                    </p>
                    {(m.strength || m.form) && (
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {[m.strength, m.form].filter(Boolean).join(" · ")}
                      </p>
                    )}
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatExpiryDistance(m.expiryDate as number, now)}
                    </p>
                  </div>
                  <TierBadge tier={m.tier} className="shrink-0" />
                </Link>
              </FadeSlideIn>
            ))
```

- [ ] **Step 3: Upgrade `StatTile` and `VarianceTile` to use `Card` in `app/(app)/medicines/[id]/page.tsx`**

Add import:

```tsx
import { Card } from "@/components/ui/card";
```

Replace `StatTile`:

```tsx
function StatTile({
  label,
  value,
  flag,
}: {
  label: string;
  value: string;
  flag?: string;
}) {
  return (
    <Card className="min-w-[7.5rem] flex-1 p-4">
      <p className="label-field">{label}</p>
      <p className="font-data mt-1 text-2xl font-medium leading-none">{value}</p>
      {flag && <p className="mt-1 text-xs font-medium text-primary">{flag}</p>}
    </Card>
  );
}
```

Replace `VarianceTile`:

```tsx
function VarianceTile({ variance }: { variance: number }) {
  const sign = variance > 0 ? "positive" : variance < 0 ? "negative" : "equal";

  const valueStr =
    variance > 0 ? `+${formatQuantity(variance)}` : formatQuantity(variance);

  const styles = {
    positive: { value: "text-[color:var(--tier-ok-fg)]", label: "Surplus" },
    negative: { value: "text-[color:var(--tier-critical-fg)]", label: "Deficit" },
    equal: { value: "text-muted-foreground", label: "Balanced" },
  }[sign];

  return (
    <Card className="min-w-[7.5rem] flex-1 p-4">
      <p className="label-field">Variance</p>
      <p className={`font-data mt-1 text-2xl font-medium leading-none ${styles.value}`}>
        {valueStr}
      </p>
      <p className={`mt-1 text-xs font-medium ${styles.value}`}>{styles.label}</p>
    </Card>
  );
}
```

- [ ] **Step 4: Verify in the running app**

```bash
npm run dev
```

Verify:
- Dashboard: clicking the pencil icon on a card cross-fades between view and edit states
- Calendar: clicking a day with medicines shows items that fade+slide in
- Medicine detail: stat tiles (On hand, Actual, Variance, Expires) render with card borders

- [ ] **Step 5: Commit**

```bash
git add components/medicine-card.tsx "app/(app)/calendar/page.tsx" "app/(app)/medicines/[id]/page.tsx"
git commit -m "feat: animate MedicineCard edit toggle; FadeSlideIn on calendar; Card on detail tiles"
```

---

## Self-Review Checklist

- [x] **Spec coverage:** All six upgrades covered — search index (T1/T2), multi-recipient (T2/T7), IANA timezone combobox (T4/T7), email chip input (T5/T7), shadcn audit (T3/T7/T8/T10), Framer Motion (T6/T9/T10)
- [x] **Placeholder scan:** No TBDs; all code blocks are complete
- [x] **Type consistency:** `digestEmails: string[]` used consistently across schema, settings.ts, digest.ts, sendDigest.ts, and settings page. `searchByName` return type matches `medicineDoc` used elsewhere. `FadeSlideIn`/`ExpandCollapse` props match usage in T9/T10.
- [x] **One missing detail fixed:** `digestEmail: undefined` in the `update` patch — Convex interprets patching an optional field with `undefined` as removal, which is correct behavior here.
