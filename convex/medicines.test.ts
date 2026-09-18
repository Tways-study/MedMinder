import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

// convex-test runs mutations/queries in an isolated in-memory DB per test.
//
// @convex-dev/auth's getAuthUserId reads ctx.auth.getUserIdentity().subject
// and treats the first segment (before "|") as the userId. To produce a valid
// Id<"users"> we pre-insert a user row, then pass that real document ID as
// withIdentity's `subject`. The tokenIdentifier can be anything unique.

async function makeUser(t: ReturnType<typeof convexTest>, tag: string) {
  const userId = await t.run(async (ctx) => {
    return await ctx.db.insert("users" as any, { email: `${tag}@test.example` });
  });
  return t.withIdentity({ subject: userId, tokenIdentifier: `test:${userId}` });
}

test("searchByName returns medicines whose name matches the query", async () => {
  const t = convexTest(schema);
  const asUser = await makeUser(t, "pharmacist");

  await asUser.mutation(api.medicines.create, {
    name: "Amoxicillin",
    form: "capsule",
    reorderPoint: 10,
    onHandQuantity: 50,
    actualQuantity: 50,
  });
  await asUser.mutation(api.medicines.create, {
    name: "Ibuprofen",
    form: "tablet",
    reorderPoint: 5,
    onHandQuantity: 30,
    actualQuantity: 30,
  });

  const results = await asUser.query(api.medicines.searchByName, { q: "amox" });
  expect(results).toHaveLength(1);
  expect(results[0].name).toBe("Amoxicillin");
});

test("searchByName does not return another owner's medicines", async () => {
  const t = convexTest(schema);
  const asUser1 = await makeUser(t, "user1");
  const asUser2 = await makeUser(t, "user2");

  await asUser1.mutation(api.medicines.create, {
    name: "Paracetamol",
    form: "tablet",
    reorderPoint: 5,
    onHandQuantity: 20,
    actualQuantity: 20,
  });

  const results = await asUser2.query(api.medicines.searchByName, { q: "Para" });
  expect(results).toHaveLength(0);
});

test("searchByName matches partial text anywhere in name, generic name, or SKU", async () => {
  const t = convexTest(schema);
  const asUser = await makeUser(t, "partial");

  await asUser.mutation(api.medicines.create, {
    name: "Biogesic",
    genericName: "Paracetamol",
    sku: "BIO-500",
    form: "tablet",
    reorderPoint: 5,
    onHandQuantity: 20,
    actualQuantity: 20,
  });
  await asUser.mutation(api.medicines.create, {
    name: "Amoxicillin",
    form: "capsule",
    reorderPoint: 10,
    onHandQuantity: 50,
    actualQuantity: 50,
  });

  const names = async (q: string) =>
    (await asUser.query(api.medicines.searchByName, { q })).map((m) => m.name);

  expect(await names("b")).toEqual([]);
  expect(await names("bi")).toEqual(["Biogesic"]);
  expect(await names("cillin")).toEqual(["Amoxicillin"]);
  expect(await names("parac")).toEqual(["Biogesic"]);
  expect(await names("o-50")).toEqual(["Biogesic"]);
  expect(await names("  AMOX ")).toEqual(["Amoxicillin"]);
  expect(await names("zzz")).toEqual([]);
});

test("searchByName ranks name matches first, then word starts, then mid-word", async () => {
  const t = convexTest(schema);
  const asUser = await makeUser(t, "ranking");

  const add = (name: string, genericName?: string) =>
    asUser.mutation(api.medicines.create, {
      name,
      genericName,
      form: "tablet",
      reorderPoint: 5,
      onHandQuantity: 20,
      actualQuantity: 20,
    });
  // Inserted in an order that name-sorting alone would get wrong.
  await add("Co-Amoxiclav");
  await add("Amoxil", "Amoxicillin");
  await add("Bamox");
  await add("Amox");

  const names = (await asUser.query(api.medicines.searchByName, { q: "amox" })).map(
    (m) => m.name,
  );
  expect(names).toEqual(["Amox", "Amoxil", "Co-Amoxiclav", "Bamox"]);
});
