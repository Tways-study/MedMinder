import { paginationOptsValidator } from "convex/server";
import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  assertNonEmpty,
  assertQuantity,
  assertTimestamp,
  requireAuth,
} from "./lib/guards";
import { medicineForm } from "./schema";

const medicineFields = {
  name: v.string(),
  sku: v.optional(v.string()),
  genericName: v.optional(v.string()),
  form: medicineForm,
  strength: v.optional(v.string()),
  category: v.optional(v.string()),
  reorderPoint: v.number(),
  notes: v.optional(v.string()),
  expiryDate: v.optional(v.number()),
  onHandQuantity: v.number(),
  actualQuantity: v.number(),
};

const medicineDoc = v.object({
  _id: v.id("medicines"),
  _creationTime: v.number(),
  ...medicineFields,
});

export const list = query({
  args: {},
  returns: v.array(medicineDoc),
  handler: async (ctx) => {
    const ownerId = await requireAuth(ctx);

    const medicines = await ctx.db
      .query("medicines")
      .withIndex("by_owner_name", (q) => q.eq("ownerId", ownerId))
      .collect();

    return medicines.map(({ ownerId: _ownerId, ...rest }) => rest);
  },
});

/**
 * Paginated flavour of `list`, ordered by name via `by_owner_name` — the same
 * ordering the list page has always shown. The full `list` query is kept for
 * the dashboard, calendar, and optimistic-update paths that genuinely need the
 * whole inventory at once; this one exists so the browse page can page through
 * a large shelf instead of loading it all.
 */
export const listPaged = query({
  args: { paginationOpts: paginationOptsValidator },
  returns: v.object({
    page: v.array(medicineDoc),
    isDone: v.boolean(),
    continueCursor: v.string(),
    splitCursor: v.optional(v.union(v.string(), v.null())),
    pageStatus: v.optional(
      v.union(
        v.literal("SplitRecommended"),
        v.literal("SplitRequired"),
        v.null(),
      ),
    ),
  }),
  handler: async (ctx, { paginationOpts }) => {
    const ownerId = await requireAuth(ctx);

    const result = await ctx.db
      .query("medicines")
      .withIndex("by_owner_name", (q) => q.eq("ownerId", ownerId))
      .paginate(paginationOpts);

    return {
      ...result,
      page: result.page.map(({ ownerId: _ownerId, ...rest }) => rest),
    };
  },
});

export const get = query({
  args: { medicineId: v.id("medicines") },
  returns: v.union(medicineDoc, v.null()),
  handler: async (ctx, { medicineId }) => {
    const ownerId = await requireAuth(ctx);
    const medicine = await ctx.db.get(medicineId);
    if (medicine === null || medicine.ownerId !== ownerId) return null;
    const { ownerId: _ownerId, ...rest } = medicine;
    return rest;
  },
});

function validateFields(args: {
  name: string;
  reorderPoint: number;
  onHandQuantity: number;
  actualQuantity: number;
  expiryDate?: number;
}) {
  const name = assertNonEmpty(args.name, "Name");
  assertQuantity(args.reorderPoint, "Reorder point");
  assertQuantity(args.onHandQuantity, "On-hand quantity");
  assertQuantity(args.actualQuantity, "Actual quantity");
  if (args.expiryDate !== undefined) {
    assertTimestamp(args.expiryDate, "Expiry date");
  }
  return name;
}

export const create = mutation({
  args: medicineFields,
  returns: v.id("medicines"),
  handler: async (ctx, args) => {
    const ownerId = await requireAuth(ctx);

    const name = validateFields(args);

    return await ctx.db.insert("medicines", {
      ...args,
      ownerId,
      name,
      sku: args.sku?.trim() || undefined,
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
    const ownerId = await requireAuth(ctx);

    const existing = await ctx.db.get(medicineId);
    if (existing === null) throw new ConvexError("That medicine no longer exists.");
    if (existing.ownerId !== ownerId) {
      throw new ConvexError("That medicine no longer exists.");
    }

    validateFields(args);

    await ctx.db.patch(medicineId, {
      ...args,
      name: args.name.trim(),
      sku: args.sku?.trim() || undefined,
      genericName: args.genericName?.trim() || undefined,
      strength: args.strength?.trim() || undefined,
      category: args.category?.trim() || undefined,
      notes: args.notes?.trim() || undefined,
    });
    return null;
  },
});

/**
 * The lightweight write behind the dashboard's stepper and tap-to-type
 * controls — a single field, no round trip through every other medicine
 * field the way `update` needs for the full edit form.
 */
export const setStock = mutation({
  args: {
    medicineId: v.id("medicines"),
    kind: v.union(v.literal("onHand"), v.literal("actual")),
    quantity: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, { medicineId, kind, quantity }) => {
    const ownerId = await requireAuth(ctx);

    const existing = await ctx.db.get(medicineId);
    if (existing === null || existing.ownerId !== ownerId) {
      throw new ConvexError("That medicine no longer exists.");
    }

    assertQuantity(quantity, kind === "onHand" ? "On-hand quantity" : "Actual quantity");

    await ctx.db.patch(medicineId, {
      [kind === "onHand" ? "onHandQuantity" : "actualQuantity"]: quantity,
    });
    return null;
  },
});

export const remove = mutation({
  args: { medicineId: v.id("medicines") },
  returns: v.null(),
  handler: async (ctx, { medicineId }) => {
    const ownerId = await requireAuth(ctx);

    const medicine = await ctx.db.get(medicineId);
    if (medicine === null) return null;
    if (medicine.ownerId !== ownerId) {
      throw new ConvexError("That medicine no longer exists.");
    }

    await ctx.db.delete(medicineId);
    return null;
  },
});
