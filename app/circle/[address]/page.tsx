import { CircleFriendPage } from "@/components/pages/circle-friend-page"

type PageProps = {
  params: Promise<{ address: string }>
}

export default async function Page({ params }: PageProps) {
  const { address } = await params
  return <CircleFriendPage counterparty={decodeURIComponent(address)} />
}
