import { NextRequest, NextResponse } from "next/server"
import { getAddress, isAddress } from "viem"

import { ensureOrgTrustsUsers, isPinkieOrgConfigured } from "@/lib/circles-server"

export async function POST(request: NextRequest) {
  try {
    if (!isPinkieOrgConfigured()) {
      return NextResponse.json({ error: "Pinkie org is not configured on the server." }, { status: 503 })
    }

    const body = await request.json()
    const addressesRaw: unknown[] = Array.isArray(body.addresses)
      ? body.addresses
      : [body.address, body.sender, body.recipient]
    const addresses = addressesRaw
      .filter((value): value is string => typeof value === "string" && isAddress(value, { strict: false }))
      .map((value) => getAddress(value))

    if (addresses.length === 0) {
      return NextResponse.json({ error: "At least one valid address is required." }, { status: 400 })
    }

    await ensureOrgTrustsUsers(addresses)

    return NextResponse.json({ success: true, trusted: addresses })
  } catch (error) {
    console.error("[trust/ensure]", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not establish trust." },
      { status: 500 },
    )
  }
}
