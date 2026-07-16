/**
 * Dates are always spelled with a written month. "05/08/2026" means two
 * different days depending on where you learned to read it, and this is an
 * expiry date on medicine.
 */
export function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** For <input type="date">, which only speaks YYYY-MM-DD. */
export function toDateInput(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Parses a date input as local midnight, not UTC, so the day never shifts. */
export function fromDateInput(value: string): number {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d).getTime();
}

export function formatQuantity(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}
