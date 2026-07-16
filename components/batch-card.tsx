import { TierBadge } from "@/components/tier-badge";
import type { ExpiryTier } from "@/convex/lib/inventory";
import { formatQuantity } from "@/lib/format";
import { cn } from "@/lib/utils";

const STRIPE: Record<ExpiryTier, string> = {
  expired: "bg-tier-expired-stripe",
  critical: "bg-tier-critical-stripe",
  warning: "bg-tier-warning-stripe",
  watch: "bg-tier-watch-stripe",
  ok: "bg-tier-ok-stripe",
};

const DISTANCE_TEXT: Record<ExpiryTier, string> = {
  expired: "text-tier-expired",
  critical: "text-tier-critical",
  warning: "text-tier-warning",
  watch: "text-tier-watch",
  ok: "text-muted-foreground",
};

/*
  The signature element: a batch rendered as a dispensing label.

  A lot on a pharmacy shelf already has a canonical visual form — the gummed
  label, with its ruled fields and stamped lot and expiry. This borrows that
  form: field names small and letterspaced, values in mono so they read against
  the physical box, and a severity stripe down the binding edge.

  Layout is driven by a 390px phone held one-handed. The quantity sits in the
  header because it is the number being compared against the shelf, and the
  expiry phrasing gets its own line so neither it nor the date can ever wrap.
  The stripe repeats the badge's tier rather than replacing it: the stripe is
  glanceable down a list, the badge is the accessible signal.
*/
export function BatchCard({
  medicineName,
  strength,
  form,
  lotNumber,
  expiryLabel,
  expiryDistance,
  secondaryLabel,
  secondaryValue,
  quantity,
  tier,
  className,
}: {
  /**
   * Omit on a single medicine's page, where the header already names the drug
   * and repeating it on every lot is noise. The lot number leads instead.
   */
  medicineName?: string;
  strength?: string;
  form?: string;
  lotNumber: string;
  expiryLabel: string;
  expiryDistance: string;
  /** Replaces the Lot field when the lot is already the title. */
  secondaryLabel?: string;
  secondaryValue?: string;
  quantity: number;
  tier: ExpiryTier;
  className?: string;
}) {
  const leadsWithLot = medicineName === undefined;

  return (
    <article
      className={cn("relative overflow-hidden rounded-lg border bg-card", className)}
    >
      <span
        className={cn("absolute inset-y-0 left-0 w-1", STRIPE[tier])}
        aria-hidden
      />

      <div className="flex flex-col gap-3 py-4 pl-5 pr-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            {leadsWithLot ? (
              <>
                <h3 className="font-data text-base font-medium leading-snug">
                  {lotNumber}
                </h3>
                <p className="label-field mt-0.5">Lot</p>
              </>
            ) : (
              <>
                {/*
                  Wraps rather than truncates: the name is what she matches
                  against the box, so hiding part of it risks the wrong pull.
                */}
                <h3 className="font-display text-lg font-medium leading-snug">
                  {medicineName}
                </h3>
                {(strength || form) && (
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {[strength, form].filter(Boolean).join(" · ")}
                  </p>
                )}
              </>
            )}
          </div>

          <div className="shrink-0 text-right">
            <p className="font-data text-2xl font-medium leading-none">
              {formatQuantity(quantity)}
            </p>
            <p className="label-field mt-1">On hand</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <TierBadge tier={tier} />
          <span className={cn("text-sm", DISTANCE_TEXT[tier])}>
            {expiryDistance}
          </span>
        </div>

        <dl className="grid grid-cols-2 gap-4 border-t pt-3">
          <div className="min-w-0">
            <dt className="label-field">Expires</dt>
            <dd className="font-data mt-0.5 whitespace-nowrap text-sm">
              {expiryLabel}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="label-field">
              {leadsWithLot ? (secondaryLabel ?? "Received") : "Lot"}
            </dt>
            <dd className="font-data mt-0.5 truncate text-sm">
              {leadsWithLot ? (secondaryValue ?? "—") : lotNumber}
            </dd>
          </div>
        </dl>
      </div>
    </article>
  );
}
