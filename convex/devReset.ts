import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

/**
 * Hands the app back to whoever signs up next.
 *
 * MedMinder is claimed by its first account, which means a test account left
 * over from development permanently blocks the real pharmacist from signing up.
 * This clears the claim.
 *
 * internalMutation on purpose: not reachable from the browser, only from the
 * CLI by someone who already has deploy access.
 *
 *   npx convex run devReset:resetAccount
 *   npx convex run devReset:resetAccount '{"alsoWipeInventory": true}'
 */
export const resetAccount = internalMutation({
  args: { alsoWipeInventory: v.optional(v.boolean()) },
  returns: v.string(),
  handler: async (ctx, { alsoWipeInventory }) => {
    const cleared: string[] = [];

    // Every auth table, or a stale session would keep a deleted user signed in.
    const authTables = [
      "authAccounts",
      "authSessions",
      "authRefreshTokens",
      "authVerificationCodes",
      "authVerifiers",
      "authRateLimits",
      "users",
    ] as const;

    for (const table of authTables) {
      const rows = await ctx.db.query(table).take(1000);
      for (const row of rows) await ctx.db.delete(row._id);
      if (rows.length > 0) cleared.push(`${table}: ${rows.length}`);
    }

    // Settings are seeded against the account's email, so they go with it.
    for (const row of await ctx.db.query("settings").take(10)) {
      await ctx.db.delete(row._id);
      cleared.push("settings: 1");
    }

    if (alsoWipeInventory) {
      // Order matters: movements and count lines point at batches.
      const inventoryTables = [
        "movements",
        "countLines",
        "countSessions",
        "batches",
        "deliveries",
        "medicines",
      ] as const;

      for (const table of inventoryTables) {
        const rows = await ctx.db.query(table).take(5000);
        for (const row of rows) await ctx.db.delete(row._id);
        if (rows.length > 0) cleared.push(`${table}: ${rows.length}`);
      }
    }

    return cleared.length === 0
      ? "Nothing to clear. The next person to open the app claims it."
      : `Cleared ${cleared.join(", ")}. The next person to open the app claims it.`;
  },
});
