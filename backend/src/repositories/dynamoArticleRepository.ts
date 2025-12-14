import {
  DynamoDBClient,
  DescribeTableCommand,
  ResourceNotFoundException,
  type DynamoDBClientConfig,
} from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { GetObjectCommand, S3Client, type GetObjectCommandOutput } from "@aws-sdk/client-s3";
import { Readable } from "node:stream";
import {
  mapArticleToSummary,
  mapIndexToSummary,
  mapItemToArticle,
  type ArticlePayloadData,
  type DynamoArticleItem,
} from "./dynamoArticleMapper";
import type { ArticleRepository, HeadlinesResult } from "./articleRepository";
import type { Article, ArticleSummary, SearchFilters } from "@shared/types/article";
import type { SdkStreamMixin } from "@aws-sdk/types";

export type DynamoRepositoryOptions = {
  tableName: string;
  region: string;
  endpoint?: string;
  credentials?: DynamoDBClientConfig["credentials"];
  payloadBucket?: string;
  s3Endpoint?: string;
};

export class DynamoArticleRepository implements ArticleRepository {
  private readonly docClient: DynamoDBDocumentClient;
  private readonly tableName: string;
  private readonly s3Client?: S3Client;
  private readonly payloadBucket?: string;

  constructor(options: DynamoRepositoryOptions) {
    const client = new DynamoDBClient({
      region: options.region,
      endpoint: options.endpoint,
      credentials: options.credentials,
    });

    this.docClient = DynamoDBDocumentClient.from(client, {
      marshallOptions: { removeUndefinedValues: true },
    });
    this.tableName = options.tableName;

    if (options.payloadBucket) {
      this.payloadBucket = options.payloadBucket;
      this.s3Client = new S3Client({
        region: options.region,
        endpoint: options.s3Endpoint ?? options.endpoint,
        forcePathStyle: Boolean(options.s3Endpoint ?? options.endpoint),
        credentials: options.credentials,
      });
    }
  }

