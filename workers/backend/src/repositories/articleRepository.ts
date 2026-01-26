import type { Env } from "../types/env";
import type {
  Article,
  ArticleSummary,
  SearchFilters,
  Summary,
  SoftLanguageSummary,
  MiddleSummary,
  Dialog,
  Participant,
  Keyword,
  ArticleImageKind,
  Term,
} from "../types/article";
import { createDynamoDBClient, unmarshall, M, type DynamoDBClient, type AttributeValue } from "../lib/dynamodb";
import { createS3Client, type S3Client } from "../lib/s3";

export type DynamoArticleItem = {
  PK: string;
  SK: string;
  title: string;
  description: string;
  date: string;
  month: string;
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
  asset_key?: string;
  asset_url?: string;
};

export type DynamoIndexItem = {
  PK: string;
  SK: string;
  articleId: string;
  title: string;
  description?: string;
  date: string;
  month: string;
  categories?: string[];
  keywords?: Keyword[];
  participants?: Participant[];
  imageKind?: ArticleImageKind;
  session?: number;
  nameOfHouse?: string;
  nameOfMeeting?: string;
  asset_key?: string;
  asset_url?: string;
};

export type ArticleAssetData = {
  key_points?: string[];
  summary?: Summary;
  soft_language_summary?: SoftLanguageSummary;
  middle_summary?: MiddleSummary[];
  dialogs?: Dialog[];
};

export type HeadlinesResult = {
  items: ArticleSummary[];
  hasMore: boolean;
};

/**
 * Article repository for Cloudflare Workers
 */
export class ArticleRepository {
  private dynamo: DynamoDBClient;
  private s3: S3Client;
  private tableName: string;
  private assetBucket: string;

  constructor(env: Env) {
    this.dynamo = createDynamoDBClient(env);
    this.s3 = createS3Client(env);
    this.tableName = env.DYNAMODB_TABLE_NAME;
    this.assetBucket = env.S3_ASSET_BUCKET;
  }

