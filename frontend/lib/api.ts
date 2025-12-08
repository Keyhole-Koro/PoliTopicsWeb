import type { Article, ArticleSummary, SearchFilters } from "@shared/types/article"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000"

export type SearchResponse = {
  query: SearchFilters
  items: ArticleSummary[]
  total: number
}

export type SuggestionsResponse = {
  input: string
  suggestions: string[]
}

export async function fetchHeadlines(limit = 6) {
  return apiFetch<{ items: ArticleSummary[] }>(`/headlines?limit=${limit}`)
}

export async function fetchSearch(filters: SearchFilters) {
  const params = new URLSearchParams()
  if (filters.words && filters.words.length > 0) {
    params.set("words", filters.words.join(","))
  }
  if (filters.categories && filters.categories.length > 0) {
    params.set("categories", filters.categories.join(","))
  }
  if (filters.sort) {
    params.set("sort", filters.sort)
  }
  if (filters.limit) {
    params.set("limit", String(filters.limit))
  }

  const queryString = params.toString()
  const suffix = queryString ? `?${queryString}` : ""
  return apiFetch<SearchResponse>(`/search${suffix}`)
}

export async function fetchArticle(id: string) {
  return apiFetch<{ article: Article }>(`/article/${encodeURIComponent(id)}`)
}

export async function fetchSuggestions(input: string, limit = 5, signal?: AbortSignal) {
  const params = new URLSearchParams({
    input,
    limit: String(limit),
  })

  return apiFetch<SuggestionsResponse>(`/search/suggest?${params.toString()}`, { signal })
}

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  })

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`)
  }

  return (await response.json()) as T
}
