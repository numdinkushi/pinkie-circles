import { NextResponse } from "next/server"
import { isAddress, type Address } from "viem"

import {
  createInviteLogContext,
  inviteLog,
  inviteLogError,
  summarizeRequest,
} from "@/lib/circles/invite-log"
import {
  corsHeadersForOrigin,
  getInviterDiagnostics,
  inviteAccountToCircles,
  isAllowedInviteOrigin,
  isInviteConfigured,
  loadInviteEnv,
} from "@/lib/circles/invite-server"

function originFromReferer(referer: string | null): string | null {
  if (!referer) return null
  try {
    return new URL(referer).origin
  } catch {
    return null
  }
}

export async function GET() {
  const ctx = createInviteLogContext("POST /invite")
  inviteLog(ctx, "info", "health_check", summarizeRequest(new Request("http://local/invite")))

  const configured = isInviteConfigured()
  inviteLog(ctx, "info", "config_check", { configured })

  if (!configured) {
    inviteLog(ctx, "warn", "health_not_configured")
    return NextResponse.json(
      {
        ok: false,
        service: "pinkie-invite",
        configured: false,
        error: "Set PINKIE_INVITER_SAFE_ADDRESS and PINKIE_INVITER_PRIVATE_KEY.",
      },
      { status: 503 },
    )
  }

  try {
    const env = loadInviteEnv()
    inviteLog(ctx, "info", "health_load_env_ok", {
      inviterSafe: env.inviterSafe,
      rpcUrl: env.rpcUrl,
      invitationFarm: env.invitationFarm,
    })

    const diagnostics = await getInviterDiagnostics(env.inviterSafe, ctx)
    inviteLog(ctx, "info", "health_diagnostics_ok", diagnostics)

    return NextResponse.json({
      ok: true,
      service: "pinkie-invite",
      configured: true,
      ...diagnostics,
    })
  } catch (err) {
    inviteLogError(ctx, "health_failed", err)
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ ok: false, service: "pinkie-invite", error: message }, { status: 500 })
  }
}

export async function OPTIONS(request: Request) {
  const ctx = createInviteLogContext("OPTIONS /invite")
  const origin = request.headers.get("origin")
  inviteLog(ctx, "info", "preflight", { origin, allowed: isAllowedInviteOrigin(origin) })

  return new NextResponse(null, {
    status: 204,
    headers: corsHeadersForOrigin(origin),
  })
}

export async function POST(request: Request) {
  const ctx = createInviteLogContext("POST /invite")
  inviteLog(ctx, "info", "request_received", summarizeRequest(request))

  const origin = request.headers.get("origin") ?? originFromReferer(request.headers.get("referer"))
  const cors = corsHeadersForOrigin(origin)
  inviteLog(ctx, "info", "origin_checked", {
    origin,
    allowed: isAllowedInviteOrigin(origin),
  })

  if (!isAllowedInviteOrigin(origin)) {
    inviteLog(ctx, "warn", "origin_forbidden", { origin })
    return NextResponse.json(
      { error: "Forbidden: invites may only be requested from gnosis.io." },
      { status: 403, headers: cors },
    )
  }

  if (!isInviteConfigured()) {
    inviteLog(ctx, "warn", "not_configured")
    return NextResponse.json(
      {
        error:
          "Invite backend not configured. Set PINKIE_INVITER_SAFE_ADDRESS and PINKIE_INVITER_PRIVATE_KEY.",
      },
      { status: 503, headers: cors },
    )
  }

  let body: { account?: string; app?: string }
  try {
    body = await request.json()
    inviteLog(ctx, "info", "body_parsed", {
      account: body.account,
      app: body.app ?? "direct",
    })
  } catch (err) {
    inviteLogError(ctx, "body_parse_failed", err)
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400, headers: cors })
  }

  const account = body.account
  if (!account || !isAddress(account, { strict: false })) {
    inviteLog(ctx, "warn", "invalid_account", { account })
    return NextResponse.json(
      { error: 'Body must be { account: "0x<address>" }' },
      { status: 400, headers: cors },
    )
  }

  try {
    const env = loadInviteEnv()
    inviteLog(ctx, "info", "env_loaded", {
      inviterSafe: env.inviterSafe,
      rpcUrl: env.rpcUrl,
      invitationFarm: env.invitationFarm,
      invitee: account,
      app: body.app ?? "direct",
    })

    const diagnostics = await getInviterDiagnostics(env.inviterSafe, ctx)
    inviteLog(ctx, "info", "inviter_diagnostics", diagnostics)

    if (!diagnostics.canInvite) {
      inviteLog(ctx, "warn", "inviter_not_ready", diagnostics)
    }

    const result = await inviteAccountToCircles(account as Address, env, ctx)
    inviteLog(ctx, "info", "invite_success", {
      invitee: account,
      status: result.status,
      txHash: result.txHash,
    })

    return NextResponse.json(result, { headers: cors })
  } catch (err) {
    inviteLogError(ctx, "invite_failed", err, { invitee: account, app: body.app ?? "direct" })
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message, requestId: ctx.requestId }, { status: 502, headers: cors })
  }
}
