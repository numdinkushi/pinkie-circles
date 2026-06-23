import { NextRequest, NextResponse } from "next/server"
import { getAddress, isAddress } from "viem"

import {
  inviteAccountToCircles,
  isInviteConfigured,
  loadInviteEnv,
} from "@/lib/circles/invite-server"
import { isCirclesHuman, waitForCirclesHuman } from "@/lib/circles-server"

export async function POST(request: NextRequest) {
  try {
    if (!isInviteConfigured()) {
      return NextResponse.json(
        { error: "Invite backend is not configured on the server." },
        { status: 503 },
      )
    }

    const body = await request.json()
    const accountRaw = typeof body.account === "string" ? body.account : ""
    if (!isAddress(accountRaw, { strict: false })) {
      return NextResponse.json({ error: "Valid account address is required." }, { status: 400 })
    }

    const account = getAddress(accountRaw)
    if (await isCirclesHuman(account)) {
      return NextResponse.json({ success: true, status: "already", account, isHuman: true })
    }

    const env = loadInviteEnv()
    const result = await inviteAccountToCircles(account, env)
    const isHuman = await waitForCirclesHuman(account)

    return NextResponse.json({
      success: true,
      status: result.status,
      account,
      isHuman,
      txHash: result.txHash,
      quotaRemaining: result.quotaRemaining,
    })
  } catch (error) {
    console.error("[account/register]", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not register account on Circles." },
      { status: 500 },
    )
  }
}
