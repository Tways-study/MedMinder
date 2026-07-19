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
      const inventoryTables = ["medicines"] as const;

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

/**
 * Deletes one account by email — a throwaway test signup, say — without
 * touching any other tenant. `resetAccount` above is the blunt, wipe-everyone
 * tool; this is the scoped one for when only a single account needs to go.
 *
 * Doesn't touch authVerificationCodes/authVerifiers/authRateLimits: those back
 * OAuth/magic-link flows this app doesn't use (Password provider only), so
 * they're never populated here.
 *
 *   npx convex run devReset:deleteAccountByEmail '{"email": "test@example.com"}'
 */
export const deleteAccountByEmail = internalMutation({
  args: { email: v.string() },
  returns: v.string(),
  handler: async (ctx, { email }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email))
      .first();
    if (user === null) return `No account found for ${email}.`;

    const cleared: string[] = [];

    const sessions = await ctx.db
      .query("authSessions")
      .withIndex("userId", (q) => q.eq("userId", user._id))
      .collect();
    for (const session of sessions) {
      const tokens = await ctx.db
        .query("authRefreshTokens")
        .withIndex("sessionId", (q) => q.eq("sessionId", session._id))
        .collect();
      for (const token of tokens) await ctx.db.delete(token._id);
      if (tokens.length > 0) cleared.push(`authRefreshTokens: ${tokens.length}`);
      await ctx.db.delete(session._id);
    }
    if (sessions.length > 0) cleared.push(`authSessions: ${sessions.length}`);

    const accounts = await ctx.db
      .query("authAccounts")
      .withIndex("userIdAndProvider", (q) => q.eq("userId", user._id))
      .collect();
    for (const account of accounts) await ctx.db.delete(account._id);
    if (accounts.length > 0) cleared.push(`authAccounts: ${accounts.length}`);

    const settings = await ctx.db
      .query("settings")
      .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
      .first();
    if (settings !== null) {
      await ctx.db.delete(settings._id);
      cleared.push("settings: 1");
    }

    await ctx.db.delete(user._id);
    cleared.push("users: 1");

    return `Cleared ${cleared.join(", ")} for ${email}.`;
  },
});
