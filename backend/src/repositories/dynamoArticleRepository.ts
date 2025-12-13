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
  normalizeKeywords,
  type ArticlePayloadData,
  type DynamoArticleItem,
} from "./dynamoArticleMapper";
import type { ArticleRepository } from "./articleRepository";
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

  async getHeadlines(limit = 6): Promise<ArticleSummary[]> {
    const response = await this.docClient.send(
      new QueryCommand({
        TableName: this.tableName,
        IndexName: "ArticleByDate",
        KeyConditionExpression: "GSI1PK = :article",
        ExpressionAttributeValues: {
          ":article": "ARTICLE",
        },
        Limit: limit,
        ScanIndexForward: false,
      }),
    );

    return (response.Items ?? []).map(mapArticleToSummary);
  }

  async searchArticles(filters: SearchFilters): Promise<ArticleSummary[]> {
    const { words = [], categories = [], sort = "date_desc", limit = 20 } = filters;

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

      return (response.Items ?? [])
        .map(mapIndexToSummary)
        .filter((item): item is ArticleSummary => Boolean(item))
        .filter((item) => {
          if (categories.length === 0) return true;
          const normalizedTargets = categories.map((category) => category.toLowerCase());
          return item.categories.some((categoryName) =>
            normalizedTargets.some((target) => target === categoryName.toLowerCase()),
          );
        });
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

      return (response.Items ?? [])
        .map(mapIndexToSummary)
        .filter((item): item is ArticleSummary => Boolean(item));
    }

    return this.getHeadlines(limit);
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

  async getSuggestions(input: string, limit = 5): Promise<string[]> {
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
        ProjectionExpression: "title, keywords",
      }),
    );

    const suggestions = new Set<string>();
    for (const item of response.Items ?? []) {
      if (item.title) {
        suggestions.add(item.title as string);
      }
      const keywords = normalizeKeywords((item as Record<string, unknown>).keywords);
      keywords.forEach((keyword) => suggestions.add(keyword.keyword));
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
