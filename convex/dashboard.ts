import { type Infer, v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { query } from "./_generated/server";
import { requireAuth } from "./lib/guards";
import { DEFAULT_ALERT_TIERS, expiryTier } from "./lib/inventory";
import { medicineForm } from "./schema";

type MedicineForm = Infer<typeof medicineForm>;

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

    // One pass over this owner's inventory, accumulating only what the
    // dashboard actually shows (the alerting and low-stock subsets) plus the
    // running totals. Streaming the index this way means no arbitrary cap:
    // every medicine is counted, and memory stays proportional to the number
    // of *flagged* items rather than the whole shelf.
    const alerts: Array<{
      medicineId: Id<"medicines">;
      medicineName: string;
      strength?: string;
      form: MedicineForm;
      expiryDate: number;
      onHandQuantity: number;
      actualQuantity: number;
      tier: "expired" | "critical" | "warning" | "watch";
    }> = [];
    const lowStock: Array<{
      medicineId: Id<"medicines">;
      name: string;
      strength?: string;
      form: MedicineForm;
      onHandQuantity: number;
      reorderPoint: number;
    }> = [];
    let count = 0;
    let onHandUnits = 0;
    let actualUnits = 0;

    for await (const m of ctx.db
      .query("medicines")
      .withIndex("by_owner_name", (q) => q.eq("ownerId", ownerId))) {
      count += 1;
      onHandUnits += m.onHandQuantity;
      actualUnits += m.actualQuantity;

      if (m.expiryDate !== undefined) {
        const tier = expiryTier(m.expiryDate, now, tiers);
        if (tier !== "ok") {
          alerts.push({
            medicineId: m._id,
            medicineName: m.name,
            strength: m.strength,
            form: m.form,
            expiryDate: m.expiryDate,
            onHandQuantity: m.onHandQuantity,
            actualQuantity: m.actualQuantity,
            tier,
          });
        }
      }

      if (m.onHandQuantity <= m.reorderPoint) {
        lowStock.push({
          medicineId: m._id,
          name: m.name,
          strength: m.strength,
          form: m.form,
          onHandQuantity: m.onHandQuantity,
          reorderPoint: m.reorderPoint,
        });
      }
    }

    // Most urgent first: the medicine she can still do something about leads.
    alerts.sort((a, b) => a.expiryDate - b.expiryDate);
    lowStock.sort((a, b) => a.onHandQuantity - b.onHandQuantity);

    return {
      alerts,
      lowStock,
      totals: {
        medicines: count,
        onHandUnits,
        actualUnits,
      },
    };
  },
});
