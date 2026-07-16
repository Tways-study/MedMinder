"use client";

import { BatchCard } from "@/components/batch-card";
import { MedicineForm } from "@/components/medicine-form";
import {
  CardSkeleton,
  EmptyState,
  Page,
  PageHeader,
} from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  DEFAULT_ALERT_TIERS,
  expiryTier,
  formatExpiryDistance,
} from "@/convex/lib/inventory";
import { formatDate, formatQuantity } from "@/lib/format";
import { useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function MedicineDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const medicineId = params.id as Id<"medicines">;

  const medicine = useQuery(api.medicines.get, { medicineId });
  const batches = useQuery(api.batches.listByMedicine, { medicineId });
  const update = useMutation(api.medicines.update);
  const remove = useMutation(api.medicines.remove);

  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const now = Date.now();

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

  const live = (batches ?? []).filter((b) => b.status !== "depleted");
  const total = live.reduce((sum, b) => sum + b.quantityExpected, 0);
  const low = total <= medicine.reorderPoint;

  return (
    <Page>
      <PageHeader
        title={medicine.name}
        subtitle={
          [medicine.strength, medicine.form, medicine.genericName]
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
        <div className="flex-1 rounded-lg border bg-card p-4">
          <p className="label-field">On hand</p>
          <p className="font-data mt-1 text-2xl font-medium leading-none">
            {formatQuantity(total)}
          </p>
        </div>
        <div className="flex-1 rounded-lg border bg-card p-4">
          <p className="label-field">Reorder at</p>
          <p className="font-data mt-1 text-2xl font-medium leading-none">
            {formatQuantity(medicine.reorderPoint)}
          </p>
          {low && (
            <p className="mt-1 text-xs font-medium text-primary">
              At or below reorder point
            </p>
          )}
        </div>
      </div>

      {medicine.notes && (
        <p className="rounded-lg border bg-card p-4 text-sm">{medicine.notes}</p>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-medium">
          Lots{live.length > 0 ? ` (${live.length})` : ""}
        </h2>

        {batches === undefined && <CardSkeleton count={2} />}

        {batches && live.length === 0 && (
          <EmptyState
            title="No lots on the shelf"
            body="Lots arrive with a delivery. Log one to start tracking expiry for this medicine."
            action={
              <Button asChild className="mt-1">
                <Link href="/deliveries/new">Log a delivery</Link>
              </Button>
            }
          />
        )}

        {/* No medicineName: the page header already names the drug. */}
        {live.map((batch) => (
          <BatchCard
            key={batch._id}
            lotNumber={batch.lotNumber}
            expiryLabel={formatDate(batch.expiryDate)}
            expiryDistance={formatExpiryDistance(batch.expiryDate, now)}
            secondaryLabel="Received"
            secondaryValue={formatDate(batch.receivedDate)}
            quantity={batch.quantityExpected}
            tier={expiryTier(batch.expiryDate, now, DEFAULT_ALERT_TIERS)}
          />
        ))}
      </section>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <section className="mt-4 border-t pt-5">
        <Button
          variant="outline"
          className="text-destructive"
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
        <p className="mt-2 text-xs text-muted-foreground">
          Only possible once its lots are gone. Removing it would erase the
          movement history behind any variance.
        </p>
      </section>
    </Page>
  );
}
