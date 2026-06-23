"use client"

import { useMutation, useQuery } from "convex/react"

import { isConvexConfigured } from "@/components/providers/convex-provider"
import { api } from "@/convex/_generated/api"
import type { WalletTransaction } from "@/lib/transactions/display"

export function useWalletTransactions(address?: string | null) {
  return useQuery(
    api.transactions.listForWallet,
    isConvexConfigured() && address ? { address } : "skip",
  ) as WalletTransaction[] | undefined
}

export function usePromiseTips(promiseSlug?: string | null, viewerAddress?: string | null) {
  return useQuery(
    api.transactions.getTipsForPromise,
    isConvexConfigured() && promiseSlug
      ? { promiseSlug, viewerAddress: viewerAddress ?? undefined }
      : "skip",
  )
}

export function useTransactionMutations() {
  const recordThanks = useMutation(api.transactions.recordThanks)
  return { recordThanks }
}
