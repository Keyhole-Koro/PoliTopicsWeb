import fp from "fastify-plugin"
import type { FastifyPluginAsync } from "fastify"
import type { ZodTypeProvider } from "fastify-type-provider-zod"
import { z } from "zod"
import type { SearchFilters } from "@shared/types/article"
import {
  HeadlinesQuerySchema,
  HeadlinesResponseSchema,
  SearchQuerySchema,
  SearchResponseSchema,
  SuggestQuerySchema,
  SuggestResponseSchema,
  ArticleParamsSchema,
  ArticleResponseSchema,
} from "../schemas/articles"

const articlesRoutes: FastifyPluginAsync = async (fastify) => {
  const app = fastify.withTypeProvider<ZodTypeProvider>()

  app.get("/healthz", async () => ({ status: "ok" }))

  app.get(
    "/headlines",
    {
      schema: {
        querystring: HeadlinesQuerySchema,
        response: {
          200: HeadlinesResponseSchema,
        },
      },
    },
    async (request) => {
      const start = Math.max(0, Math.trunc(toNumber(request.query.start, 0)))
      let limit = Math.min(50, Math.max(1, Math.trunc(toNumber(request.query.limit, 6))))

      if (request.query.end !== undefined) {
        const requestedEnd = Math.max(start, Math.trunc(toNumber(request.query.end, start + limit)))
        limit = Math.min(50, Math.max(1, requestedEnd - start))
      }

      const { items, hasMore } = await fastify.articleRepository.getHeadlines(limit, "date_desc", start)
      const end = start + items.length

      return { items, limit, start, end, hasMore }
    }
  )

  app.get(
    "/search",
    {
      schema: {
        querystring: SearchQuerySchema,
        response: {
          200: SearchResponseSchema,
        },
      },
    },
    async (request) => {
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
    }
  )

  app.get(
    "/search/suggest",
    {
      schema: {
        querystring: SuggestQuerySchema,
        response: {
          200: SuggestResponseSchema,
        },
      },
    },
    async (request) => {
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
    }
  )

  app.get(
    "/article/:id",
    {
      schema: {
        params: ArticleParamsSchema,
        response: {
          200: ArticleResponseSchema,
          404: z.object({ message: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const started = process.hrtime.bigint()
      let statusCode = 200
      try {
        const article = await fastify.articleRepository.getArticle(request.params.id)
        if (!article) {
          statusCode = 404
          reply.status(statusCode)
          return { message: "Article not found" }
        }

        return { article }
      } catch (error) {
        statusCode = reply.statusCode || 500
        throw error
      } finally {
        const durationMs = Number(process.hrtime.bigint() - started) / 1_000_000
        console.log(`[article] id=${request.params.id} status=${statusCode} duration_ms=${durationMs.toFixed(2)}`)
      }
    }
  )
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
