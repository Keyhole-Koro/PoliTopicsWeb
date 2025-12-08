import { createRepository, toList, toNumber } from "./app"
import type { SearchFilters } from "@shared/types/article"

type ApiGatewayEvent = {
  rawPath?: string
  queryStringParameters?: Record<string, string | undefined> | null
  pathParameters?: Record<string, string | undefined> | null
  requestContext: {
    stage?: string
    http?: {
      method?: string
      path?: string
    }
  }
}

type ApiGatewayResult = {
  statusCode: number
  headers?: Record<string, string>
  body?: string
  isBase64Encoded?: boolean
}

const repository = createRepository()

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
} as const

export async function handler(event: ApiGatewayEvent): Promise<ApiGatewayResult> {
  const method = event.requestContext.http?.method?.toUpperCase() ?? "GET"

  if (method === "OPTIONS") {
    return {
      statusCode: 204,
      headers: corsHeaders,
    }
  }

  if (method !== "GET") {
    return notFound()
  }

  const path = normalizePath(event.rawPath ?? event.requestContext.http?.path, event.requestContext.stage)

  try {
    if (path === "/healthz") {
      return jsonResponse(200, { status: "ok" })
    }

    if (path === "/headlines") {
      const limit = toNumber(event.queryStringParameters?.limit, 6)
      const items = await repository.getHeadlines(limit)
      return jsonResponse(200, { items, limit })
    }

    if (path === "/search") {
      const filters: SearchFilters = {
        words: toList(event.queryStringParameters?.words),
        categories: toList(event.queryStringParameters?.categories),
        sort: (event.queryStringParameters?.sort as SearchFilters["sort"]) ?? "date_desc",
        limit: toNumber(event.queryStringParameters?.limit, 20),
      }
      const items = await repository.searchArticles(filters)
      return jsonResponse(200, { query: filters, items, total: items.length })
    }

    if (path === "/search/suggest") {
      const input = event.queryStringParameters?.input ?? ""
      const limit = toNumber(event.queryStringParameters?.limit, 5)
      const suggestions = await repository.getSuggestions(input, limit)
      return jsonResponse(200, { input, suggestions })
    }

    if (path.startsWith("/article/")) {
      const id = getArticleId(path, event.pathParameters?.id)
      if (!id) {
        return jsonResponse(400, { message: "Invalid article ID" })
      }

      const article = await repository.getArticle(id)
      if (!article) {
        return jsonResponse(404, { message: "Article not found" })
      }

      return jsonResponse(200, { article })
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Lambda handler error", error)
    return jsonResponse(500, { message: "Unexpected error" })
  }

  return notFound()
}

function normalizePath(rawPath?: string, stage?: string): string {
  if (!rawPath) {
    return "/"
  }

  let normalized = rawPath.startsWith("/") ? rawPath : `/${rawPath}`

  if (stage && stage !== "$default") {
    const stagePrefix = `/${stage}`
    if (normalized.startsWith(stagePrefix)) {
      normalized = normalized.slice(stagePrefix.length) || "/"
    }
  }

  if (normalized.length > 1 && normalized.endsWith("/")) {
    normalized = normalized.slice(0, -1)
  }

  return normalized
}

function getArticleId(path: string, parameterId?: string | null): string | undefined {
  if (parameterId) {
    return decodeURIComponent(parameterId)
  }

  const segments = path.split("/")
  if (segments.length >= 3) {
    return decodeURIComponent(segments[2] ?? "")
  }
  return undefined
}

function jsonResponse(statusCode: number, payload: unknown): ApiGatewayResult {
  return {
    statusCode,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  }
}

function notFound(): ApiGatewayResult {
  return jsonResponse(404, { message: "Not Found" })
}
