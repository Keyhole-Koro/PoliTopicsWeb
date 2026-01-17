import type { Article, ArticleSummary, SearchFilters } from "@shared/types/article"
import { appConfig } from "./config"
import { debugLog } from "./logger"

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
  const canUseInjectedCache =
    (options.start === undefined || options.start === 0) && options.end === undefined

  if (canUseInjectedCache && typeof window !== "undefined") {
    const script = document.getElementById("headlines-cache")
    if (script && script.textContent && script.textContent !== '"__HEADLINES_CACHE__"') {
      try {
        const injectedData = JSON.parse(script.textContent) as HeadlinesResponse
        if (injectedData && Array.isArray(injectedData.items)) {
          if (injectedData.items.length === 0) {
            debugLog(`[api] Injected cache empty; falling back to API`)
          } else if (options.limit === undefined) {
            debugLog(`[api] Injected cache hit`)
            return injectedData
          } else if (injectedData.items.length >= options.limit) {
            debugLog(`[api] Injected cache hit (sliced)`)
            const items = injectedData.items.slice(0, options.limit)
            return {
              ...injectedData,
              items,
              limit: options.limit,
              start: 0,
              end: items.length,
              hasMore: injectedData.hasMore || injectedData.items.length > items.length,
            }
          } else {
            debugLog(`[api] Injected cache too small; falling back to API`)
          }
        }
      } catch (e) {
        debugLog(`[api] Error parsing injected cache`, e)
      }
    }
  }

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
  const url = `${API_BASE_URL}${path}`
  debugLog(`[api] Fetching: ${url}`)
  try {
    const response = await fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init.headers ?? {}),
      },
    })

    if (!response.ok) {
      console.error(`[api] Request failed: ${response.status} ${response.statusText}`)
      throw new Error(`API request failed with status ${response.status}`)
    }

    const data = (await response.json()) as T
    debugLog(`[api] Success: ${url}`, data)
    return data
  } catch (error) {
    console.error(`[api] Network error for ${url}:`, error)
    throw error
  }
}
