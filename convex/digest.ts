import { Resend } from "@convex-dev/resend";
import { v } from "convex/values";
import { components, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import {
  internalAction,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import { formatExpiryDate } from "./lib/dates";
import { isDigestDue } from "./lib/digest";
import {
  digestHtml,
  digestSubject,
  digestText,
  type DigestLot,
  type DigestLowStock,
} from "./lib/digestEmail";
import {
  DEFAULT_ALERT_TIERS,
  expiryTier,
  formatExpiryDistance,
} from "./lib/inventory";

export const resend: Resend = new Resend(components.resend, {});

/**
 * Annotated explicitly to break a circular inference: `maybeSend` calls
 * `contents`, which lives in this same module, so the generated `internal` type
 * would otherwise be inferred from the file that is inferring it.
 */
type DigestContents = {
  due: boolean;
  email: string | null;
  subject: string;
  html: string;
  text: string;
  lotCount: number;
};

const APP_URL = process.env.SITE_URL ?? "http://localhost:3000";

/**
 * Everything the digest reports, gathered in one read.
 *
 * Deliberately shares expiryTier and formatExpiryDistance with the dashboard:
 * an email that disagreed with the screen about what is urgent would be worse
 * than no email.
 */
export const contents = internalQuery({
  args: { ownerId: v.id("users") },
  returns: v.object({
    due: v.boolean(),
    email: v.union(v.string(), v.null()),
    subject: v.string(),
    html: v.string(),
    text: v.string(),
    lotCount: v.number(),
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

    const batches = await ctx.db
      .query("batches")
      .withIndex("by_owner_status_expiry", (q) =>
        q.eq("ownerId", ownerId).eq("status", "active"),
      )
      .collect();

    const lots: DigestLot[] = [];
    const stockByMedicine = new Map<string, number>();

    for (const batch of batches) {
      stockByMedicine.set(
        batch.medicineId,
        (stockByMedicine.get(batch.medicineId) ?? 0) + batch.quantityExpected,
      );

      const tier = expiryTier(batch.expiryDate, now, tiers);
      if (tier === "ok") continue;

      const medicine = await ctx.db.get(batch.medicineId);
      if (medicine === null) continue;

      lots.push({
        medicineName: medicine.name,
        strength: medicine.strength,
        lotNumber: batch.lotNumber,
        expiryLabel: formatExpiryDate(batch.expiryDate),
        expiryDistance: formatExpiryDistance(batch.expiryDate, now),
        quantity: batch.quantityExpected,
        tier,
      });
    }

    lots.sort((a, b) => a.expiryDistance.localeCompare(b.expiryDistance));

    const medicines = await ctx.db
      .query("medicines")
      .withIndex("by_owner_name", (q) => q.eq("ownerId", ownerId))
      .take(2000);
    const lowStock: DigestLowStock[] = medicines
      .map((m) => ({
        name: m.name,
        strength: m.strength,
        totalQuantity: stockByMedicine.get(m._id) ?? 0,
        reorderPoint: m.reorderPoint,
      }))
      .filter((m) => m.totalQuantity <= m.reorderPoint);

    return {
      due,
      email: settings?.digestEmail ?? null,
      subject: digestSubject(lots),
      html: digestHtml(lots, lowStock, APP_URL),
      text: digestText(lots, lowStock, APP_URL),
      lotCount: lots.length,
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

/**
 * Hourly tick. Sends only to owners whose wall clock says it is time.
 *
 * Convex crons are fixed UTC, but each owner's schedule is theirs to move, so
 * the decision has to be made per owner per tick rather than baked into the
 * cron. MedMinder is multi-tenant, so one tick may send to several owners,
 * each their own digest scoped to their own inventory.
 */
export const maybeSend = internalAction({
  args: { force: v.optional(v.boolean()) },
  returns: v.string(),
  handler: async (ctx, { force }) => {
    // Without a key the component throws. Fail loudly in the logs but do not
    // mark anything as sent, so digests go out once the key is added.
    if (!process.env.RESEND_API_KEY) {
      console.error(
        "RESEND_API_KEY is not set on this deployment, so digests cannot send. " +
          "Set it with: npx convex env set RESEND_API_KEY re_xxx",
      );
      return "Skipped: RESEND_API_KEY is not set.";
    }

    const owners: Id<"users">[] = await ctx.runQuery(internal.digest.ownerIds, {});
    const sent: string[] = [];

    for (const ownerId of owners) {
      const digest: DigestContents = await ctx.runQuery(internal.digest.contents, {
        ownerId,
      });

      if (!force && !digest.due) continue;
      if (digest.email === null) continue;

      await resend.sendEmail(ctx, {
        from: process.env.DIGEST_FROM ?? "MedMinder <onboarding@resend.dev>",
        to: digest.email,
        subject: digest.subject,
        html: digest.html,
        text: digest.text,
      });

      await ctx.runMutation(internal.digest.markSent, { ownerId, at: Date.now() });
      sent.push(`${digest.email}: ${digest.subject}`);
    }

    return sent.length === 0 ? "Nothing due." : `Sent to ${sent.join("; ")}`;
  },
});
