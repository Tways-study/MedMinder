/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

// convex-test needs to find the function modules; import.meta.glob wires them up.
// The reference above is why: glob is a Vite API, and the convex tsconfig
// otherwise typechecks this file without Vite's ambient types.
const modules = import.meta.glob("./**/*.ts");

/** A signed-in identity. Every inventory function requires one. */
const asUser = (t: ReturnType<typeof convexTest>) =>
  t.withIdentity({ subject: "pharmacist", issuer: "test" });

async function seedMedicineWithLot(
  t: ReturnType<typeof convexTest>,
  quantity: number,
) {
  return await t.run(async (ctx) => {
    const medicineId = await ctx.db.insert("medicines", {
      name: "Losartan",
      form: "tablet",
      reorderPoint: 50,
    });
    const batchId = await ctx.db.insert("batches", {
      medicineId,
      lotNumber: "LOS-1",
      expiryDate: Date.now() + 200 * 24 * 60 * 60 * 1000,
      quantityExpected: quantity,
      receivedDate: Date.now(),
      status: "active",
    });
    return { medicineId, batchId };
  });
}

describe("count sessions", () => {
  test("a short count posts an adjustment that corrects the batch", async () => {
    const t = convexTest(schema, modules);
    const u = asUser(t);
    const { batchId } = await seedMedicineWithLot(t, 100);

    const sessionId = await u.mutation(api.counts.start, {
      scope: { kind: "all" },
    });

    // She counted 92 where the system expected 100: short by 8.
    await u.mutation(api.counts.saveLine, {
      sessionId,
      batchId,
      countedQty: 92,
      reason: "unrecorded_sale",
    });

    await u.mutation(api.counts.complete, { sessionId });

    const batch = await t.run((ctx) => ctx.db.get(batchId));
    expect(batch?.quantityExpected).toBe(92);

    // The correction is auditable: a movement of -8 exists.
    const movements = await t.run((ctx) =>
      ctx.db
        .query("movements")
        .withIndex("by_batch", (q) => q.eq("batchId", batchId))
        .collect(),
    );
    const adjustment = movements.find((m) => m.type === "count_adjustment");
    expect(adjustment?.delta).toBe(-8);
  });

  test("a matching count writes no adjustment movement", async () => {
    const t = convexTest(schema, modules);
    const u = asUser(t);
    const { batchId } = await seedMedicineWithLot(t, 100);

    const sessionId = await u.mutation(api.counts.start, {
      scope: { kind: "all" },
    });
    await u.mutation(api.counts.saveLine, { sessionId, batchId, countedQty: 100 });
    await u.mutation(api.counts.complete, { sessionId });

    const movements = await t.run((ctx) =>
      ctx.db
        .query("movements")
        .withIndex("by_batch", (q) => q.eq("batchId", batchId))
        .collect(),
    );
    // No movement when nothing changed: the ledger stays quiet.
    expect(movements.filter((m) => m.type === "count_adjustment")).toHaveLength(0);
    const batch = await t.run((ctx) => ctx.db.get(batchId));
    expect(batch?.quantityExpected).toBe(100);
  });

  test("expected quantity is snapshotted, so a mid-count delivery does not move it", async () => {
    const t = convexTest(schema, modules);
    const u = asUser(t);
    const { batchId } = await seedMedicineWithLot(t, 100);

    const sessionId = await u.mutation(api.counts.start, {
      scope: { kind: "all" },
    });

    // A delivery lands mid-count, bumping the live balance to 150.
    await t.run(async (ctx) => {
      const batch = await ctx.db.get(batchId);
      await ctx.db.patch(batchId, {
        quantityExpected: batch!.quantityExpected + 50,
      });
    });

    // She still counts against the 100 she saw when the count began.
    const line = await t.run((ctx) =>
      ctx.db
        .query("countLines")
        .withIndex("by_session_batch", (q) =>
          q.eq("sessionId", sessionId).eq("batchId", batchId),
        )
        .first(),
    );
    expect(line?.expectedQty).toBe(100);
  });

  test("counting zero on a lot depletes it", async () => {
    const t = convexTest(schema, modules);
    const u = asUser(t);
    const { batchId } = await seedMedicineWithLot(t, 30);

    const sessionId = await u.mutation(api.counts.start, {
      scope: { kind: "all" },
    });
    await u.mutation(api.counts.saveLine, {
      sessionId,
      batchId,
      countedQty: 0,
      reason: "expired",
    });
    await u.mutation(api.counts.complete, { sessionId });

    const batch = await t.run((ctx) => ctx.db.get(batchId));
    expect(batch?.quantityExpected).toBe(0);
    expect(batch?.status).toBe("depleted");
  });

  test("an unauthenticated caller cannot start a count", async () => {
    const t = convexTest(schema, modules);
    await expect(
      t.mutation(api.counts.start, { scope: { kind: "all" } }),
    ).rejects.toThrow();
  });

  test("a rejected count quantity does not corrupt the batch", async () => {
    const t = convexTest(schema, modules);
    const u = asUser(t);
    const { batchId } = await seedMedicineWithLot(t, 100);
    const sessionId = await u.mutation(api.counts.start, {
      scope: { kind: "all" },
    });

    await expect(
      u.mutation(api.counts.saveLine, {
        sessionId,
        batchId,
        countedQty: -5,
      }),
    ).rejects.toThrow();

    const batch = await t.run((ctx) => ctx.db.get(batchId));
    expect(batch?.quantityExpected).toBe(100);
  });
});
