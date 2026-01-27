import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { Env } from "../types/env";
import type {
  Article,
  ArticleImageKind,
  ArticleSummary,
  Dialog,
  Keyword,
  MiddleSummary,
  Participant,
  SearchFilters,
  SoftLanguageSummary,
  Summary,
  Term,
} from "../types/article";
import { resolveAssetBaseUrl } from "../config";
import type { ArticleRepository, HeadlinesResult } from "./articleRepository";

const DEFAULT_ASSET_BUCKET = "politopics-articles-local";

type SeedArticle = {
  id: string;
  title?: string;
  description?: string;
  date?: string;
  month?: string;
  categories?: string[];
  keywords?: Keyword[];
  participants?: Participant[];
  imageKind?: ArticleImageKind;
  session?: number;
  nameOfHouse?: string;
  nameOfMeeting?: string;
  terms?: Term[];
  summary?: Summary;
  soft_language_summary?: SoftLanguageSummary;
  middle_summary?: MiddleSummary[];
  key_points?: string[];
  dialogs?: Dialog[];
};

const SEED_PATH = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../../terraform/seed/articles.json"
);

let cachedArticles: SeedArticle[] | null = null;

function loadSeedArticles(): SeedArticle[] {
  if (cachedArticles) {
    return cachedArticles;
  }

  const raw = fs.readFileSync(SEED_PATH, "utf-8");
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error("Seed articles must be an array");
  }
  cachedArticles = parsed as SeedArticle[];
  return cachedArticles;
}

export class MockArticleRepository implements ArticleRepository {
  private readonly articles: Article[];
  private readonly assetBaseUrl?: string;
  private readonly assetBucket: string;

  constructor(env: Env, seedArticles: SeedArticle[]) {
    this.assetBaseUrl = resolveAssetBaseUrl(env);
    this.assetBucket = env.S3_ASSET_BUCKET || DEFAULT_ASSET_BUCKET;
    this.articles = seedArticles.map((article) => this.normalizeArticle(article));
  }

  async getHeadlines(
    limit = 6,
    sort: SearchFilters["sort"] = "date_desc",
    offset = 0
  ): Promise<HeadlinesResult> {
    const safeLimit = Number.isFinite(limit) && limit ? Math.max(1, Math.min(Number(limit), 50)) : 6;
    const safeOffset = Number.isFinite(offset) && offset ? Math.max(0, Number(offset)) : 0;
    const queryLimit = Math.min(safeLimit + safeOffset, 100);

    const sorted = this.sortByDate(this.articles, sort);
    const sliced = sorted.slice(safeOffset, safeOffset + safeLimit);

    return {
      items: sliced.map((item) => this.toSummary(item)),
      hasMore: sorted.length > queryLimit,
    };
  }

  async searchArticles(filters: SearchFilters): Promise<ArticleSummary[]> {
    const {
      words = [],
      categories = [],
      houses = [],
      meetings = [],
      sort = "date_desc",
      limit = 20,
      dateStart,
      dateEnd,
    } = filters;

    let candidates = this.articles;

    if (words.length > 0) {
      const primaryWord = words[0].toLowerCase();
      candidates = candidates.filter((article) =>
        article.keywords.some((keyword) => keyword.keyword.toLowerCase() === primaryWord)
      );
    } else if (categories.length > 0) {
      const category = categories[0].toLowerCase();
      candidates = candidates.filter((article) =>
        article.categories.some((entry) => entry.toLowerCase() === category)
      );
    }

    const filtered = this.filterArticles(candidates, { categories, houses, meetings, dateStart, dateEnd });
    const sorted = this.sortByDate(filtered, sort);
    const capped = sorted.slice(0, Math.max(1, Math.min(Number(limit), 50)));

    return capped.map((item) => this.toSummary(item));
  }

  async getArticle(id: string): Promise<Article | undefined> {
    const article = this.articles.find((item) => item.id === id);
    if (!article) return undefined;
    return {
      ...article,
      assetUrl: this.buildAssetUrl(article.id),
    };
  }

  async getSuggestions(
    input: string,
    limit = 5,
    filters: Pick<SearchFilters, "categories" | "houses" | "meetings" | "dateStart" | "dateEnd"> = {}
  ): Promise<string[]> {
    if (!input.trim()) return [];

    const word = input.toLowerCase();
    const candidates = this.articles.filter((article) =>
      article.keywords.some((keyword) => keyword.keyword.toLowerCase() === word)
    );

    const filtered = this.filterArticles(candidates, {
      categories: filters.categories ?? [],
      houses: filters.houses ?? [],
      meetings: filters.meetings ?? [],
      dateStart: filters.dateStart,
      dateEnd: filters.dateEnd,
    });

    const suggestions = new Set<string>();
    for (const article of filtered) {
      if (article.title) {
        suggestions.add(article.title);
      }
      article.keywords.forEach((keyword) => suggestions.add(keyword.keyword));
    }

    return Array.from(suggestions).slice(0, limit);
  }

