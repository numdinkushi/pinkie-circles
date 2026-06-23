"use client"

import { useCallback, useEffect, useState } from "react"

import { formatCrcBalance, parseCrcBalance } from "@/lib/circles/balance"
import { getSdk } from "@/lib/circles"

type CrcBalanceState = {
  balance: string | null
  formatted: string
  numeric: number
  circlesName: string | null
  loading: boolean
  refresh: () => Promise<void>
}

export function useCrcBalance(address?: string | null): CrcBalanceState {
  const [balance, setBalance] = useState<string | null>(null)
  const [circlesName, setCirclesName] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!address) {
      setBalance(null)
      setCirclesName(null)
      return
    }

    setLoading(true)
    try {
      const sdk = await getSdk()
      const view = await sdk.rpc.profile.getProfileView(address as `0x${string}`)
      setBalance(view.v2Balance ?? "0")
      setCirclesName(view.profile?.name ?? null)
    } catch {
      setBalance(null)
      setCirclesName(null)
    } finally {
      setLoading(false)
    }
  }, [address])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return {
    balance,
    formatted: formatCrcBalance(balance),
    numeric: parseCrcBalance(balance),
    circlesName,
    loading,
    refresh,
  }
}
