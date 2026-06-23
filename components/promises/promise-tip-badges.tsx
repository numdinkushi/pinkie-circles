"use client"

import { ArrowDownLeft, ArrowUpRight } from "lucide-react"

import { usePromiseTips } from "@/hooks/use-transactions"
import { useProfilesByAddresses } from "@/hooks/use-profile"
import { useWallet } from "@/components/wallet/wallet-provider"
import { formatCrcAmount } from "@/lib/transactions/display"
import { shortenAddress } from "@/lib/referrals"
import { cn } from "@/lib/utils"

type PromiseTipBadgesProps = {
  promiseSlug: string
  className?: string
}

export function PromiseTipBadges({ promiseSlug, className }: PromiseTipBadgesProps) {
  const { address } = useWallet()
  const tips = usePromiseTips(promiseSlug, address)

  const profileAddresses = tips?.tips.flatMap((t) => [t.fromAddress, t.toAddress]) ?? []
  const profiles = useProfilesByAddresses(profileAddresses)

  if (tips === undefined || tips.tips.length === 0) {
    return null
  }

  const viewer = address?.toLowerCase()

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {tips.tips.map((tip) => {
        const sender = profiles?.find((p) => p.address === tip.fromAddress)
        const receiver = profiles?.find((p) => p.address === tip.toAddress)
        const senderName = sender?.displayName ?? shortenAddress(tip.fromAddress)
        const receiverName = receiver?.displayName ?? shortenAddress(tip.toAddress)
        const youSent = viewer === tip.fromAddress
        const youReceived = viewer === tip.toAddress

        if (youSent) {
          return (
            <span
              key={tip._id}
              className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-medium text-rose-700"
            >
              <ArrowUpRight className="size-3" />
              You tipped {formatCrcAmount(tip.amountCrc)}
            </span>
          )
        }

        if (youReceived) {
          return (
            <span
              key={tip._id}
              className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700"
            >
              <ArrowDownLeft className="size-3" />
              +{formatCrcAmount(tip.amountCrc)} from {senderName}
            </span>
          )
        }

        return (
          <span
            key={tip._id}
            className="inline-flex items-center gap-1 rounded-full border border-violet-200/70 bg-violet-50/80 px-2 py-0.5 text-[10px] text-violet-700"
          >
            <ArrowUpRight className="size-3 text-rose-500" />
            {senderName} tipped {receiverName} {formatCrcAmount(tip.amountCrc)}
          </span>
        )
      })}
    </div>
  )
}
