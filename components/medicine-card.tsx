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
    <article
      className={cn(
        "group relative rounded-xl border border-border/80 bg-card p-4 shadow-sm transition-all duration-200 hover:border-orchid/40 hover:shadow-md",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <Link href={`/medicines/${medicine._id}`} className="focus-card min-w-0 flex-1 rounded-md">
          <h3 className="font-display text-lg font-semibold leading-snug tracking-tight text-foreground transition-colors group-hover:text-orchid">
            {medicine.name}
          </h3>
          {(medicine.strength || medicine.form) && (
            <p className="mt-0.5 text-xs font-medium text-muted-foreground">
              {[medicine.strength, medicine.form].filter(Boolean).join(" · ")}
            </p>
          )}
        </Link>

        <button
          type="button"
          onClick={onToggleEdit}
          aria-label={`Edit ${medicine.name}`}
          className="focus-card flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/30 text-muted-foreground transition-all hover:border-orchid/40 hover:bg-orchid/10 hover:text-orchid"
        >
          <Pencil1Icon className="h-4 w-4" />
        </button>
      </div>

      {tier && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <TierBadge tier={tier} />
          {expiryDistance && (
            <span className="text-xs font-medium text-muted-foreground">
              expires {expiryDistance}
            </span>
          )}
        </div>
      )}

      <div className="mt-3.5 flex items-center justify-between border-t border-border/60 pt-3">
        <QuantityStepper
          medicineId={medicine._id}
          kind={activeKind}
          value={activeQuantity}
        />
        <div className="flex flex-col items-end gap-1">
          <span className="text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground">
            {activeLabel}
          </span>
          {driftText && (
            <span
              className={cn(
                "inline-flex items-center rounded-md px-2 py-0.5 text-[0.7rem] font-medium tracking-tight shadow-2xs",
                diff < 0
                  ? "bg-rose-100 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/50"
                  : "bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/50",
              )}
            >
              {driftText}
            </span>
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
        className="font-data h-9 w-20 rounded-lg border border-primary bg-background px-2.5 text-center text-base font-semibold shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
    );
  }

  return (
    <div className="flex items-center rounded-xl border border-border/80 bg-muted/40 p-1 shadow-2xs">
      <button
        type="button"
        onClick={() => nudge(-1)}
        aria-label="Decrease"
        className="flex h-8 w-8 touch-manipulation items-center justify-center rounded-lg border border-border/50 bg-card text-muted-foreground shadow-2xs transition-all hover:bg-secondary hover:text-foreground active:scale-95"
      >
        <MinusIcon className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => {
          setDraft(String(value));
          setTyping(true);
        }}
        className="font-data h-8 min-w-[3rem] touch-manipulation px-2 text-center text-base font-bold tracking-tight text-foreground transition-colors hover:text-orchid"
      >
        {formatQuantity(value)}
      </button>
      <button
        type="button"
        onClick={() => nudge(1)}
        aria-label="Increase"
        className="flex h-8 w-8 touch-manipulation items-center justify-center rounded-lg border border-border/50 bg-card text-muted-foreground shadow-2xs transition-all hover:bg-secondary hover:text-foreground active:scale-95"
      >
        <PlusIcon className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
