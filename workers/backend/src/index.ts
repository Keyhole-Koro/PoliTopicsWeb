import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Env } from "./types/env";
import { createArticleRepository, type ArticleRepository } from "./repositories/articleRepository";
import type { SearchFilters } from "./types/article";
import { resolveCorsOrigin } from "./config";

type Bindings = Env;

type Variables = {
  articleRepository: ArticleRepository;
};

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// CORS middleware
// GitHub Actions health checks don't send Origin header (not a browser), so CORS doesn't apply
app.use(
  "*",
  cors({
    origin: (origin, c) => {
      return resolveCorsOrigin(origin, c.env);
    },
    allowMethods: ["GET", "OPTIONS"],
    allowHeaders: ["Content-Type"],
  })
);

// Initialize repository middleware
app.use("*", async (c, next) => {
  const repo = createArticleRepository(c.env);
  c.set("articleRepository", repo);
  await next();
});

// Health check
app.get("/healthz", (c) => c.json({ status: "ok" }));

// Headlines endpoint
app.get("/headlines", async (c) => {
  const query = c.req.query();
  const start = Math.max(0, Math.trunc(toNumber(query.start, 0)));
  let limit = Math.min(50, Math.max(1, Math.trunc(toNumber(query.limit, 6))));

  if (query.end !== undefined) {
    const requestedEnd = Math.max(start, Math.trunc(toNumber(query.end, start + limit)));
    limit = Math.min(50, Math.max(1, requestedEnd - start));
  }

  console.log(`[WorkerBackend] /headlines req: start=${start}, limit=${limit}, end=${query.end}`);
  const { items, hasMore } = await c.get("articleRepository").getHeadlines(limit, "date_desc", start);
  const end = start + items.length;
  console.log(`[WorkerBackend] /headlines res: items=${items.length}, hasMore=${hasMore}`);

  return c.json({ items, limit, start, end, hasMore });
});

// Search endpoint
app.get("/search", async (c) => {
  const query = c.req.query();
  const filters: SearchFilters = {
    words: toList(query.words),
    categories: toList(query.categories),
    houses: toList(query.houses),
    meetings: toList(query.meetings),
    dateStart: sanitizeDate(query.dateStart),
    dateEnd: sanitizeDate(query.dateEnd),
    sort: (query.sort as SearchFilters["sort"]) ?? "date_desc",
    limit: toNumber(query.limit, 20),
  };

  console.log(`[WorkerBackend] /search req: filters=${JSON.stringify(filters)}`);
  const items = await c.get("articleRepository").searchArticles(filters);
  console.log(`[WorkerBackend] /search res: found=${items.length}`);

  return c.json({ query: filters, items, total: items.length });
});

// Search suggestions endpoint
app.get("/search/suggest", async (c) => {
  const query = c.req.query();
  const input = query.input ?? "";
  const limit = toNumber(query.limit, 5);
  const filters: Pick<SearchFilters, "categories" | "houses" | "meetings" | "dateStart" | "dateEnd"> = {
    categories: toList(query.categories),
    houses: toList(query.houses),
    meetings: toList(query.meetings),
    dateStart: sanitizeDate(query.dateStart),
    dateEnd: sanitizeDate(query.dateEnd),
  };

  console.log(`[WorkerBackend] /search/suggest req: input="${input}", limit=${limit}`);
  const suggestions = await c.get("articleRepository").getSuggestions(input, limit, filters);
  console.log(`[WorkerBackend] /search/suggest res: count=${suggestions.length}`);

  return c.json({ input, suggestions });
});

// Get article by ID
app.get("/article/:id", async (c) => {
  const id = c.req.param("id");
  const started = Date.now();
  let statusCode: 200 | 404 = 200;

  try {
    console.log(`[WorkerBackend] /article/:id req: id=${id}`);
    const article = await c.get("articleRepository").getArticle(id);

    if (!article) {
      statusCode = 404;
      return c.json({ message: "Article not found" }, 404);
    }

    return c.json({ article });
  } finally {
    const durationMs = Date.now() - started;
    console.log(`[WorkerBackend] /article/:id res: id=${id} status=${statusCode} duration_ms=${durationMs}`);
  }
});

// Not found handler
app.notFound((c) => c.json({ message: "Not Found" }, 404));

// Error handler
app.onError((err, c) => {
  console.error("Unhandled error:", err);
  return c.json({ message: "Internal error" }, 500);
});

// Helper functions
function toList(value?: string | null): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function toNumber(value: string | undefined | null, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return parsed;
}

function sanitizeDate(value?: string | null): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const timestamp = Date.parse(trimmed);
  if (Number.isNaN(timestamp)) return undefined;
  return trimmed;
}

export default app;
