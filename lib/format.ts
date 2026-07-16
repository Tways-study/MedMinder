/*
  Re-exported from the Convex lib rather than reimplemented.

  The browser and the Convex server previously had their own copies of the date
  formatter, which is how the dashboard came to show "13 Dec 2026" while the
  weekly email showed "12 Dec 2026" for the same lot. One implementation, shared
  by both, is the fix.
*/
export {
  formatExpiryDate as formatDate,
  fromDateInput,
  toDateInput,
} from "@/convex/lib/dates";

export function formatQuantity(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}
