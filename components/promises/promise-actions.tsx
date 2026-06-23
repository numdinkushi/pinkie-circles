"use client"

import { useState } from "react"
import { Check, Copy, Heart, LoaderCircle, Share2 } from "lucide-react"
import { toast } from "sonner"

import { CreateAccountButton } from "@/components/wallet/create-account-button"
import { Button } from "@/components/ui/button"
import { usePromiseMutations, useThanksMutations, type PromiseRecord } from "@/hooks/use-promises"
import { useWallet } from "@/components/wallet/wallet-provider"
import { sendThanks } from "@/lib/circles"
import {
  getPinkieKind,
  isSurprise,
  kindRequiresWitnessToClose,
} from "@/lib/promises/kind"
import { buildShareablePromiseUrl } from "@/lib/referrals"

type PromiseActionsProps = {
  slug: string
  makerAddress: string
  witnessAddress?: string
  status: PromiseRecord["status"]
  kind?: PromiseRecord["kind"]
}

export function PromiseActions({
  slug,
  makerAddress,
  witnessAddress,
  status,
  kind: kindProp,
}: PromiseActionsProps) {
  const { address, isConnected, isMiniappHost } = useWallet()
  const { markDone } = usePromiseMutations()
  const { recordThanks } = useThanksMutations()
  const [confirming, setConfirming] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [thanking, setThanking] = useState(false)

  const kind = getPinkieKind({ kind: kindProp })
  const surprise = isSurprise({ kind: kindProp })
  const isMaker = address?.toLowerCase() === makerAddress.toLowerCase()
  const isWitness = !!witnessAddress && address?.toLowerCase() === witnessAddress.toLowerCase()
  const hasWitness = !!witnessAddress
  const needsWitnessForClose = kindRequiresWitnessToClose(kind) && !hasWitness
  const canConfirm =
    isConnected &&
    status === "open" &&
    (surprise ? isMaker : hasWitness && (isMaker || isWitness))
  const surpriseReadyToShare = surprise && status === "done" && !hasWitness && isMaker

  const thanksTarget =
    status === "done" && address
      ? isMaker && witnessAddress
        ? witnessAddress
        : isWitness
          ? makerAddress
          : null
      : null

  async function handleConfirm(asMaker: boolean) {
    if (!address) return
    setConfirming(true)
    try {
      await markDone({ slug, actorAddress: address })
      toast.success(
        surprise
          ? "Marked as done — share the link when you're ready to surprise them"
          : asMaker
            ? "Marked as done — nice work!"
            : "Confirmed — they kept their word",
      )
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update")
    } finally {
      setConfirming(false)
    }
  }

  async function handleShare() {
    setSharing(true)
    try {
      const shareUrl = buildShareablePromiseUrl(slug, { inHost: isMiniappHost })
      await navigator.clipboard.writeText(shareUrl)
      if (surprise && status === "done" && !witnessAddress) {
        toast.success("Surprise link copied — send it when you're ready")
      } else if (isMaker && !witnessAddress) {
        toast.success("Link copied — send it to the friend who should hold you to it")
      } else {
        toast.success("Share link copied")
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not copy link")
    } finally {
      setSharing(false)
    }
  }

  async function handleThanks() {
    if (!address || !thanksTarget) return
    setThanking(true)
    try {
      await sendThanks({ from: address, to: thanksTarget, slug })
      await recordThanks({
        fromAddress: address,
        toAddress: thanksTarget,
        promiseSlug: slug,
        amountCrc: 1,
      })
      toast.success("1 CRC thanks sent")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send thanks")
    } finally {
      setThanking(false)
    }
  }

  if (!isConnected) {
    return (
      <div className="space-y-3 rounded-xl border border-pink-200/70 bg-gradient-to-br from-pink-50/90 to-violet-50/90 p-4">
        <p className="text-sm text-violet-800/70">
          Connect your Circles account to witness, confirm, or send thanks.
        </p>
        <CreateAccountButton referralLabel="Create account to join" />
      </div>
    )
  }

  if (status === "open" && !isMaker && !isWitness && witnessAddress) {
    return (
      <div className="rounded-xl border border-violet-200/70 bg-violet-50/60 p-4 text-sm text-violet-900/80">
        This {surprise ? "surprise" : "promise"} is between two friends in their Circle. Only they can
        close it.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {status === "open" ? (
        <div className="space-y-3">
          {isMaker && needsWitnessForClose ? (
            <p className="rounded-xl border border-violet-200/70 bg-violet-50/60 px-3 py-2.5 text-xs text-violet-900/80">
              Share the link with a friend first — they become your witness before you can close this
              promise.
            </p>
          ) : null}
          {isMaker && surprise ? (
            <p className="rounded-xl border border-fuchsia-200/70 bg-gradient-to-br from-pink-50/90 to-fuchsia-50/80 px-3 py-2.5 text-xs text-violet-900/80">
              You already did this — mark it done, then share the link as a surprise.
            </p>
          ) : null}
          <div className="grid gap-2 sm:grid-cols-2">
            {isMaker ? (
              <Button
                onClick={() => handleConfirm(true)}
                disabled={!canConfirm || confirming}
                title={
                  needsWitnessForClose
                    ? "Share the link with a friend first — they become your witness"
                    : undefined
                }
              >
                {confirming ? <LoaderCircle className="animate-spin" /> : <Check />}
                I did it
              </Button>
            ) : isWitness ? (
              <Button onClick={() => handleConfirm(false)} disabled={!canConfirm || confirming}>
                {confirming ? <LoaderCircle className="animate-spin" /> : <Check />}
                They did it
              </Button>
            ) : null}
            {(isMaker || isWitness) && (
              <Button
                variant={needsWitnessForClose || surpriseReadyToShare ? "default" : "outline"}
                onClick={handleShare}
                disabled={sharing || (surprise && status === "open")}
                title={surprise && status === "open" ? "Mark it done before sharing the surprise" : undefined}
              >
                {sharing ? <LoaderCircle className="animate-spin" /> : <Share2 />}
                {surpriseReadyToShare
                  ? "Copy surprise link"
                  : needsWitnessForClose
                    ? "Copy link for witness"
                    : "Copy link"}
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {surpriseReadyToShare ? (
            <p className="rounded-xl border border-fuchsia-200/70 bg-gradient-to-br from-pink-50/90 to-fuchsia-50/80 px-3 py-2.5 text-xs text-violet-900/80">
              Share the link — the first friend to open will discover your surprise.
            </p>
          ) : null}
          <div className="grid gap-2 sm:grid-cols-2">
            {thanksTarget ? (
              <Button onClick={handleThanks} disabled={thanking}>
                {thanking ? <LoaderCircle className="animate-spin" /> : <Heart />}
                Send 1 CRC thanks
              </Button>
            ) : null}
            <Button
              variant={surpriseReadyToShare ? "default" : "outline"}
              onClick={handleShare}
              disabled={sharing}
            >
              {sharing ? <LoaderCircle className="animate-spin" /> : <Copy />}
              {surpriseReadyToShare ? "Copy surprise link" : "Copy link"}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
