"use client";

import { useAlertIn } from "@/components/motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { fromDateInput, toDateInput } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ConvexError } from "convex/values";
import { Loader2 } from "lucide-react";
import { useRef, useState } from "react";

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
  sku?: string;
  genericName?: string;
  form: (typeof FORMS)[number];
  strength?: string;
  category?: string;
  reorderPoint: number;
  notes?: string;
  expiryDate?: number;
  onHandQuantity: number;
  actualQuantity: number;
};

/**
 * Label, control, hint and error as one unit. Pass `id` (the control's id) to
 * render `${id}-hint` / `${id}-error` ids the control can reference through
 * aria-describedby.
 */
export function Field({
  label,
  hint,
  error,
  children,
  id,
  className,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  id?: string;
  className?: string;
}) {
  const errorRef = useRef<HTMLSpanElement>(null);
  useAlertIn(errorRef, Boolean(error));
  return (
    <label className={cn("flex flex-col gap-1.5", className)}>
      <span className="label-caps">{label}</span>
      {children}
      {/* Hint above error: the hint explains, the error corrects. */}
      {hint && !error && (
        <span
          id={id ? `${id}-hint` : undefined}
          className="text-xs text-muted-foreground"
        >
          {hint}
        </span>
      )}
      {error && (
        <span
          ref={errorRef}
          id={id ? `${id}-error` : undefined}
          role="alert"
          className="text-xs font-medium text-destructive"
        >
          {error}
        </span>
      )}
    </label>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="flex min-w-0 flex-col gap-4 border-0 p-0">
      <legend className="label-caps mb-1 w-full">
        <span className="flex items-center gap-3">
          <span className="shrink-0">{title}</span>
          <span aria-hidden className="h-px min-w-4 flex-1 bg-border" />
        </span>
      </legend>
      {children}
    </fieldset>
  );
}

type FieldName =
  | "reorderPoint"
  | "onHandQuantity"
  | "actualQuantity"
  | "expiryDate";

