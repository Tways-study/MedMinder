"use client";

import { TierBadge } from "@/components/tier-badge";
import { Input } from "@/components/ui/input";
import { DEFAULT_ALERT_TIERS, expiryTier, variance } from "@/convex/lib/inventory";
import { formatDate, formatQuantity } from "@/lib/format";
import { cn } from "@/lib/utils";

const REASONS = [
  { value: "unrecorded_sale", label: "Sold, not recorded" },
  { value: "damaged", label: "Damaged" },
  { value: "expired", label: "Expired, pulled" },
  { value: "miscount", label: "Earlier miscount" },
  { value: "other", label: "Other" },
] as const;

export type CountLine = {
  _id: string;
  batchId: string;
  expectedQty: number;
  countedQty?: number;
  reason?: string;
  medicineName: string;
  strength?: string;
  form: string;
  lotNumber: string;
  expiryDate: number;
};

/**
 * One lot to count.
 *
 * The expected quantity is deliberately hidden until she has entered a number.
 * Showing it first turns counting into confirming: the eye finds the printed
 * figure and the hand agrees with it. Blind counting is the standard practice
 * for exactly this reason, and a count that only ever agrees with the system
 * cannot detect the discrepancy this app exists to surface.
 */
export function CountLineCard({
  line,
  value,
  onChange,
  onReason,
  revealed,
}: {
  line: CountLine;
  value: string;
  onChange: (value: string) => void;
  onReason: (reason: string) => void;
  /** After entry, the variance is shown so she can correct a slip on the spot. */
  revealed: boolean;
}) {
  const counted = value === "" ? undefined : Number(value);
  const valid = counted !== undefined && Number.isInteger(counted) && counted >= 0;
  const v = valid ? variance(line.expectedQty, counted) : null;
  const tier = expiryTier(line.expiryDate, Date.now(), DEFAULT_ALERT_TIERS);

  return (
    <article className="flex flex-col gap-3 rounded-lg border bg-card p-4">
      <div>
        <h3 className="font-display text-lg font-medium leading-snug">
          {line.medicineName}
        </h3>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {[line.strength, line.form].filter(Boolean).join(" · ")}
        </p>
      </div>

      <dl className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <div>
          <dt className="label-field">Lot</dt>
          <dd className="font-data mt-0.5 text-sm">{line.lotNumber}</dd>
        </div>
        <div>
          <dt className="label-field">Expires</dt>
          <dd className="font-data mt-0.5 whitespace-nowrap text-sm">
            {formatDate(line.expiryDate)}
          </dd>
        </div>
        {tier !== "ok" && <TierBadge tier={tier} />}
      </dl>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Counted on the shelf</span>
        <Input
          type="number"
          inputMode="numeric"
          min={0}
          step={1}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Count, then type"
          // 48px and full width: a thumb target while holding a box.
          className="font-data h-12 text-base"
        />
      </label>

      {revealed && v && (
        <div
          className={cn(
            "flex flex-col gap-2 rounded-sm px-3 py-2 text-sm",
            v.direction === "match" && "bg-tier-ok-bg text-tier-ok",
            v.direction === "short" && "bg-tier-expired-bg text-tier-expired",
            v.direction === "over" && "bg-tier-watch-bg text-tier-watch",
          )}
        >
          <p className="font-medium">
            {v.direction === "match"
              ? `Matches the system: ${formatQuantity(line.expectedQty)}`
              : v.direction === "short"
                ? `Short ${formatQuantity(Math.abs(v.delta))}. System expected ${formatQuantity(line.expectedQty)}.`
                : `Over ${formatQuantity(v.delta)}. System expected ${formatQuantity(line.expectedQty)}.`}
          </p>

          {v.direction !== "match" && (
            <select
              value={line.reason ?? ""}
              onChange={(e) => onReason(e.target.value)}
              aria-label={`Reason for variance on lot ${line.lotNumber}`}
              className="h-10 rounded-sm border border-input bg-background px-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Why? (optional)</option>
              {REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {value !== "" && !valid && (
        <p role="alert" className="text-sm text-destructive">
          Enter a whole number of units, zero or more.
        </p>
      )}
    </article>
  );
}
