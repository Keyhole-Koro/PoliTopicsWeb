type AppEnvironment = "local" | "stage" | "prod"

type AppConfig = {
  environment: AppEnvironment
  apiBaseUrl: string
}

const CONFIG_BY_ENV: Record<AppEnvironment, Omit<AppConfig, "environment">> = {
  local: {
    apiBaseUrl: "http://127.0.0.1:4500",
  },
  stage: {
    apiBaseUrl: "https://zboh4595x7.execute-api.ap-northeast-3.amazonaws.com/stage/",
  },
  prod: {
    apiBaseUrl: "https://api.politopics.net",
  },
}

const ENVIRONMENT_FROM_ENV = process.env.NEXT_PUBLIC_APP_ENV as AppEnvironment | undefined
if (!ENVIRONMENT_FROM_ENV) {
  throw new Error("NEXT_PUBLIC_APP_ENV must be set to local, stage, or prod.")
}
const ACTIVE_ENVIRONMENT: AppEnvironment = ENVIRONMENT_FROM_ENV
const ENV_API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

export const appConfig: AppConfig = {
  environment: ACTIVE_ENVIRONMENT,
  ...CONFIG_BY_ENV[ACTIVE_ENVIRONMENT],
  apiBaseUrl: ENV_API_BASE_URL ?? CONFIG_BY_ENV[ACTIVE_ENVIRONMENT].apiBaseUrl,
}

console.log("[config] App Config:", JSON.stringify(appConfig, null, 2))
