import { describe, expect, it } from "vitest";
import {
  DEFAULT_ALERT_TIERS,
  expiryTier,
  formatExpiryDistance,
  isValidQuantity,
  variance,
} from "./inventory";

describe("variance", () => {
  it("reports a match when counted equals expected", () => {
    expect(variance(50, 50)).toEqual({ delta: 0, direction: "match" });
  });

  it("reports short when fewer on the shelf than expected", () => {
    expect(variance(50, 42)).toEqual({ delta: -8, direction: "short" });
  });

  it("reports over when more on the shelf than expected", () => {
    expect(variance(50, 53)).toEqual({ delta: 3, direction: "over" });
  });

  it("handles counting an empty shelf", () => {
    expect(variance(12, 0)).toEqual({ delta: -12, direction: "short" });
  });

  it("handles finding stock where none was expected", () => {
    expect(variance(0, 6)).toEqual({ delta: 6, direction: "over" });
  });
});

describe("isValidQuantity", () => {
  it("accepts zero and positive integers", () => {
    expect(isValidQuantity(0)).toBe(true);
    expect(isValidQuantity(500)).toBe(true);
  });

  it("rejects negatives — you cannot have less than none on a shelf", () => {
    expect(isValidQuantity(-1)).toBe(false);
  });

  it("rejects fractional counts", () => {
    expect(isValidQuantity(2.5)).toBe(false);
  });

  // A NaN counted quantity would poison a batch balance silently.
  it("rejects NaN and Infinity", () => {
    expect(isValidQuantity(NaN)).toBe(false);
    expect(isValidQuantity(Infinity)).toBe(false);
    expect(isValidQuantity(-Infinity)).toBe(false);
  });

  it("rejects absurd magnitudes", () => {
    expect(isValidQuantity(10_000_001)).toBe(false);
  });
});

// Fixed reference point so these tests never depend on the wall clock.
const NOW = new Date("2026-07-16T00:00:00Z").getTime();
const daysFromNow = (n: number) => NOW + n * 24 * 60 * 60 * 1000;

describe("expiryTier", () => {
  it("flags a lot that expired yesterday", () => {
    expect(expiryTier(daysFromNow(-1), NOW, DEFAULT_ALERT_TIERS)).toBe(
      "expired",
    );
  });

  it("treats expiring exactly now as expired", () => {
    expect(expiryTier(NOW, NOW, DEFAULT_ALERT_TIERS)).toBe("expired");
  });

  it("flags a lot expiring in 20 days as critical", () => {
    expect(expiryTier(daysFromNow(20), NOW, DEFAULT_ALERT_TIERS)).toBe(
      "critical",
    );
  });

  it("flags a lot expiring in 60 days as warning", () => {
    expect(expiryTier(daysFromNow(60), NOW, DEFAULT_ALERT_TIERS)).toBe(
      "warning",
    );
  });

  // The case from the original request: "expires in 5 months" must be an alert.
  it("flags a lot expiring in 150 days as watch", () => {
    expect(expiryTier(daysFromNow(150), NOW, DEFAULT_ALERT_TIERS)).toBe("watch");
  });

  it("leaves a lot expiring in 2 years alone", () => {
    expect(expiryTier(daysFromNow(730), NOW, DEFAULT_ALERT_TIERS)).toBe("ok");
  });

  describe("tier boundaries are inclusive of the cutoff day", () => {
    it("day 30 is still critical, day 31 is warning", () => {
      expect(expiryTier(daysFromNow(30), NOW, DEFAULT_ALERT_TIERS)).toBe(
        "critical",
      );
      expect(expiryTier(daysFromNow(31), NOW, DEFAULT_ALERT_TIERS)).toBe(
        "warning",
      );
    });

    it("day 90 is still warning, day 91 is watch", () => {
      expect(expiryTier(daysFromNow(90), NOW, DEFAULT_ALERT_TIERS)).toBe(
        "warning",
      );
      expect(expiryTier(daysFromNow(91), NOW, DEFAULT_ALERT_TIERS)).toBe(
        "watch",
      );
    });

    it("day 180 is still watch, day 181 is ok", () => {
      expect(expiryTier(daysFromNow(180), NOW, DEFAULT_ALERT_TIERS)).toBe(
        "watch",
      );
      expect(expiryTier(daysFromNow(181), NOW, DEFAULT_ALERT_TIERS)).toBe("ok");
    });
  });

  it("respects custom tier cutoffs from settings", () => {
    const tiers = { critical: 7, warning: 14, watch: 30 };
    expect(expiryTier(daysFromNow(10), NOW, tiers)).toBe("warning");
    expect(expiryTier(daysFromNow(40), NOW, tiers)).toBe("ok");
  });
});

describe("formatExpiryDistance", () => {
  it("phrases a 5-month lot the way the pharmacist would say it", () => {
    expect(formatExpiryDistance(daysFromNow(150), NOW)).toBe(
      "expires in 5 months",
    );
  });

  /*
    Regression: an earlier version floored days/30, so a lot 149 days out read
    as "4 months" while one 150 days out read as "5". Real clocks sit partway
    through a day, so the same lot flipped between the two depending on the hour
    it was viewed. Approximate phrasing must not hinge on the time of day.
  */
  it("does not flip a month when the clock is partway through the day", () => {
    const midMorning = NOW + 9.5 * 60 * 60 * 1000;
    expect(formatExpiryDistance(NOW + 150 * 24 * 60 * 60 * 1000, midMorning)).toBe(
      "expires in 5 months",
    );
    expect(formatExpiryDistance(daysFromNow(149), NOW)).toBe(
      "expires in 5 months",
    );
  });

  it("rolls into years rather than counting past twelve months", () => {
    expect(formatExpiryDistance(daysFromNow(360), NOW)).toBe("expires in 1 year");
    expect(formatExpiryDistance(daysFromNow(340), NOW)).toBe(
      "expires in 11 months",
    );
  });

  it("phrases an already-expired lot in the past tense", () => {
    expect(formatExpiryDistance(daysFromNow(-40), NOW)).toBe(
      "expired 1 month ago",
    );
  });

  it("says today rather than 'in 0 days'", () => {
    expect(formatExpiryDistance(NOW, NOW)).toBe("expires today");
  });

  it("counts in days under a month", () => {
    expect(formatExpiryDistance(daysFromNow(1), NOW)).toBe("expires tomorrow");
    expect(formatExpiryDistance(daysFromNow(12), NOW)).toBe("expires in 12 days");
  });

  it("singularises one month and one year", () => {
    expect(formatExpiryDistance(daysFromNow(31), NOW)).toBe("expires in 1 month");
    expect(formatExpiryDistance(daysFromNow(370), NOW)).toBe("expires in 1 year");
  });

  it("counts in years past twelve months", () => {
    expect(formatExpiryDistance(daysFromNow(760), NOW)).toBe("expires in 2 years");
  });

  it("says yesterday for a lot that expired one day ago", () => {
    expect(formatExpiryDistance(daysFromNow(-1), NOW)).toBe("expired yesterday");
  });
});
