import type { Sdk } from "@aboutcircles/sdk"

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

export async function buildAdvancedCrcTransfer(input: {
  from: string
  to: string
  amountCrc: number
  reference: string
  maxTransfers?: number
  label?: string
  description?: string
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

  const rawTxs = await builder.constructAdvancedTransfer(from, to, amount, {
    useWrappedBalances: true,
    maxTransfers: input.maxTransfers ?? 8,
    fromTokens: [from],
    simulatedTrusts: [
      { truster: from, trustee: to },
      { truster: to, trustee: from },
    ],
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

export async function sendThanks(input: {
  from: string
  to: string
  amountCrc?: number
  slug: string
}) {
  const amountCrc = input.amountCrc ?? 1
  const txs = await buildAdvancedCrcTransfer({
    from: input.from,
    to: input.to,
    amountCrc,
    reference: `PINKIE-THANKS-${input.slug.toUpperCase()}`,
    maxTransfers: 4,
    label: "Send thanks",
    description: `Send ${amountCrc} CRC thanks in acknowledgement`,
  })
  return submitViaHost(txs)
}
