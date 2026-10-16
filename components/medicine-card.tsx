"use client";

import {
  MedicineForm,
  type MedicineFormValues,
} from "@/components/medicine-form";
import { LowStockBadge, TierBadge, tierClasses } from "@/components/tier-badge";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { ExpiryTier } from "@/convex/lib/inventory";
import { formatForm, formatQuantity } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Minus, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  RollingNumber,
  usePressFeedback,
} from "@/components/motion";
import { gsap, useGSAP } from "@/lib/gsap";
import { DUR, EASE, MOTION_OK } from "@/lib/motion";
import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import Link from "next/link";
import { useRef, useState } from "react";

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

  const wrapRef = useRef<HTMLDivElement>(null);
  const skipFirst = useRef(true);
  const isLow = medicine.onHandQuantity <= medicine.reorderPoint;

  // View <-> edit swap: the incoming side fades up 6px. Not on first mount.
  useGSAP(
    () => {
      if (skipFirst.current) {
        skipFirst.current = false;
        return;
      }
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.from(wrapRef.current, {
          autoAlpha: 0,
          y: 6,
          duration: DUR.base,
          ease: EASE.out,
          clearProps: "transform,opacity,visibility",
        });
      });
      return () => mm.revert();
    },
    { scope: wrapRef, dependencies: [isEditing] },
  );

  const meta = [formatForm(medicine.form), medicine.strength]
    .filter(Boolean)
    .join(", ");

  return (
    <div ref={wrapRef} data-stamp-card>
      {isEditing ? (
        <div className={cn("px-4 py-4", className)}>
          <MedicineForm
            initial={medicine}
            submitLabel="Save changes"
            onCancel={onToggleEdit}
            onSubmit={async (values) => {
              setFormError(null);
              try {
                await update({ medicineId: medicine._id, ...values });
                toast.success(`Saved ${values.name}`);
                onToggleEdit();
              } catch (err) {
                setFormError(
                  err instanceof ConvexError
                    ? String(err.data)
                    : "Could not save. Check the details and try again.",
                );
                toast.error("Could not save changes");
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
      ) : (
        <article
          className={cn(
            "flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6",
            className,
          )}
        >
          <div className="flex min-w-0 flex-1 items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <Link
                href={`/medicines/${medicine._id}`}
                className="focus-card -mx-1 block rounded-md px-1 hover:underline"
              >
                <h3 className="truncate font-serif text-lg font-medium leading-tight">
                  {medicine.name}
                </h3>
              </Link>
              {meta && (
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {meta}
                </p>
              )}
              {(tier || isLow || expiryDistance) && (
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                  {tier && <TierBadge tier={tier} />}
                  {isLow && <LowStockBadge />}
                  {expiryDistance && (
                    <span className="text-xs text-muted-foreground">
                      {expiryDistance}
                    </span>
                  )}
                </div>
              )}
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={onToggleEdit}
              aria-label={`Edit ${medicine.name}`}
              className="-mr-2 size-11 shrink-0 text-muted-foreground hover:text-foreground sm:hidden"
            >
              <Pencil className="size-4" strokeWidth={1.75} aria-hidden />
            </Button>
          </div>

          <div className="flex items-center justify-between gap-3 sm:justify-end">
            <div className="min-w-0 sm:text-right">
              <p className="label-caps">{activeLabel}</p>
              {driftText && (
                <p
                  className={cn(
                    "mt-0.5 text-xs",
                    diff < 0
                      ? tierClasses("critical").fg
                      : tierClasses("watch").fg,
                  )}
                >
                  {driftText}
                </p>
              )}
            </div>
            <QuantityStepper
              medicineId={medicine._id}
              kind={activeKind}
              value={activeQuantity}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={onToggleEdit}
              aria-label={`Edit ${medicine.name}`}
              className="hidden shrink-0 text-muted-foreground hover:text-foreground sm:inline-flex"
            >
              <Pencil className="size-4" strokeWidth={1.75} aria-hidden />
            </Button>
          </div>
        </article>
      )}
    </div>
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
          {
            ...current,
            [kind === "onHand" ? "onHandQuantity" : "actualQuantity"]: quantity,
          },
        );
      }
      const list = localStore.getQuery(api.medicines.list, {});
      if (list) {
        localStore.setQuery(
          api.medicines.list,
          {},
          list.map((m) =>
            m._id === medicineId
              ? {
                  ...m,
                  [kind === "onHand" ? "onHandQuantity" : "actualQuantity"]:
                    quantity,
                }
              : m,
          ),
        );
      }
    },
  );

  const press = usePressFeedback();
  const [typing, setTyping] = useState(false);
  const [draft, setDraft] = useState(String(value));

  function commit(next: number) {
    if (!Number.isInteger(next) || next < 0) {
      setDraft(String(value));
      return;
    }
    setStock({ medicineId, kind, quantity: next }).catch(() => {
      setDraft(String(value));
      toast.error("Could not update the count. Try again.");
    });
  }

  function nudge(delta: number) {
    // A short tick on phones that support it: the count changed, and the
    // hand should know without looking. Silent where vibrate is unsupported.
    navigator.vibrate?.(8);
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
        className="font-data h-11 w-24 touch-manipulation rounded-md border border-input bg-card px-2 text-center text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:h-8"
      />
    );
  }

  const STEP_BTN =
    "size-11 touch-manipulation transition-colors active:scale-100 sm:size-8";

  return (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        onClick={() => nudge(-1)}
        aria-label="Decrease"
        className={STEP_BTN}
        {...press}
      >
        <Minus className="size-4" strokeWidth={1.75} aria-hidden />
      </Button>
      <button
        type="button"
        onClick={() => {
          setDraft(String(value));
          setTyping(true);
        }}
        aria-label={`${formatQuantity(value)}, tap to type an exact count`}
        className="font-data flex h-11 w-14 touch-manipulation items-center justify-center rounded-md px-2 text-base font-semibold transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:bg-muted sm:h-8"
      >
        <RollingNumber value={value} format={formatQuantity} />
      </button>
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        onClick={() => nudge(1)}
        aria-label="Increase"
        className={STEP_BTN}
        {...press}
      >
        <Plus className="size-4" strokeWidth={1.75} aria-hidden />
      </Button>
    </div>
  );
}
