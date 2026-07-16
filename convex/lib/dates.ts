/*
  Expiry dates are calendar dates, not instants.

  A lot expires on a printed day. That day must read identically to the browser
  in Manila and to the Convex server in UTC, or the dashboard and the weekly
  email disagree about when a medicine expires.

  So: stored at UTC midnight, formatted in UTC. Everything that touches an
  expiry date goes through this module — the earlier bug existed precisely
  because the browser and the server each had their own copy of the formatter.
*/

const EXPIRY_ZONE = "UTC";

/** Parses a date input as UTC midnight. Never local midnight. */
export function fromDateInput(value: string): number {
  const [y, m, d] = value.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

/** For <input type="date">, which only speaks YYYY-MM-DD. */
export function toDateInput(ms: number): string {
  const date = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

/**
 * The month is always spelled out. "05/08/2026" is two different days depending
 * on where the reader learned to read dates, and this is an expiry on medicine.
 */
export function formatExpiryDate(ms: number): string {
  return new Date(ms).toLocaleDateString("en-GB", {
    timeZone: EXPIRY_ZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
