"use client"

import Link from "next/link"
import { LoaderCircle } from "lucide-react"

import { ProfileAvatar } from "@/components/profile/profile-avatar"
import { useCrcBalance } from "@/hooks/use-crc-balance"
import { useProfile } from "@/hooks/use-profile"
import { cn } from "@/lib/utils"

type HeaderWalletChipProps = {
  address: string
}

export function HeaderWalletChip({ address }: HeaderWalletChipProps) {
  const { profile } = useProfile(address)
  const { formatted, loading } = useCrcBalance(address)

  return (
    <Link
      href="/profile"
      className={cn(
        "group flex max-w-[9.5rem] shrink-0 items-center gap-2 rounded-2xl border border-pink-200/50",
        "bg-white/80 py-1 pl-1 pr-3 shadow-sm shadow-pink-200/25 transition-all",
        "hover:border-pink-300/60 hover:bg-white hover:shadow-md hover:shadow-pink-200/30",
      )}
      title="Profile & CRC wallet"
    >
      <ProfileAvatar
        name={profile?.displayName}
        address={address}
        avatarUrl={profile?.avatarUrl}
        size="sm"
        className="ring-2 ring-pink-100"
      />
      <div className="min-w-0 leading-none">
        {loading ? (
          <LoaderCircle className="size-3.5 animate-spin text-violet-500" />
        ) : (
          <>
            <p className="truncate text-xs font-semibold tabular-nums text-violet-950">
              {formatted}
            </p>
            <p className="text-[10px] font-medium text-violet-500/80">CRC</p>
          </>
        )}
      </div>
    </Link>
  )
}
