import fs from "node:fs"
import path from "node:path"
import type { Article, ArticleSummary, SearchFilters } from "@shared/types/article"
import type { ArticleRepository, HeadlinesResult } from "./articleRepository"

const ACTIVE_ENV = (process.env.ACTIVE_ENVIRONMENT ?? "").toLowerCase()
const ALLOW_MOCK_FIXTURE = ACTIVE_ENV === "local"

let cachedArticles: Article[] | null = null
let cachedSummaries: ArticleSummary[] | null = null

export class MockArticleRepository implements ArticleRepository {
  async getHeadlines(
    limit = 6,
    sort: SearchFilters["sort"] = "date_desc",
    offset = 0,
  ): Promise<HeadlinesResult> {
    const summaries = getMockSummaries()
    console.log("MockRepo: getHeadlines called", { limit, sort, offset, total: summaries.length })
    const safeLimit = Number.isFinite(limit) && limit ? Math.max(1, Math.min(Number(limit), 50)) : 6
    const safeOffset = Number.isFinite(offset) && offset ? Math.max(0, Number(offset)) : 0
    const sorted = sortByDate(summaries, sort)
    const items = sorted.slice(safeOffset, safeOffset + safeLimit)
    return { items, hasMore: sorted.length > safeOffset + safeLimit }
  }

  async searchArticles(filters: SearchFilters): Promise<ArticleSummary[]> {
    const summaries = getMockSummaries()
    const words = (filters.words ?? []).map((word) => word.trim().toLowerCase()).filter(Boolean)
    const initial = words.length > 0 ? summaries.filter((item) => matchesWords(item, words)) : summaries
    return filterArticles(initial, {
      categories: filters.categories,
      houses: filters.houses,
      meetings: filters.meetings,
      dateStart: filters.dateStart,
      dateEnd: filters.dateEnd,
    })
  }

  async getArticle(id: string): Promise<Article | undefined> {
    const articles = getMockArticles()
    return articles.find((article) => article.id === id)
  }

  async getSuggestions(
    input: string,
    limit = 5,
    filters: Pick<SearchFilters, "categories" | "houses" | "meetings" | "dateStart" | "dateEnd"> = {},
  ): Promise<string[]> {
    if (!input.trim()) return []
    const normalized = input.toLowerCase()
    const summaries = getMockSummaries()
    const filtered = filterArticles(summaries, filters)
    const suggestions = new Set<string>()

    for (const article of filtered) {
      if (article.title.toLowerCase().includes(normalized)) {
        suggestions.add(article.title)
      }
      article.keywords.forEach((keyword) => {
        if (keyword.keyword.toLowerCase().includes(normalized)) {
          suggestions.add(keyword.keyword)
        }
      })
    }

    return Array.from(suggestions).slice(0, limit)
  }
}

function toSummary(article: Article): ArticleSummary {
  return {
    id: article.id,
    title: article.title,
    description: article.description,
    date: article.date,
    month: article.month,
    categories: article.categories ?? [],
    participants: article.participants ?? [],
    keywords: article.keywords ?? [],
    imageKind: article.imageKind,
    session: article.session,
    nameOfHouse: article.nameOfHouse,
    nameOfMeeting: article.nameOfMeeting,
    assetUrl: article.assetUrl,
  }
}

function sortByDate(items: ArticleSummary[], sort: SearchFilters["sort"]): ArticleSummary[] {
  const sorted = [...items].sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
  return sort === "date_asc" ? sorted.reverse() : sorted
}

function matchesWords(article: ArticleSummary, words: string[]): boolean {
  const haystack = [
    article.title,
    article.description,
    article.nameOfHouse,
    article.nameOfMeeting,
    ...article.categories,
    ...article.keywords.map((keyword) => keyword.keyword),
    ...article.participants.map((participant) => participant.name),
  ]
    .filter(Boolean)
    .map((value) => value.toLowerCase())

  return words.every((word) => haystack.some((value) => value.includes(word)))
}

