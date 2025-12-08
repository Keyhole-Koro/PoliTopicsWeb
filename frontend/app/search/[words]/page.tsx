import { getPopularSearchParams } from "@/lib/static-params"
import { SearchClient } from "./SearchClient"

export function generateStaticParams() {
  return getPopularSearchParams()
}

type SearchPageProps = {
  params: Promise<{ words?: string }>
}

export default async function SearchPage({ params }: SearchPageProps) {
  const resolvedParams = await params
  const decoded = decodeURIComponent(resolvedParams.words ?? "")
  const initialWords = decoded ? decoded.split(",").filter(Boolean) : []

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">記事検索</h1>
          <p className="text-sm text-muted-foreground mt-2">
            words パラメータはカンマ区切りで複数指定できます。Next.js の router.push を使って SPA 遷移します。
          </p>
        </div>
        <SearchClient initialWords={initialWords} />
      </div>
    </main>
  )
}
