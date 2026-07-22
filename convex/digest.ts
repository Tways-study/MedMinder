import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import { formatExpiryDate } from "./lib/dates";
import { isDigestDue } from "./lib/digest";
import {
  digestHtml,
  digestSubject,
  digestText,
  type DigestAlert,
  type DigestLowStock,
} from "./lib/digestEmail";
import {
  DEFAULT_ALERT_TIERS,
  expiryTier,
  formatExpiryDistance,
} from "./lib/inventory";

/**
 * Exported for sendDigest.ts (a separate "use node" module — Node actions
 * can't share a file with queries/mutations, so the send step lives there).
 */
export type DigestContents = {
  due: boolean;
  email: string | null;
  subject: string;
  html: string;
  text: string;
  alertCount: number;
};

const APP_URL = process.env.SITE_URL ?? "http://localhost:3000";

/**
 * Everything the digest reports, gathered in one read.
 *
 * Deliberately shares expiryTier and formatExpiryDistance with the dashboard:
 * an email that disagreed with the screen about what is urgent would be worse
 * than no email. Driven by onHandQuantity, same reasoning as dashboard.ts.
 */
export const contents = internalQuery({
  args: { ownerId: v.id("users") },
  returns: v.object({
    due: v.boolean(),
    email: v.union(v.string(), v.null()),
    subject: v.string(),
    html: v.string(),
    text: v.string(),
    alertCount: v.number(),
  }),
  handler: async (ctx, { ownerId }) => {
    const settings = await ctx.db
      .query("settings")
      .withIndex("by_owner", (q) => q.eq("ownerId", ownerId))
      .first();
    const now = Date.now();

    const due =
      settings !== null &&
      isDigestDue(
        {
          digestDay: settings.digestDay,
          digestHour: settings.digestHour,
          timezone: settings.timezone,
          enabled: settings.digestEnabled,
        },
        now,
        settings.lastDigestSentAt,
      );

    const tiers = settings?.alertTiers ?? DEFAULT_ALERT_TIERS;

    // Single pass over this owner's inventory — same reasoning as
    // dashboard.ts. No cap, so a large shelf can't silently drop items from
    // the email, and only the flagged subsets are held in memory.
    const alerts: DigestAlert[] = [];
    const lowStock: DigestLowStock[] = [];

    for await (const m of ctx.db
      .query("medicines")
      .withIndex("by_owner_name", (q) => q.eq("ownerId", ownerId))) {
      if (m.expiryDate !== undefined) {
        const tier = expiryTier(m.expiryDate, now, tiers);
        if (tier !== "ok") {
          alerts.push({
            medicineName: m.name,
            strength: m.strength,
            expiryLabel: formatExpiryDate(m.expiryDate),
            expiryDistance: formatExpiryDistance(m.expiryDate, now),
            onHandQuantity: m.onHandQuantity,
            tier,
          });
        }
      }

      if (m.onHandQuantity <= m.reorderPoint) {
        lowStock.push({
          name: m.name,
          strength: m.strength,
          onHandQuantity: m.onHandQuantity,
          reorderPoint: m.reorderPoint,
        });
      }
    }

    alerts.sort((a, b) => a.expiryDistance.localeCompare(b.expiryDistance));

    return {
      due,
      email: settings?.digestEmail ?? null,
      subject: digestSubject(alerts),
      html: digestHtml(alerts, lowStock, APP_URL),
      text: digestText(alerts, lowStock, APP_URL),
      alertCount: alerts.length,
    };
  },
});

export const markSent = internalMutation({
  args: { ownerId: v.id("users"), at: v.number() },
  returns: v.null(),
  handler: async (ctx, { ownerId, at }) => {
    const settings = await ctx.db
      .query("settings")
      .withIndex("by_owner", (q) => q.eq("ownerId", ownerId))
      .first();
    if (settings === null) return null;
    await ctx.db.patch(settings._id, { lastDigestSentAt: at });
    return null;
  },
});

/** One ownerId per tenant with a settings row, for `maybeSend` to iterate. */
export const ownerIds = internalQuery({
  args: {},
  returns: v.array(v.id("users")),
  handler: async (ctx) => {
    // Bounded well beyond what this app is sized for, same as the other
    // hourly-job scans in this file.
    const settings = await ctx.db.query("settings").take(5000);
    return settings.map((s) => s.ownerId);
  },
});
