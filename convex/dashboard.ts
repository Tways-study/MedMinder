import { v } from "convex/values";
import { query } from "./_generated/server";
import { requireAuth } from "./lib/guards";
import { DEFAULT_ALERT_TIERS, expiryTier } from "./lib/inventory";
import { medicineForm } from "./schema";

const alertLot = v.object({
  batchId: v.id("batches"),
  medicineId: v.id("medicines"),
  medicineName: v.string(),
  strength: v.optional(v.string()),
  form: medicineForm,
  lotNumber: v.string(),
  expiryDate: v.number(),
  quantity: v.number(),
  tier: v.union(
    v.literal("expired"),
    v.literal("critical"),
    v.literal("warning"),
    v.literal("watch"),
  ),
});

/**
 * Everything the dashboard leads with, in one query.
 *
 * Alerts are computed server-side against the configured tier cutoffs so the
 * dashboard, the medicines list and the weekly digest cannot drift into
 * disagreeing about what counts as urgent.
 */
export const summary = query({
  args: {},
  returns: v.object({
    alerts: v.array(alertLot),
    lowStock: v.array(
      v.object({
        medicineId: v.id("medicines"),
        name: v.string(),
        strength: v.optional(v.string()),
        form: medicineForm,
        totalQuantity: v.number(),
        reorderPoint: v.number(),
      }),
    ),
    totals: v.object({
      medicines: v.number(),
      lots: v.number(),
      units: v.number(),
    }),
    hasDraftCount: v.boolean(),
  }),
  handler: async (ctx) => {
    await requireAuth(ctx);

    const settings = await ctx.db.query("settings").first();
    const tiers = settings?.alertTiers ?? DEFAULT_ALERT_TIERS;
    const now = Date.now();

    // Only active lots: a depleted lot is off the shelf and cannot expire on us.
    const batches = await ctx.db
      .query("batches")
      .withIndex("by_status_expiry", (q) => q.eq("status", "active"))
      .collect();

    const medicineCache = new Map<string, Awaited<ReturnType<typeof ctx.db.get>>>();
    const medicineFor = async (id: string) => {
      if (!medicineCache.has(id)) {
        medicineCache.set(id, await ctx.db.get(id as never));
      }
      return medicineCache.get(id);
    };

    const alerts = [];
    const stockByMedicine = new Map<string, number>();

    for (const batch of batches) {
      stockByMedicine.set(
        batch.medicineId,
        (stockByMedicine.get(batch.medicineId) ?? 0) + batch.quantityExpected,
      );

      const tier = expiryTier(batch.expiryDate, now, tiers);
      if (tier === "ok") continue;

      const medicine = (await medicineFor(batch.medicineId)) as {
        _id: string;
        name: string;
        strength?: string;
        form: string;
      } | null;
      if (medicine === null) continue;

      alerts.push({
        batchId: batch._id,
        medicineId: batch.medicineId,
        medicineName: medicine.name,
        strength: medicine.strength,
        form: medicine.form as never,
        lotNumber: batch.lotNumber,
        expiryDate: batch.expiryDate,
        quantity: batch.quantityExpected,
        tier: tier as "expired" | "critical" | "warning" | "watch",
      });
    }

    // Most urgent first: the lot she can still do something about leads.
    alerts.sort((a, b) => a.expiryDate - b.expiryDate);

    const medicines = await ctx.db.query("medicines").withIndex("by_name").take(2000);

    const lowStock = medicines
      .map((m) => ({
        medicineId: m._id,
        name: m.name,
        strength: m.strength,
        form: m.form,
        totalQuantity: stockByMedicine.get(m._id) ?? 0,
        reorderPoint: m.reorderPoint,
      }))
      .filter((m) => m.totalQuantity <= m.reorderPoint)
      .sort((a, b) => a.totalQuantity - b.totalQuantity);

    const draft = await ctx.db
      .query("countSessions")
      .withIndex("by_status_started", (q) => q.eq("status", "draft"))
      .first();

    return {
      alerts,
      lowStock,
      totals: {
        medicines: medicines.length,
        lots: batches.length,
        units: batches.reduce((sum, b) => sum + b.quantityExpected, 0),
      },
      hasDraftCount: draft !== null,
    };
  },
});
