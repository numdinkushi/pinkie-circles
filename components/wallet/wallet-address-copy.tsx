"use client"

import { useState } from "react"
import { Check, Copy } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type WalletAddressCopyProps = {
  address: string
  className?: string
  description?: string
}

export function WalletAddressCopy({
  address,
  className,
  description = "Share this with friends so they can send you CRC.",
}: WalletAddressCopyProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      toast.success("Wallet address copied")
      window.setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not copy address")
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-xs font-medium text-violet-800/70">Your wallet address</p>
      <div className="flex items-stretch gap-2">
        <button
          type="button"
          onClick={() => void handleCopy()}
          className={cn(
            "min-w-0 flex-1 rounded-xl border border-pink-200/60 bg-white/80 px-3 py-2.5 text-left",
            "transition-colors hover:border-pink-300/70 hover:bg-white",
          )}
          title="Tap to copy"
        >
          <p className="break-all font-mono text-xs leading-relaxed text-violet-950">{address}</p>
        </button>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          onClick={() => void handleCopy()}
          aria-label="Copy wallet address"
          className="shrink-0 border-pink-200/60"
        >
          {copied ? <Check className="text-emerald-600" /> : <Copy />}
        </Button>
      </div>
      {description ? <p className="text-xs text-violet-700/60">{description}</p> : null}
    </div>
  )
}
