const DEFAULT_REGION = "ap-northeast-3"
const VALID_ENVIRONMENTS = ["local", "localstack", "stage", "prod"] as const

type AppEnvironment = (typeof VALID_ENVIRONMENTS)[number]

type EnvironmentDefaults = {
  tableName: string
  articlePayloadBucket: string
  region: string
  localstackUrl?: string
  credentials?: { accessKeyId: string; secretAccessKey: string }
}

const ENVIRONMENT_DEFAULTS: Record<AppEnvironment, EnvironmentDefaults> = {
  local: {
    tableName: "politopics-local",
    articlePayloadBucket: "politopics-articles-local",
    region: DEFAULT_REGION,
    localstackUrl: "http://localstack:4566",
    credentials: { accessKeyId: "test", secretAccessKey: "test" },
  },
  localstack: {
    tableName: "politopics-local",
    articlePayloadBucket: "politopics-articles-local",
    region: DEFAULT_REGION,
    localstackUrl: "http://localstack:4566",
    credentials: { accessKeyId: "test", secretAccessKey: "test" },
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

const ACTIVE_ENVIRONMENT: AppEnvironment = "local"

const defaults = ENVIRONMENT_DEFAULTS[ACTIVE_ENVIRONMENT]

export type AppConfig = {
  environment: AppEnvironment
  port: number
  tableName: string
  articlePayloadBucket: string
  region: string
  localstackUrl?: string
  credentials?: { accessKeyId: string; secretAccessKey: string }
}

export let appConfig: AppConfig = {
  environment: ACTIVE_ENVIRONMENT,
  port: 4000,
  tableName: defaults.tableName,
  articlePayloadBucket: defaults.articlePayloadBucket,
  region: defaults.region,
  localstackUrl: defaults.localstackUrl,
  credentials: defaults.credentials,
}

export function setAppEnvironment(environment: AppEnvironment) {
  if (!VALID_ENVIRONMENTS.includes(environment)) {
    throw new Error(`Unknown environment: ${environment}`)
  }
  const envDefaults = ENVIRONMENT_DEFAULTS[environment]
  appConfig = {
    environment,
    port: appConfig.port,
    tableName: envDefaults.tableName,
    articlePayloadBucket: envDefaults.articlePayloadBucket,
    region: envDefaults.region,
    localstackUrl: envDefaults.localstackUrl,
    credentials: envDefaults.credentials,
  }
}
