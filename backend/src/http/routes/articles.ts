import fp from "fastify-plugin"
import type { FastifyInstance, FastifyPluginAsync } from "fastify"
import type { Article, ArticleSummary, SearchFilters } from "@shared/types/article"

type HeadlinesQuery = { limit?: string }
type HeadlinesResponse = { items: ArticleSummary[]; limit: number }

type SearchQuery = {
  words?: string
  categories?: string
  sort?: SearchFilters["sort"]
  limit?: string
}
type SearchResponse = { query: SearchFilters; items: ArticleSummary[]; total: number }

type SuggestQuery = {
  input?: string
  limit?: string
}
type SuggestResponse = { input: string; suggestions: string[] }

type ArticleParams = { id: string }
type ArticleResponse = { article: Article } | { message: string }

const articlesRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.get("/healthz", async () => ({ status: "ok" }))

  fastify.get<{ Querystring: HeadlinesQuery; Reply: HeadlinesResponse }>("/headlines", async (request) => {
    const limit = toNumber(request.query.limit, 6)
    const items = await fastify.articleRepository.getHeadlines(limit)
    return { items, limit }
  })

  fastify.get<{ Querystring: SearchQuery; Reply: SearchResponse }>("/search", async (request) => {
    const filters: SearchFilters = {
      words: toList(request.query.words),
      categories: toList(request.query.categories),
      sort: (request.query.sort as SearchFilters["sort"]) ?? "date_desc",
      limit: toNumber(request.query.limit, 20),
    }

    const items = await fastify.articleRepository.searchArticles(filters)
    return { query: filters, items, total: items.length }
  })

  fastify.get<{ Querystring: SuggestQuery; Reply: SuggestResponse }>("/search/suggest", async (request) => {
    const input = request.query.input ?? ""
    const limit = toNumber(request.query.limit, 5)
    const suggestions = await fastify.articleRepository.getSuggestions(input, limit)
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

export default fp(articlesRoutes, {
  name: "articles-routes",
})
