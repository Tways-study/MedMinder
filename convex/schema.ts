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

export const batchStatus = v.union(
  v.literal("active"),
  v.literal("depleted"),
  v.literal("expired"),
);

export const varianceReason = v.union(
  v.literal("damaged"),
  v.literal("expired"),
  v.literal("miscount"),
  v.literal("unrecorded_sale"),
  v.literal("other"),
);

export const movementType = v.union(
  v.literal("delivery"),
  v.literal("count_adjustment"),
);

export default defineSchema({
  ...authTables,

  medicines: defineTable({
    name: v.string(),
    genericName: v.optional(v.string()),
    form: medicineForm,
    strength: v.optional(v.string()),
    category: v.optional(v.string()),
    // Dashboard flags the medicine as low when total stock falls to or below this.
    reorderPoint: v.number(),
    notes: v.optional(v.string()),
  })
    .index("by_name", ["name"])
    .index("by_category", ["category"]),

  // A lot of a medicine. Expiry lives here, not on the medicine: the same drug
  // can sit on the shelf as two lots expiring months apart.
  batches: defineTable({
    medicineId: v.id("medicines"),
    lotNumber: v.string(),
    expiryDate: v.number(),
    quantityExpected: v.number(),
    receivedDate: v.number(),
    supplier: v.optional(v.string()),
    status: batchStatus,
  })
    .index("by_medicine", ["medicineId"])
    .index("by_expiry", ["expiryDate"])
    .index("by_status_expiry", ["status", "expiryDate"]),

  deliveries: defineTable({
    receivedDate: v.number(),
    supplier: v.string(),
    invoiceRef: v.optional(v.string()),
    notes: v.optional(v.string()),
  }).index("by_received", ["receivedDate"]),

  countSessions: defineTable({
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    status: v.union(v.literal("draft"), v.literal("completed")),
    scope: v.union(
      v.object({ kind: v.literal("all") }),
      v.object({ kind: v.literal("category"), category: v.string() }),
      v.object({ kind: v.literal("medicine"), medicineId: v.id("medicines") }),
    ),
    notes: v.optional(v.string()),
  }).index("by_status_started", ["status", "startedAt"]),

  countLines: defineTable({
    sessionId: v.id("countSessions"),
    batchId: v.id("batches"),
    // Snapshotted when the line is created, not read live: a delivery arriving
    // mid-count must not silently change a variance she already wrote down.
    expectedQty: v.number(),
    countedQty: v.optional(v.number()),
    reason: v.optional(varianceReason),
  })
    .index("by_session", ["sessionId"])
    .index("by_session_batch", ["sessionId", "batchId"]),

  movements: defineTable({
    batchId: v.id("batches"),
    type: movementType,
    delta: v.number(),
    at: v.number(),
    ref: v.optional(v.string()),
  }).index("by_batch", ["batchId"]),

  settings: defineTable({
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
  }),
});
