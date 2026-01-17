export type AppEnvironment = "local" | "stage" | "prod"

export type AppConfig = {
  environment: AppEnvironment
  api: {
    url: string //but required in stage/prod
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

if (!process.env.STAGE_BACKEND_API_URL) {
  throw new Error("STAGE_BACKEND_API_URL must be set in stage/prod environments")
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
      url: process.env.STAGE_BACKEND_API_URL,
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
  const envName = detectEnvironment()
  const preset = APP_CONFIG[envName]
  const s3AccessKeyId = process.env.S3_ACCESS_KEY_ID
  const s3SecretAccessKey = process.env.S3_SECRET_ACCESS_KEY
  const batchWebhook = process.env.DISCORD_WEBHOOK_BATCH
  const errorWebhook = process.env.DISCORD_WEBHOOK_ERROR

  if (envName !== "local") {
    if (envName === "stage" && (!preset.api.url || preset.api.url.trim() === "")) {
      throw new Error("STAGE_BACKEND_API_URL is required in stage")
    }
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

function detectEnvironment(): AppEnvironment {
  const name = process.env.AWS_LAMBDA_FUNCTION_NAME?.toLowerCase() || ""
  if (name.includes("prod")) return "prod"
  if (name.includes("stage")) return "stage"
  return "local"
}
