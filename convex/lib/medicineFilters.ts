import { type AlertTiers, type ExpiryTier, expiryTier } from "./inventory";

/**
 * A medicine with no expiry date gets its own status, so unknown stock is
 * never counted as in date.
 */
export type ExpiryStatus = ExpiryTier | "none";

export type MedicineSort = "expiry" | "name" | "stock";

export type MedicineFilter = {
  /** Keep medicines in any of these statuses; empty keeps all. */
  statuses: ExpiryStatus[];
  lowStockOnly: boolean;
};

export type FilterableMedicine = {
  name: string;
  expiryDate?: number;
  onHandQuantity: number;
  reorderPoint: number;
};

export function expiryStatus(
  medicine: FilterableMedicine,
  now: number,
  tiers: AlertTiers,
): ExpiryStatus {
  return medicine.expiryDate === undefined
    ? "none"
    : expiryTier(medicine.expiryDate, now, tiers);
}

export function isLowStock(medicine: FilterableMedicine): boolean {
  return medicine.onHandQuantity <= medicine.reorderPoint;
}

export function isFiltering(filter: MedicineFilter): boolean {
  return filter.statuses.length > 0 || filter.lowStockOnly;
}

export function filterMedicines<M extends FilterableMedicine>(
  medicines: M[],
  filter: MedicineFilter,
  now: number,
  tiers: AlertTiers,
): M[] {
  return medicines.filter(
    (m) =>
      (filter.statuses.length === 0 ||
        filter.statuses.includes(expiryStatus(m, now, tiers))) &&
      (!filter.lowStockOnly || isLowStock(m)),
  );
}

const byName = (a: FilterableMedicine, b: FilterableMedicine) =>
  a.name.localeCompare(b.name);

const COMPARATORS: Record<
  MedicineSort,
  (a: FilterableMedicine, b: FilterableMedicine) => number
> = {
  // Undated medicines sort last: they can't be acted on by date.
  expiry: (a, b) =>
    (a.expiryDate ?? Infinity) - (b.expiryDate ?? Infinity) || byName(a, b),
  name: byName,
  stock: (a, b) => a.onHandQuantity - b.onHandQuantity || byName(a, b),
};

export function sortMedicines<M extends FilterableMedicine>(
  medicines: M[],
  sort: MedicineSort,
): M[] {
  return [...medicines].sort(COMPARATORS[sort]);
}
