import fp from "fastify-plugin"
import type { FastifyInstance, FastifyPluginAsync } from "fastify"
import type { Article, ArticleSummary, SearchFilters } from "@shared/types/article"

type HeadlinesQuery = { limit?: string; start?: string; end?: string }
type HeadlinesResponse = { items: ArticleSummary[]; limit: number; start: number; end: number; hasMore: boolean }

type SearchQuery = {
  words?: string
  categories?: string
  houses?: string
  meetings?: string
  dateStart?: string
  dateEnd?: string
  sort?: SearchFilters["sort"]
  limit?: string
}
type SearchResponse = { query: SearchFilters; items: ArticleSummary[]; total: number }

type SuggestQuery = {
  input?: string
  limit?: string
  categories?: string
  houses?: string
  meetings?: string
  dateStart?: string
  dateEnd?: string
}
type SuggestResponse = { input: string; suggestions: string[] }

type ArticleParams = { id: string }
type ArticleResponse = { article: Article } | { message: string }

const articlesRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.get("/healthz", async () => ({ status: "ok" }))

  fastify.get<{ Querystring: HeadlinesQuery; Reply: HeadlinesResponse }>("/headlines", async (request) => {
    const start = Math.max(0, Math.trunc(toNumber(request.query.start, 0)))
    let limit = Math.min(50, Math.max(1, Math.trunc(toNumber(request.query.limit, 6))))

    if (request.query.end !== undefined) {
      const requestedEnd = Math.max(start, Math.trunc(toNumber(request.query.end, start + limit)))
      limit = Math.min(50, Math.max(1, requestedEnd - start))
    }

    const { items, hasMore } = await fastify.articleRepository.getHeadlines(limit, "date_desc", start)
    const end = start + items.length

    return { items, limit, start, end, hasMore }
  })

  fastify.get<{ Querystring: SearchQuery; Reply: SearchResponse }>("/search", async (request) => {
    const filters: SearchFilters = {
      words: toList(request.query.words),
      categories: toList(request.query.categories),
      houses: toList(request.query.houses),
      meetings: toList(request.query.meetings),
      dateStart: sanitizeDate(request.query.dateStart),
      dateEnd: sanitizeDate(request.query.dateEnd),
      sort: (request.query.sort as SearchFilters["sort"]) ?? "date_desc",
      limit: toNumber(request.query.limit, 20),
    }

    const items = await fastify.articleRepository.searchArticles(filters)
    return { query: filters, items, total: items.length }
  })

  fastify.get<{ Querystring: SuggestQuery; Reply: SuggestResponse }>("/search/suggest", async (request) => {
    const input = request.query.input ?? ""
    const limit = toNumber(request.query.limit, 5)
    const filters: Pick<SearchFilters, "categories" | "houses" | "meetings" | "dateStart" | "dateEnd"> = {
      categories: toList(request.query.categories),
      houses: toList(request.query.houses),
      meetings: toList(request.query.meetings),
      dateStart: sanitizeDate(request.query.dateStart),
      dateEnd: sanitizeDate(request.query.dateEnd),
    }
    const suggestions = await fastify.articleRepository.getSuggestions(input, limit, filters)
    return { input, suggestions }
  })

  fastify.get<{ Params: ArticleParams; Reply: ArticleResponse }>("/article/:id", async (request, reply) => {
    const article = await fastify.articleRepository.getArticle(request.params.id)
    if (!article) {
      reply.status(404)
      return { message: "Article not found" }
    }

    return { article }
  })
}

function toList(value?: string | null): string[] {
  if (!value) return []
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
}

function toNumber(value: string | undefined | null, fallback: number): number {
  if (!value) return fallback
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function sanitizeDate(value?: string | null): string | undefined {
  if (!value) return undefined
  const timestamp = Date.parse(value)
  if (Number.isNaN(timestamp)) {
    return undefined
  }
  return new Date(timestamp).toISOString()
}

export default fp(articlesRoutes, {
  name: "articles-routes",
})
