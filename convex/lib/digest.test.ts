import { describe, expect, it } from "vitest";
import { isDigestDue, nextDigestRun } from "./digest";

const MANILA = { digestDay: 1, digestHour: 8, timezone: "Asia/Manila" };
const at = (iso: string) => new Date(iso).getTime();
const iso = (ms: number) => new Date(ms).toISOString();

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

describe("nextDigestRun", () => {
  // 2026-07-16T00:00Z is Thursday 08:00 in Manila.
  it("finds the coming Monday from midweek", () => {
    expect(iso(nextDigestRun(MANILA, at("2026-07-16T00:00:00Z")))).toBe(
      "2026-07-20T00:00:00.000Z",
    );
  });

  // Monday 07:00 Manila — the digest is still ahead of us today.
  it("fires later the same day when the hour has not passed", () => {
    expect(iso(nextDigestRun(MANILA, at("2026-07-19T23:00:00Z")))).toBe(
      "2026-07-20T00:00:00.000Z",
    );
  });

  // Monday 09:00 Manila — today's slot is gone.
  it("skips to next week once the hour has passed", () => {
    expect(iso(nextDigestRun(MANILA, at("2026-07-20T01:00:00Z")))).toBe(
      "2026-07-27T00:00:00.000Z",
    );
  });

  // Landing exactly on the slot must advance, or a cron firing at 08:00 would
  // reschedule itself for the same instant and loop.
  it("advances a full week when called exactly on the slot", () => {
    expect(iso(nextDigestRun(MANILA, at("2026-07-20T00:00:00Z")))).toBe(
      "2026-07-27T00:00:00.000Z",
    );
  });

  it("always returns an instant in the future", () => {
    const now = at("2026-07-16T00:00:00Z");
    expect(nextDigestRun(MANILA, now)).toBeGreaterThan(now);
  });

  // Monday 8am in New York is 12:00Z under EDT but 13:00Z under EST. Getting
  // this right means recomputing the offset, not caching it.
  describe("daylight saving", () => {
    const NY = { digestDay: 1, digestHour: 8, timezone: "America/New_York" };

    it("crosses into DST with the wall clock, not the UTC offset", () => {
      // Monday 2026-03-02 09:00 EST -> next slot is after DST begins Mar 8.
      expect(iso(nextDigestRun(NY, at("2026-03-02T14:00:00Z")))).toBe(
        "2026-03-09T12:00:00.000Z",
      );
    });

    it("uses standard time before the DST switch", () => {
      // Thursday 2026-02-26 -> Monday 2026-03-02 08:00 EST = 13:00Z.
      expect(iso(nextDigestRun(NY, at("2026-02-26T12:00:00Z")))).toBe(
        "2026-03-02T13:00:00.000Z",
      );
    });
  });

  it("honours a different configured day and hour", () => {
    // Sunday 20:00 Manila.
    const sundayEvening = { digestDay: 0, digestHour: 20, timezone: "Asia/Manila" };
    expect(iso(nextDigestRun(sundayEvening, at("2026-07-16T00:00:00Z")))).toBe(
      "2026-07-19T12:00:00.000Z",
    );
  });
});

/*
  The cron ticks hourly in UTC, but the schedule is hers and lives in her
  timezone, so each tick has to decide for itself whether the moment has come.
*/
describe("isDigestDue", () => {
  const MONDAY_8AM = at("2026-07-20T00:00:00Z"); // Monday 08:00 Manila.

  it("is due at the configured hour when it has never been sent", () => {
    expect(isDigestDue(MANILA, MONDAY_8AM, undefined)).toBe(true);
  });

  it("is not due on the wrong day", () => {
    // Thursday 08:00 Manila.
    expect(isDigestDue(MANILA, at("2026-07-16T00:00:00Z"), undefined)).toBe(false);
  });

  it("is not due before the hour arrives", () => {
    // Monday 07:00 Manila.
    expect(isDigestDue(MANILA, at("2026-07-19T23:00:00Z"), undefined)).toBe(false);
  });

  it("does not send twice in one day", () => {
    const sentAt = MONDAY_8AM;
    expect(isDigestDue(MANILA, MONDAY_8AM + HOUR, sentAt)).toBe(false);
  });

  /*
    If the 8am tick is missed — a deploy, a cold start — the 9am tick should
    still send. A weekly digest that silently skips a week is worse than one
    that arrives an hour late.
  */
  it("catches up later the same day when the exact hour was missed", () => {
    expect(isDigestDue(MANILA, MONDAY_8AM + 3 * HOUR, undefined)).toBe(true);
  });

  it("sends again the following week", () => {
    const lastWeek = MONDAY_8AM - 7 * DAY;
    expect(isDigestDue(MANILA, MONDAY_8AM, lastWeek)).toBe(true);
  });

  it("is never due when the digest is switched off", () => {
    expect(
      isDigestDue({ ...MANILA, enabled: false }, MONDAY_8AM, undefined),
    ).toBe(false);
  });
});
