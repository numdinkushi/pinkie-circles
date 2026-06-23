import type { PromiseRecord } from "@/hooks/use-promises"

export function canEditBeforeShare(
  promise: Pick<PromiseRecord, "makerAddress" | "witnessAddress" | "status">,
  viewerAddress?: string | null,
) {
  if (!viewerAddress) return false
  if (viewerAddress.toLowerCase() !== promise.makerAddress) return false
  if (promise.witnessAddress) return false
  if (promise.status === "acknowledged") return false
  return true
}

export function wasEdited(promise: Pick<PromiseRecord, "editedAt">) {
  return promise.editedAt != null
}
