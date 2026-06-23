"use client"

import { useEffect, useState } from "react"
import { LoaderCircle } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { useWallet } from "@/components/wallet/wallet-provider"

export function FinishCirclesSetupCard() {
  const { address, isConnected } = useWallet()
  const [checking, setChecking] = useState(false)
  const [needsSetup, setNeedsSetup] = useState<boolean | null>(null)
  const [finishing, setFinishing] = useState(false)

  useEffect(() => {
    if (!address) {
      setNeedsSetup(null)
      return
    }

    let cancelled = false
    setChecking(true)

    void fetch("/api/transfer/check-recipient", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipient: address }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}))
        if (cancelled) return
        setNeedsSetup(!data.isHuman)
      })
      .catch(() => {
        if (!cancelled) setNeedsSetup(null)
      })
      .finally(() => {
        if (!cancelled) setChecking(false)
      })

    return () => {
      cancelled = true
    }
  }, [address])

  async function handleFinishSetup() {
    if (!address) return
    setFinishing(true)
    try {
      const res = await fetch("/api/account/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account: address }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error || "Could not finish Circles setup.")
      }
      setNeedsSetup(!data.isHuman)
      toast.success(
        data.isHuman
          ? "Your Circles wallet is ready to receive CRC."
          : "Registration submitted — try again in a moment.",
      )
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not finish setup")
    } finally {
      setFinishing(false)
    }
  }

  if (!isConnected || !address || checking || needsSetup !== true) {
    return null
  }

  return (
    <div className="rounded-xl border border-amber-200/80 bg-amber-50/90 px-3 py-3 text-sm text-amber-950">
      <p className="font-medium">Finish Circles setup</p>
      <p className="mt-1 text-xs text-amber-900/80">
        Your wallet is connected, but Circles has not fully activated it yet. Tap below to retry
        registration, or complete signup in the Circles app if send still fails.
      </p>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="mt-3 border-amber-300/80 bg-white/80"
        disabled={finishing}
        onClick={() => void handleFinishSetup()}
      >
        {finishing ? <LoaderCircle className="animate-spin" /> : null}
        Finish setup
      </Button>
    </div>
  )
}
