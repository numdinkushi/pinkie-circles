"use client"

import Link from "next/link"
import { ChevronLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { resolveDetailBack } from "@/lib/navigation/detail-back"

type PromiseDetailBackButtonProps = {
  from?: string | null
  circleAddress?: string | null
}

export function PromiseDetailBackButton({ from, circleAddress }: PromiseDetailBackButtonProps) {
  const { href, label } = resolveDetailBack(from, circleAddress)

  return (
    <Button variant="ghost" size="sm" className="-ml-2 text-violet-700 hover:text-violet-900" asChild>
      <Link href={href}>
        <ChevronLeft className="size-4" />
        {label}
      </Link>
    </Button>
  )
}
