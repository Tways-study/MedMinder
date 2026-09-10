import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuth } from "./lib/guards";
import { DEFAULT_ALERT_TIERS } from "./lib/inventory";

const alertTiers = v.object({
  critical: v.number(),
  warning: v.number(),
  watch: v.number(),
});

const settingsShape = v.object({
  digestEnabled: v.boolean(),
  digestEmails: v.array(v.string()),
  digestDay: v.number(),
  digestHour: v.number(),
  timezone: v.string(),
  alertTiers,
  lastDigestSentAt: v.optional(v.number()),
});

export const get = query({
  args: {},
  returns: v.union(settingsShape, v.null()),
  handler: async (ctx) => {
    const ownerId = await requireAuth(ctx);
    const settings = await ctx.db
      .query("settings")
      .withIndex("by_owner", (q) => q.eq("ownerId", ownerId))
      .first();
    if (settings === null) return null;

    const {
      _id,
      _creationTime,
      ownerId: _ownerId,
      digestEmail,
      digestEmails,
      ...rest
    } = settings;

    return {
      ...rest,
      digestEmails: digestEmails ?? (digestEmail ? [digestEmail] : []),
    };
  },
});

export const update = mutation({
  args: {
    digestEnabled: v.boolean(),
    digestEmails: v.array(v.string()),
    digestDay: v.number(),
    digestHour: v.number(),
    timezone: v.string(),
    alertTiers,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const ownerId = await requireAuth(ctx);

    for (const email of args.digestEmails) {
      const trimmed = email.trim();
      if (!trimmed || !trimmed.includes("@")) {
        throw new ConvexError(`"${email}" does not look like an email address.`);
      }
    }

    if (!Number.isInteger(args.digestDay) || args.digestDay < 0 || args.digestDay > 6) {
      throw new ConvexError("Pick a day of the week.");
    }
    if (!Number.isInteger(args.digestHour) || args.digestHour < 0 || args.digestHour > 23) {
      throw new ConvexError("Pick an hour between 0 and 23.");
    }

    try {
      new Intl.DateTimeFormat("en-US", { timeZone: args.timezone }).format(0);
    } catch {
      throw new ConvexError(`"${args.timezone}" is not a timezone I recognise.`);
    }

    const { critical, warning, watch } = args.alertTiers;
    for (const [name, value] of Object.entries(args.alertTiers)) {
      if (!Number.isInteger(value) || value <= 0 || value > 3650) {
        throw new ConvexError(`${name} must be a whole number of days above zero.`);
      }
    }
    if (!(critical < warning && warning < watch)) {
      throw new ConvexError(
        "Tiers must increase: critical sooner than soon, soon sooner than watch.",
      );
    }

    const existing = await ctx.db
      .query("settings")
      .withIndex("by_owner", (q) => q.eq("ownerId", ownerId))
      .first();

    // digestEmail is cleared on first save via this mutation.
    const patch = { ...args, digestEmail: undefined };

    if (existing === null) {
      await ctx.db.insert("settings", { ...patch, ownerId });
    } else {
      await ctx.db.patch(existing._id, patch);
    }
    return null;
  },
});

export const resetTiers = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const ownerId = await requireAuth(ctx);
    const existing = await ctx.db
      .query("settings")
      .withIndex("by_owner", (q) => q.eq("ownerId", ownerId))
      .first();
    if (existing === null) return null;
    await ctx.db.patch(existing._id, { alertTiers: DEFAULT_ALERT_TIERS });
    return null;
  },
});
