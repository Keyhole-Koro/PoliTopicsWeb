import { expect, test } from "@playwright/test"

test("home renders hero and search entry", async ({ page }) => {
  page.on("console", (msg) => console.log(`BROWSER LOG: ${msg.text()}`))
  await page.goto("/")
  await expect(page.getByRole("heading", { name: "国会の動きを、わかりやすく" })).toBeVisible()
  await expect(page.getByPlaceholder("議員名、キーワード、議題で検索...")).toBeVisible()
  // Check if mock data is loaded (verifies backend connection)
  await expect(page.getByRole("heading", { name: "School Lunch Policy Review" })).toBeVisible()
})

test("article detail loads from mock api", async ({ page }) => {
  await page.goto("/article/ISSUE-1001")
  await expect(page.getByRole("heading", { name: "School Lunch Policy Review" })).toBeVisible()
  await expect(page.getByText("Reviewed funding and nutrition standards.")).toBeVisible()
})
