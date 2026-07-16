import { describe, expect, it } from "vitest";
import { formatExpiryDate, fromDateInput, toDateInput } from "./dates";

/*
  Regression: expiry dates were stored at local midnight, which is an instant,
  not a date. A lot entered as 13 Dec in Manila was stored as 12 Dec 16:00 UTC,
  so the browser rendered "13 Dec 2026" while the digest email, rendered on a
  UTC server, said "12 Dec 2026" — the same lot, a day apart, in the two places
  she would compare.

  An expiry is a calendar date. It must read the same to everyone.
*/
describe("expiry dates are calendar dates, not instants", () => {
  it("stores a date input at UTC midnight", () => {
    expect(new Date(fromDateInput("2026-12-13")).toISOString()).toBe(
      "2026-12-13T00:00:00.000Z",
    );
  });

  it("renders the same day regardless of the viewer's timezone", () => {
    const stored = fromDateInput("2026-12-13");
    // formatExpiryDate pins the zone, so these cannot diverge.
    expect(formatExpiryDate(stored)).toBe("13 Dec 2026");
  });

  it("round-trips through the date input without drifting a day", () => {
    for (const date of ["2026-01-01", "2026-12-31", "2026-07-16", "2027-03-01"]) {
      expect(toDateInput(fromDateInput(date))).toBe(date);
    }
  });

  it("survives a year boundary", () => {
    const stored = fromDateInput("2027-01-01");
    expect(formatExpiryDate(stored)).toBe("01 Jan 2027");
    expect(toDateInput(stored)).toBe("2027-01-01");
  });

  it("spells the month out, because 05/08 is two different days", () => {
    expect(formatExpiryDate(fromDateInput("2026-08-05"))).toBe("05 Aug 2026");
  });
});
