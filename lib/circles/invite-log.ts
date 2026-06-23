type InviteLogLevel = "info" | "warn" | "error"

export type InviteLogContext = {
  requestId: string
  route: string
  startedAt: number
}

export function createInviteRequestId(): string {
  return `inv_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

export function createInviteLogContext(route: string): InviteLogContext {
  return {
    requestId: createInviteRequestId(),
    route,
    startedAt: Date.now(),
  }
}

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack?.split("\n").slice(0, 6),
    }
  }
  return { message: String(error) }
}

export function inviteLog(
  ctx: InviteLogContext,
  level: InviteLogLevel,
  step: string,
  data?: Record<string, unknown>,
) {
  const payload = {
    ts: new Date().toISOString(),
    requestId: ctx.requestId,
    route: ctx.route,
    step,
    elapsedMs: Date.now() - ctx.startedAt,
    ...data,
  }

  const line = `[pinkie/invite] ${JSON.stringify(payload)}`
  if (level === "error") console.error(line)
  else if (level === "warn") console.warn(line)
  else console.log(line)
}

export function inviteLogError(
  ctx: InviteLogContext,
  step: string,
  error: unknown,
  data?: Record<string, unknown>,
) {
  inviteLog(ctx, "error", step, {
    ...data,
    error: serializeError(error),
  })
}

export function summarizeRequest(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for")
  const realIp = request.headers.get("x-real-ip")
  return {
    method: request.method,
    url: request.url,
    origin: request.headers.get("origin"),
    referer: request.headers.get("referer"),
    host: request.headers.get("host"),
    userAgent: request.headers.get("user-agent"),
    ip: forwardedFor?.split(",")[0]?.trim() || realIp || "unknown",
  }
}
