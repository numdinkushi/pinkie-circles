import { v } from "convex/values"

import { mutation, query } from "./_generated/server"

function normalizeAddress(address: string) {
  return address.toLowerCase()
}

function getKind(promise: { kind?: "promise" | "surprise" | "reveal" }) {
  const raw = promise.kind ?? "promise"
  if (raw === "surprise" || raw === "reveal") return "surprise"
  return "promise"
}

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("promises")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first()
  },
})

export const listByMaker = query({
  args: { makerAddress: v.string() },
  handler: async (ctx, args) => {
    const makerAddress = normalizeAddress(args.makerAddress)
    const rows = await ctx.db
      .query("promises")
      .withIndex("by_maker", (q) => q.eq("makerAddress", makerAddress))
      .collect()
    return rows.sort((a, b) => b.createdAt - a.createdAt)
  },
})

export const listByWitness = query({
  args: { witnessAddress: v.string() },
  handler: async (ctx, args) => {
    const witnessAddress = normalizeAddress(args.witnessAddress)
    const rows = await ctx.db
      .query("promises")
      .withIndex("by_witness", (q) => q.eq("witnessAddress", witnessAddress))
      .collect()
    return rows.sort((a, b) => b.createdAt - a.createdAt)
  },
})

export const listForUser = query({
  args: { address: v.string() },
  handler: async (ctx, args) => {
    const address = normalizeAddress(args.address)
    const made = await ctx.db
      .query("promises")
      .withIndex("by_maker", (q) => q.eq("makerAddress", address))
      .collect()
    const witnessed = await ctx.db
      .query("promises")
      .withIndex("by_witness", (q) => q.eq("witnessAddress", address))
      .collect()

    const seen = new Set<string>()
    const merged = [...made, ...witnessed].filter((row) => {
      if (seen.has(row.slug)) return false
      seen.add(row.slug)
      return true
    })

    return merged.sort((a, b) => b.createdAt - a.createdAt)
  },
})

export const listBetween = query({
  args: { address: v.string(), counterparty: v.string() },
  handler: async (ctx, args) => {
    const me = normalizeAddress(args.address)
    const them = normalizeAddress(args.counterparty)

    const rows = await ctx.db.query("promises").collect()
    return rows
      .filter((row) => {
        const maker = row.makerAddress
        const witness = row.witnessAddress
        if (!witness) return false
        return (
          (maker === me && witness === them) ||
          (maker === them && witness === me)
        )
      })
      .sort((a, b) => b.createdAt - a.createdAt)
  },
})

export const getCircleSummary = query({
  args: { address: v.string() },
  handler: async (ctx, args) => {
    const me = normalizeAddress(args.address)
    const rows = await ctx.db.query("promises").collect()

    type Summary = {
      address: string
      openCount: number
      doneCount: number
      lastActivityAt: number
      iMade: number
      iWitnessed: number
    }

    const map = new Map<string, Summary>()

    for (const row of rows) {
      const maker = row.makerAddress
      const witness = row.witnessAddress
      if (!witness) continue

      let counterparty: string | null = null
      let iMade = false
      let iWitnessed = false

      if (maker === me && witness !== me) {
        counterparty = witness
        iMade = true
      } else if (witness === me && maker !== me) {
        counterparty = maker
        iWitnessed = true
      }

      if (!counterparty) continue

      const existing = map.get(counterparty) ?? {
        address: counterparty,
        openCount: 0,
        doneCount: 0,
        lastActivityAt: row.updatedAt,
        iMade: 0,
        iWitnessed: 0,
      }

      if (row.status === "open") existing.openCount += 1
      else existing.doneCount += 1
      if (iMade) existing.iMade += 1
      if (iWitnessed) existing.iWitnessed += 1
      existing.lastActivityAt = Math.max(existing.lastActivityAt, row.updatedAt)

      map.set(counterparty, existing)
    }

    return [...map.values()].sort((a, b) => b.lastActivityAt - a.lastActivityAt)
  },
})

