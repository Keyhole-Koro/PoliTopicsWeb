'use client'

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import type { ArticleSummary, SearchFilters } from "@shared/types/article"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArticleCard } from "@/components/articles/article-card"
import { fetchSearch, fetchSuggestions } from "@/lib/api"
import { SearchSuggestions } from "@/components/search/search-suggestions"
import { Search } from "lucide-react"

type Props = {
  initialWords: string[]
}

export function SearchClient({ initialWords }: Props) {
  const router = useRouter()
  const [words, setWords] = useState(initialWords)
  const [sort, setSort] = useState<SearchFilters["sort"]>("date_desc")
  const [results, setResults] = useState<ArticleSummary[]>([])
  const [query, setQuery] = useState(initialWords.join(","))
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetchSearch({ words, sort, limit: 24 })
      .then((response) => setResults(response.items))
      .finally(() => setLoading(false))
  }, [words, sort])

  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([])
      return
    }

    const controller = new AbortController()
    fetchSuggestions(query.trim(), 5, controller.signal)
      .then((response) => setSuggestions(response.suggestions))
      .catch(() => setSuggestions([]))

    return () => controller.abort()
  }, [query])

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const normalized = normalizeWords(query)
    setWords(splitWords(normalized))
    router.push(`/search/${encodeURIComponent(normalized)}`)
  }

  function handleSuggestionSelect(value: string) {
    const normalized = normalizeWords(value)
    setQuery(normalized)
    setWords(splitWords(normalized))
    router.push(`/search/${encodeURIComponent(normalized)}`)
    setSuggestions([])
  }

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
          <Select value={sort} onValueChange={(value) => setSort(value as SearchFilters["sort"])}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date_desc">最新順</SelectItem>
              <SelectItem value="date_asc">古い順</SelectItem>
            </SelectContent>
          </Select>
        </div>
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
