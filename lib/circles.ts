import type { Sdk } from "@aboutcircles/sdk"

export const INDEFINITE_TRUST_EXPIRY = BigInt("0xFFFFFFFFFFFFFFFFFFFFFFFF")

export type HostTx = {
  to: string
  data?: string
  value?: string
  label?: string
  description?: string
}

export type EncodedTx = {
  to: string
  data?: string
  value?: bigint | string
  label?: string
  description?: string
}

let sdkSingleton: Sdk | null = null

export async function getSdk(): Promise<Sdk> {
  if (sdkSingleton) return sdkSingleton
  const { Sdk } = await import("@aboutcircles/sdk")
  sdkSingleton = new Sdk()
  return sdkSingleton
}

export function getOrgAddress(): string | null {
  return (
    process.env.NEXT_PUBLIC_IQLIFY_ORG_ADDRESS?.trim() ||
    process.env.NEXT_PUBLIC_PINKIE_ORG_ADDRESS?.trim() ||
    null
  )
}

export function toHostTx(tx: EncodedTx): HostTx {
  const value =
    tx.value === undefined
      ? "0"
      : typeof tx.value === "bigint"
        ? tx.value.toString()
        : tx.value === "0x" || tx.value === "0x0"
          ? "0"
          : tx.value.toString()
  return {
    to: tx.to,
    data: tx.data,
    value,
    label: tx.label,
    description: tx.description,
  }
}

export async function submitViaHost(txs: EncodedTx[]): Promise<string[]> {
  if (txs.length === 0) return []
  const { sendTransactions } = await import("@aboutcircles/miniapp-sdk")
  return sendTransactions(txs.map(toHostTx))
}

async function waitForHostTxs(hashes: string[]) {
  const valid = hashes.filter((hash) => /^0x[a-fA-F0-9]{64}$/.test(hash))
  if (valid.length === 0) return

  const { createPublicClient, http } = await import("viem")
  const { gnosis } = await import("viem/chains")
  const rpcUrl = process.env.NEXT_PUBLIC_CIRCLES_RPC_URL?.trim() ?? "https://rpc.aboutcircles.com/"
  const client = createPublicClient({ chain: gnosis, transport: http(rpcUrl) })

  for (const hash of valid) {
    await client.waitForTransactionReceipt({ hash: hash as `0x${string}` })
  }
}

async function isTrustedOnHub(truster: string, trustee: string): Promise<boolean> {
  const { Core, circlesConfig } = await import("@aboutcircles/sdk-core")
  const { getAddress } = await import("viem")
  const core = new Core(circlesConfig[100])
  return core.hubV2.isTrusted(getAddress(truster), getAddress(trustee))
}

function formatSendError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  if (/UserOperation reverted|callGasLimit.?0|simulation/i.test(message)) {
    return "Wallet could not estimate gas for this batch. Pinkie will retry in smaller steps — if it still fails, approve each prompt separately."
  }
  if (/No valid transfer path/i.test(message)) {
    return "No CRC path to this wallet yet. Make sure they accepted your Circles invite, then try again."
  }
  return message
}

export function crcToAmountUnits(amountCrc: number): bigint {
  return BigInt(Math.round(amountCrc * 1e6)) * BigInt(10) ** BigInt(12)
}

async function prepareRecipient(sender: string, recipient: string) {
  const res = await fetch("/api/transfer/prepare-recipient", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sender, recipient }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || "This friend cannot receive CRC on Circles yet.")
  }
  return data as { invited?: boolean; isHuman?: boolean }
}

export async function buildTrustTx(trustee: string, label?: string): Promise<EncodedTx> {
  const { Core, circlesConfig } = await import("@aboutcircles/sdk-core")
  const { getAddress } = await import("viem")
  const core = new Core(circlesConfig[100])
  const tx = core.hubV2.trust(getAddress(trustee), INDEFINITE_TRUST_EXPIRY)
  return {
    to: tx.to!,
    data: tx.data,
    value: tx.value ?? BigInt(0),
    label: label ?? "Trust avatar",
    description: `Trust ${trustee}`,
  }
}

