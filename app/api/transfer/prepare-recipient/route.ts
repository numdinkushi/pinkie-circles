import { NextRequest, NextResponse } from "next/server"
import { getAddress, isAddress } from "viem"

import { ensureRecipientCanReceiveCrc, isPinkieOrgConfigured } from "@/lib/circles-server"

export async function POST(request: NextRequest) {
  try {
    if (!isPinkieOrgConfigured()) {
      return NextResponse.json({ error: "Circles org is not configured on the server." }, { status: 503 })
    }

    const body = await request.json()
    const recipientRaw = typeof body.recipient === "string" ? body.recipient : ""
    const senderRaw = typeof body.sender === "string" ? body.sender : undefined

    if (!isAddress(recipientRaw, { strict: false })) {
      return NextResponse.json({ error: "Valid recipient address is required." }, { status: 400 })
    }

    const recipient = getAddress(recipientRaw)
    const sender =
      senderRaw && isAddress(senderRaw, { strict: false }) ? getAddress(senderRaw) : undefined

    const result = await ensureRecipientCanReceiveCrc({ recipient, sender })

    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error("[transfer/prepare-recipient]", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not prepare recipient." },
      { status: 400 },
    )
  }
}
