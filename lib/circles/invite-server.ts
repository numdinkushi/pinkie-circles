import type { Address, Hex } from "@aboutcircles/sdk-types"

import { inviteLog, inviteLogError, type InviteLogContext } from "@/lib/circles/invite-log"

const GNOSIS_CHAIN_ID = 100

const DEFAULT_INVITATION_FARM = "0xd28b7C4f148B1F1E190840A1f7A796C5525D8902" as Address

export interface InviteEnv {
  rpcUrl: string
  inviterSafe: Address
  inviterPrivateKey: Hex
  invitationFarm: Address
}

export interface InviteResult {
  status: "invited" | "already"
  invitee: Address
  txHash?: string
  quotaRemaining?: string
}

export function isInviteConfigured(): boolean {
  return !!(process.env.PINKIE_INVITER_SAFE_ADDRESS?.trim() && process.env.PINKIE_INVITER_PRIVATE_KEY?.trim())
}

export function loadInviteEnv(): InviteEnv {
  const rpcUrl =
    process.env.CIRCLES_RPC_URL?.trim() ??
    process.env.RPC_URL?.trim() ??
    "https://rpc.aboutcircles.com/"

  const inviterSafe = process.env.PINKIE_INVITER_SAFE_ADDRESS?.trim()
  let inviterPrivateKey = process.env.PINKIE_INVITER_PRIVATE_KEY?.trim() ?? ""
  if (inviterPrivateKey && !inviterPrivateKey.startsWith("0x")) {
    inviterPrivateKey = `0x${inviterPrivateKey}`
  }

  if (!inviterSafe || !/^0x[a-fA-F0-9]{40}$/.test(inviterSafe)) {
    throw new Error("PINKIE_INVITER_SAFE_ADDRESS is not a valid address")
  }
  if (!/^0x[a-fA-F0-9]{64}$/.test(inviterPrivateKey)) {
    throw new Error("PINKIE_INVITER_PRIVATE_KEY is not a valid 32-byte hex key")
  }

  const farmEnv = process.env.INVITATION_FARM?.trim()
  const invitationFarm =
    farmEnv && /^0x[a-fA-F0-9]{40}$/.test(farmEnv)
      ? (farmEnv as Address)
      : DEFAULT_INVITATION_FARM

  return {
    rpcUrl,
    inviterSafe: inviterSafe as Address,
    inviterPrivateKey: inviterPrivateKey as Hex,
    invitationFarm,
  }
}

export async function getInviterDiagnostics(inviter: Address, log?: InviteLogContext) {
  if (log) inviteLog(log, "info", "diagnostics_start", { inviter })

  const { circlesConfig } = await import("@aboutcircles/sdk-core")
  const { Invitations, InviteFarm } = await import("@aboutcircles/sdk-invitations")
  const { createPublicClient, http } = await import("viem")
  const { gnosis } = await import("viem/chains")

  const config = {
    ...circlesConfig[GNOSIS_CHAIN_ID],
    invitationFarmAddress: DEFAULT_INVITATION_FARM,
  }
  const invitations = new Invitations(config)
  const farm = new InviteFarm(config)
  const pc = createPublicClient({ chain: gnosis, transport: http(config.circlesRpcUrl ?? config.chainRpcUrl) })
  const hub = config.v2HubAddress as `0x${string}`

  const [farmQuota, freeInvites, realInviters, isHuman] = await Promise.all([
    farm.getQuota(inviter).catch((err) => {
      if (log) inviteLogError(log, "diagnostics_farm_quota_failed", err, { inviter })
      return BigInt(0)
    }),
    invitations.getClaimableFreeInvites(inviter).catch((err) => {
      if (log) inviteLogError(log, "diagnostics_free_invites_failed", err, { inviter })
      return BigInt(0)
    }),
    invitations.getRealInviters(inviter).catch((err) => {
      if (log) inviteLogError(log, "diagnostics_proxy_inviters_failed", err, { inviter })
      return []
    }),
    pc
      .readContract({
        address: hub,
        abi: [{ inputs: [{ type: "address" }], name: "isHuman", outputs: [{ type: "bool" }], stateMutability: "view", type: "function" }],
        functionName: "isHuman",
        args: [inviter as `0x${string}`],
      })
      .catch((err) => {
        if (log) inviteLogError(log, "diagnostics_is_human_failed", err, { inviter })
        return false
      }),
  ])

  const result = {
    inviter,
    isHuman,
    farmQuota: farmQuota.toString(),
    claimableFreeInvites: freeInvites.toString(),
    proxyInviters: realInviters.map((entry) => ({
      address: entry.address,
      possibleInvites: entry.possibleInvites,
    })),
    canInvite:
      isHuman &&
      (freeInvites > BigInt(0) ||
        realInviters.some((entry) => entry.possibleInvites > 0) ||
        farmQuota > BigInt(0)),
  }

  if (log) inviteLog(log, "info", "diagnostics_complete", result)
  return result
}

