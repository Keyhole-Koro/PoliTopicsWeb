import type { Env } from "../../types/env";
import type {
  Article,
  ArticleSummary,
  SearchFilters,
} from "../../types/article";
import { createDynamoDBClient, unmarshall, M, type DynamoDBClient } from "../../lib/dynamodb";
import type { ArticleRepository, HeadlinesResult } from "../articleRepository";
import type { DynamoArticleItem, DynamoIndexItem } from "./types";
import {
  filterArticles,
  mapArticleToSummary,
  mapIndexToSummary,
  mapItemToArticle,
} from "./mappers";

/**
 * Article repository for Cloudflare Workers
 */
export class DynamoArticleRepository implements ArticleRepository {
  private dynamo: DynamoDBClient;
  private tableName: string;

  constructor(env: Env) {
    this.dynamo = createDynamoDBClient(env);
    this.tableName = env.DYNAMODB_TABLE_NAME;
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

    const items = (response.Items ?? []).map((item) => mapArticleToSummary(unmarshall(item) as DynamoArticleItem));
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
        .map((item) => mapIndexToSummary(unmarshall(item) as DynamoIndexItem))
        .filter((item): item is ArticleSummary => Boolean(item));

      const filtered = items.filter((item) => {
        if (categories.length === 0) return true;
        const normalizedTargets = categories.map((category) => category.toLowerCase());
        return item.categories.some((categoryName) =>
          normalizedTargets.some((target) => target === categoryName.toLowerCase())
        );
      });

      return filterArticles(filtered, { categories, houses, meetings, dateStart, dateEnd });
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
        .map((item) => mapIndexToSummary(unmarshall(item) as DynamoIndexItem))
        .filter((item): item is ArticleSummary => Boolean(item));

      return filterArticles(items, { categories, houses, meetings, dateStart, dateEnd });
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

    const items = (response.Items ?? []).map((item) => mapArticleToSummary(unmarshall(item) as DynamoArticleItem));
    return filterArticles(items, { categories, houses, meetings, dateStart, dateEnd });
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
    return mapItemToArticle(item);
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
      .map((item) => mapIndexToSummary(unmarshall(item) as DynamoIndexItem))
      .filter((item): item is ArticleSummary => Boolean(item));

    const filtered = filterArticles(summaries, {
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
}