import { defineConfig } from "@playwright/test"

const workerUrl = process.env.E2E_BASE_URL ?? "http://127.0.0.1:8787"

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  expect: { timeout: 10_000 },
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: workerUrl,
    trace: "on-first-retry",
  },
  webServer: [
    {
      command: "npm run dev:backend:mock",
      url: "http://127.0.0.1:4500/healthz",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: "npm run worker:dev:local",
      url: workerUrl,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
})
