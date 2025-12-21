import type { Article, ArticleSummary, SearchFilters } from "@shared/types/article"
import { appConfig } from "./config"

const API_BASE_URL = appConfig.apiBaseUrl

export type SearchResponse = {
  query: SearchFilters
  items: ArticleSummary[]
  total: number
}

export type SuggestionsResponse = {
  input: string
  suggestions: string[]
}

export type HeadlinesResponse = {
  items: ArticleSummary[]
  limit: number
  start: number
  end: number
  hasMore: boolean
}

type FetchHeadlinesOptions = {
  limit?: number
  start?: number
  end?: number
}

export async function fetchHeadlines(options: FetchHeadlinesOptions = {}) {
  const params = new URLSearchParams()
  if (options.limit !== undefined) {
    params.set("limit", String(options.limit))
  }
  if (options.start !== undefined) {
    params.set("start", String(options.start))
  }
  if (options.end !== undefined) {
    params.set("end", String(options.end))
  }
  const suffix = params.toString() ? `?${params.toString()}` : ""
  return apiFetch<HeadlinesResponse>(`/headlines${suffix}`)
}

export async function fetchSearch(filters: SearchFilters) {
  const params = new URLSearchParams()
  if (filters.words && filters.words.length > 0) {
    params.set("words", filters.words.join(","))
  }
  if (filters.categories && filters.categories.length > 0) {
    params.set("categories", filters.categories.join(","))
  }
  if (filters.houses && filters.houses.length > 0) {
    params.set("houses", filters.houses.join(","))
  }
  if (filters.meetings && filters.meetings.length > 0) {
    params.set("meetings", filters.meetings.join(","))
  }
  if (filters.sort) {
    params.set("sort", filters.sort)
  }
  if (filters.dateStart) {
    params.set("dateStart", filters.dateStart)
  }
  if (filters.dateEnd) {
    params.set("dateEnd", filters.dateEnd)
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

type SuggestionOptions = {
  limit?: number
  filters?: Partial<SearchFilters>
  signal?: AbortSignal
}

export async function fetchSuggestions(input: string, options: SuggestionOptions = {}) {
  const { limit = 5, filters, signal } = options
  const params = new URLSearchParams({
    input,
    limit: String(limit),
  })

  if (filters?.categories && filters.categories.length > 0) {
    params.set("categories", filters.categories.join(","))
  }
  if (filters?.houses && filters.houses.length > 0) {
    params.set("houses", filters.houses.join(","))
  }
  if (filters?.meetings && filters.meetings.length > 0) {
    params.set("meetings", filters.meetings.join(","))
  }
  if (filters?.dateStart) {
    params.set("dateStart", filters.dateStart)
  }
  if (filters?.dateEnd) {
    params.set("dateEnd", filters.dateEnd)
  }

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
