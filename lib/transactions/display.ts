export type TransactionDirection = "debit" | "credit"

export type WalletTransaction = {
  _id: string
  direction: TransactionDirection
  counterparty: string
  amountCrc: number
  promiseSlug?: string
  promiseKind?: "promise" | "surprise"
  promiseText?: string
  action: "thanks" | "transfer"
  txHashes?: string[]
  createdAt: number
}

export function directionLabel(direction: TransactionDirection) {
  return direction === "debit" ? "Sent" : "Received"
}

export function actionLabel(action: WalletTransaction["action"]) {
  if (action === "thanks") return "CRC thanks"
  if (action === "transfer") return "CRC transfer"
  return action
}

export function kindLabel(kind: WalletTransaction["promiseKind"]) {
  return kind === "surprise" ? "Surprise" : "Promise"
}

export function formatCrcAmount(amount: number) {
  return `${amount} CRC`
}

export function gnosisScanTxUrl(hash: string) {
  return `https://gnosisscan.io/tx/${hash}`
}
