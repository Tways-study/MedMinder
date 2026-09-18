import { describe, expect, it } from "vitest";
import { DEFAULT_ALERT_TIERS } from "./inventory";
import {
  type FilterableMedicine,
  expiryStatus,
  filterMedicines,
  sortMedicines,
} from "./medicineFilters";

const NOW = Date.UTC(2026, 8, 18);
const DAY = 24 * 60 * 60 * 1000;

function med(
  name: string,
  opts: { expiresInDays?: number; onHand?: number; reorderPoint?: number } = {},
): FilterableMedicine {
  return {
    name,
    expiryDate:
      opts.expiresInDays === undefined ? undefined : NOW + opts.expiresInDays * DAY,
    onHandQuantity: opts.onHand ?? 100,
    reorderPoint: opts.reorderPoint ?? 10,
  };
}

const expired = med("Expired one", { expiresInDays: -3 });
const critical = med("Critical one", { expiresInDays: 10, onHand: 5 });
const inDate = med("In date one", { expiresInDays: 400 });
const noExpiry = med("No expiry one");

describe("expiryStatus", () => {
  it("is 'none' when no expiry date is set, never 'ok'", () => {
    expect(expiryStatus(noExpiry, NOW, DEFAULT_ALERT_TIERS)).toBe("none");
  });

  it("uses the expiry tier otherwise", () => {
    expect(expiryStatus(expired, NOW, DEFAULT_ALERT_TIERS)).toBe("expired");
    expect(expiryStatus(inDate, NOW, DEFAULT_ALERT_TIERS)).toBe("ok");
  });
});

describe("filterMedicines", () => {
  const all = [expired, critical, inDate, noExpiry];

  it("returns everything when no filter is set", () => {
    expect(
      filterMedicines(all, { statuses: [], lowStockOnly: false }, NOW, DEFAULT_ALERT_TIERS),
    ).toEqual(all);
  });

  it("keeps medicines in any of the chosen statuses", () => {
    expect(
      filterMedicines(
        all,
        { statuses: ["expired", "none"], lowStockOnly: false },
        NOW,
        DEFAULT_ALERT_TIERS,
      ),
    ).toEqual([expired, noExpiry]);
  });

  it("combines low stock with statuses as AND", () => {
    expect(
      filterMedicines(all, { statuses: [], lowStockOnly: true }, NOW, DEFAULT_ALERT_TIERS),
    ).toEqual([critical]);
    expect(
      filterMedicines(
        all,
        { statuses: ["expired"], lowStockOnly: true },
        NOW,
        DEFAULT_ALERT_TIERS,
      ),
    ).toEqual([]);
  });
});

describe("sortMedicines", () => {
  const shuffled = [noExpiry, inDate, critical, expired];

  it("sorts by soonest expiry, with no expiry last", () => {
    expect(sortMedicines(shuffled, "expiry").map((m) => m.name)).toEqual([
      "Expired one",
      "Critical one",
      "In date one",
      "No expiry one",
    ]);
  });

  it("sorts by name", () => {
    expect(sortMedicines(shuffled, "name").map((m) => m.name)).toEqual([
      "Critical one",
      "Expired one",
      "In date one",
      "No expiry one",
    ]);
  });

  it("sorts by lowest on-hand stock", () => {
    expect(sortMedicines(shuffled, "stock")[0]).toBe(critical);
  });

  it("does not mutate its input", () => {
    const input = [...shuffled];
    sortMedicines(input, "name");
    expect(input).toEqual(shuffled);
  });
});
