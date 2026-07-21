"use client";

import { MedicineForm } from "@/components/medicine-form";
import {
  CardSkeleton,
  EmptyState,
  Page,
  PageHeader,
} from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { formatDate, formatQuantity } from "@/lib/format";
import { useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

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
    <div className="min-w-[7.5rem] flex-1 rounded-lg border bg-card p-4">
      <p className="label-field">{label}</p>
      <p className="font-data mt-1 text-2xl font-medium leading-none">{value}</p>
      {flag && <p className="mt-1 text-xs font-medium text-primary">{flag}</p>}
    </div>
  );
}

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
    <div className="min-w-[7.5rem] flex-1 rounded-lg border bg-card p-4">
      <p className="label-field">Variance</p>
      <p className={`font-data mt-1 text-2xl font-medium leading-none ${styles.value}`}>
        {valueStr}
      </p>
      <p className={`mt-1 text-xs font-medium ${styles.value}`}>{styles.label}</p>
    </div>
  );
}

export default function MedicineDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const medicineId = params.id as Id<"medicines">;

  const medicine = useQuery(api.medicines.get, { medicineId });
  const update = useMutation(api.medicines.update);
  const remove = useMutation(api.medicines.remove);

  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  if (medicine === undefined) {
    return (
      <Page>
        <CardSkeleton count={4} />
      </Page>
    );
  }

  if (medicine === null) {
    return (
      <Page>
        <EmptyState
          title="That medicine is gone"
          body="It may have been removed on another device."
          action={
            <Button asChild variant="outline" className="mt-1">
              <Link href="/medicines">Back to medicines</Link>
            </Button>
          }
        />
      </Page>
    );
  }

  if (editing) {
    return (
      <Page>
        <PageHeader title="Edit medicine" subtitle={medicine.name} />
        <MedicineForm
          initial={medicine}
          submitLabel="Save changes"
          onCancel={() => setEditing(false)}
          onSubmit={async (values) => {
            await update({ medicineId, ...values });
            setEditing(false);
          }}
        />
      </Page>
    );
  }

  const low = medicine.onHandQuantity <= medicine.reorderPoint;
  const variance = medicine.onHandQuantity - medicine.actualQuantity;

  return (
    <Page>
      <PageHeader
        title={medicine.name}
        subtitle={
          [
            medicine.strength,
            medicine.form,
            medicine.genericName,
            medicine.sku ? `SKU: ${medicine.sku}` : undefined,
          ]
            .filter(Boolean)
            .join(" · ") || undefined
        }
        action={
          <Button variant="outline" onClick={() => setEditing(true)}>
            Edit
          </Button>
        }
      />

      <div className="flex flex-wrap gap-3">
        <StatTile
          label="On hand"
          value={formatQuantity(medicine.onHandQuantity)}
          flag={low ? "At or below reorder point" : undefined}
        />
        <StatTile label="Actual" value={formatQuantity(medicine.actualQuantity)} />
        <VarianceTile variance={variance} />
        <StatTile
          label="Expires"
          value={medicine.expiryDate ? formatDate(medicine.expiryDate) : "—"}
        />
      </div>

      {medicine.notes && (
        <p className="rounded-lg border bg-card p-4 text-sm">{medicine.notes}</p>
      )}

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <section className="mt-4 border-t pt-5">
        {!confirmingDelete ? (
          <Button
            variant="outline"
            className="text-destructive"
            onClick={() => {
              setError(null);
              setConfirmingDelete(true);
            }}
          >
            Remove medicine
          </Button>
        ) : (
          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">
                Type <span className="font-data">{medicine.name}</span> to confirm
              </span>
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                autoFocus
                className="h-11"
                autoComplete="off"
              />
            </label>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="h-11 flex-1 text-destructive"
                disabled={confirmText.trim() !== medicine.name}
                onClick={async () => {
                  setError(null);
                  try {
                    await remove({ medicineId });
                    router.push("/medicines");
                  } catch (err) {
                    setError(
                      err instanceof ConvexError
                        ? String(err.data)
                        : "Could not remove this medicine.",
                    );
                  }
                }}
              >
                Remove medicine
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-11"
                onClick={() => {
                  setConfirmingDelete(false);
                  setConfirmText("");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
        <p className="mt-2 text-xs text-muted-foreground">
          This removes the medicine and its stock numbers. It cannot be undone.
        </p>
      </section>
    </Page>
  );
}