export async function inviteAccountToCircles(
  invitee: Address,
  env: InviteEnv,
  log?: InviteLogContext,
): Promise<InviteResult> {
  const { getAddress } = await import("viem")
  const { circlesConfig } = await import("@aboutcircles/sdk-core")
  const { Invitations } = await import("@aboutcircles/sdk-invitations")
  const { SafeContractRunner, chains } = await import("@aboutcircles/sdk-runner")

  const target = getAddress(invitee)
  if (log) {
    inviteLog(log, "info", "invite_start", {
      invitee: target,
      inviterSafe: env.inviterSafe,
    })
  }

  const baseConfig = circlesConfig[GNOSIS_CHAIN_ID]
  if (!baseConfig) throw new Error("No Circles config for chain 100")

  const config = { ...baseConfig, invitationFarmAddress: env.invitationFarm }
  const invitations = new Invitations(config)

  let transactions
  try {
    if (log) inviteLog(log, "info", "generate_invite_start", { invitee: target })
    transactions = await invitations.generateInvite(env.inviterSafe, target)
    if (log) {
      inviteLog(log, "info", "generate_invite_ok", {
        invitee: target,
        txCount: transactions.length,
      })
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (/already.*regist/i.test(message)) {
      if (log) inviteLog(log, "info", "invitee_already_registered", { invitee: target })
      return { status: "already", invitee: target }
    }
    if (log) inviteLogError(log, "generate_invite_failed", err, { invitee: target })
    throw err
  }

  if (!transactions?.length) {
    if (log) inviteLog(log, "info", "no_transactions_already_registered", { invitee: target })
    return { status: "already", invitee: target }
  }

  if (log) {
    inviteLog(log, "info", "runner_create_start", {
      inviterSafe: env.inviterSafe,
      rpcUrl: env.rpcUrl,
    })
  }

  const runner = await SafeContractRunner.create(
    env.rpcUrl,
    env.inviterPrivateKey,
    env.inviterSafe,
    chains.gnosis,
  )

  if (log) {
    inviteLog(log, "info", "runner_send_start", {
      inviterSafe: env.inviterSafe,
      txCount: transactions.length,
    })
  }

  const receipt = await runner.sendTransaction(transactions)

  if (log) {
    inviteLog(log, "info", "runner_send_ok", {
      invitee: target,
      txHash: receipt.transactionHash,
    })
  }

  return {
    status: "invited",
    invitee: target,
    txHash: receipt.transactionHash,
  }
}

const ALLOWED_BASE_DOMAIN = (process.env.INVITE_ALLOWED_BASE_DOMAIN ?? "gnosis.io").toLowerCase()
const EXTRA_ALLOWED_ORIGINS = (process.env.INVITE_EXTRA_ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean)

export function isAllowedInviteOrigin(origin: string | null | undefined): boolean {
  if (!origin) return false
  const o = origin.toLowerCase()
  if (EXTRA_ALLOWED_ORIGINS.includes(o)) return true
  let host: string
  try {
    const u = new URL(origin)
    if (u.protocol !== "https:") return false
    host = u.hostname.toLowerCase()
  } catch {
    return false
  }
  return host === ALLOWED_BASE_DOMAIN || host.endsWith(`.${ALLOWED_BASE_DOMAIN}`)
}

export function corsHeadersForOrigin(origin: string | null): HeadersInit {
  if (origin && isAllowedInviteOrigin(origin)) {
    return {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    }
  }
  return {}
}
