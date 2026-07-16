"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Doc } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { ConvexError } from "convex/values";
import { useState } from "react";

const FORMS = [
  "tablet",
  "capsule",
  "syrup",
  "suspension",
  "ointment",
  "drops",
  "injection",
  "other",
] as const;

export type MedicineFormValues = {
  name: string;
  genericName?: string;
  form: (typeof FORMS)[number];
  strength?: string;
  category?: string;
  reorderPoint: number;
  notes?: string;
};

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {/* Hint above error: the hint explains, the error corrects. */}
      {hint && !error && (
        <span className="text-xs text-muted-foreground">{hint}</span>
      )}
      {error && (
        <span role="alert" className="text-xs text-destructive">
          {error}
        </span>
      )}
    </label>
  );
}

export function MedicineForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial?: Doc<"medicines">;
  submitLabel: string;
  onSubmit: (values: MedicineFormValues) => Promise<void>;
  onCancel: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const data = new FormData(event.currentTarget);
    const reorderPoint = Number(data.get("reorderPoint"));

    if (!Number.isInteger(reorderPoint) || reorderPoint < 0) {
      setError("Reorder point must be a whole number, zero or more.");
      return;
    }

    setSaving(true);
    try {
      await onSubmit({
        name: String(data.get("name")),
        genericName: String(data.get("genericName") || "") || undefined,
        form: String(data.get("form")) as MedicineFormValues["form"],
        strength: String(data.get("strength") || "") || undefined,
        category: String(data.get("category") || "") || undefined,
        reorderPoint,
        notes: String(data.get("notes") || "") || undefined,
      });
    } catch (err) {
      setError(
        err instanceof ConvexError
          ? String(err.data)
          : "Could not save. Check the details and try again.",
      );
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Field label="Name" hint="What is printed on the box.">
        <Input
          name="name"
          required
          defaultValue={initial?.name}
          className="h-11"
          autoComplete="off"
        />
      </Field>

      <Field label="Generic name" hint="Optional. Searchable alongside the brand.">
        <Input
          name="genericName"
          defaultValue={initial?.genericName}
          className="h-11"
          autoComplete="off"
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Strength">
          <Input
            name="strength"
            placeholder="500 mg"
            defaultValue={initial?.strength}
            className="h-11"
            autoComplete="off"
          />
        </Field>

        <Field label="Form">
          <select
            name="form"
            defaultValue={initial?.form ?? "tablet"}
            className={cn(
              "h-11 rounded-sm border border-input bg-background px-3 text-sm",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            )}
          >
            {FORMS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Category" hint="Optional. Used to scope a count to one shelf.">
        <Input
          name="category"
          placeholder="Antibiotics"
          defaultValue={initial?.category}
          className="h-11"
          autoComplete="off"
        />
      </Field>

      <Field
        label="Reorder point"
        hint="Flag this medicine as low when total stock falls to this number."
      >
        <Input
          name="reorderPoint"
          type="number"
          inputMode="numeric"
          min={0}
          step={1}
          required
          defaultValue={initial?.reorderPoint ?? 0}
          className="font-data h-11"
        />
      </Field>

      <Field label="Notes">
        <Input
          name="notes"
          defaultValue={initial?.notes}
          className="h-11"
          autoComplete="off"
        />
      </Field>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={saving} className="h-11 flex-1">
          {saving ? "Saving…" : submitLabel}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="h-11"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
