"use client"

import { useState } from "react"

import { PromiseDetailBackButton } from "@/components/promises/promise-detail-back-button"

import { PromiseActions } from "@/components/promises/promise-actions"
import { PromiseEditForm } from "@/components/promises/promise-edit-form"
import { PromiseEditedLabel } from "@/components/promises/promise-edited-label"
import { PromiseTipBadges } from "@/components/promises/promise-tip-badges"
import { PromiseStatusBadge } from "@/components/promises/promise-status-badge"
import { ProfileAvatar } from "@/components/profile/profile-avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { useAssignWitness } from "@/hooks/use-assign-witness"
import { useProfilesByAddresses } from "@/hooks/use-profile"
import { usePromiseBySlug } from "@/hooks/use-promises"
import { useWallet } from "@/components/wallet/wallet-provider"
import {
  promiseRoleLabel,
  witnessStatusLabel,
  makerMetaLabel,
  witnessMetaLabel,
} from "@/lib/circle/display"
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
import { canEditBeforeShare, wasEdited } from "@/lib/promises/edit"

type PromiseDetailPageProps = {
  slug: string
  from?: string | null
  circleAddress?: string | null
}

export function PromiseDetailPage({ slug, from, circleAddress }: PromiseDetailPageProps) {
  const { address, isConnected } = useWallet()
  const promise = usePromiseBySlug(slug)
  useAssignWitness(slug)
  const [editing, setEditing] = useState(false)

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
      <div className="space-y-4">
        <PromiseDetailBackButton from={from} circleAddress={circleAddress} />
        <Card>
          <CardContent className="py-10 text-center text-sm text-violet-800/70">
            Promise not found. Check the link and try again.
          </CardContent>
        </Card>
      </div>
    )
  }

  const isMaker = isConnected && address?.toLowerCase() === promise.makerAddress
  const kind = getPinkieKind(promise)
  const surprise = isSurprise(promise)
  const roleLabel =
    isConnected && address ? promiseRoleLabel(promise, address) : kindTitle(kind)
  const waitingLabel = isMaker ? witnessStatusLabel(promise, true) : null
  const makerLabel = maker?.displayName ?? shortenAddress(promise.makerAddress)
  const makerMeta = makerMetaLabel(promise)
  const witnessMeta = witnessMetaLabel(promise, makerLabel)
  const kindLabel = kindBadgeLabel(promise)
  const kindTone = kindBadgeTone(promise)
  const canEdit = isMaker && canEditBeforeShare(promise, address)

  return (
    <div className="space-y-4">
      <PromiseDetailBackButton from={from} circleAddress={circleAddress} />

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
              {editing && canEdit && address ? (
                <PromiseEditForm
                  promise={promise}
                  makerAddress={address}
                  onDone={() => setEditing(false)}
                />
              ) : (
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <p className="text-xl font-medium leading-snug">{promise.text}</p>
                  {wasEdited(promise) ? <PromiseEditedLabel /> : null}
                </div>
              )}
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
                <p className="font-medium">{makerLabel}</p>
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

          <PromiseTipBadges promiseSlug={promise.slug} />

          {promise.acknowledgmentFeedback ? (
            <div className="rounded-xl border border-pink-200/60 bg-white/70 p-3 text-sm">
              <p className="text-xs font-medium text-violet-700">Their note</p>
              <p className="mt-1 text-violet-900/90">{promise.acknowledgmentFeedback}</p>
            </div>
          ) : null}
        </CardHeader>
        <CardContent>
          <PromiseActions
            slug={promise.slug}
            makerAddress={promise.makerAddress}
            witnessAddress={promise.witnessAddress}
            status={promise.status}
            kind={kind}
            canEdit={canEdit && !editing}
            onEdit={() => setEditing(true)}
          />
        </CardContent>
      </Card>
    </div>
  )
}
