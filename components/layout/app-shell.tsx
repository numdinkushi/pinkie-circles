"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BookMarked, ArrowLeftRight, HeartHandshake, Home, Sparkles, Trophy, UserRound } from "lucide-react"

import { HeaderWalletChip } from "@/components/layout/header-wallet-chip"
import { CreateAccountButton } from "@/components/wallet/create-account-button"
import { useWallet } from "@/components/wallet/wallet-provider"
import { cn } from "@/lib/utils"

const NAV = [
  { href: "/", label: "Home", shortLabel: "Home", icon: Home },
  { href: "/record", label: "Record", shortLabel: "Record", icon: BookMarked },
  { href: "/transactions", label: "Transactions", shortLabel: "Tips", icon: ArrowLeftRight },
  { href: "/circle", label: "Circle", shortLabel: "Circle", icon: HeartHandshake },
  { href: "/high-fives", label: "High Fives", shortLabel: "Fives", icon: Trophy },
  { href: "/profile", label: "Profile", shortLabel: "You", icon: UserRound },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { address, isConnected } = useWallet()

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-lg flex-col">
      <header className="sticky top-0 z-10 px-4 pb-2 pt-3">
        <div className="pinkie-glass flex items-center justify-between gap-2 rounded-2xl px-3 py-2.5 shadow-sm shadow-pink-200/20">
          <Link href="/" className="flex min-w-0 items-center gap-2.5">
            <div className="pinkie-gradient-bg flex size-8 shrink-0 items-center justify-center rounded-xl text-white shadow-md shadow-pink-300/30">
              <Sparkles className="size-3.5" />
            </div>
            <div className="min-w-0">
              <p className="pinkie-gradient-text truncate text-base font-semibold tracking-tight">
                Pinkie
              </p>
              <p className="hidden truncate text-[10px] text-violet-600/70 sm:block">
                Hold me to it
              </p>
            </div>
          </Link>

          {isConnected && address ? (
            <HeaderWalletChip address={address} />
          ) : (
            <CreateAccountButton label="Connect" compact />
          )}
        </div>
      </header>

      <main className="flex-1 px-4 pb-4 pt-2">{children}</main>

      <nav className="sticky bottom-0 z-10 px-4 pb-4 pt-2">
        <div className="pinkie-glass pinkie-nav-glow flex items-stretch justify-around rounded-[1.25rem] p-1.5">
          {NAV.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href || pathname.startsWith(`${item.href}/`)
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-2 transition-all duration-200",
                  active
                    ? "text-violet-900"
                    : "text-violet-500/70 hover:bg-pink-50/80 hover:text-violet-800",
                )}
              >
                {active ? (
                  <span className="pinkie-gradient-bg absolute inset-x-2 top-1.5 bottom-1.5 -z-10 rounded-lg opacity-15" />
                ) : null}
                <span
                  className={cn(
                    "flex size-8 items-center justify-center rounded-xl transition-all duration-200",
                    active && "pinkie-gradient-bg text-white shadow-md shadow-pink-300/40",
                  )}
                >
                  <Icon className="size-4" />
                </span>
                <span
                  className={cn(
                    "text-[9px] font-medium leading-none",
                    active ? "text-violet-900" : "text-violet-600/70",
                  )}
                >
                  <span className="sm:hidden">{item.shortLabel}</span>
                  <span className="hidden sm:inline">{item.label}</span>
                </span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
