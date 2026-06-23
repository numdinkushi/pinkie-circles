"use client"

import { LoaderCircle, RefreshCw } from "lucide-react"

import { CreateAccountButton } from "@/components/wallet/create-account-button"
import { WalletAddressCopy } from "@/components/wallet/wallet-address-copy"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useCrcBalance } from "@/hooks/use-crc-balance"
import { useWallet } from "@/components/wallet/wallet-provider"
import { cn } from "@/lib/utils"

type CrcBalanceCardProps = {
  address?: string | null
  compact?: boolean
  className?: string
}

export function CrcBalanceCard({ address, compact, className }: CrcBalanceCardProps) {
  const { isConnected, isMiniappHost } = useWallet()
  const resolvedAddress = address ?? null
  const { formatted, circlesName, loading, refresh } = useCrcBalance(resolvedAddress)

  if (!isConnected || !resolvedAddress) {
    if (compact) return null
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-base">CRC wallet</CardTitle>
          <CardDescription>
            {isMiniappHost
              ? "Connect your Circles account to see your CRC balance."
              : "Open Pinkie inside the Circles app to view your wallet."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateAccountButton />
        </CardContent>
      </Card>
    )
  }

  if (compact) {
    return null
  }

  return (
    <Card className={cn("border-pink-200/60", className)}>
      <CardHeader>
        <CardTitle className="text-base">CRC wallet</CardTitle>
        <CardDescription>
          Your Circles balance on Gnosis — used when you send thanks after a kept promise.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-2xl border border-pink-200/60 bg-gradient-to-br from-pink-50/90 to-violet-50/80 p-4">
          <p className="text-xs text-violet-800/70">Available balance</p>
          <p className="text-3xl font-semibold text-violet-950">
            {loading ? "…" : formatted}{" "}
            <span className="text-base font-medium text-violet-700/80">CRC</span>
          </p>
          {circlesName ? (
            <p className="text-sm text-violet-800/70">{circlesName}</p>
          ) : null}
        </div>
        <WalletAddressCopy address={resolvedAddress} />

        <Button type="button" variant="outline" size="sm" onClick={() => void refresh()} disabled={loading}>
          {loading ? <LoaderCircle className="animate-spin" /> : <RefreshCw />}
          Refresh balance
        </Button>
      </CardContent>
    </Card>
  )
}
