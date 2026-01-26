import { defineConfig } from "@playwright/test"

const frontendUrl = process.env.E2E_BASE_URL ?? "http://127.0.0.1:8787"
const backendUrl = process.env.E2E_BACKEND_URL ?? "http://127.0.0.1:4500"
const localstackUrl = process.env.LOCALSTACK_URL ?? "http://localstack:4566"
const backendPort = new URL(backendUrl).port || (backendUrl.startsWith("https") ? "443" : "80")

const varFlags = [
  process.env.AWS_ENDPOINT_URL && `--var AWS_ENDPOINT_URL=${process.env.AWS_ENDPOINT_URL}`,
  process.env.DYNAMODB_ENDPOINT_URL && `--var DYNAMODB_ENDPOINT_URL=${process.env.DYNAMODB_ENDPOINT_URL}`,
  process.env.S3_ENDPOINT_URL && `--var S3_ENDPOINT_URL=${process.env.S3_ENDPOINT_URL}`,
  process.env.S3_FORCE_PATH_STYLE && `--var S3_FORCE_PATH_STYLE=${process.env.S3_FORCE_PATH_STYLE}`,
  process.env.LOCALSTACK_ENDPOINT && `--var LOCALSTACK_ENDPOINT_URL=${process.env.LOCALSTACK_ENDPOINT}`,
  process.env.LOCALSTACK_URL && `--var LOCALSTACK_URL=${process.env.LOCALSTACK_URL}`,
  process.env.AWS_ACCESS_KEY_ID && `--var AWS_ACCESS_KEY_ID=${process.env.AWS_ACCESS_KEY_ID}`,
  process.env.AWS_SECRET_ACCESS_KEY && `--var AWS_SECRET_ACCESS_KEY=${process.env.AWS_SECRET_ACCESS_KEY}`,
  process.env.DYNAMODB_TABLE_NAME && `--var DYNAMODB_TABLE_NAME=${process.env.DYNAMODB_TABLE_NAME}`,
  process.env.S3_ASSET_BUCKET && `--var S3_ASSET_BUCKET=${process.env.S3_ASSET_BUCKET}`,
].filter(Boolean).join(" ")

const webServers = [
  {
    command: `npm --prefix workers/backend run dev:local -- --port ${backendPort} --ip 127.0.0.1 ${varFlags}`,
    url: `${backendUrl.replace(/\/$/, "")}/healthz`,
    reuseExistingServer: !process.env.CI,
    timeout: 10000,
    env: {
      APP_ENV: process.env.APP_ENV ?? "local",
      AWS_REGION: process.env.AWS_REGION ?? "ap-northeast-3",
      AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID ?? "test",
      AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY ?? "test",
      DYNAMODB_TABLE_NAME: process.env.DYNAMODB_TABLE_NAME ?? "politopics-local",
      S3_ASSET_BUCKET: process.env.S3_ASSET_BUCKET ?? "politopics-articles-local",
      AWS_ENDPOINT_URL: process.env.AWS_ENDPOINT_URL ?? localstackUrl,
      DYNAMODB_ENDPOINT_URL: process.env.DYNAMODB_ENDPOINT_URL ?? localstackUrl,
      S3_ENDPOINT_URL: process.env.S3_ENDPOINT_URL ?? localstackUrl,
      S3_FORCE_PATH_STYLE: process.env.S3_FORCE_PATH_STYLE ?? "true",
      STAGE_FRONTEND_URL: process.env.STAGE_FRONTEND_URL ?? frontendUrl,
    },
  },
  {
    command: "npx --yes wrangler dev --local --env local --config wrangler.toml --port 8787 --ip 127.0.0.1",
    url: frontendUrl,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
]

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  expect: { timeout: 10_000 },
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: frontendUrl,
    trace: "on-first-retry",
  },
  webServer: webServers,
})
