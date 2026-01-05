import type { Article, ArticleSummary, SearchFilters } from "@shared/types/article"
import type { ArticleRepository, HeadlinesResult } from "./articleRepository"

const MOCK_ARTICLES: Article[] = [
  {
    id: "ISSUE-1001",
    title: "School Lunch Policy Review",
    description: "Committee discussion on school lunch funding and nutrition standards.",
    date: "2025-01-10",
    month: "2025-01",
    categories: ["Education"],
    participants: [
      { name: "Taro Yamada", position: "Member", summary: "Asked about subsidy allocation." },
    ],
    keywords: [{ keyword: "school lunch", priority: "high" }],
    imageKind: "会議録",
    session: 213,
    nameOfHouse: "House of Representatives",
    nameOfMeeting: "Education Committee",
    summary: { based_on_orders: [1], summary: "Reviewed funding and nutrition standards." },
    soft_language_summary: { based_on_orders: [1], summary: "Talked about better lunches." },
    middle_summary: [{ based_on_orders: [1], summary: "Focused on budget and safety." }],
    dialogs: [
      {
        order: 1,
        summary: "Asked about budget safeguards.",
        soft_language: "Asked how the budget is protected.",
        reaction: "質問",
        original_text: "What measures protect the lunch budget?",
        speaker: "Taro Yamada",
        position: "Member",
      },
    ],
    terms: [{ term: "Subsidy", definition: "Public funding that offsets costs." }],
  },
  {
    id: "ISSUE-1002",
    title: "Child Welfare Budget Update",
    description: "Updates on child welfare grants and regional support.",
    date: "2025-01-05",
    month: "2025-01",
    categories: ["Child welfare"],
    participants: [
      { name: "Hanako Sato", position: "Minister", summary: "Provided grant timeline." },
    ],
    keywords: [{ keyword: "grants", priority: "medium" }],
    imageKind: "会議録",
    session: 213,
    nameOfHouse: "House of Councillors",
    nameOfMeeting: "Health Committee",
    summary: { based_on_orders: [2], summary: "Outlined grant rollout plans." },
    soft_language_summary: { based_on_orders: [2], summary: "Explained how grants will be shared." },
    middle_summary: [{ based_on_orders: [2], summary: "Discussed regional distribution." }],
    dialogs: [
      {
        order: 2,
        summary: "Outlined regional rollout schedule.",
        soft_language: "Explained when regions get support.",
        reaction: "回答",
        original_text: "We will roll out support region by region.",
        speaker: "Hanako Sato",
        position: "Minister",
      },
    ],
    terms: [{ term: "Grant", definition: "Funding distributed to local programs." }],
  },
]

const MOCK_SUMMARIES = MOCK_ARTICLES.map(toSummary)

export class MockArticleRepository implements ArticleRepository {
  async getHeadlines(
    limit = 6,
    sort: SearchFilters["sort"] = "date_desc",
    offset = 0,
  ): Promise<HeadlinesResult> {
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
