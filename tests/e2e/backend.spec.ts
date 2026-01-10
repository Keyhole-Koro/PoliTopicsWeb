import { test, expect } from "@playwright/test"

const backendBase = (process.env.E2E_BACKEND_URL ?? "http://127.0.0.1:4500").replace(/\/$/, "")
const expectedHeadlineId = "issue-001"
const expectedHeadlineTitle = "気候危機集中審議、越冬エネルギー対策を協議"

test("backend health check", async ({ request }) => {
  const response = await request.get(`${backendBase}/healthz`)
  expect(response.ok()).toBeTruthy()
  expect(await response.json()).toEqual({ status: "ok" })
})

test("backend headlines endpoint", async ({ request }) => {
  const response = await request.get(`${backendBase}/headlines?limit=20`)
  if (!response.ok()) {
    console.log("Backend failed:", response.status(), response.statusText())
    console.log("Body:", await response.text())
  }
  expect(response.ok()).toBeTruthy()
  const data = await response.json()
  expect(Array.isArray(data.items)).toBeTruthy()
  expect(data.items.length).toBeGreaterThan(0)

  const ids = data.items.map((item: { id?: string }) => String(item.id ?? "").toLowerCase())
  expect(ids).toContain(expectedHeadlineId.toLowerCase())

  for (const item of data.items) {
    expect(typeof item.title).toBe("string")
    expect(typeof item.assetUrl).toBe("string")
    expect(item.assetUrl.length).toBeGreaterThan(0)
  }
})

test("backend article detail includes assetUrl", async ({ request }) => {
  const response = await request.get(`${backendBase}/article/${expectedHeadlineId}`)
  expect(response.ok()).toBeTruthy()
  const data = await response.json()
  expect(data.article).toBeDefined()
  expect(data.article.title).toBe(expectedHeadlineTitle)
  expect("assetUrl" in data.article).toBeTruthy()
  expect(typeof data.article.assetUrl).toBe("string")
  expect(data.article.assetUrl.length).toBeGreaterThan(0)
})
