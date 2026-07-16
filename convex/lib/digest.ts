export type DigestSchedule = {
  /** 0 = Sunday, matching JS getDay(). */
  digestDay: number;
  digestHour: number;
  timezone: string;
};

const DAY_MS = 24 * 60 * 60 * 1000;

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

type WallClock = {
  year: number;
  month: number;
  day: number;
  hour: number;
  weekday: number;
};

function wallClockIn(timezone: string, utcMs: number): WallClock {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(new Date(utcMs));

  const lookup: Record<string, string> = {};
  for (const part of parts) lookup[part.type] = part.value;

  return {
    year: Number(lookup.year),
    month: Number(lookup.month),
    day: Number(lookup.day),
    // Intl renders midnight as hour 24 in some locales.
    hour: Number(lookup.hour) % 24,
    weekday: WEEKDAY_INDEX[lookup.weekday],
  };
}

/** How far the zone's wall clock sits from UTC at a given instant. */
function zoneOffsetMs(timezone: string, utcMs: number): number {
  const wall = wallClockIn(timezone, utcMs);
  const asIfUtc = Date.UTC(
    wall.year,
    wall.month - 1,
    wall.day,
    wall.hour,
    new Date(utcMs).getUTCMinutes(),
    new Date(utcMs).getUTCSeconds(),
  );
  return asIfUtc - utcMs;
}

/**
 * Turn a wall-clock time in a zone into a UTC instant.
 *
 * The offset depends on the instant we're solving for, so we guess, measure the
 * offset there, and correct — a second pass settles the DST-boundary cases where
 * the first guess lands on the wrong side of a switch.
 */
function wallClockToUtc(
  timezone: string,
  year: number,
  month: number,
  day: number,
  hour: number,
): number {
  const target = Date.UTC(year, month - 1, day, hour);
  let utc = target - zoneOffsetMs(timezone, target);
  utc = target - zoneOffsetMs(timezone, utc);
  return utc;
}

/**
 * The next instant the digest should send, strictly after `now`.
 *
 * Anchored to the wall clock in the pharmacist's timezone: 8am Monday stays 8am
 * Monday to her regardless of what that is in UTC.
 */
export function nextDigestRun(schedule: DigestSchedule, now: number): number {
  const { digestDay, digestHour, timezone } = schedule;
  const today = wallClockIn(timezone, now);

  const daysAhead = (digestDay - today.weekday + 7) % 7;

  for (let extraWeeks = 0; extraWeeks < 2; extraWeeks++) {
    const offsetDays = daysAhead + extraWeeks * 7;

    // Step the calendar date via UTC arithmetic, then read the resulting
    // wall-clock date back out so month and year roll over correctly.
    const stepped = wallClockIn(
      timezone,
      wallClockToUtc(timezone, today.year, today.month, today.day, 12) +
        offsetDays * DAY_MS,
    );

    const candidate = wallClockToUtc(
      timezone,
      stepped.year,
      stepped.month,
      stepped.day,
      digestHour,
    );

    if (candidate > now) return candidate;
  }

  // Unreachable: two weeks of candidates always contain a future slot.
  throw new Error("Could not resolve a digest run after " + now);
}
