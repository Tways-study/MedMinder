import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import { formatExpiryDate } from "./lib/dates";

const DAY = 24 * 60 * 60 * 1000;

/**
 * Snaps expiry dates written before they were treated as calendar dates.
 *
 * Lots entered through the delivery form used to be stored at *local* midnight,
 * so a lot typed as 13 Dec in Manila landed on 2026-12-12T16:00Z and rendered a
 * day early on the UTC server.
 *
 * Snapping to the nearest UTC midnight recovers the intended day for any
 * timezone within ±12h of UTC: local midnight is always closer to the midnight
 * of the day the pharmacist typed than to any other. Rows already on UTC
 * midnight are exactly zero away and are left untouched.
 */
export const normaliseExpiryDates = internalMutation({
  args: { dryRun: v.optional(v.boolean()) },
  returns: v.object({
    scanned: v.number(),
    changed: v.number(),
    details: v.array(v.string()),
  }),
  handler: async (ctx, { dryRun }) => {
    const batches = await ctx.db.query("batches").withIndex("by_expiry").take(5000);

    let changed = 0;
    const details: string[] = [];

    for (const batch of batches) {
      const snapped = Math.round(batch.expiryDate / DAY) * DAY;
      if (snapped === batch.expiryDate) continue;

      details.push(
        `${batch.lotNumber}: ${formatExpiryDate(batch.expiryDate)} -> ${formatExpiryDate(snapped)}`,
      );
      changed++;

      if (!dryRun) {
        await ctx.db.patch(batch._id, { expiryDate: snapped });
      }
    }

    return { scanned: batches.length, changed, details };
  },
});
