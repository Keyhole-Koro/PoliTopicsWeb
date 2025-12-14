import { appConfig } from "../config"
import { DynamoArticleRepository } from "./dynamoArticleRepository"
import type { ArticleRepository } from "./articleRepository"
import type { DynamoRepositoryOptions } from "./dynamoArticleRepository"

export function createArticleRepository(): ArticleRepository {
  const options: DynamoRepositoryOptions = {
    tableName: appConfig.tableName,
    region: appConfig.region,
    payloadBucket: appConfig.articlePayloadBucket,
  }

  if (appConfig.localstackUrl) {
    options.endpoint = appConfig.localstackUrl
    options.s3Endpoint = appConfig.localstackUrl
    options.credentials = {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "test",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "test",
    }
  }

  return new DynamoArticleRepository(options)
}
