import path from "node:path"
import dotenv from "dotenv"

dotenv.config({ path: process.env.ENV_PATH ?? path.resolve(process.cwd(), ".env") })

const DEFAULT_REGION = "ap-northeast-3"

export const appConfig = {
  port: Number(process.env.PORT ?? 4000),
  dataMode: (process.env.DATA_MODE ?? "mock").toLowerCase(),
  tableName: process.env.POLITOPICS_TABLE ?? "politopics-stage",
  stageTableName: process.env.POLITOPICS_STAGE_TABLE ?? "politopics-stage",
  prodTableName: process.env.POLITOPICS_PROD_TABLE ?? "politopics-prod",
  articlePayloadBucketStage: process.env.POLITOPICS_ARTICLE_BUCKET_STAGE ?? "politopics-articles-stage",
  articlePayloadBucketProd: process.env.POLITOPICS_ARTICLE_BUCKET_PROD ?? "politopics-articles-prod",
  region: process.env.AWS_REGION ?? DEFAULT_REGION,
  localstackUrl: process.env.LOCALSTACK_URL,
}

export type AppConfig = typeof appConfig
