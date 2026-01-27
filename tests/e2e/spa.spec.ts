import { expect, test } from "@playwright/test"

const articleId = "issue-001"
const articleTitle = "気候危機集中審議、越冬エネルギー対策を協議"
const articleDetailSnippet = "冬季の再エネ確保策とピークカット支援の即応計画を取りまとめへ。"

test("home renders hero and search entry", async ({ page }) => {
  page.on("console", (msg) => console.log(`BROWSER LOG: ${msg.text()}`))
  await page.goto("/")
  await expect(page.getByRole("heading", { name: "国会の動きを、わかりやすく" })).toBeVisible()
  await expect(page.getByPlaceholder("議員名、キーワード、議題で検索...")).toBeVisible()
  // Check if data is loaded (verifies backend connection)
  await expect(page.getByRole("heading", { name: articleTitle })).toBeVisible()
})

test("article detail loads from backend api", async ({ page }) => {
  await page.goto(`/article/${articleId}`)
  await expect(page.getByRole("heading", { name: articleTitle })).toBeVisible()
  const summarySection = page.getByRole("heading", { name: "詳細要約" }).locator("..")
  await expect(summarySection).toContainText(articleDetailSnippet)
})