export const create = mutation({
  args: {
    slug: v.string(),
    makerAddress: v.string(),
    text: v.string(),
    dueAt: v.number(),
    kind: v.optional(v.union(v.literal("promise"), v.literal("surprise"), v.literal("reveal"))),
    witnessAddress: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("promises")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first()

    if (existing) {
      throw new Error("This link is already taken. Try again.")
    }

    const now = Date.now()
    const witnessAddress = args.witnessAddress
      ? normalizeAddress(args.witnessAddress)
      : undefined

    return ctx.db.insert("promises", {
      slug: args.slug,
      makerAddress: normalizeAddress(args.makerAddress),
      kind: args.kind ?? "promise",
      witnessAddress,
      witnessAcceptedAt: witnessAddress ? now : undefined,
      text: args.text.trim(),
      dueAt: args.dueAt,
      status: "open",
      createdAt: now,
      updatedAt: now,
    })
  },
})

export const assignWitness = mutation({
  args: {
    slug: v.string(),
    witnessAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const promise = await ctx.db
      .query("promises")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first()

    if (!promise) throw new Error("Promise not found.")

    const kind = getKind(promise)
    if (kind === "promise" && promise.status !== "open") {
      throw new Error("This promise is already closed.")
    }
    if (kind === "surprise" && promise.status !== "done") {
      throw new Error("This surprise is not ready to share yet.")
    }

    const witness = normalizeAddress(args.witnessAddress)
    if (witness === promise.makerAddress) {
      throw new Error("You can't witness your own promise.")
    }

    if (promise.witnessAddress && promise.witnessAddress !== witness) {
      throw new Error(
        kind === "surprise"
          ? "Someone else already discovered this surprise."
          : "Someone else is already holding them to this promise.",
      )
    }

    if (promise.witnessAddress === witness) {
      return promise._id
    }

    const now = Date.now()
    await ctx.db.patch(promise._id, {
      witnessAddress: witness,
      witnessAcceptedAt: now,
      updatedAt: now,
    })

    return promise._id
  },
})

export const markDone = mutation({
  args: {
    slug: v.string(),
    actorAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const promise = await ctx.db
      .query("promises")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first()

    if (!promise) throw new Error("Promise not found.")
    if (promise.status === "done" || promise.status === "acknowledged") return promise._id

    const kind = getKind(promise)
    const actor = normalizeAddress(args.actorAddress)
    const isMaker = actor === promise.makerAddress
    const isWitness = promise.witnessAddress === actor

    if (kind === "surprise") {
      if (!isMaker) {
        throw new Error("Only the maker can close a surprise.")
      }
    } else {
      if (!promise.witnessAddress) {
        throw new Error("Share the link with a friend first — they need to become your witness.")
      }
      if (!isMaker && !isWitness) {
        throw new Error("Only the maker or their witness can close this promise.")
      }
    }

    const now = Date.now()
    await ctx.db.patch(promise._id, {
      status: "done",
      confirmedBy: actor,
      completedAt: now,
      updatedAt: now,
    })

    return promise._id
  },
})

export const edit = mutation({
  args: {
    slug: v.string(),
    actorAddress: v.string(),
    text: v.string(),
    dueAt: v.number(),
  },
  handler: async (ctx, args) => {
    const promise = await ctx.db
      .query("promises")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first()

    if (!promise) throw new Error("Promise not found.")

    const actor = normalizeAddress(args.actorAddress)
    if (actor !== promise.makerAddress) {
      throw new Error("Only the maker can edit this.")
    }
    if (promise.witnessAddress) {
      throw new Error("Can't edit after the link has been shared.")
    }
    if (promise.status === "acknowledged") {
      throw new Error("This is already acknowledged.")
    }

    const text = args.text.trim()
    if (text.length < 4) {
      throw new Error("Write a clear sentence — at least a few words.")
    }

    const now = Date.now()
    await ctx.db.patch(promise._id, {
      text,
      dueAt: args.dueAt,
      editedAt: now,
      updatedAt: now,
    })

    return promise._id
  },
})
