"use client";

import { usePressFeedback } from "@/components/motion";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { formatQuantity } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useMutation } from "convex/react";
import { Minus, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

/**
 * The always-visible quick-edit control: −/+ for a single-unit nudge, or tap
 * the number to type an exact value. Validates on blur (per the app's touch
 * guidelines) rather than only on submit, and reverts to the last known-good
 * value on invalid input instead of silently saving garbage.
 */
export function QuantityStepper({
  medicineId,
  kind,
  value,
  compact = false,
  label,
}: {
  medicineId: Id<"medicines">;
  kind: "onHand" | "actual";
  value: number;
  /** Table-row density: 28px controls, no 44px touch sizing. */
  compact?: boolean;
  /** Names the count for screen readers, e.g. "Amoxicillin on hand". */
  label?: string;
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
        className={cn(
          "font-data touch-manipulation rounded-md border border-input bg-card px-2 text-center text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          compact ? "h-7 w-20 text-sm" : "h-11 w-24 sm:h-8",
        )}
      />
    );
  }

  const STEP_BTN = cn(
    "touch-manipulation transition-colors active:scale-100",
    compact ? "size-7 sm:size-7" : "size-11 sm:size-8",
  );

  return (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        onClick={() => nudge(-1)}
        aria-label={label ? `Decrease ${label}` : "Decrease"}
        className={STEP_BTN}
        {...press}
      >
        <Minus className={compact ? "size-3.5" : "size-4"} strokeWidth={1.75} aria-hidden />
      </Button>
      <button
        type="button"
        onClick={() => {
          setDraft(String(value));
          setTyping(true);
        }}
        aria-label={`${label ? `${label}: ` : ""}${formatQuantity(value)}, tap to type an exact count`}
        className={cn(
          "font-data flex touch-manipulation items-center justify-center rounded-md px-2 font-semibold transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:bg-muted",
          compact ? "h-7 min-w-10 text-sm" : "h-11 w-14 text-base sm:h-8",
        )}
      >
        {formatQuantity(value)}
      </button>
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        onClick={() => nudge(1)}
        aria-label={label ? `Increase ${label}` : "Increase"}
        className={STEP_BTN}
        {...press}
      >
        <Plus className={compact ? "size-3.5" : "size-4"} strokeWidth={1.75} aria-hidden />
      </Button>
    </div>
  );
}
