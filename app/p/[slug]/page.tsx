import { PromiseDetailPage } from "@/components/pages/promise-detail-page"

type PageProps = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ from?: string; circle?: string }>
}

export default async function Page({ params, searchParams }: PageProps) {
  const { slug } = await params
  const { from, circle } = await searchParams
  return <PromiseDetailPage slug={slug} from={from} circleAddress={circle} />
}
