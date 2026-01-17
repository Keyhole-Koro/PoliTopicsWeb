const VALID_ENVIRONMENTS = ["local", "stage", "prod"] as const

export type AppEnvironment = (typeof VALID_ENVIRONMENTS)[number]

export type AppConfig = {
  environment: AppEnvironment
  api: {
    url: string
    path: string
    limit: number
    requestTimeoutMs: number
  }
  bucket: {
    name: string

    indexHtmlKey?: string

  }
  s3: {
    endpoint: string | undefined //but required in stage/prod
    region: string
    credentials?: {
      accessKeyId: string
      secretAccessKey: string
    }
  }
  notifications: {
    batchWebhook?: string
    errorWebhook?: string
  }
}

export const APP_CONFIG: Record<AppEnvironment, AppConfig> = {
  local: {
    environment: "local",
    api: { url: "http://127.0.0.1:4500", path: "/headlines", limit: 50, requestTimeoutMs: 10_000 },
    bucket: {
      name: "politopics-frontend-local",
      indexHtmlKey: "index.html",
    },
    s3: {
      endpoint: "http://localstack:4566",
      region: "ap-northeast-3",
    },
    notifications: {},
  },
  stage: {
    environment: "stage",
    api: {
      url: "",
      path: "/headlines",
      limit: 50,
      requestTimeoutMs: 10_000,
    },
    bucket: {
      name: "politopics-frontend-stage",
      indexHtmlKey: "index.html",
    },
    s3: {
      endpoint: process.env.S3_COMPATIBLE_API_STAGE,
      region: "auto",
    },
    notifications: {},
  },
  prod: {
    environment: "prod",
    api: { url: "https://api.politopics.net", path: "/headlines", limit: 50, requestTimeoutMs: 10_000 },
    bucket: {
      name: "politopics-frontend-prod",
      indexHtmlKey: "index.html",

    },
    s3: {
      endpoint: process.env.S3_COMPATIBLE_API_PROD,
      region: "auto",
    },
    notifications: {},
  },
}

export function loadConfig(): AppConfig {
  const envName = resolveEnvironment()
  const preset = APP_CONFIG[envName]
  const stageApiUrl = envName === "stage" ? requireEnv("STAGE_BACKEND_API_URL") : undefined
  const apiUrl = stageApiUrl ?? preset.api.url
  const s3AccessKeyId = process.env.S3_ACCESS_KEY_ID
  const s3SecretAccessKey = process.env.S3_SECRET_ACCESS_KEY
  const batchWebhook = process.env.DISCORD_WEBHOOK_BATCH
  const errorWebhook = process.env.DISCORD_WEBHOOK_ERROR

  if (envName !== "local") {
    if (!s3AccessKeyId || !s3SecretAccessKey) {
      throw new Error("S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY are required in stage/prod")
    }
    const requiredEndpointVar = envName === "prod" ? "S3_COMPATIBLE_API_PROD" : "S3_COMPATIBLE_API_STAGE"
    if (!preset.s3.endpoint || preset.s3.endpoint.trim() === "") {
      throw new Error(`${requiredEndpointVar} is required in ${envName}`)
    }
  }

  return {
    ...preset,
    api: {
      ...preset.api,
      url: apiUrl,
    },
    s3: {
      ...preset.s3,
      credentials:
        s3AccessKeyId && s3SecretAccessKey
          ? { accessKeyId: s3AccessKeyId, secretAccessKey: s3SecretAccessKey }
          : undefined,
    },
    notifications: {
      batchWebhook,
      errorWebhook,
    },
  }
}

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value || value.trim() === "") {
    throw new Error(`${name} is required`)
  }
  return value
}

function resolveEnvironment(): AppEnvironment {
  const value = process.env.ACTIVE_ENVIRONMENT
  if (!value || value.trim() === "") {
    throw new Error("ACTIVE_ENVIRONMENT is required")
  }
  if (!VALID_ENVIRONMENTS.includes(value as AppEnvironment)) {
    throw new Error(`Invalid ACTIVE_ENVIRONMENT "${value}". Must be one of: ${VALID_ENVIRONMENTS.join(", ")}`)
  }
  return value as AppEnvironment
}
