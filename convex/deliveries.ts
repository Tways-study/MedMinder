import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  assertNonEmpty,
  assertQuantity,
  assertTimestamp,
  requireAuth,
} from "./lib/guards";

const deliveryLine = v.object({
  medicineId: v.id("medicines"),
  lotNumber: v.string(),
  expiryDate: v.number(),
  quantity: v.number(),
});

/**
 * Records a delivery and the lots it brought in.
 *
 * This is the only path that adds stock. Sales are not logged per-transaction —
 * the physical count corrects the balance instead — so a delivery and a count
 * adjustment are the only two things that ever move a batch.
 *
 * Convex mutations are transactional, so a delivery either lands complete or
 * not at all: no half-entered invoice leaving phantom lots on the shelf.
 */
export const create = mutation({
  args: {
    receivedDate: v.number(),
    supplier: v.string(),
    invoiceRef: v.optional(v.string()),
    notes: v.optional(v.string()),
    lines: v.array(deliveryLine),
  },
  returns: v.id("deliveries"),
  handler: async (ctx, args) => {
    await requireAuth(ctx);

    const supplier = assertNonEmpty(args.supplier, "Supplier");
    assertTimestamp(args.receivedDate, "Received date");

    if (args.lines.length === 0) {
      throw new ConvexError("Add at least one medicine to the delivery.");
    }

    // Validate every line before writing anything, so a bad last line cannot
    // leave the first few already committed.
    for (const [i, line] of args.lines.entries()) {
      const where = `Line ${i + 1}`;
      assertNonEmpty(line.lotNumber, `${where}: lot number`);
      assertTimestamp(line.expiryDate, `${where}: expiry date`);
      assertQuantity(line.quantity, `${where}: quantity`);

      if (line.quantity === 0) {
        throw new ConvexError(
          `${where}: a delivery of zero units is not a delivery.`,
        );
      }

      const medicine = await ctx.db.get(line.medicineId);
      if (medicine === null) {
        throw new ConvexError(`${where}: that medicine no longer exists.`);
      }
    }

    const deliveryId = await ctx.db.insert("deliveries", {
      receivedDate: args.receivedDate,
      supplier,
      invoiceRef: args.invoiceRef?.trim() || undefined,
      notes: args.notes?.trim() || undefined,
    });

    for (const line of args.lines) {
      const lotNumber = line.lotNumber.trim();

      // Same drug, same lot, same expiry is the same physical lot arriving
      // again. Top it up rather than splitting the shelf into two cards she
      // would then have to count separately.
      const existing = await ctx.db
        .query("batches")
        .withIndex("by_lot_identity", (q) =>
          q
            .eq("medicineId", line.medicineId)
            .eq("lotNumber", lotNumber)
            .eq("expiryDate", line.expiryDate),
        )
        .first();

      let batchId;
      if (existing !== null) {
        batchId = existing._id;
        await ctx.db.patch(batchId, {
          quantityExpected: existing.quantityExpected + line.quantity,
          status: "active",
          receivedDate: args.receivedDate,
        });
      } else {
        batchId = await ctx.db.insert("batches", {
          medicineId: line.medicineId,
          lotNumber,
          expiryDate: line.expiryDate,
          quantityExpected: line.quantity,
          receivedDate: args.receivedDate,
          supplier,
          status: "active",
        });
      }

      // delta is derived from an already range-checked quantity above; it is
      // never taken from the client directly.
      await ctx.db.insert("movements", {
        batchId,
        type: "delivery",
        delta: line.quantity,
        at: args.receivedDate,
        ref: args.invoiceRef?.trim() || undefined,
      });
    }

    return deliveryId;
  },
});

export const listRecent = query({
  args: { limit: v.optional(v.number()) },
  returns: v.array(
    v.object({
      _id: v.id("deliveries"),
      _creationTime: v.number(),
      receivedDate: v.number(),
      supplier: v.string(),
      invoiceRef: v.optional(v.string()),
      notes: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, { limit }) => {
    await requireAuth(ctx);
    return await ctx.db
      .query("deliveries")
      .withIndex("by_received")
      .order("desc")
      .take(Math.min(limit ?? 20, 100));
  },
});
