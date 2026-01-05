const DEFAULT_REGION = "ap-northeast-3"
const VALID_ENVIRONMENTS = ["local", "stage", "prod"] as const
const VALID_DATA_MODES = ["dynamo", "mock"] as const

type AppEnvironment = (typeof VALID_ENVIRONMENTS)[number]
type DataMode = (typeof VALID_DATA_MODES)[number]

type EnvironmentDefaults = {
  tableName: string
  articleAssetBucket: string
  region: string
  localstackUrl?: string
  credentials?: { accessKeyId: string; secretAccessKey: string }
}

const ENVIRONMENT_DEFAULTS: Record<AppEnvironment, EnvironmentDefaults> = {
  local: {
    tableName: "politopics-local",
    articleAssetBucket: "politopics-articles-local",
    region: DEFAULT_REGION,
    localstackUrl: "http://localstack:4566",
    credentials: { accessKeyId: "test", secretAccessKey: "test" },
  },
  stage: {
    tableName: "politopics-stage",
    articleAssetBucket: "politopics-articles-stage",
    region: DEFAULT_REGION,
  },
  prod: {
    tableName: "politopics-prod",
    articleAssetBucket: "politopics-articles-prod",
    region: DEFAULT_REGION,
  },
}

const rawEnv = process.env.ACTIVE_ENVIRONMENT
if (!rawEnv) {
  throw new Error("ACTIVE_ENVIRONMENT is not set")
}
if (!(VALID_ENVIRONMENTS as readonly string[]).includes(rawEnv)) {
  throw new Error(`Invalid APP_ENV "${rawEnv}". Must be one of: ${VALID_ENVIRONMENTS.join(", ")}`)
}
const ACTIVE_ENVIRONMENT = rawEnv as AppEnvironment

const defaults = ENVIRONMENT_DEFAULTS[ACTIVE_ENVIRONMENT]
const dataMode = resolveDataMode()
const localstackUrl = dataMode === "mock" ? undefined : defaults.localstackUrl
const credentials = dataMode === "mock" ? undefined : defaults.credentials

export type AppConfig = {
  environment: AppEnvironment
  port: number
  dataMode: DataMode
  tableName: string
  articleAssetBucket: string
  region: string
  localstackUrl?: string
  credentials?: { accessKeyId: string; secretAccessKey: string }
  notifications: {
    errorWebhook: string
    warnWebhook: string
    accessWebhook: string
  }
}

export let appConfig: AppConfig = {
  environment: ACTIVE_ENVIRONMENT,
  port: 4000,
  dataMode,
  tableName: defaults.tableName,
  articleAssetBucket: defaults.articleAssetBucket,
  region: defaults.region,
  localstackUrl,
  credentials,
  notifications: buildNotifications(),
}

export function setAppEnvironment(environment: AppEnvironment) {
  if (!VALID_ENVIRONMENTS.includes(environment)) {
    throw new Error(`Unknown environment: ${environment}`)
  }
  const envDefaults = ENVIRONMENT_DEFAULTS[environment]
  const resolvedLocalstackUrl = appConfig.dataMode === "mock" ? undefined : envDefaults.localstackUrl
  const resolvedCredentials = appConfig.dataMode === "mock" ? undefined : envDefaults.credentials
  appConfig = {
    environment,
    port: appConfig.port,
    dataMode: appConfig.dataMode,
    tableName: envDefaults.tableName,
    articleAssetBucket: envDefaults.articleAssetBucket,
    region: envDefaults.region,
    localstackUrl: resolvedLocalstackUrl,
    credentials: resolvedCredentials,
    notifications: buildNotifications(),
  }
}

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value || value.trim() === "") {
    throw new Error(`Environment variable ${name} is required`)
  }
  return value
}

function buildNotifications() {
  if (process.env.DISABLE_NOTIFICATIONS === "true") {
    return {
      errorWebhook: "",
      warnWebhook: "",
      accessWebhook: "",
    }
  }
  return {
    errorWebhook: requireEnv("DISCORD_WEBHOOK_ERROR"),
    warnWebhook: requireEnv("DISCORD_WEBHOOK_WARN"),
    accessWebhook: requireEnv("DISCORD_WEBHOOK_ACCESS"),
  }
}

function resolveDataMode(): DataMode {
  const raw = process.env.DATA_MODE ?? "dynamo"
  if (!VALID_DATA_MODES.includes(raw as DataMode)) {
    throw new Error(`Invalid DATA_MODE "${raw}". Must be one of: ${VALID_DATA_MODES.join(", ")}`)
  }
  return raw as DataMode
}
