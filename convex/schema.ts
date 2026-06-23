import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
  profiles: defineTable({
    address: v.string(),
    displayName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    updatedAt: v.number(),
  }).index("by_address", ["address"]),

  promises: defineTable({
    slug: v.string(),
    makerAddress: v.string(),
    kind: v.optional(v.union(v.literal("promise"), v.literal("surprise"), v.literal("reveal"))),
    witnessAddress: v.optional(v.string()),
    witnessAcceptedAt: v.optional(v.number()),
    text: v.string(),
    dueAt: v.number(),
    status: v.union(v.literal("open"), v.literal("done"), v.literal("acknowledged")),
    confirmedBy: v.optional(v.string()),
    completedAt: v.optional(v.number()),
    acknowledgmentFeedback: v.optional(v.string()),
    editedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_maker", ["makerAddress"])
    .index("by_witness", ["witnessAddress"])
    .index("by_status_due", ["status", "dueAt"]),

  thanksEvents: defineTable({
    fromAddress: v.string(),
    toAddress: v.string(),
    promiseSlug: v.string(),
    amountCrc: v.number(),
    feedback: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_from", ["fromAddress"])
    .index("by_to", ["toAddress"])
    .index("by_slug", ["promiseSlug"]),

  transactions: defineTable({
    fromAddress: v.string(),
    toAddress: v.string(),
    promiseSlug: v.string(),
    promiseKind: v.union(v.literal("promise"), v.literal("surprise")),
    amountCrc: v.number(),
    action: v.literal("thanks"),
    feedback: v.optional(v.string()),
    txHashes: v.optional(v.array(v.string())),
    createdAt: v.number(),
  })
    .index("by_from", ["fromAddress"])
    .index("by_to", ["toAddress"])
    .index("by_slug", ["promiseSlug"]),
})
