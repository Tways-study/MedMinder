import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

/**
 * Wipes every account and, optionally, every account's inventory.
 *
 * A full-deployment reset for development and one-off cleanup — clears every
 * tenant, not just one. MedMinder is multi-tenant, so this is a blunt tool:
 * reach for it to clear test accounts off a deployment, not to remove a
 * single user's data.
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
      ? "Nothing to clear."
      : `Cleared ${cleared.join(", ")}.`;
  },
});