function filterArticles(
  articles: ArticleSummary[],
  filters: Pick<SearchFilters, "categories" | "houses" | "meetings" | "dateStart" | "dateEnd">,
): ArticleSummary[] {
  const categories = (filters.categories ?? []).map((category) => category.toLowerCase())
  const houses = filters.houses ?? []
  const meetings = filters.meetings ?? []
  const startTime = normalizeBoundary(filters.dateStart, "start")
  const endTime = normalizeBoundary(filters.dateEnd, "end")

  return articles.filter((article) => {
    if (
      categories.length > 0 &&
      !article.categories.some((category) => categories.includes(category.toLowerCase()))
    ) {
      return false
    }
    if (houses.length > 0 && !houses.includes(article.nameOfHouse)) {
      return false
    }
    if (meetings.length > 0 && !meetings.includes(article.nameOfMeeting)) {
      return false
    }

    if (!startTime && !endTime) {
      return true
    }

    const articleDate = Number(new Date(article.date))
    if (Number.isNaN(articleDate)) {
      return false
    }

    if (startTime && articleDate < startTime) {
      return false
    }

    if (endTime && articleDate > endTime) {
      return false
    }

    return true
  })
}

function normalizeBoundary(value: string | undefined, type: "start" | "end"): number | undefined {
  if (!value) return undefined
  const timestamp = Number(new Date(value))
  if (Number.isNaN(timestamp)) return undefined

  const date = new Date(timestamp)
  if (type === "start") {
    date.setHours(0, 0, 0, 0)
  } else {
    date.setHours(23, 59, 59, 999)
  }
  return date.getTime()
}

function getMockArticles(): Article[] {
  if (!ALLOW_MOCK_FIXTURE) {
    if (cachedArticles === null) {
      console.warn("MockRepo: mock fixture disabled for environment", ACTIVE_ENV || "<unknown>")
      cachedArticles = []
    }
    return cachedArticles
  }

  if (cachedArticles !== null) return cachedArticles

  cachedArticles = loadArticlesFromFixture()
  return cachedArticles
}

function getMockSummaries(): ArticleSummary[] {
  if (cachedSummaries !== null) return cachedSummaries
  const articles = getMockArticles()
  cachedSummaries = articles.map(toSummary)
  return cachedSummaries
}

function resolveArticlesPath(): string {
  const candidates = [
    process.env.MOCK_ARTICLES_PATH,
    path.resolve(__dirname, "../../shared/mock/articles.json"),
    path.resolve(__dirname, "../../../terraform/mock-article/articles.json"),
  ].filter(Boolean) as string[]
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate
  }
  return candidates[0] ?? "../../../terraform/mock-article/articles.json"
}

function loadArticlesFromFixture(): Article[] {
  const articlesPath = resolveArticlesPath()
  try {
    const raw = fs.readFileSync(articlesPath, "utf-8")
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      throw new Error("Fixture is not an array")
    }
    return parsed.map((item, index) => {
      assertFixtureItem(item, index)
      const id = String(item.id ?? "").trim()
      const assetUrl = String(item.assetUrl ?? item.asset_url ?? "").trim()
      if (!assetUrl) {
        throw new Error(`Fixture item ${id || index} missing assetUrl`)
      }
      return {
        ...item,
        id,
        keywords: item.keywords ?? [],
        participants: item.participants ?? [],
        categories: item.categories ?? [],
        middle_summary: item.middle_summary ?? [],
        dialogs: item.dialogs ?? [],
        terms: item.terms ?? [],
        assetUrl,
      }
    })
  } catch (error) {
    console.error("MockRepo: failed to load mock articles fixture:", error)
    return []
  }
}

function assertFixtureItem(item: any, index: number) {
  if (!item || typeof item !== "object") {
    throw new Error(`Fixture item at index ${index} is not an object`)
  }
  if (!item.id) throw new Error(`Fixture item at index ${index} missing id`)
  if (!item.title) throw new Error(`Fixture item at index ${index} missing title`)
  if (!item.description) throw new Error(`Fixture item at index ${index} missing description`)
  if (!item.date) throw new Error(`Fixture item at index ${index} missing date`)
  if (!item.month) throw new Error(`Fixture item at index ${index} missing month`)
  if (!item.summary) throw new Error(`Fixture item at index ${index} missing summary`)
}
