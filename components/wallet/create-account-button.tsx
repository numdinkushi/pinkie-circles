"use client"

import { useEffect, useRef, useState } from "react"
import { LoaderCircle } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { OpenInPlaygroundButton } from "@/components/wallet/open-in-playground-button"
import { useWallet } from "@/components/wallet/wallet-provider"
import { shortenAddress } from "@/lib/referrals"

type MiniappSdk = typeof import("@aboutcircles/miniapp-sdk")

export function CreateAccountButton({
  label = "Connect Circles account",
  referralLabel = "Create account & claim invite",
  compact = false,
}: {
  label?: string
  referralLabel?: string
  compact?: boolean
}) {
  const { isConnected, isMiniappHost, referralSecret, syncAddress } = useWallet()
  const sdkRef = useRef<MiniappSdk | null>(null)
  const [ready, setReady] = useState(false)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    let active = true
    import("@aboutcircles/miniapp-sdk").then((sdk) => {
      if (!active) return
      sdkRef.current = sdk
      setReady(true)
    })
    return () => {
      active = false
    }
  }, [])

  async function handleClick() {
    const sdk = sdkRef.current
    if (!sdk) return
    setPending(true)
    try {
      const result = await sdk.requestCreateAccount()
      if (result.address) {
        syncAddress(result.address)

        const registerRes = await fetch("/api/account/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ account: result.address }),
        })
        const registerData = await registerRes.json().catch(() => ({}))
        if (!registerRes.ok) {
          throw new Error(registerData.error || "Could not finish Circles registration.")
        }
      }

      const connectedAs = result.address ? shortenAddress(result.address) : null
      if (referralSecret) {
        toast.success("Welcome to Pinkie on Circles", {
          description: connectedAs
            ? `Connected as ${connectedAs} — you can make and witness promises now.`
            : "Your account is ready — you can make and witness promises now.",
        })
      } else {
        toast.success("Circles account connected", {
          description: connectedAs
            ? `You're signed in as ${connectedAs}.`
            : "You're ready to make promises.",
        })
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Account setup cancelled")
    } finally {
      setPending(false)
    }
  }

  if (!isMiniappHost) {
    return (
      <OpenInPlaygroundButton
        compact={compact}
        label={compact ? "Open in Circles" : "Open in Circles Playground"}
      />
    )
  }

  const buttonLabel =
    referralSecret && !isConnected ? referralLabel : isConnected ? "Switch account" : label

  return (
    <Button
      onClick={handleClick}
      disabled={!ready || pending}
      size={compact ? "sm" : "default"}
      className={compact ? "h-8 shrink-0 px-3 text-xs" : "w-full"}
    >
      {pending ? (
        <>
          <LoaderCircle className="animate-spin" />
          Waiting for host…
        </>
      ) : (
        buttonLabel
      )}
    </Button>
  )
}
