type AppEnvironment = "local" | "stage" | "prod"

type AppConfig = {
  environment: AppEnvironment
  apiBaseUrl: string
}

const CONFIG_BY_ENV: Record<AppEnvironment, Omit<AppConfig, "environment">> = {
  local: {
    apiBaseUrl: "http://localhost:4000",
  },
  stage: {
    apiBaseUrl: "https://politopics-api-stage.example.com",
  },
  prod: {
    apiBaseUrl: "https://politopics-api.example.com",
  },
}

const ACTIVE_ENVIRONMENT: AppEnvironment = "local"

export const appConfig: AppConfig = {
  environment: ACTIVE_ENVIRONMENT,
  ...CONFIG_BY_ENV[ACTIVE_ENVIRONMENT],
}
