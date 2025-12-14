import { Suspense } from "react"
import { SearchPageClient } from "./search-page-client"

export default function SearchPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">記事検索</h1>
        </div>
        <Suspense fallback={null}>
          <SearchPageClient />
        </Suspense>
      </div>
    </main>
  )
}