  async ensureTable(): Promise<boolean> {
    try {
      await this.docClient.send(new DescribeTableCommand({ TableName: this.tableName }));
      return true;
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        return false;
      }
      throw error;
    }
  }

  async getHeadlines(
    limit = 6,
    sort: SearchFilters["sort"] = "date_desc",
    offset = 0,
  ): Promise<HeadlinesResult> {
    const safeLimit = Number.isFinite(limit) && limit ? Math.max(1, Math.min(Number(limit), 50)) : 6;
    const safeOffset = Number.isFinite(offset) && offset ? Math.max(0, Number(offset)) : 0;
    const queryLimit = Math.min(safeLimit + safeOffset, 100);

    const response = await this.docClient.send(
      new QueryCommand({
        TableName: this.tableName,
        IndexName: "ArticleByDate",
        KeyConditionExpression: "GSI1PK = :article",
        ExpressionAttributeValues: {
          ":article": "ARTICLE",
        },
        Limit: queryLimit,
        ScanIndexForward: sort === "date_asc",
      }),
    );

    const items = (response.Items ?? []).map(mapArticleToSummary);
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
      const response = await this.docClient.send(
        new QueryCommand({
          TableName: this.tableName,
          KeyConditionExpression: "PK = :pk",
          ExpressionAttributeValues: { ":pk": `KEYWORD#${primaryWord}` },
          Limit: limit,
          ScanIndexForward: sort === "date_asc",
        }),
      );

      const items = (response.Items ?? [])
        .map(mapIndexToSummary)
        .filter((item): item is ArticleSummary => Boolean(item))
        .filter((item) => {
          if (categories.length === 0) return true;
          const normalizedTargets = categories.map((category) => category.toLowerCase());
          return item.categories.some((categoryName) =>
            normalizedTargets.some((target) => target === categoryName.toLowerCase()),
          );
        });

      return this.filterArticles(items, { categories, houses, meetings, dateStart, dateEnd });
    }

    if (categories.length > 0) {
      const response = await this.docClient.send(
        new QueryCommand({
          TableName: this.tableName,
          KeyConditionExpression: "PK = :pk",
          ExpressionAttributeValues: { ":pk": `CATEGORY#${categories[0]}` },
          Limit: limit,
          ScanIndexForward: sort === "date_asc",
        }),
      );

      const items = (response.Items ?? [])
        .map(mapIndexToSummary)
        .filter((item): item is ArticleSummary => Boolean(item));

      return this.filterArticles(items, { categories, houses, meetings, dateStart, dateEnd });
    }

    const response = await this.docClient.send(
      new QueryCommand({
        TableName: this.tableName,
        IndexName: "ArticleByDate",
        KeyConditionExpression: "GSI1PK = :article",
        ExpressionAttributeValues: {
          ":article": "ARTICLE",
        },
        Limit: limit,
        ScanIndexForward: sort === "date_asc",
      }),
    );

    const items = (response.Items ?? []).map(mapArticleToSummary);
    return this.filterArticles(items, { categories, houses, meetings, dateStart, dateEnd });
  }

  async getArticle(id: string): Promise<Article | undefined> {
    const response = await this.docClient.send(
      new GetCommand({
        TableName: this.tableName,
        Key: {
          PK: `A#${id}`,
          SK: "META",
        },
      }),
    );

    if (!response.Item) {
      return undefined;
    }

    const item = response.Item as DynamoArticleItem;
    const payload = await this.loadPayload(item);
    return mapItemToArticle(item, payload);
  }

  private filterArticles(
    articles: ArticleSummary[],
    filters: Pick<SearchFilters, "categories" | "houses" | "meetings" | "dateStart" | "dateEnd">,
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

  async getSuggestions(
    input: string,
    limit = 5,
    filters: Pick<SearchFilters, "categories" | "houses" | "meetings" | "dateStart" | "dateEnd"> = {},
  ): Promise<string[]> {
    if (!input.trim()) return [];
    const word = input.toLowerCase();

    const response = await this.docClient.send(
      new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: "PK = :pk",
        ExpressionAttributeValues: {
          ":pk": `KEYWORD#${word}`,
        },
        Limit: limit,
      }),
    );

    const summaries = (response.Items ?? [])
      .map(mapIndexToSummary)
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

  private async loadPayload(item: DynamoArticleItem): Promise<ArticlePayloadData | undefined> {
    if (!this.s3Client || !this.payloadBucket) return undefined;
    const key = item.payload_key ?? this.extractKeyFromUrl(item.payload_url);
    if (!key) return undefined;

    try {
      const response = await this.s3Client.send(
        new GetObjectCommand({
          Bucket: this.payloadBucket,
          Key: key,
        }),
      );
      if (!response.Body) {
        return undefined;
      }
      const raw = await streamToString(response.Body);
      if (!raw) return undefined;
      return JSON.parse(raw) as ArticlePayloadData;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn("Failed to load payload", { article: item.PK, error });
      return undefined;
    }
  }

  private extractKeyFromUrl(payloadUrl?: string): string | undefined {
    if (!payloadUrl) return undefined;
    try {
      const parsed = new URL(payloadUrl);
      const pathname = parsed.pathname.replace(/^\/+/, "");
      if (!pathname) return undefined;

      const hostParts = parsed.hostname.split(".");
      if (hostParts.length >= 3 && hostParts[1] === "s3") {
        return pathname;
      }

      const [bucketFromPath, ...rest] = pathname.split("/");
      if (rest.length === 0) return undefined;
      if (this.payloadBucket && bucketFromPath === this.payloadBucket) {
        return rest.join("/");
      }
      return rest.join("/");
    } catch {
      return undefined;
    }
  }
}

type S3Body = NonNullable<GetObjectCommandOutput["Body"]>;

function isReadableStream(body: unknown): body is Readable {
  return Boolean(body && typeof (body as Readable).on === "function" && typeof (body as Readable).pipe === "function");
}

async function streamToString(body: S3Body): Promise<string> {
  if (!body) return "";

  if (typeof (body as SdkStreamMixin).transformToString === "function") {
    return (body as SdkStreamMixin).transformToString();
  }

  if (body instanceof Uint8Array) {
    return Buffer.from(body).toString("utf-8");
  }

  if (isReadableStream(body)) {
    return new Promise<string>((resolve, reject) => {
      const chunks: Buffer[] = [];
      body.on("data", (chunk: Buffer | string | Uint8Array) => {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      });
      body.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
      body.on("error", (error) => reject(error));
    });
  }

  return "";
}
