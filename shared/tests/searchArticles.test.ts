import assert from "node:assert/strict"
import { searchArticles } from "../article-data"

type TestCase = {
  name: string
  run: () => void
}

const cases: TestCase[] = [
  {
    name: "finds articles by keyword across title and keywords",
    run: () => {
      const results = searchArticles({ words: ["量子暗号"] })
      assert.ok(results.length > 0, "expected at least one result for quantum query")
      assert.strictEqual(results[0].id, "issue-011")
    },
  },
  {
    name: "filters strictly by category and keeps newest first by default",
    run: () => {
      const results = searchArticles({ categories: ["環境"] })
      assert.ok(results.length >= 1, "environment category query should return data")
      results.forEach((article) => {
        assert.ok(article.categories.includes("環境"), `article ${article.id} is missing 環境 category`)
      })
      const timestamps = results.map((article) => new Date(article.date).getTime())
      for (let index = 1; index < timestamps.length; index++) {
        assert.ok(
          timestamps[index - 1] >= timestamps[index],
          "default ordering should be descending by date",
        )
      }
    },
  },
  {
    name: "supports combined keyword and category filters",
    run: () => {
      const results = searchArticles({ words: ["給食"], categories: ["教育"] })
      assert.strictEqual(results.length, 1)
      assert.strictEqual(results[0].id, "issue-002")
    },
  },
  {
    name: "respects ascending sort and limit options",
    run: () => {
      const results = searchArticles({ categories: ["環境"], sort: "date_asc", limit: 2 })
      assert.strictEqual(results.length, 2)
      assert.deepStrictEqual(
        results.map((article) => article.id),
        ["issue-014", "issue-012"],
      )
    },
  },
]

let hasFailure = false
for (const testCase of cases) {
  try {
    testCase.run()
    console.log(`✅ ${testCase.name}`)
  } catch (error) {
    hasFailure = true
    console.error(`❌ ${testCase.name}`)
    console.error(error)
  }
}

if (hasFailure) {
  process.exit(1)
}
