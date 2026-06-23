"use client"

import { useMemo } from "react"

import { useAllMyPromises, type PromiseRecord } from "@/hooks/use-promises"
import { getPinkieKind, isClosedStatus } from "@/lib/promises/kind"

export type RecordFilter = "all" | "open" | "kept" | "promise" | "surprise"

function matchesFilter(item: PromiseRecord, filter: RecordFilter) {
  if (filter === "all") return true
  if (filter === "open") return item.status === "open"
  if (filter === "kept") return isClosedStatus(item.status)
  if (filter === "promise") return getPinkieKind(item) === "promise"
  return getPinkieKind(item) === "surprise"
}

export function usePromiseRecord(address?: string | null, filter: RecordFilter = "all") {
  const all = useAllMyPromises(address)

  return useMemo(() => {
    if (!address || !all) {
      return {
        loading: address !== null && address !== undefined && all === undefined,
        made: [] as PromiseRecord[],
        shared: [] as PromiseRecord[],
        madeTotal: 0,
        sharedTotal: 0,
      }
    }

    const me = address.toLowerCase()
    const madeAll = all.filter((item) => item.makerAddress === me)
    const sharedAll = all.filter((item) => item.witnessAddress === me)

    return {
      loading: false,
      made: madeAll.filter((item) => matchesFilter(item, filter)),
      shared: sharedAll.filter((item) => matchesFilter(item, filter)),
      madeTotal: madeAll.length,
      sharedTotal: sharedAll.length,
    }
  }, [address, all, filter])
}
