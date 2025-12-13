'use client'

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import type { ArticleSummary, SearchFilters } from "@shared/types/article"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArticleCard } from "@/components/articles/article-card"
import { fetchSearch, fetchSuggestions } from "@/lib/api"
import { SearchSuggestions } from "@/components/search/search-suggestions"
import { Search } from "lucide-react"

type StaticFilters = {
  categories: string[]
  houses: string[]
  meetings: string[]
  dateStart?: string
  dateEnd?: string
}

type Props = {
  initialWords: string[]
  initialFilters?: StaticFilters & Pick<SearchFilters, "sort">
}

const SEARCH_DEBOUNCE_MS = 300

export function SearchClient({ initialWords, initialFilters }: Props) {
  const router = useRouter()
  const [words, setWords] = useState(initialWords)
  const [sort, setSort] = useState<SearchFilters["sort"]>(initialFilters?.sort ?? "date_desc")
  const [results, setResults] = useState<ArticleSummary[]>([])
  const [query, setQuery] = useState(initialWords.join(","))
  const [debouncedQuery, setDebouncedQuery] = useState(query)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const staticFilters = useMemo<StaticFilters>(
    () => ({
      categories: initialFilters?.categories ?? [],
      houses: initialFilters?.houses ?? [],
      meetings: initialFilters?.meetings ?? [],
      dateStart: initialFilters?.dateStart,
      dateEnd: initialFilters?.dateEnd,
    }),
    [initialFilters],
  )

  useEffect(() => {
    setSort(initialFilters?.sort ?? "date_desc")
  }, [initialFilters])

  useEffect(() => {
    setLoading(true)
    fetchSearch({
      words,
      sort,
      limit: 24,
      categories: staticFilters.categories,
      houses: staticFilters.houses,
      meetings: staticFilters.meetings,
      dateStart: staticFilters.dateStart,
      dateEnd: staticFilters.dateEnd,
    })
      .then((response) => setResults(response.items))
      .finally(() => setLoading(false))
  }, [words, sort, staticFilters])

  useEffect(() => {
    if (query === debouncedQuery) {
      return
    }
    const timeout = setTimeout(() => setDebouncedQuery(query), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timeout)
  }, [query, debouncedQuery])

  useEffect(() => {
    if (debouncedQuery.trim().length < 2) {
      setSuggestions([])
      return
    }

    const controller = new AbortController()
    fetchSuggestions(debouncedQuery.trim(), {
      limit: 5,
      filters: staticFilters,
      signal: controller.signal,
    })
      .then((response) => setSuggestions(response.suggestions))
      .catch(() => setSuggestions([]))

    return () => controller.abort()
  }, [debouncedQuery])

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const normalized = normalizeWords(query)
    if (!normalized) return
    setWords(splitWords(normalized))
    router.push(buildSearchPath(normalized, sort, staticFilters))
  }

  function handleSuggestionSelect(value: string) {
    const normalized = normalizeWords(value)
    if (!normalized) return
    setQuery(normalized)
    setWords(splitWords(normalized))
    router.push(buildSearchPath(normalized, sort, staticFilters))
    setSuggestions([])
  }

  function handleSortChange(value: SearchFilters["sort"]) {
    setSort(value)
    if (words.length === 0) return
    const normalized = normalizeWords(words.join(","))
    router.replace(buildSearchPath(normalized, value, staticFilters))
  }

  const activeFilterChips = useMemo(() => {
    const chips: string[] = []
    if (staticFilters.categories.length > 0) {
      chips.push(`カテゴリー: ${staticFilters.categories.join(", ")}`)
    }
    if (staticFilters.houses.length > 0) {
      chips.push(`院: ${staticFilters.houses.join(", ")}`)
    }
    if (staticFilters.meetings.length > 0) {
      chips.push(`会議: ${staticFilters.meetings.join(", ")}`)
    }
    if (staticFilters.dateStart || staticFilters.dateEnd) {
      const parts = [
        staticFilters.dateStart ? formatDisplayDate(staticFilters.dateStart) : "指定なし",
        staticFilters.dateEnd ? formatDisplayDate(staticFilters.dateEnd) : "指定なし",
      ]
      chips.push(`期間: ${parts.join(" 〜 ")}`)
    }
    return chips
  }, [staticFilters])

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-3">
        <p className="text-sm text-muted-foreground">キーワードはカンマ区切りで指定できます。</p>
        <div className="relative">
          <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4">
            <div className="flex items-center gap-3">
              <Search size={18} className="text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="例: 給食,子ども政策"
                className="flex-1 border-0 shadow-none focus-visible:ring-0"
              />
              <Button type="submit">検索</Button>
            </div>
          </div>
          <SearchSuggestions suggestions={suggestions} onSelect={handleSuggestionSelect} />
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span>ソート順</span>
          <Select value={sort} onValueChange={(value) => handleSortChange(value as SearchFilters["sort"])}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date_desc">最新順</SelectItem>
              <SelectItem value="date_asc">古い順</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {activeFilterChips.length > 0 && (
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            {activeFilterChips.map((chip) => (
              <span key={chip} className="rounded-full bg-muted px-3 py-1">
                {chip}
              </span>
            ))}
          </div>
        )}
      </form>

      {loading ? (
        <p className="text-sm text-muted-foreground">検索中です...</p>
      ) : results.length === 0 ? (
        <p className="text-sm text-muted-foreground">一致する記事が見つかりませんでした。</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {results.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  )
}

function normalizeWords(value: string) {
  return value
    .split(",")
    .map((word) => word.trim())
    .filter(Boolean)
    .join(",")
}

function splitWords(value: string) {
  return value ? value.split(",") : []
}

function buildSearchPath(words: string, sort: SearchFilters["sort"], filters: StaticFilters): string {
  const params = new URLSearchParams()
  if (filters.categories && filters.categories.length > 0) {
    params.set("categories", filters.categories.join(","))
  }
  if (filters.houses && filters.houses.length > 0) {
    params.set("houses", filters.houses.join(","))
  }
  if (filters.meetings && filters.meetings.length > 0) {
    params.set("meetings", filters.meetings.join(","))
  }
  if (filters.dateStart) {
    params.set("dateStart", filters.dateStart)
  }
  if (filters.dateEnd) {
    params.set("dateEnd", filters.dateEnd)
  }
  if (sort !== "date_desc") {
    params.set("sort", sort)
  }
  const query = params.toString()
  const base = `/search/${encodeURIComponent(words)}`
  return query ? `${base}?${query}` : base
}

function formatDisplayDate(value: string): string {
  const timestamp = Number(new Date(value))
  if (Number.isNaN(timestamp)) return value
  return new Date(timestamp).toLocaleDateString("ja-JP")
}