  async getHeadlines(
    limit = 6,
    sort: SearchFilters["sort"] = "date_desc",
    offset = 0
  ): Promise<HeadlinesResult> {
    const safeLimit = Number.isFinite(limit) && limit ? Math.max(1, Math.min(Number(limit), 50)) : 6;
    const safeOffset = Number.isFinite(offset) && offset ? Math.max(0, Number(offset)) : 0;
    const queryLimit = Math.min(safeLimit + safeOffset, 100);

    const response = await this.dynamo.query({
      TableName: this.tableName,
      IndexName: "ArticleByDate",
      KeyConditionExpression: "GSI1PK = :article",
      ExpressionAttributeValues: {
        ":article": M.S("ARTICLE"),
      },
      Limit: queryLimit,
      ScanIndexForward: sort === "date_asc",
    });

    const items = (response.Items ?? []).map((item) => this.mapArticleToSummary(unmarshall(item) as DynamoArticleItem));
    const hasMore = Boolean(response.LastEvaluatedKey);

    return {
      items: items.slice(safeOffset, safeOffset + safeLimit),
      hasMore,
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

    if (words.length > 0) {
      const primaryWord = words[0].toLowerCase();
      const response = await this.dynamo.query({
        TableName: this.tableName,
        KeyConditionExpression: "PK = :pk",
        ExpressionAttributeValues: { ":pk": M.S(`KEYWORD#${primaryWord}`) },
        Limit: limit,
        ScanIndexForward: sort === "date_asc",
      });

      const items = (response.Items ?? [])
        .map((item) => this.mapIndexToSummary(unmarshall(item) as DynamoIndexItem))
        .filter((item): item is ArticleSummary => Boolean(item));

      const filtered = items.filter((item) => {
        if (categories.length === 0) return true;
        const normalizedTargets = categories.map((category) => category.toLowerCase());
        return item.categories.some((categoryName) =>
          normalizedTargets.some((target) => target === categoryName.toLowerCase())
        );
      });

      return this.filterArticles(filtered, { categories, houses, meetings, dateStart, dateEnd });
    }

    if (categories.length > 0) {
      const response = await this.dynamo.query({
        TableName: this.tableName,
        KeyConditionExpression: "PK = :pk",
        ExpressionAttributeValues: { ":pk": M.S(`CATEGORY#${categories[0]}`) },
        Limit: limit,
        ScanIndexForward: sort === "date_asc",
      });

      const items = (response.Items ?? [])
        .map((item) => this.mapIndexToSummary(unmarshall(item) as DynamoIndexItem))
        .filter((item): item is ArticleSummary => Boolean(item));

      return this.filterArticles(items, { categories, houses, meetings, dateStart, dateEnd });
    }

    const response = await this.dynamo.query({
      TableName: this.tableName,
      IndexName: "ArticleByDate",
      KeyConditionExpression: "GSI1PK = :article",
      ExpressionAttributeValues: {
        ":article": M.S("ARTICLE"),
      },
      Limit: limit,
      ScanIndexForward: sort === "date_asc",
    });

    const items = (response.Items ?? []).map((item) => this.mapArticleToSummary(unmarshall(item) as DynamoArticleItem));
    return this.filterArticles(items, { categories, houses, meetings, dateStart, dateEnd });
  }

  async getArticle(id: string): Promise<Article | undefined> {
    const started = Date.now();
    const response = await this.dynamo.getItem({
      TableName: this.tableName,
      Key: {
        PK: M.S(`A#${id}`),
        SK: M.S("META"),
      },
    });
    const durationMs = Date.now() - started;
    console.log(
      `[dynamo] getArticle table=${this.tableName} id=${id} duration_ms=${durationMs} hit=${Boolean(response.Item)}`
    );

    if (!response.Item) {
      return undefined;
    }

    const item = unmarshall(response.Item) as DynamoArticleItem;
    // Assets are now fetched directly by frontend from R2 via assetUrl
    return this.mapItemToArticle(item);
  }

  async getSuggestions(
    input: string,
    limit = 5,
    filters: Pick<SearchFilters, "categories" | "houses" | "meetings" | "dateStart" | "dateEnd"> = {}
  ): Promise<string[]> {
    if (!input.trim()) return [];
    const word = input.toLowerCase();

    const response = await this.dynamo.query({
      TableName: this.tableName,
      KeyConditionExpression: "PK = :pk",
      ExpressionAttributeValues: {
        ":pk": M.S(`KEYWORD#${word}`),
      },
      Limit: limit,
    });

    const summaries = (response.Items ?? [])
      .map((item) => this.mapIndexToSummary(unmarshall(item) as DynamoIndexItem))
      .filter((item): item is ArticleSummary => Boolean(item));

    const filtered = this.filterArticles(summaries, {
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
      if (
        categories.length > 0 &&
        !article.categories.some((category) => categories.includes(category.toLowerCase()))
      ) {
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

  private async loadAsset(item: DynamoArticleItem): Promise<ArticleAssetData | undefined> {
    const key = item.asset_key ?? this.extractKeyFromUrl(item.asset_url);
    if (!key) return undefined;

    try {
      const result = await this.s3.getObjectJson<ArticleAssetData>(this.assetBucket, key);
      return result ?? undefined;
    } catch (error) {
      console.log("bucket key", this.assetBucket, key);
      console.warn("Failed to load asset", { article: item.PK, error });
      return undefined;
    }
  }

  private extractKeyFromUrl(assetUrl?: string): string | undefined {
    if (!assetUrl) return undefined;
    try {
      const parsed = new URL(assetUrl);
      const pathname = parsed.pathname.replace(/^\/+/, "");
      if (!pathname) return undefined;

      if (parsed.protocol === "s3:") {
        return pathname;
      }

      const hostParts = parsed.hostname.split(".");
      if (hostParts.length >= 3 && hostParts[1] === "s3") {
        return pathname;
      }

      const [bucketFromPath, ...rest] = pathname.split("/");
      if (rest.length === 0) return undefined;
      if (this.assetBucket && bucketFromPath === this.assetBucket) {
        return rest.join("/");
      }
      return rest.join("/");
    } catch {
      return undefined;
    }
  }

  private mapArticleToSummary(item: DynamoArticleItem): ArticleSummary {
    const article = this.mapItemToArticle(item, undefined);
    return this.toSummary(article);
  }

  private mapIndexToSummary(item: DynamoIndexItem): ArticleSummary | undefined {
    if (!item) return undefined;

    return {
      id: item.articleId ?? item.PK?.split("#").pop() ?? "",
      title: item.title ?? "",
      description: item.description ?? "",
      date: item.date ?? "",
      month: item.month ?? "",
      categories: item.categories ?? [],
      keywords: item.keywords ?? [],
      participants: this.normalizeParticipants(item.participants),
      imageKind: item.imageKind ?? "会議録",
      session: item.session ?? 0,
      nameOfHouse: item.nameOfHouse ?? "",
      nameOfMeeting: item.nameOfMeeting ?? "",
      assetUrl: item.asset_url ?? "",
    };
  }

  private mapItemToArticle(item: DynamoArticleItem, asset?: ArticleAssetData): Article {
    const rawId = typeof item.PK === "string" ? item.PK : "";
    const id = rawId ? rawId.replace("A#", "") : "";
    return {
      id,
      title: item.title ?? "",
      description: item.description ?? "",
      date: item.date ?? "",
      month: item.month ?? "",
      keywords: item.keywords ?? [],
      participants: this.normalizeParticipants(item.participants),
      imageKind: item.imageKind ?? "会議録",
      session: item.session ?? 0,
      nameOfHouse: item.nameOfHouse ?? "",
      nameOfMeeting: item.nameOfMeeting ?? "",
      // Asset fields - populated by frontend from assetUrl
      summary: asset?.summary ?? item.summary,
      soft_language_summary: asset?.soft_language_summary ?? item.soft_language_summary,
      middle_summary: asset?.middle_summary ?? item.middle_summary,
      key_points: asset?.key_points ?? (item as { key_points?: string[] }).key_points ?? [],
      dialogs: asset?.dialogs ?? item.dialogs,
      categories: item.categories ?? [],
      terms: item.terms,
      assetUrl: item.asset_url ?? "",
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
      assetUrl: article.assetUrl,
    };
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
}

/**
 * Create an article repository from the environment
 */
export function createArticleRepository(env: Env): ArticleRepository {
  return new ArticleRepository(env);
}
