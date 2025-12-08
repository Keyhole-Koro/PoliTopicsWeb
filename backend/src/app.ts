import express from "express"
import cors from "cors"
import { appConfig } from "./config"
import { MockArticleRepository } from "./repositories/mockArticleRepository"
import { DynamoArticleRepository } from "./repositories/dynamoArticleRepository"
import type { ArticleRepository } from "./repositories/articleRepository"
import type { SearchFilters } from "@shared/types/article"

export function createRepository(): ArticleRepository {
  if (appConfig.dataMode === "dynamo") {
    return new DynamoArticleRepository({
      tableName: appConfig.tableName,
      region: appConfig.region,
      endpoint: appConfig.localstackUrl,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "test",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "test",
      },
    })
  }

  return new MockArticleRepository()
}

export function createApp() {
  const repository = createRepository()
  const app = express()

  app.use(cors())
  app.use(express.json())

  app.get("/healthz", (_req, res) => {
    res.json({ status: "ok" })
  })

  app.get("/headlines", async (req, res) => {
    const limit = toNumber(req.query.limit?.toString(), 6)
    const items = await repository.getHeadlines(limit)
    res.json({ items, limit })
  })

  app.get("/search", async (req, res) => {
    const filters: SearchFilters = {
      words: toList(req.query.words?.toString()),
      categories: toList(req.query.categories?.toString()),
      sort: (req.query.sort as SearchFilters["sort"]) ?? "date_desc",
      limit: toNumber(req.query.limit?.toString(), 20),
    }

    const items = await repository.searchArticles(filters)
    res.json({ query: filters, items, total: items.length })
  })

  app.get("/search/suggest", async (req, res) => {
    const input = (req.query.input as string) ?? ""
    const limit = toNumber(req.query.limit?.toString(), 5)
    const suggestions = await repository.getSuggestions(input, limit)
    res.json({ input, suggestions })
  })

  app.get("/article/:id", async (req, res) => {
    const article = await repository.getArticle(req.params.id)
    if (!article) {
      res.status(404).json({ message: "Article not found" })
      return
    }

    res.json({ article })
  })

  app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    // eslint-disable-next-line no-console
    console.error(error)
    res.status(500).json({ message: "Unexpected error" })
  })

  return app
}

export function toList(value?: string): string[] {
  if (!value) return []
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
}

export function toNumber(value: string | undefined, fallback: number): number {
  if (!value) return fallback
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}
