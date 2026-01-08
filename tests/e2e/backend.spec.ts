import { test, expect } from "@playwright/test"

test("backend health check", async ({ request }) => {
  // Use the backend URL directly
  const response = await request.get("http://127.0.0.1:4500/healthz")
  expect(response.ok()).toBeTruthy()
  expect(await response.json()).toEqual({ status: "ok" })
})

test("backend headlines endpoint", async ({ request }) => {
  const response = await request.get("http://127.0.0.1:4500/headlines?limit=5")
  if (!response.ok()) {
    console.log("Backend failed:", response.status(), response.statusText())
    console.log("Body:", await response.text())
  }
  expect(response.ok()).toBeTruthy()
  const data = await response.json()
  if (data.items?.length === 0) {
    console.log("Backend returned empty items:", JSON.stringify(data, null, 2))
  }
  expect(data.items).toBeDefined()
  expect(Array.isArray(data.items)).toBeTruthy()
  // Mock data should have at least 1 item
  expect(data.items.length).toBeGreaterThan(0)
  expect(data.items[0].title).toBe("School Lunch Policy Review")
  expect("assetUrl" in data.items[0]).toBeTruthy()
  expect(data.items[0].assetUrl === null || typeof data.items[0].assetUrl === "string").toBeTruthy()
})

test("backend article detail includes assetUrl", async ({ request }) => {
  const response = await request.get("http://127.0.0.1:4500/article/ISSUE-1001")
  expect(response.ok()).toBeTruthy()
  const data = await response.json()
  expect(data.article).toBeDefined()
  expect("assetUrl" in data.article).toBeTruthy()
  expect(data.article.assetUrl === null || typeof data.article.assetUrl === "string").toBeTruthy()
})
