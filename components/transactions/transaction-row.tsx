"use client"

import Link from "next/link"
import { ArrowDownLeft, ArrowUpRight, ExternalLink } from "lucide-react"

import { ProfileAvatar } from "@/components/profile/profile-avatar"
import { Card, CardContent } from "@/components/ui/card"
import { useProfilesByAddresses } from "@/hooks/use-profile"
import {
  actionLabel,
  directionLabel,
  formatCrcAmount,
  gnosisScanTxUrl,
  kindLabel,
  type WalletTransaction,
} from "@/lib/transactions/display"
import { promiseDetailPath } from "@/lib/navigation/detail-back"
import { shortenAddress } from "@/lib/referrals"
import { cn } from "@/lib/utils"

type TransactionRowProps = {
  transaction: WalletTransaction
}

export function TransactionRow({ transaction }: TransactionRowProps) {
  const profiles = useProfilesByAddresses([transaction.counterparty])
  const counterparty = profiles?.[0]
  const isDebit = transaction.direction === "debit"
  const Icon = isDebit ? ArrowUpRight : ArrowDownLeft
  const txHash = transaction.txHashes?.[0]

  return (
    <Card className="overflow-hidden">
      <CardContent className="space-y-3 py-4">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-xl",
              isDebit ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600",
            )}
          >
            <Icon className="size-4" />
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p
                  className={cn(
                    "text-sm font-semibold tabular-nums",
                    isDebit ? "text-rose-700" : "text-emerald-700",
                  )}
                >
                  {isDebit ? "−" : "+"}
                  {formatCrcAmount(transaction.amountCrc)}
                </p>
                <p className="text-xs text-violet-800/70">
                  {directionLabel(transaction.direction)} · {actionLabel(transaction.action)}
                </p>
              </div>
              <span
                className={cn(
                  "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium",
                  transaction.promiseKind === "surprise"
                    ? "bg-fuchsia-50 text-fuchsia-700"
                    : "bg-pink-50 text-pink-700",
                )}
              >
                {kindLabel(transaction.promiseKind)}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-violet-800/70">
              <ProfileAvatar
                name={counterparty?.displayName}
                address={transaction.counterparty}
                avatarUrl={counterparty?.avatarUrl}
                size="sm"
              />
              <span>
                {isDebit ? "To" : "From"}{" "}
                {counterparty?.displayName ?? shortenAddress(transaction.counterparty)}
              </span>
            </div>

            {transaction.promiseText ? (
              <Link
                href={promiseDetailPath(transaction.promiseSlug, "transactions")}
                className="block truncate text-xs text-violet-700 underline-offset-2 hover:underline"
              >
                {transaction.promiseText}
              </Link>
            ) : null}

            <p className="text-[10px] text-violet-600/60">
              {new Date(transaction.createdAt).toLocaleString()}
            </p>
          </div>
        </div>

        {txHash ? (
          <a
            href={gnosisScanTxUrl(txHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[10px] text-violet-700/80 underline-offset-2 hover:underline"
          >
            View on Gnosisscan
            <ExternalLink className="size-3" />
          </a>
        ) : null}
      </CardContent>
    </Card>
  )
}
