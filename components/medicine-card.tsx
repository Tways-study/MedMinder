"use client";

import { MedicineForm, type MedicineFormValues } from "@/components/medicine-form";
import { TierBadge } from "@/components/tier-badge";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { ExpiryTier } from "@/convex/lib/inventory";
import { formatQuantity } from "@/lib/format";
import { cn } from "@/lib/utils";
import { MinusIcon, Pencil1Icon, PlusIcon } from "@radix-ui/react-icons";
import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import Link from "next/link";
import { useState } from "react";

export type MedicineCardData = {
  _id: Id<"medicines">;
  name: string;
  genericName?: string;
  form: MedicineFormValues["form"];
  strength?: string;
  category?: string;
  reorderPoint: number;
  notes?: string;
  expiryDate?: number;
  onHandQuantity: number;
  actualQuantity: number;
};

/**
 * One medicine, everywhere it shows up on the dashboard (tier alerts,
 * running low, and the flat Actual-tab walk). Replaces the old lot-oriented
 * BatchCard: there is only one entity now, so the card always leads with the
 * medicine name.
 *
 * Name/subtitle are wrapped in a scoped Link rather than the whole card,
 * because the card has interactive children (stepper, edit button) —
 * nesting buttons inside an <a> is invalid HTML.
 */
export function MedicineCard({
  medicine,
  activeKind,
  tier,
  expiryDistance,
  isEditing,
  onToggleEdit,
  className,
}: {
  medicine: MedicineCardData;
  activeKind: "onHand" | "actual";
  tier?: ExpiryTier;
  expiryDistance?: string;
  isEditing: boolean;
  onToggleEdit: () => void;
  className?: string;
}) {
  const update = useMutation(api.medicines.update);
  const [formError, setFormError] = useState<string | null>(null);

  if (isEditing) {
    return (
      <div className={cn("rounded-lg border bg-card p-4", className)}>
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
      </div>
    );
  }

  const activeQuantity =
    activeKind === "onHand" ? medicine.onHandQuantity : medicine.actualQuantity;
  const otherQuantity =
    activeKind === "onHand" ? medicine.actualQuantity : medicine.onHandQuantity;
  const activeLabel = activeKind === "onHand" ? "On hand" : "Actual";

  const diff = activeQuantity - otherQuantity;
  const driftText =
    diff === 0
      ? null
      : `${Math.abs(diff)} ${diff < 0 ? "short of" : "over"} ${
          activeKind === "onHand" ? "actual count" : "on hand"
        }`;

  return (
    <article className={cn("rounded-lg border bg-card p-4", className)}>
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
    </article>
  );
}

/**
 * The always-visible quick-edit control: −/+ for a single-unit nudge, or tap
 * the number to type an exact value. Validates on blur (per the app's touch
 * guidelines) rather than only on submit, and reverts to the last known-good
 * value on invalid input instead of silently saving garbage.
 */
function QuantityStepper({
  medicineId,
  kind,
  value,
}: {
  medicineId: Id<"medicines">;
  kind: "onHand" | "actual";
  value: number;
}) {
  const setStock = useMutation(api.medicines.setStock).withOptimisticUpdate(
    (localStore, { medicineId, kind, quantity }) => {
      const current = localStore.getQuery(api.medicines.get, { medicineId });
      if (current) {
        localStore.setQuery(
          api.medicines.get,
          { medicineId },
          { ...current, [kind === "onHand" ? "onHandQuantity" : "actualQuantity"]: quantity },
        );
      }
      const list = localStore.getQuery(api.medicines.list, {});
      if (list) {
        localStore.setQuery(
          api.medicines.list,
          {},
          list.map((m) =>
            m._id === medicineId
              ? { ...m, [kind === "onHand" ? "onHandQuantity" : "actualQuantity"]: quantity }
              : m,
          ),
        );
      }
    },
  );

  const [typing, setTyping] = useState(false);
  const [draft, setDraft] = useState(String(value));

  function commit(next: number) {
    if (!Number.isInteger(next) || next < 0) {
      setDraft(String(value));
      return;
    }
    void setStock({ medicineId, kind, quantity: next });
  }

  function nudge(delta: number) {
    commit(Math.max(0, value + delta));
  }

  if (typing) {
    return (
      <input
        type="number"
        inputMode="numeric"
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onFocus={(e) => e.currentTarget.select()}
        onBlur={() => {
          const parsed = Number(draft);
          commit(parsed);
          setTyping(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") {
            setDraft(String(value));
            setTyping(false);
          }
        }}
        className="font-data h-11 w-20 rounded-sm border border-input bg-background px-2 text-lg touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
    );
  }

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => nudge(-1)}
        aria-label="Decrease"
        className="flex h-11 w-11 touch-manipulation items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      >
        <MinusIcon className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => {
          setDraft(String(value));
          setTyping(true);
        }}
        className="font-data h-11 min-w-[3.5rem] touch-manipulation rounded-sm text-center text-lg font-medium transition-colors hover:bg-secondary"
      >
        {formatQuantity(value)}
      </button>
      <button
        type="button"
        onClick={() => nudge(1)}
        aria-label="Increase"
        className="flex h-11 w-11 touch-manipulation items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      >
        <PlusIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
