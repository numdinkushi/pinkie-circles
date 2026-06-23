"use client"

import { useEffect, useState } from "react"
import { ExternalLink, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { buildPlaygroundEntryUrl } from "@/lib/referrals"
import { cn } from "@/lib/utils"

type OpenInPlaygroundButtonProps = {
  label?: string
  compact?: boolean
  className?: string
  path?: string
}

export function OpenInPlaygroundButton({
  label = "Open in Circles Playground",
  compact = false,
  className,
  path = "/",
}: OpenInPlaygroundButtonProps) {
  const [href, setHref] = useState<string | null>(null)

  useEffect(() => {
    setHref(buildPlaygroundEntryUrl(path))
  }, [path])

  return (
    <Button
      asChild
      size={compact ? "sm" : "default"}
      className={cn(compact ? "h-8 shrink-0 px-3 text-xs" : "w-full", className)}
      disabled={!href}
    >
      <a
        href={href ?? "#"}
        target="_blank"
        rel="noopener noreferrer"
        aria-disabled={!href}
        onClick={(event) => {
          if (!href) event.preventDefault()
        }}
      >
        {compact ? <ExternalLink /> : <Sparkles />}
        {label}
        {!compact ? <ExternalLink className="opacity-70" /> : null}
      </a>
    </Button>
  )
}
