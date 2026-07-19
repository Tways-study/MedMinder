import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { query } from "./_generated/server";

/** Narrowed on purpose: the raw user doc carries auth fields the UI never needs. */
export const viewer = query({
  args: {},
  returns: v.union(
    v.null(),
    v.object({
      email: v.optional(v.string()),
      name: v.optional(v.string()),
    }),
  ),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;

    const user = await ctx.db.get(userId);
    if (user === null) return null;

    return { email: user.email, name: user.name };
  },
});
