import type { Address, Hex } from "@aboutcircles/sdk-types"

import { INDEFINITE_TRUST_EXPIRY } from "@/lib/circles"

const NOT_ON_CIRCLES_MESSAGE =
  "This Pinkie wallet is not active on Circles yet. Your friend may need to use the wallet address from aboutcircles.com instead."

const SETUP_INCOMPLETE_MESSAGE =
  "This Pinkie playground wallet is not registered on Circles. If your friend signed up on aboutcircles.com, paste that wallet address instead — it is different from the one shown in Pinkie Profile."

const ADDRESS_MISMATCH_HINT =
  "Signing up on aboutcircles.com and connecting in Pinkie creates two different wallets. Always send CRC to the aboutcircles.com wallet address."

function resolveOrgAddress(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_IQLIFY_ORG_ADDRESS?.trim() ||
    process.env.NEXT_PUBLIC_PINKIE_ORG_ADDRESS?.trim() ||
    process.env.PINKIE_INVITER_SAFE_ADDRESS?.trim() ||
    undefined
  )
}

function resolveOrgPrivateKey(): Hex | undefined {
  const key =
    process.env.IQLIFY_ORG_PRIVATE_KEY?.trim() || process.env.PINKIE_INVITER_PRIVATE_KEY?.trim()
  if (!key) return undefined
  return (key.startsWith("0x") ? key : `0x${key}`) as Hex
}

async function getHubClient() {
  const { circlesConfig } = await import("@aboutcircles/sdk-core")
  const { createPublicClient, http } = await import("viem")
  const { gnosis } = await import("viem/chains")

  const config = circlesConfig[100]
  const rpcUrl =
    process.env.CIRCLES_RPC_URL?.trim() ??
    config.circlesRpcUrl ??
    config.chainRpcUrl ??
    "https://rpc.aboutcircles.com/"
  const hub = config.v2HubAddress as `0x${string}`
  const client = createPublicClient({ chain: gnosis, transport: http(rpcUrl) })

  return { client, hub }
}

export async function isCirclesHuman(address: Address): Promise<boolean> {
  const { getAddress } = await import("viem")
  const { client, hub } = await getHubClient()
  return client.readContract({
    address: hub,
    abi: [
      {
        inputs: [{ type: "address" }],
        name: "isHuman",
        outputs: [{ type: "bool" }],
        stateMutability: "view",
        type: "function",
      },
    ],
    functionName: "isHuman",
    args: [getAddress(address)],
  })
}

export async function waitForCirclesHuman(
  address: Address,
  attempts = 12,
  delayMs = 1500,
): Promise<boolean> {
  for (let i = 0; i < attempts; i++) {
    if (await isCirclesHuman(address)) return true
    await new Promise((resolve) => setTimeout(resolve, delayMs))
  }
  return isCirclesHuman(address)
}

async function registerCirclesHuman(address: Address): Promise<void> {
  const { inviteAccountToCircles, isInviteConfigured, loadInviteEnv } = await import(
    "@/lib/circles/invite-server"
  )
  if (!isInviteConfigured()) {
    throw new Error(NOT_ON_CIRCLES_MESSAGE)
  }
  const env = loadInviteEnv()
  await inviteAccountToCircles(address, env)
  const ready = await waitForCirclesHuman(address)
  if (!ready) {
    throw new Error(SETUP_INCOMPLETE_MESSAGE)
  }
}

async function getOrgRunner() {
  const orgAddress = resolveOrgAddress()
  const privateKey = resolveOrgPrivateKey()
  if (!orgAddress || !privateKey) {
    throw new Error(
      "Circles org is not configured. Set NEXT_PUBLIC_IQLIFY_ORG_ADDRESS and IQLIFY_ORG_PRIVATE_KEY (or Pinkie equivalents).",
    )
  }

  const { circlesConfig } = await import("@aboutcircles/sdk-core")
  const { SafeContractRunner, chains } = await import("@aboutcircles/sdk-runner")
  const { getAddress } = await import("viem")

  const config = circlesConfig[100]
  const rpcUrl =
    process.env.CIRCLES_RPC_URL?.trim() ??
    config.circlesRpcUrl ??
    config.chainRpcUrl ??
    "https://rpc.aboutcircles.com/"
  const from = getAddress(orgAddress)
  const runner = await SafeContractRunner.create(rpcUrl, privateKey, from, chains.gnosis)
  return { runner, from, config }
}

export function isPinkieOrgConfigured(): boolean {
  return !!(resolveOrgAddress() && resolveOrgPrivateKey())
}

export function getOrgTreasuryAddress(): string | null {
  return resolveOrgAddress() ?? null
}

/** Org trusts a user so CRC pathfinding can reach them. */
export async function ensureOrgTrustsUser(userAddress: Address): Promise<void> {
  const { Core } = await import("@aboutcircles/sdk-core")
  const { getAddress } = await import("viem")
  const { runner, config } = await getOrgRunner()
  const core = new Core(config)
  const tx = core.hubV2.trust(getAddress(userAddress), INDEFINITE_TRUST_EXPIRY)
  await runner.sendTransaction([tx])
}

export async function ensureOrgTrustsUsers(userAddresses: Address[]): Promise<void> {
  const unique = [...new Set(userAddresses.map((a) => a.toLowerCase()))]
  for (const address of unique) {
    try {
      await ensureOrgTrustsUser(address as Address)
    } catch (error) {
      console.warn("[ensureOrgTrustsUser]", address, error)
    }
  }
}

/** Trust a registered Circles wallet so CRC pathfinding can reach them. */
export async function ensureRecipientCanReceiveCrc(input: {
  recipient: Address
  sender?: Address
}): Promise<{ invited: boolean; isHuman: boolean }> {
  const { getAddress } = await import("viem")
  const recipient = getAddress(input.recipient)

  const human = await isCirclesHuman(recipient)
  if (!human) {
    await registerCirclesHuman(recipient)
  }

  const trustTargets = input.sender ? [recipient, getAddress(input.sender)] : [recipient]
  await ensureOrgTrustsUsers(trustTargets as Address[])

  return { invited: !human, isHuman: true }
}

export { NOT_ON_CIRCLES_MESSAGE, SETUP_INCOMPLETE_MESSAGE, ADDRESS_MISMATCH_HINT }
