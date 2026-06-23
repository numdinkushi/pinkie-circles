import { v } from "convex/values"

import { mutation, query } from "./_generated/server"

function normalizeAddress(address: string) {
  return address.toLowerCase()
}

function normalizeKind(kind?: "promise" | "surprise" | "reveal") {
  if (kind === "surprise" || kind === "reveal") return "surprise" as const
  return "promise" as const
}

export const recordThanks = mutation({
  args: {
    fromAddress: v.string(),
    toAddress: v.string(),
    promiseSlug: v.string(),
    amountCrc: v.number(),
    feedback: v.optional(v.string()),
    txHashes: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const from = normalizeAddress(args.fromAddress)
    const to = normalizeAddress(args.toAddress)
    const now = Date.now()
    const feedback = args.feedback?.trim() || undefined

    const promise = await ctx.db
      .query("promises")
      .withIndex("by_slug", (q) => q.eq("slug", args.promiseSlug))
      .first()

    if (!promise) {
      throw new Error("Promise not found.")
    }
    if (promise.status !== "done") {
      throw new Error("You can only send thanks after a promise or surprise is done.")
    }
    if (!promise.witnessAddress) {
      throw new Error("No recipient to acknowledge yet.")
    }
    if (from !== promise.witnessAddress) {
      throw new Error("Only the recipient can send thanks.")
    }
    if (to !== promise.makerAddress) {
      throw new Error("Thanks must go to the person who kept their word.")
    }

    const promiseKind = normalizeKind(promise.kind)

    const transactionId = await ctx.db.insert("transactions", {
      fromAddress: from,
      toAddress: to,
      promiseSlug: args.promiseSlug,
      promiseKind,
      amountCrc: args.amountCrc,
      action: "thanks",
      feedback,
      txHashes: args.txHashes,
      createdAt: now,
    })

    await ctx.db.insert("thanksEvents", {
      fromAddress: from,
      toAddress: to,
      promiseSlug: args.promiseSlug,
      amountCrc: args.amountCrc,
      feedback,
      createdAt: now,
    })

    await ctx.db.patch(promise._id, {
      status: "acknowledged",
      acknowledgmentFeedback: feedback,
      updatedAt: now,
    })

    return transactionId
  },
})

export const listForWallet = query({
  args: { address: v.string() },
  handler: async (ctx, args) => {
    const me = normalizeAddress(args.address)

    const sent = await ctx.db
      .query("transactions")
      .withIndex("by_from", (q) => q.eq("fromAddress", me))
      .collect()
    const received = await ctx.db
      .query("transactions")
      .withIndex("by_to", (q) => q.eq("toAddress", me))
      .collect()

    const slugs = new Set([...sent, ...received].map((row) => row.promiseSlug))
    const promiseTexts = new Map<string, string>()
    for (const slug of slugs) {
      const promise = await ctx.db
        .query("promises")
        .withIndex("by_slug", (q) => q.eq("slug", slug))
        .first()
      if (promise) promiseTexts.set(slug, promise.text)
    }

    type Row = {
      _id: string
      direction: "debit" | "credit"
      counterparty: string
      amountCrc: number
      promiseSlug: string
      promiseKind: "promise" | "surprise"
      promiseText?: string
      action: "thanks"
      txHashes?: string[]
      createdAt: number
    }

    const rows: Row[] = [
      ...sent.map((row) => ({
        _id: row._id,
        direction: "debit" as const,
        counterparty: row.toAddress,
        amountCrc: row.amountCrc,
        promiseSlug: row.promiseSlug,
        promiseKind: row.promiseKind,
        promiseText: promiseTexts.get(row.promiseSlug),
        action: row.action,
        txHashes: row.txHashes,
        createdAt: row.createdAt,
      })),
      ...received.map((row) => ({
        _id: row._id,
        direction: "credit" as const,
        counterparty: row.fromAddress,
        amountCrc: row.amountCrc,
        promiseSlug: row.promiseSlug,
        promiseKind: row.promiseKind,
        promiseText: promiseTexts.get(row.promiseSlug),
        action: row.action,
        txHashes: row.txHashes,
        createdAt: row.createdAt,
      })),
    ]

    return rows.sort((a, b) => b.createdAt - a.createdAt)
  },
})

export const getTipsForPromise = query({
  args: {
    promiseSlug: v.string(),
    viewerAddress: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tips = await ctx.db
      .query("transactions")
      .withIndex("by_slug", (q) => q.eq("promiseSlug", args.promiseSlug))
      .collect()

    const viewer = args.viewerAddress ? normalizeAddress(args.viewerAddress) : null

    return {
      tips: tips.sort((a, b) => b.createdAt - a.createdAt),
      viewerSent: viewer
        ? tips.filter((t) => t.fromAddress === viewer).reduce((s, t) => s + t.amountCrc, 0)
        : 0,
      viewerReceived: viewer
        ? tips.filter((t) => t.toAddress === viewer).reduce((s, t) => s + t.amountCrc, 0)
        : 0,
      totalTipped: tips.reduce((s, t) => s + t.amountCrc, 0),
    }
  },
})
