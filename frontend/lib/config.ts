import { debugLog } from "./logger"

type AppEnvironment = "local" | "stage" | "prod" | "localstackTest"

type AppConfig = {
  environment: AppEnvironment
  apiBaseUrl: string
}

const CONFIG_BY_ENV: Record<AppEnvironment, Omit<AppConfig, "environment">> = {
  local: {
    apiBaseUrl: "http://localhost:45000",
  },
  stage: {
    apiBaseUrl: process.env.NEXT_PUBLIC_STAGE_BACKEND_API_URL as string,
  },
  prod: {
    apiBaseUrl: "https://api.politopics.net",
  },
  localstackTest: {
    apiBaseUrl: "http://127.0.0.1:4500",
  },
}

const ENVIRONMENT_FROM_ENV = process.env.NEXT_PUBLIC_APP_ENV as AppEnvironment | undefined
if (!ENVIRONMENT_FROM_ENV) {
  throw new Error("NEXT_PUBLIC_APP_ENV must be set to local, stage, prod, or localstackTest.")
}
const ACTIVE_ENVIRONMENT: AppEnvironment = ENVIRONMENT_FROM_ENV

if (ACTIVE_ENVIRONMENT === "stage" && !CONFIG_BY_ENV.stage.apiBaseUrl) {
  throw new Error("NEXT_PUBLIC_STAGE_BACKEND_API_URL environment variable is required in stage environment")
}

export const appConfig: AppConfig = {
  environment: ACTIVE_ENVIRONMENT,
  ...CONFIG_BY_ENV[ACTIVE_ENVIRONMENT],
  apiBaseUrl: CONFIG_BY_ENV[ACTIVE_ENVIRONMENT].apiBaseUrl,
}

if (appConfig.environment === "local" || appConfig.environment === "stage") {
  debugLog("[config] App Config:", JSON.stringify(appConfig, null, 2))
}