export function MedicineForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial?: Partial<MedicineFormValues>;
  submitLabel: string;
  onSubmit: (values: MedicineFormValues) => Promise<void>;
  onCancel: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const formErrorRef = useRef<HTMLParagraphElement>(null);
  useAlertIn(formErrorRef, error !== null);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<FieldName, string>>
  >({});
  const [saving, setSaving] = useState(false);

  function ariaFor(name: FieldName) {
    const invalid = Boolean(fieldErrors[name]);
    return {
      id: name,
      "aria-invalid": invalid || undefined,
      "aria-describedby": invalid ? `${name}-error` : `${name}-hint`,
    };
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formEl = event.currentTarget;
    setError(null);
    setFieldErrors({});

    const data = new FormData(formEl);
    const reorderPoint = Number(data.get("reorderPoint"));
    const onHandQuantity = Number(data.get("onHandQuantity"));
    const actualQuantity = Number(data.get("actualQuantity"));
    const expiryInput = String(data.get("expiryDate") || "");

    const errors: Partial<Record<FieldName, string>> = {};
    if (!Number.isInteger(reorderPoint) || reorderPoint < 0) {
      errors.reorderPoint =
        "Reorder point must be a whole number, zero or more.";
    }
    if (!Number.isInteger(onHandQuantity) || onHandQuantity < 0) {
      errors.onHandQuantity =
        "On-hand quantity must be a whole number, zero or more.";
    }
    if (!Number.isInteger(actualQuantity) || actualQuantity < 0) {
      errors.actualQuantity =
        "Actual quantity must be a whole number, zero or more.";
    }
    const expiryDate = expiryInput ? fromDateInput(expiryInput) : undefined;
    if (expiryDate !== undefined && !Number.isFinite(expiryDate)) {
      errors.expiryDate = "Expiry date is not valid.";
    }

    // Focus the first invalid field in the form's visual order.
    const order: FieldName[] = [
      "onHandQuantity",
      "actualQuantity",
      "reorderPoint",
      "expiryDate",
    ];
    const first = order.find((n) => errors[n]);
    if (first) {
      setFieldErrors(errors);
      requestAnimationFrame(() => {
        (formEl.elements.namedItem(first) as HTMLElement | null)?.focus();
      });
      return;
    }

    setSaving(true);
    try {
      await onSubmit({
        name: String(data.get("name")),
        sku: String(data.get("sku") || "") || undefined,
        genericName: String(data.get("genericName") || "") || undefined,
        form: String(data.get("form")) as MedicineFormValues["form"],
        strength: String(data.get("strength") || "") || undefined,
        category: String(data.get("category") || "") || undefined,
        reorderPoint,
        notes: String(data.get("notes") || "") || undefined,
        expiryDate,
        onHandQuantity,
        actualQuantity,
      });
    } catch (err) {
      setError(
        err instanceof ConvexError && typeof err.data === "string"
          ? err.data
          : "Could not save. Check the details and try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      <Section title="Details">
        <Field label="Name" hint="What is printed on the box." id="name">
          <Input
            id="name"
            name="name"
            required
            defaultValue={initial?.name}
            aria-describedby="name-hint"
            autoComplete="off"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Generic name"
            hint="Optional. Searchable alongside the brand."
            id="genericName"
          >
            <Input
              id="genericName"
              name="genericName"
              defaultValue={initial?.genericName}
              aria-describedby="genericName-hint"
              autoComplete="off"
            />
          </Field>
          <Field
            label="SKU"
            hint="Optional. Internal or supplier code."
            id="sku"
          >
            <Input
              id="sku"
              name="sku"
              defaultValue={initial?.sku}
              aria-describedby="sku-hint"
              className="font-data"
              autoComplete="off"
            />
          </Field>
          <Field label="Strength" id="strength">
            <Input
              id="strength"
              name="strength"
              placeholder="500 mg"
              defaultValue={initial?.strength}
              autoComplete="off"
            />
          </Field>
          <Field label="Form" id="form">
            <Select name="form" defaultValue={initial?.form ?? "tablet"}>
              <SelectTrigger id="form">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FORMS.map((f) => (
                  <SelectItem key={f} value={f} className="capitalize">
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>

        <Field
          label="Category"
          hint="Optional. Helps you browse and organize medicines."
          id="category"
        >
          <Input
            id="category"
            name="category"
            placeholder="Antibiotics"
            defaultValue={initial?.category}
            aria-describedby="category-hint"
            autoComplete="off"
          />
        </Field>
      </Section>

      <Section title="Stock">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="On-hand quantity"
            hint="What you say you have. Flags as low at the reorder point."
            error={fieldErrors.onHandQuantity}
            id="onHandQuantity"
          >
            <Input
              name="onHandQuantity"
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              required
              defaultValue={initial?.onHandQuantity ?? 0}
              className="font-data"
              {...ariaFor("onHandQuantity")}
            />
          </Field>

          <Field
            label="Actual quantity"
            hint="What you have physically counted."
            error={fieldErrors.actualQuantity}
            id="actualQuantity"
          >
            <Input
              name="actualQuantity"
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              required
              defaultValue={
                initial?.actualQuantity ?? initial?.onHandQuantity ?? 0
              }
              className="font-data"
              {...ariaFor("actualQuantity")}
            />
          </Field>

          <Field
            label="Reorder point"
            hint="Flag as low when on-hand stock falls to this number."
            error={fieldErrors.reorderPoint}
            id="reorderPoint"
          >
            <Input
              name="reorderPoint"
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              required
              defaultValue={initial?.reorderPoint ?? 0}
              className="font-data"
              {...ariaFor("reorderPoint")}
            />
          </Field>
        </div>
      </Section>

      <Section title="Expiry">
        <Field
          label="Expiry date"
          hint="Optional until you have stock with a printed expiry."
          error={fieldErrors.expiryDate}
          id="expiryDate"
          className="sm:max-w-xs"
        >
          <Input
            name="expiryDate"
            type="date"
            defaultValue={
              initial?.expiryDate ? toDateInput(initial.expiryDate) : ""
            }
            className="font-data"
            {...ariaFor("expiryDate")}
          />
        </Field>
      </Section>

      <Section title="Notes">
        <Field label="Notes" id="notes">
          <Textarea
            id="notes"
            name="notes"
            rows={3}
            defaultValue={initial?.notes}
          />
        </Field>
      </Section>

      {error && (
        <p
          ref={formErrorRef}
          role="alert"
          className="text-sm font-medium text-destructive"
        >
          {error}
        </p>
      )}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={saving}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="animate-spin" aria-hidden />}
          {saving ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
