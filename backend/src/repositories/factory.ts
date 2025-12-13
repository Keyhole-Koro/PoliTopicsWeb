import { appConfig } from "../config"
import { DynamoArticleRepository } from "./dynamoArticleRepository"
import type { ArticleRepository } from "./articleRepository"

export function createArticleRepository(): ArticleRepository {
  return new DynamoArticleRepository({
    tableName: appConfig.tableName,
    region: appConfig.region,
    endpoint: appConfig.localstackUrl,
    payloadBucket: appConfig.articlePayloadBucket,
    s3Endpoint: appConfig.localstackUrl,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "test",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "test",
    },
  })
}
