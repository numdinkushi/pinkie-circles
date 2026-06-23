import { NextResponse } from "next/server"

import {
  createInviteLogContext,
  inviteLog,
  inviteLogError,
  summarizeRequest,
} from "@/lib/circles/invite-log"
import {
  corsHeadersForOrigin,
  getInviterDiagnostics,
  isInviteConfigured,
  loadInviteEnv,
} from "@/lib/circles/invite-server"

export async function GET(request: Request) {
  const ctx = createInviteLogContext("GET /invite/status")
  inviteLog(ctx, "info", "status_check", summarizeRequest(request))

  if (!isInviteConfigured()) {
    inviteLog(ctx, "warn", "status_not_configured")
    return NextResponse.json({ ok: false, error: "Invite backend not configured." }, { status: 503 })
  }

  try {
    const env = loadInviteEnv()
    inviteLog(ctx, "info", "status_env_loaded", { inviterSafe: env.inviterSafe })

    const diagnostics = await getInviterDiagnostics(env.inviterSafe, ctx)
    inviteLog(ctx, "info", "status_diagnostics_ok", diagnostics)

    return NextResponse.json({ ok: true, requestId: ctx.requestId, ...diagnostics })
  } catch (err) {
    inviteLogError(ctx, "status_failed", err)
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ ok: false, error: message, requestId: ctx.requestId }, { status: 500 })
  }
}

export async function OPTIONS(request: Request) {
  const ctx = createInviteLogContext("OPTIONS /invite/status")
  const origin = request.headers.get("origin")
  inviteLog(ctx, "info", "status_preflight", { origin })

  return new NextResponse(null, {
    status: 204,
    headers: corsHeadersForOrigin(origin),
  })
}
