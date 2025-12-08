import rawArticles from "./mock/articles.json"
import type { Article, ArticleSummary, SearchFilters } from "./types/article"

const articles: Article[] = rawArticles as Article[]
const articleMap = new Map<string, Article>(articles.map((article) => [article.id, article]))

const sortedByDate = [...articles].sort(
  (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
)

export function getTopArticles(limit = 6): ArticleSummary[] {
  return sortedByDate.slice(0, limit).map(toSummary)
}

export function getArticleById(id: string): Article | undefined {
  return articleMap.get(id)
}

export function searchArticles(filters: SearchFilters = {}): ArticleSummary[] {
  const { words = [], categories = [], sort = "date_desc", limit = 20 } = filters
  const normalizedWords = words.filter(Boolean).map((word) => word.toLowerCase())
  const normalizedCategories = categories.map((category) => category.toLowerCase())

  const filtered = sortedByDate.filter((article) => {
    const matchesWords =
      normalizedWords.length === 0 ||
      normalizedWords.some(
        (word) =>
          article.title.toLowerCase().includes(word) ||
          article.description.toLowerCase().includes(word) ||
          article.keywords.some((keyword) => keyword.toLowerCase().includes(word)),
      )

    const matchesCategories =
      normalizedCategories.length === 0 ||
      article.categories.some((category) => normalizedCategories.includes(category.toLowerCase()))

    return matchesWords && matchesCategories
  })

  const ordered = sort === "date_asc" ? filtered.slice().reverse() : filtered

  return ordered.slice(0, limit).map(toSummary)
}

function toSummary(article: Article): ArticleSummary {
  const {
    id,
    title,
    description,
    date,
    month,
    categories,
    keywords,
    participants,
    imageKind,
    session,
    nameOfHouse,
    nameOfMeeting,
  } = article

  return {
    id,
    title,
    description,
    date,
    month,
    categories,
    keywords,
    participants,
    imageKind,
    session,
    nameOfHouse,
    nameOfMeeting,
  }
}

export { articles }
