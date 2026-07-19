import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { batchStatus, movementType } from "./schema";
import { requireAuth } from "./lib/guards";

const batchDoc = v.object({
  _id: v.id("batches"),
  _creationTime: v.number(),
  medicineId: v.id("medicines"),
  lotNumber: v.string(),
  expiryDate: v.number(),
  quantityExpected: v.number(),
  receivedDate: v.number(),
  supplier: v.optional(v.string()),
  status: batchStatus,
});

export const listByMedicine = query({
  args: { medicineId: v.id("medicines") },
  returns: v.array(batchDoc),
  handler: async (ctx, { medicineId }) => {
    const ownerId = await requireAuth(ctx);

    const medicine = await ctx.db.get(medicineId);
    if (medicine === null || medicine.ownerId !== ownerId) return [];

    const batches = await ctx.db
      .query("batches")
      .withIndex("by_medicine", (q) => q.eq("medicineId", medicineId))
      .collect();

    // Soonest expiry first: the lot she needs to act on leads the list.
    return batches
      .map(({ ownerId: _ownerId, ...rest }) => rest)
      .sort((a, b) => a.expiryDate - b.expiryDate);
  },
});

export const history = query({
  args: { batchId: v.id("batches") },
  returns: v.array(
    v.object({
      _id: v.id("movements"),
      _creationTime: v.number(),
      batchId: v.id("batches"),
      type: movementType,
      delta: v.number(),
      at: v.number(),
      ref: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, { batchId }) => {
    const ownerId = await requireAuth(ctx);

    const batch = await ctx.db.get(batchId);
    if (batch === null || batch.ownerId !== ownerId) return [];

    const movements = await ctx.db
      .query("movements")
      .withIndex("by_batch", (q) => q.eq("batchId", batchId))
      .collect();
    return movements.sort((a, b) => b.at - a.at);
  },
});

export const remove = mutation({
  args: { batchId: v.id("batches") },
  returns: v.null(),
  handler: async (ctx, { batchId }) => {
    const ownerId = await requireAuth(ctx);

    const owned = await ctx.db.get(batchId);
    if (owned === null) return null;
    if (owned.ownerId !== ownerId) {
      throw new ConvexError("That lot no longer exists.");
    }

    // A lot referenced by a draft count is mid-reconciliation; deleting it would
    // strand the count line she is standing at the shelf filling in.
    const lines = await ctx.db
      .query("countLines")
      .withIndex("by_batch", (q) => q.eq("batchId", batchId))
      .collect();

    for (const line of lines) {
      const session = await ctx.db.get(line.sessionId);
      if (session?.status === "draft") {
        throw new ConvexError(
          "This lot is part of a count in progress. Finish or discard that count first.",
        );
      }
    }

    for (const movement of await ctx.db
      .query("movements")
      .withIndex("by_batch", (q) => q.eq("batchId", batchId))
      .collect()) {
      await ctx.db.delete(movement._id);
    }

    await ctx.db.delete(batchId);
    return null;
  },
});
