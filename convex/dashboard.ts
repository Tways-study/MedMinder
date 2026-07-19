import { v } from "convex/values";
import { query } from "./_generated/server";
import { requireAuth } from "./lib/guards";
import { DEFAULT_ALERT_TIERS, expiryTier } from "./lib/inventory";
import { medicineForm } from "./schema";

const alertMedicine = v.object({
  medicineId: v.id("medicines"),
  medicineName: v.string(),
  strength: v.optional(v.string()),
  form: medicineForm,
  expiryDate: v.number(),
  onHandQuantity: v.number(),
  actualQuantity: v.number(),
  tier: v.union(
    v.literal("expired"),
    v.literal("critical"),
    v.literal("warning"),
    v.literal("watch"),
  ),
});

/**
 * Everything the "On hand" dashboard leads with, in one query.
 *
 * Alerts are computed server-side against the configured tier cutoffs so the
 * dashboard and the weekly digest cannot drift into disagreeing about what
 * counts as urgent. Driven by onHandQuantity, not actualQuantity: on-hand is
 * the number kept continuously current, so a reorder decision needs it over
 * the periodically-verified physical count.
 */
export const summary = query({
  args: {},
  returns: v.object({
    alerts: v.array(alertMedicine),
    lowStock: v.array(
      v.object({
        medicineId: v.id("medicines"),
        name: v.string(),
        strength: v.optional(v.string()),
        form: medicineForm,
        onHandQuantity: v.number(),
        reorderPoint: v.number(),
      }),
    ),
    totals: v.object({
      medicines: v.number(),
      onHandUnits: v.number(),
      actualUnits: v.number(),
    }),
  }),
  handler: async (ctx) => {
    const ownerId = await requireAuth(ctx);

    const settings = await ctx.db
      .query("settings")
      .withIndex("by_owner", (q) => q.eq("ownerId", ownerId))
      .first();
    const tiers = settings?.alertTiers ?? DEFAULT_ALERT_TIERS;
    const now = Date.now();

    const medicines = await ctx.db
      .query("medicines")
      .withIndex("by_owner_name", (q) => q.eq("ownerId", ownerId))
      .take(2000);

    const alerts = medicines
      .filter((m) => m.expiryDate !== undefined && expiryTier(m.expiryDate, now, tiers) !== "ok")
      .map((m) => ({
        medicineId: m._id,
        medicineName: m.name,
        strength: m.strength,
        form: m.form,
        expiryDate: m.expiryDate as number,
        onHandQuantity: m.onHandQuantity,
        actualQuantity: m.actualQuantity,
        tier: expiryTier(m.expiryDate as number, now, tiers) as
          | "expired"
          | "critical"
          | "warning"
          | "watch",
      }))
      // Most urgent first: the medicine she can still do something about leads.
      .sort((a, b) => a.expiryDate - b.expiryDate);

    const lowStock = medicines
      .filter((m) => m.onHandQuantity <= m.reorderPoint)
      .map((m) => ({
        medicineId: m._id,
        name: m.name,
        strength: m.strength,
        form: m.form,
        onHandQuantity: m.onHandQuantity,
        reorderPoint: m.reorderPoint,
      }))
      .sort((a, b) => a.onHandQuantity - b.onHandQuantity);

    return {
      alerts,
      lowStock,
      totals: {
        medicines: medicines.length,
        onHandUnits: medicines.reduce((sum, m) => sum + m.onHandQuantity, 0),
        actualUnits: medicines.reduce((sum, m) => sum + m.actualQuantity, 0),
      },
    };
  },
});
