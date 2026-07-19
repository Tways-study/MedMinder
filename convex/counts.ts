import { ConvexError, v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { assertQuantity, requireAuth } from "./lib/guards";
import { variance } from "./lib/inventory";
import { varianceReason } from "./schema";

const countScope = v.union(
  v.object({ kind: v.literal("all") }),
  v.object({ kind: v.literal("category"), category: v.string() }),
  v.object({ kind: v.literal("medicine"), medicineId: v.id("medicines") }),
);

/** The lots a scope covers. Depleted lots are excluded: there is nothing to count. */
async function batchesInScope(
  ctx: MutationCtx,
  ownerId: Id<"users">,
  scope: { kind: string; category?: string; medicineId?: Id<"medicines"> },
): Promise<Doc<"batches">[]> {
  if (scope.kind === "medicine") {
    const batches = await ctx.db
      .query("batches")
      .withIndex("by_medicine", (q) =>
        q.eq("medicineId", scope.medicineId as Id<"medicines">),
      )
      .collect();
    return batches.filter((b) => b.ownerId === ownerId && b.status !== "depleted");
  }

  const active = await ctx.db
    .query("batches")
    .withIndex("by_owner_status_expiry", (q) =>
      q.eq("ownerId", ownerId).eq("status", "active"),
    )
    .collect();

  if (scope.kind === "all") return active;

  // Category lives on the medicine, so the lots have to be matched through it.
  const medicines = await ctx.db
    .query("medicines")
    .withIndex("by_owner_category", (q) =>
      q.eq("ownerId", ownerId).eq("category", scope.category),
    )
    .collect();
  const ids = new Set(medicines.map((m) => m._id));
  return active.filter((b) => ids.has(b.medicineId));
}

/**
 * Opens a count and snapshots the expected quantity of every lot in scope.
 *
 * The snapshot is the whole point: if a delivery lands while she is walking the
 * shelf, the number she wrote down must still be measured against what the
 * system claimed when she started, not against a balance that moved underneath
 * her.
 */
export const start = mutation({
  args: { scope: countScope, notes: v.optional(v.string()) },
  returns: v.id("countSessions"),
  handler: async (ctx, { scope, notes }) => {
    const ownerId = await requireAuth(ctx);

    const existing = await ctx.db
      .query("countSessions")
      .withIndex("by_owner_status_started", (q) =>
        q.eq("ownerId", ownerId).eq("status", "draft"),
      )
      .first();

    if (existing !== null) {
      throw new ConvexError(
        "A count is already in progress. Finish or discard it first.",
      );
    }

    const batches = await batchesInScope(ctx, ownerId, scope);
    if (batches.length === 0) {
      throw new ConvexError("There are no lots on the shelf to count.");
    }

    const sessionId = await ctx.db.insert("countSessions", {
      ownerId,
      startedAt: Date.now(),
      status: "draft",
      scope,
      notes: notes?.trim() || undefined,
    });

    for (const batch of batches) {
      await ctx.db.insert("countLines", {
        sessionId,
        batchId: batch._id,
        expectedQty: batch.quantityExpected,
      });
    }

    return sessionId;
  },
});

/** Records what she counted on one lot. Idempotent: re-counting overwrites. */
export const saveLine = mutation({
  args: {
    sessionId: v.id("countSessions"),
    batchId: v.id("batches"),
    countedQty: v.number(),
    reason: v.optional(varianceReason),
  },
  returns: v.null(),
  handler: async (ctx, { sessionId, batchId, countedQty, reason }) => {
    const ownerId = await requireAuth(ctx);

    assertQuantity(countedQty, "Counted quantity");

    const session = await ctx.db.get(sessionId);
    if (session === null) throw new ConvexError("That count no longer exists.");
    if (session.ownerId !== ownerId) {
      throw new ConvexError("That count no longer exists.");
    }
    if (session.status !== "draft") {
      throw new ConvexError("That count is already finished.");
    }

    const line = await ctx.db
      .query("countLines")
      .withIndex("by_session_batch", (q) =>
        q.eq("sessionId", sessionId).eq("batchId", batchId),
      )
      .first();

    if (line === null) {
      throw new ConvexError("That lot is not part of this count.");
    }

    await ctx.db.patch(line._id, { countedQty, reason });
    return null;
  },
});

/**
 * Closes the count and posts the adjustments.
 *
 * Every counted line writes its counted number onto the batch. Lines with a
 * real difference also write a movement, so the correction stays auditable
 * afterwards. Lines she skipped are left alone rather than assumed to be zero:
 * not counting a lot is not the same as counting no units.
 */
export const complete = mutation({
  args: { sessionId: v.id("countSessions") },
  returns: v.object({
    posted: v.number(),
    skipped: v.number(),
  }),
  handler: async (ctx, { sessionId }) => {
    const ownerId = await requireAuth(ctx);

    const session = await ctx.db.get(sessionId);
    if (session === null) throw new ConvexError("That count no longer exists.");
    if (session.ownerId !== ownerId) {
      throw new ConvexError("That count no longer exists.");
    }
    if (session.status !== "draft") {
      throw new ConvexError("That count is already finished.");
    }

    const lines = await ctx.db
      .query("countLines")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .collect();

    const at = Date.now();
    let posted = 0;
    let skipped = 0;

    for (const line of lines) {
      if (line.countedQty === undefined) {
        skipped++;
        continue;
      }

      const batch = await ctx.db.get(line.batchId);
      if (batch === null) continue; // Lot removed mid-count; nothing to correct.

      const { delta } = variance(line.expectedQty, line.countedQty);

      await ctx.db.patch(line.batchId, {
        quantityExpected: line.countedQty,
        // A lot counted to zero is off the shelf. It stays as history, but it
        // should stop showing up as stock or as an expiry alert.
        status: line.countedQty === 0 ? "depleted" : batch.status,
      });

      if (delta !== 0) {
        // delta derives from two already range-checked quantities.
        await ctx.db.insert("movements", {
          batchId: line.batchId,
          type: "count_adjustment",
          delta,
          at,
          ref: line.reason,
        });
      }

      posted++;
    }

    await ctx.db.patch(sessionId, { status: "completed", completedAt: at });
    return { posted, skipped };
  },
});

export const discard = mutation({
  args: { sessionId: v.id("countSessions") },
  returns: v.null(),
  handler: async (ctx, { sessionId }) => {
    const ownerId = await requireAuth(ctx);

    const session = await ctx.db.get(sessionId);
    if (session === null) return null;
    if (session.ownerId !== ownerId) return null;
    if (session.status !== "draft") {
      throw new ConvexError("A finished count cannot be discarded.");
    }

    for (const line of await ctx.db
      .query("countLines")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .collect()) {
      await ctx.db.delete(line._id);
    }

    await ctx.db.delete(sessionId);
    return null;
  },
});

const countLineView = v.object({
  _id: v.id("countLines"),
  batchId: v.id("batches"),
  expectedQty: v.number(),
  countedQty: v.optional(v.number()),
  reason: v.optional(varianceReason),
  medicineName: v.string(),
  strength: v.optional(v.string()),
  form: v.string(),
  lotNumber: v.string(),
  expiryDate: v.number(),
});

/** The draft count, if one is open, with everything the shelf walk needs. */
export const current = query({
  args: {},
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("countSessions"),
      startedAt: v.number(),
      scope: countScope,
      lines: v.array(countLineView),
    }),
  ),
  handler: async (ctx) => {
    const ownerId = await requireAuth(ctx);

    const session = await ctx.db
      .query("countSessions")
      .withIndex("by_owner_status_started", (q) =>
        q.eq("ownerId", ownerId).eq("status", "draft"),
      )
      .first();

    if (session === null) return null;

    const lines = await ctx.db
      .query("countLines")
      .withIndex("by_session", (q) => q.eq("sessionId", session._id))
      .collect();

    const view = [];
    for (const line of lines) {
      const batch = await ctx.db.get(line.batchId);
      if (batch === null) continue;
      const medicine = await ctx.db.get(batch.medicineId);
      if (medicine === null) continue;

      view.push({
        _id: line._id,
        batchId: line.batchId,
        expectedQty: line.expectedQty,
        countedQty: line.countedQty,
        reason: line.reason,
        medicineName: medicine.name,
        strength: medicine.strength,
        form: medicine.form,
        lotNumber: batch.lotNumber,
        expiryDate: batch.expiryDate,
      });
    }

    // Soonest expiry first, matching how the shelf is worked.
    view.sort((a, b) => a.expiryDate - b.expiryDate);

    return {
      _id: session._id,
      startedAt: session.startedAt,
      scope: session.scope,
      lines: view,
    };
  },
});

