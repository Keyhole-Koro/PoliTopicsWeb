import { getPopularSearchParams } from "@/lib/static-params"
import { SearchClient } from "./SearchClient"
import type { SearchFilters } from "@shared/types/article"

export function generateStaticParams() {
  return getPopularSearchParams()
}

type SearchPageProps = {
  params: Promise<{ words?: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function SearchPage({ params, searchParams }: SearchPageProps) {
  const resolvedParams = await params
  const resolvedSearchParams = await searchParams
  const decoded = decodeURIComponent(resolvedParams.words ?? "")
  const initialWords = decoded ? decoded.split(",").filter(Boolean) : []
  const initialFilters = buildInitialFilters(resolvedSearchParams)

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">記事検索</h1>
        </div>
        <SearchClient initialWords={initialWords} initialFilters={initialFilters} />
      </div>
    </main>
  )
}

function buildInitialFilters(
  searchParams: Record<string, string | string[] | undefined>,
): Pick<SearchFilters, "sort"> & {
  categories: string[]
  houses: string[]
  meetings: string[]
  dateStart?: string
  dateEnd?: string
} {
  const categories = toList(searchParams.categories)
  const houses = toList(searchParams.houses)
  const meetings = toList(searchParams.meetings)
  const sort = toSort(searchParams.sort)

  return {
    categories,
    houses,
    meetings,
    dateStart: toDateValue(searchParams.dateStart),
    dateEnd: toDateValue(searchParams.dateEnd),
    sort,
  }
}

function toList(value?: string | string[]): string[] {
  if (!value) return []
  const raw = Array.isArray(value) ? value.join(",") : value
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
}

function toSort(value?: string | string[]): SearchFilters["sort"] {
  const raw = Array.isArray(value) ? value[0] : value
  return raw === "date_asc" ? "date_asc" : "date_desc"
}

function toDateValue(value?: string | string[]): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value
  if (!raw) return undefined
  const timestamp = Number(new Date(raw))
  if (Number.isNaN(timestamp)) {
    return undefined
  }
  return new Date(timestamp).toISOString()
}
