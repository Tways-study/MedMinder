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

    const medicines = await ctx.db
      .query("medicines")
      .withIndex("by_owner_name", (q) => q.eq("ownerId", ownerId))
      .take(2000);

    const alerts: DigestAlert[] = medicines
      .filter((m) => m.expiryDate !== undefined && expiryTier(m.expiryDate, now, tiers) !== "ok")
      .map((m) => ({
        medicineName: m.name,
        strength: m.strength,
        expiryLabel: formatExpiryDate(m.expiryDate as number),
        expiryDistance: formatExpiryDistance(m.expiryDate as number, now),
        onHandQuantity: m.onHandQuantity,
        tier: expiryTier(m.expiryDate as number, now, tiers) as Exclude<
          ReturnType<typeof expiryTier>,
          "ok"
        >,
      }));

    alerts.sort((a, b) => a.expiryDistance.localeCompare(b.expiryDistance));

    const lowStock: DigestLowStock[] = medicines
      .filter((m) => m.onHandQuantity <= m.reorderPoint)
      .map((m) => ({
        name: m.name,
        strength: m.strength,
        onHandQuantity: m.onHandQuantity,
        reorderPoint: m.reorderPoint,
      }));

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
