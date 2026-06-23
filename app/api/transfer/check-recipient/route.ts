import { NextRequest, NextResponse } from "next/server"
import { getAddress, isAddress } from "viem"

import {
  isCirclesHuman,
  isPinkieOrgConfigured,
  ADDRESS_MISMATCH_HINT,
  NOT_ON_CIRCLES_MESSAGE,
  SETUP_INCOMPLETE_MESSAGE,
} from "@/lib/circles-server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const recipientRaw = typeof body.recipient === "string" ? body.recipient : ""

    if (!isAddress(recipientRaw, { strict: false })) {
      return NextResponse.json({ error: "Valid recipient address is required." }, { status: 400 })
    }

    const recipient = getAddress(recipientRaw)
    const isHuman = await isCirclesHuman(recipient)

    return NextResponse.json({
      isHuman,
      canReceive: isHuman,
      message: isHuman ? null : SETUP_INCOMPLETE_MESSAGE,
      hint: isHuman ? null : ADDRESS_MISMATCH_HINT,
      orgConfigured: isPinkieOrgConfigured(),
    })
  } catch (error) {
    console.error("[transfer/check-recipient]", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not check recipient." },
      { status: 500 },
    )
  }
}
