import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

/**
 * Development fixture. Lots sit at deliberately chosen distances from today so
 * every tier boundary is exercised: already expired, inside 30 days, inside 90,
 * inside 180 (the "expires in 5 months" case from the original brief), and far
 * enough out to stay quiet.
 *
 * internalMutation, so it is not reachable from the browser.
 */
export const dev = internalMutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    const DAY = 24 * 60 * 60 * 1000;
    const now = Date.now();

    const fixtures = [
      {
        name: "Amoxicillin",
        genericName: "amoxicillin trihydrate",
        form: "capsule" as const,
        strength: "500 mg",
        category: "Antibiotics",
        reorderPoint: 100,
        lot: "AMX-4471B",
        days: -12,
        qty: 24,
      },
      {
        name: "Salbutamol",
        form: "drops" as const,
        strength: "100 mcg",
        category: "Respiratory",
        reorderPoint: 10,
        lot: "SLB-9032",
        days: 20,
        qty: 6,
      },
      {
        name: "Mefenamic acid",
        form: "tablet" as const,
        strength: "500 mg",
        category: "Analgesics",
        reorderPoint: 80,
        lot: "MFA-1180",
        days: 62,
        qty: 140,
      },
      {
        name: "Cetirizine",
        form: "syrup" as const,
        strength: "5 mg/5 mL",
        category: "Antihistamines",
        reorderPoint: 20,
        lot: "CTZ-3390",
        days: 150,
        qty: 18,
      },
      {
        name: "Paracetamol",
        genericName: "acetaminophen",
        form: "tablet" as const,
        strength: "500 mg",
        category: "Analgesics",
        reorderPoint: 200,
        lot: "PCM-7719",
        days: 730,
        qty: 480,
      },
    ];

    let created = 0;
    for (const f of fixtures) {
      const existing = await ctx.db
        .query("medicines")
        .withIndex("by_name", (q) => q.eq("name", f.name))
        .first();
      if (existing !== null) continue;

      const medicineId = await ctx.db.insert("medicines", {
        name: f.name,
        genericName: f.genericName,
        form: f.form,
        strength: f.strength,
        category: f.category,
        reorderPoint: f.reorderPoint,
      });

      const batchId = await ctx.db.insert("batches", {
        medicineId,
        lotNumber: f.lot,
        expiryDate: now + f.days * DAY,
        quantityExpected: f.qty,
        receivedDate: now - 30 * DAY,
        supplier: "Zuellig Pharma",
        status: "active",
      });

      await ctx.db.insert("movements", {
        batchId,
        type: "delivery",
        delta: f.qty,
        at: now - 30 * DAY,
        ref: "SEED",
      });

      created++;
    }

    return `Seeded ${created} medicines with one lot each.`;
  },
});
