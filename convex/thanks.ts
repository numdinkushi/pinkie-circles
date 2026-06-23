import { v } from "convex/values"

import { mutation, query } from "./_generated/server"

function isClosedStatus(status: "open" | "done" | "acknowledged") {
  return status === "done" || status === "acknowledged"
}

function normalizeAddress(address: string) {
  return address.toLowerCase()
}

function buildCircle(me: string, promises: Array<{ makerAddress: string; witnessAddress?: string }>) {
  const circle = new Set<string>()
  for (const row of promises) {
    if (!row.witnessAddress) continue
    if (row.makerAddress === me && row.witnessAddress !== me) {
      circle.add(row.witnessAddress)
    }
    if (row.witnessAddress === me && row.makerAddress !== me) {
      circle.add(row.makerAddress)
    }
  }
  return circle
}

export const record = mutation({
  args: {
    fromAddress: v.string(),
    toAddress: v.string(),
    promiseSlug: v.string(),
    amountCrc: v.number(),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("thanksEvents", {
      fromAddress: normalizeAddress(args.fromAddress),
      toAddress: normalizeAddress(args.toAddress),
      promiseSlug: args.promiseSlug,
      amountCrc: args.amountCrc,
      createdAt: Date.now(),
    })
  },
})

export const getHighFives = query({
  args: { address: v.string() },
  handler: async (ctx, args) => {
    const me = normalizeAddress(args.address)
    const promises = await ctx.db.query("promises").collect()
    const thanks = await ctx.db.query("thanksEvents").collect()
    const circle = buildCircle(me, promises)

    type ScoreRow = { address: string; score: number }

    const kept = new Map<string, number>()
    const held = new Map<string, number>()
    const tipped = new Map<string, number>()

    for (const row of promises) {
      if (!isClosedStatus(row.status) || !row.witnessAddress) continue
      const involvesMe = row.makerAddress === me || row.witnessAddress === me
      if (!involvesMe) continue

      if (row.makerAddress !== me && circle.has(row.makerAddress)) {
        kept.set(row.makerAddress, (kept.get(row.makerAddress) ?? 0) + 1)
      }

      if (
        row.witnessAddress !== me &&
        row.confirmedBy === row.witnessAddress &&
        circle.has(row.witnessAddress)
      ) {
        held.set(row.witnessAddress, (held.get(row.witnessAddress) ?? 0) + 1)
      }
    }

    for (const row of thanks) {
      if (row.toAddress === me && circle.has(row.fromAddress)) {
        tipped.set(row.fromAddress, (tipped.get(row.fromAddress) ?? 0) + row.amountCrc)
      }
    }

    const toRows = (map: Map<string, number>): ScoreRow[] =>
      [...map.entries()]
        .map(([address, score]) => ({ address, score }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)

    return {
      kept: toRows(kept),
      held: toRows(held),
      tipped: toRows(tipped),
      myStats: {
        kept: promises.filter((p) => p.makerAddress === me && isClosedStatus(p.status)).length,
        held: promises.filter(
          (p) => p.witnessAddress === me && p.confirmedBy === me,
        ).length,
        thanksSent: thanks
          .filter((t) => t.fromAddress === me)
          .reduce((sum, t) => sum + t.amountCrc, 0),
      },
    }
  },
})
