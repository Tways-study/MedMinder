import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

/*
  Hourly, not weekly.

  Convex crons are fixed UTC, but the digest schedule belongs to the pharmacist
  and she can change the day, hour and timezone in Settings. A cron pinned to
  one UTC hour would quietly send at the wrong local time the moment she moved
  it, or the moment her timezone shifted for daylight saving.

  So the cron just ticks, and `maybeSend` decides against her wall clock.
*/
// Minute 7 rather than 0: the top of the hour is where every scheduled job on
// the planet piles up.
crons.hourly(
  "weekly expiry digest",
  { minuteUTC: 7 },
  internal.sendDigest.maybeSend,
  {},
);

export default crons;
