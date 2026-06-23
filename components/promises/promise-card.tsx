"use client"

import Link from "next/link"

import { PromiseStatusBadge } from "@/components/promises/promise-status-badge"
import { ProfileAvatar } from "@/components/profile/profile-avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { useProfilesByAddresses } from "@/hooks/use-profile"
import type { PromiseRecord } from "@/hooks/use-promises"
import { useWallet } from "@/components/wallet/wallet-provider"
import { promiseRoleLabel } from "@/lib/circle/display"
import { formatDueDate } from "@/lib/promises/dates"
import { cardCounterpartyLabel, kindBadgeClassName, kindBadgeLabel, kindBadgeTone } from "@/lib/promises/kind"
import { shortenAddress } from "@/lib/referrals"
import { cn } from "@/lib/utils"

type PromiseCardProps = {
  promise: PromiseRecord
  className?: string
  showRole?: boolean
}

export function PromiseCard({ promise, className, showRole = true }: PromiseCardProps) {
  const { address } = useWallet()
  const profileAddresses = [
    promise.makerAddress,
    ...(promise.witnessAddress ? [promise.witnessAddress] : []),
  ]
  const profiles = useProfilesByAddresses(profileAddresses)
  const maker = profiles?.find((p) => p.address === promise.makerAddress.toLowerCase())
  const witness = profiles?.find((p) => p.address === promise.witnessAddress?.toLowerCase())

  const counterparty =
    address?.toLowerCase() === promise.makerAddress
      ? witness
      : address?.toLowerCase() === promise.witnessAddress
        ? maker
        : witness ?? maker

  const role =
    showRole && address ? promiseRoleLabel(promise, address) : null
  const counterpartyLabel = cardCounterpartyLabel(promise)
  const kindLabel = kindBadgeLabel(promise)
  const kindTone = kindBadgeTone(promise)

  return (
    <Link href={`/p/${promise.slug}`} className="block">
      <Card
        className={cn(
          "transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-pink-200/40",
          className,
        )}
      >
        <CardHeader className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-1.5">
                {role ? (
                  <Badge
                    variant="outline"
                    className="border-violet-200 bg-violet-50/80 text-[10px] text-violet-700"
                  >
                    {role}
                  </Badge>
                ) : null}
                <Badge
                  variant="outline"
                  className={cn("text-[10px]", kindBadgeClassName(kindTone))}
                >
                  {kindLabel}
                </Badge>
              </div>
              <p className="text-base font-medium leading-snug">{promise.text}</p>
            </div>
            <PromiseStatusBadge status={promise.status} dueAt={promise.dueAt} />
          </div>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-3 text-sm text-violet-800/70">
          <div className="flex items-center gap-2">
            {promise.witnessAddress ? (
              <ProfileAvatar
                name={counterparty?.displayName}
                address={counterparty?.address ?? promise.witnessAddress}
                avatarUrl={counterparty?.avatarUrl}
                size="sm"
              />
            ) : (
              <span
                className="flex size-8 shrink-0 items-center justify-center rounded-full border border-dashed border-violet-300/80 bg-violet-50/80 text-[10px] font-medium text-violet-400"
                aria-hidden
              >
                ?
              </span>
            )}
            <span>
              {promise.witnessAddress
                ? (counterparty?.displayName ??
                  shortenAddress(counterparty?.address ?? promise.witnessAddress))
                : counterpartyLabel}
              {" · "}
              {formatDueDate(promise.dueAt)}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
