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
  const { sendTransactions } = await import("@aboutcircles/miniapp-sdk")
  return sendTransactions(txs.map(toHostTx))
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
  const org = getOrgAddress()
  const amount = crcToAmountUnits(input.amountCrc)
  const txData = hexToBytes(
    encodeCrcV2TransferData([`Send ${input.amountCrc} CRC`, input.reference], 0x1001),
  )

  const simulatedTrusts =
    input.simulatedTrusts?.map((trust) => ({
      truster: getAddress(trust.truster),
      trustee: getAddress(trust.trustee),
    })) ??
    [
      { truster: from, trustee: to },
      { truster: to, trustee: from },
      ...(org
        ? [
            { truster: from, trustee: getAddress(org) },
            { truster: getAddress(org), trustee: from },
            { truster: getAddress(org), trustee: to },
            { truster: to, trustee: getAddress(org) },
          ]
        : []),
    ]

  const rawTxs = await builder.constructAdvancedTransfer(from, to, amount, {
    useWrappedBalances: true,
    maxTransfers: input.maxTransfers ?? 12,
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
  const txs: EncodedTx[] = []

  if (input.from.toLowerCase() !== input.to.toLowerCase()) {
    txs.push(await buildTrustTx(input.to, "Trust friend"))
  }
  if (orgAddress && input.from.toLowerCase() !== orgAddress.toLowerCase()) {
    txs.push(await buildTrustTx(orgAddress, "Trust org"))
  }

  const transferTxs = await buildAdvancedCrcTransfer({
    from: input.from,
    to: input.to,
    amountCrc: input.amountCrc,
    reference: input.reference,
    maxTransfers: 12,
    label: "Send CRC",
    description: input.description ?? `Send ${input.amountCrc} CRC`,
  })
  txs.push(...transferTxs)

  return submitViaHost(txs)
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
