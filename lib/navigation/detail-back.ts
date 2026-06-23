export type DetailBackSource =
  | "home"
  | "record"
  | "transactions"
  | "circle"
  | "circle-friend"
  | "high-fives"
  | "profile"
  | "mine"

export const DETAIL_FROM_PARAM = "from"
export const DETAIL_CIRCLE_PARAM = "circle"

const BACK_BY_SOURCE: Record<
  DetailBackSource,
  { label: string; href: (circleAddress?: string) => string }
> = {
  home: { label: "Back to home", href: () => "/" },
  record: { label: "Back to record", href: () => "/record" },
  transactions: { label: "Back to transactions", href: () => "/transactions" },
  circle: { label: "Back to circle", href: () => "/circle" },
  "circle-friend": {
    label: "Back to circle",
    href: (circleAddress) => (circleAddress ? `/circle/${circleAddress}` : "/circle"),
  },
  "high-fives": { label: "Back to high fives", href: () => "/high-fives" },
  profile: { label: "Back to profile", href: () => "/profile" },
  mine: { label: "Back to my promises", href: () => "/mine" },
}

const DEFAULT_BACK = BACK_BY_SOURCE.record

function isDetailBackSource(value: string | null | undefined): value is DetailBackSource {
  return value != null && value in BACK_BY_SOURCE
}

export function promiseDetailPath(
  slug: string,
  from?: DetailBackSource,
  options?: { circleAddress?: string },
) {
  if (!from) return `/p/${slug}`

  const params = new URLSearchParams({ [DETAIL_FROM_PARAM]: from })
  if (from === "circle-friend" && options?.circleAddress) {
    params.set(DETAIL_CIRCLE_PARAM, options.circleAddress)
  }
  return `/p/${slug}?${params.toString()}`
}

export function resolveDetailBack(from?: string | null, circleAddress?: string | null) {
  const source = isDetailBackSource(from) ? BACK_BY_SOURCE[from] : DEFAULT_BACK
  return {
    href: source.href(circleAddress ?? undefined),
    label: source.label,
  }
}
