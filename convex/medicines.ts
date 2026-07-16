import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  assertNonEmpty,
  assertQuantity,
  requireAuth,
} from "./lib/guards";
import { medicineForm } from "./schema";

const medicineFields = {
  name: v.string(),
  genericName: v.optional(v.string()),
  form: medicineForm,
  strength: v.optional(v.string()),
  category: v.optional(v.string()),
  reorderPoint: v.number(),
  notes: v.optional(v.string()),
};

const medicineDoc = v.object({
  _id: v.id("medicines"),
  _creationTime: v.number(),
  ...medicineFields,
});

/** A medicine plus the stock figures the list needs, so the UI never N+1s. */
const medicineWithStock = v.object({
  _id: v.id("medicines"),
  _creationTime: v.number(),
  ...medicineFields,
  totalQuantity: v.number(),
  batchCount: v.number(),
  soonestExpiry: v.union(v.number(), v.null()),
});

export const list = query({
  args: {},
  returns: v.array(medicineWithStock),
  handler: async (ctx) => {
    await requireAuth(ctx);

    const medicines = await ctx.db.query("medicines").withIndex("by_name").collect();

    return await Promise.all(
      medicines.map(async (medicine) => {
        const batches = await ctx.db
          .query("batches")
          .withIndex("by_medicine", (q) => q.eq("medicineId", medicine._id))
          .collect();

        // Depleted lots still exist as history but hold no stock.
        const live = batches.filter((b) => b.status !== "depleted");

        return {
          ...medicine,
          totalQuantity: live.reduce((sum, b) => sum + b.quantityExpected, 0),
          batchCount: live.length,
          soonestExpiry: live.length
            ? Math.min(...live.map((b) => b.expiryDate))
            : null,
        };
      }),
    );
  },
});

export const get = query({
  args: { medicineId: v.id("medicines") },
  returns: v.union(medicineDoc, v.null()),
  handler: async (ctx, { medicineId }) => {
    await requireAuth(ctx);
    return await ctx.db.get(medicineId);
  },
});

export const create = mutation({
  args: medicineFields,
  returns: v.id("medicines"),
  handler: async (ctx, args) => {
    await requireAuth(ctx);

    const name = assertNonEmpty(args.name, "Name");
    assertQuantity(args.reorderPoint, "Reorder point");

    return await ctx.db.insert("medicines", {
      ...args,
      name,
      genericName: args.genericName?.trim() || undefined,
      strength: args.strength?.trim() || undefined,
      category: args.category?.trim() || undefined,
      notes: args.notes?.trim() || undefined,
    });
  },
});

export const update = mutation({
  args: { medicineId: v.id("medicines"), ...medicineFields },
  returns: v.null(),
  handler: async (ctx, { medicineId, ...args }) => {
    await requireAuth(ctx);

    const existing = await ctx.db.get(medicineId);
    if (existing === null) throw new ConvexError("That medicine no longer exists.");

    assertNonEmpty(args.name, "Name");
    assertQuantity(args.reorderPoint, "Reorder point");

    await ctx.db.patch(medicineId, {
      ...args,
      name: args.name.trim(),
      genericName: args.genericName?.trim() || undefined,
      strength: args.strength?.trim() || undefined,
      category: args.category?.trim() || undefined,
      notes: args.notes?.trim() || undefined,
    });
    return null;
  },
});

export const remove = mutation({
  args: { medicineId: v.id("medicines") },
  returns: v.null(),
  handler: async (ctx, { medicineId }) => {
    await requireAuth(ctx);

    // Refuse rather than cascade: deleting a medicine would orphan its lots and
    // silently erase the movement history behind a variance she may still be
    // reconciling.
    const batch = await ctx.db
      .query("batches")
      .withIndex("by_medicine", (q) => q.eq("medicineId", medicineId))
      .first();

    if (batch !== null) {
      throw new ConvexError(
        "This medicine still has lots recorded. Remove its lots first.",
      );
    }

    await ctx.db.delete(medicineId);
    return null;
  },
});
