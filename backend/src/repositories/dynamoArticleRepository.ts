import {
  DynamoDBClient,
  DescribeTableCommand,
  ResourceNotFoundException,
  type DynamoDBClientConfig,
} from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, GetCommand, QueryCommand } from "@aws-sdk/lib-dynamodb"
import type { ArticleRepository } from "./articleRepository"
import type { Article, ArticleSummary, SearchFilters } from "@shared/types/article"

type DynamoArticleItem = {
  PK: string
  SK: string
  title: string
  description: string
  date: string
  month: string
  categories?: string[]
  keywords?: string[]
  participants?: string[]
  imageKind?: string
  session?: string
  nameOfHouse?: string
  nameOfMeeting?: string
  terms?: string[]
  payload_url?: string
  summary?: string
  soft_summary?: string
}

type DynamoIndexItem = {
  PK: string
  SK: string
  articleId: string
  title: string
  date: string
  month: string
  categories?: string[]
  keywords?: string[]
  participants?: string[]
  imageKind?: string
  session?: string
  nameOfHouse?: string
  nameOfMeeting?: string
}

export type DynamoRepositoryOptions = {
  tableName: string
  region: string
  endpoint?: string
  credentials?: DynamoDBClientConfig["credentials"]
}

export class DynamoArticleRepository implements ArticleRepository {
  private readonly docClient: DynamoDBDocumentClient
  private readonly tableName: string

  constructor(options: DynamoRepositoryOptions) {
    const client = new DynamoDBClient({
      region: options.region,
      endpoint: options.endpoint,
      credentials: options.credentials,
    })

    this.docClient = DynamoDBDocumentClient.from(client, {
      marshallOptions: { removeUndefinedValues: true },
    })
    this.tableName = options.tableName
  }

  async ensureTable(): Promise<boolean> {
    try {
      await this.docClient.send(new DescribeTableCommand({ TableName: this.tableName }))
      return true
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        return false
      }
      throw error
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
    )

    return (response.Items ?? []).map(mapArticleToSummary)
  }

  async searchArticles(filters: SearchFilters): Promise<ArticleSummary[]> {
    const { words = [], categories = [], sort = "date_desc", limit = 20 } = filters

    if (words.length > 0) {
      const primaryWord = words[0].toLowerCase()
      const response = await this.docClient.send(
        new QueryCommand({
          TableName: this.tableName,
          KeyConditionExpression: "PK = :pk",
          ExpressionAttributeValues: { ":pk": `KEYWORD#${primaryWord}` },
          Limit: limit,
          ScanIndexForward: sort === "date_asc",
        }),
      )

      return (response.Items ?? [])
        .map(mapIndexToSummary)
        .filter((item): item is ArticleSummary => Boolean(item))
        .filter((item) => {
          if (categories.length === 0) return true
          const normalizedTargets = categories.map((category) => category.toLowerCase())
          return item.categories.some((categoryName) =>
            normalizedTargets.some((target) => target === categoryName.toLowerCase()),
          )
        })
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
      )

      return (response.Items ?? [])
        .map(mapIndexToSummary)
        .filter((item): item is ArticleSummary => Boolean(item))
    }

    return this.getHeadlines(limit)
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
    )

    if (!response.Item) {
      return undefined
    }

    return mapItemToArticle(response.Item as DynamoArticleItem)
  }

  async getSuggestions(input: string, limit = 5): Promise<string[]> {
    if (!input.trim()) return []
    const word = input.toLowerCase()

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
    )

    const suggestions = new Set<string>()
    for (const item of response.Items ?? []) {
      if (item.title) {
        suggestions.add(item.title as string)
      }
      const keywords: string[] = (item.keywords as string[]) ?? []
      keywords.forEach((keyword) => suggestions.add(keyword))
    }

    return Array.from(suggestions).slice(0, limit)
  }
}

function mapArticleToSummary(item: Record<string, unknown>): ArticleSummary {
  const article = mapItemToArticle(item as DynamoArticleItem)
  return toSummary(article)
}

function mapItemToArticle(item: DynamoArticleItem): Article {
  const id = item.PK.replace("A#", "")
  return {
    id,
    title: item.title,
    description: item.description,
    date: item.date,
    month: item.month,
    categories: item.categories ?? [],
    keywords: item.keywords ?? [],
    participants: item.participants ?? [],
    imageKind: item.imageKind ?? "committee",
    session: item.session ?? "",
    nameOfHouse: item.nameOfHouse ?? "",
    nameOfMeeting: item.nameOfMeeting ?? "",
    terms: item.terms ?? [],
    payload_url: item.payload_url ?? "",
    summary: item.summary ?? "",
    soft_summary: item.soft_summary ?? "",
  }
}

function mapIndexToSummary(item: Record<string, unknown>): ArticleSummary | undefined {
  if (!item) return undefined
  const record = item as DynamoIndexItem

  return {
    id: record.articleId ?? record.PK?.split("#").pop() ?? "",
    title: record.title,
    description: "",
    date: record.date,
    month: record.month,
    categories: record.categories ?? [],
    keywords: record.keywords ?? [],
    participants: record.participants ?? [],
    imageKind: record.imageKind ?? "committee",
    session: record.session ?? "",
    nameOfHouse: record.nameOfHouse ?? "",
    nameOfMeeting: record.nameOfMeeting ?? "",
  }
}

function toSummary(article: Article): ArticleSummary {
  const {
    id,
    title,
    description,
    date,
    month,
    categories,
    keywords,
    participants,
    imageKind,
    session,
    nameOfHouse,
    nameOfMeeting,
  } = article

  return {
    id,
    title,
    description,
    date,
    month,
    categories,
    keywords,
    participants,
    imageKind,
    session,
    nameOfHouse,
    nameOfMeeting,
  }
}
