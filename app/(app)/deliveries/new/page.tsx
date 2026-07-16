"use client";

import { Field } from "@/components/medicine-form";
import { EmptyState, Page, PageHeader } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { fromDateInput, toDateInput } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { Cross2Icon } from "@radix-ui/react-icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Line = {
  key: number;
  medicineId: string;
  lotNumber: string;
  expiryDate: string;
  quantity: string;
};

const emptyLine = (key: number): Line => ({
  key,
  medicineId: "",
  lotNumber: "",
  expiryDate: "",
  quantity: "",
});

export default function NewDeliveryPage() {
  const router = useRouter();
  const medicines = useQuery(api.medicines.list);
  const create = useMutation(api.deliveries.create);

  const [lines, setLines] = useState<Line[]>([emptyLine(0)]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const updateLine = (key: number, patch: Partial<Line>) =>
    setLines((prev) =>
      prev.map((l) => (l.key === key ? { ...l, ...patch } : l)),
    );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const data = new FormData(event.currentTarget);

    const parsed = [];
    for (const [i, line] of lines.entries()) {
      if (!line.medicineId) {
        setError(`Line ${i + 1}: choose a medicine.`);
        return;
      }
      const quantity = Number(line.quantity);
      if (!Number.isInteger(quantity) || quantity <= 0) {
        setError(`Line ${i + 1}: quantity must be a whole number above zero.`);
        return;
      }
      if (!line.expiryDate) {
        setError(`Line ${i + 1}: add the expiry date printed on the box.`);
        return;
      }
      parsed.push({
        medicineId: line.medicineId as Id<"medicines">,
        lotNumber: line.lotNumber,
        expiryDate: fromDateInput(line.expiryDate),
        quantity,
      });
    }

    setSaving(true);
    try {
      await create({
        receivedDate: fromDateInput(String(data.get("receivedDate"))),
        supplier: String(data.get("supplier")),
        invoiceRef: String(data.get("invoiceRef") || "") || undefined,
        lines: parsed,
      });
      router.push("/deliveries");
    } catch (err) {
      setError(
        err instanceof ConvexError
          ? String(err.data)
          : "Could not save the delivery. Nothing was recorded.",
      );
      setSaving(false);
    }
  }

  if (medicines && medicines.length === 0) {
    return (
      <Page>
        <PageHeader title="Log delivery" />
        <EmptyState
          title="No medicines to receive yet"
          body="A delivery adds lots to medicines you already stock. Add a medicine first."
          action={
            <Button asChild className="mt-1">
              <Link href="/medicines/new">Add a medicine</Link>
            </Button>
          }
        />
      </Page>
    );
  }

  return (
    <Page>
      <PageHeader
        title="Log delivery"
        subtitle="Each line becomes a lot on the shelf, with its own expiry."
      />

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Received">
            <Input
              name="receivedDate"
              type="date"
              required
              defaultValue={toDateInput(Date.now())}
              className="font-data h-11"
            />
          </Field>
          <Field label="Supplier">
            <Input name="supplier" required className="h-11" autoComplete="off" />
          </Field>
        </div>

        <Field label="Invoice reference" hint="Optional.">
          <Input name="invoiceRef" className="font-data h-11" autoComplete="off" />
        </Field>

        <section className="flex flex-col gap-3">
          <h2 className="font-display text-lg font-medium">Lots received</h2>

          {lines.map((line, i) => (
            <fieldset
              key={line.key}
              className="relative flex flex-col gap-4 rounded-lg border bg-card p-4"
            >
              <legend className="sr-only">Line {i + 1}</legend>

              {lines.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-2 h-8 w-8"
                  onClick={() =>
                    setLines((prev) => prev.filter((l) => l.key !== line.key))
                  }
                >
                  <Cross2Icon className="h-4 w-4" />
                  <span className="sr-only">Remove line {i + 1}</span>
                </Button>
              )}

              <Field label="Medicine">
                <select
                  value={line.medicineId}
                  onChange={(e) =>
                    updateLine(line.key, { medicineId: e.target.value })
                  }
                  required
                  className={cn(
                    "h-11 rounded-sm border border-input bg-background px-3 text-sm",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  )}
                >
                  <option value="">Choose a medicine</option>
                  {(medicines ?? []).map((m) => (
                    <option key={m._id} value={m._id}>
                      {[m.name, m.strength].filter(Boolean).join(" ")}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Lot number" hint="As printed on the box.">
                <Input
                  value={line.lotNumber}
                  onChange={(e) =>
                    updateLine(line.key, { lotNumber: e.target.value })
                  }
                  required
                  className="font-data h-11"
                  autoComplete="off"
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Expires">
                  <Input
                    type="date"
                    value={line.expiryDate}
                    onChange={(e) =>
                      updateLine(line.key, { expiryDate: e.target.value })
                    }
                    required
                    className="font-data h-11"
                  />
                </Field>
                <Field label="Quantity">
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    step={1}
                    value={line.quantity}
                    onChange={(e) =>
                      updateLine(line.key, { quantity: e.target.value })
                    }
                    required
                    className="font-data h-11"
                  />
                </Field>
              </div>
            </fieldset>
          ))}

          <Button
            type="button"
            variant="secondary"
            className="h-11"
            onClick={() =>
              setLines((prev) => [
                ...prev,
                // Carry the supplier context forward by starting clean: the lot
                // and expiry differ per line, so prefilling them would invite a
                // wrong date being saved by accident.
                emptyLine(Math.max(...prev.map((l) => l.key)) + 1),
              ])
            }
          >
            Add another lot
          </Button>
        </section>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <Button type="submit" disabled={saving} className="h-11 flex-1">
            {saving ? "Saving…" : "Log delivery"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-11"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Page>
  );
}
