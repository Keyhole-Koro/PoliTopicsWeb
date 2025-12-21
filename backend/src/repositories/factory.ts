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
    options.credentials = appConfig.credentials
  }

  return new DynamoArticleRepository(options)
}
