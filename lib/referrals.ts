import type { Address } from "@aboutcircles/sdk-types"

import { getSdk, submitViaHost, type EncodedTx } from "@/lib/circles"

export const REFERRAL_SECRET_KEY = "pinkie:referral-secret"

const SECRET_PATTERN = /^0x[a-fA-F0-9]{64}$/

export function isValidReferralSecret(value: string | null | undefined): value is string {
  return !!value && SECRET_PATTERN.test(value)
}

export function persistReferralSecret(secret: string) {
  if (!isValidReferralSecret(secret)) return
  sessionStorage.setItem(REFERRAL_SECRET_KEY, secret)
}

export function getStoredReferralSecret(): string | null {
  if (typeof window === "undefined") return null
  const stored = sessionStorage.getItem(REFERRAL_SECRET_KEY)
  return isValidReferralSecret(stored) ? stored : null
}

export function readReferralSecretFromUrl(): string | null {
  if (typeof window === "undefined") return null
  const secret = new URLSearchParams(window.location.search).get("secret")
  if (isValidReferralSecret(secret)) {
    persistReferralSecret(secret)
    return secret
  }
  return getStoredReferralSecret()
}

export function clearReferralSecret() {
  sessionStorage.removeItem(REFERRAL_SECRET_KEY)
}

export function getAppOrigin() {
  if (typeof window !== "undefined") {
    return window.location.origin.replace(/\/$/, "")
  }
  return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? ""
}

export function buildAppPath(path: string, params?: Record<string, string>) {
  const origin = getAppOrigin()
  if (!origin) {
    throw new Error("Could not determine app origin for link.")
  }
  const url = new URL(path.replace(/^\//, ""), `${origin}/`)
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value)
    }
  }
  return url.toString()
}

export function buildReferralShareUrl(secret: string, path = "/") {
  const appUrl = buildAppPath(path, { secret })
  const hostBase =
    process.env.NEXT_PUBLIC_CIRCLES_HOST_URL ?? "https://circles.gnosis.io/playground"
  return `${hostBase.replace(/\/$/, "")}?url=${encodeURIComponent(appUrl)}`
}

export function buildPromiseShareUrl(slug: string, secret?: string) {
  const params = secret ? { secret } : undefined
  return buildAppPath(`/p/${slug}`, params)
}

export function wrapInCirclesPlayground(appUrl: string) {
  const hostBase =
    process.env.NEXT_PUBLIC_CIRCLES_HOST_URL ?? "https://circles.gnosis.io/playground"
  return `${hostBase.replace(/\/$/, "")}?url=${encodeURIComponent(appUrl)}`
}

/** Opens Pinkie inside the Circles playground (wallet connect works there). */
export function buildPlaygroundEntryUrl(path = "/") {
  return wrapInCirclesPlayground(buildAppPath(path))
}

/** Copy-paste link for sharing a promise inside the Circles host. */
export function buildShareablePromiseUrl(slug: string, options?: { inHost?: boolean }) {
  const appUrl = buildPromiseShareUrl(slug)
  return options?.inHost ? wrapInCirclesPlayground(appUrl) : appUrl
}

function normalizeTxValue(value: bigint | string | number | undefined): string {
  if (value === undefined) return "0"
  if (typeof value === "bigint") return value.toString()
  if (typeof value === "number") return String(value)
  if (value === "0x" || value === "0x0" || value.trim() === "") return "0"
  return value
}

function toEncodedTx(tx: { to?: string; data?: string; value?: bigint | string | number }): EncodedTx {
  if (!tx.to) throw new Error("Invalid invitation transaction.")
  return {
    to: tx.to,
    data: tx.data,
    value: normalizeTxValue(tx.value),
  }
}

async function getInvitationsClient() {
  const { Invitations } = await import("@aboutcircles/sdk-invitations")
  const { circlesConfig } = await import("@aboutcircles/sdk-utils")
  return new Invitations(circlesConfig[100])
}

export async function getInviteQuota(inviter: Address): Promise<bigint> {
  const { InviteFarm } = await import("@aboutcircles/sdk-invitations")
  const { circlesConfig } = await import("@aboutcircles/sdk-utils")
  const farm = new InviteFarm(circlesConfig[100])
  return farm.getQuota(inviter)
}

export async function lookupReferralInviter(secret: string): Promise<string | null> {
  if (!isValidReferralSecret(secret)) return null
  try {
    const sdk = await getSdk()
    const info = await sdk.referrals.retrieve(secret)
    return info.inviter ?? null
  } catch {
    return null
  }
}

export async function createReferralLink(inviter: Address): Promise<string> {
  const quota = await getInviteQuota(inviter)
  if (quota < BigInt(1)) {
    throw new Error("No invite quota left. Each referral costs invitation quota.")
  }

  const invitations = await getInvitationsClient()
  const setupTxs = await invitations.ensureInviterSetup(inviter)
  if (setupTxs.length > 0) {
    await submitViaHost(setupTxs.map(toEncodedTx))
  }

  const { transactions, privateKey } = await invitations.generateReferral(inviter)
  await submitViaHost(transactions.map(toEncodedTx))

  const sdk = await getSdk()
  await sdk.referrals.store(privateKey, inviter)

  return privateKey
}

export function shortenAddress(value: string): string {
  return `${value.slice(0, 6)}…${value.slice(-4)}`
}