  private buildAssetUrl(articleId: string): string {
    if (!this.assetBaseUrl) return "";
    const base = this.assetBaseUrl.replace(/\/$/, "");
    return `${base}/${this.assetBucket}/articles/${articleId}.json`;
  }

  private normalizeArticle(article: SeedArticle): Article {
    const id = article.id;
    return {
      id,
      title: article.title ?? "",
      description: article.description ?? "",
      date: article.date ?? "",
      month: article.month ?? "",
      categories: article.categories ?? [],
      keywords: this.normalizeKeywords(article.keywords),
      participants: this.normalizeParticipants(article.participants),
      imageKind: article.imageKind ?? "会議録",
      session: article.session ?? 0,
      nameOfHouse: article.nameOfHouse ?? "",
      nameOfMeeting: article.nameOfMeeting ?? "",
      summary: article.summary,
      soft_language_summary: article.soft_language_summary,
      middle_summary: article.middle_summary,
      key_points: article.key_points ?? [],
      dialogs: article.dialogs,
      terms: article.terms,
      assetUrl: this.buildAssetUrl(id),
    };
  }

  private toSummary(article: Article): ArticleSummary {
    return {
      id: article.id,
      title: article.title,
      description: article.description,
      date: article.date,
      month: article.month,
      categories: article.categories,
      keywords: article.keywords,
      participants: article.participants,
      imageKind: article.imageKind,
      session: article.session,
      nameOfHouse: article.nameOfHouse,
      nameOfMeeting: article.nameOfMeeting,
      assetUrl: this.buildAssetUrl(article.id),
    };
  }

  private sortByDate(articles: Article[], sort: SearchFilters["sort"]): Article[] {
    const direction = sort === "date_asc" ? 1 : -1;
    return [...articles].sort((a, b) => {
      const aTime = Date.parse(a.date);
      const bTime = Date.parse(b.date);
      if (Number.isNaN(aTime) && Number.isNaN(bTime)) return 0;
      if (Number.isNaN(aTime)) return 1;
      if (Number.isNaN(bTime)) return -1;
      return direction * (aTime - bTime);
    });
  }

  private filterArticles(
    articles: ArticleSummary[],
    filters: Pick<SearchFilters, "categories" | "houses" | "meetings" | "dateStart" | "dateEnd">
  ): ArticleSummary[] {
    const categories = (filters.categories ?? []).map((category) => category.toLowerCase());
    const houses = filters.houses ?? [];
    const meetings = filters.meetings ?? [];
    const startTime = this.normalizeBoundary(filters.dateStart, "start");
    const endTime = this.normalizeBoundary(filters.dateEnd, "end");

    return articles.filter((article) => {
      if (categories.length > 0 && !article.categories.some((category) => categories.includes(category.toLowerCase()))) {
        return false;
      }
      if (houses.length > 0 && !houses.includes(article.nameOfHouse)) {
        return false;
      }
      if (meetings.length > 0 && !meetings.includes(article.nameOfMeeting)) {
        return false;
      }

      if (!startTime && !endTime) {
        return true;
      }

      const articleDate = Number(new Date(article.date));
      if (Number.isNaN(articleDate)) {
        return false;
      }

      if (startTime && articleDate < startTime) {
        return false;
      }

      if (endTime && articleDate > endTime) {
        return false;
      }

      return true;
    });
  }

  private normalizeBoundary(value: string | undefined, type: "start" | "end"): number | undefined {
    if (!value) return undefined;
    const timestamp = Number(new Date(value));
    if (Number.isNaN(timestamp)) return undefined;

    const date = new Date(timestamp);
    if (type === "start") {
      date.setHours(0, 0, 0, 0);
    } else {
      date.setHours(23, 59, 59, 999);
    }
    return date.getTime();
  }

  private normalizeParticipants(participants?: Participant[]): Participant[] {
    if (!participants) return [];
    return participants.map((participant) => ({
      ...participant,
      name: participant.name ?? "",
      summary: participant.summary ?? "",
      position: participant.position ?? undefined,
      based_on_orders: participant.based_on_orders ?? [],
    }));
  }

  private normalizeKeywords(keywords?: Keyword[]): Keyword[] {
    if (!keywords) return [];
    return keywords
      .filter((keyword) => Boolean(keyword.keyword))
      .map((keyword) => ({
        keyword: keyword.keyword,
        priority: keyword.priority ?? "medium",
      }));
  }
}

export function createMockArticleRepository(env: Env): ArticleRepository {
  const seedArticles = loadSeedArticles();
  return new MockArticleRepository(env, seedArticles);
}
