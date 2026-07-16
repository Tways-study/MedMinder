export type VarianceDirection = "short" | "over" | "match";

export type Variance = {
  delta: number;
  direction: VarianceDirection;
};

export type ExpiryTier = "expired" | "critical" | "warning" | "watch" | "ok";

export type AlertTiers = {
  critical: number;
  warning: number;
  watch: number;
};

/**
 * The `watch` tier exists so "expires in 5 months" surfaces as an alert while
 * there is still time to return the lot to the supplier.
 */
export const DEFAULT_ALERT_TIERS: AlertTiers = {
  critical: 30,
  warning: 90,
  watch: 180,
};

const DAY_MS = 24 * 60 * 60 * 1000;

/** No pharmacy shelf holds ten million units; beyond this it's a typo. */
const MAX_QUANTITY = 10_000_000;

/**
 * Quantities reach us from hand-typed forms, so they are checked before they
 * touch a batch balance rather than trusted as `v.number()`.
 */
export function isValidQuantity(value: number): boolean {
  return (
    Number.isInteger(value) && value >= 0 && value <= MAX_QUANTITY
  );
}

export function variance(expectedQty: number, countedQty: number): Variance {
  const delta = countedQty - expectedQty;
  if (delta === 0) return { delta: 0, direction: "match" };
  return { delta, direction: delta < 0 ? "short" : "over" };
}

/**
 * Whole days from `now` until `expiryDate`. Rounded down so a lot expiring in
 * 29.6 days reads as 29 — erring toward urgency rather than away from it.
 */
function daysUntil(expiryDate: number, now: number): number {
  return Math.floor((expiryDate - now) / DAY_MS);
}

export function expiryTier(
  expiryDate: number,
  now: number,
  tiers: AlertTiers = DEFAULT_ALERT_TIERS,
): ExpiryTier {
  // A lot expiring at this instant is no longer dispensable.
  if (expiryDate <= now) return "expired";

  const days = daysUntil(expiryDate, now);
  if (days <= tiers.critical) return "critical";
  if (days <= tiers.warning) return "warning";
  if (days <= tiers.watch) return "watch";
  return "ok";
}

const plural = (n: number, unit: string) => `${n} ${unit}${n === 1 ? "" : "s"}`;

/**
 * Approximate units, matching how a pharmacist speaks about expiry rather than
 * calendar-exact arithmetic: "expires in 5 months", not "in 4 months 28 days".
 */
function coarseDistance(days: number): string {
  if (days < 31) return plural(days, "day");
  if (days < 365) return plural(Math.floor(days / 30), "month");
  return plural(Math.floor(days / 365), "year");
}

export function formatExpiryDistance(expiryDate: number, now: number): string {
  const days = daysUntil(expiryDate, now);

  if (days === 0) return "expires today";
  if (days === 1) return "expires tomorrow";
  if (days === -1) return "expired yesterday";

  if (days < 0) return `expired ${coarseDistance(Math.abs(days))} ago`;
  return `expires in ${coarseDistance(days)}`;
}
