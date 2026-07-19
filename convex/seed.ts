import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

/**
 * Development fixture. Medicines sit at deliberately chosen expiry distances
 * from today so every tier boundary is exercised: already expired, inside 30
 * days, inside 90, inside 180 (the "expires in 5 months" case from the
 * original brief), and far enough out to stay quiet.
 *
 * internalMutation, so it is not reachable from the browser. Takes an
 * ownerId because MedMinder is multi-tenant: fixtures belong to one account,
 * same as everything else.
 */
export const dev = internalMutation({
  args: { ownerId: v.id("users") },
  returns: v.string(),
  handler: async (ctx, { ownerId }) => {
    const DAY = 24 * 60 * 60 * 1000;
    const now = Date.now();

    /** Expiries are calendar dates, so they land on UTC midnight like real ones. */
    const expiryIn = (days: number) => {
      const d = new Date(now + days * DAY);
      return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
    };

    const fixtures = [
      {
        name: "Amoxicillin",
        genericName: "amoxicillin trihydrate",
        form: "capsule" as const,
        strength: "500 mg",
        category: "Antibiotics",
        reorderPoint: 100,
        days: -12,
        qty: 24,
      },
      {
        name: "Salbutamol",
        form: "drops" as const,
        strength: "100 mcg",
        category: "Respiratory",
        reorderPoint: 10,
        days: 20,
        qty: 6,
      },
      {
        name: "Mefenamic acid",
        form: "tablet" as const,
        strength: "500 mg",
        category: "Analgesics",
        reorderPoint: 80,
        days: 62,
        qty: 140,
      },
      {
        name: "Cetirizine",
        form: "syrup" as const,
        strength: "5 mg/5 mL",
        category: "Antihistamines",
        reorderPoint: 20,
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
        days: 730,
        qty: 480,
      },
    ];

    let created = 0;
    for (const f of fixtures) {
      const existing = await ctx.db
        .query("medicines")
        .withIndex("by_owner_name", (q) => q.eq("ownerId", ownerId).eq("name", f.name))
        .first();
      if (existing !== null) continue;

      await ctx.db.insert("medicines", {
        ownerId,
        name: f.name,
        genericName: f.genericName,
        form: f.form,
        strength: f.strength,
        category: f.category,
        reorderPoint: f.reorderPoint,
        expiryDate: expiryIn(f.days),
        onHandQuantity: f.qty,
        actualQuantity: f.qty,
      });

      created++;
    }

    return `Seeded ${created} medicines.`;
  },
});
