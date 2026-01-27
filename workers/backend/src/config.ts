import type { Env } from "./types/env";

export type AppEnvironment = "local" | "localstack" | "stage" | "prod";
export type ArticleRepositoryMode = "dynamo" | "mock";

export type AwsEndpoints = {
  dynamodbEndpoint?: string;
  s3Endpoint?: string;
  s3ForcePathStyle: boolean;
};

const DEFAULT_LOCALSTACK_ENDPOINT = "http://localstack:4566";
const DEFAULT_LOCAL_ASSET_BASE_URL = "http://localhost:4570";

export function resolveAppEnvironment(env: Env): AppEnvironment {
  const raw = env.APP_ENV;
  if (raw === "prod" || raw === "stage" || raw === "local" || raw === "localstack") {
    return raw;
  }
  return "local";
}

export function resolveCorsOrigin(origin: string | undefined, env: Env): string {
  const appEnv = resolveAppEnvironment(env);
  if (appEnv === "prod") {
    return "https://politopics.net";
  }
  if (appEnv === "stage") {
    if (!env.STAGE_FRONTEND_URL) {
      throw new Error("STAGE_FRONTEND_URL is required for stage CORS.");
    }
    return env.STAGE_FRONTEND_URL;
  }
  return origin ?? "*";
}

export function resolveAwsEndpoints(env: Env): AwsEndpoints {
  const appEnv = resolveAppEnvironment(env);
  const base =
    env.AWS_ENDPOINT_URL ||
    env.LOCALSTACK_ENDPOINT_URL ||
    env.LOCALSTACK_URL ||
    (appEnv === "local" || appEnv === "localstack" ? DEFAULT_LOCALSTACK_ENDPOINT : undefined);

  const dynamodbEndpoint = env.DYNAMODB_ENDPOINT_URL || base;
  const s3Endpoint = env.S3_ENDPOINT_URL || base;
  const forcePathStyle =
    String(env.S3_FORCE_PATH_STYLE ?? "").toLowerCase() === "true" || Boolean(s3Endpoint);

  return {
    dynamodbEndpoint,
    s3Endpoint,
    s3ForcePathStyle: forcePathStyle,
  };
}

export function resolveArticleRepositoryMode(env: Env): ArticleRepositoryMode {
  return env.ARTICLE_REPOSITORY === "mock" ? "mock" : "dynamo";
}

export function resolveAssetBaseUrl(env: Env): string | undefined {
  if (env.ASSET_BASE_URL) {
    return env.ASSET_BASE_URL;
  }

  const appEnv = resolveAppEnvironment(env);
  if (appEnv === "local" || appEnv === "localstack") {
    return DEFAULT_LOCAL_ASSET_BASE_URL;
  }

  return undefined;
}
