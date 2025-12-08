import type { Article, ArticleSummary, SearchFilters } from "@shared/types/article"

export interface ArticleRepository {
  getHeadlines(limit?: number): Promise<ArticleSummary[]>
  searchArticles(filters: SearchFilters): Promise<ArticleSummary[]>
  getArticle(id: string): Promise<Article | undefined>
  getSuggestions(input: string, limit?: number): Promise<string[]>
}
