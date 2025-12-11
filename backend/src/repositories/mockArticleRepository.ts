import { ArticleRepository } from "./articleRepository"
import { getTopArticles, searchArticles as searchLocalArticles, getArticleById, articles } from "@shared/article-data"
import type { Article, ArticleSummary, SearchFilters } from "@shared/types/article"

export class MockArticleRepository implements ArticleRepository {
  async getHeadlines(limit = 6): Promise<ArticleSummary[]> {
    return getTopArticles(limit)
  }

  async searchArticles(filters: SearchFilters): Promise<ArticleSummary[]> {
    return searchLocalArticles(filters)
  }

  async getArticle(id: string): Promise<Article | undefined> {
    return getArticleById(id)
  }

  async getSuggestions(input: string, limit = 5): Promise<string[]> {
    if (!input.trim()) return []
    const normalized = input.toLowerCase()
    const suggestions = new Set<string>()

    articles.forEach((article) => {
      if (article.title.toLowerCase().includes(normalized)) {
        suggestions.add(article.title)
      }

      article.keywords.forEach((keyword) => {
        if (keyword.keyword.toLowerCase().includes(normalized)) {
          suggestions.add(keyword.keyword)
        }
      })
    })

    return Array.from(suggestions).slice(0, limit)
  }
}
