import fs from "node:fs"
import path from "node:path"
import type { Article, ArticleSummary, SearchFilters } from "@shared/types/article"
import type { ArticleRepository, HeadlinesResult } from "./articleRepository"

const ARTICLES_PATH = "../../../terraform/mock-article/articles.json"

const MOCK_ARTICLES: Article[] = loadArticlesFromFixture()
const MOCK_SUMMARIES = MOCK_ARTICLES.map(toSummary)

export class MockArticleRepository implements ArticleRepository {
  async getHeadlines(
    limit = 6,
    sort: SearchFilters["sort"] = "date_desc",
    offset = 0,
  ): Promise<HeadlinesResult> {
    console.log("MockRepo: getHeadlines called", { limit, sort, offset })
    console.log("MockRepo: Total summaries:", MOCK_SUMMARIES.length)
    const safeLimit = Number.isFinite(limit) && limit ? Math.max(1, Math.min(Number(limit), 50)) : 6
    const safeOffset = Number.isFinite(offset) && offset ? Math.max(0, Number(offset)) : 0
    const sorted = sortByDate(MOCK_SUMMARIES, sort)
    const items = sorted.slice(safeOffset, safeOffset + safeLimit)
    return { items, hasMore: sorted.length > safeOffset + safeLimit }
  }

  async searchArticles(filters: SearchFilters): Promise<ArticleSummary[]> {
    const words = (filters.words ?? []).map((word) => word.trim().toLowerCase()).filter(Boolean)
    const initial = words.length > 0 ? MOCK_SUMMARIES.filter((item) => matchesWords(item, words)) : MOCK_SUMMARIES
    return filterArticles(initial, {
      categories: filters.categories,
      houses: filters.houses,
      meetings: filters.meetings,
      dateStart: filters.dateStart,
      dateEnd: filters.dateEnd,
    })
  }

  async getArticle(id: string): Promise<Article | undefined> {
    return MOCK_ARTICLES.find((article) => article.id === id)
  }

  async getSuggestions(
    input: string,
    limit = 5,
    filters: Pick<SearchFilters, "categories" | "houses" | "meetings" | "dateStart" | "dateEnd"> = {},
  ): Promise<string[]> {
    if (!input.trim()) return []
    const normalized = input.toLowerCase()
    const filtered = filterArticles(MOCK_SUMMARIES, filters)
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

function loadArticlesFromFixture(): Article[] {
  try {
    const raw = fs.readFileSync(ARTICLES_PATH, "utf-8")
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
