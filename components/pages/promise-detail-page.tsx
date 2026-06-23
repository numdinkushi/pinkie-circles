"use client"

import { PromiseActions } from "@/components/promises/promise-actions"
import { PromiseStatusBadge } from "@/components/promises/promise-status-badge"
import { ProfileAvatar } from "@/components/profile/profile-avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { useAssignWitness } from "@/hooks/use-assign-witness"
import { useProfilesByAddresses } from "@/hooks/use-profile"
import { usePromiseBySlug } from "@/hooks/use-promises"
import { useWallet } from "@/components/wallet/wallet-provider"
import { promiseRoleLabel, witnessStatusLabel, makerMetaLabel } from "@/lib/circle/display"
import { formatDueDate } from "@/lib/promises/dates"
import {
  getPinkieKind,
  isSurprise,
  kindBadgeClassName,
  kindBadgeLabel,
  kindBadgeTone,
  kindTitle,
} from "@/lib/promises/kind"
import { shortenAddress } from "@/lib/referrals"

type PromiseDetailPageProps = {
  slug: string
}

export function PromiseDetailPage({ slug }: PromiseDetailPageProps) {
  const { address, isConnected } = useWallet()
  const promise = usePromiseBySlug(slug)
  useAssignWitness(slug)

  const profileAddresses = promise
    ? [promise.makerAddress, ...(promise.witnessAddress ? [promise.witnessAddress] : [])]
    : []
  const profiles = useProfilesByAddresses(profileAddresses)
  const maker = profiles?.find((p) => p.address === promise?.makerAddress.toLowerCase())
  const witness = profiles?.find((p) => p.address === promise?.witnessAddress?.toLowerCase())

  if (promise === undefined) {
    return <p className="text-sm text-violet-800/70">Loading promise…</p>
  }

  if (!promise) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-violet-800/70">
          Promise not found. Check the link and try again.
        </CardContent>
      </Card>
    )
  }

  const isMaker = isConnected && address?.toLowerCase() === promise.makerAddress
  const kind = getPinkieKind(promise)
  const surprise = isSurprise(promise)
  const roleLabel =
    isConnected && address ? promiseRoleLabel(promise, address) : kindTitle(kind)
  const waitingLabel = isMaker ? witnessStatusLabel(promise, true) : null
  const makerMeta = makerMetaLabel(promise)
  const witnessMeta = surprise ? "Discovered your surprise" : "Witness · holds them to it"
  const kindLabel = kindBadgeLabel(promise)
  const kindTone = kindBadgeTone(promise)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="border-violet-200 bg-violet-50 text-violet-700">
                  {roleLabel}
                </Badge>
                <Badge variant="outline" className={kindBadgeClassName(kindTone)}>
                  {kindLabel}
                </Badge>
              </div>
              <p className="text-xl font-medium leading-snug">{promise.text}</p>
            </div>
            <PromiseStatusBadge status={promise.status} dueAt={promise.dueAt} />
          </div>

          <div className="space-y-3 rounded-xl border border-pink-200/60 bg-pink-50/50 p-3">
            <div className="flex items-center gap-3 text-sm">
              <ProfileAvatar
                name={maker?.displayName}
                address={promise.makerAddress}
                avatarUrl={maker?.avatarUrl}
                size="sm"
              />
              <div>
                <p className="font-medium">
                  {maker?.displayName ?? shortenAddress(promise.makerAddress)}
                </p>
                <p className="text-violet-800/70">
                  {makerMeta} · {formatDueDate(promise.dueAt)}
                </p>
              </div>
            </div>

            {promise.witnessAddress ? (
              <div className="flex items-center gap-3 border-t border-pink-200/50 pt-3 text-sm">
                <ProfileAvatar
                  name={witness?.displayName}
                  address={promise.witnessAddress}
                  avatarUrl={witness?.avatarUrl}
                  size="sm"
                />
                <div>
                  <p className="font-medium">
                    {witness?.displayName ?? shortenAddress(promise.witnessAddress)}
                  </p>
                  <p className="text-violet-800/70">{witnessMeta}</p>
                </div>
              </div>
            ) : waitingLabel ? (
              <p className="border-t border-pink-200/50 pt-3 text-xs text-violet-800/70">
                {waitingLabel}
              </p>
            ) : null}
          </div>
        </CardHeader>
        <CardContent>
          <PromiseActions
            slug={promise.slug}
            makerAddress={promise.makerAddress}
            witnessAddress={promise.witnessAddress}
            status={promise.status}
            kind={kind}
          />
        </CardContent>
      </Card>
    </div>
  )
}
