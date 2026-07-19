import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const medicineForm = v.union(
  v.literal("tablet"),
  v.literal("capsule"),
  v.literal("syrup"),
  v.literal("suspension"),
  v.literal("ointment"),
  v.literal("drops"),
  v.literal("injection"),
  v.literal("other"),
);

export default defineSchema({
  ...authTables,

  // ownerId scopes every top-level table to the account that created it:
  // MedMinder is multi-tenant, and each account's inventory is fully
  // isolated from every other account's.
  //
  // Stock lives directly on the medicine: one expiry date, and two
  // independently-editable quantities — onHandQuantity (the actively
  // maintained "book" number) and actualQuantity (the last physical count).
  // There is no per-lot tracking; a medicine is the unit of record.
  medicines: defineTable({
    ownerId: v.id("users"),
    name: v.string(),
    genericName: v.optional(v.string()),
    form: medicineForm,
    strength: v.optional(v.string()),
    category: v.optional(v.string()),
    // Dashboard flags the medicine as low when on-hand stock falls to or
    // below this.
    reorderPoint: v.number(),
    notes: v.optional(v.string()),
    // Unset until a real expiry is known — a freshly added medicine may not
    // have any yet.
    expiryDate: v.optional(v.number()),
    onHandQuantity: v.number(),
    actualQuantity: v.number(),
  }).index("by_owner_name", ["ownerId", "name"]),

  settings: defineTable({
    ownerId: v.id("users"),
    digestEnabled: v.boolean(),
    digestEmail: v.string(),
    // 0 = Sunday, 1 = Monday, ... matching JS getDay().
    digestDay: v.number(),
    digestHour: v.number(),
    timezone: v.string(),
    // Tier cutoffs in days, descending: [critical, warning, watch].
    alertTiers: v.object({
      critical: v.number(),
      warning: v.number(),
      watch: v.number(),
    }),
    lastDigestSentAt: v.optional(v.number()),
  }).index("by_owner", ["ownerId"]),
});
