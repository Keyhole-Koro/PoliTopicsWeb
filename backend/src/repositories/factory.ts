import { appConfig } from "../config"
import { DynamoArticleRepository } from "./dynamoArticleRepository"
import { MockArticleRepository } from "./mockArticleRepository"
import type { ArticleRepository } from "./articleRepository"
import type { DynamoRepositoryOptions } from "./dynamoArticleRepository"

export function createArticleRepository(): ArticleRepository {
  console.log("Factory: Creating repository. Mode:", appConfig.dataMode)
  if (appConfig.dataMode === "mock") {
    return new MockArticleRepository()
  }

  const options: DynamoRepositoryOptions = {
    tableName: appConfig.tableName,
    region: appConfig.region,
    assetBucket: appConfig.articleAssetBucket,
  }

  if (appConfig.localstackUrl) {
    options.endpoint = appConfig.localstackUrl
    options.s3Endpoint = appConfig.localstackUrl
    options.credentials = appConfig.credentials
  }

  return new DynamoArticleRepository(options)
}
