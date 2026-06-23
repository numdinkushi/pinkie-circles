"use client"

import { useEffect, useRef } from "react"
import { toast } from "sonner"

import { usePromiseBySlug, usePromiseMutations } from "@/hooks/use-promises"
import { useWallet } from "@/components/wallet/wallet-provider"
import { canAssignWitness, getPinkieKind } from "@/lib/promises/kind"

/** First connected friend who opens the link becomes the witness — or discovers a surprise. */
export function useAssignWitness(slug: string) {
  const { address, isConnected } = useWallet()
  const promise = usePromiseBySlug(slug)
  const { assignWitness } = usePromiseMutations()
  const attempted = useRef(false)

  useEffect(() => {
    if (!isConnected || !address || !promise || attempted.current) return
    if (promise.makerAddress === address.toLowerCase()) return
    if (promise.witnessAddress) return
    if (!canAssignWitness(promise)) return

    attempted.current = true
    const kind = getPinkieKind(promise)

    assignWitness({ slug, witnessAddress: address })
      .then(() => {
        toast.success(
          kind === "surprise"
            ? "Surprise — they already did this for you!"
            : "You're now holding them to this promise",
        )
      })
      .catch((error: unknown) => {
        attempted.current = false
        const message = error instanceof Error ? error.message : "Could not join as witness"
        if (!/already/i.test(message)) {
          toast.error(message)
        }
      })
  }, [address, assignWitness, isConnected, promise, slug])
}
