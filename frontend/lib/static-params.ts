import { articles } from "@shared/article-data"

export function getStaticArticleParams() {
  return articles.map((article) => ({ issueID: article.id }))
}

export function getPopularSearchParams(limit = 12) {
  const keywordSet = new Set<string>()

  articles.forEach((article) => {
    article.keywords.forEach((keyword) => keywordSet.add(keyword))
    keywordSet.add(article.nameOfMeeting)
  })

  return Array.from(keywordSet)
    .slice(0, limit)
    .map((words) => ({ words }))
}
