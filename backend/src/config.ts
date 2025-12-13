import path from "node:path"
import dotenv from "dotenv"

dotenv.config({ path: process.env.ENV_PATH ?? path.resolve(process.cwd(), ".env") })

const DEFAULT_REGION = "ap-northeast-3"
const VALID_ENVIRONMENTS = ["local", "localstack", "stage", "prod"] as const

type AppEnvironment = (typeof VALID_ENVIRONMENTS)[number]

type EnvironmentDefaults = {
  tableName: string
  articlePayloadBucket: string
  region: string
  localstackUrl?: string
}

const ENVIRONMENT_DEFAULTS: Record<AppEnvironment, EnvironmentDefaults> = {
  local: {
    tableName: "politopics-localstack",
    articlePayloadBucket: "politopics-articles-local",
    region: DEFAULT_REGION,
    localstackUrl: "http://localstack:4566",
  },
  localstack: {
    tableName: "politopics-localstack",
    articlePayloadBucket: "politopics-articles-local",
    region: DEFAULT_REGION,
    localstackUrl: "http://localstack:4566",
  },
  stage: {
    tableName: "politopics-stage",
    articlePayloadBucket: "politopics-articles-stage",
    region: DEFAULT_REGION,
  },
  prod: {
    tableName: "politopics-prod",
    articlePayloadBucket: "politopics-articles-prod",
    region: DEFAULT_REGION,
  },
}

function resolveEnvironment(value: string | undefined): AppEnvironment {
  if (!value) {
    return "local"
  }

  const normalized = value.toLowerCase()
  return VALID_ENVIRONMENTS.includes(normalized as AppEnvironment) ? (normalized as AppEnvironment) : "local"
}

const environment = resolveEnvironment(process.env.ENV)
const defaults = ENVIRONMENT_DEFAULTS[environment]

export const appConfig = {
  environment,
  port: Number(process.env.PORT ?? 4000),
  tableName: process.env.POLITOPICS_TABLE ?? defaults.tableName,
  articlePayloadBucket: process.env.POLITOPICS_ARTICLE_BUCKET ?? defaults.articlePayloadBucket,
  region: process.env.AWS_REGION ?? defaults.region,
  localstackUrl: process.env.LOCALSTACK_URL ?? defaults.localstackUrl,
}

export type AppConfig = typeof appConfig
