import type { PromiseRecord } from "@/hooks/use-promises"

export type PinkieKind = "promise" | "surprise"

export type PromiseStatus = "open" | "done" | "acknowledged"

export function isClosedStatus(status: PromiseStatus) {
  return status === "done" || status === "acknowledged"
}

/** Legacy Convex rows may still store "reveal". */
export function getPinkieKind(record: { kind?: PinkieKind | "reveal" }): PinkieKind {
  const raw = record.kind ?? "promise"
  if (raw === "surprise" || raw === "reveal") return "surprise"
  return "promise"
}

export function isSurprise(record: { kind?: PinkieKind | "reveal" }) {
  return getPinkieKind(record) === "surprise"
}

export function kindNoun(kind: PinkieKind) {
  return kind === "surprise" ? "surprise" : "promise"
}

export function kindTitle(kind: PinkieKind) {
  return kind === "surprise" ? "Pinkie surprise" : "Pinkie promise"
}

export function kindRequiresWitnessToClose(kind: PinkieKind) {
  return kind === "promise"
}

/** Noun shown on cards — a done promise is "Kept", not "Promise". */
export function kindBadgeLabel(promise: PromiseRecord) {
  const kind = getPinkieKind(promise)

  if (kind === "surprise") {
    return "Surprise"
  }

  return isClosedStatus(promise.status) ? "Kept" : "Promise"
}

export function kindBadgeTone(promise: PromiseRecord): "promise" | "kept" | "surprise" {
  const kind = getPinkieKind(promise)

  if (kind === "surprise") return "surprise"
  if (isClosedStatus(promise.status)) return "kept"
  return "promise"
}

export function cardCounterpartyLabel(promise: PromiseRecord) {
  const kind = getPinkieKind(promise)

  if (promise.witnessAddress) {
    return null
  }

  if (kind === "surprise") {
    return isClosedStatus(promise.status) ? "Waiting to surprise someone" : "Not shared yet"
  }

  return "Waiting for witness"
}

export function canAssignWitness(promise: PromiseRecord) {
  const kind = getPinkieKind(promise)
  if (promise.witnessAddress) return false
  if (kind === "promise") return promise.status === "open"
  return isClosedStatus(promise.status)
}

export function kindBadgeClassName(tone: ReturnType<typeof kindBadgeTone>) {
  switch (tone) {
    case "surprise":
      return "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700"
    case "kept":
      return "border-emerald-200 bg-emerald-50 text-emerald-700"
    default:
      return "border-pink-200 bg-pink-50 text-pink-700"
  }
}