export async function buildAdvancedCrcTransfer(input: {
  from: string
  to: string
  amountCrc: number
  reference: string
  maxTransfers?: number
  label?: string
  description?: string
  simulatedTrusts?: Array<{ truster: string; trustee: string }>
}): Promise<EncodedTx[]> {
  const { TransferBuilder } = await import("@aboutcircles/sdk-transfers")
  const { encodeCrcV2TransferData } = await import("@aboutcircles/sdk-utils")
  const { circlesConfig } = await import("@aboutcircles/sdk-core")
  const { getAddress, hexToBytes } = await import("viem")

  const config = circlesConfig[100]
  const builder = new TransferBuilder(config)
  const from = getAddress(input.from)
  const to = getAddress(input.to)
  const amount = crcToAmountUnits(input.amountCrc)
  const txData = hexToBytes(
    encodeCrcV2TransferData([`Send ${input.amountCrc} CRC`, input.reference], 0x1001),
  )

  const simulatedTrusts =
    input.simulatedTrusts?.map((trust) => ({
      truster: getAddress(trust.truster),
      trustee: getAddress(trust.trustee),
    })) ?? [
      { truster: from, trustee: to },
      { truster: to, trustee: from },
    ]

  const rawTxs = await builder.constructAdvancedTransfer(from, to, amount, {
    useWrappedBalances: true,
    maxTransfers: input.maxTransfers ?? 6,
    fromTokens: [from],
    simulatedTrusts,
    txData,
  })

  return rawTxs.map((tx, index) => ({
    to: tx.to,
    data: tx.data,
    value: tx.value,
    label: input.label ?? "Send CRC",
    description:
      input.description ??
      (index === 0
        ? `Send ${input.amountCrc} CRC to ${to}`
        : `Transfer step ${index + 1} of ${rawTxs.length}`),
  }))
}

async function sendCrcWithTrustSetup(input: {
  from: string
  to: string
  amountCrc: number
  reference: string
  description?: string
}) {
  await prepareRecipient(input.from, input.to)

  const orgAddress = getOrgAddress()
  const trustTxs: EncodedTx[] = []

  if (
    input.from.toLowerCase() !== input.to.toLowerCase() &&
    !(await isTrustedOnHub(input.from, input.to))
  ) {
    trustTxs.push(await buildTrustTx(input.to, "Trust friend"))
  }
  if (
    orgAddress &&
    input.from.toLowerCase() !== orgAddress.toLowerCase() &&
    !(await isTrustedOnHub(input.from, orgAddress))
  ) {
    trustTxs.push(await buildTrustTx(orgAddress, "Trust org"))
  }

  const allHashes: string[] = []

  // Batch trust separately — bundling trust + unwrap + send breaks AA gas estimation.
  if (trustTxs.length > 0) {
    const trustHashes = await submitViaHost(trustTxs)
    allHashes.push(...trustHashes)
    await waitForHostTxs(trustHashes)
  }

  const transferTxs = await buildAdvancedCrcTransfer({
    from: input.from,
    to: input.to,
    amountCrc: input.amountCrc,
    reference: input.reference,
    maxTransfers: 6,
    label: "Send CRC",
    description: input.description ?? `Send ${input.amountCrc} CRC`,
  })

  try {
    const transferHashes = await submitViaHost(transferTxs)
    allHashes.push(...transferHashes)
    return allHashes
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (transferTxs.length <= 1 || !/UserOperation reverted|simulation|callGasLimit/i.test(message)) {
      throw new Error(formatSendError(error))
    }

    for (const tx of transferTxs) {
      const stepHashes = await submitViaHost([tx])
      allHashes.push(...stepHashes)
      await waitForHostTxs(stepHashes)
    }
    return allHashes
  }
}

export async function sendThanks(input: {
  from: string
  to: string
  amountCrc?: number
  slug: string
}) {
  const amountCrc = input.amountCrc ?? 1
  const reference = `PINKIE-THANKS-${input.slug.toUpperCase()}`
  return sendCrcWithTrustSetup({
    from: input.from,
    to: input.to,
    amountCrc,
    reference,
    description: `Send ${amountCrc} CRC thanks in acknowledgement`,
  })
}

export async function sendCrcToAddress(input: {
  from: string
  to: string
  amountCrc: number
  note?: string
}) {
  const reference = `PINKIE-TRANSFER-${Date.now()}`
  return sendCrcWithTrustSetup({
    from: input.from,
    to: input.to,
    amountCrc: input.amountCrc,
    reference,
    description: input.note?.trim()
      ? `Send ${input.amountCrc} CRC — ${input.note.trim()}`
      : `Send ${input.amountCrc} CRC`,
  })
}
