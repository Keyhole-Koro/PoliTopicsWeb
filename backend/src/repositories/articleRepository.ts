import type { Article, ArticleSummary, SearchFilters } from "@shared/types/article"

export type HeadlinesResult = {
  items: ArticleSummary[]
  hasMore: boolean
}

export interface ArticleRepository {
  getHeadlines(limit?: number, sort?: SearchFilters["sort"], offset?: number): Promise<HeadlinesResult>
  searchArticles(filters: SearchFilters): Promise<ArticleSummary[]>
  getArticle(id: string): Promise<Article | undefined>
  getSuggestions(
    input: string,
    limit?: number,
    filters?: Pick<SearchFilters, "categories" | "houses" | "meetings" | "dateStart" | "dateEnd">,
  ): Promise<string[]>
}
