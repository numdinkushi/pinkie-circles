"use client"

import { useState } from "react"
import { LoaderCircle } from "lucide-react"
import { toast } from "sonner"

import { AvatarUpload } from "@/components/profile/avatar-upload"
import { CreateAccountButton } from "@/components/wallet/create-account-button"
import { CrcBalanceCard } from "@/components/wallet/crc-balance-card"
import { FinishCirclesSetupCard } from "@/components/wallet/finish-circles-setup-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useProfile } from "@/hooks/use-profile"
import { useWallet } from "@/components/wallet/wallet-provider"
export function ProfilePage() {
  const { address, isConnected } = useWallet()
  const { profile, saveProfile } = useProfile(address)
  const [displayName, setDisplayName] = useState("")
  const [saving, setSaving] = useState(false)

  if (!isConnected || !address) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your profile</CardTitle>
          <CardDescription>Optional name and photo for when friends see your promises.</CardDescription>
        </CardHeader>
        <CardContent>
          <CreateAccountButton />
        </CardContent>
      </Card>
    )
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true)
    try {
      await saveProfile({ displayName: displayName.trim() || undefined })
      toast.success("Profile saved")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save profile")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Profile</h1>
        <p className="text-sm text-muted-foreground">
          Your CRC wallet and optional display details.
        </p>
      </div>

      <CrcBalanceCard address={address} />
      <FinishCirclesSetupCard />

      <AvatarUpload address={address} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Display name</CardTitle>
          <CardDescription>How friends see you on promise cards.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-3" onSubmit={handleSave}>
            <Input
              placeholder={profile?.displayName ?? "Your name"}
              defaultValue={profile?.displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <LoaderCircle className="animate-spin" />
                  Saving…
                </>
              ) : (
                "Save name"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
