import type { PromiseRecord } from "@/hooks/use-promises"
import { getPinkieKind, isSurprise } from "@/lib/promises/kind"

export function getCounterpartyAddress(
  promise: PromiseRecord,
  viewerAddress: string,
): string | null {
  const me = viewerAddress.toLowerCase()
  if (promise.makerAddress === me && promise.witnessAddress) {
    return promise.witnessAddress
  }
  if (promise.witnessAddress === me) {
    return promise.makerAddress
  }
  if (promise.makerAddress !== me && promise.witnessAddress) {
    return promise.makerAddress
  }
  return promise.witnessAddress ?? null
}

export function promiseRoleLabel(promise: PromiseRecord, viewerAddress: string) {
  const me = viewerAddress.toLowerCase()
  const kind = getPinkieKind(promise)

  if (promise.makerAddress === me) {
    if (kind === "surprise") return "Your surprise"
    return promise.status === "done" ? "You kept it" : "You promised"
  }
  if (promise.witnessAddress === me) {
    return kind === "surprise" ? "Surprised you" : "You're holding them to it"
  }
  return kind === "surprise" ? "Pinkie surprise" : "Pinkie promise"
}

export function witnessStatusLabel(promise: PromiseRecord, isMaker: boolean) {
  if (promise.witnessAddress) return null
  if (!isMaker) return null

  if (isSurprise(promise)) {
    if (promise.status === "open") {
      return "Mark it done, then share the link — they'll discover your surprise"
    }
    return "Share the link — first friend to open discovers your surprise"
  }

  if (promise.status === "done") {
    return "Share the link — first friend to open can see you kept your word"
  }

  return "Share the link — first friend to open becomes your witness"
}

export function makerMetaLabel(promise: PromiseRecord) {
  const kind = getPinkieKind(promise)
  if (kind === "surprise") return "Did this"
  return promise.status === "done" ? "Kept it" : "Promised"
}