/**
 * The distinct categories, for scoping a count to one shelf.
 *
 * Walks the category index rather than the table, and stops at 2000 medicines —
 * far beyond what a community pharmacy stocks, but it keeps this bounded if the
 * catalogue ever grows past what one shop can hold.
 */
export const categories = query({
  args: {},
  returns: v.array(v.string()),
  handler: async (ctx) => {
    const ownerId = await requireAuth(ctx);
    const medicines = await ctx.db
      .query("medicines")
      .withIndex("by_owner_category", (q) => q.eq("ownerId", ownerId))
      .take(2000);
    const set = new Set(
      medicines.map((m) => m.category).filter((c): c is string => !!c),
    );
    return [...set].sort();
  },
});

export const history = query({
  args: { limit: v.optional(v.number()) },
  returns: v.array(
    v.object({
      _id: v.id("countSessions"),
      startedAt: v.number(),
      completedAt: v.optional(v.number()),
      scope: countScope,
      linesCounted: v.number(),
      shortLines: v.number(),
      overLines: v.number(),
    }),
  ),
  handler: async (ctx, { limit }) => {
    const ownerId = await requireAuth(ctx);

    const sessions = await ctx.db
      .query("countSessions")
      .withIndex("by_owner_status_started", (q) =>
        q.eq("ownerId", ownerId).eq("status", "completed"),
      )
      .order("desc")
      .take(Math.min(limit ?? 10, 50));

    return await Promise.all(
      sessions.map(async (session) => {
        const lines = await ctx.db
          .query("countLines")
          .withIndex("by_session", (q) => q.eq("sessionId", session._id))
          .collect();

        const counted = lines.filter((l) => l.countedQty !== undefined);
        return {
          _id: session._id,
          startedAt: session.startedAt,
          completedAt: session.completedAt,
          scope: session.scope,
          linesCounted: counted.length,
          shortLines: counted.filter((l) => l.countedQty! < l.expectedQty).length,
          overLines: counted.filter((l) => l.countedQty! > l.expectedQty).length,
        };
      }),
    );
  },
});
